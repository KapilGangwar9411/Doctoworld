import { Injectable, Inject } from '@angular/core';
import { APP_CONFIG, AppConfig } from 'src/app/app.config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Country } from 'src/models/country.models';
import { AuthResponse } from 'src/models/auth-response.models';
import { SocialLoginRequest } from 'src/models/sociallogin-request.models';
import { SignUpRequest } from 'src/models/auth-signup-request.models';
import { MyMeta } from 'src/models/meta.models';
import { MyAddress } from 'src/models/address.models';
import { BaseListResponse } from 'src/models/base-list.models';
import { Helper } from 'src/models/helper.models';
import { Rating } from 'src/models/rating.models';
import { RatingSummary } from 'src/models/rating-summary.models';
import { PaymentMethod } from 'src/models/payment-method.models';
import { SupportRequest } from 'src/models/support-request.models';
import { User } from 'src/models/user.models';
import { productRateRequest, RateRequest } from 'src/models/rate-request.models';
import { Category } from 'src/models/category.models';
import { Product } from 'src/models/product.models';
import { OrderRequest } from 'src/models/order-request.models';
import { Coupon } from 'src/models/coupon.models';
import { Order } from 'src/models/order.models';
import { Doctor, AvailabilityDateTime } from 'src/models/doctor.models';
import { Review } from 'src/models/review.models';
import { Faq } from 'src/models/faq.models';
import { Hospital } from 'src/models/hospital.models';
import { Appointment } from 'src/models/appointment.models';
import { Vendor } from 'src/models/vendor.models';
import { WalletTransaction } from 'src/models/wallet-transaction.models';
import { DoctorSchedule } from 'src/models/doctor-schedule.models';
import { OrderPayment } from 'src/models/order-payment.models';
import * as moment from 'moment';
import { OrderMultiVendor } from 'src/models/order-multi-vendor.models';
import { SearchType } from 'src/models/search-type.models';
import { Constants } from 'src/models/constants.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private myHeaders!: HttpHeaders;

  private currency_icon!: string;
  private locale!: string;
  private reviewedIds = new Array<string>();
  private myLocation!: MyAddress;
  private distance_metric = "km";
  private userMe!: User;
  private uuid: string = "xxx";
  private platform: string = "android";

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private http: HttpClient) { }

  reloadSetting() {
    this.currency_icon = Helper.getSetting("currency_icon");
    this.locale = Helper.getSetting("locale");
  }

  setUserMe(user: User) {
    this.userMe = user;
  }

  getUserMe(): User {
    return this.userMe;
  }

  reloadItemsReviewed() {
    this.reviewedIds = Helper.getReviewedProductIds();
  }

  setupHeaders(authToken?: string) {
    let tokenToUse = authToken ? authToken : Helper.getToken();
    let savedLanguageCode = Helper.getLanguageDefault();
    this.myHeaders = tokenToUse ? new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': ('Bearer ' + tokenToUse),
      'X-Localization': String(savedLanguageCode ? savedLanguageCode : this.config.availableLanguages[0].code),
      'X-Device-Id': this.uuid ? this.uuid : "xxx",
      'X-Device-Type': this.platform ? this.platform : "android"
    }) : new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Localization': String(savedLanguageCode ? savedLanguageCode : this.config.availableLanguages[0].code),
      'X-Device-Id': this.uuid ? this.uuid : "xxx",
      'X-Device-Type': this.platform ? this.platform : "android"
    });
  }

  setUuidAndPlatform(uuid: string, platform: string) {
    this.uuid = uuid;
    this.platform = platform ? String(platform).toLowerCase() : platform;
    this.setupHeaders();
  }

  public getAgoraRtcToken(channelName: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.config.apiBase + 'api/agora/token?token_type=rtc', { channel: channelName }, { headers: this.myHeaders });
  }

  public getAgoraRtmToken(userId: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.config.apiBase + 'api/agora/token?token_type=rtm', { uid: userId }, { headers: this.myHeaders });
  }

  public getCountries(): Observable<Array<Country>> {
    return this.http.get<Array<Country>>('./assets/json/countries.json').pipe(
      tap(data => {
        let indiaIndex = -1;
        // if (data) {
        //   for (let i = 0; i < data.length; i++) {
        //     if (data[i].name == "India") {
        //       indiaIndex = i;
        //       break;
        //     }
        //   }
        // }
        if (indiaIndex != -1) data.unshift(data.splice(indiaIndex, 1)[0]);
      }),
      catchError(this.handleError<Array<Country>>('getCountries', []))
    );
  }

  public getURL(url: string): Observable<any> {
    return this.http.get<any>(url, { headers: this.myHeaders });
  }

  public postURL(url: string): Observable<any> {
    return this.http.post<any>(url, {}, { headers: this.myHeaders });
  }

  public getContactLink(): Observable<{ link: string }> {
    return this.http.get<{ link: string }>('https://dashboard.vtlabs.dev/whatsapp.php?product_name=doctorworld&source=application', { headers: this.myHeaders });
  }

  public getSettings(): Observable<Array<MyMeta>> {
    return this.http.get<Array<MyMeta>>(this.config.apiBase + 'api/settings', { headers: this.myHeaders });
  }

  public getFaqs(): Observable<Array<Faq>> {
    return this.http.get<Array<Faq>>(this.config.apiBase + 'api/faq', { headers: this.myHeaders });
  }

  public submitSupport(supportRequest: SupportRequest): Observable<{}> {
    return this.http.post<{}>(this.config.apiBase + "api/support", supportRequest, { headers: this.myHeaders });
  }

  public checkUser(checkUserRequest: any): Observable<{}> {
    return this.http.post<{}>(this.config.apiBase + 'api/check-user', checkUserRequest, { headers: this.myHeaders });
  }

  public loginSocial(socialLoginRequest: SocialLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/social/login', socialLoginRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data.user)));
  }

  public loginUser(loginTokenRequest: { token: string, role: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/login', loginTokenRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data.user)));
  }

  public createUser(signUpRequest: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/register', signUpRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data.user)));
  }

  public getUser(): Observable<User> {
    return this.http.get<User>(this.config.apiBase + 'api/user', { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public updateUser(updateRequest: any): Observable<User> {
    return this.http.put<User>(this.config.apiBase + 'api/user', updateRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public getCoupons(): Observable<Array<Coupon>> {
    return this.http.get<Array<Coupon>>(this.config.apiBase + "api/coupons", { headers: this.myHeaders });
  }

  public postNotificationContent(roleTo: string, userIdTo: string, title?: string, body?: string): Observable<any> {
    let urlParams = new URLSearchParams();
    if (title && title.length) urlParams.append("message_title", title);
    if (body && body.length) urlParams.append("message_body", body);
    return this.http.post<any>(this.config.apiBase + 'api/user/push-notification?' + urlParams.toString(), { role: roleTo, user_id: userIdTo }, { headers: this.myHeaders });
  }

  public getBanners(scope?: string): Observable<Array<Category>> {
    let urlParams = new URLSearchParams();
    urlParams.append("pagination", "0");
    urlParams.append("parent", "1");
    if (scope != null) urlParams.append("scope", scope);
    return this.http.get<Array<Category>>(this.config.apiBase + "api/banners?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) for (let cat of data) this.setupCategory(cat);
    })
      //, catchError(this.handleError<Array<Category>>('getCategoriesParents', this.getTestCategories()))
    );
  }

  public getProductsWithQuery(query: string, page?: number, latitude?: string, longitude?: string): Observable<BaseListResponse> {
    this.reloadSetting();
    let urlParams = new URLSearchParams();
    urlParams.append("search", query);
    if (page) urlParams.append("page", String(page));
    if (latitude && longitude) { urlParams.append("lat", latitude); urlParams.append("long", longitude); }
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/products?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data && data.data.length) this.setupProductRemoveUnfilled(data.data);
      if (data && data.data && data.data.length) for (let pro of data.data) this.setupProduct(pro);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public getHospitalsWithQuery(query: string, page?: number, latitude?: string, longitude?: string): Observable<BaseListResponse> {
    let urlParams = new URLSearchParams();
    urlParams.append("name", query);
    if (page) urlParams.append("page", String(page));
    if (latitude && longitude) { urlParams.append("lat", latitude); urlParams.append("long", longitude); }
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/doctor/hospitals?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data.length) for (let hos of data.data) this.setupHospital(hos);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public getHospitals(latitude: string, longitude: string, pageNo: number): Observable<BaseListResponse> {
    let urlParams = new URLSearchParams();
    if (pageNo) urlParams.append("page", String(pageNo));
    if (latitude && longitude) { urlParams.append("lat", latitude); urlParams.append("long", longitude); }
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/doctor/hospitals?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data.length) for (let hos of data.data) this.setupHospital(hos);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestDoctors()))
    );
  }

  public getHospitalsWithScopeId(categoryId: any, scope: string, latitude: string, longitude: string, page: number): Observable<BaseListResponse> {
    let urlParams = new URLSearchParams();
    if (categoryId) urlParams.append(scope, String(categoryId));
    if (page) urlParams.append("page", String(page));
    urlParams.append("sort", "distance");
    if (latitude && longitude) { urlParams.append("lat", latitude); urlParams.append("long", longitude); }
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/doctor/hospitals?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data.length) for (let hos of data.data) this.setupHospital(hos);
    })
      //, catchError(this.handleError<BaseListResponse>('getDoctorsWithCategoryId', this.getTestDoctors()))
    );
  }

  public getDoctorsWithHospitalId(hospitalId: number, page?: number): Observable<BaseListResponse> {
    this.myLocation = Helper.getAddressSelected();
    let urlParams = new URLSearchParams();
    urlParams.append("hospital", String(hospitalId));
    if (page) urlParams.append("page", String(page));
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/doctor/profile/list?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data) this.setupDoctorRemoveUnfilled(data.data);
      if (data && data.data && data.data.length) for (let doc of data.data) this.setupDoctor(doc);
    })
      //, catchError(this.handleError<BaseListResponse>('getDoctorsWithCategoryId', this.getTestDoctors()))
    );
  }

  public getDoctorsWithQuery(query: string, page?: number, latitude?: string, longitude?: string): Observable<BaseListResponse> {
    this.myLocation = Helper.getAddressSelected();
    let urlParams = new URLSearchParams();
    urlParams.append("search", query);
    if (page) urlParams.append("page", String(page));
    //if (latitude && longitude) { urlParams.append("lat", latitude); urlParams.append("long", longitude); }
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/doctor/profile/list?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data) this.setupDoctorRemoveUnfilled(data.data);
      if (data && data.data && data.data.length) for (let pro of data.data) this.setupDoctor(pro);
    })
      //, catchError(this.handleError<BaseListResponse>('get   ProductsWithCategoryId', this.getTestDoctors()))
    );
  }

  public getDoctorsWithScopeId(categoryId: number, scope: string, latitude: string, longitude: string, page: number): Observable<BaseListResponse> {
    this.myLocation = Helper.getAddressSelected();
    let urlParams = new URLSearchParams();
    if (categoryId) urlParams.append(scope, String(categoryId));
    if (page) urlParams.append("page", String(page));
    urlParams.append("sort", "distance");
    if (latitude && longitude) { urlParams.append("lat", latitude); urlParams.append("long", longitude); }
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/doctor/profile/list?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data) this.setupDoctorRemoveUnfilled(data.data);
      if (data && data.data && data.data.length) for (let doc of data.data) this.setupDoctor(doc);
    })
      //, catchError(this.handleError<BaseListResponse>('getDoctorsWithCategoryId', this.getTestDoctors()))
    );
  }

  public getDoctorSchedule(doctorId: number, forDays: number, fromDate: string): Observable<DoctorSchedule> {
    let urlParams = new URLSearchParams();
    urlParams.append("days", String(forDays));
    urlParams.append("start_from", String(fromDate));
    return this.http.get<DoctorSchedule>(this.config.apiBase + "api/doctor/profile/schedule/" + doctorId + "?" + urlParams.toString(), { headers: this.myHeaders });
  }

  public rateUser(uId: number, rateRequest: RateRequest): Observable<{}> {
    return this.http.post<{}>(this.config.apiBase + "api/user/ratings/" + uId, JSON.stringify(rateRequest), { headers: this.myHeaders });
  }

  public getCategoriesWithScope(scope: string): Observable<Array<Category>> {
    return this.http.get<Array<Category>>(this.config.apiBase + "api/categories?pagination=0&scope=" + scope, { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) for (let cat of data) this.setupCategory(cat);
    })
      //, catchError(this.handleError<Array<Category>>('getCategoriesWithScope', this.getTestCategories()))
    );
  }

  public getCategoriesParents(scope?: string): Observable<Array<Category>> {
    let urlParams = new URLSearchParams();
    urlParams.append("pagination", "0");
    urlParams.append("parent", "1");
    if (scope != null) urlParams.append("scope", scope);
    return this.http.get<Array<Category>>(this.config.apiBase + "api/categories?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) for (let cat of data) this.setupCategory(cat);
    })
      //, catchError(this.handleError<Array<Category>>('getCategoriesParents', this.getTestCategories()))
    );
  }

  public getVendorsForTypes(location: MyAddress, types: Array<string>) {
    this.reloadSetting();
    let requests = [];
    for (let type of types) requests.push(this.getVendorsSort1(location, type));
    return forkJoin(requests).pipe(catchError(error => of(error)));
  }

  public getVendorsSort1(location: MyAddress, type: string, page?: number): Observable<Array<BaseListResponse>> {
    let urlParams = new URLSearchParams();
    urlParams.append("sort", String(type));
    urlParams.append("lat", String(location.latitude));
    urlParams.append("long", String(location.longitude));
    if (page) urlParams.append("page", String(page)); else urlParams.append("pagination", String(0));
    return this.http.get<Array<BaseListResponse>>(this.config.apiBase + "api/vendors/list?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap((data: any) => {
      if (data.data && data.data.length) data.data.map((vendor: Vendor) => this.setupVendor(vendor));
    })
    );
  }

  // public getCategoriesVendors(location: MyAddress): Observable<Array<BaseListResponse>> {
  //   let urlParams = new URLSearchParams();
  //   // urlParams.append("category", String(parentId));
  //   urlParams.append("lat", String(location.latitude));
  //   urlParams.append("long", String(location.longitude));
  //   return this.http.get<Array<BaseListResponse>>(this.config.apiBase + "api/vendors/list?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap((data: any) => {
  //     this.myLocation = Helper.getAddressSelected();
  //     if (data.data && data.data.length) data.data.map(vendor => this.setupVendor(vendor));
  //   }));
  // }
  setupVendor(vendor: Vendor) {
    let myLocation = Helper.getAddressSelected();
    if (!vendor.mediaurls || !vendor.mediaurls.images) vendor.mediaurls = { images: [] };
    vendor.image = "assets/images/empty_image.png";
    for (let imgObj of vendor.mediaurls.images) if (imgObj["default"]) { vendor.image = imgObj["default"]; break; }

    vendor.categories_text = "";
    if (vendor.categories && vendor.categories.length) for (let cat of vendor.categories) vendor.categories_text += (cat.title + ", ");
    if (vendor.categories_text.length) vendor.categories_text = vendor.categories_text.substring(0, vendor.categories_text.length - 2);
    vendor.distance = this.getDistanceBetweenTwoCoordinates(Number(myLocation.latitude), Number(myLocation.longitude), Number(vendor.latitude), Number(vendor.longitude));
    vendor.distance_toshow = Helper.formatDistance(vendor.distance, this.distance_metric);
  }

  public getCategoriesSub(parentId: number): Observable<Array<Category>> {
    return this.http.get<Array<Category>>(this.config.apiBase + "api/categories?pagination=0&category=" + parentId, { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) for (let cat of data) this.setupCategory(cat);
    })
      //, catchError(this.handleError<Array<Category>>('getCategoriesSub', this.getTestCategories()))
    );
  }

  public getVendorsProductForTypes(types: Array<SearchType>) {
    this.reloadSetting();
    let requests = [];
    for (let type of types) if (type.type == "vendor") requests.push(this.getVendorsSort(type.name!)); else requests.push(this.getProductsSort(Constants.SCOPE_ECOMMERCE, type.name!));
    return forkJoin(requests).pipe(catchError(error => of(error)));
  }

  public getVendorsSort(type: string, page?: number): Observable<Array<BaseListResponse>> {
    let urlParams = new URLSearchParams();
    urlParams.append("sort", String(type));
    if (page) urlParams.append("page", String(page)); else urlParams.append("pagination", String(0));
    return this.http.get<Array<BaseListResponse>>(this.config.apiBase + "api/vendors/list?" + urlParams.toString(), { headers: this.myHeaders! }).pipe(tap((data: any) => {
      let locale = Helper.getLocale();
      if (data.data && data.data.length) data.data.map((vendor: any) => this.setupVendor(vendor));
    })
    );
  }

  public getProductsSort(scope: string, type?: string, page?: number): Observable<BaseListResponse> {
    this.reloadSetting();
    let urlParams = new URLSearchParams();
    if (page) urlParams.append("page", String(page)); else urlParams.append("pagination", String(0));
    urlParams.append("scope", scope);
    if (type && type.length) urlParams.append("vendor_type", type);
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/products?" + urlParams.toString(), { headers: this.myHeaders! }).pipe(tap(data => {
      if (data && data.data && data.data.length) {
        this.setupProductRemoveUnfilled(data.data);
        for (let pro of data.data) this.setupProduct(pro);
      }
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }


  // public getProductsWithCategoryId(scope: string, categoryId: number, page: number): Observable<BaseListResponse> {
  //   this.reloadSetting();
  //   let urlParams = new URLSearchParams();
  //   if (categoryId) urlParams.append("category", String(categoryId));
  //   urlParams.append("page", String(page));
  //   urlParams.append("scope", String(scope));
  //   let location = Helper.getAddressSelected();
  //   if (latitude && longitude) { urlParams.append("lat", latitude); urlParams.append("long", longitude); }
  //   return this.http.get<BaseListResponse>(this.config.apiBase + "api/products?" + urlParams, { headers: this.myHeaders }).pipe(tap(data => {
  //     if (data && data.data && data.data.length) this.setupProductRemoveUnfilled(data.data);
  //     if (data && data.data && data.data.length) for (let pro of data.data) this.setupProduct(pro);
  //   })
  //     //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
  //   );
  // }
  public getProductsWithCategoryId(scope: string, categoryId: number, type: string | null | undefined, page: number | null | undefined): Observable<BaseListResponse> {
    this.reloadSetting();
    let urlParams = new URLSearchParams();
    urlParams.append("category", String(categoryId));
    urlParams.append("page", String(page ?? 1));
    urlParams.append("scope", scope);
    if (type != null) urlParams.append("vendor_type", type);
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/products?" + urlParams.toString(), { headers: this.myHeaders! }).pipe(tap(data => {
      if (data && data.data && data.data.length) {
        this.setupProductRemoveUnfilled(data.data);
        for (let pro of data.data) this.setupProduct(pro);
      }
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public getVendorById(vendorId: number): Observable<Vendor> {
    this.myLocation = Helper.getAddressSelected();
    return this.http.get<Vendor>(this.config.apiBase + "api/vendors/" + vendorId, { headers: this.myHeaders }).pipe(tap(data => this.setupVendor(data)));
  }

  public getProductsWithVendorId(vendorId: number, page: number): Observable<BaseListResponse> {
    this.reloadSetting();
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/products?vendor=" + vendorId + "&page=" + page, { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data && data.data.length) this.setupProductRemoveUnfilled(data.data);
      if (data && data.data && data.data.length) for (let pro of data.data) this.setupProduct(pro);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public getProductsWithId(productId: string): Observable<Product> {
    this.reloadSetting();
    return this.http.get<Product>(this.config.apiBase + "api/products/" + productId, { headers: this.myHeaders }).pipe(tap(data => {
      this.setupProduct(data);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public toggleFavoriteProduct(productId: string): Observable<any> {
    return this.http.post<any>(this.config.apiBase + "api/products/favourites/" + productId, {}, { headers: this.myHeaders });
  }

  public toggleFavoriteDoctor(docId: string): Observable<any> {
    return this.http.post<any>(this.config.apiBase + "api/doctor/profile/favourites/" + docId, {}, { headers: this.myHeaders });
  }

  public toggleFavoriteHospital(hosId: string): Observable<any> {
    return this.http.post<any>(this.config.apiBase + "api/doctor/hospitals/favourites/" + hosId, {}, { headers: this.myHeaders });
  }

  public getFavoriteProducts(): Observable<Array<Product>> {
    return this.http.get<Array<Product>>(this.config.apiBase + "api/products/favourites/list", { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) this.setupProductRemoveUnfilled(data);
      if (data && data.length) for (let pro of data) this.setupProduct(pro);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public getFavoriteDoctors(): Observable<Array<Doctor>> {
    return this.http.get<Array<Doctor>>(this.config.apiBase + "api/doctor/profile/favourites/list", { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) for (let pro of data) this.setupDoctor(pro);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public getFavoriteHospitals(): Observable<Array<Hospital>> {
    return this.http.get<Array<Hospital>>(this.config.apiBase + "api/doctor/hospitals/favourites/list", { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) for (let pro of data) this.setupHospital(pro);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public getPaymentMethods(): Observable<Array<PaymentMethod>> {
    return this.http.get<Array<PaymentMethod>>(this.config.apiBase + 'api/payment/methods', { headers: this.myHeaders });
  }

  public getAddresses(): Observable<Array<MyAddress>> {
    return this.http.get<Array<MyAddress>>(this.config.apiBase + 'api/addresses', { headers: this.myHeaders });
  }

  public addressAdd(address: { [x: string]: any; }): Observable<MyAddress> {
    for (let key in address) if (!address[key]) delete address[key];
    return this.http.post<MyAddress>(this.config.apiBase + 'api/addresses', address, { headers: this.myHeaders });
  }

  public addressUpdate(address: { [x: string]: any; id: string; }): Observable<MyAddress> {
    for (let key in address) if (!address[key]) delete address[key];
    return this.http.put<MyAddress>(this.config.apiBase + 'api/addresses/' + address.id, address, { headers: this.myHeaders });
  }

  public createOrder(orderRequest: OrderRequest): Observable<OrderMultiVendor> {
    return this.http.post<OrderMultiVendor>(this.config.apiBase + 'api/orders', orderRequest, { headers: this.myHeaders });
  }

  public createAppointment(doctorId: string, apr: any): Observable<any> {
    return this.http.post<any>(this.config.apiBase + 'api/doctor/appointments/' + doctorId, apr, { headers: this.myHeaders });
  }

  public checkCoupon(couponCode: string): Observable<Coupon> {
    return this.http.get<Coupon>(this.config.apiBase + 'api/coupons/check-validity?code=' + couponCode, { headers: this.myHeaders });
  }

  public getCalculateDeliveryFees(urlParams: Array<string>) {
    let requests = [];
    for (let urlParam of urlParams) requests.push(this.calculateDeliveryFee(urlParam));
    return forkJoin(requests).pipe(catchError(error => of(error)));
  }

  public calculateDeliveryFee(urlParams: string) {
    return this.http.get<{ delivery_fee: any }>(this.config.apiBase + 'api/orders/calculate-delivery-fee?' + urlParams.toString(), { headers: this.myHeaders });
  }

  public getAppointments(userId: any, pageNo: any): Observable<BaseListResponse> {
    let urlParams = new URLSearchParams();
    urlParams.append("appointer", String(userId));
    if (pageNo) urlParams.append("page", String(pageNo));
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/doctor/appointments?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data) this.setupAppointmentRemoveUnfilled(data.data);
      let locale = Helper.getLocale();
      for (let ap of data.data) this.setupAppointment(ap, locale);
    }));
  }

  public getAppointmentById(apId: string): Observable<Appointment> {
    return this.http.get<Appointment>(this.config.apiBase + "api/doctor/appointments/" + apId, { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.doctor && data.doctor.hospitals) this.setupAppointment(data, Helper.getLocale());
    }));
  }

  public updateAppointment(apId: string, ur: any): Observable<Appointment> {
    return this.http.put<Appointment>(this.config.apiBase + "api/doctor/appointments/" + apId, ur, { headers: this.myHeaders }).pipe(tap(ap => this.setupAppointment(ap, Helper.getLocale())));
  }

  public getOrders(pageNo: number): Observable<BaseListResponse> {
    this.reloadSetting();
    this.reloadItemsReviewed();
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/orders?page=" + pageNo, { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data) this.setupOrderRemoveUnfilled(data.data);
      for (let order of data.data) this.setupOrder(order);
    }));
  }

  public getRatingSummaryProduct(productId: string): Observable<Rating> {
    return this.http.get<Rating>(this.config.apiBase + "api/products/ratings/summary/" + productId, { headers: this.myHeaders }).pipe(tap(data => {
      let ratingSummaries = RatingSummary.defaultArray();
      for (let ratingSummaryResult of data.summary) {
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].total = ratingSummaryResult.total;
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].percent = ((ratingSummaryResult.total / data.total_ratings) * 100);
      }
      data.summary = ratingSummaries;
    }));
  }

  public getReviewsProduct(productId: string, pageNo: number): Observable<BaseListResponse> {
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/products/ratings/" + productId + "?page=" + pageNo, { headers: this.myHeaders }).pipe(tap(data => {
      for (let review of data.data) this.setupReview(review);
    }));
  }

  public getReviewsDoctor(doctorId: string, pageNo: number): Observable<BaseListResponse> {
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/doctor/profile/ratings/" + doctorId + "?page=" + pageNo, { headers: this.myHeaders }).pipe(tap(data => {
      for (let review of data.data) this.setupReview(review);
    }));
  }

  public postReviewProducts(rateRequest: Array<productRateRequest>) {
    this.reloadSetting();
    let requests = [];
    for (let rate of rateRequest) requests.push(this.postReviewProduct(rate));
    return forkJoin(requests).pipe(catchError(error => of(error)));
  }


  public postReviewProduct(rr: productRateRequest): Observable<any> {
    return this.http.post<any>(this.config.apiBase + "api/products/ratings/" + rr.productId, { rating: rr.rating, review: rr.review }, { headers: this.myHeaders });
  }

  public postReviewDoctor(doctorId: string, rr: RateRequest): Observable<any> {
    return this.http.post<any>(this.config.apiBase + "api/doctor/profile/ratings/" + doctorId, rr, { headers: this.myHeaders });
  }

  public stripePayment(pId: number, stripeTokenId: string): Observable<{ success: boolean; message: string; }> {
    return this.http.get<{ success: boolean; message: string; }>(this.config.apiBase + 'api/payment/stripe/' + pId + "?token=" + stripeTokenId, { headers: this.myHeaders });
  }

  public walletPayout(pId: number): Observable<{ success: boolean; message: string; }> {
    return this.http.get<{ success: boolean; message: string; }>(this.config.apiBase + 'api/payment/wallet/' + pId, { headers: this.myHeaders });
  }

  public walletDeposit(depositRequest: any): Observable<OrderPayment> {
    return this.http.post<OrderPayment>(this.config.apiBase + 'api/user/wallet/deposit', depositRequest, { headers: this.myHeaders });
  }

  public getBalance(): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(this.config.apiBase + 'api/user/wallet/balance', { headers: this.myHeaders }).pipe(tap(data => {
      if (!data.balance) data.balance = 0;
      data.balance = Helper.toFixedNumber(Number(data.balance));
    }));
  }

  public getTransactions(): Observable<BaseListResponse> {
    return this.http.get<BaseListResponse>(this.config.apiBase + 'api/user/wallet/transactions', { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data && data.data.length) for (let trans of data.data) this.setupTransaction(trans);
    }));
  }

  public setupTransaction(transaction: WalletTransaction) {
    transaction.created_at = Helper.formatTimestampDateTime(transaction.created_at, this.locale);
    transaction.updated_at = Helper.formatTimestampDateTime(transaction.updated_at, this.locale);
    if (!transaction.amount) transaction.amount = 0;
    transaction.amount = Helper.toFixedNumber(Number(transaction.amount));
    if (transaction.meta && transaction.meta.source_amount) transaction.meta.source_amount = Helper.toFixedNumber(Number(transaction.meta.source_amount));
  }

  public setupReview(data: Review) {
    data.created_at = Helper.formatTimestampDate(data.created_at, this.locale);
    if (data.user.mediaurls && data.user.mediaurls.images) for (let imgObj of data.user.mediaurls.images) if (imgObj["default"]) { data.user.image_url = imgObj["default"]; break; }
    if (!data.user.image_url) data.user.image_url = "assets/images/empty_dp.png";
  }

  private getCategoriesText(categories: Array<Category>): string {
    let toReturn = "";
    if (categories != null && categories.length > 0) {
      for (let cat of categories) toReturn += (cat.title + ", ");
      toReturn = toReturn.substring(0, toReturn.length - 2);
    }
    return toReturn;
  }

  private getDistanceBetweenTwoCoordinates(lat1: number, lon1: number, lat2: number, lon2: number) {
    let R = 6371; // Radius of the earth in km 
    let dLat = (lat2 - lat1) * (Math.PI / 180);  // deg2rad below 
    let dLon = (lon2 - lon1) * (Math.PI / 180);
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c; // Distance in km
    return d * 1000; // Returning in meters
  }

  private setDoctorsClosestHospital(data: Doctor) {
    data.hospitalClosest = data.hospitals[0];
    if (this.myLocation != null) {
      let smallestDistance = -1;
      for (let hos of data.hospitals) {
        let hosMeDistance = this.getDistanceBetweenTwoCoordinates(Number(this.myLocation.latitude), Number(this.myLocation.longitude), Number(hos.latitude), Number(hos.longitude));
        if (smallestDistance == -1 || hosMeDistance < smallestDistance) {
          smallestDistance = hosMeDistance;
          data.hospitalClosest = hos;
        }
      }
    }
  }

  private setupAppointment(data: Appointment, locale: string) {
    if (!data.meta || Array.isArray(data.meta)) data.meta = {};
    if (!data.status) data.status = "pending";
    data.momentAppointment = moment(data.date + " " + data.time_from);

    data.day_toshow = String(data.momentAppointment.format("ddd")).toLowerCase();
    data.date_toshow = data.momentAppointment.format("Do MMM");
    data.time_from_toshow = Helper.formatMillisTime(data.momentAppointment.valueOf(), locale ? locale : "en");
    data.time_to_toshow = Helper.formatMillisTime(moment(data.date + " " + data.time_to).valueOf(), locale ? locale : "en");
    this.setupDoctor(data.doctor);

    if (!data.user) data.user = new User();
    if (data.user.mediaurls && data.user.mediaurls.images) for (let imgObj of data.user.mediaurls.images) if (imgObj["default"]) { data.user.image_url = imgObj["default"]; break; }
    if (!data.user.image_url) data.user.image_url = "assets/images/empty_dp.png";
  }

  private setupDoctorRemoveUnfilled(data: Array<Doctor>) {
    let found = false;
    for (let i = 0; i < data.length; i++) {
      if (!data[i].hospitals || !data[i].hospitals.length) {
        found = true;
        data.splice(i, 1);
      }
    }
    if (found) this.setupDoctorRemoveUnfilled(data);
  }

  private setupAppointmentRemoveUnfilled(data: Array<Appointment>) {
    let found = false;
    for (let i = 0; i < data.length; i++) {
      if (!data[i].doctor || !data[i].doctor.hospitals) {
        found = true;
        data.splice(i, 1);
      }
    }
    if (found) this.setupAppointmentRemoveUnfilled(data);
  }

  public setupHospital(data: Hospital) {
    if (!data.mediaurls || !data.mediaurls.images) data.mediaurls = { images: [] };
    data.image = "assets/images/empty_image.png";
    data.images = new Array<string>();
    for (let i = 0; i < data.mediaurls.images.length; i++) {
      if (data.mediaurls.images[i]["default"]) {
        if (i == 0) data.image = data.mediaurls.images[i]["default"];
        data.images.push(data.mediaurls.images[i]["default"]);
      }
    }
    if (!data.images.length) data.images.push("assets/images/empty_image.png");

    if (!data.services) data.services = new Array<Category>();

    let availabilityDefault = AvailabilityDateTime.getDefault();
    if (data.availability && data.availability.length) {
      for (let avail of data.availability) {
        let index = 0;
        switch (avail.days) {
          case "sun":
            index = 0;
            break;
          case "mon":
            index = 1;
            break;
          case "tue":
            index = 2;
            break;
          case "wed":
            index = 3;
            break;
          case "thu":
            index = 4;
            break;
          case "fri":
            index = 5;
            break;
          case "sat":
            index = 6;
            break;
        }
        availabilityDefault[index].selected = true;
        availabilityDefault[index].setTime(avail.from, avail.to);
      }
    }
    data.availability = availabilityDefault;
    if (data.facilities && data.facilities != "0") data.showFacilities = data.facilities.split(", ");
  }

  public setupDoctor(data: Doctor) {
    this.setDoctorsClosestHospital(data);
    // data.consultancy_fee = data.hospitalClosest.fee;
    if (!data.fee) data.fee = data.hospitalClosest.fee;
    if (!data.fee) data.fee = 0;

    if (!data.ratings) data.ratings = 0;
    if (!data.ratings_count) data.ratings_count = 0;
    data.ratings = Helper.toFixedNumber(Number(data.ratings));
    data.hospitals_text = "";
    if (data.hospitals && data.hospitals.length) {
      let hospitals_text_new = "";
      for (let hos of data.hospitals) hospitals_text_new += (hos.name + ", ");
      hospitals_text_new = hospitals_text_new.substring(0, hospitals_text_new.length - 2);
      data.hospitals_text = hospitals_text_new;
      for (let hos of data.hospitals) this.setupHospital(hos)
    }

    data.degrees_text = this.getCategoriesText(data.degrees);
    data.specializations_text = this.getCategoriesText(data.specializations);
    data.services_text = this.getCategoriesText(data.services);

    if (!data.mediaurls || !data.mediaurls.images) data.mediaurls = { images: [] };
    data.image = "assets/images/empty_image.png";
    for (let imgObj of data.mediaurls.images) if (imgObj["default"]) { data.image = imgObj["default"]; break; }

    if (!data.user) data.user = new User();
    if (data.user.mediaurls && data.user.mediaurls.images) for (let imgObj of data.user.mediaurls.images) if (imgObj["default"]) { data.user.image_url = imgObj["default"]; break; }
    if (!data.user.image_url) data.user.image_url = "assets/images/empty_dp.png";

    let availabilityDefault = AvailabilityDateTime.getDefault();
    if (data.availability && data.availability.length) {
      for (let avail of data.availability) {
        let index = 0;
        switch (avail.days) {
          case "sun":
            index = 0;
            break;
          case "mon":
            index = 1;
            break;
          case "tue":
            index = 2;
            break;
          case "wed":
            index = 3;
            break;
          case "thu":
            index = 4;
            break;
          case "fri":
            index = 5;
            break;
          case "sat":
            index = 6;
            break;
        }
        availabilityDefault[index].selected = true;
        availabilityDefault[index].setTime(avail.from, avail.to);
      }
    }
    data.availability = availabilityDefault;

    if (typeof data.meta == "string") data.meta = JSON.parse(data.meta as string);
    if (!data.meta || Array.isArray(data.meta)) data.meta = {};
    if (!data.meta.fee_online) data.meta.fee_online = 0;
  }

  private setupCategory(category: Category) {
    if (category.mediaurls && category.mediaurls.images) for (let imgObj of category.mediaurls.images) if (imgObj["default"]) { category.image = imgObj["default"]; break; }
    if (!category.image) category.image = "assets/images/empty_image.png";
  }

  private setupProductRemoveUnfilled(data: Array<Product>) {
    let found = false;
    for (let i = 0; i < data.length; i++) {
      if (!data[i].categories || !data[i].categories.length) {
        found = true;
        data.splice(i, 1);
      }
    }
    if (found) this.setupProductRemoveUnfilled(data);
  }

  private setupOrderRemoveUnfilled(data: Array<Order>) {
    let found = false;
    for (let i = 0; i < data.length; i++) {
      if (!data[i].products || !data[i].products.length || !data[i].vendor || !data[i].user) {
        found = true;
        data.splice(i, 1);
      }
    }
    if (found) this.setupOrderRemoveUnfilled(data);
  }


  // private setupProduct(product: Product, currency: string) {
  //   product.prescription_required = (product.meta && product.meta.prescription);

  //   if (!product.price) product.price = 0;
  //   product.priceToShow = currency + product.price.toFixed(2);

  //   if (product.vendor_products && product.vendor_products.length) {
  //     for (let vp of product.vendor_products) {
  //       if (!vp.sale_price) vp.sale_price = 0;
  //       vp.priceToShow = currency + vp.price.toFixed(2);
  //       vp.sale_priceToShow = currency + vp.sale_price.toFixed(2);

  //       if (vp.vendor) {
  //         if (!vp.vendor.mediaurls || !vp.vendor.mediaurls.images) vp.vendor.mediaurls = { images: [] };
  //         vp.vendor.image = "assets/images/empty_appointments.png";
  //         for (let imgObj of vp.vendor.mediaurls.images) if (imgObj["default"]) { vp.vendor.image = imgObj["default"]; break; }
  //         console.log("vp.vendor.image", vp.vendor.image);
  //       }
  //     }
  //   }

  //   if (product.categories && product.categories.length) {
  //     for (let cat of product.categories) this.setupCategory(cat);
  //   }

  //   product.images = new Array<string>();
  //   if (product.mediaurls && product.mediaurls.images) for (let imgObj of product.mediaurls.images) if (imgObj["default"]) product.images.push(imgObj["default"]);
  //   if (!product.images.length) product.images.push("assets/images/empty_appointments.png");
  // }

  public setupProduct(product: Product) {
    product.prescription_required = (product.meta && product.meta.prescription && (product.meta.prescription == "1" || product.meta.prescription == true));

    if (!product.ratings) product.ratings = 0;
    if (!product.ratings_count) product.ratings_count = 0;
    product.ratings = Helper.toFixedNumber(Number(product.ratings));
    if (!product.price) product.price = 0;
    product.priceToShow = this.currency_icon + Helper.toFixedNumber(Number(product.price));
    product.ratings = Helper.toFixedNumber(Number(product.ratings));

    if (product.addon_groups) {
      for (let addonGroup of product.addon_groups) {
        if (addonGroup && addonGroup.addon_choices) {
          for (let addonChoice of addonGroup.addon_choices) {
            if (!addonChoice.price) addonChoice.price = 0;
            addonChoice.priceToShow = this.currency_icon + Helper.toFixedNumber(Number(addonChoice.price));
          }
        }
      }
    }

    product.vendorText = "";
    if (product.vendor_products && product.vendor_products.length) {
      for (let vp of product.vendor_products) {
        if (!vp.sale_price) vp.sale_price = 0;
        vp.priceToShow = this.currency_icon + Helper.toFixedNumber(Number(vp.price));
        vp.sale_priceToShow = this.currency_icon + Helper.toFixedNumber(Number(vp.sale_price));
        product.in_stock = vp.stock_quantity != 0;

        if (vp.vendor) {
          if (!vp.vendor.mediaurls || !vp.vendor.mediaurls.images) vp.vendor.mediaurls = { images: [] };
          vp.vendor.image = "assets/images/empty_image.png";
          for (let imgObj of vp.vendor.mediaurls.images) if (imgObj["default"]) { vp.vendor.image = imgObj["default"]; break; }

          product.vendorText += (vp.vendor.name + ", ");
        }
      }
    }

    if (product.vendorText.length) product.vendorText = product.vendorText.substring(0, product.vendorText.length - 2);

    if (product.categories && product.categories.length) {
      for (let cat of product.categories) this.setupCategory(cat);
    }

    product.images = new Array<string>();
    if (product.mediaurls && product.mediaurls.images) for (let imgObj of product.mediaurls.images) if (imgObj["default"]) product.images.push(imgObj["default"]);
    if (!product.images.length) product.images.push("assets/images/empty_image.png");
    if (!product.meta || Array.isArray(product.meta)) product.meta = {};
  }

  private setupOrder(order: Order) {
    order.created_at = Helper.formatTimestampDate(order.created_at, this.locale);
    if (order.scheduled_on) order.scheduled_on = Helper.formatTimestampDate(order.scheduled_on, this.locale);

    order.total_toshow = this.currency_icon + Helper.toFixedNumber(Number(order.total));
    order.subtotal_toshow = this.currency_icon + Helper.toFixedNumber(Number(order.subtotal));
    if (order.delivery_fee) order.delivery_fee_toshow = this.currency_icon + Helper.toFixedNumber(Number(order.delivery_fee));
    if (order.discount) order.discount_toshow = this.currency_icon + Helper.toFixedNumber(Number(order.discount));
    if (order.taxes) order.taxes_toshow = this.currency_icon + Helper.toFixedNumber(Number(order.taxes));

    for (let product of order.products) {
      product.total_toshow = this.currency_icon + Helper.toFixedNumber(Number(product.total));
      if (product.vendor_product && product.vendor_product.product) {
        if (!product.vendor_product.product.price) product.vendor_product.product.price = 0;
        product.vendor_product.product.priceToShow = this.currency_icon + Helper.toFixedNumber(Number(product.vendor_product.product.price));

        if (product.addon_choices) {
          for (let addonChoice of product.addon_choices) {
            if (addonChoice.addon_choice) {
              if (!addonChoice.addon_choice.price) addonChoice.addon_choice.price = 0;
              addonChoice.addon_choice.priceToShow = this.currency_icon + Helper.toFixedNumber(Number(addonChoice.addon_choice.price));
            }
          }
        }

        product.vendor_product.product.images = new Array<string>();
        if (product.vendor_product.product.mediaurls && product.vendor_product.product.mediaurls.images) for (let imgObj of product.vendor_product.product.mediaurls.images) if (imgObj["default"]) product.vendor_product.product.images.push(imgObj["default"]);
        if (!product.vendor_product.product.images.length) product.vendor_product.product.images.push("assets/images/empty_image.png");

        //custom
        product.vendor_product.product.reviewed = (this.reviewedIds != null && this.reviewedIds.includes(String(String(order.id) + String(product.vendor_product.product.id))));
      }
    }

    if (order.vendor) {
      if (!order.vendor.mediaurls || !order.vendor.mediaurls.images) order.vendor.mediaurls = { images: [] };
      order.vendor.image = "assets/images/empty_image.png";
      for (let imgObj of order.vendor.mediaurls.images) if (imgObj["default"]) { order.vendor.image = imgObj["default"]; break; }
    }

    if (order.delivery) {
      order.delivery.delivery.user.image_url = "assets/images/empty_dp";
      if (!order.delivery.delivery.user.mediaurls || !order.delivery.delivery.user.mediaurls.images) order.delivery.delivery.user.mediaurls = { images: [] };
      for (let imgObj of order.delivery.delivery.user.mediaurls.images) if (imgObj["default"]) { order.delivery.delivery.user.image_url = imgObj["default"]; break; }
    }

    if (order.user) {
      if (!order.user.mediaurls || !order.user.mediaurls.images) order.user.mediaurls = { images: [] };
      order.user.image_url = "assets/images/empty_dp.png";
      for (let imgObj of order.user.mediaurls.images) if (imgObj["default"]) { order.user.image_url = imgObj["default"]; break; }
    }

  }

  private setupUserMe(data: User) {
    if (!data.mediaurls || !data.mediaurls.images) data.mediaurls = { images: [] };
    if (!data.image_url) for (let imgObj of data.mediaurls.images) if (imgObj["default"]) { data.image_url = imgObj["default"]; break; }
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
