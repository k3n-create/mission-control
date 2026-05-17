// Shared domain types — used by both the local adapter (Phase 1)
// and the future Supabase/Cloud adapter (Phase 5).

export interface Category {
  id: string;
  name: string;
  /** Optional legacy color tag key (meats, breads, sauces, drinks, toppings, sides, desserts). */
  tag?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  /** Nullable — "Uncategorized" when null. */
  categoryId: string | null;
  unitCost: number;
  unit: string;
  /** When true, this ingredient is a global template available to all tenants (read-only). */
  isGlobal?: boolean;
}

export interface Profile {
  id: string;
  displayName: string | null;
  restaurantName: string | null;
  avatarUrl: string | null;
  featuresEnabled: Record<string, unknown>;
}

export interface RecipeLine {
  ingredientId: string;
  quantity: number;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  posPrice: number;       // in-store price
  deliveryPrice: number;  // online / delivery list price
  recipe: RecipeLine[];
  /** Nullable — "Uncategorized" when null. */
  menuCategoryId?: string | null;
}

export type RecommendationStatus = "pending" | "approved" | "dismissed";

export interface Recommendation {
  id: string;
  agent: "Sprocket";
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  suggestedAction: string;
  createdAt: string; // ISO
  status: RecommendationStatus;
}

export interface Settings {
  /** Delivery platform commission, as a fraction (0.25 = 25%). */
  commissionRate: number;
  /** Target margin %, e.g. 65. */
  targetMargin: number;
  /** Critical threshold %, below this a row is flagged red. */
  criticalThreshold: number;
}

export const DEFAULT_SETTINGS: Settings = {
  commissionRate: 0.25,
  targetMargin: 65,
  criticalThreshold: 20,
};
