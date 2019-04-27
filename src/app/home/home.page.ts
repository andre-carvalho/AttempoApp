import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JwtTokenAuthProvider } from '../services/jwt-token-auth/jwt-token-auth';
import { AlertController, ToastController } from '@ionic/angular'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePage implements OnInit {
  
  private credentialsForm:FormGroup;
  private waitingResponse:boolean;

  constructor(private router: Router,
    private authService: JwtTokenAuthProvider,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private alertController: AlertController) {
      this.waitingResponse=false;
  }

  ngOnInit() {
    // TODO: enable the gif loader.

    if(this.authService.isAuthenticated()){
      // disable progress bar
      this.waitingResponse=false;

      this.goToBurnered();
    }else{
      // enable progress bar
      this.waitingResponse=true;

      this.authService.isAuthorized().then( (serverAuthorize) => {
        if(serverAuthorize){
          serverAuthorize.subscribe( (resp:any) => {
            // disable progress bar
            this.waitingResponse=false;

            if(resp && resp.status){
              this.goToBurnered();
            }else{
              this.presentToast('Autenticação expirou, faça login.');
            }
          }, (error)=> {
            // disable progress bar
            this.waitingResponse=false;

            if(error===101){// missing token
              this.presentToast('Faça login para iniciar.');
            }
            console.log(error);
          });
        }
      }, (HTTPCodeError) => {
        // disable progress bar
        this.waitingResponse=false;

        if (HTTPCodeError === 401) {//HTTP 401 Unauthorized
          this.showAlert('Não autorizado.', 'Falha');
        }
        if (HTTPCodeError === 403) {
          this.presentToast('Autorização negada, faça login.');
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
    // enable progress bar
    this.waitingResponse=true;

    this.authService.login(this.credentialsForm.value).subscribe(
      (loginstatus:any) => {
        // disable progress bar
        this.waitingResponse=false;

        if(loginstatus.status==='success'){
          this.goToBurnered();
        }else{
          this.presentToast('O login falhou.');
        }
      },
      err => {
        // disable progress bar
        this.waitingResponse=false;

        if (err.code === 401) {
          this.presentToast('A comunicação com o servidor falhou.');
        }else if (err.code === 403) {
          this.presentToast('Autorização negada, faça login.');
        }else{
          this.presentToast('Falha na comunicação com o servidor.');
        }
      }
    );
  }

  goToBurnered() {
    this.router.navigate(['burnered']);
  }

  register() {
    // enable progress bar
    this.waitingResponse=true;

    this.authService.register(this.credentialsForm.value).subscribe( (registerstatus: any) => {
      // disable progress bar
      this.waitingResponse=false;
      
      console.log('Message:'+registerstatus.message +'\nStatus:'+ registerstatus.status);
      // TODO: When server API already send the email to new registered Users 
      // them we redirect user to the Information page tell they about the need of validate email.

      // Call Login to automatically login the new user
      // TODO: Disable this because we send a e-mail validation to verify the email account
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
  private async showAlert(msg: string, headerMsg: string) {
    const alert = await this.alertController.create({
      message: msg,
      header: headerMsg,
      buttons: ['OK']
    });
    alert.present();
  }

 /**
   * To display Toast messages with simple text.
   * @param msg Message string
   */
  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1700,
      position: 'bottom',
      showCloseButton: false,
    });
    toast.present();
  }

}