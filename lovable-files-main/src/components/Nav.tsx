import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/ingredients", label: "Ingredient Manager" },
  { to: "/recipes", label: "Item Builder" },
  { to: "/integrations", label: "Integrations" },
  { to: "/stores", label: "Stores" },
  { to: "/settings", label: "Settings" },
];

export function Nav() {
  return (
    <nav className="flex items-center gap-2 bg-surface px-8 py-3 border-b border-border">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => cn("nav-btn", isActive && "active")}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
