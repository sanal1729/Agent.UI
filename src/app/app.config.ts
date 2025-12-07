import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AuthInitializerProvider } from './core/states/auth.initializer';

import { provideAnimations } from '@angular/platform-browser/animations'; // ✅ add this



export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([AuthInterceptor]), withFetch()), // <-- Add this line to provide HttpClient
    provideClientHydration(withEventReplay()),
    AuthInitializerProvider // <-- Add this line to provide the AuthInitializer  
]
};
