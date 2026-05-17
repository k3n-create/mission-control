import { useState, type FormEvent } from "react";
import { useAppStore } from "@/data/store";
import type { Category } from "@/data/types";

interface Props {
  categories: Category[];
}

export function IngredientForm({ categories }: Props) {
  const addIngredient = useAppStore((s) => s.addIngredient);

  const [name, setName] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [unit, setUnit] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const cost = parseFloat(unitCost);
    if (!trimmed || Number.isNaN(cost)) return;
    await addIngredient({
      name: trimmed,
      unitCost: cost,
      unit: unit.trim() || "each",
      categoryId: categoryId || null,
    });
    setName("");
    setUnitCost("");
    setUnit("");
    setCategoryId("");
  }

  const inputCls =
    "bg-surface border border-border rounded-md px-3 py-2 text-sm";

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap gap-2 items-end bg-surface-light border border-border rounded-md p-3 mb-4"
    >
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label className="text-[11px] font-medium text-muted-foreground">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ingredient name"
          className={inputCls}
        />
      </div>
      <div className="flex flex-col gap-1 w-[110px]">
        <label className="text-[11px] font-medium text-muted-foreground">Unit cost</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
          placeholder="0.00"
          className={inputCls}
        />
      </div>
      <div className="flex flex-col gap-1 w-[140px]">
        <label className="text-[11px] font-medium text-muted-foreground">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputCls}
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 w-[90px]">
        <label className="text-[11px] font-medium text-muted-foreground">Unit</label>
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="each"
          className={inputCls}
        />
      </div>
      <button type="submit" className="btn btn-primary py-2 text-sm">
        Add Ingredient
      </button>
    </form>
  );
}
