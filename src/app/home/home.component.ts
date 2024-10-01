import { Component } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { Category } from 'src/models/category.models';
import { Constants } from 'src/models/constants.models';
import { Product } from 'src/models/product.models';
import { SearchType } from 'src/models/search-type.models';
import { Vendor } from 'src/models/vendor.models';
import { ECommerceService } from '../services/common/ecommerce.service';
import { MyEventsService } from '../services/events/my-events.service';
import { ApiService } from '../services/network/api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  location: string = "home";
  private subscriptions = new Array<Subscription>();
  private once = false;
  // vendorsArray = new Array<{ vendorType: { name: string; title: string; }; vendors: Array<Vendor>;}>();
  categories = new Array<Category>();
  banners = new Array<Category>();
  cartCount!: number;
  pageNo!: number;
  isLoading = true;
  private loadedCount = 0;
  private vendorTypes = [
    { name: "new", title: "new" },
    { name: "popular", title: "most_popular" },
    { name: "ratings", title: "best_rated" },
    { name: "discounted", title: "discounted_shops" }
  ];
  slideOpts = {
    initialSlide: 0,
    speed: 400,
    autoplay: true,
    pager: false
  };
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
    }
  };
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
    }
  };

  private searchTypes = Array<SearchType>();
  productQuery = "";
  categorySelected?: Category;
  categoryProducts?: Array<Product>;
  productsArray = new Array<{ searchTypes: SearchType; products: Array<Product>; }>();
  vendorsArray = new Array<{ searchTypes: SearchType; vendors: Array<Vendor>; }>();

  constructor(private modalService: NgbModal, private apiService: ApiService, private router: Router, public eComService: ECommerceService, private myEventsService: MyEventsService,
    private translate: TranslateService) {
    // this.loadAddressChangedObservable();
    // if (this.once) this.loadAddressChangedObservable();
    // this.doRefresh();
  }
  ngOnInit() {
    this.searchTypes = [
      new SearchType("", "feature_products", "product"),
      new SearchType("popular", "featured_vendors", "vendor"),
    ];
    this.fetchCategories();
    // this.fetchBanners();
    this.loadProductsByType();
  }

  private fetchCategories() {
    // this.categories = Helper.getHomeCategories();
    this.subscriptions.push(this.apiService.getCategoriesParents(Constants.SCOPE_ECOMMERCE).subscribe({
      next: (res) => {
        this.categories = res;
        // Helper.setHomeCategories(res);
        if (this.categories.length) {
          this.onCategorySelect(this.categories[0]);
        }
      },
      error: (err) => console.log('getCategoriesParents', err)
    }));
  }

  // private fetchBanners() {
  //   // this.banners = Helper.getHomeBanners();
  //   this.subscriptions.push(this.apiService.getBanners(Constants.SCOPE_ECOMMERCE).subscribe({
  //     next: (res) => {
  //       this.banners = res;
  //       // Helper.setHomeBanners(res);
  //     },
  //     error: (err) => console.log('getBanners', err)
  //   }));
  // }

  private loadProductsByType() {
    this.subscriptions.push(this.apiService.getVendorsProductForTypes(this.searchTypes).subscribe({
      next: (res) => {
        console.log("getProductsForTypes", res);
        for (let i = 0; i < this.searchTypes.length; i++) {
          if (this.searchTypes[i].type == "product") this.productsArray.push({ searchTypes: this.searchTypes[i], products: res[i].data });
          if (this.searchTypes[i].type == "vendor") this.vendorsArray.push({ searchTypes: this.searchTypes[i], vendors: res[i].data });
        }
        console.log("vendorsArray", this.vendorsArray);
        //this.isLoading = false;
        // this.uiElementService.dismissLoading();
      }, error: (err) => {
        console.log("getProductsForTypes", err);
        //this.uiElementService.dismissLoading();
        //this.isLoading = false;
      }
    }));
  }

  onSearchSubmit() {
    if (this.productQuery && this.productQuery.length) {
      let navigationExtras: NavigationExtras = { state: { query: this.productQuery } };
      this.router.navigate(['./search-product'], navigationExtras);
    }
  }

  onCategorySelect(category: Category) {
    console.log("call")
    this.categorySelected = category;
    this.categoryProducts = [];
    this.subscriptions.push(this.apiService.getProductsWithCategoryId(Constants.SCOPE_ECOMMERCE, category.id!, null, 1).subscribe({
      next: (res) => {
        this.categoryProducts = res.data ?? [];
      }, error: (err) => {
        console.log("getProductsWithCategoryId", err);
        //this.uiElementService.dismissLoading();
        //this.isLoading = false;
      }
    }
    ));
  }

  navVendorProfile(vendorProfileId: any) {
    let navigationExtras: NavigationExtras = { queryParams: { vendor_id: vendorProfileId } };
    this.router.navigate(['./vendor-info'], navigationExtras);
  }

  getProductId(product: Product): number {
    return Number((product.vendor_products && product.vendor_products[0]) ? product.vendor_products[0].id : product.id);
  }


  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  medicine_info(product?: Product) {
    let navigationExtras: NavigationExtras = { queryParams: { product_id: product?.id } };
    this.router.navigate(['./medicine-info'], navigationExtras);
  }

  addProCart(product: Product) {
    if (this.apiService.getUserMe()) {
      this.eComService.addOrIncrementCartItem(this.eComService.genCartItemFromProduct(product));
    } else {
      //this.translate.get("alert_login_short").subscribe(value => this.uiElementService.showErrorToastr(value));
      this.router.navigate(['./sign-in']);
    }
  }

  removeCartItem(product: Product) {
    this.eComService.removeOrDecrementCartItem(this.eComService.genCartItemFromProduct(product));
  }

}
