// src/app/core/states/auth.store.ts
import { Injectable, computed, signal } from '@angular/core';
import { AuthState, initialAuthState } from './auth.state';
import { AuthResponse } from '../entities/interfaces/auth.response';
import { AuthService } from '../services/auth.service';
import { finalize, take } from 'rxjs';
import { JwtService } from '../../shared/jwt.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private state = signal<AuthState>(initialAuthState);

  constructor(private jwtService: JwtService) {

  }

  readonly user = computed(() => this.state().user);
  readonly accessToken = computed(() => this.state().accessToken);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  setLoading(loading: boolean) {
    this.state.update(s => ({ ...s, loading }));
  }

  setError(error: string | null) {
    this.state.update(s => ({ ...s, error }));
  }

  loginSuccess(auth: AuthResponse) {

    const decoded = this.jwtService.decode(auth.accessToken);

    console.log(decoded);
    this.state.update(s => ({
      ...s,
      user: {
        id: auth.id,
        firstName: auth.firstName,
        lastName: auth.lastName,
        email: auth.email,
        accessToken: auth.accessToken,
      
      },
      accessToken: auth.accessToken,
      isAuthenticated: true,
      error: null,
      loading: false
    }));
  }

  logout() {
    this.state.set(initialAuthState);
  }

  getStateSnapshot(): AuthState {
    return this.state();
  }

refreshSession(authService: AuthService): Promise<boolean> {
  this.setLoading(true);
console.trace('refreshSession called');
  return new Promise<boolean>((resolve) => {
    authService.refresh().pipe(
      finalize(() => this.setLoading(false)),
      take(1)
    ).subscribe({
      next: (res) => {

        
        this.loginSuccess(res);
        resolve(true);
      },
      error: () => {
        this.logout();
        resolve(false);
      }
    });
  });
}


}
