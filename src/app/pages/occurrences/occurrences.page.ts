import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AlertController, ToastController, MenuController } from '@ionic/angular';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { OccurrencesProvider } from '../../services/occurrences/occurrences';
import { Occurrence, OccurrenceItem } from '../../entities/occurrence';
import { DataService } from '../../services/routing-data/data.service';
import { JwtTokenAuthProvider } from '../../services/jwt-token-auth/jwt-token-auth';
import { Router } from '@angular/router';
import { SynchronizeService } from 'src/app/services/occurrences/synchronize.service';

@Component({
  selector: 'app-occurrences',
  templateUrl: './occurrences.page.html',
  styleUrls: ['./occurrences.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OccurrencesPage implements OnInit {

  occurrences: OccurrenceItem[];
  model: Occurrence;
  key: string;
  syncURL: string;
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

  constructor(private occurrencesProvider: OccurrencesProvider,
    private camera: Camera, public geolocation: Geolocation,
    private toastController: ToastController, private alertCtrl: AlertController,
    private authService: JwtTokenAuthProvider,
    private router: Router,
    private routingData: DataService,
    private menu: MenuController,
    private syncService: SynchronizeService) {
  }

  ngOnInit() {
    this.syncURL='http://'+this.occurrencesProvider.getServerURL();
  }

  ionViewWillEnter() {
    console.log('call OccurrencesPage ionViewWillEnter');

    let mapCoord = this.routingData.getData('map_coord');
    this.currentLat = (mapCoord)?(+mapCoord.lat):(0);
    this.currentLng = (mapCoord)?(+mapCoord.lng):(0);
    
    // get tag control from routing data service
    let partialModel = this.routingData.getData('partial_model');
    if(partialModel) {
      this.restorePartialOccurrence();
    }else{
      this.createNewOccurrence();
    }

    this.startCamera = this.routingData.getData('start_camera');
    if(this.startCamera) {
      this.takePicture(0);
    }

    // to populate the occurrences.page view with cards of stored occurrences
    this.reloadOccurrences();
  }

  openConfig() {
    this.menu.enable(true, 'mainConfig');
    this.menu.open('mainConfig');
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

  storeSyncURL(){
    this.occurrencesProvider.setServerURL(this.syncURL);
  }

  reloadOccurrences() {
    if(this.occurrencesProvider) {
      this.occurrencesProvider.getAll()
        .then((result) => {
          this.occurrences = result;
          this.occurrences.reverse();
        });
    }
  }

  createNewOccurrence() {
    if(!this.model) {
      this.model = new Occurrence();
      this.model.userid=this.authService.getUserID();
      this.setCoordsInModel();
      // set a default picture to fill the photo position
      this.model.photoURI="assets/imgs/default_picture.jpeg";
    }
  }

  removeOccurrence(item: OccurrenceItem) {
    this.occurrencesProvider.remove(item.key)
      .then(() => {
        // removing from array of itens
        var index = this.occurrences.indexOf(item);
        this.occurrences.splice(index, 1);
        this.presentToast('Ocorrência removida.');
      })
  }

  openNewCardTools() {
    this.menu.enable(true, 'newCardTools');
    this.menu.open('newCardTools');
  }

  openEachCardTools(l:OccurrenceItem) {
    this.menu.enable(true, l.key);
    this.menu.open(l.key);
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
    this.savePartialOccurrence();
  }

  catchOccurrence() {
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
    this.saveOccurrence()
      .then(() => {
        this.presentToast('Ocorrência gravada.');
        this.model=undefined;
        this.createNewOccurrence();
        this.reloadOccurrences();
      })
      .catch(() => {
        this.presentToast('Erro ao gravar a ocorrência.');
      });
  }

  private saveOccurrence() {
    this.menu.close('newCardTools');
    return this.occurrencesProvider.insert(this.model);
  }

  private savePartialOccurrence() {
    this.occurrencesProvider.savePartial("partial", this.model)
    .then(() => {
      // set tag control into routing data service
      this.routingData.setData('partial_model',true);
      // redirect to map
      this.router.navigate(['/map']);
    })
    .catch(() => {
      console.log('Fail to store partial data.');
      // set tag control into routing data service
      this.routingData.setData('partial_model',false);
      this.router.navigate(['/map']);
    });
  }

  private restorePartialOccurrence() {
    this.occurrencesProvider.getPartial("partial")
    .then((model) => {
      this.model=model;
      this.setCoordsInModel();
      this.occurrencesProvider.remove("partial");
      // set tag control into routing data service
      this.routingData.setData('partial_model',false);
    })
    .catch(() => {
      console.log('Fail to restore partial data.');
    });
  }

  private setCoordsInModel() {
    if(!this.currentLat || !this.currentLng) {
      this.catchOccurrence();
    }else{
      this.model.lat = (+(+this.currentLat).toFixed(6));
      this.model.lng = (+(+this.currentLng).toFixed(6));
    }
  }

  public sendDataToServer(item: OccurrenceItem) {

    this.menu.close(item.key);
    
    if(item == undefined) {
      let l = this.occurrences.length;
      for (let i=0;i<l;i++) {
        if(!this.occurrences[i].occurrence.send) {
          this.sendToServer(this.occurrences[i].occurrence, this.occurrences[i].key);
        }
      }
    }else{
      this.sendToServer(item.occurrence, item.key);
    }
    
  }

  private sendToServer(occurrence: Occurrence, key: string) {
    occurrence.sending=true;
    if(occurrence.photo && occurrence.photo.startsWith('file')) {
      try {
        this.uploadData(occurrence, key);
      }
      catch (err) {
        occurrence.sending=false;
        this.presentToast('Tentativa de envio falhou.');
        console.log(err);
      }
    }else{
      occurrence.sending=false;
      this.showAlert('Ocorrências sem foto não podem ser enviadas ao servidor', 'Atenção');
    }
  }
  
  private uploadData(occurrence: Occurrence, key: string) {
    window['resolveLocalFileSystemURL'](occurrence.photo,
      entry => {
        entry['file']( (file:any) => this.readFile(file,occurrence,key));
      });
  }

  private cloneOccurrence(ll:Occurrence){
    let l:Occurrence=new Occurrence();
    l.lat=ll.lat;
    l.lng=ll.lng;
    l.description=ll.description;
    l.timeref=ll.timeref;
    l.userid=ll.userid;
    return l;
  }
  
  private prepareOccurrence(occurrence: Occurrence): string {
    let l = this.cloneOccurrence(occurrence);
    return JSON.stringify(l);
  }

  private readFile(file: any, occurrence:Occurrence, key: string) {
    const reader = new FileReader();
    // prepare occurrence Object to send to server
    const jsonOccurrence:string = this.prepareOccurrence(occurrence);
    reader.onloadend = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {type: file.type});
      formData.append('file', imgBlob, file.name);
      formData.append('json_data', jsonOccurrence);
      this.occurrencesProvider.postData(formData)
      .then((data) => {
        data.subscribe((response)=>{
          this.uploadSuccess(response, occurrence, key);
        },(err)=>{
          this.uploadError(err, occurrence);
        });
      }, (err) => {
        this.uploadError(err, occurrence);
      });
    };
    reader.readAsArrayBuffer(file);
  }

  private uploadSuccess(response:any, occurrence:Occurrence, key: string) {
    console.log(response);
    if(response.status=='completed') {
      occurrence.sending=false;
      occurrence.send=true;
      this.occurrencesProvider.update(key, occurrence);
      this.presentToast('Upload com sucesso.');
      let occurrenceItem = new OccurrenceItem();
      occurrenceItem.key=key;
      occurrenceItem.occurrence=occurrence;
      // send via broadcast to other users.
      this.syncService.sendNewOccurrence(occurrenceItem);
    }
  }

  private uploadError(error:any, occurrence:Occurrence) {
    occurrence.sending=false;
    occurrence.send=false;
    console.log(error);
    this.presentToast('Erro ao enviar dados.');
  }

}
