import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-burnered',
  templateUrl: './burnered.page.html',
  styleUrls: ['./burnered.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BurneredPage implements OnInit {

  constructor(
    private router: Router) {
  }

  ngOnInit() {
  }

  goToMap() {
    this.router.navigate(['/map']);
  }
  
  goToCamera() {
    this.router.navigate(['/locations'], {queryParams:{startCamera:true}});
  }

  goToLocations() {
    this.router.navigate(['/locations'], {queryParams:{
      currentLat: 0,
      currentLng: 0,
      startCamera: false
    }});
  }
}
