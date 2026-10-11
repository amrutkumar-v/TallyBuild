import { ClipboardList, GitCompareArrows, LayoutDashboard, SlidersHorizontal } from 'lucide-react';

import type { NavigationItem } from '../types';

export const NAV_ITEMS: NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Estimates', to: '/estimates', icon: ClipboardList },
  { label: 'Scenario Comparison', to: '/comparison', icon: GitCompareArrows },
  { label: 'What-if Analysis', to: '/what-if', icon: SlidersHorizontal },
];
