import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { JwtTokenAuthProvider, User } from 'src/app/services/jwt-token-auth/jwt-token-auth';
import { SynchronizeService } from 'src/app/services/occurrences/synchronize.service';

@Component({
  selector: 'app-burnered',
  templateUrl: './burnered.page.html',
  styleUrls: ['./burnered.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BurneredPage implements OnInit {

  private user:User;

  constructor(
    private router: Router,
    private authService: JwtTokenAuthProvider,
    private syncService: SynchronizeService) {
  }

  ngOnInit() {
    this.authService.isAuthorized().then(
      (userObserve) => {
        userObserve.subscribe((user:User)=>{
          this.user=user;
        });
      }, (err) => {
        console.log('Fail on get user');
      }
    ).catch( (err) => {
      console.log('Fail on get user');
    });

    // start websocket to load points that other users sent to server.
    if(!this.syncService.isConnected()) {
      this.syncService.initSocket();
    }
  }

  logout() {
    this.authService.logout();
  }

  goToMap() {
    this.router.navigate(['/map']);
  }
  
  goToCamera() {
    this.router.navigate(['/occurrences'], {queryParams:{startCamera:true}});
  }

  goToOccurrences() {
    this.router.navigate(['/occurrences'], {queryParams:{
      currentLat: 0,
      currentLng: 0,
      startCamera: false
    }});
  }
}
