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
import { BankList } from '../interface/bank';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { GlobalService } from '../../shared/services/global.service';
import { MasterService } from '../services/master.service';
import { ExcelService } from '../../shared/services/excel.service';
import { DatePipe } from '@angular/common';
import { BankFilter } from '../interface/filter';

@Component({
  selector: 'app-bank',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule],
  templateUrl: './bank.component.html',
  styleUrl: './bank.component.scss',
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
export class BankComponent {
  displayedColumns: string[] = [
    'position',
    'bank_code',
    'bank_name',
    'bank_status',
    'action'
  ];

  dataSource = new MatTableDataSource<BankList>();
  bankList: BankList[];
  readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filter_box: boolean;
  filter_obj: BankFilter;

  private unsubscribe = new Subject<void>();

  @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (this.filter_box) this.filter_box = false;
    }
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      if (!this.globalService.isDialogOpen(BankDetailsDialog))
        this.openBankDetails();
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
    this.bankList = [];
    this.filter_box = false;
    this.filter_obj = {
      search: null,
      status: null
    };
  }

  ngOnInit(): void {
    this.spinner.show();

    forkJoin({
      getBankList: this.masterService.getBankList(),
    }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
      if (res.getBankList && res.getBankList.error) {
        this.globalService.popupMsg('error', 'Oops...', 'Something went wrong with Bank List');
        this.spinner.hide();
      } else {
        if (res.getBankList) this.getBankList();
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
        const statusMatch = filter_data.status.some((status: any) => data.bank_status == status);
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

  getBankList() {
    try {
      this.masterService.bs_BankList.pipe(takeUntil(this.unsubscribe)).subscribe((resp: any) => {
        if (!resp.error) {
          this.dataSource.data = [];
          let res: any[] = [];
          res = resp.result;
          for (let i = 0; i <= res.length - 1; i++) {

            this.bankList.push({
              position: i + 1,
              bank_id: res[i].bank_id,
              bank_code: res[i].bank_code,
              bank_name: res[i].bank_name,
              bank_status: res[i].bank_status,
            });
            if (i == res.length - 1) this.dataSource.data = [...this.bankList];
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

  openBankDetails(bank?: BankList) {
    const dialogRef = this.dialog.open(BankDetailsDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '80%',
      width: '80%',
      panelClass: 'full-screen-modal',
      data: {
        bank_data: bank
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result.bank_id > 0) {
        let index = this.bankList.findIndex((bank) => bank.bank_id == result.bank_id);
        if (index > -1) {
          this.bankList[index].bank_code = result.bank_code;
          this.bankList[index].bank_name = result.bank_name;
          this.bankList[index].bank_status = result.bank_status;
        } else {
          this.bankList.unshift({
            position: this.bankList.length + 1,
            bank_id: result.bank_id,
            bank_code: result.bank_code,
            bank_name: result.bank_name,
            bank_status: result.bank_status,
          });
        }
        this.dataSource.data = [...this.bankList];
      }

      if (result.deleted_id) {
        let index = this.bankList.findIndex((bank) => bank.bank_id == result.deleted_id);
        if (index > -1) {
          this.bankList.splice(index, 1);
          this.dataSource.data = [...this.bankList];
        }
      }

    });
  }

  //#region Excel
  excelLevel = {
    first: [
      { key: 'position', label: '#', width: 5 },
      { key: 'bank_code', label: 'Code', width: 10 },
      { key: 'bank_name', label: 'Name', width: 10 },
      { key: 'bank_status', label: 'Status', width: 10 },
    ],

  };

  downloadExcel() {
    let excel = this.excelService.makeWorkSheet('List');

    excel.worksheet = this.excelService.makeTitle(excel.worksheet, {
      spaces: 1,
      mergeCellAddress: 'B1:E1',
      titleName: 'Bank List',
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
      first.bank_status = first.bank_status == 1 ? 'Active' : 'Inactive';
      excel.worksheet = this.excelService.makeData(
        excel.worksheet,
        { spaces: 0 },
        this.excelLevel.first,
        first
      );


    });
    this.excelService.downoadExcel(excel.workbook, 'Bank List');

  }
  //#endregion
}


@Component({
  selector: 'bank_details',
  templateUrl: 'bank_details.html',
  styleUrl: './bank.component.scss',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankDetailsDialog {

  bank_id: number;
  bank_data: BankList;

  @ViewChild('bank_code_input') bank_code_input !: ElementRef;
  bank_code = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('bank_name_input') bank_name_input !: ElementRef;
  bank_name = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('bank_status_select') bank_status_select !: MatSelect;
  bank_status = new FormControl<number | null>(null, [Validators.required]);

  private unsubscribe = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<BankDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private masterService: MasterService,
  ) {

    this.bank_id = 0;
    this.bank_data = this.data.bank_data;

  }

  ngOnInit(): void {
    console.log(this.bank_data);
    if (this.bank_data) {
      this.bank_id = this.bank_data.bank_id;
      this.bank_code.patchValue(this.bank_data.bank_code);
      this.bank_name.patchValue(this.bank_data.bank_name);
      this.bank_status.patchValue(this.bank_data.bank_status);
    }
  }

  ngAfterViewInit() {
    if (this.bank_id == 0) {
      this.bank_status.patchValue(1);
      this.bank_status.disable();
    }
  }

  onClose(resp?: any) {
    this.dialogRef.close(resp);
  }

  checkValidation(cb: any) {

    if (this.bank_code.status == 'INVALID') {
      this.bank_code.setErrors({ required: true });
      this.bank_code_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Bank Code Required');
      return cb(false);
    }

    if (this.bank_name.status == 'INVALID') {
      this.bank_name.setErrors({ required: true });
      this.bank_name_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Bank Name Required');
      return cb(false);
    }

    if (this.bank_status.status == 'INVALID') {
      this.bank_status.setErrors({ required: true });
      this.bank_status_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Bank Status Required');
      return cb(false);
    }

    return cb(true);
  }

  onSubmit() {
    this.checkValidation((check: boolean) => {
      if (check) {
        let data = {
          bank_id: this.bank_id,
          bank_code: this.bank_code.value,
          bank_name: this.bank_name.value,
          bank_status: this.bank_status.value,
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
            if (this.bank_id == 0) {
              this.masterService.createBank(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Bank created successfully!", "success", "success", 'right', 'top', 3000);
                  this.spinner.hide();
                  this.onClose(res.result[0]);
                } else {
                  this.globalService.popupMsg('error', 'Oops...', res.error.details);
                  this.spinner.hide();
                }
              });
            } else {
              this.masterService.updateBank(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Bank updated successfully!", "success", "success", 'right', 'top', 3000);
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
      bank_id: this.bank_id,
      bank_code: this.bank_code.value,
      bank_name: this.bank_name.value,
      bank_status: this.bank_status.value,
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

        this.masterService.deleteBank(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (!res.error) {
            this.globalService.openSnackBar("Bank deleted successfully!", "success", "success", 'right', 'top', 3000);
            this.spinner.hide();
            if (res.result) res.deleted_id = this.bank_id;
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
    this.bank_code.reset();
    this.bank_name.reset();
    this.bank_status.reset();

    this.bank_id = 0;
    this.bank_status.patchValue(1);
    this.bank_status.disable();

  }

}