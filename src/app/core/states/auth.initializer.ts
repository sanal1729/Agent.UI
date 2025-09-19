// src/app/core/states/auth.initializer.ts
import { APP_INITIALIZER, inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';

export function initializeAuth(): () => Promise<void> {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  return () => authStore.refreshSession(authService).then(() => {});
}

export const AuthInitializerProvider = {
  provide: APP_INITIALIZER,
  useFactory: initializeAuth,
  multi: true
};
