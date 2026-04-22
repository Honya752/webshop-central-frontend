import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { MainLayout } from './layouts/main-layout/main-layout';
import { DashboardPage } from './pages/dashboard-page/dashboard-page';
import { RegisterPage } from './pages/register-page/register-page';
import { ProductsPage } from './pages/products-page/products-page';
import { CreateProductPage } from './pages/create-product-page/create-product-page';
import { OrdersPage } from './pages/orders-page/orders-page';
import { OrderDetailPage } from './pages/order-detail-page/order-detail-page';
import { StoresPage } from './pages/stores-page/stores-page';
import { UsersPage } from './pages/users-page/users-page';
import { CreateUserPage } from './pages/create-user-page/create-user-page';

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
            { path: 'dashboard', component: DashboardPage },

            { path: 'products', component: ProductsPage },
            { path: 'product/create', component: CreateProductPage },
            { path: 'product/:id', component: ProductsPage },
            { path: 'product/:id/edit', component: CreateProductPage },

            { path: 'orders', component: OrdersPage },
            { path: 'order/:id', component: OrderDetailPage },

            { path: 'stores', component: StoresPage },

            { path: 'users', component: UsersPage },
            { path: 'user/create', component: CreateUserPage },
            { path: 'user/:id', component: CreateUserPage }
        ]
    },

    {
        path: '**',
        redirectTo: 'login',
    },
];
