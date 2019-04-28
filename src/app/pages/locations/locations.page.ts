import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AlertController, ToastController, MenuController } from '@ionic/angular';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { LocationsProvider, Location, LocationItem } from '../../services/locations/locations';
import { JwtTokenAuthProvider } from '../../services/jwt-token-auth/jwt-token-auth';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.page.html',
  styleUrls: ['./locations.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationsPage implements OnInit {

  locations: LocationItem[];
  model: Location;
  key: string;
  public currentLat: any;
  public currentLng: any;
  public startCamera: any;
  options: CameraOptions = {
    quality: 90,
    destinationType: this.camera.DestinationType.FILE_URI,
    sourceType: this.camera.PictureSourceType.CAMERA, //Source is camera
    allowEdit: false, // Allow user to edit before saving
    mediaType: this.camera.MediaType.PICTURE,
    encodingType: this.camera.EncodingType.JPEG, // Save as JPEG
    saveToPhotoAlbum: true, // Album save option
    correctOrientation: true // Camera orientation  
  };

  constructor(private locationsProvider: LocationsProvider,
    private camera: Camera, public geolocation: Geolocation,
    private toastController: ToastController, private alertCtrl: AlertController,
    private authService: JwtTokenAuthProvider,
    private route: ActivatedRoute,
    private router: Router,
    private menu: MenuController) {
      console.log('call constructor');
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 1700,
      position: 'bottom',
      showCloseButton: false,
    });
    toast.present();
  }

  /**
   * To display alerts with simple message.
   * @param msg Message string
   */
  private async showAlert(msg: string, headerMsg: string) {
    const alert = await this.alertCtrl.create({
      message: msg,
      header: headerMsg,
      buttons: ['OK']
    });
    alert.present();
  }

  async presentConfigAlert() {
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
          handler: () => {
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
      .subscribe(params => {
        console.log(params); // print all parameters

        this.currentLat = +params.currentLat;
        this.currentLng = +params.currentLng;
        this.startCamera = params.startCamera==="true";
        if(params.partialModel==="true") {
          this.restorePartialLocation();
        }else{
          this.createNewLocation();
        }
        this.reloadLocations();

        if(this.startCamera) {
          this.takePicture(0);
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
      // set a default picture to fill the photo position
      this.model.photoURI="assets/shapes.svg";
    }
  }

  removeLocation(item: LocationItem) {
    this.locationsProvider.remove(item.key)
      .then(() => {
        // removing from array of itens
        var index = this.locations.indexOf(item);
        this.locations.splice(index, 1);
        this.presentToast('Ocorrência removida.');
      })
  }

  openNewCardTools() {
    this.menu.enable(true, 'newCardTools');
    this.menu.open('newCardTools');
  }

  /**
   * Take or choose a picture from one provided sources.
   * @param source The number base on picture source types from Camera.
   * PHOTOLIBRARY: 0
   * CAMERA: 1
   * SAVEDPHOTOALBUM: 2
   */
  takePicture(source:number) {
    this.menu.close('newCardTools');
    if(source<0 || source>2){
      throw Error('The parameter "source" is out of range.');
    }
    this.options.sourceType=source;
    this.camera.getPicture(this.options).then((imageData) => {
      this.model.photo = imageData;
      this.model.photoURI = (<any>window).Ionic.WebView.convertFileSrc(imageData);
     }).catch((error) => {
      console.log('Error on taking photo', error);
      this.presentToast('Falhou ao acionar a camera de seu dispositivo.');
     });
  }

  goToMap() {
    this.menu.close('newCardTools');
    // Store the partial data for current template to use when user return from map
    this.savePartialLocation();
  }

  catchLocation() {
    let locationOptions = {timeout: 10000, enableHighAccuracy: true};

    this.geolocation.getCurrentPosition(locationOptions).then((position) => {

      this.model.lat = +(position.coords.latitude).toFixed(6);
      this.model.lng = +(position.coords.longitude).toFixed(6);

    }).catch((error) => {
      console.log('Error getting location', error);
      this.presentToast('Falhou ao capturar sua localização.');
    });
  }

  public save() {
    this.saveLocation()
      .then(() => {
        this.presentToast('Ocorrência gravada.');
        this.model=undefined;
        this.createNewLocation();
        this.reloadLocations();
        this.catchLocation();
      })
      .catch(() => {
        this.presentToast('Erro ao gravar a ocorrência.');
      });
  }

  private saveLocation() {
    this.menu.close('newCardTools');
    return this.locationsProvider.insert(this.model);
  }

  private savePartialLocation() {
    this.locationsProvider.savePartial("partial", this.model)
    .then(() => {
      // reirect to map
      this.router.navigate(['/map'], {queryParams:{partialModel:true}});
    })
    .catch(() => {
      console.log('Fail to store partial data.');
      this.router.navigate(['/map'], {queryParams:{partialModel:false}});
    });
  }

  private restorePartialLocation() {
    this.locationsProvider.getPartial("partial")
    .then((model) => {
      this.model=model;
      this.locationsProvider.remove("partial");
    })
    .catch(() => {
      console.log('Fail to restore partial data.');
    });
  }

  public sendDataToServer(item: LocationItem) {
    
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
    this.presentConfigAlert();
  }

  private sendToServer(location: Location, key: string) {
    location.sending=true;
    if(location.photo && location.photo.startsWith('file')) {
      try {
        this.uploadData(location, key);
      }
      catch (err) {
        location.sending=false;
        this.presentToast('Tentativa de envio falhou.');
        console.log(err);
      }
    }else{
      location.sending=false;
      this.showAlert('Ocorrências sem foto não podem ser enviadas ao servidor', 'Atenção');
    }
  }
  
  private uploadData(location: Location, key: string) {
    window['resolveLocalFileSystemURL'](location.photo,
      entry => {
        entry['file']( (file:any) => this.readFile(file,location,key));
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

  private readFile(file: any, location:Location, key: string) {
    const reader = new FileReader();
    // prepare location Object to send to server
    const jsonLocation:string = this.prepareLocation(location);
    reader.onloadend = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {type: file.type});
      formData.append('file', imgBlob, file.name);
      formData.append('json_data', jsonLocation);
      this.locationsProvider.postData(formData)
      .then((data) => {
        data.subscribe((response)=>{
          this.uploadSuccess(response, location, key);
        },(err)=>{
          this.uploadError(err, location);
        });
      }, (err) => {
        this.uploadError(err, location);
      });
    };
    reader.readAsArrayBuffer(file);
  }

  private uploadSuccess(response:any, location:Location, key: string) {
    console.log(response);
    if(response.status=='completed') {
      location.sending=false;
      location.send=true;
      this.locationsProvider.update(key, location);
      this.presentToast('Upload com sucesso.');
    }
  }

  private uploadError(error:any, location:Location) {
    location.sending=false;
    location.send=false;
    console.log(error);
    this.presentToast('Erro ao enviar dados.');
  }

}
