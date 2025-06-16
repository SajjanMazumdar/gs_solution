import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment as env } from '../../../environments/environment';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import Swal from 'sweetalert2';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { STATE_DATA } from '../../master/dataVault/state';
import { DISTRICT_DATA } from '../../master/dataVault/district';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

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

  isLogin: boolean = false;
  collapsed = signal(false);

  public  fullScreen_Active: boolean = false;
  
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {

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
