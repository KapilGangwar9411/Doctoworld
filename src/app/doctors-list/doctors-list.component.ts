import { Component, Inject } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { BaseListResponse } from 'src/models/base-list.models';
import { Category } from 'src/models/category.models';
import { Constants } from 'src/models/constants.models';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { APP_CONFIG, AppConfig } from '../app.config';

@Component({
  selector: 'app-doctors-list',
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss']
})
export class DoctorsListComponent {
  private once = false;
  private subscriptions = new Array<Subscription>();
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;
  isLoading = true;
  category = new Category();
  doctors = new Array<Doctor>();
  currencyIcon?: string;
  private scope!: string;
  private selectedLocation = new MyAddress();
  isResponsive = true;
  doctorQuery = "";

  constructor(private router: Router, private translate: TranslateService, private route: ActivatedRoute,
    private uiElementService: UiElementsService, private apiService: ApiService, @Inject(APP_CONFIG) private config: AppConfig) { }

  ngOnInit() {
    this.currencyIcon = Helper.getSetting("currency_icon");
    this.selectedLocation = Helper.getAddressSelected();
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      this.doctorQuery = params["query"];
      if (this.doctorQuery && this.doctorQuery.length) {
        this.isLoading = false;
        this.doctors = new Array<Doctor>();
        this.onSearchbarChange();
      } else {
        this.category = JSON.parse(params["category"]);
        this.scope = params["scope"];
        this.loadDoctors();
      }
    }));
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  onSearchbarChange() {
    let query = "";
    if (this.doctorQuery && this.doctorQuery.length) query = this.doctorQuery.toLowerCase().trim();
    if (query.length) this.doSearch(query);
  }

  doSearch(queryIn: any) {
    this.isLoading = true;
    // this.lastSearchString = queryIn;
    this.doctors = [];
    // this.nextUrl = null;
    let lat = this.selectedLocation && this.selectedLocation.latitude ? this.selectedLocation.latitude : this.config.defaultLocation.location.latitude;
    let lng = this.selectedLocation && this.selectedLocation.longitude ? this.selectedLocation.longitude : this.config.defaultLocation.location.longitude;
    this.translate.get("loading").subscribe(value => {
      // this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.getDoctorsWithQuery(queryIn, this.pageNo, lat, lng).subscribe(res => this.handleRes(res), err => this.handleErr(err)));
    });
  }

  handleRes(res: BaseListResponse) {
    this.pageNo = res.meta!.current_page;
    this.pageSize = res.meta!.per_page;
    this.pageTotal = res.meta!.total;
    this.doctors = res.data;
    // this.doctors = this.doctors.concat(res.data);
    this.isLoading = false;
    this.uiElementService.dismissLoading();
  }

  handleErr(err: any) {
    console.log("handleErr", err);
    this.uiElementService.dismissLoading();
    this.isLoading = false;
  }

  loadDoctors() {
    let lat = this.selectedLocation && this.selectedLocation.latitude ? this.selectedLocation.latitude : this.config.defaultLocation.location.latitude;
    let lng = this.selectedLocation && this.selectedLocation.longitude ? this.selectedLocation.longitude : this.config.defaultLocation.location.longitude;
    this.subscriptions.push(this.apiService.getDoctorsWithScopeId(this.category && this.category.id ? this.category.id : 0, this.scope, lat, lng, this.pageNo).subscribe(res => {
      this.handleRes(res);
    }, err => {
      this.handleErr(err);
    }));
  }

  onChangePage(event: any) {
    this.pageNo = event;
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.isLoading = true;
      this.loadDoctors();
    });
  }

  navMapView() {
    if (this.doctors && this.doctors.length) {
      let navigationExtras: NavigationExtras = { state: { doctors: this.doctors } };
      // this.navCtrl.navigateForward(['./map-view'], navigationExtras);
    }
  }

  navDocProfile(doc: Doctor) {
    window.localStorage.setItem(Constants.TEMP_DOCTOR, JSON.stringify(doc));
    this.router.navigateByUrl('doctor-info');
  }

  bookDoc(doc: Doctor) {
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
      // this.navCtrl.navigateForward(['./appointment-book'], navigationExtras);
    } else {
      this.alertLogin();
    }
  }

  private alertLogin() {
    this.translate.get("alert_login_short").subscribe(value => this.uiElementService.showErrorToastr(value));
    this.router.navigate(['./sign-in']);
  }

  filter() {
    // this.modalController.create({ component: FilterPage }).then((modalElement) => {
    //   modalElement.present();
    // });
  }

  doctorInfo() {
    this.router.navigateByUrl('doctor-info');
  }
}
