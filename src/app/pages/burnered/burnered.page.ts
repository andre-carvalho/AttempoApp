import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-burnered',
  templateUrl: './burnered.page.html',
  styleUrls: ['./burnered.page.scss'],
})
export class BurneredPage implements OnInit {

  constructor(
    private alertCtrl: AlertController,
    private router: Router) {
  }

  ngOnInit() {
  }

  async presentAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Para informar uma ocorrência.',
      subHeader: 'Tire uma foto, capture sua localização e envie para o sistema de alertas.',
      buttons: ['ok']
    });
    alert.present();
  }

  goToInfo() {
    this.presentAlert();
  }

  goToMap() {
    this.router.navigate(['/map'], {queryParams:{startCamera:false}})
  }
  
  goToCamera() {
    this.router.navigate(['/locations'], {queryParams:{startCamera:true}})
  }

  goToEdit() {
    this.router.navigate(['/locations']);
  }

  sendDataToServer() {

  }

  goToLocations() {
    this.router.navigate(['/locations'], {queryParams:{
      currentLat: 'não definido',
      currentLng: 'não definido',
      startCamera: true
    }});
  }
}
