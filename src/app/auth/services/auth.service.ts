import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import * as md5 from 'md5';
import { menuItems } from '../../menu-items';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient
  ) {

  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || '{}');
  }

  login(user: any): Observable<any> {
    if (env.gui_mode) {
      if (user.user_name != 'admin' || user.password != 'admin') {
        return of({
          "error": true,
          "result": [],
          "details": "Invalid user name or password"
        });
      }
      return of({
        "error": false,
        "result": {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXBfaWQiOjEsImVtcF9uYW1lIjoiU2FqamFuIiwiaWF0IjoxNzUyNTAyNDYwLCJleHAiOjE3NTI1MDYwNjB9.kPbJJDrck-PUNd1L9sWtNyX7AM2ajJXh6WRXqtpZpNU",
          "emp_id": 1,
          "emp_name": user.user_name,
          "menuItems": menuItems
        }
      });
    } else {
      let data = {
        emp_code: user.user_name,
        emp_password: md5.default(user.password)
      }
      return this.http.post(env.loginUrl + 'auth/web', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }

  }
}
