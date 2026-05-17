import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/data/store";
import type { MenuItem, RecipeLine } from "@/data/types";
import {
  buildMarginRow,
  calculateRecipeCost,
} from "@/utils/marginMath";
import { RecipeRow } from "./RecipeRow";
import { LiveCostPreview } from "./LiveCostPreview";

interface Props {
  /** null means "new item" mode. */
  item: MenuItem | null;
  onSaved: (id: string) => void;
  onCancel: () => void;
  onDeleted: () => void;
}

const EMPTY: Omit<MenuItem, "id"> = {
  name: "",
  posPrice: 0,
  deliveryPrice: 0,
  recipe: [],
  menuCategoryId: null,
};

export function RecipeBuilder({ item, onSaved, onCancel, onDeleted }: Props) {
  const ingredients = useAppStore((s) => s.ingredients);
  const categories = useAppStore((s) => s.categories);
  const menuCategories = useAppStore((s) => s.menuCategories);
  const settings = useAppStore((s) => s.settings);
  const addMenuItem = useAppStore((s) => s.addMenuItem);
  const editMenuItem = useAppStore((s) => s.editMenuItem);
  const removeMenuItem = useAppStore((s) => s.removeMenuItem);

  const [name, setName] = useState(item?.name ?? "");
  const [posPrice, setPosPrice] = useState<string>(
    item ? String(item.posPrice) : ""
  );
  const [deliveryPrice, setDeliveryPrice] = useState<string>(
    item ? String(item.deliveryPrice) : ""
  );
  const [recipe, setRecipe] = useState<RecipeLine[]>(item?.recipe ?? []);
  const [menuCategoryId, setMenuCategoryId] = useState<string>(
    item?.menuCategoryId ?? ""
  );

  // Reset form when switching items.
  useEffect(() => {
    setName(item?.name ?? "");
    setPosPrice(item ? String(item.posPrice) : "");
    setDeliveryPrice(item ? String(item.deliveryPrice) : "");
    setRecipe(item?.recipe ?? []);
    setMenuCategoryId(item?.menuCategoryId ?? "");
  }, [item?.id]);

  const ingredientsById = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i])),
    [ingredients]
  );

  const cogs = useMemo(
    () => calculateRecipeCost(recipe, ingredientsById),
    [recipe, ingredientsById]
  );

  const live = useMemo(() => {
    const synthetic: MenuItem = {
      id: "__live",
      name,
      posPrice: parseFloat(posPrice) || 0,
      deliveryPrice: parseFloat(deliveryPrice) || 0,
      recipe,
    };
    return buildMarginRow(synthetic, ingredientsById, settings);
  }, [name, posPrice, deliveryPrice, recipe, ingredientsById, settings]);

  function addRow() {
    setRecipe([...recipe, { ingredientId: "", quantity: 1 }]);
  }
  function changeRow(idx: number, patch: Partial<RecipeLine>) {
    setRecipe(recipe.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeRow(idx: number) {
    setRecipe(recipe.filter((_, i) => i !== idx));
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cleanRecipe = recipe.filter((r) => r.ingredientId && r.quantity > 0);
    const payload = {
      name: trimmed,
      posPrice: parseFloat(posPrice) || 0,
      deliveryPrice: parseFloat(deliveryPrice) || 0,
      recipe: cleanRecipe,
      menuCategoryId: menuCategoryId || null,
    };
    if (item) {
      await editMenuItem(item.id, payload);
      onSaved(item.id);
    } else {
      const created = await addMenuItem(payload);
      onSaved(created.id);
    }
  }

  async function del() {
    if (!item) return;
    if (!confirm(`Delete "${item.name}"?`)) return;
    await removeMenuItem(item.id);
    onDeleted();
  }

  const labelCls =
    "block text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2";
  const inputCls =
    "w-full bg-surface border border-border rounded-md px-3 py-2 text-sm";

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_320px] items-start">
      <section className="panel mb-0">
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4">
          <div>
            <label className={labelCls}>Item Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Signature Sandwich"
              className={`${inputCls} text-base p-3`}
            />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={menuCategoryId}
              onChange={(e) => setMenuCategoryId(e.target.value)}
              className={`${inputCls} p-3`}
            >
              <option value="">Uncategorized</option>
              {menuCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-5">
          <div className="text-sm font-medium text-foreground mb-3">
            Pricing Architecture
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Point of Sale (In-Store)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={posPrice}
                  onChange={(e) => setPosPrice(e.target.value)}
                  placeholder="0.00"
                  className={`${inputCls} pl-7`}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Delivery App (Online)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deliveryPrice}
                  onChange={(e) => setDeliveryPrice(e.target.value)}
                  placeholder="0.00"
                  className={`${inputCls} pl-7`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-foreground">
              Bill of Materials (BOM)
            </div>
            <span className="text-xs text-muted-foreground">
              {recipe.length} component{recipe.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="bg-surface border border-border rounded-lg p-3">
            {recipe.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No components yet. Add ingredients below.
              </p>
            ) : (
              recipe.map((line, idx) => (
                <RecipeRow
                  key={idx}
                  index={idx}
                  line={line}
                  ingredients={ingredients}
                  categories={categories}
                  onChange={changeRow}
                  onRemove={removeRow}
                />
              ))
            )}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full mt-2 py-2 text-sm font-medium text-muted-foreground border border-dashed border-border rounded-md hover:bg-surface-light"
          >
            + Add Component
          </button>
        </div>

        <div className="flex gap-3 pt-5 border-t border-border">
          <button
            type="button"
            onClick={save}
            className="btn btn-primary flex-[2]"
          >
            {item ? "Save Changes" : "Deploy to Menu"}
          </button>
          {item ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={del}
                className="btn flex-1 text-danger"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      <LiveCostPreview
        cogs={cogs}
        posPrice={live.posPrice}
        posMargin={live.posMargin}
        posProfit={live.posProfit}
        posStatus={live.posStatus}
        deliveryPrice={live.deliveryPrice}
        deliveryNet={live.deliveryNet}
        deliveryMargin={live.deliveryMargin}
        deliveryProfit={live.deliveryProfit}
        deliveryStatus={live.deliveryStatus}
        commissionRate={settings.commissionRate}
      />
    </div>
  );
}
