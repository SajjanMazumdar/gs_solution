import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Inject, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SvgIconComponent } from 'angular-svg-icon';
import { MaterialModule } from '../../material.module';
import { SharedModule } from '../../shared/shared.module';
import { AttendanceList } from '../interface/attendance';
import { GlobalService } from '../../shared/services/global.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { OperationService } from '../services/operation.service';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { ExcelService } from '../../shared/services/excel.service';
import { DatePipe } from '@angular/common';
import { AttendanceFilter } from '../interface/filter';
import { StateList } from '../../master/interface/state';
import { DistrictList } from '../../master/interface/district';

@Component({
  selector: 'app-attendance',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('list1', [
      state('in', style({
        opacity: 1,
        transform: 'translateX(0)'
      })),
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'translateX(100px)'
        }),
        animate(500)
      ]),
      transition('* => void', [
        animate(700, style({
          transform: 'translateX(100px)',
          opacity: 0
        }))
      ])
    ]),
  ]
})
export class AttendanceComponent {
  displayedColumns: string[] = [
    'position',
    'year_val',
    'month_val',
    'line_name',
    'total_duty',
    'attendance_status',
    'action'
  ];

  dataSource = new MatTableDataSource<AttendanceList>();
  attendanceList: AttendanceList[];
  readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  stateList: StateList[];
  districtList: DistrictList[];

  filter_box: boolean;
  filter_obj: AttendanceFilter;

  private unsubscribe = new Subject<void>();

