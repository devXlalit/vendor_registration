import type { CategoryId } from '../types';

export interface Category {
  id: CategoryId;
  label: string;
  desc: string;
  emoji: string;
  /** Categories that collect restaurant-style profile (menu/cuisine/fssai). */
  foodLike: boolean;
}

export const CATEGORIES: Category[] = [
  { id: 'restaurant', label: 'Restaurant', desc: 'Food, cloud kitchen & dining', emoji: '🍽️', foodLike: true },
  { id: 'grocery', label: 'Grocery', desc: 'Daily needs & kirana store', emoji: '🛒', foodLike: false },
  { id: 'fruits_vegetables', label: 'Fruits & Vegetables', desc: 'Fresh produce vendor', emoji: '🥬', foodLike: false },
];

export const CUISINES = [
  'North Indian',
  'South Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'Desserts',
  'Beverages',
  'Bakery',
  'Continental',
  'Fast Food',
];

// A short list to keep the city picker friendly; free text is also allowed.
export const CITIES = [
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Gurugram',
  'Noida',
  'Chandigarh',
];

export const DAYS = [
  { i: 1, label: 'M' },
  { i: 2, label: 'T' },
  { i: 3, label: 'W' },
  { i: 4, label: 'T' },
  { i: 5, label: 'F' },
  { i: 6, label: 'S' },
  { i: 0, label: 'S' },
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function categoryById(id: CategoryId | null): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
