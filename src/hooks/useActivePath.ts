import { usePathname } from 'next/navigation';

export function useActivePath(href: string) {
  const pathname = usePathname();

  const isExactMatch = pathname === href;
  const isNestedRoute = pathname.startsWith(`${href}/`);
  const isDashboardRoot =
    href === '/Pharmacist/dashboard' && pathname === '/Pharmacist';

  return isExactMatch || isNestedRoute || isDashboardRoot;
}
