import { Component } from '@angular/core';

@Component({
  selector: 'app-download-our-app',
  templateUrl: './download-our-app.component.html',
  styleUrls: ['./download-our-app.component.scss']
})
export class DownloadOurAppComponent {

  playStore() {
    window.open("https://play.google.com/store/", 'location=no');
  }
  appStore() {
    window.open("https://www.apple.com/in/app-store/", 'location=no');
  }
}
