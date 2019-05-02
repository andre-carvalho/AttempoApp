import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtTokenAuthProvider } from '../jwt-token-auth/jwt-token-auth';
import { throwError, Observable } from 'rxjs';
import { Occurrence, OccurrenceItem } from '../../entities/occurrence';

@Injectable({
  providedIn: 'root'
})
export class OccurrencesProvider {

  // default API URL
  //private API_URL = '35.231.50.207';
  private API_URL = '192.168.1.121:5001';

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

  public insert(occurrence: Occurrence) {
    let key = this.datepipe.transform(new Date(), "ddMMyyyyHHmmss");
    occurrence.timeref = new Date();
    if(!occurrence.description){
      occurrence.description='Sem descrição.';
    }
    return this.save(key, occurrence);
  }

  public update(key: string, occurrence: Occurrence) {
    return this.save(key, occurrence);
  }

  private save(key: string, occurrence: Occurrence) {
    return this.storage.set(key, occurrence);
  }

  public savePartial(key: string, occurrence: Occurrence) {
    return this.storage.set(key, occurrence);
  }

  public getPartial(key: string) {
    return this.storage.get(key);
  }

  public remove(key: string) {
    return this.storage.remove(key);
  }

  public async getAll() {

    let occurrences: OccurrenceItem[] = [];

    try {
      await this.storage.forEach((value: Occurrence, key: string, iterationNumber: Number) => {
        if (this.keys.indexOf(key)<0) {
          let occurrence = new OccurrenceItem();
          occurrence.key = key;
          occurrence.occurrence = value;
          occurrences.push(occurrence);
        }
      });
      return Promise.resolve(occurrences);
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  public async postData(formData: FormData) {
    let url = 'http://' + this.API_URL + '/occurrences';
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
