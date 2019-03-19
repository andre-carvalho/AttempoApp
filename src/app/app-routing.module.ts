import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { JwtTokenAuthGuardProvider } from './services/jwt-token-auth-guard/jwt-token-auth-guard'

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './home/home.module#HomePageModule' },
  { path: 'burnered', loadChildren: './pages/burnered/burnered.module#BurneredPageModule', canActivate: [JwtTokenAuthGuardProvider] },
  { path: 'locations', loadChildren: './pages/locations/locations.module#LocationsPageModule', canActivate: [JwtTokenAuthGuardProvider] },
  { path: 'map', loadChildren: './pages/map/map.module#MapPageModule', canActivate: [JwtTokenAuthGuardProvider] },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
