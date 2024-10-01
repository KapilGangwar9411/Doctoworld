import { Component } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PaymentMethod } from 'src/models/payment-method.models';
import { ProcessPaymentComponent } from '../process-payment/process-payment.component';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-add-money',
  templateUrl: './add-money.component.html',
  styleUrls: ['./add-money.component.scss']
})
export class AddMoneyComponent {
  private subscriptions = new Array<Subscription>();
  private paymentDone = false;
  private payumoneyFailAlerted = false;
  private stripeCardTokenId!: string;
  paymentMethods = new Array<PaymentMethod>();
  paymentMethoIdSelected = -1;
  paymentMethoIdSelect: any = "";
  amount = 0;
  isLoading: boolean = true;

  constructor(private apiService: ApiService, private translate: TranslateService, private modalService: NgbModal,
    private uiElementService: UiElementsService) { }


  ngOnInit() {
    let listenProcessPayment = window.localStorage.getItem("listen_process_payment");
    if (listenProcessPayment && listenProcessPayment.length) {
      let resultProcessPayment = window.localStorage.getItem("result_process_payment");
      this.paymentDone = resultProcessPayment && resultProcessPayment == "true" ? true : false;
      window.localStorage.removeItem("listen_process_payment");
    }

    this.translate.get("loading").subscribe(value => {
      // this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.getPaymentMethods().subscribe(res => {
        this.paymentMethods = this.spliceFor(res, ["cod", "wallet"]);
        this.uiElementService.dismissLoading();
        this.isLoading = false;
      }, err => {
        console.log("getPaymentMethods", err);
        this.uiElementService.dismissLoading();
        this.isLoading = false;
      }));
    });
  }
  initAdd() {
    let selectedPaymentMethod = this.getSelectedPaymentMethod();
    console.log("amount", this.amount, selectedPaymentMethod)
    if (!(this.amount && this.amount > 0)) {
      this.translate.get("enter_amount_to_aad").subscribe(value => this.uiElementService.showErrorToastr(value));
    }else  if (this.amount && this.amount > 0 && selectedPaymentMethod != null) {
      if (selectedPaymentMethod.slug == "payu") {
        let keysMeta;
        try { keysMeta = JSON.parse(selectedPaymentMethod.meta); } catch (e) { console.log(e); }
        if (keysMeta && keysMeta.public_key && keysMeta.private_key) {
          this.proceedAddMoney(selectedPaymentMethod.slug);
        } else {
          this.translate.get("payment_setup_fail").subscribe(value => this.uiElementService.showErrorToastr(value));
        }
        // } else if (selectedPaymentMethod.slug == "stripe") {
        //   let keysMeta: any;
        //   try { keysMeta = JSON.parse(selectedPaymentMethod.meta); } catch (e) { console.log(e); }
        //   if (keysMeta && keysMeta.public_key) {
        //     if (this.stripeCardTokenId) {
        //       this.proceedAddMoney(selectedPaymentMethod.slug);
        //     } else {
        //       this.modalController.create({ component: CardInfoPage }).then((modalElement) => {
        //         modalElement.onDidDismiss().then(data => {
        //           console.log(data);
        //           if (data && data.data) {
        //             this.generateStripeCardIdToken(data.data, keysMeta.public_key);
        //           } else {
        //             this.translate.get("card_info_err").subscribe(value => this.uiElementService.showErrorToastr(value));
        //           }
        //         });
        //         modalElement.present();
        //       });
        //     }
        //   } else {
        //     this.translate.get("payment_setup_fail").subscribe(value => this.uiElementService.showErrorToastr(value));
        //   }
      } else if (selectedPaymentMethod.slug == "paystack") {
        this.proceedAddMoney(selectedPaymentMethod.slug);
      } else {
        this.translate.get("payment_setup_fail").subscribe(value => this.uiElementService.showErrorToastr(value));
      }
    } else {
      this.translate.get("select_payment").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

  // private generateStripeCardIdToken(cardInfo: CardInfo, stripeKey: string) {
  //   this.translate.get(["verifying_card", "invalid_card"]).subscribe(values => {
  //     this.uiElementService.presentLoading(values["just_moment"]);
  //     this.stripe.setPublishableKey(stripeKey);
  //     this.stripe.createCardToken(cardInfo as StripeCardTokenParams).then(token => {
  //       this.uiElementService.dismissLoading();
  //       this.stripeCardTokenId = token.id;
  //       this.initAdd();
  //     }).catch(error => {
  //       this.uiElementService.dismissLoading();
  //       this.uiElementService.presentToast(values["invalid_card"]);
  //       console.error(error);
  //     });
  //   });
  // }

  private proceedAddMoney(paymentMethodSlug: string) {
    this.translate.get(["just_moment", "something_wrong"]).subscribe(values => {
      this.uiElementService.presentLoading(values["just_moment"]);
      this.subscriptions.push(this.apiService.walletDeposit({ amount: String(this.amount), payment_method_slug: paymentMethodSlug }).subscribe(res => {
        this.uiElementService.dismissLoading();
        let payuMeta;
        if (paymentMethodSlug == "payu") {
          payuMeta = {
            name: this.apiService.getUserMe().name.replace(/\s/g, ''),
            mobile: this.apiService.getUserMe().mobile_number.replace(/\s/g, ''),
            email: this.apiService.getUserMe().email.replace(/\s/g, ''),
            bookingId: String(Math.floor(Math.random() * (99 - 10 + 1) + 10)) + String(res.id),
            productinfo: "Wallet Recharge",
          };
        }
        const modalRef = this.modalService.open(ProcessPaymentComponent, { size: 'xl' });
        modalRef.componentInstance.state = { payment: res, payuMeta: payuMeta, stripeTokenId: this.stripeCardTokenId };

        // let navigationExtras: NavigationExtras = { state: { payment: res, payuMeta: payuMeta, stripeTokenId: this.stripeCardTokenId } };
        // this.navCtrl.navigateForward(['./process-payment'], navigationExtras);
      }, err => {
        console.log("walletDeposit", err);
        this.uiElementService.dismissLoading();
        this.uiElementService.showErrorToastr(values["something_wrong"]);
      }));
    });
  }

  onPaymentMethodSelected(id: any) {
    if (id) {
      this.paymentMethoIdSelected = id;
    }
  }

  private getSelectedPaymentMethod(): PaymentMethod {
    let toReturn = null;
    for (let pm of this.paymentMethods) if (this.paymentMethoIdSelected == pm.id) { toReturn = pm; break; }
    return toReturn!;
  }

  private spliceFor(pgs: Array<PaymentMethod>, removeFor: Array<string>): Array<PaymentMethod> {
    let indexToRemove = -1;
    for (let i = 0; i < pgs.length; i++) {
      if (removeFor.includes(pgs[i].slug) || pgs[i].enabled != 1) {
        indexToRemove = i;
        break;
      }
    }
    if (indexToRemove != -1) {
      pgs.splice(indexToRemove, 1);
      return this.spliceFor(pgs, removeFor);
    } else {
      return pgs;
    }
  }

}
