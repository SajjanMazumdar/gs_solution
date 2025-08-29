import { CommonModule } from '@angular/common';
import { Component, computed, input, ViewEncapsulation} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { menuItems, setMenuStatusFromUser } from '../../menu-items';
import { MenulistComponent } from '../menulist/menulist.component';
import { SharedModule } from '../../shared/shared.module';
import { GlobalService } from '../../shared/services/global.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, MenulistComponent, MaterialModule, SharedModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  collapsed = input<boolean>(false);

  menuItems = menuItems;

  profilePicSize = computed(() => (this.collapsed() ? '32' : '100'));

  constructor(private globalService: GlobalService) {
    const userMenuItems = this.globalService.currentUser.getData()?.menuItems || [];
    this.menuItems = setMenuStatusFromUser(menuItems, userMenuItems);
  }
}
