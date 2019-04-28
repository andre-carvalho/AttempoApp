import { Injectable } from '@angular/core';
 
@Injectable({
  providedIn: 'root'
})
export class DataService {
 
  private data = [];
 
  constructor() { }
 
  setData(key:string, data:any) {
    this.data[key] = data;
  }
 
  getData(key:string) {
    return this.data[key];
  }
}