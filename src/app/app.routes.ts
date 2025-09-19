import { Routes } from '@angular/router';
import { Auth } from './pages/auth/auth';
import { Layout } from './pages/layout/layout';
import { Home } from './pages/home/home';
import { Dashboard } from './pages/dashboard/dashboard';
import { Settings } from './pages/settings/settings';
import { AuthGuard } from './core/guards/auth.guard';
import { Org } from './pages/org/org';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },

  { path: 'auth', component: Auth },

  {
    path: 'agent',
    component: Layout,
    canActivate: [AuthGuard], // Assuming AuthGuard is imported from the correct path
    children: [
      { path: 'home', component: Home },
      { path: 'organization', component: Org },
      { path: 'dashboard', component: Dashboard },
      { path: 'settings', component: Settings },
    ]
  },

  { path: '**', redirectTo: '/auth' }
];
