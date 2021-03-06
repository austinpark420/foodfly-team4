import { Component } from '@angular/core';

@Component({
  selector: 'foodfly-root',
  template: `
    <foodfly-preloader></foodfly-preloader>
    <foodfly-header></foodfly-header>
    <foodfly-toastr></foodfly-toastr>
    <router-outlet (activate)='onActivate()'></router-outlet>
    <foodfly-footer></foodfly-footer>
  `
})

export class AppComponent {
  onActivate() {
    window.scrollTo(0, 0);
  }
}
