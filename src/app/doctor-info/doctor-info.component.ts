import { Component, Inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Constants } from 'src/models/constants.models';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { Hospital } from 'src/models/hospital.models';
import { Review } from 'src/models/review.models';
import { AppConfig, APP_CONFIG } from '../app.config';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-doctor-info',
  templateUrl: './doctor-info.component.html',
  styleUrls: ['./doctor-info.component.scss']
})
export class DoctorInfoComponent {
  private subscriptions = new Array<Subscription>();
  private nextUrl!: string;
  isLoading = true;
  private initialized = false;
  favorite_icon = false;
  tabDprofile: string = "about";
  doctor = new Doctor();
  currencyIcon!: string;
  availabilityToday!: string;
  reviews = new Array<Review>();
  doc_map!: string;
  viewType!: string;
  showSection: number = 1;

  constructor(private uiElementService: UiElementsService, private router: Router,
    @Inject(APP_CONFIG) private config: AppConfig, private translate: TranslateService, private apiService: ApiService) { }

  ngOnInit() {
    this.doctor = JSON.parse(window.localStorage.getItem(Constants.TEMP_DOCTOR)!);
    console.log("this", this.doctor);
    let parameters = new URLSearchParams();
    parameters.append("size", "400x200");
    parameters.append("markers", "color:red|" + this.doctor.latitude + "," + this.doctor.longitude);
    parameters.append("zoom", "13");
    parameters.append("key", this.config.googleApiKey);
    this.doc_map = "https://maps.googleapis.com/maps/api/staticmap?" + parameters.toString();

    this.currencyIcon = Helper.getSetting("currency_icon");
    for (let avail of this.doctor.availability) {
      if (avail.days == String(new Date().toLocaleString('en-us', { weekday: 'short' })).toLocaleLowerCase()) {
        this.translate.get((avail.selected ? "to" : "closed_today")).subscribe((value: any) => (this.availabilityToday = avail.selected ? (avail.from + " " + value + " " + avail.to) : value));
        break;
      }
    }

    // this.translate.get("loading").subscribe(value => {
    //   this.uiElementService.presentLoading(value);
    //   this.subscriptions.push(this.apiService.getReviewsDoctor(this.doctor.id, 1).subscribe(res => this.reviewsRes(res), err => this.reviewsErr(err)));
    // });

    // window.localStorage.removeItem(Constants.TEMP_DOCTOR);
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  toggleFavorite() {
    if (Helper.getLoggedInUser() != null) {
      this.translate.get("just_moment").subscribe(value => {
        this.uiElementService.presentLoading(value);
        this.subscriptions.push(this.apiService.toggleFavoriteDoctor(String(this.doctor.id)).subscribe(res => {
          this.doctor.is_favourite = !this.doctor.is_favourite;
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

  navBookNow(apType: string) {
    if (Helper.getLoggedInUser() != null) {
      let doctor = new Doctor();
      doctor.id = this.doctor.id;
      doctor.name = this.doctor.name;
      doctor.availability = this.doctor.availability;
      doctor.image = this.doctor.image;
      doctor.user = this.doctor.user;
      doctor.user_id = this.doctor.user_id;
      doctor.specializations_text = this.doctor.specializations_text;
      doctor.fee = this.doctor.fee;
      doctor.hospitalClosest = this.doctor.hospitalClosest;
      doctor.consultancy_fee = apType == "online" ? this.doctor.meta.fee_online : this.doctor.fee;
      this.checkForSupportedPaymentGateway(doctor, apType);
    } else {
      this.alertLogin();
    }
  }

  private checkForSupportedPaymentGateway(doctor: Doctor, apType?: string) {
    this.translate.get(["verifying_wallet_balance", "payment_setup_fail", "insufficient_wallet"]).subscribe(values => {
      this.uiElementService.presentLoading(values["verifying_wallet_balance"]);
      this.subscriptions.push(this.apiService.getPaymentMethods().subscribe(res => {
        let pgChoosen: any;
        for (let pg of res) { if (pg.slug == "wallet") { pgChoosen = pg; break; } }
        if (pgChoosen) {
          this.subscriptions.push(this.apiService.getBalance().subscribe(res => {
            this.uiElementService.dismissLoading();
            if (res.balance >= doctor.consultancy_fee) {
              console.log("call")
              let navigationExtras: NavigationExtras = { queryParams: { data: JSON.stringify({ doctor: (doctor), payment_gateway: pgChoosen, appointment_type: apType ? apType : "offline" }) } };
              this.router.navigate(['./appointment-book'], navigationExtras);
            } else {
              this.uiElementService.showErrorToastr(values["insufficient_wallet"]);
            }
          }, err => {
            console.log("getBalance", err);
            this.uiElementService.dismissLoading();
            this.uiElementService.showErrorToastr(values["insufficient_wallet"]);
          }));
        } else {
          this.uiElementService.dismissLoading();
          this.uiElementService.showErrorToastr(values["payment_setup_fail"]);
        }
      }, err => {
        console.log("getPaymentMethods", err);
        this.uiElementService.dismissLoading();
        this.uiElementService.showErrorToastr(values["payment_setup_fail"]);
      }));
    });
  }

  // navFeedback() {
  //   let doctor = new Doctor();
  //   doctor.id = this.doctor.id;
  //   doctor.name = this.doctor.name;
  //   doctor.image = this.doctor.image;
  //   doctor.user = this.doctor.user;
  //   doctor.user_id = this.doctor.user_id;
  //   doctor.specializations_text = this.doctor.specializations_text;

  //   let navigationExtras: NavigationExtras = { state: { doctor: doctor } };
  //   this.navCtrl.navigateForward(['./add-feedback'], navigationExtras);
  // }

  // doInfiniteReviews(event) {
  //   if (this.nextUrl == null) {
  //     event.target.complete();
  //   } else {
  //     this.infiniteScrollEvent = event;
  //     this.subscriptions.push(this.apiService.getURL(this.nextUrl).subscribe(res => {
  //       let locale = Helper.getLocale();
  //       for (let review of res.data) review.created_at = Helper.formatTimestampDate(review.created_at, locale);
  //       this.reviewsRes(res);
  //     }, err => this.reviewsErr(err)));
  //   }
  // }

  // private reviewsRes(res: BaseListResponse) {
  //   this.reviews = this.reviews.concat(res.data);
  //   this.nextUrl = res.links.next;
  //   if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
  //   this.isLoading = false;
  //   this.uiElementService.dismissLoading();
  // }

  // private reviewsErr(err) {
  //   console.log("productsErr", err);
  //   this.uiElementService.dismissLoading();
  //   if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
  //   this.isLoading = false;
  // }

  private alertLogin() {
    this.translate.get("alert_login_short").subscribe(value => this.uiElementService.showErrorToastr(value));
    this.router.navigate(['./sign-in']);
  }

  navDocrorReviews() {
    let navigationExtras: NavigationExtras = { state: { doctor: this.doctor } };
    this.router.navigate(['./doctor-reviews'], navigationExtras);
  }

  navHospitalInfo(hos: Hospital) {
    window.localStorage.setItem(Constants.TEMP_HOSPITAL, JSON.stringify(hos));
    this.router.navigate(['./hospital-info']);
  }

  setViewType(vt: any) {
    this.viewType = vt;
  }

  onSelectTab(tab: number) {
    this.showSection = tab;
  }

  vendorInfo() {
    // this.router.navigateByUrl('vendor-info');
  }
  hospitalInfo() {
    // this.router.navigateByUrl('hospital-info');
  }
  appointmentBooked() {
    // this.router.navigateByUrl('appointment-booked');
  }
}

