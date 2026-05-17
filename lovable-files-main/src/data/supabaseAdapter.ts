// Phase 5: Supabase-backed DataAdapter for the external Supabase project.
// Multi-tenant isolation enforced by RLS using auth.uid() = user_id.
import { supabase } from "@/lib/supabase";
import type { DataAdapter } from "./adapter";
import type {
  Category,
  Ingredient,
  MenuCategory,
  MenuItem,
  Recommendation,
  Settings,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

// ---------- row mappers ----------
type CategoryRow = { id: string; name: string; tag: string | null };
const mapCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  tag: r.tag ?? undefined,
});

type IngredientRow = {
  id: string;
  name: string;
  category_id: string | null;
  unit_cost: number | string;
  unit: string;
  is_global: boolean;
};
const mapIngredient = (r: IngredientRow): Ingredient => ({
  id: r.id,
  name: r.name,
  categoryId: r.category_id,
  unitCost: Number(r.unit_cost),
  unit: r.unit,
  isGlobal: r.is_global,
});

type MenuCategoryRow = { id: string; name: string };
const mapMenuCategory = (r: MenuCategoryRow): MenuCategory => ({
  id: r.id,
  name: r.name,
});

type MenuItemRow = {
  id: string;
  name: string;
  pos_price: number | string;
  delivery_price: number | string;
  recipe: Array<{ ingredientId: string; quantity: number }>;
  menu_category_id: string | null;
};
const mapMenuItem = (r: MenuItemRow): MenuItem => ({
  id: r.id,
  name: r.name,
  posPrice: Number(r.pos_price),
  deliveryPrice: Number(r.delivery_price),
  recipe: Array.isArray(r.recipe) ? r.recipe : [],
  menuCategoryId: r.menu_category_id,
});

type RecRow = {
  id: string;
  agent: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  suggested_action: string;
  status: "pending" | "approved" | "dismissed";
  created_at: string;
};
const mapRec = (r: RecRow): Recommendation => ({
  id: r.id,
  agent: "Sprocket",
  severity: r.severity,
  title: r.title,
  body: r.body,
  suggestedAction: r.suggested_action,
  status: r.status,
  createdAt: r.created_at,
});

