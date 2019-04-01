import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Storage } from '@ionic/storage';
import { tap, catchError, map } from 'rxjs/operators';
import { BehaviorSubject, throwError } from 'rxjs';

// The name used as key the token into localstarage
const TOKEN_KEY = 'access_token';
 
@Injectable({
  providedIn: 'root'
})
export class JwtTokenAuthProvider {
 
  private url:string = "http://127.0.0.1:5000";
  private user: any = null;
  private authenticationState: BehaviorSubject<boolean> = new BehaviorSubject(false);
 
  constructor(private http: HttpClient, private helper: JwtHelperService, private storage: Storage,
    private plt: Platform) {
    this.plt.ready().then(() => {
      this.checkToken();
    });
  }
 
  checkToken() {
    this.storage.get(TOKEN_KEY).then(token => {
      if (token) {
        let decoded = this.helper.decodeToken(token);
        let isExpired = this.helper.isTokenExpired(token);
 
        if (!isExpired) {
          this.user = decoded;
          this.authenticationState.next(true);
        } else {
          this.storage.remove(TOKEN_KEY);
        }
      }
    });
  }
 
  register(credentials: string) {
    credentials = JSON.stringify(credentials);
    var options = new HttpHeaders({'Content-Type':'application/json'});
    
    return this.http.post(`${this.url}/register`, credentials, {headers:options} ).pipe(
      catchError(e => {
        throw throwError(e);
      })
    );
  }
 
  /**
   * Call authenticator service to check the credentials and generate one JWT Token.
   * @param credentials The JSON with: {email:'string',password:'string'}
   */
  login(credentials: string) {
    credentials = JSON.stringify(credentials);
    var options = new HttpHeaders({'Content-Type':'application/json'});
    return this.http.post(`${this.url}/login`, credentials, {headers:options})
      .pipe(
        tap(res => {
          /*
          // format of response
          auth_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NTIyNjExMDgsImlhdCI6MTU1MjI1OTMwOCwic3ViIjoxfQ.PYkEv2POQTWWhsns-trtMeXJ7C1kHTuKzGDPnacAgXc"
          message: "Successfully logged in."
          status: "success"
          */
          this.storage.set(TOKEN_KEY, res['auth_token']);
          this.user = this.helper.decodeToken(res['auth_token']);
          this.authenticationState.next(true);
        }),
        catchError(e => {
          throw throwError(e);
        })
      );
  }
 
  logout() {
    //if(promise){catchError(e => {
    this.serverLogout().subscribe( (e:any) => {
      let status = e.status;
      if (status === "success") {
        this.storage.remove(TOKEN_KEY).then(() => {
          this.authenticationState.next(false);
        });
      }
    }, (e:any) => {
      this.authenticationState.next(false);
      throw throwError(e);
    });
  }

  serverLogout() {
    var options = new HttpHeaders(
      {'Content-Type':'application/json'}
    );
    this.storage.get(TOKEN_KEY).then(token => {
      if (token) {
        options.append('Authorization', token);
      }else{
        this.authenticationState.next(false);
      }
    });
    return this.http.get(`${this.url}/logout`, {headers:options}).pipe(
      catchError(e => {
        throw throwError(e);
      })
    );
  }
 
  /**
   * Asks for server if token still valid.
   */
  isAuthorized() {
    return this.storage.get(TOKEN_KEY).then(token => {
      if (token) {
        let options = new HttpHeaders(
          {
            'Content-Type':'application/json',
            'Authorization': 'Bearer '+token
          }
        );
        //options.append('Authorization', token);
        return this.http.get(`${this.url}/isAuthorized`, {headers:options}).pipe(
          map(data => {
            if (data === null) return throwError("null data");
            return data;
          }),
          catchError(e => {
            throw throwError(e);
          })
        );
      }else{
        // if don't have token, change authentication control to false.
        this.authenticationState.next(false);
      }
    });
    
  }
   
  isAuthenticated() {
    return this.authenticationState.value;
  }

  getUser() {
    return this.user;
  }
}
