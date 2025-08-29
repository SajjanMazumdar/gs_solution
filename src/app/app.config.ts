import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { MaterialExtensionsModule } from './material-extension.module';
import { MaterialModule } from './material.module';
import { SharedModule } from './shared/shared.module';
import { tokenInterceptor } from './auth/interceptor/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withComponentInputBinding()
    ), 
    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor])),
    provideClientHydration(withEventReplay()),

    // provideNativeDateAdapter(),
    // { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },

    // provideMomentDatetimeAdapter(),
    // {
    //   provide: DateAdapter,
    //   useClass: MomentDateAdapter,
    //   deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    // },
    // { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },

    provideAnimations(),
    provideAngularSvgIcon(),
    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule,
      MaterialModule,
      MaterialExtensionsModule,
      SharedModule
    )
  ]
};