export const supabaseAdapter: DataAdapter = {
  // ---- Categories ----
  async listCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,tag")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapCategory);
  },
  async createCategory(input) {
    const user_id = await uid();
    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id, name: input.name, tag: input.tag ?? null })
      .select("id,name,tag")
      .single();
    if (error) throw error;
    return mapCategory(data);
  },
  async updateCategory(id, patch) {
    const { data, error } = await supabase
      .from("categories")
      .update({ name: patch.name, tag: patch.tag ?? null })
      .eq("id", id)
      .select("id,name,tag")
      .single();
    if (error) throw error;
    return mapCategory(data);
  },
  async deleteCategory(id) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },

  // ---- Ingredients ----
  async listIngredients() {
    const { data, error } = await supabase
      .from("ingredients")
      .select("id,name,category_id,unit_cost,unit,is_global")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapIngredient);
  },
  async createIngredient(input) {
    const user_id = await uid();
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        user_id,
        name: input.name,
        category_id: input.categoryId,
        unit_cost: input.unitCost,
        unit: input.unit,
        is_global: input.isGlobal ?? false,
      })
      .select("id,name,category_id,unit_cost,unit,is_global")
      .single();
    if (error) throw error;
    return mapIngredient(data);
  },
  async updateIngredient(id, patch) {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.categoryId !== undefined) update.category_id = patch.categoryId;
    if (patch.unitCost !== undefined) update.unit_cost = patch.unitCost;
    if (patch.unit !== undefined) update.unit = patch.unit;
    if (patch.isGlobal !== undefined) update.is_global = patch.isGlobal;
    const { data, error } = await supabase
      .from("ingredients")
      .update(update)
      .eq("id", id)
      .select("id,name,category_id,unit_cost,unit,is_global")
      .single();
    if (error) throw error;
    return mapIngredient(data);
  },
  async deleteIngredient(id) {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (error) throw error;
  },

  // ---- Menu items ----
  async listMenuItems() {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,name,pos_price,delivery_price,recipe,menu_category_id")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapMenuItem);
  },
  async createMenuItem(input) {
    const user_id = await uid();
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        user_id,
        name: input.name,
        pos_price: input.posPrice,
        delivery_price: input.deliveryPrice,
        recipe: input.recipe,
        menu_category_id: input.menuCategoryId ?? null,
      })
      .select("id,name,pos_price,delivery_price,recipe,menu_category_id")
      .single();
    if (error) throw error;
    return mapMenuItem(data);
  },
  async updateMenuItem(id, patch) {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.posPrice !== undefined) update.pos_price = patch.posPrice;
    if (patch.deliveryPrice !== undefined) update.delivery_price = patch.deliveryPrice;
    if (patch.recipe !== undefined) update.recipe = patch.recipe;
    if (patch.menuCategoryId !== undefined) update.menu_category_id = patch.menuCategoryId;
    const { data, error } = await supabase
      .from("menu_items")
      .update(update)
      .eq("id", id)
      .select("id,name,pos_price,delivery_price,recipe,menu_category_id")
      .single();
    if (error) throw error;
    return mapMenuItem(data);
  },
  async deleteMenuItem(id) {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) throw error;
  },

  // ---- Menu categories ----
  async listMenuCategories() {
    const { data, error } = await supabase
      .from("menu_categories")
      .select("id,name")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapMenuCategory);
  },
  async createMenuCategory(input) {
    const user_id = await uid();
    const { data, error } = await supabase
      .from("menu_categories")
      .insert({ user_id, name: input.name })
      .select("id,name")
      .single();
    if (error) throw error;
    return mapMenuCategory(data);
  },
  async updateMenuCategory(id, patch) {
    const { data, error } = await supabase
      .from("menu_categories")
      .update({ name: patch.name })
      .eq("id", id)
      .select("id,name")
      .single();
    if (error) throw error;
    return mapMenuCategory(data);
  },
  async deleteMenuCategory(id) {
    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // ---- Recommendations ----
  async listRecommendations() {
    const { data, error } = await supabase
      .from("recommendations")
      .select("id,agent,severity,title,body,suggested_action,status,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRec);
  },
  async updateRecommendationStatus(id, status) {
    const { error } = await supabase
      .from("recommendations")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  },

  // ---- Settings ----
  async getSettings() {
    const user_id = await uid();
    const { data, error } = await supabase
      .from("settings")
      .select("commission_rate,target_margin,critical_threshold")
      .eq("user_id", user_id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      // create default row
      const { data: created, error: insErr } = await supabase
        .from("settings")
        .insert({ user_id, ...{
          commission_rate: DEFAULT_SETTINGS.commissionRate,
          target_margin: DEFAULT_SETTINGS.targetMargin,
          critical_threshold: DEFAULT_SETTINGS.criticalThreshold,
        } })
        .select("commission_rate,target_margin,critical_threshold")
        .single();
      if (insErr) throw insErr;
      return {
        commissionRate: Number(created.commission_rate),
        targetMargin: Number(created.target_margin),
        criticalThreshold: Number(created.critical_threshold),
      };
    }
    return {
      commissionRate: Number(data.commission_rate),
      targetMargin: Number(data.target_margin),
      criticalThreshold: Number(data.critical_threshold),
    };
  },
  async updateSettings(patch) {
    const user_id = await uid();
    const update: Record<string, unknown> = { user_id, updated_at: new Date().toISOString() };
    if (patch.commissionRate !== undefined) update.commission_rate = patch.commissionRate;
    if (patch.targetMargin !== undefined) update.target_margin = patch.targetMargin;
    if (patch.criticalThreshold !== undefined) update.critical_threshold = patch.criticalThreshold;
    const { data, error } = await supabase
      .from("settings")
      .upsert(update, { onConflict: "user_id" })
      .select("commission_rate,target_margin,critical_threshold")
      .single();
    if (error) throw error;
    return {
      commissionRate: Number(data.commission_rate),
      targetMargin: Number(data.target_margin),
      criticalThreshold: Number(data.critical_threshold),
    };
  },
};
