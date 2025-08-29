import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { preventLoginIfAuthenticatedGuard } from './prevent-login-if-authenticated.guard';

describe('preventLoginIfAuthenticatedGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => preventLoginIfAuthenticatedGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
