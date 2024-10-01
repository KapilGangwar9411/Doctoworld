import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { BaseListResponse } from 'src/models/base-list.models';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { Product } from 'src/models/product.models';
import { Rating } from 'src/models/rating.models';
import { Review } from 'src/models/review.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-user-reviews',
  templateUrl: './user-reviews.component.html',
  styleUrls: ['./user-reviews.component.scss']
})
export class UserReviewsComponent {
  private once = false;
  private subscriptions = new Array<Subscription>();
  private nextUrl!: string;
  isLoading = true;
  rating = new Rating();
  reviews = new Array<Review>();
  isResponsive: boolean = true;
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;

  @Input() doctor = new Doctor();
  @Input() product = new Product();

  constructor(private router: Router, private translate: TranslateService,
    private uiElementService: UiElementsService, private apiService: ApiService) { }

  ngOnInit() {
    // this.rating = Rating.getDefault();
    if (this.product && this.product.id) {
      this.translate.get("loading").subscribe(value => {
        // this.uiElementService.presentLoading(value);
        this.isLoading = true;
        this.subscriptions.push(this.apiService.getReviewsProduct(String(this.product.id), 1).subscribe(res => this.reviewsRes(res), err => this.reviewsErr(err)));
      });
    }
    if (this.doctor && this.doctor.id) {
      this.translate.get("loading").subscribe(value => {
        // this.uiElementService.presentLoading(value);
        this.isLoading = true;
        this.subscriptions.push(this.apiService.getReviewsDoctor(String(this.doctor.id), 1).subscribe(res => this.reviewsRes(res), err => this.reviewsErr(err)));
      });
    }
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  private reviewsRes(res: BaseListResponse) {
    this.pageNo = res.meta!.current_page;
    this.pageSize = res.meta!.per_page;
    this.pageTotal = res.meta!.total;
    this.reviews = this.reviews.concat(res.data);
    console.log('review', this.reviews);
    this.nextUrl = res.links.next;
    this.isLoading = false;
    this.uiElementService.dismissLoading();
  }

  private reviewsErr(err: any) {
    console.log("productsErr", err);
    this.uiElementService.dismissLoading();
    this.isLoading = false;
  }

  onChangePage(event: any) {
    this.subscriptions.push(this.apiService.getURL(this.nextUrl).subscribe(res => {
      let locale = Helper.getLocale();
      for (let review of res.data) review.created_at = Helper.formatTimestampDate(review.created_at, locale);
      this.reviewsRes(res);
    }, err => this.reviewsErr(err)));
  }

}