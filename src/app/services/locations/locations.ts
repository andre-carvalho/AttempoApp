import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtTokenAuthProvider } from '../jwt-token-auth/jwt-token-auth';
import { throwError, Observable } from 'rxjs';

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
  private keys=['access_token','api_url','partial'];

  constructor(
    private storage: Storage,
    public http: HttpClient,
    private authService: JwtTokenAuthProvider,
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

  public savePartial(key: string, location: Location) {
    return this.storage.set(key, location);
  }

  public getPartial(key: string) {
    return this.storage.get(key);
  }

  public remove(key: string) {
    return this.storage.remove(key);
  }

  public async getAll() {

    let locations: LocationItem[] = [];

    try {
      await this.storage.forEach((value: Location, key: string, iterationNumber: Number) => {
        if (this.keys.indexOf(key)<0) {
          let location = new LocationItem();
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

  public async postData(formData: FormData) {
    let url = 'http://' + this.API_URL + '/locations';
    const awaitToken = this.authService.getToken();
    if (awaitToken) {
      return awaitToken.then( (token) => {
        formData.append('Authorization', token);
        let options = new HttpHeaders({
          'Authorization': 'Bearer ' + token
        });
        return this.http.post(url, formData, { headers:options });
      });
    }else{
      return new Promise<Observable<Object>>( ()=>{return throwError(new Error('{"status":false,"message":"Not found token."}'));} );
    }
  }
}

export class Location {
  lat: number;
  lng: number;
  description: string;
  photo: string;
  photoURI: string;
  timeref: Date;
  send: boolean=false;
  sending: boolean=false;
  userid: number;
}

export class LocationItem {
  key: string;
  location: Location;
}
