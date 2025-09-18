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
import { StateList } from '../interface/state';
import { DistrictList } from '../interface/district';
import { BranchList } from '../interface/branch';
import { LineList } from '../interface/line';
import { RankList } from '../interface/rank';

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

  stateList: StateList[];
  districtList: DistrictList[];
  branchList: BranchList[];
  lineList: LineList[];
  rankList: RankList[];

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
    this.stateList = [];
    this.districtList = [];
    this.branchList = [];
    this.lineList = [];
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
      getStateList: this.globalService.getStateList(),
      getDistrictList: this.globalService.getDistrictList(),
      getBranchList: this.masterService.getBranchList(),
      getLineList: this.masterService.getLineList(),
      getRankList: this.masterService.getRankList(),
      getGuardList: this.masterService.getGuardList(),
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
      } else if (res.getRankList && res.getRankList.error) {
        this.globalService.popupMsg('error', 'Oops...', 'Something went wrong with Rank List');
        this.spinner.hide();
      } else if (res.getGuardList && res.getGuardList.error) {
        this.globalService.popupMsg('error', 'Oops...', 'Something went wrong with Guard List');
        this.spinner.hide();
      } else {
        if (res.getStateList) this.getStateList();
        if (res.getDistrictList) this.getDistrictList();
        if (res.getBranchList) this.getBranchList();
        if (res.getLineList) this.getLineList();
        if (res.getRankList) this.getRankList();
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
      this.masterService.bs_LineList.pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
        this.lineList = res.result;
        if (this.lineList.length == 0) this.globalService.openSnackBar("No Line tagged with this user", "warning", "warning", 'right', 'top', 3000);
      });
    } catch (error) {

    }
  }

  getRankList() {
    try {
      this.masterService.bs_RankList.pipe(takeUntil(this.unsubscribe)).subscribe((res: any) => {
        this.rankList = res.result;
        if (this.rankList.length == 0) this.globalService.openSnackBar("No Rank tagged with this user", "warning", "warning", 'right', 'top', 3000);
      });
    } catch (error) {

    }
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
              branch_id: res[i].branch_id,
              branch_code: res[i].branch_code,
              branch_name: res[i].branch_name,
              line_id: res[i].line_id,
              line_code: res[i].line_code,
              line_name: res[i].line_name,
              rank_id: res[i].rank_id,
              rank_code: res[i].rank_code,
              rank_name: res[i].rank_name,
              guard_name: res[i].guard_name,
              father_name: res[i].father_name,
              birth_place: res[i].birth_place,
              birth_date: res[i].birth_date,
              join_date: res[i].join_date,
              guard_height: res[i].guard_height,
              maritial_status: res[i].maritial_status,
              contact_number: res[i].contact_number,
              qualification: res[i].qualification,
              identification: res[i].identification,
              experience: res[i].experience,
              state_id: res[i].state_id,
              state_name: res[i].state_name,
              district_id: res[i].district_id,
              district_name: res[i].district_name,
              current_address: res[i].current_address,
              permanent_address: res[i].permanent_address,
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
        guard_data: guard,
        rank_list: this.rankList,
        line_list: this.lineList,
        branch_list: this.branchList,
        state_list: this.stateList,
        district_list: this.districtList,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if (result.guard_id > 0) {
        let index = this.guardList.findIndex((guard) => guard.guard_id == result.guard_id);
        if (index > -1) {
          this.guardList[index].guard_code = result.guard_code;
          this.guardList[index].branch_id = result.branch_id;
          this.guardList[index].branch_code = result.branch_code;
          this.guardList[index].branch_name = result.branch_name;
          this.guardList[index].line_id = result.line_id;
          this.guardList[index].line_code = result.line_code;
          this.guardList[index].line_name = result.line_name;
          this.guardList[index].rank_id = result.rank_id;
          this.guardList[index].rank_code = result.rank_code;
          this.guardList[index].rank_name = result.rank_name;
          this.guardList[index].guard_name = result.guard_name;
          this.guardList[index].father_name = result.father_name;
          this.guardList[index].birth_place = result.birth_place;
          this.guardList[index].birth_date = result.birth_date;
          this.guardList[index].join_date = result.join_date;
          this.guardList[index].guard_height = result.guard_height;
          this.guardList[index].maritial_status = result.maritial_status;
          this.guardList[index].contact_number = result.contact_number;
          this.guardList[index].qualification = result.qualification;
          this.guardList[index].identification = result.identification;
          this.guardList[index].experience = result.experience;
          this.guardList[index].state_id = result.state_id;
          this.guardList[index].state_name = result.state_name;
          this.guardList[index].district_id = result.district_id;
          this.guardList[index].district_name = result.district_name;
          this.guardList[index].current_address = result.current_address;
          this.guardList[index].permanent_address = result.permanent_address;
          this.guardList[index].guard_status = result.guard_status;
        } else {
          this.guardList.unshift({
            position: this.guardList.length + 1,
            guard_id: result.guard_id,
            guard_code: result.guard_code,
            branch_id: result.branch_id,
            branch_code: result.branch_code,
            branch_name: result.branch_name,
            line_id: result.line_id,
            line_code: result.line_code,
            line_name: result.line_name,
            rank_id: result.rank_id,
            rank_code: result.rank_code,
            rank_name: result.rank_name,
            guard_name: result.guard_name,
            father_name: result.father_name,
            birth_place: result.birth_place,
            birth_date: result.birth_date,
            join_date: result.join_date,
            guard_height: result.guard_height,
            maritial_status: result.maritial_status,
            contact_number: result.contact_number,
            qualification: result.qualification,
            identification: result.identification,
            experience: result.experience,
            state_id: result.state_id,
            state_name: result.state_name,
            district_id: result.district_id,
            district_name: result.district_name,
            current_address: result.current_address,
            permanent_address: result.permanent_address,
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
      { key: 'guard_code', label: 'Ticket No.', width: 10 },
      { key: 'branch_code', label: 'Branch Code', width: 10 },
      { key: 'branch_name', label: 'Branch Name', width: 10 },
      { key: 'line_code', label: 'Site Code', width: 10 },
      { key: 'line_name', label: 'Siet Name', width: 10 },
      { key: 'rank_code', label: 'Rank Code', width: 10 },
      { key: 'rank_name', label: 'Rank Name', width: 10 },
      { key: 'guard_name', label: 'Guard Name', width: 10 },
      { key: 'father_name', label: 'Father Name', width: 10 },
      { key: 'birth_place', label: 'Birth Place', width: 10 },
      { key: 'birth_date', label: 'Date of Birth', width: 10 },
      { key: 'join_date', label: 'Date of Join', width: 10 },
      { key: 'guard_height', label: 'Height', width: 10 },
      { key: 'maritial_status', label: 'Maritial Status', width: 10 },
      { key: 'contact_number', label: 'Contact No.', width: 10 },
      { key: 'qualification', label: 'Qualification', width: 10 },
      { key: 'identification', label: 'Identification', width: 10 },
      { key: 'experience', label: 'Experience', width: 10 },
      { key: 'state_name', label: 'State', width: 10 },
      { key: 'district_name', label: 'District', width: 10 },
      { key: 'current_address', label: 'Current Address', width: 10 },
      { key: 'permanent_address', label: 'Permanent Address', width: 10 },
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
      first.birth_date = this.datepipe.transform(first.birth_date, 'dd-MM-yyyy');
      first.join_date = this.datepipe.transform(first.join_date, 'dd-MM-yyyy');
      first.guard_status = first.guard_status == 1 ? 'Active' : 'Inactive';
      first.maritial_status = first.maritial_status == 1 ? 'Married' : first.maritial_status == 2 ? 'Unmarried' : first.maritial_status == 3 ? 'Separate' : 'Not Applicable';
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

  stateList: StateList[];
  districtList: DistrictList[];
  filter_StateSearch: string;
  filter_DistrictSearch: string;
  branchList: BranchList[];
  filter_BranchSearch: string;
  lineList: LineList[];
  filter_LineSearch: string;
  rankList: RankList[];
  filter_RankSearch: string;

  guard_id: number;
  guard_data: GuardList;

  guard_code = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('guard_code_input') guard_code_input !: ElementRef;

  branch = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('branch_select') branch_select !: MatSelect;

  line = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('line_select') line_select !: MatSelect;

  rank = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('rank_select') rank_select !: MatSelect;

  guard_name = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('guard_name_input') guard_name_input !: ElementRef;

  father_name = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('father_name_input') father_name_input !: ElementRef;

  birth_place = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('birth_place_input') birth_place_input !: ElementRef;

  birth_date = new FormControl<Date | null>(null, [Validators.required]);
  @ViewChild('birth_date_input') birth_date_input !: ElementRef;

  join_date = new FormControl<Date | null>(null, [Validators.required]);
  @ViewChild('join_date_input') join_date_input !: ElementRef;

  guard_height = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('guard_height_input') guard_height_input !: ElementRef;

  maritial_status = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('maritial_status_select') maritial_status_select !: MatSelect;

  contact_number = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('contact_number_input') contact_number_input !: ElementRef;

  qualification = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('qualification_input') qualification_input !: ElementRef;

  identification = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('identification_input') identification_input !: ElementRef;

  experience = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('experience_input') experience_input !: ElementRef;

  state = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('state_select') state_select !: MatSelect;

  district = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('district_select') district_select !: MatSelect;

  current_address = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('current_address_input') current_address_input !: ElementRef;

  permanent_address = new FormControl<string | null>(null, [Validators.required]);
  @ViewChild('permanent_address_input') permanent_address_input !: ElementRef;

  guard_status = new FormControl<number | null>(null, [Validators.required]);
  @ViewChild('guard_status_select') guard_status_select !: MatSelect;

  private unsubscribe = new Subject<void>();  
  private datepipe = inject(DatePipe);

  constructor(
    public dialogRef: MatDialogRef<GuardDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: NgxSpinnerService,
    private globalService: GlobalService,
    private masterService: MasterService,
  ) {

    this.stateList = this.data.state_list ? this.data.state_list : [];
    this.districtList = this.data.district_list ? this.data.district_list : [];
    this.branchList = this.data.branch_list ? this.data.branch_list : [];
    this.lineList = this.data.line_list ? this.data.line_list : [];
    this.rankList = this.data.rank_list ? this.data.rank_list : [];
    this.filter_StateSearch = '';
    this.filter_DistrictSearch = '';
    this.filter_BranchSearch = '';
    this.filter_LineSearch = '';
    this.filter_RankSearch = '';
    
    this.guard_id = 0;
    this.guard_data = this.data.guard_data;

  }

  ngOnInit(): void {
    console.log(this.guard_data);
    if (this.guard_data) {
      this.guard_id = this.guard_data.guard_id;
      this.guard_code.setValue(this.guard_data.guard_code);
      this.branch.setValue(this.guard_data.branch_id);
      this.line.setValue(this.guard_data.line_id);
      this.rank.setValue(this.guard_data.rank_id);
      this.guard_name.setValue(this.guard_data.guard_name);
      this.father_name.setValue(this.guard_data.father_name);
      this.birth_place.setValue(this.guard_data.birth_place);
      this.birth_date.setValue(this.guard_data.birth_date);
      this.join_date.setValue(this.guard_data.join_date);
      this.guard_height.setValue(this.guard_data.guard_height);
      this.maritial_status.setValue(this.guard_data.maritial_status);
      this.contact_number.setValue(this.guard_data.contact_number);
      this.qualification.setValue(this.guard_data.qualification);
      this.identification.setValue(this.guard_data.identification);
      this.experience.setValue(this.guard_data.experience);
      this.state.setValue(this.guard_data.state_id);
      this.district.setValue(this.guard_data.district_id);
      this.current_address.setValue(this.guard_data.current_address);
      this.permanent_address.setValue(this.guard_data.permanent_address);
      this.guard_status.setValue(this.guard_data.guard_status);
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

    if (this.branch.status == 'INVALID') {
      this.branch.setErrors({ required: true });
      this.branch_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Branch Status Required');
      return cb(false);
    }

    if (this.line.status == 'INVALID') {
      this.line.setErrors({ required: true });
      this.line_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Site Status Required');
      return cb(false);
    }

    if (this.rank.status == 'INVALID') {
      this.rank.setErrors({ required: true });
      this.rank_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Rank Status Required');
      return cb(false);
    }

    if (this.guard_name.status == 'INVALID') {
      this.guard_name.setErrors({ required: true });
      this.guard_name_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Guard Name Required');
      return cb(false);
    }

    if (this.father_name.status == 'INVALID') {
      this.father_name.setErrors({ required: true });
      this.father_name_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Father Name Required');
      return cb(false);
    }

    if (this.birth_place.status == 'INVALID') {
      this.birth_place.setErrors({ required: true });
      this.birth_place_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Birth Place Required');
      return cb(false);
    }

    if (this.birth_date.status == 'INVALID') {
      this.birth_date.setErrors({ required: true });
      this.birth_date_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Date of Birth Required');
      return cb(false);
    }

    if (this.join_date.status == 'INVALID') {
      this.join_date.setErrors({ required: true });
      this.join_date_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Date of Join Required');
      return cb(false);
    }

    if (this.guard_height.status == 'INVALID') {
      this.guard_height.setErrors({ required: true });
      this.guard_height_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Height Required');
      return cb(false);
    }

    if (this.maritial_status.status == 'INVALID') {
      this.maritial_status.setErrors({ required: true });
      this.maritial_status_select.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Maritial Status Required');
      return cb(false);
    }

    if (this.contact_number.status == 'INVALID') {
      this.contact_number.setErrors({ required: true });
      this.contact_number_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Contact No. Required');
      return cb(false);
    }

    if (this.qualification.status == 'INVALID') {
      this.qualification.setErrors({ required: true });
      this.qualification_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Qualification Required');
      return cb(false);
    }

    if (this.identification.status == 'INVALID') {
      this.identification.setErrors({ required: true });
      this.identification_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Identification Required');
      return cb(false);
    }

    if (this.experience.status == 'INVALID') {
      this.experience.setErrors({ required: true });
      this.experience_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Experience Required');
      return cb(false);
    }

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

    if (this.current_address.status == 'INVALID') {
      this.current_address.setErrors({ required: true });
      this.current_address_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Current Address Required');
      return cb(false);
    }

    if (this.permanent_address.status == 'INVALID') {
      this.permanent_address.setErrors({ required: true });
      this.permanent_address_input.nativeElement.focus();
      this.globalService.popupMsg('error', 'Oops...', 'Permanent Address Required');
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
          branch_id: this.branch.value,
          line_id: this.line.value,
          rank_id: this.rank.value,
          guard_name: this.guard_name.value,
          father_name: this.father_name.value,
          birth_place: this.birth_place.value,
          birth_date: this.datepipe.transform(this.birth_date.value, 'dd-MM-yyyy'),
          join_date: this.datepipe.transform(this.join_date.value, 'dd-MM-yyyy'),
          guard_height: this.guard_height.value,
          maritial_status: this.maritial_status.value,
          contact_number: this.contact_number.value,
          qualification: this.qualification.value,
          identification: this.identification.value,
          experience: this.experience.value,
          state_id: this.state.value,
          district_id: this.district.value,
          current_address: this.current_address.value,
          permanent_address: this.permanent_address.value,
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
      guard_id: this.guard_id
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
    this.branch.reset();
    this.line.reset();
    this.rank.reset();
    this.guard_name.reset();
    this.father_name.reset();
    this.birth_place.reset();
    this.birth_date.reset();
    this.join_date.reset();
    this.guard_height.reset();
    this.maritial_status.reset();
    this.contact_number.reset();
    this.qualification.reset();
    this.identification.reset();
    this.experience.reset();
    this.state.reset();
    this.district.reset();
    this.current_address.reset();
    this.permanent_address.reset();
    this.guard_status.reset();

    this.guard_id = 0;
    this.guard_status.patchValue(1);
    this.guard_status.disable();

  }

}
