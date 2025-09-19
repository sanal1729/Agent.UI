import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
// import { selectUser } from '../states/auth.selectors';

import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { AuthStore } from '../states/auth.store';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  // const authStore = inject(Store);
  const authStore = inject(AuthStore);

  console.log('Auth Interceptor Triggered');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);

  console.log('Auth Store:', authStore);

  const token = authStore.accessToken() ? authStore.accessToken() : '';

  console.log('Token:', token);
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  return next(req);
};
