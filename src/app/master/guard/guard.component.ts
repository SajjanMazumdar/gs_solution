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
import { GuardList } from '../interface/guard';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { GlobalService } from '../../shared/services/global.service';
import { MasterService } from '../services/master.service';
import { ExcelService } from '../../shared/services/excel.service';
import { DatePipe } from '@angular/common';
import { GuardFilter } from '../interface/filter';

@Component({
  selector: 'app-guard',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule],
  templateUrl: './guard.component.html',
  styleUrl: './guard.component.scss',
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
export class GuardComponent {
displayedColumns: string[] = [
    'position',
    'guard_code',
    'guard_name',
    'guard_status',
    'action'
  ];

  dataSource = new MatTableDataSource<GuardList>();
  guardList: GuardList[];
  readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filter_box: boolean;
  filter_obj: GuardFilter;

  private unsubscribe = new Subject<void>();

  @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (this.filter_box) this.filter_box = false;
    }
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      if (!this.globalService.isDialogOpen(GuardDetailsDialog))
        this.openGuardDetails();
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
    this.guardList = [];
    this.filter_box = false;
    this.filter_obj = {
      search: null,
      status: null
    };
  }

  ngOnInit(): void {
    this.spinner.show();

    forkJoin({
      getGuardList: this.masterService.getGuardList(),
    }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
      if (res.getGuardList && res.getGuardList.error) {
        this.globalService.popupMsg('error', 'Oops...', 'Something went wrong with Guard List');
        this.spinner.hide();
      } else {
        if (res.getGuardList) this.getGuardList();
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
        const statusMatch = filter_data.status.some((status: any) => data.guard_status == status);
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

  getGuardList() {
    try {
      this.masterService.bs_GuardList.pipe(takeUntil(this.unsubscribe)).subscribe((resp: any) => {
        if (!resp.error) {
          this.dataSource.data = [];
          let res: any[] = [];
          res = resp.result;
          for (let i = 0; i <= res.length - 1; i++) {

            this.guardList.push({
              position: i + 1,
              guard_id: res[i].guard_id,
              guard_code: res[i].guard_code,
              guard_name: res[i].guard_name,
              guard_status: res[i].guard_status,
            });
            if (i == res.length - 1) this.dataSource.data = [...this.guardList];
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

  openGuardDetails(guard?: GuardList) {
    const dialogRef = this.dialog.open(GuardDetailsDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '80%',
      width: '80%',
      panelClass: 'full-screen-modal',
      data: {
        guard_data: guard
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result.guard_id > 0) {
        let index = this.guardList.findIndex((guard) => guard.guard_id == result.guard_id);
        if (index > -1) {
          this.guardList[index].guard_code = result.guard_code;
          this.guardList[index].guard_name = result.guard_name;
          this.guardList[index].guard_status = result.guard_status;
        } else {
          this.guardList.unshift({
            position: this.guardList.length + 1,
            guard_id: result.guard_id,
            guard_code: result.guard_code,
            guard_name: result.guard_name,
            guard_status: result.guard_status,
          });
        }
        this.dataSource.data = [...this.guardList];
      }

      if (result.deleted_id) {
        let index = this.guardList.findIndex((guard) => guard.guard_id == result.deleted_id);
        if (index > -1) {
          this.guardList.splice(index, 1);
          this.dataSource.data = [...this.guardList];
        }
      }

    });
  }

  //#region Excel
  excelLevel = {
    first: [
      { key: 'position', label: '#', width: 5 },
      { key: 'guard_code', label: 'Code', width: 10 },
      { key: 'guard_name', label: 'Name', width: 10 },
      { key: 'guard_status', label: 'Status', width: 10 },
    ],

  };

  downloadExcel() {
    let excel = this.excelService.makeWorkSheet('List');

    excel.worksheet = this.excelService.makeTitle(excel.worksheet, {
      spaces: 1,
      mergeCellAddress: 'B1:E1',
      titleName: 'Guard List',
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
      first.guard_status = first.guard_status == 1 ? 'Active' : 'Inactive';
      excel.worksheet = this.excelService.makeData(
        excel.worksheet,
        { spaces: 0 },
        this.excelLevel.first,
        first
      );


    });
    this.excelService.downoadExcel(excel.workbook, 'Guard List');

  }
  //#endregion
}


@Component({
  selector: 'guard_details',
  templateUrl: 'guard_details.html',
  styleUrl: './guard.component.scss',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardDetailsDialog {

  guard_id: number;
  guard_data: GuardList;

  @ViewChild('guard_code_input') guard_code_input !: ElementRef;
  guard_code = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('guard_name_input') guard_name_input !: ElementRef;
  guard_name = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('guard_status_select') guard_status_select !: MatSelect;
  guard_status = new FormControl<number | null>(null, [Validators.required]);

  private unsubscribe = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<GuardDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private masterService: MasterService,
  ) {

    this.guard_id = 0;
    this.guard_data = this.data.guard_data;

  }

  ngOnInit(): void {
    console.log(this.guard_data);
    if (this.guard_data) {
      this.guard_id = this.guard_data.guard_id;
      this.guard_code.patchValue(this.guard_data.guard_code);
      this.guard_name.patchValue(this.guard_data.guard_name);
      this.guard_status.patchValue(this.guard_data.guard_status);
    }
  }

  ngAfterViewInit() {
    if (this.guard_id == 0) {
      this.guard_status.patchValue(1);
      this.guard_status.disable();
    }
  }

  onClose(resp?: any) {
    this.dialogRef.close(resp);
  }

  checkValidation(cb: any) {

    if (this.guard_code.status == 'INVALID') {
      this.guard_code.setErrors({ required: true });
      this.guard_code_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Guard Code Required');
      return cb(false);
    }

    if (this.guard_name.status == 'INVALID') {
      this.guard_name.setErrors({ required: true });
      this.guard_name_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Guard Name Required');
      return cb(false);
    }

    if (this.guard_status.status == 'INVALID') {
      this.guard_status.setErrors({ required: true });
      this.guard_status_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Guard Status Required');
      return cb(false);
    }

    return cb(true);
  }

  onSubmit() {
    this.checkValidation((check: boolean) => {
      if (check) {
        let data = {
          guard_id: this.guard_id,
          guard_code: this.guard_code.value,
          guard_name: this.guard_name.value,
          guard_status: this.guard_status.value,
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
            if (this.guard_id == 0) {
              this.masterService.createGuard(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Guard created successfully!", "success", "success", 'right', 'top', 3000);
                  this.spinner.hide();
                  this.onClose(res.result[0]);
                } else {
                  this.globalService.popupMsg('error', 'Oops...', res.error.details);
                  this.spinner.hide();
                }
              });
            } else {
              this.masterService.updateGuard(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Guard updated successfully!", "success", "success", 'right', 'top', 3000);
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
      guard_id: this.guard_id,
      guard_code: this.guard_code.value,
      guard_name: this.guard_name.value,
      guard_status: this.guard_status.value,
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

        this.masterService.deleteGuard(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (!res.error) {
            this.globalService.openSnackBar("Guard deleted successfully!", "success", "success", 'right', 'top', 3000);
            this.spinner.hide();
            if (res.result) res.deleted_id = this.guard_id;
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
    this.guard_code.reset();
    this.guard_name.reset();
    this.guard_status.reset();

    this.guard_id = 0;
    this.guard_status.patchValue(1);
    this.guard_status.disable();

  }

}
