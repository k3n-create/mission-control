import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/data/store";
import { CategoryPanel } from "./CategoryPanel";
import { IngredientForm } from "./IngredientForm";
import { IngredientTable } from "./IngredientTable";

export function IngredientsView() {
  const categories = useAppStore((s) => s.categories);
  const ingredients = useAppStore((s) => s.ingredients);
  const loadAll = useAppStore((s) => s.loadAll);

  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (categories.length === 0 && ingredients.length === 0) {
      loadAll();
    }
  }, [categories.length, ingredients.length, loadAll]);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filteredIngredients = useMemo(() => {
    if (filter === "all") return ingredients;
    if (filter === "uncategorized") return ingredients.filter((i) => !i.categoryId);
    return ingredients.filter((i) => i.categoryId === filter);
  }, [filter, ingredients]);

  return (
    <div className="grid gap-6 items-start grid-cols-1 md:grid-cols-[280px_1fr]">
      <CategoryPanel />

      <section className="panel mb-0">
        <header className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Ingredient Manager</h1>
            <p className="text-xs text-muted-foreground">
              Source of truth for COGS. Mutations flow through the data adapter.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="cat-filter" className="text-xs font-medium text-muted-foreground">
              Filter:
            </label>
            <select
              id="cat-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm bg-surface-light border border-border rounded-md px-2 py-1.5"
            >
              <option value="all">All categories</option>
              <option value="uncategorized">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              {filteredIngredients.length} of {ingredients.length}
            </span>
          </div>
        </header>

        <IngredientForm categories={categories} />
        <IngredientTable ingredients={filteredIngredients} categoriesById={categoriesById} />
      </section>
    </div>
  );
}
