import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { menuRedirectGuard } from '../auth/guard/menu-redirect.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [menuRedirectGuard],
    children: [
      {
        path: 'attendance',        
        loadComponent: () => import('./attendance/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'attendance/details',        
        loadComponent: () => import('./attendance-details/attendance-details.component').then(m => m.AttendanceDetailsComponent)
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperationRoutingModule { }
