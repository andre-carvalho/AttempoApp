import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { LocationsProvider, LocationItem } from '../../services/locations/locations';
import { environment } from '../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapPage implements OnInit {

  @ViewChild('map_canvas') map_canvas:any;
  locations: LocationItem[];
  map: any;
  markers: any;
  watchLocation: any;
  currentLocation: any;
  currentCoords: any;
  savedLocations: any;
  private locationOptions: any;
  // The Google API key is loaded from google-key.js file.
  private apiKey: any = environment.googleMapApiKey;
  public btColor: string = '#FFFFFF';
  
  constructor(private alertCtrl: AlertController,
    private locationsProvider: LocationsProvider,
    private location: Location,
    private router: Router,
    public geolocation: Geolocation,
    private route: ActivatedRoute,
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
    }else{
      if(!this.map_canvas){
        const div = document.createElement('div');
        div.id = 'map_canvas';
        div.className="map_canvas";
        document.body.appendChild(div);
      }
      this.startMapComponent();
    }
    
    this.markers = [];
    this.currentCoords = {'lat':0, 'lng':0};
    this.locationOptions = {timeout: 10000, enableHighAccuracy: true};
  }

  ngOnInit():void {
    // this.route.queryParams
    //   .subscribe(params => {
    //     console.log(params); // print all prarameters
    // });
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

  /**
   * Disabled...
   */
  /*
  goToLocations() {
    if (this.markers.length) {
      let l = this.markers.length;
      this.router.navigate(['locations'],  { queryParams:
        {
          currentLat: this.markers[l-1].getPosition().lat(),
          currentLng: this.markers[l-1].getPosition().lng(),
          startCamera: true
        }
      });
    }
  }
  */

  goBack() {
    this.location.back();
  }

  useCurrentCoords() {
    this.router.navigate(['locations'],  { queryParams:
      {
        currentLat: this.currentCoords.lat,
        currentLng: this.currentCoords.lng,
        startCamera: false
      }
    });
  }

  setCurrentCoords(lat, lng) {
    this.currentCoords.lat=lat;
    this.currentCoords.lng=lng;
  }

  /*
  * This function will create and show a marker representing your location
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

      if (marker.getInfoModal){
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
      marker.getInfoModal().close();
    });
  }

  initializeMap(): boolean {

    // skip if no map
    if(!this.map_canvas) {
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

    /* Show demo location */
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
      this.btColor = '#FFFFFF';// off
      this.currentLocation.setMap(null);
      this.watchLocation.unsubscribe();
    }else{
      this.btColor = '#FFFF00'; // try on
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

  reloadLocations() {
    this.locationsProvider.getAll()
      .then((result) => {
        this.locations = result;
        this.displaySavedMarkers(this.locations);
      });
  }

  displaySavedMarkers(locations: LocationItem[]) {
    this.savedLocations = [];
    let color = {local:"FE7569",remote:"5cf5e0"};
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

    for (const key in locations) {
      if (locations.hasOwnProperty(key)) {
        const item = locations[key];
        if (item.location != undefined) {
          let newPosition = new google.maps.LatLng(item.location.lat, item.location.lng);

          let char=(item.location.send)?('R'):('L'),
          icon=((item.location.send)?(gImg(color.remote,(char))):(gImg(color.local,(char))));

          this.savedLocations.push(new google.maps.Marker({
              map: this.map,
              position: newPosition,
              title: item.location.description,
              icon: icon,
              location: item.location
            })
          );
        }
      }
    }

    // Attach balloon on each marker
    this.attachBalloon(this.savedLocations);
  }

  private attachBalloon(markers:any): any {
    markers.forEach( (marker:any) => {
      google.maps.event.addListener(marker, 'click', () => {
        let lat = marker.getPosition().lat();
        let lng = marker.getPosition().lng();

        let thead = 
        '<tr class="mk-thead"><td colspan="2">'+
        'Salvo no servidor?'+((marker.location.send)?('sim'):('não'))+
        '</td></tr>';
        let tbody = 
        ((marker.location)?(
          '<tr><td>Descrição:</td><td>'+marker.location.description+'</td></tr>'+
          '<tr><td>Data:</td><td>'+marker.location.timeref.toLocaleDateString()+'</td></tr>'
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

        this.setCurrentCoords(lat, lng);
      });
    });
  }
}
