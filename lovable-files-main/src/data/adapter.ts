// Data adapter contract.
// Phase 1: localAdapter (in-memory + localStorage seed).
// Phase 5: supabaseAdapter — same surface, swapped at the boundary in store.ts.

import type {
  Category,
  Ingredient,
  MenuCategory,
  MenuItem,
  Recommendation,
  Settings,
} from "./types";

export interface DataAdapter {
  // Categories
  listCategories(): Promise<Category[]>;
  createCategory(input: Omit<Category, "id">): Promise<Category>;
  updateCategory(id: string, patch: Partial<Omit<Category, "id">>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Ingredients
  listIngredients(): Promise<Ingredient[]>;
  createIngredient(input: Omit<Ingredient, "id">): Promise<Ingredient>;
  updateIngredient(id: string, patch: Partial<Omit<Ingredient, "id">>): Promise<Ingredient>;
  deleteIngredient(id: string): Promise<void>;

  // Menu items
  listMenuItems(): Promise<MenuItem[]>;
  createMenuItem(input: Omit<MenuItem, "id">): Promise<MenuItem>;
  updateMenuItem(id: string, patch: Partial<Omit<MenuItem, "id">>): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<void>;

  // Menu categories
  listMenuCategories(): Promise<MenuCategory[]>;
  createMenuCategory(input: Omit<MenuCategory, "id">): Promise<MenuCategory>;
  updateMenuCategory(id: string, patch: Partial<Omit<MenuCategory, "id">>): Promise<MenuCategory>;
  deleteMenuCategory(id: string): Promise<void>;

  // Recs / settings
  listRecommendations(): Promise<Recommendation[]>;
  updateRecommendationStatus(
    id: string,
    status: Recommendation["status"]
  ): Promise<void>;
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
}
