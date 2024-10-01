import { Component } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Subscription } from 'rxjs';
import { Helper } from 'src/models/helper.models';
import { Product } from 'src/models/product.models';
import { ECommerceService } from '../services/common/ecommerce.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-medicine-info',
  templateUrl: './medicine-info.component.html',
  styleUrls: ['./medicine-info.component.scss']
})
export class MedicineInfoComponent {
  showSection = 1;
  product = new Product();
  private subscriptions = new Array<Subscription>();
  isLoading: boolean = true;
  selectPack: number = 1;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private uiElementService: UiElementsService,
    private apiService: ApiService,
    public eComService: ECommerceService) {
    this.loadProduct();
  }
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

  onSelectTab(tab: number) {
    this.showSection = tab;
  }

  vendorInfo() {
    this.router.navigateByUrl('vendor-info');
  }

  navVendorProfile(vendorProfileId: any) {
    let navigationExtras: NavigationExtras = { queryParams: { vendor_id: vendorProfileId } };
    this.router.navigate(['./vendor-info'], navigationExtras);
  }

  private loadProduct() {
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      let product_id = params["product_id"];
      this.translate.get(["loading", "something_wrong"]).subscribe(values => {
        this.uiElementService.presentLoading(values["loading"]);
        this.subscriptions.push(this.apiService.getProductsWithId(product_id).subscribe(res => {
          this.product = res;
          this.selectPack = this.eComService.getCartProductQuantity(this.getProductId(this.product)) ? this.eComService.getCartProductQuantity(this.getProductId(this.product)) : 1;
          console.log(res);
          this.uiElementService.dismissLoading();
          this.isLoading = false;
        }, err => {
          console.log("getProductsWithId", err);
          this.isLoading = false;
          this.uiElementService.dismissLoading();
          this.uiElementService.showErrorToastr(values["something_wrong"]);
        }));
      });
    }));
  }

  getProductId(product: Product): number {
    return Number((product.vendor_products && product.vendor_products[0]) ? product.vendor_products[0].id : product.id);
  }

  toggleFavorite() {
    if (Helper.getLoggedInUser() != null) {
      this.translate.get("just_moment").subscribe(value => {
        this.uiElementService.presentLoading(value);
        this.subscriptions.push(this.apiService.toggleFavoriteProduct(String(this.product.id)).subscribe(res => {
          this.product.is_favourite = !this.product.is_favourite;
          this.isLoading = false;
          this.uiElementService.dismissLoading();
        }, err => {
          console.log("toggleProductFavorite", err);
          this.isLoading = false;
          this.uiElementService.dismissLoading();
        }));
      });
    } else {
      // this.alertLogin();
    }
  }

  addMedicine() {
    if (this.apiService.getUserMe()) {
      this.uiElementService.showSuccessToastr(this.translate.instant("added_cart"));
      for (let i = 0; i < this.selectPack; i++) {
        this.eComService.addOrIncrementCartItem(this.eComService.genCartItemFromProduct(this.product));
      }
    } else {
      this.translate.get("alert_login_short").subscribe(value => this.uiElementService.showErrorToastr(value));
      this.router.navigate(['./sign-in']);
    }
  }
}
