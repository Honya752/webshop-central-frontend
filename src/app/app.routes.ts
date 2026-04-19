import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { MainLayout } from './layouts/main-layout/main-layout';
import { DashboardPage } from './pages/dashboard-page/dashboard-page';
import { RegisterPage } from './pages/register-page/register-page';

export const routes: Routes = [
    {
        path: '',
        component: AuthLayout,
        children: [
            { path: 'login', component: LoginPage },
            { path: 'register', component: RegisterPage },
        ],
    },

    {
        path: '',
        component: MainLayout,
        canActivate: [],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
            { path: 'dashboard', component: DashboardPage }
        ]
    },

    {
        path: '**',
        redirectTo: 'login',
    },
];
