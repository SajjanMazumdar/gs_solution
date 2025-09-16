import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { menuRedirectGuard } from '../auth/guard/menu-redirect.guard';
import { authGuard } from '../auth/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [menuRedirectGuard],
    children: [
      {
        path: 'branch',        
        loadComponent: () => import('./branch/branch.component').then(m => m.BranchComponent)
      },
      {
        path: 'site',        
        loadComponent: () => import('./line/line.component').then(m => m.LineComponent)
      },
      {
        path: 'rank',        
        loadComponent: () => import('./rank/rank.component').then(m => m.RankComponent)
      },
      {
        path: 'employee',        
        loadComponent: () => import('./employee/employee.component').then(m => m.EmployeeComponent)
      },
      {
        path: 'bank',        
        loadComponent: () => import('./bank/bank.component').then(m => m.BankComponent)
      },
      {
        path: 'guard',        
        loadComponent: () => import('./guard/guard.component').then(m => m.GuardComponent)
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MasterRoutingModule { }
