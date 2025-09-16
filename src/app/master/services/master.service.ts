import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { GUARD_DATA } from '../dataVault/guard';
import { LINE_DATA } from '../dataVault/line';
import { VILLAGE_DATA } from '../dataVault/village';
import { EMPLOYEE_DATA } from '../dataVault/employee';
import { BANK_DATA } from '../dataVault/bank';
import { SETTER_DATA } from '../dataVault/setter';
import { HATCHER_DATA } from '../dataVault/hatcher';
import { VACCINE_DATA } from '../dataVault/vaccine';
import { BRANCH_DATA } from '../dataVault/branch';
import { RANK_DATA } from '../dataVault/rank';

@Injectable({
  providedIn: 'root'
})
export class MasterService {

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient
  ) {

  }

  //#region Branch Master API
  public bs_BranchList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getBranchList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_BranchList.next(<any>{
        "error": false,
        "result": BRANCH_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'branch/list', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_BranchList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }
  }

  createBranch(data: any): Observable<any> {
    if (env.gui_mode) {
      data.branch_id = BRANCH_DATA.length + 1;
      BRANCH_DATA.push(data);
      return of({
        "error": false,
        "result": [BRANCH_DATA[BRANCH_DATA.length - 1]]
      });
    } else {
      return this.http.post(env.masterUrl + 'branch/create', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }

  }

  updateBranch(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = BRANCH_DATA.findIndex((branch) => branch.branch_id == data.branch_id);
      BRANCH_DATA[index] = data;
      return of({
        "error": false,
        "result": [BRANCH_DATA[index]]
      });
    } else {
      return this.http.put(env.masterUrl + 'branch/update', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }

  deleteBranch(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = BRANCH_DATA.findIndex((branch) => branch.branch_id == data.branch_id);
      BRANCH_DATA.splice(index, 1);
      return of(true);
    } else {
      return this.http.put(env.masterUrl + 'branch/delete', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }
  //#endregion

  //#region Line Master API
  public bs_LineList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getLineList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_LineList.next(<any>{
        "error": false,
        "result": LINE_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'line/list', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_LineList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }
  }

  createLine(data: any): Observable<any> {
    if (env.gui_mode) {
      data.line_id = LINE_DATA.length + 1;
      LINE_DATA.push(data);
      return of({
        "error": false,
        "result": [LINE_DATA[LINE_DATA.length - 1]]
      });
    } else {
      return this.http.post(env.masterUrl + 'line/create', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }

  }

  updateLine(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = LINE_DATA.findIndex((line) => line.line_id == data.line_id);
      LINE_DATA[index] = data;
      return of({
        "error": false,
        "result": [LINE_DATA[index]]
      });
    } else {
      return this.http.put(env.masterUrl + 'line/update', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }

  deleteLine(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = LINE_DATA.findIndex((line) => line.line_id == data.line_id);
      LINE_DATA.splice(index, 1);
      return of(true);
    } else {
      return this.http.put(env.masterUrl + 'line/delete', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }
  //#endregion

  //#region Guard Master API
  public bs_GuardList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getGuardList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_GuardList.next(<any>{
        "error": false,
        "result": GUARD_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'guard/list', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_GuardList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }
  }

  createGuard(data: any): Observable<any> {
    if (env.gui_mode) {
      data.guard_id = GUARD_DATA.length + 1;
      GUARD_DATA.push(data);
      return of({
        "error": false,
        "result": [GUARD_DATA[GUARD_DATA.length - 1]]
      });
    } else {
      return this.http.post(env.masterUrl + 'guard/create', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }

  }

  updateGuard(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = GUARD_DATA.findIndex((guard) => guard.guard_id == data.guard_id);
      GUARD_DATA[index] = data;
      return of({
        "error": false,
        "result": [GUARD_DATA[index]]
      });
    } else {
      return this.http.put(env.masterUrl + 'guard/update', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }

  deleteGuard(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = GUARD_DATA.findIndex((guard) => guard.guard_id == data.guard_id);
      GUARD_DATA.splice(index, 1);
      return of(true);
    } else {
      return this.http.put(env.masterUrl + 'guard/delete', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }
  //#endregion
  
  //#region Employee Master API
  public bs_EmployeeList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getEmployeeList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_EmployeeList.next(<any>{
        "error": false,
        "result": EMPLOYEE_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'employee/list', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_EmployeeList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }
  }

  createEmployee(data: any): Observable<any> {
    if (env.gui_mode) {
      data.emp_id = EMPLOYEE_DATA.length + 1;
      EMPLOYEE_DATA.push(data);
      return of({
        "error": false,
        "result": [EMPLOYEE_DATA[EMPLOYEE_DATA.length - 1]]
      });
    } else {
      return this.http.post(env.masterUrl + 'employee/create', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }

  }

  updateEmployee(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = EMPLOYEE_DATA.findIndex((employee) => employee.emp_id == data.emp_id);
      EMPLOYEE_DATA[index] = data;
      return of({
        "error": false,
        "result": [EMPLOYEE_DATA[index]]
      });
    } else {
      return this.http.put(env.masterUrl + 'employee/update', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }

  deleteEmployee(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = EMPLOYEE_DATA.findIndex((employee) => employee.emp_id == data.emp_id);
      EMPLOYEE_DATA.splice(index, 1);
      return of(true);
    } else {
      return this.http.put(env.masterUrl + 'employee/delete', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }
  //#endregion

  //#region Bank Master API
  public bs_BankList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getBankList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_BankList.next(<any>{
        "error": false,
        "result": BANK_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'bank/list', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_BankList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }
  }

  createBank(data: any): Observable<any> {
    if (env.gui_mode) {
      data.bank_id = BANK_DATA.length + 1;
      BANK_DATA.push(data);
      return of({
        "error": false,
        "result": [BANK_DATA[BANK_DATA.length - 1]]
      });
    } else {
      return this.http.post(env.masterUrl + 'bank/create', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }

  }

  updateBank(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = BANK_DATA.findIndex((bank) => bank.bank_id == data.bank_id);
      BANK_DATA[index] = data;
      return of({
        "error": false,
        "result": [BANK_DATA[index]]
      });
    } else {
      return this.http.put(env.masterUrl + 'bank/update', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }

  deleteBank(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = BANK_DATA.findIndex((bank) => bank.bank_id == data.bank_id);
      BANK_DATA.splice(index, 1);
      return of(true);
    } else {
      return this.http.put(env.masterUrl + 'bank/delete', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }
  //#endregion

  
  //#region Rank Master API
  public bs_RankList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  getRankList(): Observable<any> {
    if (env.gui_mode) {
      this.bs_RankList.next(<any>{
        "error": false,
        "result": RANK_DATA
      });
      return of(true);
    } else {
      return this.http.get(env.masterUrl + 'rank/list', this.httpOptions)
        .pipe(map((resp: any) => {
          this.bs_RankList.next(<any>resp);
          return true;
        }), catchError(err => { return of(err); }));
    }
  }

  createRank(data: any): Observable<any> {
    if (env.gui_mode) {
      data.rank_id = RANK_DATA.length + 1;
      RANK_DATA.push(data);
      return of({
        "error": false,
        "result": [RANK_DATA[RANK_DATA.length - 1]]
      });
    } else {
      return this.http.post(env.masterUrl + 'rank/create', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }

  }

  updateRank(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = RANK_DATA.findIndex((rank) => rank.rank_id == data.rank_id);
      RANK_DATA[index] = data;
      return of({
        "error": false,
        "result": [RANK_DATA[index]]
      });
    } else {
      return this.http.put(env.masterUrl + 'rank/update', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }

  deleteRank(data: any): Observable<any> {
    if (env.gui_mode) {
      let index = RANK_DATA.findIndex((rank) => rank.rank_id == data.rank_id);
      RANK_DATA.splice(index, 1);
      return of(true);
    } else {
      return this.http.put(env.masterUrl + 'rank/delete', data, this.httpOptions)
        .pipe(map(res => {
          return res;
        }), catchError(err => of(err))
        );
    }
  }
  //#endregion

}
