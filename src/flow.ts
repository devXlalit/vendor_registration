// Ordered definition of the registration flow. Used for routing, the
// progress bar, and "next/previous" navigation. Food-like categories
// (restaurant) include the menu/cuisine step; others skip it.

import type { RegistrationData } from './types';
import { categoryById } from './data/catalog';

export interface Step {
  path: string;
  /** Label shown in progress + review. */
  label: string;
  /** Whether this step counts toward the progress bar (phone/otp/success don't). */
  tracked: boolean;
  /** Only include this step for food-like categories. */
  foodOnly?: boolean;
}

export const STEPS: Step[] = [
  { path: '/', label: 'Phone', tracked: false },
  { path: '/verify', label: 'Verify OTP', tracked: false },
  { path: '/account', label: 'Your details', tracked: true },
  { path: '/category', label: 'Category', tracked: true },
  { path: '/business', label: 'Business info', tracked: true },
  { path: '/address', label: 'Address', tracked: true },
  { path: '/menu', label: 'Menu & hours', tracked: true, foodOnly: true },
  { path: '/documents', label: 'Documents', tracked: true },
  { path: '/review', label: 'Review', tracked: true },
  { path: '/success', label: 'Done', tracked: false },
];

/** Steps that apply to the current selection (skips food-only steps for non-food vendors). */
export function activeSteps(data: RegistrationData): Step[] {
  const isFood = categoryById(data.category)?.foodLike ?? true;
  return STEPS.filter((s) => !s.foodOnly || isFood);
}

/** Progress info for a given path: which tracked step we're on and the total. */
export function progressFor(path: string, data: RegistrationData): { current: number; total: number } {
  const steps = activeSteps(data).filter((s) => s.tracked);
  const idx = steps.findIndex((s) => s.path === path);
  return { current: idx + 1, total: steps.length };
}

export function nextPath(current: string, data: RegistrationData): string {
  const steps = activeSteps(data);
  const idx = steps.findIndex((s) => s.path === current);
  return steps[Math.min(idx + 1, steps.length - 1)]?.path ?? '/success';
}

export function prevPath(current: string, data: RegistrationData): string {
  const steps = activeSteps(data);
  const idx = steps.findIndex((s) => s.path === current);
  return steps[Math.max(idx - 1, 0)]?.path ?? '/';
}
