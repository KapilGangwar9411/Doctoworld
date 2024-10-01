import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/network/api.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { TranslateService } from '@ngx-translate/core';
import * as firebase from 'firebase/app';
import { Order } from 'src/models/order.models';
import { Constants } from 'src/models/constants.models';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrderTrackingComponent } from '../order-tracking/order-tracking.component';
import { RateProductComponent } from '../rate-product/rate-product.component';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  isLoading = true;
  orders = new Array<Order>();
  orderToShow = new Order();
  toggleClass = false;
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;
  isResponsive = true;
  private myOrdersRef?: firebase.database.Reference | null | undefined;
  addClass1: boolean = false;
  appointmentInfo: boolean = true;
  private nextUrl: any;

  constructor(private apiService: ApiService, private router: Router, private uiElementService: UiElementsService,
    private translate: TranslateService, private modalService: NgbModal) { }

  ngOnInit() {
    this.fetchOrders();
  }

  ngOnDestroy() {
    if (this.myOrdersRef != null) {
      this.myOrdersRef.off();
    }
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  toggleOrderExpansion(order: Order) {
    order.products.map(product => {
      product.vendor_product.product.reviewed = (Helper.getReviewedProductIds() != null && Helper.getReviewedProductIds().includes(String(String(order.id) + String(product.vendor_product.product.id))));
    })
    this.orderToShow = order;
    this.addClass1 = !this.addClass1;
  }

  onScrollDown() {
    if (this.nextUrl && this.nextUrl.length) {
      this.isLoading = true;
      this.pageNo += 1;
      this.fetchOrders();
    }
  }


  onChangePage(event: any) {
    // this.pageNo = event;
    // this.orderToShow = new Order();
    // this.isLoading = true;
    // this.translate.get("loading").subscribe(value => {
    //   // this.uiElementService.presentLoading(value);
    //   this.fetchOrders();
    // });
  }

  private fetchOrders() {
    this.subscriptions.push(this.apiService.getOrders(this.pageNo).subscribe({
      next: (res) => {
        // this.pageNo = res.meta!.current_page;
        // this.pageSize = res.meta!.per_page;
        // this.pageTotal = res.meta!.total;
        for (let o of res.data!) {
          this.setupOrderProgress(o);
        }
        this.nextUrl = res.links.last;
        this.orders = this.orders.concat(res.data);
        // if (this.orders.length) {
        //   this.orderToShow = this.orders[0];
        // }
        this.reFilter();
        this.isLoading = false;
        if (res.meta?.current_page == 1 && res.data!.length) {
          this.registerUpdates();
        }

        this.uiElementService.dismissLoading();
      }, error: (err) => {
        console.log("getOrders", err);
        this.isLoading = false;
        this.uiElementService.dismissLoading();
      }
    }));
  }

  private reFilter() {
    let orderProgress = new Order();
    orderProgress.id = -1;
    orderProgress.order_type = "in_process";
    let orderPast = new Order();
    orderPast.id = -2;
    orderPast.order_type = "past";

    let statusesPast = "cancelled,rejected,refund,failed,complete";

    let allOrders = new Array<Order>();
    allOrders.push(orderProgress);
    for (let order of this.orders) if (order.id && order.id > 0 && !statusesPast.includes(order.status)) allOrders.push(order);
    allOrders.push(orderPast);
    for (let order of this.orders) if (order.id && order.id > 0 && statusesPast.includes(order.status)) allOrders.push(order);

    if (allOrders[1].id < 0) allOrders.splice(0, 1);
    if (allOrders[allOrders.length - 1].id < 0) allOrders.splice(allOrders.length - 1, 1);
    this.orders = allOrders.length ? allOrders : [];
  }

  private registerUpdates() {
    const component = this;
    if (this.myOrdersRef == null) {
      this.myOrdersRef = firebase.database().ref("users").child(`${this.apiService.getUserMe()!.id}`).child("orders");
      this.myOrdersRef.on('child_changed', function (data) {
        var fireOrder = data.val() as { data: Order };
        console.log(fireOrder);
        if (fireOrder.data != null) component.updateStatusOnId(fireOrder.data.id!, fireOrder.data);
      });
    }
  }

  private updateStatusOnId(oId: number, oNew: Order) {
    let index = -1;
    for (let i = 0; i < this.orders.length; i++) {
      if (this.orders[i].id == oId) {
        index = i;
        break;
      }
    }
    if (index != -1) {

      this.orders[index].status = oNew.status;
      if (oNew.delivery != null) {
        oNew.delivery!.delivery!.user.image_url = "assets/images/empty_dp.png";
        if (!oNew.delivery?.delivery?.user.mediaurls || !oNew.delivery.delivery.user.mediaurls.images) oNew.delivery!.delivery!.user.mediaurls = { images: [] };
        for (let imgObj of oNew.delivery!.delivery!.user.mediaurls.images) if (imgObj["default"]) { oNew.delivery!.delivery!.user.image_url = imgObj["default"]; break; }
        this.orders[index].delivery = oNew.delivery;
      }

      this.orders.unshift(this.orders.splice(index, 1)[0]);
      this.setupOrderProgress(this.orders[0]);
      this.orderToShow = this.orders[0];
    }
  }

  private setupOrderProgress(order: Order) {
    switch (order.status) {
      case "cancelled":
      case "refund":
      case "hold":
      case "rejected":
      case "failed":
      case "new":
      case "pending":
        order.orderProgress = 0;
        break;
      case "accepted":
        order.orderProgress = 1;
        break;
      case "preparing":
      case "prepared":
      case "dispatched":
      case "intransit":
        order.orderProgress = 2;
        break;
      case "complete":
        order.orderProgress = 3;
        break;
    }
    if (order.meta && order.meta[Constants.KEY_PRESCRIPTION_URL]) order.prescriptionLink = order.meta[Constants.KEY_PRESCRIPTION_URL];
  }

  viewPresciption() {
    console.log("show", this.orderToShow?.prescriptionLink);
    window.open(this.orderToShow?.prescriptionLink);
  }

  // trackOrder() {
  //   let navigationExtras: NavigationExtras = { state: { delivery: this.orderToShow?.delivery, address: this.orderToShow?.address, vendor: { name: this.orderToShow?.vendor.name, image: this.orderToShow?.vendor.image, location: { latitude: this.orderToShow?.vendor.latitude, longitude: this.orderToShow?.vendor.longitude } } } };
  //   this.router.navigate(['./order-tracking'], navigationExtras);
  // }
  trackOrder() {
    console.log("this.orderToShow", this.orderToShow);
    const modalRef = this.modalService.open(OrderTrackingComponent, { size: 'xl' });
    modalRef.componentInstance.order = { delivery: this.orderToShow?.delivery, address: this.orderToShow?.address, vendor: { name: this.orderToShow?.vendor.name, image: this.orderToShow?.vendor.image, location: { latitude: this.orderToShow?.vendor.latitude, longitude: this.orderToShow?.vendor.longitude } } };
  }

  showAppointment1() {
    this.addClass1 = !this.addClass1;
  }
  canRate(): boolean {
    let checkReviewsStatus = false;
    if (this.orderToShow && this.orderToShow.products && this.orderToShow.products.length) this.orderToShow.products.map((element) => {
      if (!element.vendor_product.product.reviewed) {
        checkReviewsStatus = true;
      }
    })
    return this.orderToShow && this.orderToShow.status == "complete" && checkReviewsStatus;
  }
  navReviewProduct() {
    let checkReviewsStatus = false;
    this.orderToShow.products.map((element) => {
      if (!element.vendor_product.product.reviewed) {
        checkReviewsStatus = true;
      }
    })
    if (checkReviewsStatus) {
      const modalRef = this.modalService.open(RateProductComponent, { windowClass: 'fullWidth' });
      modalRef.componentInstance.feedback = { order: this.orderToShow };
      modalRef.result.then(data => {
        if (data) {
          this.orderToShow.products.map(product => {
            product.vendor_product.product.reviewed = (Helper.getReviewedProductIds() != null && Helper.getReviewedProductIds().includes(String(String(this.orderToShow.id) + String(product.vendor_product.product.id))));
          })
        }
      })
    } else {
      this.translate.get("you_have_rated").subscribe(value => this.uiElementService.showErrorToastr(value));
    }

  }
}




