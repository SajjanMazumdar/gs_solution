import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import Swal from 'sweetalert2';
import { environment as env } from '../../../environments/environment';
import { DISTRICT_DATA } from '../../master/dataVault/district';
import { STATE_DATA } from '../../master/dataVault/state';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  readonly dialog = inject(MatDialog);

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  collapsed = signal(true);
  isManualToggle = signal(false);

  public fullScreen_Active: boolean = false;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    
  }

  cur_url = {
    setData: (url: any) => {
      localStorage.setItem('cur_url', url);
    },
    getData: () => {
      let cur_url = '/';
      if (localStorage.getItem('cur_url')) cur_url = localStorage.getItem('cur_url') || '{}';
      return cur_url;
    },
    clearData: () => {
      localStorage.removeItem('cur_url');
    },
    goTo: (url: any) => {
      this.router.navigate([url], { skipLocationChange: false });
    }
  }

  isLogin = {
    setData: (obj: any) => {
      localStorage.setItem('isLogin', JSON.stringify(obj));
    },
    getData: () => {
      let isLogin = false;
      if (localStorage.getItem('isLogin')) isLogin = JSON.parse(localStorage.getItem('isLogin') || '{}');
      return isLogin == false ? false : true;
    },
    clearData: () => {
      localStorage.removeItem('isLogin');
    }
  }

  currentUser = {
    userId: () =>{
      let currentUser: any;
      if (localStorage.getItem('currentUser')) currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser.user.emp_id;
    },
    setData: (obj: any) => {
      localStorage.setItem('currentUser', JSON.stringify(obj));
    },
    getData: () => {
      let currentUser: any;
      if (localStorage.getItem('currentUser')) currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser;
    },
    isLogin: () => {
      let currentUser: boolean = false;
      if (localStorage.getItem('currentUser')) currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser == false ? false : true;
    },
    clearData: () => {
      localStorage.removeItem('currentUser');
    }
  }

  formatDateOnly(date: any): string {
    return date ? formatDate(date, 'yyyy-MM-dd', 'en-US') : '';
  }

  popupMsg(icon?: any, title?: any, text?: any, err_code?: any) {
    Swal.fire({
      icon: icon,
      title: title,
      text: text,
    }).then(() => {
      if (text == "Unauthorized") {
      }
      if (err_code == 1050) {

      }
    });
  }

  openSnackBar(dataMessage: string, dataIcon: string, dataClass: string, posHorizon: any, posVertical: any, duration: number) {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: dataMessage,
        icon: dataIcon,
        class: dataClass
      },
      horizontalPosition: posHorizon,
      verticalPosition: posVertical,
      duration: duration,
    });
  }

  isDialogOpen(componentType: any): boolean {
    return this.dialog.openDialogs.some(
      (dialogRef: { componentInstance: any; }) => dialogRef.componentInstance instanceof componentType
    );
  }

  public bs_StateList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getStateList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_StateList.next(<any>{
        "error": false,
        "result": STATE_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'area/statelist', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_StateList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }
  };

  public bs_DistrictList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getDistrictList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_DistrictList.next(<any>{
        "error": false,
        "result": DISTRICT_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'area/districtlist', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_DistrictList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }

  };

}
