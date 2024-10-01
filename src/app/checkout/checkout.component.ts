import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/network/api.service';
import { ECommerceService } from '../services/common/ecommerce.service';
import { ConfirmationDialogService } from '../services/confirmation-dialog/confirmation-dialog.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { TranslateService } from '@ngx-translate/core';
import { MyEventsService } from '../services/events/my-events.service';
import { MyAddress } from 'src/models/address.models';
import { PaymentMethod } from 'src/models/payment-method.models';
import { OrderMultiVendor } from 'src/models/order-multi-vendor.models';
import { Helper } from 'src/models/helper.models';
import { OrderPayment } from 'src/models/order-payment.models';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  currencyIcon = "";

  addressSelected?: MyAddress | null | undefined;
  paymentSelected: PaymentMethod | null | undefined;
  pdIdSelected: number | null | undefined = -1;
  isLoadingPayments = true;
  paymentMethods = new Array<PaymentMethod>();
  private orderMultiVendor: OrderMultiVendor | null | undefined;

  constructor(private apiService: ApiService, private router: Router, public eComService: ECommerceService, private confirmationDialogService: ConfirmationDialogService,
    private myEventsService: MyEventsService, private translate: TranslateService, private uiElementService: UiElementsService) { }

  ngOnInit() {
    let as = Helper.getAddressSelected();
    this.addressSelected = as && as.id ? as : null;
    if (as) { this.eComService.setupOrderRequestAddress(as); }
    this.subscriptions.push(this.myEventsService.getAddressObservable().subscribe(myAddress => {
      this.addressSelected = myAddress;
      if (myAddress) { this.eComService.setupOrderRequestAddress(myAddress); }
      // try {
      //   this.modalService.dismissAll();
      // } catch (e) {
      //   console.log("modalService.dismissAl", e);
      // }
    }));
    this.currencyIcon = Helper.getSetting("currency_icon") ?? "";
    this.fetchPaymentGateways();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  pickLocation() {
    let navigationExtras: NavigationExtras = { state: { address_pick: true } };
    this.router.navigate(['./my-account'], navigationExtras);
  }

  onPaymentClick(payment: PaymentMethod) {
    this.paymentSelected = payment;
    this.pdIdSelected = payment.id;
  }

  proceedPlacement() {
    if (this.paymentSelected) {
      console.log("paymentSelected",this.paymentSelected);
      this.eComService.setupOrderRequestPaymentMethod(this.paymentSelected);
      if (this.paymentSelected.slug == "cod") {
        this.proceedPlaceOrder();
      } else if (this.paymentSelected.slug == "wallet") {
        this.translate.get(["just_moment", "insufficient_wallet"]).subscribe(values => {
          this.uiElementService.presentLoading(values["just_moment"]);
          this.subscriptions.push(this.apiService.getBalance().subscribe({
            next: (res) => {
              this.uiElementService.dismissLoading();
              if (res.balance >= (Number(this.eComService.getCartTotal(true)) ?? 0)) {
                this.proceedPlaceOrder();
              } else {
                this.uiElementService.showErrorToastr(values["insufficient_wallet"]);
              }
            }, error: (err) => {
              console.log("getBalance", err);
              this.uiElementService.dismissLoading();
              this.uiElementService.showErrorToastr(values["insufficient_wallet"]);
            }
          }));
        });
      } else {
        this.translate.get("payment_setup_fail").subscribe(value => this.uiElementService.showErrorToastr(value));
      }
    } else {
      this.translate.get("select_payment").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

  private proceedPlaceOrder() {
    let orderRequest = this.eComService.getOrderRequest();
    this.translate.get(["order_placing", "order_place_err"]).subscribe(values => {
      this.uiElementService.presentLoading(values["order_placing"]);
      this.subscriptions.push(this.apiService.createOrder(orderRequest).subscribe({
        next: (res) => {
          this.uiElementService.dismissLoading();
          this.processPayment(res);
        }, error: (err) => {
          console.log("createOrder", err);
          this.uiElementService.dismissLoading();
          this.uiElementService.showErrorToastr(values["order_place_err"]);
        }
      }));
    });
  }

  private processPayment(orderMultiVendor: OrderMultiVendor) {
    this.orderMultiVendor = orderMultiVendor;
    let orderPayment: OrderPayment = orderMultiVendor.payment ?? orderMultiVendor.order?.payment!;
    if (orderPayment.payment_method!.slug == "cod") {
      this.markPaymentSuccess();
    } else if (orderPayment.payment_method!.slug == "wallet") {
      this.translate.get(["just_moment", "something_wrong"]).subscribe(values => {
        this.uiElementService.presentLoading(values["just_moment"]);
        this.subscriptions.push(this.apiService.walletPayout(orderPayment.id!).subscribe({
          next: (res) => {
            this.uiElementService.dismissLoading();
            if (res.success) {
              this.markPaymentSuccess();
            } else {
              this.uiElementService.showErrorToastr(res.message);
              this.markPaymentFail();
            }
          }, error: (err) => {
            console.log("walletPayout", err);
            this.uiElementService.dismissLoading();
            this.uiElementService.showErrorToastr(values["something_wrong"]);
            this.markPaymentFail();
          }
        }));
      });
    }
  }

  private markPaymentSuccess() {
    //this.translate.get("order_placed").subscribe(value => this.uiElementService.showSuccessToastr(value));
    this.eComService.clearCart();
    let navigationExtras: NavigationExtras = { state: { orderMultiVendor: this.orderMultiVendor } };
    this.router.navigate(['./order-placed'], navigationExtras);
  }

  private markPaymentFail() {
    this.translate.get(["payment_failed", "payment_failed_msg", "okay"]).subscribe(values => this.confirmationDialogService.confirm(values["payment_failed"], values["payment_failed_msg"], values["okay"]).then((confirmed) => { }).catch(() => { console.log('err') }));
  }

  private fetchPaymentGateways() {
    this.subscriptions.push(this.apiService.getPaymentMethods().subscribe({
      next: (res) => {
        this.paymentMethods = res;
        this.isLoadingPayments = false;
      }, error: (err) => {
        console.log("getPaymentMethods", err);
        this.isLoadingPayments = false;
      }
    }));
  }

}
