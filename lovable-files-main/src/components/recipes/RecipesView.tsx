import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "@/data/store";
import { MenuItemList } from "./MenuItemList";
import { RecipeBuilder } from "./RecipeBuilder";
import { SmartImport } from "@/components/dashboard/SmartImport";

export function RecipesView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedItemId = searchParams.get("id");
  const menuItems = useAppStore((s) => s.menuItems);
  const menuCategories = useAppStore((s) => s.menuCategories);
  const ingredients = useAppStore((s) => s.ingredients);
  const categories = useAppStore((s) => s.categories);
  const loadAll = useAppStore((s) => s.loadAll);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (
      menuItems.length === 0 &&
      ingredients.length === 0 &&
      categories.length === 0 &&
      menuCategories.length === 0
    ) {
      loadAll();
    }
  }, [menuItems.length, ingredients.length, categories.length, menuCategories.length, loadAll]);

  // Honor ?id=<menuItemId> from URL (e.g., from dashboard Edit button).
  useEffect(() => {
    if (requestedItemId && menuItems.some((m) => m.id === requestedItemId)) {
      setCreating(false);
      setSelectedId(requestedItemId);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("id");
        return next;
      }, { replace: true });
    }
  }, [requestedItemId, menuItems, setSearchParams]);

  // Default-select the first item when nothing is selected.
  useEffect(() => {
    if (!creating && selectedId === null && menuItems.length > 0 && !requestedItemId) {
      setSelectedId(menuItems[0].id);
    }
  }, [creating, selectedId, menuItems, requestedItemId]);

  const selected = useMemo(
    () => menuItems.find((m) => m.id === selectedId) ?? null,
    [menuItems, selectedId]
  );

  return (
    <div className="grid gap-6 items-start grid-cols-1 lg:grid-cols-[260px_1fr]">
      <MenuItemList
        items={menuItems}
        categories={menuCategories}
        selectedId={creating ? null : selectedId}
        onSelect={(id) => {
          setCreating(false);
          setSelectedId(id);
        }}
        onNew={() => {
          setCreating(true);
          setSelectedId(null);
        }}
      />

      <div>
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Item Builder</h1>
            <p className="text-xs text-muted-foreground">
              {creating
                ? "Compose a new menu item from your ingredient library."
                : "Edit pricing and bill of materials. Live margin updates as you type."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
            }}
            className="btn btn-primary whitespace-nowrap"
          >
            + Add Item
          </button>
        </header>

        {creating || selected ? (
          <RecipeBuilder
            key={creating ? "new" : selected?.id}
            item={creating ? null : selected}
            onSaved={(id) => {
              setCreating(false);
              setSelectedId(id);
            }}
            onCancel={() => {
              setCreating(false);
              if (menuItems.length > 0 && !selectedId) {
                setSelectedId(menuItems[0].id);
              }
            }}
            onDeleted={() => {
              setSelectedId(null);
              setCreating(false);
            }}
          />
        ) : (
          <div className="panel text-sm text-muted-foreground">
            Select a menu item or create a new one to get started.
          </div>
        )}

        <div className="mt-6">
          <SmartImport />
        </div>
      </div>
    </div>
  );
}
