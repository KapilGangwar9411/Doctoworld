import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Helper } from 'src/models/helper.models';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  miniText = "All in 1 doctor appointment booking and medicine delivery app";
  supportPhone = "";
  phoneAction = "";
  supportEmail = "";
  emailAction = "";

  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit() {
    this.supportPhone = Helper.getSetting("support_phone") ?? "";
    this.phoneAction = `tel:${this.supportPhone}`;
    this.supportEmail = Helper.getSetting("support_email") ?? "";
    this.emailAction = `mailto:${this.supportEmail}?Subject=Support`;
  }

  navRead(what: string) {
    let navigationExtras: NavigationExtras = { queryParams: { what: what } };
    this.router.navigate(['./read'], navigationExtras);

    setTimeout(() => {
      // window.scroll(0,0);
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
      //or document.body.scrollTop = 0;
      //or document.querySelector('body').scrollTo(0,0);
    }, 100);
  }

  navHome() {
    this.router.navigateByUrl('home');
  }
  navDoctors() {
    this.router.navigateByUrl('doctors');
  }
  navHospitals() {
    this.router.navigateByUrl('hospitals');
  }

  navOffers() {
    this.router.navigateByUrl(this.apiService.getUserMe() ? 'my-offers' : 'sign-in');
  }

  navLanguage() {
    this.router.navigateByUrl('change-language');
  }

}
