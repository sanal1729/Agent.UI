
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthStore } from '../states/auth.store';

export const AuthGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const authStore = inject(AuthStore);

  console.log('Auth Guard Triggered');


  const token = authStore.accessToken() ? authStore.accessToken() : ''; //user?.accessToken;
  console.log('Token from Auth Guard :', token);
  if (token) {
    return true;
  } else {
    return router.createUrlTree(['/auth']);
  }
};
