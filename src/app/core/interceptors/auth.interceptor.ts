import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
// import { selectUser } from '../states/auth.selectors';

import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { AuthStore } from '../states/auth.store';
import { v7 as uuidv7 } from 'uuid';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  // const authStore = inject(Store);
  const authStore = inject(AuthStore);
  const platformId = inject(PLATFORM_ID); 

  console.log('Auth Interceptor Triggered');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);

  console.log('Auth Store:', authStore);

  const token = authStore.accessToken() ? authStore.accessToken() : '';
  const headers: { [name: string]: string | string[] } = {};

  console.log('Token:', token);
    // 1. Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 2. Add Correlation ID header
  // Ensure this runs only on the browser to generate a new ID for each request
  if (isPlatformBrowser(platformId)) {
    // Generate a new Correlation ID for the request
    const correlationId = uuidv7();
    // Use the exact header name specified in your .NET config
    headers['X-Correlation-ID'] = correlationId;

    console.log('Generated Correlation ID:', correlationId);
  }

  // If there are headers to set, clone the request
  if (Object.keys(headers).length > 0) {
    const cloned = req.clone({
      setHeaders: headers
    });
    return next(cloned);
  }

  // Otherwise, return the original request
  return next(req);
};
