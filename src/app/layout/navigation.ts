export type NavIcon = 'overview' | 'students';

export interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: NavIcon;
  readonly exact: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Overview', path: '/', icon: 'overview', exact: true },
  { label: 'Students', path: '/students', icon: 'students', exact: false },
];
