import { ClipboardList, LayoutDashboard, Scale, SlidersHorizontal } from 'lucide-react';

import type { NavigationItem } from '../types';

export const NAV_ITEMS: NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Estimates', to: '/estimates', icon: ClipboardList },
  { label: 'Product Comparison', to: '/comparison', icon: Scale },
  { label: 'What-if Analysis', to: '/what-if', icon: SlidersHorizontal },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/estimates': 'Estimates',
  '/comparison': 'Product Comparison',
  '/what-if': 'What-if Analysis',
  '/new-estimate': 'New Estimate',
};

export function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Page not found';
}
