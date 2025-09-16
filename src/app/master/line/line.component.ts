import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Inject, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SvgIconComponent } from 'angular-svg-icon';
import Swal from 'sweetalert2';
import { MaterialModule } from '../../material.module';
import { SharedModule } from '../../shared/shared.module';
import { BranchList } from '../interface/branch';
import { DistrictList } from '../interface/district';
import { StateList } from '../interface/state';
import { LineList } from '../interface/line';
import { NgxSpinnerService } from 'ngx-spinner';
import { GlobalService } from '../../shared/services/global.service';
import { MasterService } from '../services/master.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { BranchDetailsDialog } from '../branch/branch.component';
import { ExcelService } from '../../shared/services/excel.service';
import { DatePipe } from '@angular/common';
import { LineFilter } from '../interface/filter';

@Component({
  selector: 'app-line',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule],
  templateUrl: './line.component.html',
  styleUrl: './line.component.scss',
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
export class LineComponent {
  displayedColumns: string[] = [
    'position',
    'line_code',
    'line_name',
    'branch_name',
    'district_name',
    'line_status',
    'action'
  ];

  dataSource = new MatTableDataSource<LineList>();
  lineList: LineList[];
  readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  stateList: StateList[];
  districtList: DistrictList[];
  branchList: BranchList[];

  filter_box: boolean;
  filter_obj: LineFilter;

  private unsubscribe = new Subject<void>();

  @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (this.filter_box) this.filter_box = false;
    }
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      if (!this.globalService.isDialogOpen(LineDetailsDialog))
        this.openLineDetails();
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
    this.lineList = [];
    this.stateList = [];
    this.districtList = [];
    this.branchList = [];
    this.filter_box = false;
    this.filter_obj = {
      search: null,
      status: null,
      branch: null
    };
  }

  ngOnInit(): void {
    this.spinner.show();

    forkJoin({
      getStateList: this.globalService.getStateList(),
      getDistrictList: this.globalService.getDistrictList(),
      getBranchList: this.masterService.getBranchList(),
      getLineList: this.masterService.getLineList()
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
        const statusMatch = filter_data.status.some((status: any) => data.line_status == status);
        matchFilter.push(statusMatch);
      }
      if (filter_data.branch?.length > 0) {
        const branchMatch = filter_data.branch.some((branch: any) => data.branch_id == branch);
        matchFilter.push(branchMatch);
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
    try {
      this.masterService.bs_BranchList.pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
        this.branchList = res.result;
        if (this.branchList.length == 0) this.globalService.openSnackBar("No Branch tagged with this user", "warning", "warning", 'right', 'top', 3000);
      });
    } catch (error) {

    }
  }

  getLineList() {
    try {
      this.masterService.bs_LineList.pipe(takeUntil(this.unsubscribe)).subscribe((resp: any) => {
        if (!resp.error) {
          this.dataSource.data = [];
          let res: any[] = [];
          res = resp.result;
          for (let i = 0; i <= res.length - 1; i++) {

            this.lineList.push({
              position: i + 1,
              line_id: res[i].line_id,
              line_code: res[i].line_code,
              line_name: res[i].line_name,
              state_id: res[i].state_id,
              state_name: res[i].state_name,
              district_id: res[i].district_id,
              district_name: res[i].district_name,
              branch_id: res[i].branch_id,
              branch_code: res[i].branch_code,
              branch_name: res[i].branch_name,
              line_status: res[i].line_status,
            });
            if (i == res.length - 1) this.dataSource.data = [...this.lineList];
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
      search: '',
      status: null,
      branch: null
    };
    this.dataSource.filter = JSON.stringify(this.filter_obj);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  //#endregion

  openLineDetails(line?: LineList) {
    const dialogRef = this.dialog.open(LineDetailsDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '80%',
      width: '80%',
      panelClass: 'full-screen-modal',
      data: {
        line_data: line,
        branch_list: this.branchList,
        state_list: this.stateList,
        district_list: this.districtList,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result.line_id > 0) {
        let index = this.lineList.findIndex((line) => line.line_id == result.line_id);
        if (index > -1) {
          this.lineList[index].state_id = result.state_id;
          this.lineList[index].state_name = result.state_name;
          this.lineList[index].district_id = result.district_id;
          this.lineList[index].district_name = result.district_name;
          this.lineList[index].branch_code = result.branch_code;
          this.lineList[index].branch_name = result.branch_name;
          this.lineList[index].line_code = result.line_code;
          this.lineList[index].line_name = result.line_name;
          this.lineList[index].line_status = result.line_status;
        } else {
          this.lineList.push({
            position: this.lineList.length + 1,
            line_id: result.line_id,
            line_code: result.line_code,
            line_name: result.line_name,
            state_id: result.state_id,
            state_name: result.state_name,
            district_id: result.district_id,
            district_name: result.district_name,
            branch_id: result.branch_id,
            branch_code: result.branch_code,
            branch_name: result.branch_name,
            line_status: result.line_status,
          });
        }
        this.dataSource.data = [...this.lineList];
      }

      if (result.deleted_id) {
        let index = this.lineList.findIndex((line) => line.line_id == result.deleted_id);
        if (index > -1) {
          this.lineList.splice(index, 1);
          this.dataSource.data = [...this.lineList];
        }
      }

    });
  }

  //#region Excel
  excelLevel = {
    first: [
      { key: 'position', label: '#', width: 5 },
      { key: 'state_name', label: 'State', width: 10 },
      { key: 'district_name', label: 'District', width: 10 },
      { key: 'branch_name', label: 'Branch', width: 10 },
      { key: 'line_code', label: 'Code', width: 10 },
      { key: 'line_name', label: 'Name', width: 10 },
      { key: 'line_status', label: 'Status', width: 10 },
    ],

  };

  downloadExcel() {
    let excel = this.excelService.makeWorkSheet('List');

    excel.worksheet = this.excelService.makeTitle(excel.worksheet, {
      spaces: 1,
      mergeCellAddress: 'B1:E1',
      titleName: 'Line List',
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
      first.line_status = first.line_status == 1 ? 'Active' : 'Inactive';
      excel.worksheet = this.excelService.makeData(
        excel.worksheet,
        { spaces: 0 },
        this.excelLevel.first,
        first
      );


    });
    this.excelService.downoadExcel(excel.workbook, 'Line List');

  }
  //#endregion
}

@Component({
  selector: 'line_details',
  templateUrl: 'line_details.html',
  styleUrl: './line.component.scss',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineDetailsDialog {

  readonly dialog = inject(MatDialog);

  stateList: StateList[];
  filter_StateSearch: string;
  districtList: DistrictList[];
  filter_DistrictSearch: string;
  branchList: BranchList[];
  filter_BranchSearch: string;

  line_id: number;
  line_data: LineList;

  @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      if (this.branch_select?.panelOpen) {
        if (!this.globalService.isDialogOpen(BranchDetailsDialog))
          this.openBranchDetails();
      }
    }
  }

  @ViewChild('state_select') state_select !: MatSelect;
  state = new FormControl<number | null>(null, [Validators.required]);

  @ViewChild('district_select') district_select !: MatSelect;
  district = new FormControl<number | null>(null, [Validators.required]);

  @ViewChild('branch_select') branch_select !: MatSelect;
  branch = new FormControl<number | null>(null, [Validators.required]);

  @ViewChild('line_code_input') line_code_input !: ElementRef;
  line_code = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('line_name_input') line_name_input !: ElementRef;
  line_name = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('line_status_select') line_status_select !: MatSelect;
  line_status = new FormControl<number | null>(null, [Validators.required]);

  private unsubscribe = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<LineDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private masterService: MasterService,
  ) {

    this.stateList = this.data.state_list ? this.data.state_list : [];
    this.districtList = this.data.district_list ? this.data.district_list : [];
    this.branchList = this.data.branch_list ? this.data.branch_list : [];
    this.filter_StateSearch = '';
    this.filter_DistrictSearch = '';
    this.filter_BranchSearch = '';

    this.line_id = 0;
    // this.line_code = '';
    // this.line_name = '';
    // this.line_status = 1;
    // this.branch_id = 0;
    // this.state_id = 0;
    // this.district_id = 0;

    this.line_data = this.data.line_data;

  }

  ngOnInit(): void {
    console.log(this.line_data);
    if (this.line_data) {
      this.line_id = this.line_data.line_id;
      this.line_code.patchValue(this.line_data.line_code);
      this.line_name.patchValue(this.line_data.line_name);
      this.line_status.patchValue(this.line_data.line_status);
      this.branch.patchValue(this.line_data.branch_id);
      this.state.patchValue(this.line_data.state_id);
      this.district.patchValue(this.line_data.district_id);
    }
    // this.district.valueChanges.subscribe(val => {
    //   if (this.branchList.filter(branch => branch.district_id == val && branch.branch_status == 1).length == 1) {
    //     this.branch.patchValue(this.branchList.filter(branch => branch.district_id === val && branch.branch_status == 1)[0].branch_id);
    //     this.branch.disable();
    //     this.line_code_input.nativeElement.focus();
    //   }
    // });
  }

  ngAfterViewInit() {
    if (this.stateList.length == 1) {
      this.state.patchValue(this.stateList[0].state_id);
      this.state.disable();
      this.district_select.focus();
    } else {
      this.state.enable();
      this.state_select.focus();
    }
    if (this.state.value) {
      if (this.districtList.filter(district => district.state_id === this.state.value).length == 1) {
        this.district.patchValue(this.districtList.find(district => district.state_id === this.state.value)?.district_id ?? null);
        this.district.disable();
        this.branch_select.focus();
      } else {
        this.district.enable();
        this.district_select.focus();
      }
    }
    if (this.line_id == 0) {
      this.line_status.patchValue(1);
      this.line_status.disable();
    }

  }

  onClose(resp?: any) {
    this.dialogRef.close(resp);
  }

  checkValidation(cb: any) {
    if (this.state.status == 'INVALID') {
      this.state.setErrors({ required: true });
      this.state_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'State Required');
      return cb(false);
    }

    if (this.district.status == 'INVALID') {
      this.district.setErrors({ required: true });
      this.district_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'District Required');
      return cb(false);
    }

    if (this.branch.status == 'INVALID') {
      this.branch.setErrors({ required: true });
      this.branch_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Branch Required');
      return cb(false);
    }

    if (this.line_code.status == 'INVALID') {
      this.line_code.setErrors({ required: true });
      this.line_code_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Line Code Required');
      return cb(false);
    }

    if (this.line_name.status == 'INVALID') {
      this.line_name.setErrors({ required: true });
      this.line_name_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Line Name Required');
      return cb(false);
    }

    if (this.line_status.status == 'INVALID') {
      this.line_status.setErrors({ required: true });
      this.line_status_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Line Status Required');
      return cb(false);
    }

    return cb(true);
  }

  onSubmit() {
    this.checkValidation((check: boolean) => {
      if (check) {
        let data = {
          state_id: this.state.value,
          state_name: this.stateList.find(state => state.state_id == this.state.value)?.state_name,
          district_id: this.district.value,
          district_name: this.districtList.find(district => district.district_id == this.district.value)?.district_name,
          branch_id: this.branch.value,
          branch_name: this.branchList.find(branch => branch.branch_id == this.branch.value)?.branch_name,
          line_id: this.line_id,
          line_code: this.line_code.value,
          line_name: this.line_name.value,
          line_status: this.line_status.value,
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
            if (this.line_id == 0) {
              this.masterService.createLine(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Line created successfully!", "success", "success", 'right', 'top', 3000);
                  this.spinner.hide();
                  this.onClose(res.result[0]);
                } else {
                  this.globalService.popupMsg('error', 'Oops...', res.error.details);
                  this.spinner.hide();
                }
              });
            } else {
              this.masterService.updateLine(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Line updated successfully!", "success", "success", 'right', 'top', 3000);
                  this.spinner.hide();
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
      state_id: this.state.value,
      state_name: this.stateList.find(state => state.state_id == this.state.value)?.state_name,
      district_id: this.district.value,
      district_name: this.districtList.find(district => district.district_id == this.district.value)?.district_name,
      branch_id: this.branch.value,
      branch_name: this.branchList.find(branch => branch.branch_id == this.branch.value)?.branch_name,
      line_id: this.line_id,
      line_code: this.line_code.value,
      line_name: this.line_name.value,
      line_status: this.line_status.value,
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

        this.masterService.deleteLine(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (!res.error) {
            this.globalService.openSnackBar("Line deleted successfully!", "success", "success", 'right', 'top', 3000);
            this.spinner.hide();
            if (res.result) res.deleted_id = this.line_id;
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
    this.state.reset();
    this.district.reset();
    this.branch.reset();
    this.line_code.reset();
    this.line_name.reset();
    this.line_status.reset();

    this.line_id = 0;
    this.line_status.patchValue(1);
    this.line_status.disable();

    setTimeout(() => {
      if (this.stateList.length == 1) {
        this.state.patchValue(this.stateList[0].state_id);
        this.state.disable();
        this.district_select.focus();
      } else {
        this.state.enable();
        this.state_select.focus();
      }
      if (this.state.value) {
        if (this.districtList.filter(district => district.state_id === this.state.value).length == 1) {
          this.district.patchValue(this.districtList.find(district => district.state_id === this.state.value)?.district_id ?? null);
          this.district.disable();
          this.branch_select.focus();
        } else {
          this.district.enable();
          this.district_select.focus();
        }
      }
    }, 100);


  }


  openBranchDetails(branch?: BranchList) {
    const dialogRef = this.dialog.open(BranchDetailsDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '80%',
      width: '80%',
      panelClass: 'full-screen-modal',
      data: {
        branch_data: branch,
        state_list: this.stateList,
        district_list: this.districtList,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result.branch_id > 0) {
        this.branchList.push({
          position: this.branchList.length + 1,
          branch_id: result.branch_id,
          state_id: result.state_id,
          state_name: result.state_name,
          district_id: result.district_id,
          district_name: result.district_name,
          branch_code: result.branch_code,
          branch_name: result.branch_name,
          branch_status: result.branch_status,
        });
      }
    });
  }

}