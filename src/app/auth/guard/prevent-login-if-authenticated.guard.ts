import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GlobalService } from '../../shared/services/global.service';
import { PlatformService } from '../../shared/services/platform.service';

export const preventLoginIfAuthenticated: CanActivateFn = () => {
  const globalService = inject(GlobalService);
  const platformService = inject(PlatformService);
  const router = inject(Router);

  if (platformService.isBrowser() && globalService.currentUser.isLogin()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};