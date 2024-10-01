import { Component, Inject, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { Category } from 'src/models/category.models';
import { Constants } from 'src/models/constants.models';
import { Helper } from 'src/models/helper.models';
import { Hospital } from 'src/models/hospital.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { MyEventsService } from '../services/events/my-events.service';
import { ApiService } from '../services/network/api.service';
import { APP_CONFIG, AppConfig } from '../app.config';

@Component({
  selector: 'app-hospitals',
  templateUrl: './hospitals.component.html',
  styleUrls: ['./hospitals.component.scss']
})
export class HospitalsComponent implements OnInit {
  categoryCarousel: OwlOptions = {
    loop: false,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    nav: false,
    margin: 20,
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 4
      },
      992: {
        items: 5
      },
      1240: {
        items: 7,
        autoWidth: true,
      }
    },

  }
  private subscriptions = new Array<Subscription>();
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;
  isResponsive = true;
  isLoading = true;
  selectedLocation = new MyAddress();
  banners = new Array<Category>();
  hospitals = new Array<Hospital>();
  hostpitalsCategory = new Array<Category>();
  hospitalQuery = "";

  constructor(private router: Router, private translate: TranslateService, @Inject(APP_CONFIG) private config: AppConfig,
    private myEventsService: MyEventsService, private uiElementService: UiElementsService, public apiService: ApiService) { }

  getAddressToShow(address: MyAddress) {
    return MyAddress.getAddressToShow(address);
  }

  getTitleToShow(address: MyAddress) {
    return MyAddress.gettAddressTitleToShow(address);
  }

  ngOnInit() {
    this.loadAddressChangedObservable();
    this.doRefresh();
  }

  loadAddressChangedObservable() {
    this.selectedLocation = Helper.getAddressSelected();
    this.subscriptions.push(this.myEventsService.getAddressChangedObservable().subscribe(result => {
      if (result) {
        this.selectedLocation = Helper.getAddressSelected();
        this.doRefresh();
      }
    }));
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  pickLocation() {
    this.myEventsService.setCustomEventData("nav:pick_location");
  }

  private doRefresh() {
    this.pageNo = 1;
    this.hospitals = [];
    this.isLoading = true;
    this.loadHospitals();
  }

  private loadHospitals() {
    if (this.selectedLocation != null) {
      if (this.hospitals && this.hospitals.length) {
        this.getHostpitalsCategory();
        this.refreshHospitals();
      } else {
        this.translate.get("loading").subscribe(value => {
          // this.uiElementService.presentLoading(value);
          this.getHostpitalsCategory();
          this.refreshHospitals();
        });
      }
    } else {
      this.isLoading = false;
    }
  }

  private getHostpitalsCategory() {
    this.subscriptions.push(this.apiService.getCategoriesWithScope(Constants.SCOPE_HOSPITAL).subscribe(res => { this.hostpitalsCategory = res; this.uiElementService.dismissLoading(); }, err => { console.log("getCategoriesWithScope", err); this.uiElementService.dismissLoading(); }));
  }

  private loadBanners() {
    this.subscriptions.push(this.apiService.getBanners(Constants.SCOPE_HOSPITAL).subscribe(res => this.banners = res, err => console.log("getBanners", err)));
  }

  private refreshHospitals() {
    let lat = this.selectedLocation && this.selectedLocation.latitude ? this.selectedLocation.latitude : this.config.defaultLocation.location.latitude;
    let lng = this.selectedLocation && this.selectedLocation.longitude ? this.selectedLocation.longitude : this.config.defaultLocation.location.longitude;
    this.subscriptions.push(this.apiService.getHospitals(lat, lng, this.pageNo).subscribe(res => {
      console.log(res);
      this.pageNo = res.meta!.current_page;
      this.pageSize = res.meta!.per_page;
      this.pageTotal = res.meta!.total;
      this.hospitals = res.data;
      this.isLoading = false;
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("getHospitals", err);
      this.uiElementService.dismissLoading();
      this.isLoading = false;
    }));
  }

  navHospital(hospital: Hospital) {
    window.open((("http://maps.google.com/maps?daddr=" + hospital.latitude + "," + hospital.longitude)), "_system");
  }

  navHospitalInfo(hos: any) {
    window.localStorage.setItem(Constants.TEMP_HOSPITAL, JSON.stringify(hos));
    this.router.navigate(['./hospital-info']);
  }

  navSearch() {
    if ((this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) || (this.config.defaultLocation && this.config.defaultLocation.use && this.config.defaultLocation.location)) {
      if (this.hospitalQuery && this.hospitalQuery.length) {
        let navigationExtras: NavigationExtras = { queryParams: { query: this.hospitalQuery } };
        this.router.navigate(['./hospital-list'], navigationExtras);
      }
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

  navHosCategory(cat: any) {
    if ((this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) || (this.config.defaultLocation && this.config.defaultLocation.use && this.config.defaultLocation.location)) {
      let navigationExtras: NavigationExtras = { queryParams: { category: JSON.stringify(cat) } };
      this.router.navigate(['./hospital-list'], navigationExtras);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }
  onChangePage(event: any) {
    this.pageNo = event;
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.isLoading = true;
      this.refreshHospitals();
    });
  }
}
