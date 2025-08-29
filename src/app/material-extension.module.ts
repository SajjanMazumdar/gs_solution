import { NgModule } from '@angular/core';

import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { MtxCheckboxGroupModule } from '@ng-matero/extensions/checkbox-group';
import { MtxColorpickerModule } from '@ng-matero/extensions/colorpicker';
import { MtxDatetimepickerModule } from '@ng-matero/extensions/datetimepicker';
import { MtxDialogModule } from '@ng-matero/extensions/dialog';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { MtxLoaderModule } from '@ng-matero/extensions/loader';
import { MtxPopoverModule } from '@ng-matero/extensions/popover';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { MtxSplitModule } from '@ng-matero/extensions/split';
import { MtxTooltipModule } from '@ng-matero/extensions/tooltip';
// import { MtxPhotoviewerModule } from '@ng-matero/extensions/photoviewer';
import { provideMomentDatetimeAdapter } from '@ng-matero/extensions-moment-adapter';
import { MTX_DATETIME_FORMATS } from '@ng-matero/extensions/core';

export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'DD-MM-YYYY',
    monthInput: 'MMMM',
    yearInput: 'YYYY',
    timeInput: 'hh:mm A',
    datetimeInput: 'DD-MM-YYYY hh:mm A',
  },
  display: {
    dateInput: 'DD-MM-YYYY',
    monthInput: 'MMMM',
    yearInput: 'YYYY',
    timeInput: 'hh:mm A',
    datetimeInput: 'DD-MM-YYYY hh:mm A',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
    popupHeaderDateLabel: 'ddd, DD MMM',
  },
};

@NgModule({
  exports: [
    MtxAlertModule,
    MtxButtonModule,
    MtxCheckboxGroupModule,
    MtxColorpickerModule,
    MtxDatetimepickerModule,
    MtxDialogModule,
    MtxGridModule,
    MtxLoaderModule,
    MtxPopoverModule,
    MtxProgressModule,
    MtxSelectModule,
    MtxSplitModule,
    MtxTooltipModule,
    // MtxPhotoviewerModule,
  ],
  providers: [
    provideMomentDatetimeAdapter(),
    { provide: MTX_DATETIME_FORMATS, useValue: CUSTOM_DATE_FORMATS },
  ]
})
export class MaterialExtensionsModule {}
