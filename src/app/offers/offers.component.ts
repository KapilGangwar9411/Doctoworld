import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../services/network/api.service';
import { Subscription } from 'rxjs';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Category } from 'src/models/category.models';
import { Helper } from 'src/models/helper.models';
import { Constants } from 'src/models/constants.models';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  banners?: Array<Category>;
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

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.fetchBanners();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  private fetchBanners() {
    this.banners = Helper.getHomeBanners();
    this.subscriptions.push(this.apiService.getBanners(Constants.SCOPE_ECOMMERCE).subscribe({
      next: (res) => {
        this.banners = res;
        Helper.setHomeBanners(res);
      },
      error: (err) => console.log('getBanners', err)
    }));
  }

}
