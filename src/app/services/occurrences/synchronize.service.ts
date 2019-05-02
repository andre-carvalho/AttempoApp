import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Point, Points } from '../../entities/point';
import { JwtTokenAuthProvider } from '../jwt-token-auth/jwt-token-auth';
import * as io from 'socket.io-client';
import { OccurrenceItemSerializable, OccurrenceItem } from '../../entities/occurrence';

const SERVER_URL = 'http://192.168.1.121:8001';
const namespace = '/occurrences';

@Injectable({
  providedIn: 'root'
})
export class SynchronizeService {

  private token:string;
  private socket:any;
  private connected:boolean=false;

  constructor(private authService: JwtTokenAuthProvider) { }

  public async initSocket(): Promise<void> {
    this.token = await this.authService.getToken();
    this.socket = io(SERVER_URL+namespace, {
      query: {
        token: this.token
      }
    });

    this.socket.connect();
    this.socket.on('connect', () => {
      this.connected=true;
    });
  }

  public disconnect() {
    this.socket.emit('disconnect');
    this.connected=false;
  }

  public isConnected() {
    return this.connected;
  }

  public sendMyCoord(point: Point): void {
    this.socket.emit('userposition', point);
  }

  /**
   * Receive points of other users near to me.
   */
  public onNewPoints(): Observable<Points> {
    return new Observable<Points>(observer => {
      this.socket.on('nearpoints', (points: Points) => observer.next(points));
    });
  }

  public sendNewOccurrence(occurrenceItem: OccurrenceItem): void {
    let jsonOccurrence = OccurrenceItemSerializable.serialize(occurrenceItem);
    this.socket.emit('newoccurrence', jsonOccurrence);
  }

  /**
   * Receive broadcast from server with new OccurrenceItem from other users.
   */
  public onNewOccurrence(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('occurrencebroadcast', (response: any) => observer.next(response.occurrence));
    });
  }
}