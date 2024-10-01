import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Subscription } from 'rxjs';
import { Product } from 'src/models/product.models';
import { Vendor } from 'src/models/vendor.models';
import { ECommerceService } from '../services/common/ecommerce.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-vendor-info',
  templateUrl: './vendor-info.component.html',
  styleUrls: ['./vendor-info.component.scss']
})
export class VendorInfoComponent {
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
        items: 6
      }
    }
  };

  @ViewChild('myDiv') myDiv?: ElementRef;
  private subscriptions = new Array<Subscription>();
  vendor?: Vendor;
  vendorProducts?: Array<Product>;
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;
  isLoading = true;

  constructor(private apiService: ApiService, private router: Router, public eComService: ECommerceService, private route: ActivatedRoute, private translate: TranslateService
    , private uiElementService: UiElementsService) {
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      let vendor_id = params["vendor_id"];
      this.translate.get("loading").subscribe(value => {
        // this.uiElementService.presentLoading(value);
        this.subscriptions.push(this.apiService.getVendorById(vendor_id).subscribe(res => {
          this.vendor = res;
          this.loadProductsVendor();
        }, err => {
          console.log("getVendorById", err);
          this.uiElementService.dismissLoading();
        }));
      });
    }));
  }

  ngAfterViewInit() {
    // this.myDiv!.nativeElement.addEventListener('scroll', (e: any) => {
    //   console.log(e.target.scrollLeft, e.target.scrollTop);
    // });
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  getProductId(product: Product): number {
    return Number((product.vendor_products && product.vendor_products[0]) ? product.vendor_products[0].id : product.id);
  }

  private loadProductsVendor() {
    this.subscriptions.push(this.apiService.getProductsWithVendorId(this.vendor!.id!, this.pageNo).subscribe({
      next: (res) => {
        this.uiElementService.dismissLoading();
        this.pageNo = res.meta!.current_page;
        this.pageSize = res.meta!.per_page;
        this.pageTotal = res.meta!.total;

        this.vendorProducts ??= [];
        this.vendorProducts = this.vendorProducts!.concat(res.data!);
        this.isLoading = false;
      },
      error: (err) => {
        console.log("getProductsWithVendorId", err);
        this.isLoading = false;
        this.uiElementService.dismissLoading();
      }
    }));
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

  medicine_info(product?: Product) {
    let navigationExtras: NavigationExtras = { queryParams: { product_id: product?.id } };
    this.router.navigate(['./medicine-info'], navigationExtras);
  }
}
