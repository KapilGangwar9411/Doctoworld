import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Coupon } from 'src/models/coupon.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-my-offers',
  templateUrl: './my-offers.component.html',
  styleUrls: ['./my-offers.component.scss']
})
export class MyOffersComponent {
  private subscriptions = new Array<Subscription>();
  offers = new Array<Coupon>();
  isLoading = true;

  constructor( private translate: TranslateService,    private uiElementService: UiElementsService, private apiService: ApiService) {
    this.translate.get("loading").subscribe(value => {
      // this.uiElementService.presentLoading(value);
      this.getOffers();
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  getOffers() {
    this.apiService.getCoupons().subscribe(res => {
      this.isLoading = false;
      this.offers = this.offers.concat(res);
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("getCoupons", err);
      this.isLoading = false;
      this.uiElementService.dismissLoading();
    });
  }

  copyOffer(offer: Coupon) {
    const textarea = document.createElement('textarea');
    textarea.value = offer.code;
    // document.body.appendChild(textarea);
    // textarea.select();
    // document.execCommand('copy');
  }

}
