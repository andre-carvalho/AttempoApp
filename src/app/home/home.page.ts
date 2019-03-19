import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JwtTokenAuthProvider } from '../services/jwt-token-auth/jwt-token-auth'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  
  private credentialsForm:FormGroup;

  constructor(private router: Router,
    private authService: JwtTokenAuthProvider,
    private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.credentialsForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    this.authService.login(this.credentialsForm.value).subscribe(loginstatus => {
      console.log(loginstatus.toString());
      this.goToBurnered();
    });
  }

  goToBurnered() {
    this.router.navigate(['/burnered'])
  }

  register() {
    this.authService.register(this.credentialsForm.value).subscribe(registerstatus => {
      console.log(registerstatus.toString());
      // TODO: When server API already send the email to new registered Users 
      // them we redirect user to the Information page tell they about the need of validate email.

      // Call Login to automatically login the new user
      this.authService.login(this.credentialsForm.value).subscribe(loginstatus => {
        console.log(loginstatus.toString());
        this.goToBurnered();
      });
    });
  }

}