import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JwtTokenAuthProvider } from '../services/jwt-token-auth/jwt-token-auth';
import { AlertController } from '@ionic/angular'
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePage implements OnInit {
  
  private credentialsForm:FormGroup;

  constructor(private router: Router,
    private authService: JwtTokenAuthProvider,
    private formBuilder: FormBuilder,
    private alertController: AlertController) {
  }

  ngOnInit() {
    // TODO: enable the gif loader.

    if(this.authService.isAuthenticated()){
      this.goToBurnered();
    }else{

      this.authService.isAuthorized().then( (serverAuthorize) => {
        if(serverAuthorize){
          serverAuthorize.subscribe( (resp:any) => {
            if(resp && resp.status){
              this.goToBurnered();
            }
          });
        }
      }, (HTTPCodeError) => {
        // TODO: disable the gif loader.
        if (HTTPCodeError === 401) {
          this.showAlert('A comunicação com o servidor falhou.', 'Error');
        }
        if (HTTPCodeError === 403) {
          this.showAlert('Autorização negada, faça login.', 'Error');
        }
        console.log(HTTPCodeError);
      });
    }

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
    this.router.navigate(['burnered']);
  }

  register() {
    this.authService.register(this.credentialsForm.value).subscribe( (registerstatus: any) => {
      console.log('Message:'+registerstatus.message +'\nStatus:'+ registerstatus.status);
      // TODO: When server API already send the email to new registered Users 
      // them we redirect user to the Information page tell they about the need of validate email.

      // Call Login to automatically login the new user
      this.authService.login(this.credentialsForm.value).subscribe( (loginstatus:any) => {
        console.log('Message:' + loginstatus.message + '\nStatus:' +loginstatus.status);
        this.goToBurnered();
      });
    });
  }

  /**
   * To display alerts with simple message.
   * @param msg Message string
   */
  private showAlert(msg: string, headerMsg: string) {
    let alert = this.alertController.create({
      message: msg,
      header: headerMsg,
      buttons: ['OK']
    });
    alert.then(alert => alert.present());
  }

}