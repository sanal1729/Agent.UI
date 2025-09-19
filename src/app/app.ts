import { Component, OnDestroy, OnInit, signal, VERSION } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { User } from './core/entities/classes/user';
// import { Store } from '@ngrx/store';
// import { AuthState } from './core/states/auth.state';
// import { loginSuccess, logout } from './core/states/auth.actions';
import { Subject, takeUntil } from 'rxjs';
import { AuthStore } from './core/states/auth.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Agent.UI');
  public angularVersion: string;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService,
    private authStore: AuthStore

    // private authStore: Store<{ auth: AuthState }>,
  ) {
    this.angularVersion = VERSION.full;
    console.log(`Angular version: ${this.angularVersion}`);

  
  }
  ngOnInit(): void {
    // const authObservable = this.authService.checkAuthStatus();
    // authObservable.pipe(takeUntil(this.destroy$)).subscribe({
    //   next: (res) => {
    //     const user: User = {
    //       id: res.id,
    //       firstName: res.firstName,
    //       lastName: res.lastName,
    //       email: res.email,
    //       accessToken: res.accessToken
    //     };
        
    //     this.authStore.dispatch(loginSuccess({ user }));
    //     localStorage.setItem('authUser', JSON.stringify(user));
    //   },
    //   error: () => {
    //     this.authStore.dispatch(logout());
    //     localStorage.removeItem('authUser');
    //   }
    // });

  }
    ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
