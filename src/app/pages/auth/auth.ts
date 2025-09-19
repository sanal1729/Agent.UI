import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthResponse } from '../../core/entities/interfaces/auth.response';
import { AuthService } from '../../core/services/auth.service';
// import { loginSuccess } from '../../core/states/auth.actions';

import { User } from '../../core/entities/classes/user';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AuthStore } from '../../core/states/auth.store';
import { HttpErrorResponse } from '@angular/common/http';
// import { Store } from '@ngrx/store';
// import { AuthState } from '../../core/states/auth.state';
// import { authStore } from '../../core/states/auth.store';
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css'],
})
export class Auth implements OnInit, AfterViewInit, OnDestroy {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  private _activeTab: 'login' | 'register' = 'login';
  private destroy$ = new Subject<void>();
  isLoading: boolean = false; // Flag to prevent multiple API calls

  private authStore = inject(AuthStore);

  @ViewChild('loginPanel', { static: true }) loginPanel!: ElementRef;
  @ViewChild('registerPanel', { static: true }) registerPanel!: ElementRef;
  @ViewChild('registerTabInput', { static: true }) registerTabInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    // private authStore: Store<{ auth: AuthState }>,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  get activeTab(): 'login' | 'register' {
    return this._activeTab;
  }

  set activeTab(value: 'login' | 'register') {
    if (this._activeTab !== value) {
      if (isPlatformBrowser(this.platformId)) {
        const active = document.activeElement as HTMLElement;
        if (
          active &&
          (this.loginPanel.nativeElement.contains(active) ||
            this.registerPanel.nativeElement.contains(active))
        ) {
          active.blur();
        }
      }
      this._activeTab = value;
      this.resetInactiveForm();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('activeTab', value);
      }
      setTimeout(() => {
        const focusId = value === 'login' ? 'login-email' : 'register-firstname';
        const el = document.getElementById(focusId);
        el?.focus();
      }, 500);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.registerForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.add('loaded');
      const storedTab = localStorage.getItem('activeTab') as 'login' | 'register';
      this.activeTab = storedTab || 'login';
    }
  }

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const isInLogin = this.loginPanel?.nativeElement.contains(target);
    const isInRegister = this.registerPanel?.nativeElement.contains(target);
    const isRegisterRadio = this.registerTabInput?.nativeElement === target;
    if (isRegisterRadio && this.activeTab !== 'register') {
      this.activeTab = 'register';
    } else if (isInLogin && this.activeTab !== 'login') {
      this.activeTab = 'login';
    } else if (isInRegister && this.activeTab !== 'register') {
      this.activeTab = 'register';
    }
  }

  handleRadioFocus(tab: 'login' | 'register') {
    if (isPlatformBrowser(this.platformId)) {
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
    }
    if (this.activeTab !== tab) {
      this.activeTab = tab;
    }
  }

  handleSubmit(type: 'Login' | 'Register') {
    // Prevent multiple submissions
    if (this.isLoading) {
      return;
    }

    const form = type === 'Login' ? this.loginForm : this.registerForm;
    if (!form.valid) {
      this.markAllFieldsAsTouched(form);
      this.focusFirstInvalidInput(form);
      return;
    }

    const data = form.value;
    const authObservable =
      type === 'Login' ? this.authService.login(data) : this.authService.register(data);

    // Set loading state to true
    this.isLoading = true;

    //   authObservable.pipe(takeUntil(this.destroy$)).subscribe({
    //     next: (res: AuthResponse) => {
    //       // localStorage.setItem('authToken', res.accessToken);
    //       // localStorage.setItem('firstName', res.firstName);

    //       const user: User = {
    //         id: res.id,
    //         firstName: res.firstName,
    //         lastName: res.lastName,
    //         email: res.email,
    //         accessToken: res.accessToken
    //       };


    //       // this.authStore.dispatch(loginSuccess({ user }));

    //       this.router.navigateByUrl(type === 'Login' ? 'agent/home' : 'auth');
    //       this.activeTab = 'login';
    //       form.reset();

    //          // Reset loading state on success
    //       this.isLoading = false;
    //     },
    //     error: (err) => {
    //       console.error(`${type} failed`, err);

    //  // Reset loading state on success
    //       this.isLoading = false
    //     }
    //   });

    // this.authStore.setLoading(true);

    // authObservable.pipe(
    //   takeUntil(this.destroy$),
    //   finalize(() => this.authStore.setLoading(false))
    // ).subscribe({
    //   next: (res: AuthResponse) => {
    //     this.authStore.loginSuccess(res);

    //     this.router.navigateByUrl(type === 'Login' ? 'agent/home' : 'auth');
    //     this.activeTab = 'login';
    //     form.reset();
    //   },
    //   error: (err) => {
    //     console.error(`${type} failed`, err);
    //     this.authStore.setError(err?.message || 'Unexpected error');
    //   }
    // });

this.authStore.setLoading(true);

authObservable.pipe(
  takeUntil(this.destroy$),
  finalize(() => this.authStore.setLoading(false))
).subscribe({
  next: (res: AuthResponse) => {
    // ✅ 200 OK → success
    this.authStore.loginSuccess(res);

    this.router.navigate([type === 'Login' ? '/agent/home' : '/auth']);
    this.activeTab = 'login';
    form.reset();
  },
  error: (err : HttpErrorResponse) => {
    switch (err?.status) {
      case 400:
        // ❌ Validation error
        this.authStore.setError(err?.error?.title || 'Invalid request');
        break;

      case 401:
        // ❌ Unauthorized → reset form
        form.reset();
        this.authStore.setError(err?.error?.title || 'Invalid credentials');
        break;

      default:
        // ⚠️ Unexpected
        console.error(`${type} failed`, err);
        form.reset();
        this.authStore.setError('Unexpected error occurred');
        break;
    }
  }
});



  }

  private resetInactiveForm() {
    const formToReset = this._activeTab === 'login' ? this.registerForm : this.loginForm;
    formToReset.reset({}, { emitEvent: false });
    formToReset.markAsPristine();
    formToReset.markAsUntouched();
  }

  private markAllFieldsAsTouched(form: FormGroup): void {
    Object.values(form.controls).forEach(control => control.markAsTouched());
  }

  private focusFirstInvalidInput(form: FormGroup): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const invalidControl = document.querySelector<HTMLInputElement>(
          'input.ng-invalid:not(.ng-untouched)'
        );
        if (invalidControl) {
          invalidControl.focus();
        }
      });
    }
  }
}
