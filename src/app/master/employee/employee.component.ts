import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Inject, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SvgIconComponent } from 'angular-svg-icon';
import Swal from 'sweetalert2';
import { MaterialModule } from '../../material.module';
import { SharedModule } from '../../shared/shared.module';
import { EmployeeList } from '../interface/employee';
import { NgxSpinnerService } from 'ngx-spinner';
import { GlobalService } from '../../shared/services/global.service';
import { MasterService } from '../services/master.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { BranchList } from '../interface/branch';
import { LineList } from '../interface/line';
import { MatSelect } from '@angular/material/select';
import { StateList } from '../interface/state';
import { DistrictList } from '../interface/district';
import { ExcelService } from '../../shared/services/excel.service';
import { DatePipe } from '@angular/common';
import { EmployeeFilter } from '../interface/filter';

@Component({
  selector: 'app-employee',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss',
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
export class EmployeeComponent {
  displayedColumns: string[] = [
    'position',
    'emp_code',
    'emp_name',
    'emp_status',
    'action'
  ];

  dataSource = new MatTableDataSource<EmployeeList>();
  employeeList: EmployeeList[];
  readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  stateList: StateList[];
  districtList: DistrictList[];
  branchList: BranchList[];
  lineList: LineList[];

  filter_box: boolean;
  filter_obj: EmployeeFilter;

  private unsubscribe = new Subject<void>();

  @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (this.filter_box) this.filter_box = false;
    }
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      if (!this.globalService.isDialogOpen(EmployeeDetailsDialog))
        this.openEmployeeDetails();
    }
    if (event.altKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.filter_box = !this.filter_box;
    }
  }

  constructor(
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private masterService: MasterService,
    private excelService: ExcelService,
    public datepipe: DatePipe,
  ) {
    this.employeeList = [];
    this.stateList = [];
    this.districtList = [];
    this.branchList = [];
    this.lineList = [];
    this.filter_box = false;
    this.filter_obj = {
      search: null,
      status: null
    };
  }

  ngOnInit(): void {
    this.spinner.show();

    forkJoin({
      getStateList: this.globalService.getStateList(),
      getDistrictList: this.globalService.getDistrictList(),
      // getBranchList: this.masterService.getBranchList(),
      // getLineList: this.masterService.getLineList(),
      getEmployeeList: this.masterService.getEmployeeList()
    }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
      if (res.getStateList && res.getStateList.error) {
        this.globalService.openSnackBar("Something went wrong with State List", "error", "error", 'right', 'top', 3000);
        this.spinner.hide();
      } else if (res.getDistrictList && res.getDistrictList.error) {
        this.globalService.openSnackBar("Something went wrong with District List", "error", "error", 'right', 'top', 3000);
        this.spinner.hide();
      } else if (res.getBranchList && res.getBranchList.error) {
        this.globalService.popupMsg('error', 'Oops...', 'Something went wrong with Branch List');
        this.spinner.hide();
      } else if (res.getLineList && res.getLineList.error) {
        this.globalService.popupMsg('error', 'Oops...', 'Something went wrong with Line List');
        this.spinner.hide();
      } else {
        if (res.getStateList) this.getStateList();
        if (res.getDistrictList) this.getDistrictList();
        if (res.getBranchList) this.getBranchList();
        if (res.getLineList) this.getLineList();
        if (res.getEmployeeList) this.getEmployeeList();
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
        const statusMatch = filter_data.status.some((status: any) => data.emp_status == status);
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

  getBranchList() {
    // try {
    //   this.masterService.bs_BranchList.pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
    //     this.branchList = res.result;
    //     if (this.branchList.length == 0) this.globalService.openSnackBar("No Branch tagged with this user", "warning", "warning", 'right', 'top', 3000);
    //   });
    // } catch (error) {

    // }
  }

  getLineList() {
    // try {
    //   this.masterService.bs_LineList.pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
    //     this.lineList = res.result;
    //     if (this.lineList.length == 0) this.globalService.openSnackBar("No Line tagged with this user", "warning", "warning", 'right', 'top', 3000);
    //   });
    // } catch (error) {

    // }
  }

  getEmployeeList() {
    try {
      this.masterService.bs_EmployeeList.pipe(takeUntil(this.unsubscribe)).subscribe((resp: any) => {
        if (!resp.error) {
          this.dataSource.data = [];
          let res: any[] = [];
          res = resp.result;
          for (let i = 0; i <= res.length - 1; i++) {

            this.employeeList.push({
              position: i + 1,
              emp_id: res[i].emp_id,
              emp_code: res[i].emp_code,
              emp_name: res[i].emp_name,
              line_ids: res[i].line_ids ? res[i].line_ids.split(',').map(Number) : [],
              line_names: res[i].line_names ? res[i].line_names.split(',') : [],
              branch_ids: res[i].branch_ids ? res[i].branch_ids.split(',').map(Number) : [],
              branch_names: res[i].branch_names ? res[i].branch_names.split(',') : [],
              emp_status: res[i].emp_status,
            });
            if (i == res.length - 1) this.dataSource.data = [...this.employeeList];
          }

          this.spinner.hide();
        }
      });
    } catch (e) {
      console.log(e);
      this.spinner.hide();
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
      status: null
    };
    this.dataSource.filter = JSON.stringify(this.filter_obj);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  //#endregion

  openEmployeeDetails(employee?: EmployeeList) {
    const dialogRef = this.dialog.open(EmployeeDetailsDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '80%',
      width: '80%',
      panelClass: 'full-screen-modal',
      data: {
        employee_data: employee,
        line_list: this.lineList,
        branch_list: this.branchList,
        state_list: this.stateList,
        district_list: this.districtList,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result.emp_id > 0) {
        let index = this.employeeList.findIndex((employee) => employee.emp_id == result.emp_id);
        if (index > -1) {
          this.employeeList[index].branch_ids = result.branch_ids.split(',').map(Number);
          this.employeeList[index].branch_names = result.branch_names.split(',');
          this.employeeList[index].line_ids = result.line_ids.split(',').map(Number);
          this.employeeList[index].line_names = result.line_names.split(',');
          this.employeeList[index].emp_code = result.emp_code;
          this.employeeList[index].emp_name = result.emp_name;
          this.employeeList[index].emp_status = result.emp_status;
        } else {
          this.employeeList.unshift({
            position: this.employeeList.length + 1,
            emp_id: result.emp_id,
            emp_code: result.emp_code,
            emp_name: result.emp_name,
            branch_ids: result.branch_ids.split(',').map(Number),
            branch_names: result.branch_names.split(','),
            line_ids: result.line_ids.split(',').map(Number),
            line_names: result.line_names.split(','),
            emp_status: result.emp_status,
          });
        }
        this.dataSource.data = [...this.employeeList];
      }

      if (result.deleted_id) {
        let index = this.employeeList.findIndex((employee) => employee.emp_id == result.deleted_id);
        if (index > -1) {
          this.employeeList.splice(index, 1);
          this.dataSource.data = [...this.employeeList];
        }
      }

    });
  }

  //#region Excel
  excelLevel = {
    first: [
      { key: 'position', label: '#', width: 5 },
      { key: 'emp_code', label: 'Code', width: 10 },
      { key: 'emp_name', label: 'Name', width: 10 },
      { key: 'emp_status', label: 'Status', width: 10 },
    ],

  };

  downloadExcel() {
    let excel = this.excelService.makeWorkSheet('List');

    excel.worksheet = this.excelService.makeTitle(excel.worksheet, {
      spaces: 1,
      mergeCellAddress: 'B1:E1',
      titleName: 'Employee List',
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
      first.emp_status = first.emp_status == 1 ? 'Active' : 'Inactive';
      excel.worksheet = this.excelService.makeData(
        excel.worksheet,
        { spaces: 0 },
        this.excelLevel.first,
        first
      );


    });
    this.excelService.downoadExcel(excel.workbook, 'Employee List');

  }
  //#endregion
}

@Component({
  selector: 'employee_details',
  templateUrl: 'employee_details.html',
  styleUrl: './employee.component.scss',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDetailsDialog {

  readonly dialog = inject(MatDialog);

  stateList: StateList[];
  filter_StateSearch: string;
  districtList: DistrictList[];
  filter_DistrictSearch: string;
  branchList: BranchList[];
  filter_BranchSearch: string;
  lineList: LineList[];
  filter_LineSearch: string;

  emp_id: number;
  employee_data: EmployeeList;
  
    @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
      if (event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        // if (this.branches_select?.panelOpen) {
        //   if (!this.globalService.isDialogOpen(BranchDetailsDialog))
        //     this.openBranchDetails();
        // }
        // if (this.lines_select?.panelOpen) {
        //   if (!this.globalService.isDialogOpen(LineDetailsDialog))
        //     this.openLineDetails();
        // }
      }
    }

  @ViewChild('branches_select') branches_select !: MatSelect;
  branches = new FormControl<number[] | null>([], [Validators.required]);

  @ViewChild('lines_select') lines_select !: MatSelect;
  lines = new FormControl<number[] | null>([], [Validators.required]);

  @ViewChild('emp_code_input') emp_code_input !: ElementRef;
  emp_code = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('emp_name_input') emp_name_input !: ElementRef;
  emp_name = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('emp_status_select') emp_status_select !: MatSelect;
  emp_status = new FormControl<number | null>(null, [Validators.required]);

  private unsubscribe = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<EmployeeDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private masterService: MasterService,
  ) {

    this.stateList = this.data.state_list ? this.data.state_list : [];
    this.districtList = this.data.district_list ? this.data.district_list : [];
    this.branchList = this.data.branch_list ? this.data.branch_list : [];
    this.lineList = this.data.line_list ? this.data.line_list : [];
    this.filter_StateSearch = '';
    this.filter_DistrictSearch = '';
    this.filter_BranchSearch = '';
    this.filter_LineSearch = '';

    this.emp_id = 0;
    this.employee_data = this.data.employee_data;

  }

  ngOnInit(): void {
    console.log(this.employee_data);
    if (this.employee_data) {
      this.emp_id = this.employee_data.emp_id;
      this.emp_code.patchValue(this.employee_data.emp_code);
      this.emp_name.patchValue(this.employee_data.emp_name);
      this.emp_status.patchValue(this.employee_data.emp_status);
      this.lines.patchValue(this.employee_data.line_ids);
      this.branches.patchValue(this.employee_data.branch_ids);
    }
  }

  ngAfterViewInit() {
    if (this.emp_id == 0) {
      this.emp_status.patchValue(1);
      this.emp_status.disable();
    }
  }

  onClose(resp?: any) {
    this.dialogRef.close(resp);
  }

  checkValidation(cb: any) {

    if (this.branches.status == 'INVALID') {
      this.branches.setErrors({ required: true });
      this.branches_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Branch Required');
      return cb(false);
    }

    if (this.lines.status == 'INVALID') {
      this.lines.setErrors({ required: true });
      this.lines_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Line Required');
      return cb(false);
    }

    if (this.emp_code.status == 'INVALID') {
      this.emp_code.setErrors({ required: true });
      this.emp_code_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Employee Code Required');
      return cb(false);
    }

    if (this.emp_name.status == 'INVALID') {
      this.emp_name.setErrors({ required: true });
      this.emp_name_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Employee Name Required');
      return cb(false);
    }

    if (this.emp_status.status == 'INVALID') {
      this.emp_status.setErrors({ required: true });
      this.emp_status_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Employee Status Required');
      return cb(false);
    }

    return cb(true);
  }

  onSubmit() {
    this.checkValidation((check: boolean) => {
      if (check) {
        let data = {
          branch_ids: this.branches.value?.toString(),
          branch_names: this.branches.value?.map(id => this.branchList.filter(branch => branch.branch_id == id)[0].branch_name).toString(),
          line_ids: this.lines.value?.toString(),
          line_names: this.lines.value?.map(id => this.lineList.filter(line => line.line_id == id)[0].line_name).toString(),
          emp_id: this.emp_id,
          emp_code: this.emp_code.value,
          emp_name: this.emp_name.value,
          emp_status: this.emp_status.value,
        };

        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirm',
          customClass: {
            container: 'approve',
            popup: 'popup-class',
            title: 'sweet_titleImportant',
            closeButton: 'close-button-class',
            icon: 'icon-class',
            image: 'image-class',
            input: 'input-class',
            actions: 'actions-class',
            confirmButton: 'confirm-button-class',
            cancelButton: 'cancel-button-class',
            footer: 'sweet_titleImportant'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            this.spinner.show();
            if (this.emp_id == 0) {
              this.masterService.createEmployee(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Employee created successfully!", "success", "success", 'right', 'top', 3000);
                  this.spinner.hide();
                  res.result[0].branch_names = data.branch_names;
                  res.result[0].line_names = data.line_names;
                  this.onClose(res.result[0]);
                } else {
                  this.globalService.popupMsg('error', 'Oops...', res.error.details);
                  this.spinner.hide();
                }
              });
            } else {
              this.masterService.updateEmployee(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Employee updated successfully!", "success", "success", 'right', 'top', 3000);
                  this.spinner.hide();
                  res.result[0].branch_names = data.branch_names;
                  res.result[0].line_names = data.line_names;
                  this.onClose(res.result[0]);
                } else {
                  this.globalService.popupMsg('error', 'Oops...', res.error.details);
                  this.spinner.hide();
                }
              });
            }
          }
        });

      }
    });
  }

  onDelete() {

    let data = {
          branch_ids: this.branches.value?.toString(),
          branch_names: this.branches.value?.map(id => this.branchList.filter(branch => branch.branch_id == id)[0].branch_name).toString(),
          line_ids: this.lines.value?.toString(),
          line_names: this.lines.value?.map(id => this.lineList.filter(line => line.line_id == id)[0].line_name).toString(),
          emp_id: this.emp_id,
          emp_code: this.emp_code.value,
          emp_name: this.emp_name.value,
          emp_status: this.emp_status.value,
        };

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#E53F33',
      confirmButtonText: 'Confirm',
      customClass: {
        container: 'reject',
        popup: 'popup-class',
        title: 'sweet_titleImportant',
        closeButton: 'close-button-class',
        icon: 'icon-class',
        image: 'image-class',
        input: 'input-class',
        actions: 'actions-class',
        confirmButton: 'confirm-button-class',
        cancelButton: 'cancel-button-class',
        footer: 'sweet_titleImportant'
      }
    }).then((result) => {
      if (result.isConfirmed) {

        this.masterService.deleteEmployee(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (!res.error) {
            this.globalService.openSnackBar("Employee deleted successfully!", "success", "success", 'right', 'top', 3000);
            this.spinner.hide();
            if (res.result) res.deleted_id = this.emp_id;
            this.onClose(res);
          } else {
            this.globalService.popupMsg('error', 'Oops...', res.error.details);
            this.spinner.hide();
          }
        });

      }
    });
  }

  onReset() {
    this.branches.reset();
    this.lines.reset();
    this.emp_code.reset();
    this.emp_name.reset();
    this.emp_status.reset();

    this.emp_id = 0;
    this.emp_status.patchValue(1);
    this.emp_status.disable();
    
  }

  
  
    openBranchDetails(branch?: BranchList) {
      // const dialogRef = this.dialog.open(BranchDetailsDialog, {
      //   maxWidth: '100vw',
      //   maxHeight: '100vh',
      //   height: '80%',
      //   width: '80%',
      //   panelClass: 'full-screen-modal',
      //   data: {
      //     branch_data: branch,
      //     state_list: this.stateList,
      //     district_list: this.districtList,
      //   },
      // });
      // dialogRef.afterClosed().subscribe(result => {
      //   console.log(`Dialog result: ${result}`);
      //   if (result.branch_id > 0) {
      //     this.branchList.push({
      //       position: this.branchList.length + 1,
      //       branch_id: result.branch_id,
      //       state_id: result.state_id,
      //       state_name: result.state_name,
      //       district_id: result.district_id,
      //       district_name: result.district_name,
      //       branch_code: result.branch_code,
      //       branch_name: result.branch_name,
      //       branch_status: result.branch_status,
      //     });
      //   }
      // });
    }
  
    openLineDetails(line?: LineList) {
      // const dialogRef = this.dialog.open(LineDetailsDialog, {
      //   maxWidth: '100vw',
      //   maxHeight: '100vh',
      //   height: '80%',
      //   width: '80%',
      //   panelClass: 'full-screen-modal',
      //   data: {
      //     line_data: line,
      //     branch_list: this.branchList,
      //     state_list: this.stateList,
      //     district_list: this.districtList,
      //   },
      // });
      // dialogRef.afterClosed().subscribe(result => {
      //   console.log(`Dialog result: ${result}`);
      //   if (result.line_id > 0) {
      //     this.lineList.push({
      //       position: this.lineList.length + 1,
      //       line_id: result.line_id,
      //       line_code: result.line_code,
      //       line_name: result.line_name,
      //       state_id: result.state_id,
      //       state_name: result.state_name,
      //       district_id: result.district_id,
      //       district_name: result.district_name,
      //       branch_id: result.branch_id,
      //       branch_code: result.branch_code,
      //       branch_name: result.branch_name,
      //       line_status: result.line_status,
      //     });
      //   }
  
      // });
    }

}