import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { JwtTokenAuthProvider } from '../jwt-token-auth/jwt-token-auth';

@Injectable({
  providedIn: 'root'
})
export class JwtTokenAuthGuardProvider implements CanActivate {

  constructor(public auth: JwtTokenAuthProvider) {}

  canActivate(): boolean {
    return this.auth.getAuthenticationState();
  }

}