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
import { RankList } from '../interface/rank';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { GlobalService } from '../../shared/services/global.service';
import { MasterService } from '../services/master.service';
import { ExcelService } from '../../shared/services/excel.service';
import { DatePipe } from '@angular/common';
import { RankFilter } from '../interface/filter';

@Component({
  selector: 'app-rank',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule],
  templateUrl: './rank.component.html',
  styleUrl: './rank.component.scss',
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
export class RankComponent {
displayedColumns: string[] = [
    'position',
    'rank_code',
    'rank_name',
    'rank_status',
    'action'
  ];

  dataSource = new MatTableDataSource<RankList>();
  rankList: RankList[];
  readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filter_box: boolean;
  filter_obj: RankFilter;

  private unsubscribe = new Subject<void>();

  @HostListener("window:keyup", ["$event"]) handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (this.filter_box) this.filter_box = false;
    }
    if (event.altKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      if (!this.globalService.isDialogOpen(RankDetailsDialog))
        this.openRankDetails();
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
    this.rankList = [];
    this.filter_box = false;
    this.filter_obj = {
      search: null,
      status: null
    };
  }

  ngOnInit(): void {
    this.spinner.show();

    forkJoin({
      getRankList: this.masterService.getRankList(),
    }).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
      if (res.getRankList && res.getRankList.error) {
        this.globalService.popupMsg('error', 'Oops...', 'Something went wrong with Rank List');
        this.spinner.hide();
      } else {
        if (res.getRankList) this.getRankList();
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
        const statusMatch = filter_data.status.some((status: any) => data.rank_status == status);
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

  getRankList() {
    try {
      this.masterService.bs_RankList.pipe(takeUntil(this.unsubscribe)).subscribe((resp: any) => {
        if (!resp.error) {
          this.dataSource.data = [];
          let res: any[] = [];
          res = resp.result;
          for (let i = 0; i <= res.length - 1; i++) {

            this.rankList.push({
              position: i + 1,
              rank_id: res[i].rank_id,
              rank_code: res[i].rank_code,
              rank_name: res[i].rank_name,
              rank_status: res[i].rank_status,
            });
            if (i == res.length - 1) this.dataSource.data = [...this.rankList];
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

  openRankDetails(rank?: RankList) {
    const dialogRef = this.dialog.open(RankDetailsDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '80%',
      width: '80%',
      panelClass: 'full-screen-modal',
      data: {
        rank_data: rank
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result.rank_id > 0) {
        let index = this.rankList.findIndex((rank) => rank.rank_id == result.rank_id);
        if (index > -1) {
          this.rankList[index].rank_code = result.rank_code;
          this.rankList[index].rank_name = result.rank_name;
          this.rankList[index].rank_status = result.rank_status;
        } else {
          this.rankList.unshift({
            position: this.rankList.length + 1,
            rank_id: result.rank_id,
            rank_code: result.rank_code,
            rank_name: result.rank_name,
            rank_status: result.rank_status,
          });
        }
        this.dataSource.data = [...this.rankList];
      }

      if (result.deleted_id) {
        let index = this.rankList.findIndex((rank) => rank.rank_id == result.deleted_id);
        if (index > -1) {
          this.rankList.splice(index, 1);
          this.dataSource.data = [...this.rankList];
        }
      }

    });
  }

  //#region Excel
  excelLevel = {
    first: [
      { key: 'position', label: '#', width: 5 },
      { key: 'rank_code', label: 'Code', width: 10 },
      { key: 'rank_name', label: 'Name', width: 10 },
      { key: 'rank_status', label: 'Status', width: 10 },
    ],

  };

  downloadExcel() {
    let excel = this.excelService.makeWorkSheet('List');

    excel.worksheet = this.excelService.makeTitle(excel.worksheet, {
      spaces: 1,
      mergeCellAddress: 'B1:E1',
      titleName: 'Rank List',
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
      first.rank_status = first.rank_status == 1 ? 'Active' : 'Inactive';
      excel.worksheet = this.excelService.makeData(
        excel.worksheet,
        { spaces: 0 },
        this.excelLevel.first,
        first
      );


    });
    this.excelService.downoadExcel(excel.workbook, 'Rank List');

  }
  //#endregion
}


@Component({
  selector: 'rank_details',
  templateUrl: 'rank_details.html',
  styleUrl: './rank.component.scss',
  imports: [MaterialModule, SharedModule, SvgIconComponent, MatDialogModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankDetailsDialog {

  rank_id: number;
  rank_data: RankList;

  @ViewChild('rank_code_input') rank_code_input !: ElementRef;
  rank_code = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('rank_name_input') rank_name_input !: ElementRef;
  rank_name = new FormControl<string | null>(null, [Validators.required]);

  @ViewChild('rank_status_select') rank_status_select !: MatSelect;
  rank_status = new FormControl<number | null>(null, [Validators.required]);

  private unsubscribe = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<RankDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private masterService: MasterService,
  ) {

    this.rank_id = 0;
    this.rank_data = this.data.rank_data;

  }

  ngOnInit(): void {
    console.log(this.rank_data);
    if (this.rank_data) {
      this.rank_id = this.rank_data.rank_id;
      this.rank_code.patchValue(this.rank_data.rank_code);
      this.rank_name.patchValue(this.rank_data.rank_name);
      this.rank_status.patchValue(this.rank_data.rank_status);
    }
  }

  ngAfterViewInit() {
    if (this.rank_id == 0) {
      this.rank_status.patchValue(1);
      this.rank_status.disable();
    }
  }

  onClose(resp?: any) {
    this.dialogRef.close(resp);
  }

  checkValidation(cb: any) {

    if (this.rank_code.status == 'INVALID') {
      this.rank_code.setErrors({ required: true });
      this.rank_code_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Rank Code Required');
      return cb(false);
    }

    if (this.rank_name.status == 'INVALID') {
      this.rank_name.setErrors({ required: true });
      this.rank_name_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Rank Name Required');
      return cb(false);
    }

    if (this.rank_status.status == 'INVALID') {
      this.rank_status.setErrors({ required: true });
      this.rank_status_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Rank Status Required');
      return cb(false);
    }

    return cb(true);
  }

  onSubmit() {
    this.checkValidation((check: boolean) => {
      if (check) {
        let data = {
          rank_id: this.rank_id,
          rank_code: this.rank_code.value,
          rank_name: this.rank_name.value,
          rank_status: this.rank_status.value,
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
            if (this.rank_id == 0) {
              this.masterService.createRank(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Rank created successfully!", "success", "success", 'right', 'top', 3000);
                  this.spinner.hide();
                  this.onClose(res.result[0]);
                } else {
                  this.globalService.popupMsg('error', 'Oops...', res.error.details);
                  this.spinner.hide();
                }
              });
            } else {
              this.masterService.updateRank(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
                if (!res.error) {
                  this.globalService.openSnackBar("Rank updated successfully!", "success", "success", 'right', 'top', 3000);
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
      rank_id: this.rank_id,
      rank_code: this.rank_code.value,
      rank_name: this.rank_name.value,
      rank_status: this.rank_status.value,
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

        this.masterService.deleteRank(data).pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
          if (!res.error) {
            this.globalService.openSnackBar("Rank deleted successfully!", "success", "success", 'right', 'top', 3000);
            this.spinner.hide();
            if (res.result) res.deleted_id = this.rank_id;
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
    this.rank_code.reset();
    this.rank_name.reset();
    this.rank_status.reset();

    this.rank_id = 0;
    this.rank_status.patchValue(1);
    this.rank_status.disable();

  }

}
