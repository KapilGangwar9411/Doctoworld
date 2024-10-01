import { Component, Inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Subscription } from 'rxjs';
import { Constants } from 'src/models/constants.models';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { Hospital } from 'src/models/hospital.models';
import { AppConfig, APP_CONFIG } from '../app.config';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.scss']
})
export class HospitalInfoComponent {
    cardBannerCarousel: OwlOptions = {
    loop: false,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: true,
    nav: true,
    margin: 0,
    stagePadding: 0,
    responsive: {
      0: {
        items: 1
      },
    }
  }

  private once = false;
  private subscriptions = new Array<Subscription>();
  isLoading = true;
  private pageNo = 1;
  favorite_icon = false;
  tabHinfo: string = "about";
  hospital = new Hospital();
  currencyIcon!: string;
  availabilityToday!: string;
  private doctors = new Array<Doctor>();
  servicesDoctorsMap = new Array<{ service_id: number; service_title: string, doctors: Array<Doctor> }>();
  currServiceId = -1;
  hos_map!: string;
  selectedTab: number = 1;

  constructor(private uiElementService: UiElementsService, @Inject(APP_CONFIG) private config: AppConfig, private translate: TranslateService, private apiService: ApiService,
  private router: Router) { }

  ngOnInit() {
    this.hospital = JSON.parse(window.localStorage.getItem(Constants.TEMP_HOSPITAL)!);
    console.log(this.hospital);
    this.currencyIcon = Helper.getSetting("currency_icon");
    for (let avail of this.hospital.availability) {
      if (avail.days == String(new Date().toLocaleString('en-us', { weekday: 'short' })).toLocaleLowerCase()) {
        this.translate.get((avail.selected ? "to" : "closed_today")).subscribe(value => (this.availabilityToday = avail.selected ? (avail.from + " " + value + " " + avail.to) : value));
        break;
      }
    }

    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.loadDoctorsAll();
    });

    // let parameters = new URLSearchParams();
    // parameters.append("size", "400x200");
    // parameters.append("markers", "color:red|" + this.hospital.latitude + "," + this.hospital.longitude);
    // parameters.append("zoom", "13");
    // parameters.append("key", this.config.googleApiKey);
    // this.hos_map = "https://maps.googleapis.com/maps/api/staticmap?" + parameters.toString();

    // silver color static map
    this.hos_map = `https://maps.googleapis.com/maps/api/staticmap?key=${this.config.googleApiKey}&markers=color:red| ${this.hospital.latitude},${this.hospital.longitude}&zoom=13&format=png&maptype=roadmap&style=element:geometry%7Ccolor:0xf5f5f5&style=element:labels.icon%7Cvisibility:off&style=element:labels.text.fill%7Ccolor:0x616161&style=element:labels.text.stroke%7Ccolor:0xf5f5f5&style=feature:administrative.land_parcel%7Celement:labels.text.fill%7Ccolor:0xbdbdbd&style=feature:poi%7Celement:geometry%7Ccolor:0xeeeeee&style=feature:poi%7Celement:labels.text.fill%7Ccolor:0x757575&style=feature:poi.park%7Celement:geometry%7Ccolor:0xe5e5e5&style=feature:poi.park%7Celement:labels.text.fill%7Ccolor:0x9e9e9e&style=feature:road%7Celement:geometry%7Ccolor:0xffffff&style=feature:road.arterial%7Celement:labels.text.fill%7Ccolor:0x757575&style=feature:road.highway%7Celement:geometry%7Ccolor:0xdadada&style=feature:road.highway%7Celement:labels.text.fill%7Ccolor:0x616161&style=feature:road.local%7Celement:labels.text.fill%7Ccolor:0x9e9e9e&style=feature:transit.line%7Celement:geometry%7Ccolor:0xe5e5e5&style=feature:transit.station%7Celement:geometry%7Ccolor:0xeeeeee&style=feature:water%7Celement:geometry%7Ccolor:0xc9c9c9&style=feature:water%7Celement:labels.text.fill%7Ccolor:0x9e9e9e&size=400x200`

    // console.log("hosmap", this.hos_map);

    // window.localStorage.removeItem(Constants.TEMP_HOSPITAL);
  }

  ionViewWillLeave() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  private loadDoctorsAll() {
    this.subscriptions.push(this.apiService.getDoctorsWithHospitalId(this.hospital.id, this.pageNo).subscribe(res => {
      this.doctors = this.doctors.concat(res.data);
      if (res.data && res.data.length >= 15) { this.pageNo = this.pageNo + 1; this.loadDoctorsAll(); } else { this.uiElementService.dismissLoading(); this.setupDoctors(); }
    }, err => {
      console.log("getDoctorsWithHospitalId", err);
      this.uiElementService.dismissLoading();
    }));
  }

  toggleFavorite() {
    if (Helper.getLoggedInUser() != null) {
      this.translate.get("just_moment").subscribe(value => {
        this.uiElementService.presentLoading(value);
        this.subscriptions.push(this.apiService.toggleFavoriteHospital(String(this.hospital.id)).subscribe(res => {
          this.hospital.is_favourite = !this.hospital.is_favourite;
          this.uiElementService.dismissLoading();
        }, err => {
          console.log("toggleProductFavorite", err);
          this.uiElementService.dismissLoading();
        }));
      });
    } else {
      this.alertLogin();
    }
  }

  navDocProfile(doc: Doctor) {
    window.localStorage.setItem(Constants.TEMP_DOCTOR, JSON.stringify(doc));
    this.router.navigateByUrl('doctor-info');
  }

  navHospital() {
    window.open((("http://maps.google.com/maps?daddr=" + this.hospital.latitude + "," + this.hospital.longitude)), "_system");
  }

  bookDoc(doc:Doctor) {
    if (Helper.getLoggedInUser() != null) {
      let doctor = new Doctor();
      doctor.id = doc.id;
      doctor.name = doc.name;
      doctor.availability = doc.availability;
      doctor.image = doc.image;
      doctor.user = doc.user;
      doctor.user_id = doc.user_id;
      doctor.specializations_text = doc.specializations_text;
      doctor.consultancy_fee = doc.consultancy_fee;
      doctor.hospitalClosest = doc.hospitalClosest;

      let navigationExtras: NavigationExtras = { state: { doctor: doctor } };
      this.router.navigate(['./appointment-book'], navigationExtras);
    } else {
      this.alertLogin();
    }
  }

  dialHospital() {
    // if (this.hospital.meta && this.hospital.meta.phone) {
    //   this.callNumber.callNumber(this.hospital.meta.phone, false).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
    // } else {
    //   this.translate.get("phone_unavailable").subscribe(value => this.uiElementService.presentToast(value));
    // }
  }


  private setupDoctors() {
    for (let service of this.hospital.services) {
      let sDocs = new Array<Doctor>();
      for (let doc of this.doctors) {
        for (let docService of doc.services) {
          if (service.id == docService.id) {
            sDocs.push(doc);
            break;
          }
        }
      }
      if (sDocs.length > 0) this.servicesDoctorsMap.push({ service_id: service.id, service_title: service.title, doctors: sDocs });
    }
  }

  private alertLogin() {
    this.translate.get("alert_login_short").subscribe(value => this.uiElementService.showErrorToastr(value));
    this.router.navigate(['./sign-in']);
  }

  onChangePage(select: number){
    this.selectedTab = select;
  }

  doctorInfo() {
    // this.router.navigateByUrl('doctor-info');
  }
  
}

