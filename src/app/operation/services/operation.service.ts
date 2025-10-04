import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { ATTENDANCE_DATA } from '../dataVault/attendance';

@Injectable({
  providedIn: 'root'
})
export class OperationService {
httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient
  ) {

  }

  //#region Attendance API
  public bs_AttendanceList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getAttendanceList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_AttendanceList.next(<any>{
        "error": false,
        "result": ATTENDANCE_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'attendance/list', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_AttendanceList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }
  }

  createAttendance(data: any): Observable<any> {
    if (env.gui_mode) {
      data.attendance_id = ATTENDANCE_DATA.length + 1;
      ATTENDANCE_DATA.push(data);
      return of({
        "error": false,
        "result": [ATTENDANCE_DATA[ATTENDANCE_DATA.length - 1]]
      });
    } else {
      return this.http.post(env.masterUrl + 'attendance/create', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }

  }

  updateAttendance(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = ATTENDANCE_DATA.findIndex((attendance) => attendance.attendance_id == data.attendance_id);
      ATTENDANCE_DATA[index] = data;
      return of({
        "error": false,
        "result": [ATTENDANCE_DATA[index]]
      });
    } else {
      return this.http.put(env.masterUrl + 'attendance/update', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }

  deleteAttendance(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = ATTENDANCE_DATA.findIndex((attendance) => attendance.attendance_id == data.attendance_id);
      ATTENDANCE_DATA.splice(index, 1);
      return of(true);
    } else {
      return this.http.put(env.masterUrl + 'attendance/delete', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }
  //#endregion

}
