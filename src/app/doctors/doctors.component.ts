import { Component, Inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { Category } from 'src/models/category.models';
import { Constants } from 'src/models/constants.models';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { MyEventsService } from '../services/events/my-events.service';
import { ApiService } from '../services/network/api.service';
import { APP_CONFIG, AppConfig } from '../app.config';

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent {
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
        items: 7
      }
    },

  }

  bannerCarousel: OwlOptions = {
    loop: false,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    nav: false,
    margin: 15,
    stagePadding: 20,
    responsive: {
      0: {
        items: 1.1
      },
      400: {
        items: 1.5
      },
      768: {
        items: 2.1,
        stagePadding: 30,
      },
      992: {
        items: 3,
        stagePadding: 35,
      },
      1280: {
        items: 8,
        stagePadding: 70,
      },
      1440: {
        stagePadding: 120,
        items: 4,
      },
      1600: {
        stagePadding: 140,
        items: 4.5,
      },
      1920: {
        stagePadding: 310,
        items: 5.5,
      },
      3500: {
        stagePadding: 1150,
        items: 6,
      },
      7000: {
        stagePadding: 3200,
        items: 8,
      }
    },

  }
  private subscriptions = new Array<Subscription>();
  selectedLocation = new MyAddress();

  banners = new Array<Category>();
  specializations = new Array<Category>();
  doctorTypes = new Array<Category>();
  doctorType = new Category();
  isLoading = true;
  doctors = new Array<Doctor>();
  currencyIcon?: string;
  doctorQuery: string = "";

  constructor(private translate: TranslateService, private myEventsService: MyEventsService, private router: Router,
    private uiElementService: UiElementsService, public apiService: ApiService, @Inject(APP_CONFIG) private config: AppConfig) { }

  getAddressToShow(address: MyAddress) {
    return MyAddress.getAddressToShow(address);
  }

  getTitleToShow(address: MyAddress) {
    return MyAddress.gettAddressTitleToShow(address);
  }

  ngOnInit() {
    this.currencyIcon = Helper.getSetting("currency_icon");
    this.loadAddressChangedObservable();

  }

  loadAddressChangedObservable() {
    this.selectedLocation = Helper.getAddressSelected();
    this.doRefresh();
    this.subscriptions.push(this.myEventsService.getAddressChangedObservable().subscribe(result => {
      if (result) {
        // this.tabsPage.addressChanged[1] = false;
        this.selectedLocation = Helper.getAddressSelected();
        this.doRefresh();
      }
    }));
  }

  // ionViewWillLeave() {
  //   for (let sub of this.subscriptions) sub.unsubscribe();
  //   this.uiElementService.dismissLoading();
  // }

  doRefresh() {
    this.translate.get("loading").subscribe(value => {
      // this.uiElementService.presentLoading(value);
      this.doctorTypes = [];
      this.specializations = [];
      this.banners = [];
      this.loadBanners();
      this.refreshSpecializations();
    });
  }

  refreshSpecializations() {
    this.subscriptions.push(this.apiService.getCategoriesWithScope(Constants.SCOPE_DOCTOR_TYPE).subscribe(res => { this.doctorTypes = res; if (res && res.length) this.loadDoctors(res[0]) }, err => console.log("getCategoriesWithScope", err)));

    this.subscriptions.push(this.apiService.getCategoriesWithScope(Constants.SCOPE_SPECIALIZATION).subscribe(res => {
      this.specializations = res.sort((a, b) => {
        if (a.slug.toLowerCase() < b.slug.toLowerCase()) return -1;
        if (a.slug.toLowerCase() > b.slug.toLowerCase()) return 1;
        return 0;
      });
      this.uiElementService.dismissLoading();
      // this.isLoading = false;
    }, err => {
      console.log("getCategoriesWithScope", err);
      this.uiElementService.dismissLoading();
      // this.isLoading = false;
    }));
  }

  private loadBanners() {
    this.subscriptions.push(this.apiService.getBanners(Constants.SCOPE_DOCTOR).subscribe(res => this.banners = res, err => console.log("getBanners", err)));
  }

  pickLocation() {
    this.myEventsService.setCustomEventData("nav:pick_location");
  }

  loadDoctors(cat: Category) {
    if ((this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) || (this.config.defaultLocation && this.config.defaultLocation.use && this.config.defaultLocation.location)) {
      this.doctorType = cat;
      this.subscriptions.push(this.apiService.getDoctorsWithScopeId(this.doctorType && this.doctorType.id ? this.doctorType.id : 0, Constants.SCOPE_DOCTOR_TYPE, this.selectedLocation.latitude, this.selectedLocation.longitude, 0).subscribe(res => {
        this.doctors = res.data;
        // this.doctors = this.doctors.concat(res.data);
        this.isLoading = false;
        this.uiElementService.dismissLoading();
      }, err => {
        console.log("getDoctorsWithCategoryId", err);
        this.uiElementService.dismissLoading();
        this.isLoading = false;
      }));
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

  navDocProfile(doc: Doctor) {
    window.localStorage.setItem(Constants.TEMP_DOCTOR, JSON.stringify(doc));
    this.router.navigateByUrl('doctor-info');
  }

  navSearch() {
    if ((this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) || (this.config.defaultLocation && this.config.defaultLocation.use && this.config.defaultLocation.location)) {
      if (this.doctorQuery && this.doctorQuery.length) {
        console.log("doctorQuery", this.doctorQuery);
        let navigationExtras: NavigationExtras = { queryParams: { query: this.doctorQuery } };
        this.router.navigate(['./doctors-list'], navigationExtras);
      }
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.showErrorToastr(value));
    }

  }

  navListDoctorsType(cat: Category) {
    if ((this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) || (this.config.defaultLocation && this.config.defaultLocation.use && this.config.defaultLocation.location)) {
      this.doctors = new Array<Doctor>();
      this.isLoading = true;
      this.loadDoctors(cat);
      // let navigationExtras: NavigationExtras = { state: { category: cat, scope: Constants.SCOPE_DOCTOR_TYPE } };
      // this.router.navigate(['./doctors-list'], navigationExtras);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

  // navListDoctors() {
  //   if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
  //     this.router.navigate(['./doctors-list']);
  //   } else {
  //     this.translate.get("select_location").subscribe(value => this.uiElementService.showErrorToastr(value));
  //   }
  // }
  navListDoctorsSpeciality(cat: Category) {
    if ((this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) || (this.config.defaultLocation && this.config.defaultLocation.use && this.config.defaultLocation.location)) {
      let navigationExtras: NavigationExtras = { queryParams: { category: JSON.stringify(cat), scope: Constants.SCOPE_SPECIALIZATION } };
      this.router.navigate(['./doctors-list'], navigationExtras);
    } else {
      this.translate.get("select_location").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

}
