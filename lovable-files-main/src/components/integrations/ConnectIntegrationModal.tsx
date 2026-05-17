import { useEffect, useState } from "react";
import { Loader2, Eye, EyeOff, X } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  apiKey: z.string().trim().min(1, "API key is required").max(512, "API key is too long"),
});

interface Props {
  open: boolean;
  platformLabel: string;
  saving: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => Promise<void> | void;
}

export function ConnectIntegrationModal({ open, platformLabel, saving, onClose, onSave }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setApiKey("");
      setShow(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ apiKey });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setError(null);
    await onSave(parsed.data.apiKey);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-md bg-surface rounded-lg shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Connect {platformLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-muted-foreground mb-1">
              Master API Key
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoFocus
                disabled={saving}
                placeholder={`Paste your ${platformLabel} master API key`}
                className="input pr-10 w-full"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide key" : "Show key"}
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-[12px] text-danger mt-1">{error}</p>}
            <p className="text-[12px] text-muted-foreground mt-2">
              Stored securely on your backend. We&apos;ll immediately discover your locations after saving.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 border border-border rounded text-[13px] text-foreground hover:bg-surface-light disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary !py-1.5 !px-3 !text-[13px] inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
