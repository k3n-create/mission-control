import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import type { MarginRow } from "@/utils/marginMath";
import { useAppStore } from "@/data/store";
import { MarginPill } from "./MarginPill";

interface Props {
  row: MarginRow;
  zebra: boolean;
}

const td = "py-2 px-2.5 text-[13px] text-foreground";

export function MarginTableRow({ row, zebra }: Props) {
  const navigate = useNavigate();
  const removeMenuItem = useAppStore((s) => s.removeMenuItem);

  function handleEdit() {
    navigate(`/recipes?id=${encodeURIComponent(row.id)}`);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    await removeMenuItem(row.id);
  }

  return (
    <tr
      className="border-b border-border"
      style={{ background: zebra ? "#f8f9fa" : "#fff" }}
    >
      <td className={`${td} font-medium`}>{row.name}</td>
      <td className={td}>${row.cogs.toFixed(2)}</td>
      <td className={td}>${row.posPrice.toFixed(2)}</td>
      <td className="py-2 px-2.5 text-center">
        <MarginPill
          status={row.posStatus}
          margin={row.posMargin}
          subline={`$${row.posProfit.toFixed(2)} profit`}
        />
      </td>
      <td className={td}>${row.deliveryPrice.toFixed(2)}</td>
      <td className="py-2 px-2.5 text-center">
        <MarginPill
          status={row.deliveryStatus}
          margin={row.deliveryMargin}
          subline={`$${row.deliveryProfit.toFixed(2)} net`}
        />
      </td>
      <td className="py-2 px-2.5">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            title="Edit menu item"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-light hover:border-muted-foreground/40 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Delete menu item"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger hover:text-primary-foreground hover:border-danger transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
