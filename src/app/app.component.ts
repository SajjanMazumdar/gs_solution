import { CommonModule } from '@angular/common';
import { Component, computed, signal, ViewEncapsulation } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HeaderComponent } from "./layout/header/header.component";
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { MaterialModule } from './material.module';
import { GlobalService } from './shared/services/global.service';
import { PlatformService } from './shared/services/platform.service';
import { SharedModule } from './shared/shared.module';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MaterialModule,
    RouterModule,
    SidebarComponent,
    HeaderComponent,
    LoginComponent,
    SharedModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent {  
  sidenavWidth = computed(() => (this.globalService.collapsed() ? '65px' : '185px'));
  isManualToggle = signal(false);

  constructor(
    public globalService: GlobalService,
    public platformService: PlatformService
  ) {
    // Start with collapsed menu by default
    this.globalService.collapsed.set(true);
  }

  onSidenavMouseEnter() {
    if (!this.isManualToggle()) {
      this.globalService.collapsed.set(false);
    }
  }

  onSidenavMouseLeave() {
    if (!this.isManualToggle()) {
      this.globalService.collapsed.set(true);
    }
  }
}