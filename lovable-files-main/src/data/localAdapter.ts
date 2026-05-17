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

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

let categories: Category[] = [];
let ingredients: Ingredient[] = [];
let menuCategories: MenuCategory[] = [];
let menuItems: MenuItem[] = [];
const recommendations: Recommendation[] = [];

let settings: Settings = { ...DEFAULT_SETTINGS };

export const localAdapter: DataAdapter = {
  // ---- Categories ----
  async listCategories() { return [...categories]; },
  async createCategory(input) {
    const cat: Category = { id: uid("cat"), ...input };
    categories = [...categories, cat];
    return cat;
  },
  async updateCategory(id, patch) {
    categories = categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
    const found = categories.find((c) => c.id === id);
    if (!found) throw new Error(`Category ${id} not found`);
    return found;
  },
  async deleteCategory(id) {
    categories = categories.filter((c) => c.id !== id);
    // Orphan ingredients become uncategorized.
    ingredients = ingredients.map((i) =>
      i.categoryId === id ? { ...i, categoryId: null } : i
    );
  },

  // ---- Ingredients ----
  async listIngredients() { return [...ingredients]; },
  async createIngredient(input) {
    const ing: Ingredient = { id: uid("ing"), ...input };
    ingredients = [...ingredients, ing];
    return ing;
  },
  async updateIngredient(id, patch) {
    ingredients = ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i));
    const found = ingredients.find((i) => i.id === id);
    if (!found) throw new Error(`Ingredient ${id} not found`);
    return found;
  },
  async deleteIngredient(id) {
    ingredients = ingredients.filter((i) => i.id !== id);
  },

  // ---- Menu items ----
  async listMenuItems() { return [...menuItems]; },
  async createMenuItem(input) {
    const item: MenuItem = { id: uid("menu"), ...input };
    menuItems = [...menuItems, item];
    return item;
  },
  async updateMenuItem(id, patch) {
    menuItems = menuItems.map((m) => (m.id === id ? { ...m, ...patch } : m));
    const found = menuItems.find((m) => m.id === id);
    if (!found) throw new Error(`Menu item ${id} not found`);
    return found;
  },
  async deleteMenuItem(id) {
    menuItems = menuItems.filter((m) => m.id !== id);
  },

  // ---- Menu categories ----
  async listMenuCategories() { return [...menuCategories]; },
  async createMenuCategory(input) {
    const cat: MenuCategory = { id: uid("mcat"), ...input };
    menuCategories = [...menuCategories, cat];
    return cat;
  },
  async updateMenuCategory(id, patch) {
    menuCategories = menuCategories.map((c) => (c.id === id ? { ...c, ...patch } : c));
    const found = menuCategories.find((c) => c.id === id);
    if (!found) throw new Error(`Menu category ${id} not found`);
    return found;
  },
  async deleteMenuCategory(id) {
    menuCategories = menuCategories.filter((c) => c.id !== id);
    menuItems = menuItems.map((m) =>
      m.menuCategoryId === id ? { ...m, menuCategoryId: null } : m
    );
  },

  // ---- Recs / settings ----
  async listRecommendations() { return recommendations; },
  async updateRecommendationStatus(id, status) {
    const r = recommendations.find((x) => x.id === id);
    if (r) r.status = status;
  },
  async getSettings() { return { ...settings }; },
  async updateSettings(patch) { settings = { ...settings, ...patch }; return { ...settings }; },
};
