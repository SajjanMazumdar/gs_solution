import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { GlobalService } from '../../shared/services/global.service';
import { AuthService } from '../services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip interception for auth endpoints
  if (req.url.includes('auth/web')) {
    return next(req);
  }

  const globalService = inject(GlobalService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const spinner = inject(NgxSpinnerService);

  // Add authorization token if available
  const currentUser = authService.getCurrentUser();
  if (currentUser?.token) {
    req = req.clone({
      setHeaders: { Authorization: currentUser.token }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 errors
      if (error.status === 401) {
        globalService.currentUser.clearData() // Clear user data
        router.navigate(['/login']); // Redirect to login
        globalService.popupMsg('error', 'Session Expired', 'Please login again');
        spinner.hide();
      }
      
      // Re-throw the error to be handled by the caller
      return throwError(() => error);
    })
  );
};