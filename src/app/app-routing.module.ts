import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './home/home.module#HomePageModule' },
  { path: 'burnered', loadChildren: './pages/burnered/burnered.module#BurneredPageModule' },
  { path: 'locations', loadChildren: './pages/locations/locations.module#LocationsPageModule' },
  { path: 'map', loadChildren: './pages/map/map.module#MapPageModule' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
