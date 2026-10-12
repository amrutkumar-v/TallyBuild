import { ClipboardList, Cog, GitCompareArrows, LayoutDashboard, SlidersHorizontal } from 'lucide-react';

import type { NavigationItem } from '../types';

export const NAV_ITEMS: NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'New Estimate', to: '/new-estimate', icon: ClipboardList },
  { label: 'Estimates', to: '/estimates', icon: ClipboardList },
  { label: 'Product Comparison', to: '/comparison', icon: GitCompareArrows },
  { label: 'What-if Analysis', to: '/what-if', icon: SlidersHorizontal },
  { label: 'Settings', to: '/settings', icon: Cog },
];

const EXTRA_PAGE_TITLES: Record<string, string> = {
  '/new-estimate': 'New Estimate',
};

export function getPageTitle(pathname: string): string {
  const item = NAV_ITEMS.find((navItem) => navItem.to === pathname);
  return item?.label ?? EXTRA_PAGE_TITLES[pathname] ?? 'Page not found';
}