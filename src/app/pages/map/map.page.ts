import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { OccurrencesProvider } from '../../services/occurrences/occurrences';
import { OccurrenceItem, OccurrenceItemSerializable } from '../../entities/occurrence';
import { environment } from '../../../environments/environment';
import { DataService } from '../../services/routing-data/data.service';
import { SynchronizeService } from '../../services/occurrences/synchronize.service';

declare var google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapPage implements OnInit, OnDestroy {

  @ViewChild('map_canvas') map_canvas:any;
  occurrences: OccurrenceItem[];
  map: any;
  markers: any;
  watchLocation: any;
  currentLocation: any;
  currentCoords: any;
  myMarkersFromSavedOccurrences: any;
  private locationOptions: any;
  // The Google API key is loaded from google-key.js file.
  private apiKey: any = environment.googleMapApiKey;
  public btColor: string = 'primary';
  private partialModel: boolean = false;
  private currentCoord: boolean = true;
  private gpsState: boolean = false;
  private eventsByOthers: boolean = false;
  private eventsByMe: boolean = false;
  occurrencesByOthers: OccurrenceItem[]=[];
  markersFromRemoteOccurrences: any;
  
  constructor(private alertCtrl: AlertController,
    private occurrencesProvider: OccurrencesProvider,
    private router: Router,
    public geolocation: Geolocation,
    private routingData: DataService,
    private syncService: SynchronizeService,
    private menu: MenuController) {
    
    /*load google map script dynamically if not loaded yet */
    if(!document.getElementById('googleMap')) {
      const script = document.createElement('script');
      script.id = 'googleMap';
      if (this.apiKey) {
          script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.apiKey;
      } else {
          script.src = 'https://maps.googleapis.com/maps/api/js?key=';
      }
      script.onload=(() => {
        this.startMapComponent();
      });
      document.head.appendChild(script);
    }
    
    this.markers = [];
    this.currentCoords = {'lat':0, 'lng':0};
    this.locationOptions = {timeout: 10000, enableHighAccuracy: true};
  }

  ngOnInit():void {

    if(document.getElementById('googleMap')) {
      let scripts = document.getElementsByTagName('script');
      let script = scripts.namedItem('googleMap');
      if(script.src!="") {
        if(!this.map_canvas){
          let mapCanvas=document.getElementById('map_canvas');
          if(!mapCanvas){
            const div = document.createElement('div');
            div.id = 'map_canvas';
            div.className="map_canvas";
            document.body.appendChild(div);
          }else{
            this.map_canvas = mapCanvas;
          }
        }
        this.startMapComponent();
      }
    }
  }

  ngOnDestroy(): void {
    if(this.watchLocation != undefined){
      this.watchLocation.unsubscribe();
    }
  }

  ionViewWillEnter() {
    // get tag control from routing data service
    this.partialModel = this.routingData.getData('partial_model');
    if(this.eventsByMe){
      this.reloadOccurrences();
    }else{
      // remove all markers from map that represents my occurrences.
      this.clearSavedMarkers();
    }
    // update behaviour of receive occurrences by sync service.
    this.toggleByOthers();
  }

  /* Initialize the map only when Google Maps API Script was loaded */
  async startMapComponent() {
    if(this.initializeMap()){
      this.addLocation();
    }
  }

  openConfig() {
    this.menu.enable(true, 'mapConfig');
    this.menu.open('mapConfig');
  }

  useCurrentCoords() {
    this.routingData.setData('map_coord',this.currentCoords);
    this.routingData.setData('start_camera',false);
    this.routingData.setData('partial_model',this.partialModel);

    this.router.navigate(['occurrences']);
  }

  setCurrentCoords(lat:number, lng:number) {
    this.currentCoords.lat=lat;
    this.currentCoords.lng=lng;
  }

  /*
  * This function will create and show a marker representing your occurrence
  */
  showMyLocation(position){
  
    let newPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    this.map.setCenter(newPosition);
    this.map.setZoom(15);
    
    let marker = new google.maps.Marker({
        map: this.map,
        animation: google.maps.Animation.DROP,
        position: newPosition,
        draggable: true
    });

    this.markers.push(marker);

    google.maps.event.addListener(marker, 'click', () => {

      if (marker.getInfoModal && marker.getInfoModal().map){
        marker.getInfoModal().close();
        return;
      }
      let lat = marker.getPosition().lat();
      let lng = marker.getPosition().lng();

      let markerInfo = '<h6>Latitude:'+lat.toFixed(4)+'</h6>'+
      '<h6>Longitude:'+lng.toFixed(4)+'</h6><a href="javascript:'+
      'document.getElementById(\'infowindowhidden\').click();">Usar este local</a>';

      let infoModal = new google.maps.InfoWindow({
          content: markerInfo
      });
      
      infoModal.open(this.map, marker);

      marker.getInfoModal=function(){
        return infoModal;
      };

      this.setCurrentCoords(lat, lng);
    });

    google.maps.event.addListener(marker, 'dragstart', () => {
      if(marker.getInfoModal && marker.getInfoModal().map) {marker.getInfoModal().close();}
    });
    google.maps.event.addListener(marker, 'dragend', () => {
      let lat = marker.getPosition().lat();
      let lng = marker.getPosition().lng();
      this.setCurrentCoords(lat,lng);
    });
  }

  initializeMap(): boolean {

    // skip if no map
    if(!this.map_canvas || (typeof google)==="undefined") {
      return false;
    }
    let demoCenter = new google.maps.LatLng(-23,-45);

    let options = {
      center: demoCenter,
      zoom: 7,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      scaleControl: false,
      streetViewControl: false
    }

    /* Show demo occurrence */
    this.map = new google.maps.Map(this.map_canvas.nativeElement, options);
    return true;
  }

  addLocation() {
    this.geolocation.getCurrentPosition(this.locationOptions).then(
      (position) => {
        /* We can show our location only if map was previously initialized */
        this.showMyLocation(position);
      },
      (error) => {
        console.log('Error getting location', error);
        this.alertPresentation(error);
      }
    );
  }

  async alertPresentation(error: PositionError) {
    const alert = await this.alertCtrl.create({
      header: 'Falha GPS',
      subHeader: 'Falhou ao capturar sua localização. Erro informado: '+error.message,
      buttons: ['ok']
    });
    alert.present();
  }

  startWatchingLocation() {

    this.stopWatchingLocation();

    if(this.watchLocation == undefined) {
      this.watchLocation = this.geolocation.watchPosition(this.locationOptions).subscribe(
        (position) => {
          if (position != undefined) {
            this.btColor = '#00ff00';// on
            let newPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            this.map.setCenter(newPosition);
            this.map.setZoom(15);
            
            if (this.currentLocation != undefined) {
              this.currentLocation.setMap(null);
            }

            this.currentLocation = new google.maps.Marker({
                map: this.map,
                position: newPosition,
                icon: {
                  url: "./assets/imgs/marker25x25.png",
                  size: {
                  width: 25,
                  height: 25
                }
              }
            });
          }
        }
      );
    }
  }

  stopWatchingLocation() {
    // To stop notifications
    if (this.currentLocation != undefined) {
      this.btColor = 'primary';// off
      this.currentLocation.setMap(null);
      this.watchLocation.unsubscribe();
    }else{
      this.btColor = '#FFFF00'; // try on
    }
  }

  toggleCurrentCoord() {
    if(this.currentCoord){
      this.addLocation();
    }else{
      this.removeLastLocation();
    }
  }

  toggleGPS() {
    if(this.gpsState){
      this.startWatchingLocation();
    }else{
      this.stopWatchingLocation();
    }
  }

  /**
   * Change behaviour for load occurrences by local storage.
   */
  toggleByMe(){
    if(this.eventsByMe){
      this.reloadOccurrences();
    }else{
      this.clearSavedMarkers();
    }
  }

  /**
   * Change behaviour for receive occurrences by sync service.
   */
  toggleByOthers(){
    if(this.eventsByOthers){
      this.tryReceiveOccurrences();
    }else{
      this.clearMarkersByOthers();
    }
  }

  tryReceiveOccurrences() {
    if(this.syncService.isConnected()) {
      this.syncService.onNewOccurrence().subscribe( (jsonOccurrenceItem:string) => {
        // receive new occurrences to display into map
        let occurrenceItem = OccurrenceItemSerializable.unserialize(jsonOccurrenceItem);
        this.occurrencesByOthers.push(occurrenceItem);
        this.clearMarkersByOthers();
        this.displayOtherMarkers(this.occurrencesByOthers);
      });
    }
  }

  clearMarkersByOthers(){
    if(!this.markersFromRemoteOccurrences) return;
    while(this.markersFromRemoteOccurrences.length) {
      let m = this.markersFromRemoteOccurrences.pop();
      if(m != undefined)
        m.setMap(null);
    }
  }

  removeLastLocation() {
    let m = this.markers.pop();
    if(m != undefined)
      m.setMap(null);
  }

  clearMarkers() {
    while(this.markers.length) {
      this.removeLastLocation();
    }
  }

  reloadOccurrences() {
    this.occurrencesProvider.getAll()
      .then((result) => {
        this.occurrences = result;
        this.displaySavedMarkers(this.occurrences);
      });
  }

  clearSavedMarkers() {
    if(!this.myMarkersFromSavedOccurrences) return;
    while(this.myMarkersFromSavedOccurrences.length) {
      let m = this.myMarkersFromSavedOccurrences.pop();
      if(m != undefined)
        m.setMap(null);
    }
  }

  displayOtherMarkers(occurrences: OccurrenceItem[]) {
    this.markersFromRemoteOccurrences = [];
    let colors = {local:"0000FF",remote:"0000FF"};
    this.displayMarkers(occurrences, colors, this.markersFromRemoteOccurrences);
  }

  displaySavedMarkers(occurrences: OccurrenceItem[]) {
    this.myMarkersFromSavedOccurrences = [];
    let colors = {local:"FE7569",remote:"5cf5e0"};
    this.displayMarkers(occurrences, colors,this.myMarkersFromSavedOccurrences);
  }

  displayMarkers(occurrences: OccurrenceItem[], colors:any, markers:any) {
    /**
     * Make a new marker image.
     * @param color pin color
     * @param char character to print inside pin
     */
    let gImg = function(color:string, char:string){return new google.maps.MarkerImage(
      "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld="+char+"|" + color,
      new google.maps.Size(21, 34),
      new google.maps.Point(0,0),
      new google.maps.Point(10, 34)
    )};

    for (const key in occurrences) {
      if (occurrences.hasOwnProperty(key)) {
        const item = occurrences[key];
        if (item.occurrence != undefined) {
          let newPosition = new google.maps.LatLng(item.occurrence.lat, item.occurrence.lng);

          let char=(item.occurrence.send)?('R'):('L'),
          icon=((item.occurrence.send)?(gImg(colors.remote,(char))):(gImg(colors.local,(char))));

          markers.push(new google.maps.Marker({
              map: this.map,
              position: newPosition,
              title: item.occurrence.description,
              icon: icon,
              occurrence: item.occurrence
            })
          );
        }
      }
    }

    // Attach balloon on each marker
    this.attachBalloon(markers);
  }

  private attachBalloon(markers:any): any {
    markers.forEach( (marker:any) => {
      google.maps.event.addListener(marker, 'click', () => {

        if (marker.getInfoModal && marker.getInfoModal().map){
          marker.getInfoModal().close();
          return;
        }

        let lat = marker.getPosition().lat();
        let lng = marker.getPosition().lng();
        let timeref = '-';
        let description = '-';
        let occurrenceSend = 'status desconhecido';
        if(marker.occurrence){
          timeref = (marker.occurrence.timeref)?(new Date(marker.occurrence.timeref).toLocaleDateString()):('não informada');
          description = (marker.occurrence.description)?(marker.occurrence.description):('não definida');
          occurrenceSend = (marker.occurrence.send)?('sim'):('não');
        }
        

        let thead = 
        '<tr class="mk-thead"><td colspan="2">'+
        'Salvo no servidor? '+occurrenceSend+
        '</td></tr>';
        let tbody = 
        ((marker.occurrence)?(
          '<tr><td>Descrição:</td><td>'+description+'</td></tr>'+
          '<tr><td>Data:</td><td>'+timeref+'</td></tr>'
        ):(''))+
        '<tr><td>Latitude:</td><td>'+lat.toFixed(4)+'</td></tr>'+
        '<tr><td>Longitude:</td><td>'+lng.toFixed(4)+'</td></tr>';
        
        let markerInfo = '<table class="marker_info">'+thead+tbody+'</table>';

        let infoModal = new google.maps.InfoWindow({
            content: markerInfo
        });
        
        infoModal.open(this.map, marker);

        marker.getInfoModal=function(){
          return infoModal;
        };
      });
    });
  }
}
