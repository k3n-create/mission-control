import { useState } from "react";
import { useAppStore } from "@/data/store";
import type { Category, Ingredient } from "@/data/types";

interface Props {
  ingredients: Ingredient[];
  categoriesById: Map<string, Category>;
}

export function IngredientTable({ ingredients, categoriesById }: Props) {
  const editIngredient = useAppStore((s) => s.editIngredient);
  const removeIngredient = useAppStore((s) => s.removeIngredient);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; unitCost: string; unit: string; categoryId: string }>({
    name: "",
    unitCost: "",
    unit: "",
    categoryId: "",
  });

  function startEdit(ing: Ingredient) {
    setEditingId(ing.id);
    setDraft({
      name: ing.name,
      unitCost: String(ing.unitCost),
      unit: ing.unit,
      categoryId: ing.categoryId ?? "",
    });
  }

  async function commit(id: string) {
    const cost = parseFloat(draft.unitCost);
    if (!draft.name.trim() || Number.isNaN(cost)) {
      setEditingId(null);
      return;
    }
    await editIngredient(id, {
      name: draft.name.trim(),
      unitCost: cost,
      unit: draft.unit.trim() || "each",
      categoryId: draft.categoryId || null,
    });
    setEditingId(null);
  }

  if (ingredients.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-md p-8 text-center text-sm text-muted-foreground">
        No ingredients yet — add one above to get started.
      </div>
    );
  }

  const th = "text-left py-2 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border bg-surface-light sticky top-0";
  const td = "py-2 px-2.5 text-[13px] text-foreground";

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Ingredient</th>
              <th className={th}>Category</th>
              <th className={th}>Unit</th>
              <th className={th}>Unit Cost</th>
              <th className={`${th} text-right pr-3`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing, i) => {
              const isEditing = editingId === ing.id;
              const cat = ing.categoryId ? categoriesById.get(ing.categoryId) : null;
              return (
                <tr
                  key={ing.id}
                  className="border-b border-border"
                  style={{ background: i % 2 === 0 ? "#fff" : "#f8f9fa" }}
                >
                  <td className={`${td} font-medium`}>
                    {isEditing ? (
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className="bg-surface border border-border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      ing.name
                    )}
                  </td>
                  <td className={td}>
                    {isEditing ? (
                      <select
                        value={draft.categoryId}
                        onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                        className="bg-surface border border-border rounded px-2 py-1 text-sm"
                      >
                        <option value="">Uncategorized</option>
                        {[...categoriesById.values()].map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {cat?.name ?? "Uncategorized"}
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    {isEditing ? (
                      <input
                        value={draft.unit}
                        onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                        className="bg-surface border border-border rounded px-2 py-1 text-sm w-20"
                      />
                    ) : (
                      ing.unit
                    )}
                  </td>
                  <td className={`${td} font-mono`}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.unitCost}
                        onChange={(e) => setDraft({ ...draft, unitCost: e.target.value })}
                        className="bg-surface border border-border rounded px-2 py-1 text-sm w-24"
                      />
                    ) : (
                      `$${ing.unitCost.toFixed(2)}`
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-right whitespace-nowrap">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => commit(ing.id)}
                          className="bg-surface border border-border px-2 py-0.5 text-xs text-foreground mr-1 cursor-pointer rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-surface border border-border px-2 py-0.5 text-xs cursor-pointer rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(ing)}
                          className="bg-surface border border-border px-2 py-0.5 text-xs text-foreground mr-1 cursor-pointer rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${ing.name}"?`)) removeIngredient(ing.id);
                          }}
                          className="bg-surface border border-border px-2 py-0.5 text-xs cursor-pointer rounded"
                          style={{ color: "#dc3545" }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
