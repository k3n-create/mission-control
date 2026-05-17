import type { Category, Ingredient, RecipeLine } from "@/data/types";

interface Props {
  line: RecipeLine;
  index: number;
  ingredients: Ingredient[];
  categories: Category[];
  onChange: (index: number, patch: Partial<RecipeLine>) => void;
  onRemove: (index: number) => void;
}

export function RecipeRow({
  line,
  index,
  ingredients,
  categories,
  onChange,
  onRemove,
}: Props) {
  // Group ingredients by category for the select.
  const byCat = new Map<string | null, Ingredient[]>();
  for (const ing of ingredients) {
    const k = ing.categoryId ?? null;
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k)!.push(ing);
  }

  return (
    <div className="flex gap-3 items-center bg-surface-light border border-dashed border-border rounded-md p-3 mb-2">
      <select
        value={line.ingredientId}
        onChange={(e) => onChange(index, { ingredientId: e.target.value })}
        className="flex-[2] bg-surface border border-border rounded-md px-3 py-2 text-sm"
      >
        <option value="">— Select ingredient —</option>
        {categories.map((c) => {
          const list = byCat.get(c.id) ?? [];
          if (list.length === 0) return null;
          return (
            <optgroup key={c.id} label={c.name}>
              {list.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (${ing.unitCost.toFixed(2)}/{ing.unit})
                </option>
              ))}
            </optgroup>
          );
        })}
        {(byCat.get(null)?.length ?? 0) > 0 && (
          <optgroup label="Uncategorized">
            {byCat.get(null)!.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name} (${ing.unitCost.toFixed(2)}/{ing.unit})
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <input
        type="number"
        min="0"
        step="0.1"
        value={line.quantity}
        onChange={(e) =>
          onChange(index, { quantity: parseFloat(e.target.value) || 0 })
        }
        placeholder="Qty"
        className="w-24 bg-surface border border-border rounded-md px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-xs font-semibold text-muted-foreground hover:text-danger"
      >
        Remove
      </button>
    </div>
  );
}
