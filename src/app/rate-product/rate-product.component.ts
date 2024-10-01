import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Helper } from 'src/models/helper.models';
import { Order } from 'src/models/order.models';
import { Product } from 'src/models/product.models';
import { productRateRequest } from 'src/models/rate-request.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-rate-product',
  templateUrl: './rate-product.component.html',
  styleUrls: ['./rate-product.component.scss']
})
export class RateProductComponent {
  private subscriptions = new Array<Subscription>();
  order = new Order();
  rateRequest = new Array<productRateRequest>();
  products = new Array<Product>();
  @Input() public feedback: any;

  constructor(private router: Router, private translate: TranslateService,private modalService: NgbModal, private activeModal: NgbActiveModal,
    private uiElementService: UiElementsService, private apiService: ApiService) {

  }

  ngOnInit() {
    console.log("getCurrentNavigation", this.feedback);
    if (this.feedback) {
      this.order = this.feedback.order;
      this.order.products.map((element) => { if (!element.vendor_product.product.reviewed) { this.rateRequest.push({ productId: element.vendor_product.product.id, rating: 3, review: '' }); this.products.push(element.vendor_product.product) } })
      // this.rateRequest.rating = 3;
    }
  }

  ionViewWillLeave() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  setRating(rating:number, index: any) {
    this.rateRequest[index].rating = rating;
  }

  submitRating() {
    if (!this.checkReview()) {
      this.translate.get("err_review").subscribe(value => this.uiElementService.showErrorToastr(value));
    } else {
      this.translate.get("just_moment").subscribe(value => {
        this.uiElementService.presentLoading(value);
        let reviewReq = new Array<any>();
        for (let review of this.rateRequest) if (review.review && review.review.length) reviewReq.push(review)
        this.subscriptions.push(this.apiService.postReviewProducts(reviewReq).subscribe(res => {
          console.log("postReviewProduct", res);
          for (let review of reviewReq) Helper.addReviewedProductId(String(this.order.id + String(review.productId)));
          this.uiElementService.dismissLoading();
          this.translate.get("review_done").subscribe(value => this.uiElementService.showSuccessToastr(value));
          // this.navCtrl.navigateRoot(['./home']);
          this.close();
        }, err => {
          this.uiElementService.dismissLoading();
          console.log("postReviewProduct", err);
          let found = false;
          if (err && err.error && err.error.errors) {
            if (err.error.errors.review) {
              found = true;
              this.translate.get("err_review_length").subscribe(value => this.uiElementService.showErrorToastr(value));
            }
          }
          if (!found) this.translate.get("something_went_wrong").subscribe(value => this.uiElementService.showErrorToastr(value));
          this.close();

        }));
      });
    }
  }

  private checkReview(): boolean {
    let toReturn = false
    for (let i of this.rateRequest) if (i.review && i.review.length) toReturn = true;
    console.log("review",this.rateRequest);
    return toReturn;
  }

  close() {
    this.activeModal.close("true");
  }
}