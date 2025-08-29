import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { GlobalService } from '../../shared/services/global.service';

@Component({
  selector: 'app-header',
  imports: [MaterialModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  
  user_name: string;

  constructor(
    public globalService: GlobalService
  ) {
    // Start with collapsed menu by default
    this.globalService.collapsed.set(true);
    this.user_name = '';
  }

  ngOnInit(): void {
    if (this.globalService.currentUser) {
      this.user_name = this.globalService.currentUser.getData().emp_name;
    }
  }

  toggleMenu() {
    this.globalService.isManualToggle.set(!this.globalService.isManualToggle());
    this.globalService.collapsed.set(!this.globalService.collapsed());
  }

  logOut() {
    this.globalService.currentUser.clearData();
  }

  getUserNameShort(name: string){
    // return name.split(/\s+/)[0].charAt(0) + (name.split(/\s+/)[1] ? name.split(/\s+/)[1].charAt(0) : '') 
    const parts = name.trim().split(/\s+/);
    
    if (parts.length === 1) {
        // Single word - take first 2 letters
        return parts[0].slice(0, 2).toUpperCase();
    } else if (parts.length === 2) {
        // Two words - take first letter of each
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    } else {
        // Three or more words - take first letter of first and last words
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
  }
}