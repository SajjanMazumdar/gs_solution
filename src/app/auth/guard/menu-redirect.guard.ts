import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MenuItem, menuItems } from '../../menu-items';

export const menuRedirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const url = state.url;
  if (url === '/master' || url === '/master/') {
    return router.parseUrl('/dashboard');
  }
  const matchedItem = findMenuItemByRoute(menuItems, url);
  if (matchedItem && !matchedItem.status) {
    return router.parseUrl('/dashboard');
  }
  return true;
};

function findMenuItemByRoute(items: MenuItem[], url: string): MenuItem | undefined {
  for (const item of items) {
    if (item.route === url) {
      return item;
    }
    if (item.subItems) {
      const found = findMenuItemByRoute(item.subItems, url);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}