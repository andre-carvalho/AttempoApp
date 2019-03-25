import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Base64 } from '@ionic-native/base64/ngx';


/*
  Generated class for the LocationsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable({
  providedIn: 'root'
})
export class LocationsProvider {

  private API_URL = '35.231.50.207';

  constructor( private base64: Base64, private storage: Storage, public http: HttpClient,private datepipe: DatePipe) {
    
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
        if (key != "api_url") {
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

  public async sendToServer(location: Location) {
    if(location.photo.startsWith('file')) {
      try {
        const base64File = await this.base64.encodeFile(location.photo);
        let photo = base64File.replace('data:image/*;charset=utf-8;base64,', '');
        return this.postDataToServer(location, photo);
      }
      catch (err) {
        console.log(err);
      }
    }else {
      return this.postDataToServer(location, location.photo);
    }
  }

  private postDataToServer(location: any, photo: string) {

    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    headers.append('Access-Control-Allow-Origin' , '*');
    headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    headers.append('Accept','application/json');

    let url = 'http://' + this.API_URL + '/locations';

    let data = {
      'description':location.description,
      'lat':location.lat,
      'lng':location.lng,
      'datetime':location.timeref.toISOString(),
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
}

export class Location {
  lat: number;
  lng: number;
  description: string;
  photo: string;
  timeref: Date;
  send: boolean;
}

export class LocationList {
  key: string;
  location: Location;
}
