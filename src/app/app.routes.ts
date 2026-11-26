import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: AuthLayout,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'login' },
            { path: 'login', loadComponent: () => import('./pages/login-page/login-page').then(m => m.LoginPage) },
            { path: 'register', loadComponent: () => import('./pages/register-page/register-page').then(m => m.RegisterPage) },
        ],
    },

    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
            { path: 'dashboard', loadComponent: () => import('./pages/dashboard-page/dashboard-page').then(m => m.DashboardPage) },

            { path: 'products', loadComponent: () => import('./pages/products-page/products-page').then(m => m.ProductsPage) },
            { path: 'product/create', loadComponent: () => import('./pages/create-product-page/create-product-page').then(m => m.CreateProductPage) },
            { path: 'product/:id', loadComponent: () => import('./pages/product-detail-page/product-detail-page').then(m => m.ProductDetailPage) },
            { path: 'product/:id/edit', loadComponent: () => import('./pages/create-product-page/create-product-page').then(m => m.CreateProductPage) },

            { path: 'orders', loadComponent: () => import('./pages/orders-page/orders-page').then(m => m.OrdersPage) },
            { path: 'order/:id', loadComponent: () => import('./pages/order-detail-page/order-detail-page').then(m => m.OrderDetailPage) },

            { path: 'stores', loadComponent: () => import('./pages/stores-page/stores-page').then(m => m.StoresPage) },
            { path: 'store/create', loadComponent: () => import('./pages/create-store-page/create-store-page').then(m => m.CreateStorePage) },
            { path: 'store/:id', loadComponent: () => import('./pages/store-detail-page/store-detail-page').then(m => m.StoreDetailPage) },
            { path: 'store/:id/edit', loadComponent: () => import('./pages/create-store-page/create-store-page').then(m => m.CreateStorePage) },

            { path: 'users', loadComponent: () => import('./pages/users-page/users-page').then(m => m.UsersPage) },
            { path: 'user/create', loadComponent: () => import('./pages/create-user-page/create-user-page').then(m => m.CreateUserPage) },
            { path: 'user/:id', loadComponent: () => import('./pages/create-user-page/create-user-page').then(m => m.CreateUserPage) },

            { path: 'wholesalers', loadComponent: () => import('./pages/wholesalers-page/wholesalers-page').then(m => m.WholesalersPage) },
            { path: 'wholesaler/create', loadComponent: () => import('./pages/create-wholesaler-page/create-wholesaler-page').then(m => m.CreateWholesalerPage) },
            { path: 'wholesaler/:id', loadComponent: () => import('./pages/wholesaler-detail-page/wholesaler-detail-page').then(m => m.WholesalerDetailPage) },
            { path: 'wholesaler/:id/edit', loadComponent: () => import('./pages/create-wholesaler-page/create-wholesaler-page').then(m => m.CreateWholesalerPage) },

            { path: 'wholesaler-orders', loadComponent: () => import('./pages/wholesaler-orders-page/wholesaler-orders-page').then(m => m.WholesalerOrdersPage) },
            { path: 'wholesaler-order/:id', loadComponent: () => import('./pages/wholesaler-order-detail-page/wholesaler-order-detail-page').then(m => m.WholesalerOrderDetailPage) },
        ]
    },

    {
        path: '**',
        redirectTo: 'login',
    },
];
