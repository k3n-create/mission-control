// Single point of swap: flip this import to switch backends.
import { create } from "zustand";
import type { DataAdapter } from "./adapter";
import { supabaseAdapter } from "./supabaseAdapter";
import { localAdapter } from "./localAdapter";
import { isSupabaseConfigured } from "@/lib/supabase";
import type {
  Category,
  Ingredient,
  MenuCategory,
  MenuItem,
  Recommendation,
  Settings,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import {
  buildMarginRow,
  summarize,
  type DashboardSummary,
  type MarginRow,
} from "@/utils/marginMath";

// In production (Railway) Supabase env vars are set → use the live adapter.
// In the Lovable preview without env vars, fall back to the in-memory adapter
// so the app renders and Visual Edits can target real components.
const adapter: DataAdapter = isSupabaseConfigured ? supabaseAdapter : localAdapter;


interface AppState {
  // raw
  categories: Category[];
  ingredients: Ingredient[];
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  recommendations: Recommendation[];
  settings: Settings;

  // loaders
  loadAll: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadIngredients: () => Promise<void>;
  loadRecommendations: () => Promise<void>;

  // category mutations
  addCategory: (input: Omit<Category, "id">) => Promise<void>;
  renameCategory: (id: string, name: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  // ingredient mutations
  addIngredient: (input: Omit<Ingredient, "id">) => Promise<void>;
  editIngredient: (id: string, patch: Partial<Omit<Ingredient, "id">>) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;

  // menu item mutations
  loadMenuItems: () => Promise<void>;
  addMenuItem: (input: Omit<MenuItem, "id">) => Promise<MenuItem>;
  editMenuItem: (id: string, patch: Partial<Omit<MenuItem, "id">>) => Promise<void>;
  removeMenuItem: (id: string) => Promise<void>;

  // menu category mutations
  loadMenuCategories: () => Promise<void>;
  addMenuCategory: (input: Omit<MenuCategory, "id">) => Promise<MenuCategory>;
  renameMenuCategory: (id: string, name: string) => Promise<void>;
  removeMenuCategory: (id: string) => Promise<void>;

  // recs / settings
  approveRecommendation: (id: string) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;

  // derived selectors
  marginRows: () => MarginRow[];
  dashboardSummary: () => DashboardSummary;
}

export const useAppStore = create<AppState>((set, get) => ({
  categories: [],
  ingredients: [],
  menuItems: [],
  menuCategories: [],
  recommendations: [],
  settings: { ...DEFAULT_SETTINGS },

  async loadAll() {
    const [categories, ingredients, menuItems, menuCategories, recommendations, settings] =
      await Promise.all([
        adapter.listCategories(),
        adapter.listIngredients(),
        adapter.listMenuItems(),
        adapter.listMenuCategories(),
        adapter.listRecommendations(),
        adapter.getSettings(),
      ]);
    set({ categories, ingredients, menuItems, menuCategories, recommendations, settings });
  },
  async loadCategories() {
    set({ categories: await adapter.listCategories() });
  },
  async loadIngredients() {
    set({ ingredients: await adapter.listIngredients() });
  },
  async loadRecommendations() {
    set({ recommendations: [...(await adapter.listRecommendations())] });
  },

  async addCategory(input) {
    await adapter.createCategory(input);
    await get().loadCategories();
  },
  async renameCategory(id, name) {
    await adapter.updateCategory(id, { name });
    await get().loadCategories();
  },
  async removeCategory(id) {
    await adapter.deleteCategory(id);
    await Promise.all([get().loadCategories(), get().loadIngredients()]);
  },

  async addIngredient(input) {
    await adapter.createIngredient(input);
    await get().loadIngredients();
  },
  async editIngredient(id, patch) {
    await adapter.updateIngredient(id, patch);
    await get().loadIngredients();
  },
  async removeIngredient(id) {
    await adapter.deleteIngredient(id);
    await get().loadIngredients();
  },

  async loadMenuItems() {
    set({ menuItems: await adapter.listMenuItems() });
  },
  async addMenuItem(input) {
    const created = await adapter.createMenuItem(input);
    await get().loadMenuItems();
    return created;
  },
  async editMenuItem(id, patch) {
    await adapter.updateMenuItem(id, patch);
    await get().loadMenuItems();
  },
  async removeMenuItem(id) {
    await adapter.deleteMenuItem(id);
    await get().loadMenuItems();
  },

  async loadMenuCategories() {
    set({ menuCategories: await adapter.listMenuCategories() });
  },
  async addMenuCategory(input) {
    const created = await adapter.createMenuCategory(input);
    await get().loadMenuCategories();
    return created;
  },
  async renameMenuCategory(id, name) {
    await adapter.updateMenuCategory(id, { name });
    await get().loadMenuCategories();
  },
  async removeMenuCategory(id) {
    await adapter.deleteMenuCategory(id);
    await Promise.all([get().loadMenuCategories(), get().loadMenuItems()]);
  },

  async approveRecommendation(id) {
    await adapter.updateRecommendationStatus(id, "approved");
    await get().loadRecommendations();
  },
  async dismissRecommendation(id) {
    await adapter.updateRecommendationStatus(id, "dismissed");
    await get().loadRecommendations();
  },
  async updateSettings(patch) {
    set({ settings: await adapter.updateSettings(patch) });
  },

  marginRows() {
    const { ingredients, menuItems, settings } = get();
    const map = new Map(ingredients.map((i) => [i.id, i]));
    return menuItems.map((m) => buildMarginRow(m, map, settings));
  },
  dashboardSummary() {
    return summarize(get().marginRows(), get().settings);
  },
}));
