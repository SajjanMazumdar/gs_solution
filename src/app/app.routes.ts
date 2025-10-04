import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { preventLoginIfAuthenticated } from './auth/guard/prevent-login-if-authenticated.guard';

export const routes: Routes = [
    {
        path: '',
        component: LoginComponent,
        canActivate: [preventLoginIfAuthenticated],
        pathMatch: 'full' 
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [preventLoginIfAuthenticated]
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    },
    {
        path: 'master',
        loadChildren: () => import('./master/master.module').then(m => m.MasterModule),
    },
    {
        path: 'operation',
        loadChildren: () => import('./operation/operation.module').then(m => m.OperationModule),
    },
];
