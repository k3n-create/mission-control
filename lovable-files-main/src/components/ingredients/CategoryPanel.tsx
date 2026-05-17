import { useState, type FormEvent } from "react";
import { useAppStore } from "@/data/store";

export function CategoryPanel() {
  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const renameCategory = useAppStore((s) => s.renameCategory);
  const removeCategory = useAppStore((s) => s.removeCategory);

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await addCategory({ name: trimmed });
    setName("");
  }

  async function commitRename(id: string) {
    const trimmed = editingName.trim();
    if (trimmed) await renameCategory(id, trimmed);
    setEditingId(null);
    setEditingName("");
  }

  return (
    <aside className="bg-surface border border-border rounded-lg p-4 self-start">
      <h2 className="text-sm font-semibold text-foreground mb-3">Categories</h2>

      <div className="max-h-[320px] overflow-y-auto pr-1 mb-3">
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No categories yet. Add one below.
          </p>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 bg-surface-light border border-border rounded-md px-3 py-2 mb-2"
            >
              {editingId === c.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitRename(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(c.id);
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditingName("");
                    }
                  }}
                  className="flex-1 text-sm bg-surface border border-border rounded px-2 py-1"
                />
              ) : (
                <button
                  type="button"
                  className="text-sm text-foreground text-left flex-1 truncate"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditingName(c.name);
                  }}
                >
                  {c.name}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      "Delete this category? Ingredients in it will become Uncategorized."
                    )
                  ) {
                    removeCategory(c.id);
                  }
                }}
                className="text-xs text-muted-foreground hover:text-[color:hsl(var(--danger))]"
                aria-label={`Delete ${c.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label htmlFor="cat-name" className="text-xs font-medium text-muted-foreground">
          Add category
        </label>
        <input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Desserts"
          className="text-sm bg-surface-light border border-border rounded-md px-3 py-2"
        />
        <button type="submit" className="btn btn-primary py-2 text-sm">
          Add Category
        </button>
      </form>
    </aside>
  );
}
