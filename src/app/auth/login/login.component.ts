import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { GlobalService } from '../../shared/services/global.service';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [MaterialModule, FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent {

  login_image: string = '/images/admin-home.jpg';

  @ViewChild('user_name_input') user_name_input !: ElementRef;
  user_name = new FormControl<string | null>(null, [Validators.required]);
  password = new FormControl<string | null>(null, [Validators.required]);
  password_visible: boolean = false;
  rememberMe: boolean = false;

  invalidStatus: boolean = false;
  invalidMsg: string = 'Something went wrong!';

  constructor(
    private globalService: GlobalService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private authService: AuthService
  ) {

  }  

  login() {

    if (this.user_name.invalid || this.password.invalid) {
      this.invalidStatus = true;
      this.invalidMsg = "Invalid user name or password";
      return;
    }

    let user = {
      user_name: this.user_name.value,
      password: this.password.value,
      rememberme: this.rememberMe
    }

    this.spinner.show();

    this.authService.login(user).subscribe(res => {
      if (!res.error) {
        this.globalService.currentUser.setData(res.result);
        // this.globalService.isLogin.setData(true);
        this.router.navigate(['/dashboard']);
        this.spinner.hide();
      } else {
        this.invalidStatus = true;
        if (res.error.details) this.invalidMsg = res.error.details;
        this.spinner.hide();
      }
    });

  }

  forgotPassword() {
    // Perform forgot password logic here
    console.log('Forgot password button clicked');
  }

  register() {
    // Perform register logic here
    console.log('Register button clicked');
  }
}
