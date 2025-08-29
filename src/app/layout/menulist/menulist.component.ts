import { animate, style, transition, trigger } from '@angular/animations';
import { Component, computed, HostListener, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLinkActive, RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { MenuItem } from '../../menu-items';
import { SvgIconComponent } from 'angular-svg-icon';
import { CommonModule } from '@angular/common';
import { GlobalService } from '../../shared/services/global.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-menulist',
  imports: [RouterModule, MaterialModule, CommonModule, SvgIconComponent, SharedModule],
  templateUrl: './menulist.component.html',
  styleUrl: './menulist.component.scss',
  animations: [
    trigger('expandContractMenu', [
      transition(':enter', [
        style({ opacity: 0, height: '0px' }),
        animate('500ms ease-in-out', style({ opacity: 1, height: '*' })),
      ]),
      transition(':leave', [
        animate('500ms ease-in-out', style({ opacity: 0, height: '0px' })),
      ]),
    ]),
    // trigger('expandContractMenu', [
    //   state('void', style({ height: '0px', overflow: 'hidden' })),
    //   state('*', style({ height: '*', overflow: 'hidden' })),
    //   transition('void <=> *', animate('300ms ease-in-out')),
    // ]),
  ],
})
export class MenulistComponent {
  item = input.required<MenuItem>();
  collapsed = input.required<boolean>();
  routeHistory = input('');

  level = computed(() => this.routeHistory().split('/').length - 1);
  indentation = computed(() =>
    this.collapsed() ? '16px' : `${16 + this.level() * 16}px`
  );

  nestedItemOpen = signal(false);

  constructor(private router: Router, private globalService: GlobalService) {
    
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (!this.item().subItems) {
      // Collapse the menu after selection if it wasn't manually toggled
      if (!this.globalService.isManualToggle()) {
        setTimeout(() => {
          this.globalService.collapsed.set(true);
        }, 300);
      }
    }
  }

  ngOnInit(): void {
    this.expandIfChildIsActive();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.expandIfChildIsActive();
      }
    });
  }

  private expandIfChildIsActive() {
    if (this.item().subItems?.some(sub => this.router.url.startsWith(sub.route))) {
      this.nestedItemOpen.set(true);
    }
  }

  isActive(): boolean {
    const currentUrl = this.router.url;

    if (this.item().route && currentUrl === '/' + this.item().route.replace(/^\/+/, '')) {
      return true;
    }

    return this.item().subItems?.some(
      sub => currentUrl.startsWith(sub.route.startsWith('/') ? sub.route : '/' + sub.route)
    ) ?? false;
  }
  
}
