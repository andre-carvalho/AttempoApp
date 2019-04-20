import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { LocationsProvider, Location, LocationList } from '../../services/locations/locations';
import { JwtTokenAuthProvider } from '../../services/jwt-token-auth/jwt-token-auth';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.page.html',
  styleUrls: ['./locations.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationsPage implements OnInit {

  locations: LocationList[];
  model: Location;
  key: string;
  public currentLat: any;
  public currentLng: any;
  public startCamera: any;
  options: CameraOptions = {
    quality: 80,
    destinationType: this.camera.DestinationType.FILE_URI,
    sourceType: this.camera.PictureSourceType.CAMERA, //Source is camera
    allowEdit: false, // Allow user to edit before saving
    mediaType: this.camera.MediaType.PICTURE,
    encodingType: this.camera.EncodingType.JPEG, // Save as JPEG
    saveToPhotoAlbum: true, // Album save opton
    correctOrientation: true // Camera orientation  
  };
  // targetWidth: 300,
  // targetHeight: 300,

  constructor(private locationsProvider: LocationsProvider,
    private camera: Camera, public geolocation: Geolocation,
    private toastController: ToastController, private alertCtrl: AlertController,
    private authService: JwtTokenAuthProvider,
    private route: ActivatedRoute) {
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: 'bottom',
      showCloseButton: false,
    });
    toast.present();
  }

  async presentAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Serviço para envio de dados',
      inputs: [
        {
          name: 'server_url',
          value: 'http://'+this.locationsProvider.getServerURL(),
          type: 'url'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Confirmar',
          handler: data => {
            if (data.server_url) {
              this.locationsProvider.setServerURL(data.server_url);
            } else {
              console.log('Input URL is undefined');
              return false;
            }
          }
        }
      ]
    });
    alert.present();
  }

  ngOnInit() {
    this.route.queryParams
      //.filter(params => params.currentLat)
      .subscribe(params => {
        console.log(params); // print all prarameters

        this.currentLat = params.currentLat;
        this.currentLng = params.currentLng;
        this.startCamera = params.startCamera;
   
      this.createNewLocation();
      this.reloadLocations();

      if(this.startCamera) {
        console.log('Start camera after init page...');
        this.takePicture();
      }
      if(!this.currentLat || !this.currentLng) {
        this.catchLocation();
      }else{
        this.model.lat = (+(+this.currentLat).toFixed(4));
        this.model.lng = (+(+this.currentLng).toFixed(4));
      }
    });
  }

  reloadLocations() {
    if(this.locationsProvider) {
      this.locationsProvider.getAll()
        .then((result) => {
          this.locations = result;
          this.locations.reverse();
        });
    }
  }

  createNewLocation() {
    if(!this.model) {
      this.model = new Location();
      let user=this.authService.getUser();
      this.model.userid=user.sub;// sub in JWT is user as ID
    }
  }

  removeLocation(item: LocationList) {
    this.locationsProvider.remove(item.key)
      .then(() => {
        // removing from array of itens
        var index = this.locations.indexOf(item);
        this.locations.splice(index, 1);
        this.presentToast('Local removido.');
      })
  }

  takePicture() {
    this.camera.getPicture(this.options).then((imageData) => {
      this.model.photo = imageData;
      this.model.photoURI = (<any>window).Ionic.WebView.convertFileSrc(imageData);
     }).catch((error) => {
      console.log('Error on taking photo', error);
      this.presentToast('Falhou ao acionar a camera de seu dispositivo.');
     });
  }

  prepareHeader(img) {
    if(img.startsWith('file')) {
      return img;
    }else{
      return 'data:image/png;base64,'+img;
    }
  }

  catchLocation() {
    let locationOptions = {timeout: 10000, enableHighAccuracy: true};

    this.geolocation.getCurrentPosition(locationOptions).then((position) => {

      this.model.lat = +(position.coords.latitude).toFixed(4);
      this.model.lng = +(position.coords.longitude).toFixed(4);

    }).catch((error) => {
      console.log('Error getting location', error);
      this.presentToast('Falhou ao capturar sua localização.');
    });
  }

  public save() {
    this.saveLocation()
      .then(() => {
        this.presentToast('Local salvo.');
        this.model=undefined;
        this.createNewLocation();
        this.reloadLocations();
        this.catchLocation();
      })
      .catch(() => {
        this.presentToast('Erro ao salvar o local.');
      });
  }

  private saveLocation() {
    return this.locationsProvider.insert(this.model);
  }

  public sendDataToServer(item: LocationList) {
    
    if(item == undefined) {
      let l = this.locations.length;
      for (let i=0;i<l;i++) {
        if(!this.locations[i].location.send) {
          this.sendToServer(this.locations[i].location, this.locations[i].key);
        }
      }
    }else{
      this.sendToServer(item.location, item.key);
    }
    
  }

  public setServerURL() {
    this.presentAlert();
  }

  // private sendToServer(location: Location, key: string) {
  //   this.locationsProvider.sendToServer(location)
  //     .then(() => {
  //       //location.send=true;
  //       //this.locationsProvider.update(key, location);
  //       this.presentToast('Upload com sucesso.');
  //     })
  //     .catch(() => {
  //       this.presentToast('Erro ao enviar dados.');
  //     });
  // }

  private sendToServer(location: Location, key: string) {
    if(location.photo.startsWith('file')) {
      try {
        this.uploadPhoto(location);
      }
      catch (err) {
        console.log(err);
      }
    }
  }
  
  private uploadPhoto(location: Location) {
    // this.error = null;
    // this.loading = await this.loadingCtrl.create({
    //   message: 'Uploading...'
    // });

    // this.loading.present();

    // prepare location Object to send to server
    let jsonLocation:string = this.prepareLocation(location);

    window['resolveLocalFileSystemURL'](location.photo,
      entry => {
        entry['file']( (file:any) => this.readFile(file,jsonLocation));
      });
  }

  private cloneLocation(ll:Location){
    let l:Location=new Location();
    l.lat=ll.lat;
    l.lng=ll.lng;
    l.description=ll.description;
    l.timeref=ll.timeref;
    l.userid=ll.userid;
    return l;
  }
  
  private prepareLocation(location: Location): string {
    let l = this.cloneLocation(location);
    return JSON.stringify(l);
  }

  private readFile(file: any, jsonLocation:string) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {type: file.type});
      formData.append('file', imgBlob, file.name);
      formData.append('json_data', jsonLocation);
      this.locationsProvider.postData(formData)
      .then((data) => {
        data.subscribe((response)=>{
          console.log(response);
          //this.respData = JSON.parse(data.response);
          this.uploadSuccess(response);
        },(err)=>{
          console.log(err);
          this.uploadError(err);
        });
      }, (err) => {
        console.log(err);
        this.uploadError(err);
      });
    };
    reader.readAsArrayBuffer(file);
  }

  private uploadSuccess(response:any) {
    // location.send=true;
    // this.locationsProvider.update(key, location);
    this.presentToast('Upload com sucesso.');
  }

  private uploadError(response:any) {
    this.presentToast('Erro ao enviar dados.');
  }

}
