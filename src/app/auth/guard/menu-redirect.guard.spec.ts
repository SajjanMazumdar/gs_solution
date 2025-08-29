import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { menuRedirectGuard } from './menu-redirect.guard';

describe('menuRedirectGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => menuRedirectGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
