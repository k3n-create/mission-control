import { useMemo, useState } from "react";
import type { MenuCategory, MenuItem } from "@/data/types";
import { useAppStore } from "@/data/store";

interface Props {
  items: MenuItem[];
  categories: MenuCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onNew: () => void;
}

export function MenuItemList({ items, categories, selectedId, onSelect, onNew }: Props) {
  const addMenuCategory = useAppStore((s) => s.addMenuCategory);
  const renameMenuCategory = useAppStore((s) => s.renameMenuCategory);
  const removeMenuCategory = useAppStore((s) => s.removeMenuCategory);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [managing, setManaging] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const c of categories) map.set(c.id, []);
    map.set("__uncat", []);
    for (const m of items) {
      const k = m.menuCategoryId ?? "__uncat";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return map;
  }, [items, categories]);

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  async function handleAddCat() {
    const name = newCatName.trim();
    if (!name) return;
    const created = await addMenuCategory({ name });
    setExpanded((e) => ({ ...e, [created.id]: true }));
    setNewCatName("");
  }

  async function handleRename(c: MenuCategory) {
    const next = prompt("Rename category", c.name);
    if (next && next.trim() && next.trim() !== c.name) {
      await renameMenuCategory(c.id, next.trim());
    }
  }

  async function handleDelete(c: MenuCategory) {
    if (!confirm(`Delete category "${c.name}"? Items will become uncategorized.`)) return;
    await removeMenuCategory(c.id);
  }

  const sections: Array<{ id: string; name: string; cat: MenuCategory | null }> = [
    ...categories.map((c) => ({ id: c.id, name: c.name, cat: c })),
    { id: "__uncat", name: "Uncategorized", cat: null },
  ];

  return (
    <aside className="panel mb-0">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Items</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setManaging((m) => !m)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {managing ? "Done" : "Manage"}
          </button>
          <button
            type="button"
            onClick={onNew}
            className="text-xs font-semibold text-primary hover:text-primary-dark"
          >
            + New
          </button>
        </div>
      </header>

      {managing && (
        <div className="mb-3 flex gap-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name"
            className="flex-1 bg-surface border border-border rounded-md px-2 py-1.5 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCat();
            }}
          />
          <button
            type="button"
            onClick={handleAddCat}
            className="text-xs font-semibold text-primary hover:text-primary-dark px-2"
          >
            Add
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {items.length === 0 && (
          <li className="text-xs text-muted-foreground">No menu items yet.</li>
        )}
        {sections.map((sec) => {
          const list = grouped.get(sec.id) ?? [];
          if (list.length === 0 && sec.id === "__uncat" && !managing) return null;
          const isOpen = expanded[sec.id] ?? false;
          return (
            <li key={sec.id} className="border border-border rounded-md overflow-hidden">
              <div className="flex items-center bg-surface-light">
                <button
                  type="button"
                  onClick={() => toggle(sec.id)}
                  className="flex-1 flex items-center justify-between px-3 py-2 text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {sec.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {list.length} item{list.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>
                {managing && sec.cat && (
                  <div className="flex items-center gap-1 pr-2">
                    <button
                      type="button"
                      onClick={() => handleRename(sec.cat!)}
                      className="text-[11px] text-muted-foreground hover:text-foreground px-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sec.cat!)}
                      className="text-[11px] text-danger hover:opacity-80 px-1"
                    >
                      Del
                    </button>
                  </div>
                )}
              </div>
              {isOpen && (
                <ul className="flex flex-col gap-1 p-2">
                  {list.length === 0 ? (
                    <li className="text-[11px] text-muted-foreground px-2 py-1">
                      No items.
                    </li>
                  ) : (
                    list.map((m) => {
                      const active = m.id === selectedId;
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(m.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "bg-surface text-foreground hover:bg-surface-light"
                            }`}
                          >
                            <div className="truncate">{m.name}</div>
                            <div
                              className={`text-[11px] ${
                                active
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              POS ${m.posPrice.toFixed(2)} · Online ${m.deliveryPrice.toFixed(2)}
                            </div>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