  @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (this.filter_box) this.filter_box = false;
    }
    if (event.altKey && event.key.toLowerCase() === 'n') {
      // event.preventDefault();
      // if (!this.globalService.isDialogOpen(AttendanceDetailsDialog))
      //   this.openAttendanceDetails();
    }
    if (event.altKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.filter_box = !this.filter_box;
    }
  }

  constructor(
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private operationService: OperationService,
    private excelService: ExcelService,
    public datepipe: DatePipe,
  ) {
    this.attendanceList = [];
    this.stateList = [];
    this.districtList = [];
    this.filter_box = false;
    this.filter_obj = {
      search: null,
      state_id: null,
      district_id: null,
      line_id: null,
      status: null
    };
  }

  ngOnInit(): void {
    this.spinner.show();

    forkJoin({
      getStateList: this.globalService.getStateList(),
      getDistrictList: this.globalService.getDistrictList(),
      getAttendanceList: this.operationService.getAttendanceList(),
    }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
      if (res.getStateList && res.getStateList.error) {
        this.globalService.openSnackBar("Something went wrong with State List", "error", "error", 'right', 'top', 3000);
        this.spinner.hide();
      } else if (res.getDistrictList && res.getDistrictList.error) {
        this.globalService.openSnackBar("Something went wrong with District List", "error", "error", 'right', 'top', 3000);
        this.spinner.hide();
      } else if (res.getAttendanceList && res.getAttendanceList.error) {
        this.globalService.popupMsg('error', 'Oops...', 'Something went wrong with Attendance List');
        this.spinner.hide();
      } else {
        if (res.getStateList) this.getStateList();
        if (res.getDistrictList) this.getDistrictList();
        if (res.getAttendanceList) this.getAttendanceList();
      }
      this.spinner.hide();
    });

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      let filter_data;
      const matchFilter = [];

      try {
        filter_data = JSON.parse(filter);
      } catch (e) {
        return true;
      }

      const globalString = Object.values(data).join(' ').toLowerCase();
      const searchMatch = !filter_data.search || globalString.includes(filter_data.search);
      matchFilter.push(searchMatch);

      if (filter_data.status?.length > 0) {
        const statusMatch = filter_data.status.some((status: any) => data.attendance_status == status);
        matchFilter.push(statusMatch);
      }

      return matchFilter.every(Boolean);
    };

  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator.firstPage();
  }

  ngOnDestroy() {
    this.unsubscribe.next(void 0);
    this.unsubscribe.complete();
  }

  getStateList() {
    try {
      this.globalService.bs_StateList.pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
        this.stateList = res.result;
        if (this.stateList.length == 0) this.globalService.openSnackBar("No State tagged with this user", "warning", "warning", 'right', 'top', 3000);
      });
    } catch (error) {

    }
  }

  getDistrictList() {
    try {
      this.globalService.bs_DistrictList.pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
        this.districtList = res.result;
        if (this.districtList.length == 0) this.globalService.openSnackBar("No District tagged with this user", "warning", "warning", 'right', 'top', 3000);
      });
    } catch (error) {

    }
  }

  getAttendanceList() {
    try {
      this.operationService.bs_AttendanceList.pipe(takeUntil(this.unsubscribe)).subscribe((resp: any) => {
        if (!resp.error) {
          this.dataSource.data = [];
          let res: any[] = [];
          res = resp.result;
          for (let i = 0; i <= res.length - 1; i++) {

            this.attendanceList.push({
              position: i + 1,
              attendance_id: res[i].attendance_id,
              line_id: res[i].line_id,
              line_name: res[i].line_name,
              year_id: res[i].year_id,
              year_val: res[i].year_val,
              leap_year: res[i].leap_year,
              month_id: res[i].month_id,
              month_val: res[i].month_val,
              month_days: res[i].month_days,
              total_duty: res[i].total_duty,
              attendance_status: res[i].attendance_status,
            });
            if (i == res.length - 1) this.dataSource.data = [...this.attendanceList];
          }

          // this.spinner.hide();
        }
      });
    } catch (e) {
      console.log(e);
      // this.spinner.hide();
    }
  }

  //#region Search and Filter

  applySearch(event: Event) {
    this.filter_obj.search = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filter_obj);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilter() {
    this.filter_box = false;
    this.dataSource.filter = JSON.stringify(this.filter_obj);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilter() {
    this.filter_obj = {
      search: null,
      state_id: null,
      district_id: null,
      line_id: null,
      status: null
    };
    this.dataSource.filter = JSON.stringify(this.filter_obj);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  //#endregion

  openAttendanceDetails(attendance?: AttendanceList) {
    // const dialogRef = this.dialog.open(AttendanceDetailsDialog, {
    //   maxWidth: '100vw',
    //   maxHeight: '100vh',
    //   height: '80%',
    //   width: '80%',
    //   panelClass: 'full-screen-modal',
    //   data: {
    //     attendance_data: attendance,
    //     state_list: this.stateList,
    //     district_list: this.districtList,
    //   },
    // });
    // dialogRef.afterClosed().subscribe(result => {
    //   console.log(`Dialog result: ${result}`);
    //   if (result.attendance_id > 0) {
    //     let index = this.attendanceList.findIndex((attendance) => attendance.attendance_id == result.attendance_id);
    //     if (index > -1) {
    //       this.attendanceList[index].state_id = result.state_id;
    //       this.attendanceList[index].state_name = result.state_name;
    //       this.attendanceList[index].district_id = result.district_id;
    //       this.attendanceList[index].district_name = result.district_name;
    //       this.attendanceList[index].attendance_code = result.attendance_code;
    //       this.attendanceList[index].attendance_name = result.attendance_name;
    //       this.attendanceList[index].attendance_status = result.attendance_status;
    //     } else {
    //       this.attendanceList.unshift({
    //         position: this.attendanceList.length + 1,
    //         attendance_id: result.attendance_id,
    //         state_id: result.state_id,
    //         state_name: result.state_name,
    //         district_id: result.district_id,
    //         district_name: result.district_name,
    //         attendance_code: result.attendance_code,
    //         attendance_name: result.attendance_name,
    //         attendance_status: result.attendance_status,
    //       });
    //     }
    //     this.dataSource.data = [...this.attendanceList];
    //   }

    //   if (result.deleted_id) {
    //     let index = this.attendanceList.findIndex((attendance) => attendance.attendance_id == result.deleted_id);
    //     if (index > -1) {
    //       this.attendanceList.splice(index, 1);
    //       this.dataSource.data = [...this.attendanceList];
    //     }
    //   }

    // });
  }

  //#region Excel
  excelLevel = {
    first: [
      { key: 'position', label: '#', width: 5 },
      { key: 'state_name', label: 'State', width: 10 },
      { key: 'district_name', label: 'District', width: 10 },
      { key: 'attendance_code', label: 'Code', width: 10 },
      { key: 'attendance_name', label: 'Name', width: 10 },
      { key: 'attendance_status', label: 'Status', width: 10 },
    ],

  };

  downloadExcel() {
    let excel = this.excelService.makeWorkSheet('List');
      
      excel.worksheet = this.excelService.makeTitle(excel.worksheet, {
        spaces: 1,
        mergeCellAddress: 'B1:E1',
        titleName: 'Attendance List',
        font: { size: 20 },
      startDate: new Date(),
      endDate: new Date(),
      });

      excel.worksheet = this.excelService.makeHeader(
        excel.worksheet,
        this.excelLevel.first,
        {
          spaces: 0,
          colors: { bgColor: '696969', fgColor: '696969', fontColor: 'FFFFFF' }
        }
      );

      let filteredData = this.dataSource.filteredData;
      filteredData = JSON.parse(JSON.stringify(filteredData));

      filteredData.forEach((first: any, index: any) => {
        first.position = index + 1;
        // first.created_at = this.datepipe.transform(new Date('13-06-2025'), 'dd-MM-yyyy');
        first.attendance_status = first.attendance_status == 1 ? 'Active' : 'Inactive';
        excel.worksheet = this.excelService.makeData(
          excel.worksheet,
          { spaces: 0 },
          this.excelLevel.first,
          first
        );


      });
      this.excelService.downoadExcel(excel.workbook, 'Attendance List');
     
  }
  //#endregion

}
