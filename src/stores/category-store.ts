import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Category } from '../types';
import { getRepository } from '../data/repository';

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Dad', color: '#3b82f6', sortOrder: 0 },
  { name: 'Mom', color: '#ec4899', sortOrder: 1 },
  { name: 'Kids', color: '#8b5cf6', sortOrder: 2 },
  { name: 'Family', color: '#10b981', sortOrder: 3 },
  { name: 'Travel', color: '#f59e0b', sortOrder: 4 },
  { name: 'School', color: '#ef4444', sortOrder: 5 },
  { name: 'Work', color: '#6366f1', sortOrder: 6 },
  { name: 'Holiday', color: '#14b8a6', sortOrder: 7 },
];

interface CategoryState {
  categories: Category[];
  loaded: boolean;

  loadCategories: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'sortOrder'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loaded: false,

  loadCategories: async () => {
    const repo = getRepository();
    let categories = await repo.getCategories();
    if (categories.length === 0) {
      categories = DEFAULT_CATEGORIES.map((c) => ({ ...c, id: nanoid() }));
      await repo.saveCategories(categories);
    }
    set({ categories, loaded: true });
  },

  addCategory: async (name, color) => {
    const repo = getRepository();
    const { categories } = get();
    const newCat: Category = {
      id: nanoid(),
      name,
      color,
      sortOrder: categories.length,
    };
    const updated = [...categories, newCat];
    await repo.saveCategories(updated);
    set({ categories: updated });
  },

  updateCategory: async (id, updates) => {
    const repo = getRepository();
    const { categories } = get();
    const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    await repo.saveCategories(updated);
    set({ categories: updated });
  },

  deleteCategory: async (id) => {
    const repo = getRepository();
    const { categories } = get();
    const updated = categories.filter((c) => c.id !== id);
    await repo.saveCategories(updated);
    set({ categories: updated });
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c.id === id);
  },
}));
