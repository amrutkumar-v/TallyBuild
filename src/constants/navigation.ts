import {
  BarChart3,
  CalendarRange,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  ListTree,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Saved estimates', to: '/estimates', icon: FolderOpen },
  { label: 'New estimate', to: '/estimates/new', icon: FilePlus2 },
];

export interface EstimateTab {
  label: string;
  to: string;
  icon: LucideIcon;
}

/** Tabs shown inside the estimate detail layout (relative routes). */
export const estimateTabs: EstimateTab[] = [
  { label: 'Breakdown', to: 'breakdown', icon: ListTree },
  { label: 'Results', to: 'results', icon: BarChart3 },
  { label: 'Timeline & spending', to: 'timeline', icon: CalendarRange },
  { label: 'What-if', to: 'what-if', icon: SlidersHorizontal },
];

/** Top-bar title fallbacks by route prefix. */
export const routeTitles: Array<{ match: string; title: string }> = [
  { match: '/estimates/new', title: 'New estimate' },
  { match: '/estimates/', title: 'Estimate workspace' },
  { match: '/estimates', title: 'Saved estimates' },
  { match: '/', title: 'Dashboard' },
];

export function titleForPath(pathname: string): string {
  const entry = routeTitles.find((item) => pathname.startsWith(item.match));
  return entry ? entry.title : 'TallyBuild AI';
}
