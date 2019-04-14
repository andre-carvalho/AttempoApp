import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
//import { Base64 } from '@ionic-native/base64/ngx';
import { Crop } from '@ionic-native/crop/ngx';
import { ImagePicker } from '@ionic-native/image-picker/ngx';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { catchError, finalize } from 'rxjs/operators';


/*
  Generated class for the LocationsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable({
  providedIn: 'root'
})
export class LocationsProvider {

  // default API URL
  //private API_URL = '35.231.50.207';
  private API_URL = '192.168.1.121:5000';

  // keys in storage that should ignored in this class.
  private keys=['access_token','api_url'];

  private uploadView:any;

  constructor(private imagePicker: ImagePicker,
    private crop: Crop,
    private transfer: FileTransfer,
    private storage: Storage,
    public http: HttpClient,
    private datepipe: DatePipe) {
    
    this.storage.get('api_url')
      .then((url: string) => {
        this.API_URL=(url && url!="")?(url):(this.API_URL);
      })
      .catch(() => {
        console.log('Configure uma URL para envio dos dados.');
      });
  }

  public setServerURL(url: string) {
    url=url.replace(/https:\/\/|http:\/\//gi, "");
    this.API_URL=url;
    this.storage.set('api_url', url);
  }

  public getServerURL() {
    return this.API_URL;
  }

  public insert(location: Location) {
    let key = this.datepipe.transform(new Date(), "ddMMyyyyHHmmss");
    location.timeref = new Date();
    if(!location.description){
      location.description='Sem descrição.';
    }
    return this.save(key, location);
  }

  public update(key: string, location: Location) {
    return this.save(key, location);
  }

  private save(key: string, location: Location) {
    return this.storage.set(key, location);
  }

  public remove(key: string) {
    return this.storage.remove(key);
  }

  public async getAll() {

    let locations: LocationList[] = [];

    try {
      await this.storage.forEach((value: Location, key: string, iterationNumber: Number) => {
        if (this.keys.indexOf(key)<0) {
          let location = new LocationList();
          location.key = key;
          location.location = value;
          locations.push(location);
        }
      });
      return Promise.resolve(locations);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  // public sendToServer(location: Location) {
  //   if(location.photo.startsWith('file')) {
  //     try {
  //       return this.uploadPhoto(location);
  //     }
  //     catch (err) {
  //       console.log(err);
  //     }
  //   }
  // }

  public async postData(formData: FormData) {
    let url = 'http://' + this.API_URL + '/locations';
    return this.http.post<boolean>(url, formData);
  }

  uploadSuccess(serverResponse:any) {
    console.log('Finalise upload call with error:'+serverResponse);
    this.uploadView.uploadSuccess(serverResponse);
  }

  uploadError(serverResponse:any) {
    console.log('Finalise upload call with error:'+serverResponse);
    return this.uploadView.uploadError(serverResponse);
  }

  uploadCommon() {
    console.log('Finalise upload call.');
  }

  private uploadPhoto(location: any) {
    let photo=location.photo;
    const fileTransfer: FileTransferObject = this.transfer.create();
    
    // let headers = new HttpHeaders().set('Content-Type', 'multipart/form-data');
    // //headers.append('Authorization','Bearer ' + token);
    // headers.append('Access-Control-Allow-Origin' , '*');
    // headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    // headers.append('Accept','application/json');

    const uploadOpts: FileUploadOptions = {
        fileKey: 'file',
        fileName: photo.substr(photo.lastIndexOf('/') + 1)
    };

    let url = 'http://' + this.API_URL + '/locations';

    return fileTransfer.upload(photo, url, uploadOpts);
      // .then((data) => {
      //   console.log(data);
      //   //this.respData = JSON.parse(data.response);
      //   console.log(JSON.parse(data.response));
      //   //this.fileUrl = this.respData.fileUrl;
      // }, (err) => {
      //   console.log(err);
      // });
  }


  private postDataToServer(location: any, photo: string) {

    let headers = new HttpHeaders().set('Content-Type', 'multipart/form-data');
    //headers.append('Authorization','Bearer ' + token);
    headers.append('Access-Control-Allow-Origin' , '*');
    headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    headers.append('Accept','application/json');

    let url = 'http://' + this.API_URL + '/locations';

    let data = {
      'description':location.description,
      'lat':location.lat,
      'lng':location.lng,
      'datetime':location.timeref,
      'photo':photo
    }

    return new Promise((resolve, reject) => {
      this.http.post(url, data, { headers:headers })
        .subscribe(res => {
          resolve(res);
        }, (err) => {
          reject(err);
        });
    });

  }

  cropUpload() {
    this.imagePicker.getPictures({ maximumImagesCount: 1, outputType: 0 }).then((results) => {
      for (let i = 0; i < results.length; i++) {
          console.log('Image URI: ' + results[i]);
          this.crop.crop(results[i], { quality: 100 })
            .then(
              newImage => {
                console.log('new image path is: ' + newImage);
                const fileTransfer: FileTransferObject = this.transfer.create();
                const uploadOpts: FileUploadOptions = {
                   fileKey: 'data',
                   fileName: newImage.substr(newImage.lastIndexOf('/') + 1)
                };

                let url = 'http://' + this.API_URL + '/locations';
  
                fileTransfer.upload(newImage, url, uploadOpts)
                 .then((data) => {
                   console.log(data);
                   //this.respData = JSON.parse(data.response);
                   console.log(JSON.parse(data.response));
                   //this.fileUrl = this.respData.fileUrl;
                 }, (err) => {
                   console.log(err);
                 });
              },
              error => console.error('Error cropping image', error)
            );
      }
    }, (err) => { console.log(err); });
  }
}

export class Location {
  lat: number;
  lng: number;
  description: string;
  photo: string;
  photoURI: string;
  timeref: Date;
  send: boolean;
}

export class LocationList {
  key: string;
  location: Location;
}
