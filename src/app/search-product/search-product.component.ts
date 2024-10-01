import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/network/api.service';
import { ECommerceService } from '../services/common/ecommerce.service';
import { Product } from 'src/models/product.models';

@Component({
  selector: 'app-search-product',
  templateUrl: './search-product.component.html',
  styleUrls: ['./search-product.component.scss']
})
export class SearchProductComponent implements AfterViewInit, OnDestroy {
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
  productQuery = "";
  products?: Array<Product>;
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;
  isLoading = true;

  constructor(private apiService: ApiService, private router: Router, public eComService: ECommerceService) {
    if (this.router.getCurrentNavigation() && this.router.getCurrentNavigation()!.extras.state) {
      this.productQuery = this.router.getCurrentNavigation()!.extras.state!['query'];
      this.fetchSearchProducts();
    }
  }

  ngAfterViewInit() {
    // this.myDiv!.nativeElement.addEventListener('scroll', (e: any) => {
    //   console.log(e.target.scrollLeft, e.target.scrollTop);
    // });
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  onSearchSubmit() {
    if (this.productQuery && this.productQuery.length) {
      this.products = [];
      this.pageNo = 1;
      this.pageSize = 0;
      this.pageTotal = 0;
      this.fetchSearchProducts();
    }
  }

  getProductId(product: Product): number {
    return Number((product.vendor_products && product.vendor_products[0]) ? product.vendor_products[0].id : product.id);
  }

  private fetchSearchProducts() {
    this.isLoading = true;
    this.subscriptions.push(this.apiService.getProductsWithQuery(this.productQuery, this.pageNo).subscribe({
      next: (res) => {
        this.pageNo = res.meta!.current_page;
        this.pageSize = res.meta!.per_page;
        this.pageTotal = res.meta!.total;

        this.products ??= [];
        this.products = this.products!.concat(res.data!);
        this.isLoading = false;
      },
      error: (err) => {
        console.log("getProductsWithQuery", err);
        this.isLoading = false;
      }
    }));
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
