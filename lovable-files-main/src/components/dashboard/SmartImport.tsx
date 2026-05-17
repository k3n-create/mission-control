import { useRef, useState } from "react";
import { Sparkles, Upload, Loader2, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/data/store";

interface ParsedItem {
  name: string;
  category: string;
  price: number;
}

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
// Stable, generally available Gemini Flash model on the public REST API.
const GEMINI_MODEL = "gemini-2.5-flash";
const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function extractJson(text: string): unknown {
  // Strip ``` fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  // Try direct parse, then locate first [...] block.
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Could not parse JSON from model response");
  }
}

export function SmartImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ParsedItem[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const menuCategories = useAppStore((s) => s.menuCategories);
  const addMenuCategory = useAppStore((s) => s.addMenuCategory);
  const addMenuItem = useAppStore((s) => s.addMenuItem);
  const loadMenuCategories = useAppStore((s) => s.loadMenuCategories);

  async function handleFile(file: File) {
    if (!GEMINI_KEY) {
      toast.error("Missing VITE_GEMINI_API_KEY", {
        description: "Set the env var and redeploy to enable Smart Import.",
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, etc).");
      return;
    }

    setAnalyzing(true);
    setItems(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const b64 = await fileToBase64(file);
      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "Analyze this menu screenshot and return ONLY a JSON array " +
                  "of items. Each item must have: name (string), category (string), " +
                  "price (number, in dollars without currency symbol). No prose, no " +
                  "code fences — just the JSON array.",
              },
              {
                inline_data: {
                  mime_type: file.type || "image/jpeg",
                  data: b64,
                },
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      });

      const url = `${geminiUrl(GEMINI_MODEL)}?key=${GEMINI_KEY}`;
      // eslint-disable-next-line no-console
      console.log("[Gemini] request URL", `${geminiUrl(GEMINI_MODEL)}?key=***`);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (!res.ok) {
        const body = await res.text();
        // eslint-disable-next-line no-console
        console.error("[Gemini] error", res.status, body);
        let apiMessage = "";
        try {
          apiMessage = JSON.parse(body)?.error?.message ?? "";
        } catch {
          // leave apiMessage empty
        }
        toast.error(`Gemini request failed (${res.status})`, {
          description:
            apiMessage ||
            "Check your API key, model availability, and quota.",
        });
        return;
      }

      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      if (!text.trim()) {
        toast.error("Image unreadable", { description: "Gemini returned no items." });
        return;
      }

      const parsed = extractJson(text);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error("Image unreadable", { description: "No menu items detected." });
        return;
      }

      const cleaned: ParsedItem[] = parsed
        .map((row: unknown) => {
          const r = row as Record<string, unknown>;
          const priceRaw = r.price ?? r.Price;
          const price =
            typeof priceRaw === "number"
              ? priceRaw
              : Number(String(priceRaw ?? "").replace(/[^0-9.]/g, "")) || 0;
          return {
            name: String(r.name ?? r.Name ?? "").trim(),
            category: String(r.category ?? r.Category ?? "").trim() || "Uncategorized",
            price,
          };
        })
        .filter((i) => i.name);

      if (cleaned.length === 0) {
        toast.error("Image unreadable", { description: "No valid items detected." });
        return;
      }
      setItems(cleaned);
      toast.success(`Found ${cleaned.length} item${cleaned.length === 1 ? "" : "s"}`, {
        description: "Review and edit, then Confirm & Save.",
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[SmartImport]", e);
      toast.error("Could not analyze image", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  function updateRow(idx: number, patch: Partial<ParsedItem>) {
    setItems((prev) =>
      prev ? prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)) : prev,
    );
  }
  function removeRow(idx: number) {
    setItems((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));
  }

  async function confirmAndSave() {
    if (!items || items.length === 0) return;
    setSaving(true);
    try {
      // Build a name->id map from existing menu categories.
      const byName = new Map(menuCategories.map((c) => [c.name.toLowerCase(), c.id]));

      // Resolve unique category names, creating any that don't exist yet.
      const uniqueCats = Array.from(
        new Set(items.map((i) => i.category.trim()).filter(Boolean)),
      );
      for (const name of uniqueCats) {
        if (!byName.has(name.toLowerCase())) {
          const created = await addMenuCategory({ name });
          byName.set(name.toLowerCase(), created.id);
        }
      }
      await loadMenuCategories();

      let ok = 0;
      for (const it of items) {
        try {
          await addMenuItem({
            name: it.name,
            posPrice: it.price,
            deliveryPrice: it.price,
            recipe: [],
            menuCategoryId: byName.get(it.category.toLowerCase()) ?? null,
          });
          ok++;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("[SmartImport] insert failed for", it.name, e);
        }
      }

      toast.success(`Imported ${ok} of ${items.length} items`);
      setItems(null);
      setPreviewUrl(null);
    } catch (e) {
      toast.error("Save failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="smart-import-heading"
      className="bg-surface border border-border rounded-lg p-5 shadow-sm"
    >
      <header className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        <h2
          id="smart-import-heading"
          className="text-sm font-bold uppercase tracking-wider text-foreground"
        >
          Smart Import
        </h2>
      </header>
      <p className="text-xs text-muted-foreground mb-4">
        Upload a image/screenshot of your menu. Our AI system will extracts items, categories, and prices for review.
      </p>

      {!items && (
        <div
          onClick={() => !analyzing && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-surface-light ${analyzing ? "opacity-60 pointer-events-none" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {analyzing ? (
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
              Analyzing menu…
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-5 w-5 text-primary" aria-hidden />
              <span>
                <span className="font-medium text-foreground">Click to upload</span> or drag an image
              </span>
              <span className="text-[11px]">PNG, JPG up to ~10MB</span>
            </div>
          )}
        </div>
      )}

      {items && (
        <div className="space-y-3">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Uploaded menu preview"
              className="w-full max-h-32 object-contain rounded border border-border bg-surface-light"
            />
          )}
          <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Review {items.length} item{items.length === 1 ? "" : "s"}
          </div>
          <div className="max-h-72 overflow-y-auto -mx-1 px-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">Name</th>
                  <th className="py-1.5 pr-2 font-medium">Category</th>
                  <th className="py-1.5 pr-2 font-medium">Price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1.5 pr-2">
                      <input
                        value={it.name}
                        onChange={(e) => updateRow(i, { name: e.target.value })}
                        className="w-full bg-transparent border border-transparent rounded px-1.5 py-1 text-foreground hover:border-border focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={it.category}
                        onChange={(e) => updateRow(i, { category: e.target.value })}
                        className="w-full bg-transparent border border-transparent rounded px-1.5 py-1 text-foreground hover:border-border focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        step="0.01"
                        value={it.price}
                        onChange={(e) =>
                          updateRow(i, { price: Number(e.target.value) || 0 })
                        }
                        className="w-20 bg-transparent border border-transparent rounded px-1.5 py-1 text-foreground hover:border-border focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        aria-label="Remove row"
                        className="text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setItems(null);
                setPreviewUrl(null);
              }}
              disabled={saving}
              className="btn btn-secondary !py-2 !px-3 !text-xs inline-flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              type="button"
              onClick={confirmAndSave}
              disabled={saving || items.length === 0}
              className="btn btn-primary !py-2 !px-3 !text-xs inline-flex items-center gap-1"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Confirm & Save
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
