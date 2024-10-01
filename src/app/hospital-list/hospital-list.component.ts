import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { Category } from 'src/models/category.models';
import { Constants } from 'src/models/constants.models';
import { Helper } from 'src/models/helper.models';
import { Hospital } from 'src/models/hospital.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { APP_CONFIG, AppConfig } from '../app.config';

@Component({
  selector: 'app-hospital-list',
  templateUrl: './hospital-list.component.html',
  styleUrls: ['./hospital-list.component.scss']
})
export class HospitalListComponent {
  showMoreOpction1 = false;
  searchHospital = "";
  private subscriptions = new Array<Subscription>();
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;
  isResponsive = true;
  isLoading = true;
  category = new Category();
  currencyIcon!: string;
  private selectedLocation = new MyAddress();
  hospitals = new Array<Hospital>();

  constructor(private router: Router, private translate: TranslateService, private uiElementService: UiElementsService, private apiService: ApiService,
    private route: ActivatedRoute, @Inject(APP_CONFIG) private config: AppConfig) { }

  ngOnInit() {
    this.currencyIcon = Helper.getSetting("currency_icon");
    // if (this.router.getCurrentNavigation() && this.router.getCurrentNavigation()?.extras.state) {
    //   console.log("calling",this.router.getCurrentNavigation()?.extras.state);
    //   this.category = this.router.getCurrentNavigation()?.extras.state?.['category'];
    // }
    this.selectedLocation = Helper.getAddressSelected();
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      this.isLoading = true;
      this.searchHospital = params["query"];
      if (this.searchHospital && this.searchHospital.length) {
        this.onSearchbarChange();
      } else {
        this.category = JSON.parse(params["category"]);
        this.loadHospitals();
      }
    }));
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  onSearchbarChange() {
    let query = "";
    if (this.searchHospital && this.searchHospital.length) query = this.searchHospital.toLowerCase().trim();
    if (query.length) this.doSearch(query);
  }

  doSearch(queryIn: any) {
    this.isLoading = true;
    this.hospitals = [];
    let lat = this.selectedLocation && this.selectedLocation.latitude ? this.selectedLocation.latitude : this.config.defaultLocation.location.latitude;
    let lng = this.selectedLocation && this.selectedLocation.longitude ? this.selectedLocation.longitude : this.config.defaultLocation.location.longitude;
    this.translate.get("loading").subscribe(value => {
      // this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.getHospitalsWithQuery(queryIn, 1, lat, lng).subscribe(res => this.handleRes(res.data), err => this.handleErr(err)));
    });
  }

  handleRes(res: Array<Hospital>) {
    this.hospitals = res;
    //this.nextUrl = res.links.next;
    this.isLoading = false;
    this.uiElementService.dismissLoading();
  }

  handleErr(err: any) {
    console.log("handleErr", err);
    this.uiElementService.dismissLoading();
    this.isLoading = false;
  }

  loadHospitals() {
    let lat = this.selectedLocation && this.selectedLocation.latitude ? this.selectedLocation.latitude : this.config.defaultLocation.location.latitude;
    let lng = this.selectedLocation && this.selectedLocation.longitude ? this.selectedLocation.longitude : this.config.defaultLocation.location.longitude;
    this.subscriptions.push(this.apiService.getHospitalsWithScopeId(this.category ? this.category.id : null, Constants.SCOPE_HOSPITAL_CATEGORIE, lat, lng, this.pageNo).subscribe(res => {
      this.hospitals = res.data;
      this.isLoading = false;
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("getDoctorsWithCategoryId", err);
      this.uiElementService.dismissLoading();
      this.isLoading = false;
    }));
  }

  onChangePage(event: any) {
    this.pageNo = event;
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.isLoading = true;
      this.loadHospitals();
    });
  }

  // navMapView() {
  //   if (this.hospitals && this.hospitals.length) {
  //     let navigationExtras: NavigationExtras = { state: { hospitals: this.hospitals } };
  //     this.router.navigate(['./hospital-map-view'], navigationExtras);
  //   }
  // }

  navHospitalInfo(hos: Hospital) {
    window.localStorage.setItem(Constants.TEMP_HOSPITAL, JSON.stringify(hos));
    this.router.navigate(['./hospital-info']);
  }

  // dialHospital(hospital: Hospital) {
  //   if (hospital.meta && hospital.meta.phone) {
  //     this.callNumber.callNumber(hospital.meta.phone, false).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
  //   } else {
  //     this.translate.get("phone_unavailable").subscribe(value => this.uiElementService.presentToast(value));
  //   }
  // }
}
