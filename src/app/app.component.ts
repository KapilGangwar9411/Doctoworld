import { Component, Inject } from '@angular/core';
import { NavigationEnd, NavigationExtras, NavigationStart, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig, APP_CONFIG } from './app.config';
import { NgwWowService } from 'ngx-wow';
import { Helper } from 'src/models/helper.models';
import { Constants } from 'src/models/constants.models';
import { User } from 'src/models/user.models';
import { UiElementsService } from './services/common/ui-elements.service';
import { MyEventsService } from './services/events/my-events.service';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { Coupon } from 'src/models/coupon.models';
import { ApiService } from './services/network/api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ECommerceService } from './services/common/ecommerce.service';
import { ConfirmationDialogService } from './services/confirmation-dialog/confirmation-dialog.service';
import { AuthResponse } from 'src/models/auth-response.models';
import { SelectLocationComponent } from './select-location/select-location.component';
import { ScriptLoaderService, ScriptStore } from './services/script-loader.service';
import * as firebase from 'firebase';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'groshopweb';
  rtlSide = "left";
  showHeader: boolean = true;
  toggleClass = false;
  checked = false;
  userMe = new User();
  private subscriptions = new Array<Subscription>();
  showMyCart: boolean = true;
  addressSelected!: MyAddress;
  currencyIcon = "";
  couponCode: string = "";
  couponRes = new Coupon();

  constructor(
    @Inject(APP_CONFIG) public config: AppConfig, private router: Router, private wowService: NgwWowService, public apiService: ApiService,
    private translate: TranslateService, private myEventsService: MyEventsService, public uiElementService: UiElementsService, private modalService: NgbModal,
    public eComService: ECommerceService, private confirmationDialogService: ConfirmationDialogService, private scriptLoader: ScriptLoaderService) {
    this.initializeApp();
    // console.log(this.router)
    this.wowService.init();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart || event instanceof NavigationEnd) {
        this.showHeader = !(event.url == "/" || event.url == "/sign-in");
        this.showMyCart = !(event.url == "/" || event.url == "/sign-in");
      }
    });
    this.myEventsService.getLanguageObservable().subscribe(value => {
      this.globalize(value);
      this.apiService.setupHeaders();
      //this.router.navigate([this.apiService.getUserMe() ? 'home' : 'sign-in']);
      this.router.navigate(['home']);
      this.apiService.updateUser({ language: value }).subscribe({
        next: (res) => console.log('updateUser'),
        error: (err) => console.log('updateUser', err)
      });
    });
    this.myEventsService.getUserMeObservable().subscribe(user => {
      // this.apiService.setUserMe(user);
      this.apiService.setUserMe(Helper.getLoggedInUser());
      this.apiService.setupHeaders();
      //this.router.navigate([this.apiService.getUserMe() ? 'home' : 'sign-in']);
      this.router.navigate(['home']);
    });
    this.myEventsService.getAddressObservable().subscribe(myAddress => {
      this.addressSelected = myAddress;
      try {
        this.modalService.dismissAll();
      } catch (e) {
        console.log("modalService.dismissAl", e);
      }
    });
    this.myEventsService.getCustomEventObservable().subscribe(customEvent => {
      if (customEvent == "nav:pick_location") {
        this.selectLocation(false);
      } else if (customEvent == "nav:detect_location") {
        this.selectLocation(true);
      }
    });
  }


  initializeApp() {
    this.apiService.setupHeaders();
    firebase.initializeApp({
      apiKey: this.config.firebaseConfig.apiKey,
      authDomain: this.config.firebaseConfig.authDomain,
      databaseURL: this.config.firebaseConfig.databaseURL,
      projectId: this.config.firebaseConfig.projectId,
      storageBucket: this.config.firebaseConfig.storageBucket,
      messagingSenderId: this.config.firebaseConfig.messagingSenderId
    });
    //this.apiService.setUuidAndPlatform(this.device.uuid, this.device.platform);
    this.refreshSettings();
    this.addressSelected = Helper.getAddressSelected();
    this.apiService.setUserMe(Helper.getLoggedInUser());
    this.router.navigate([this.apiService.getUserMe() ? 'home' : 'sign-in']);
    //this.router.navigate(['home']);
    this.globalize(Helper.getLanguageDefault());
    this.darkModeSetting();
  }

  darkModeSetting() {
    document.body.setAttribute('class', (Helper.getThemeMode(this.config.defaultThemeMode) == Constants.THEME_MODE_DARK ? 'dark-theme' : 'light-theme'));
  }

  globalize(languagePriority: string | undefined | null) {
    this.translate.setDefaultLang("en");
    let defaultLangCode = this.config.availableLanguages[0].code;
    this.translate.use(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
    this.setDirectionAccordingly(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
  }

  setDirectionAccordingly(lang: string) {
    switch (lang) {
      case 'ar': {
        this.rtlSide = "rtl";
        break;
      }
      default: {
        this.rtlSide = "ltr";
        break;
      }
    }
  }

  refreshSettings() {
    this.apiService.getSettings().subscribe({
      next: (res) => { Helper.setSettings(res); this.apiService.reloadSetting(); this.currencyIcon = Helper.getSetting("currency_icon") ?? ""; },
      error: (err) => console.log('getSettings', err)
    });
  }

  selectLocation(detect: boolean) {
    if (this.apiService.getUserMe()) {
      let navigationExtras: NavigationExtras = { state: { address_pick: true } };
      this.router.navigate(['./my-account'], navigationExtras);
    } else if (detect) {
      if ('geolocation' in navigator) {
        this.scriptLoader.load(new ScriptStore("googlemaps", '//maps.googleapis.com/maps/api/js?key=' + this.config.googleApiKey + '&callback=mapInit&libraries=places')).then(res => {
          console.log("scriptLoader Loaded");
          navigator.geolocation.getCurrentPosition((position) => {
            let pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            this.geocode(pos);
          });
        });
      }
    } else {
      const modalRef: NgbModalRef = this.modalService.open(SelectLocationComponent, { size: 'xl', });
      modalRef.componentInstance.pick = true;
    }
  }

  geocode(pos: google.maps.LatLng) {
    let geocoder = new google.maps.Geocoder();
    let request = { location: pos };
    geocoder.geocode(request, (results, status) => {
      if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
        // if (this.location) {
        //   myLocation.id = this.location.id;
        //   myLocation.title = this.location.title;
        // }
        let form_address = '';
        results[0].address_components.map(element => {
          if (element.types[0] != "administrative_area_level_2" && element.types[0] != "country" && element.types[0] != "postal_code" && element.types[0] != "administrative_area_level_1") {
            form_address = form_address ? form_address + ", " + element.long_name : element.long_name;
          }
        });
        let address = new MyAddress();
        address.id = -2;
        address.title = "";
        address.formatted_address = form_address;
        address.latitude = String(pos.lat());
        address.longitude = String(pos.lng());

        Helper.setAddressSelected(address);
        this.myEventsService.setAddressData(address);
      }
    });
  }

  onRouteActivate(event: any) {
    // window.scroll(0,0);
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    //or document.body.scrollTop = 0;
    //or document.querySelector('body').scrollTo(0,0);
  }

  ngOnInit() {
    // this.theme_mode = Helper.getThemeMode(this.config.defaultThemeMode);
  }

  navHome() {
    this.router.navigateByUrl('home');
    this.toggleClass = false;
  }

  hospitals() {
    this.router.navigateByUrl('hospitals');
    this.toggleClass = false;
  }
  doctors() {
    this.router.navigateByUrl('doctors');
    this.toggleClass = false;
  }

  privacy_policy() {
    this.router.navigateByUrl('privacy-policy');
    this.toggleClass = false;
  }
  language() {
    this.router.navigateByUrl('change-language');
    this.toggleClass = false;
  }
  logout() {
    this.router.navigateByUrl('sign-in');
    this.toggleClass = false;
  }

  navCheckout() {
    if (this.apiService.getUserMe() && !(this.addressSelected && this.addressSelected.id > 0)) {
      this.selectLocation(false);
    } else {
      this.router.navigateByUrl(this.apiService.getUserMe() ? 'checkout' : 'sign-in');
      this.toggleClass = false;
    }
  }

  vendorInfo() {
    this.router.navigateByUrl('vendor-info');
    this.toggleClass = false;
  }

  // navPrivacyPolicy() {
  //   let navigationExtras: NavigationExtras = { queryParams: { what: "privacy_policy" } };
  //   this.router.navigate(['./read'], navigationExtras);
  //   this.toggleClass = false;
  // }

  wallet() {
    this.router.navigateByUrl(this.apiService.getUserMe() ? 'wallet' : 'sign-in');
    this.toggleClass = false;
  }
  navOffers() {
    this.router.navigateByUrl(this.apiService.getUserMe() ? 'my-offers' : 'sign-in');
    this.toggleClass = false;
  }

  navOrders() {
    this.router.navigateByUrl(this.apiService.getUserMe() ? 'my-orders' : 'sign-in');
    this.toggleClass = false;
  }

  navMyAccount() {
    this.router.navigateByUrl(this.apiService.getUserMe() ? 'my-account' : 'sign-in');
    this.toggleClass = false;
  }
  navAppointment() {
    this.router.navigateByUrl(this.apiService.getUserMe() ? 'my-appointment' : 'sign-in');
    this.toggleClass = false;
  }

  navSupport() {
    this.router.navigateByUrl(this.apiService.getUserMe() ? 'support' : 'sign-in');
    this.toggleClass = false;
  }

  // home2() {
  //   this.router.navigateByUrl('home');
  //   this.toggleClass = !this.toggleClass;
  // }

  // ToggleClass() {
  //   this.toggleClass = !this.toggleClass;

  // }

  classToggle() {
    console.log("clll", this.apiService.getUserMe());
    if (this.apiService.getUserMe()) {
      this.toggleClass = !this.toggleClass;
    } else {
      this.router.navigateByUrl('sign-in');
    }
  }

  closeMenu() {
    this.toggleClass = false;
  }

  onLogoutClick() {
    this.toggleClass = false;
    this.translate.get(["logout_title", "logout_message", "no", "yes"]).subscribe(values => this.confirmationDialogService.confirm(values["logout_title"], values["logout_message"], values["yes"], values["no"]).then((confirmed) => {
      if (confirmed) {
        this.eComService.clearCart();
        let auth = new AuthResponse();
        Helper.setLoggedInUserResponse(auth);
        let address = new MyAddress();
        this.myEventsService.setAddressData(address);
        let user = new User();
        this.myEventsService.setUserMeData(user);
      }
    }).catch(() => { console.log('err') }));
  }

  verifyCoupon() {
    if (this.apiService.getUserMe() != null && this.couponCode && this.couponCode.length) {
      this.translate.get(["verifying", "invalid_coupon"]).subscribe(values => {
        this.uiElementService.presentLoading(values["verifying"]);
        this.subscriptions.push(this.apiService.checkCoupon(this.couponCode).subscribe(res => {
          this.uiElementService.dismissLoading();
          if (moment(res.expires_at).diff(moment()) > 0) {
            this.couponRes = res;
            this.applyCoupon();
          } else {
            this.couponRes = new Coupon();
            this.uiElementService.showErrorToastr(values["invalid_coupon"], "toast-top-left");
          }
        }, err => {
          console.log("checkCoupon", err);
          this.uiElementService.dismissLoading();
          this.couponCode = "";
          this.couponRes = new Coupon();
          this.uiElementService.showErrorToastr(values["invalid_coupon"], "toast-top-left");
        }));
      });
    } else {
      this.translate.get("err_field_coupon").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

  removeCoupon() {
    this.couponCode = "";
    this.couponRes = new Coupon();
    this.applyCoupon();
    this.translate.get("offer_removed").subscribe(value => this.uiElementService.showSuccessToastr(value));
  }

  applyCoupon() {
    this.eComService.applyCoupon(this.couponRes);
  }

}
