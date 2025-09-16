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
import { BranchList } from '../interface/branch';
import { DistrictList } from '../interface/district';
import { StateList } from '../interface/state';
import { GlobalService } from '../../shared/services/global.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { MasterService } from '../services/master.service';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { ExcelService } from '../../shared/services/excel.service';
import { DatePipe } from '@angular/common';
import { BranchFilter } from '../interface/filter';

@Component({
  selector: 'app-branch',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule],
  templateUrl: './branch.component.html',
  styleUrl: './branch.component.scss',
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

export class BranchComponent {

  displayedColumns: string[] = [
    'position',
    'branch_code',
    'branch_name',
    'district_name',
    'branch_status',
    'action'
  ];

  dataSource = new MatTableDataSource<BranchList>();
  branchList: BranchList[];
  readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  stateList: StateList[];
  districtList: DistrictList[];

  filter_box: boolean;
  filter_obj: BranchFilter;

  private unsubscribe = new Subject<void>();

  @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (this.filter_box) this.filter_box = false;
    }
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      if (!this.globalService.isDialogOpen(BranchDetailsDialog))
        this.openBranchDetails();
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
    this.branchList = [];
    this.stateList = [];
    this.districtList = [];
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
      getBranchList: this.masterService.getBranchList(),
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
      } else {
        if (res.getStateList) this.getStateList();
        if (res.getDistrictList) this.getDistrictList();
        if (res.getBranchList) this.getBranchList();
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
        const statusMatch = filter_data.status.some((status: any) => data.branch_status == status);
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
    try {
      this.masterService.bs_BranchList.pipe(takeUntil(this.unsubscribe)).subscribe((resp: any) => {
        if (!resp.error) {
          this.dataSource.data = [];
          let res: any[] = [];
          res = resp.result;
          for (let i = 0; i <= res.length - 1; i++) {

            this.branchList.push({
              position: i + 1,
              branch_id: res[i].branch_id,
              state_id: res[i].state_id,
              state_name: res[i].state_name,
              district_id: res[i].district_id,
              district_name: res[i].district_name,
              branch_code: res[i].branch_code,
              branch_name: res[i].branch_name,
              branch_status: res[i].branch_status,
            });
            if (i == res.length - 1) this.dataSource.data = [...this.branchList];
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
      status: null
    };
    this.dataSource.filter = JSON.stringify(this.filter_obj);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  //#endregion

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
        let index = this.branchList.findIndex((branch) => branch.branch_id == result.branch_id);
        if (index > -1) {
          this.branchList[index].state_id = result.state_id;
          this.branchList[index].state_name = result.state_name;
          this.branchList[index].district_id = result.district_id;
          this.branchList[index].district_name = result.district_name;
          this.branchList[index].branch_code = result.branch_code;
          this.branchList[index].branch_name = result.branch_name;
          this.branchList[index].branch_status = result.branch_status;
        } else {
          this.branchList.unshift({
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
        this.dataSource.data = [...this.branchList];
      }

      if (result.deleted_id) {
        let index = this.branchList.findIndex((branch) => branch.branch_id == result.deleted_id);
        if (index > -1) {
          this.branchList.splice(index, 1);
          this.dataSource.data = [...this.branchList];
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
      { key: 'branch_code', label: 'Code', width: 10 },
      { key: 'branch_name', label: 'Name', width: 10 },
      { key: 'branch_status', label: 'Status', width: 10 },
    ],

  };

  downloadExcel() {
    let excel = this.excelService.makeWorkSheet('List');
      
      excel.worksheet = this.excelService.makeTitle(excel.worksheet, {
        spaces: 1,
        mergeCellAddress: 'B1:E1',
        titleName: 'Branch List',
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
        first.branch_status = first.branch_status == 1 ? 'Active' : 'Inactive';
        excel.worksheet = this.excelService.makeData(
          excel.worksheet,
          { spaces: 0 },
          this.excelLevel.first,
          first
        );


      });
      this.excelService.downoadExcel(excel.workbook, 'Branch List');
     
  }
  //#endregion

}

@Component({
  selector: 'branch_details',
  templateUrl: 'branch_details.html',
  styleUrl: './branch.component.scss',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchDetailsDialog {


  stateList: StateList[];
  districtList: DistrictList[];
  filter_StateSearch: string;
  filter_DistrictSearch: string;

  branch_id: number;
  branch_data: BranchList;

  @ViewChild('state_select') state_select !: MatSelect;
  state = new FormControl<number | null>(null, [Validators.required]);

  @ViewChild('district_select') district_select !: MatSelect;
  district = new FormControl<number | null>(null, [Validators.required]);

  @ViewChild('branch_code_input') branch_code_input !: ElementRef;
  branch_code = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('branch_name_input') branch_name_input !: ElementRef;
  branch_name = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('branch_status_select') branch_status_select !: MatSelect;
  branch_status = new FormControl<number | null>(null, [Validators.required]);

  private unsubscribe = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<BranchDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private masterService: MasterService,
  ) {

    this.stateList = this.data.state_list ? this.data.state_list : [];
    this.districtList = this.data.district_list ? this.data.district_list : [];
    this.filter_StateSearch = '';
    this.filter_DistrictSearch = '';

    this.branch_id = 0;
    this.branch_data = this.data.branch_data;

  }

  ngOnInit(): void {
    console.log(this.branch_data);
    if (this.branch_data) {
      this.branch_id = this.branch_data.branch_id;
      this.branch_code.patchValue(this.branch_data.branch_code);
      this.branch_name.patchValue(this.branch_data.branch_name);
      this.branch_status.patchValue(this.branch_data.branch_status);
      this.state.patchValue(this.branch_data.state_id);
      this.district.patchValue(this.branch_data.district_id);
    }
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
        this.branch_code_input.nativeElement.focus();
      } else {
        this.district.enable();
        this.district_select.focus();
      }
    }
    if (this.branch_id == 0) {
      this.branch_status.patchValue(1);
      this.branch_status.disable();
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

    if (this.branch_code.status == 'INVALID') {
      this.branch_code.setErrors({ required: true });
      this.branch_code_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Branch Code Required');
      return cb(false);
    }

    if (this.branch_name.status == 'INVALID') {
      this.branch_name.setErrors({ required: true });
      this.branch_name_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Branch Name Required');
      return cb(false);
    }

    if (this.branch_status.status == 'INVALID') {
      this.branch_status.setErrors({ required: true });
      this.branch_status_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Branch Status Required');
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
          branch_id: this.branch_id,
          branch_code: this.branch_code.value,
          branch_name: this.branch_name.value,
          branch_status: this.branch_status.value,
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
            if (this.branch_id == 0) {
              this.masterService.createBranch(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Branch created successfully!", "success", "success", 'right', 'top', 3000);
                  this.spinner.hide();
                  this.onClose(res.result[0]);
                } else {
                  this.globalService.popupMsg('error', 'Oops...', res.error.details);
                  this.spinner.hide();
                }
              });
            } else {
              this.masterService.updateBranch(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Branch updated successfully!", "success", "success", 'right', 'top', 3000);
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
      branch_id: this.branch_id,
      branch_code: this.branch_code.value,
      branch_name: this.branch_name.value,
      branch_status: this.branch_status.value,
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

        this.masterService.deleteBranch(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (!res.error) {
            this.globalService.openSnackBar("Branch deleted successfully!", "success", "success", 'right', 'top', 3000);
            this.spinner.hide();
            if (res.result) res.deleted_id = this.branch_id;
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
    this.branch_code.reset();
    this.branch_name.reset();
    this.branch_status.reset();

    this.branch_id = 0;
    this.branch_status.patchValue(1);
    this.branch_status.disable();

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
          this.branch_code_input.nativeElement.focus();
        } else {
          this.district.enable();
          this.district_select.focus();
        }
      }
    }, 100);

  }

}