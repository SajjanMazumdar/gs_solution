import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { GlobalService } from '../../shared/services/global.service';
import { PlatformService } from '../../shared/services/platform.service';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const globalService = inject(GlobalService);
  const platformService = inject(PlatformService);
  const router = inject(Router);

  const isBrowser = platformService.isBrowser();
  const isLoggedIn = isBrowser && globalService.currentUser.isLogin();

  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
