import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { SharedRoutingModule } from './shared-routing.module';
import { CustfilterPipe } from './pipes/custfilter.pipe';
import { ObjfilterPipe } from './pipes/objfilter.pipe';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NumberonlyDirective } from './directives/numberonly.directive';
import { RestrictlengthDirective } from './directives/restrictlength.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SvgIconComponent } from 'angular-svg-icon';
import { MenufilterPipe } from './pipes/menufilter.pipe';
import { MatfilterPipe } from './pipes/matfilter.pipe';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedRoutingModule,
    CustfilterPipe,
    ObjfilterPipe,
    MatfilterPipe,
    MenufilterPipe,
    NumberonlyDirective,
    RestrictlengthDirective,
    NgxMatSelectSearchModule,
    NgxSpinnerModule,
    SvgIconComponent,
    FormsModule,
    ReactiveFormsModule,
    DatePipe
  ], 
  exports: [
    CustfilterPipe,
    ObjfilterPipe,
    MatfilterPipe,
    MenufilterPipe,
    NumberonlyDirective,
    RestrictlengthDirective,
    NgxMatSelectSearchModule,
    NgxSpinnerModule,
    SvgIconComponent,
    FormsModule,
    ReactiveFormsModule,
    DatePipe
  ],
  providers: [DatePipe]
})
export class SharedModule { }
