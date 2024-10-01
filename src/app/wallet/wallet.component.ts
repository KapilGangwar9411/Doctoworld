import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { BaseListResponse } from 'src/models/base-list.models';
import { Helper } from 'src/models/helper.models';
import { WalletTransaction } from 'src/models/wallet-transaction.models';
import { SendToBankComponent } from '../send-to-bank/send-to-bank.component';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent {
  private subscriptions = new Array<Subscription>();
  private nextUrl!: string;
  isLoading = true;
  transactions = new Array<WalletTransaction>();
  currency_icon!: string;
  balance = 0;
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;
  isResponsive = true;

  constructor(private translate: TranslateService, private router: Router, private modalService: NgbModal,
    private uiElementService: UiElementsService, private apiService: ApiService) { }

  ngOnInit() {
    this.currency_icon = Helper.getSetting("currency_icon");
    this.refreshBalance();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  refreshBalance() {
    this.subscriptions.push(this.apiService.getBalance().subscribe(res => {
      if (res.balance != this.balance || ((!this.transactions || !this.transactions.length) && res.balance != 0)) {
        this.transactions = [];
        this.isLoading = true;
        this.subscriptions.push(this.apiService.getTransactions().subscribe(res => this.handleTransactionRes(res), err => this.handleTransactionErr(err)));
      } else {
        this.isLoading = false;
      }
      this.balance = res.balance;
    }, err => {
      console.log("getBalance", err);
      this.isLoading = false;
    }));
  }

  handleTransactionRes(res: BaseListResponse) {
    this.pageNo = res.meta!.current_page;
    this.pageSize = res.meta!.per_page;
    this.pageTotal = res.meta!.total;
    this.transactions = res.data;
    this.nextUrl = res.links.next;
    // if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
    this.isLoading = false;
    this.uiElementService.dismissLoading();
  }

  handleTransactionErr(err: any) {
    console.log("handleTransactionErr", err);
    this.uiElementService.dismissLoading();
    this.isLoading = false;
  }

  onChangePage(event: any) {
    this.pageNo = event;
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.isLoading = true;
      this.subscriptions.push(this.apiService.getURL(this.nextUrl).subscribe(res => {
        if (res && res.data && res.data.length) for (let trans of res.data) this.apiService.setupTransaction(trans);
        this.handleTransactionRes(res);
      }, err => this.handleTransactionErr(err)));
    });
  }

  navAddMoney() {
    // this.navCtrl.navigateForward(['./add-money']);
  }

  sendToBank() {
    const modalRef = this.modalService.open(SendToBankComponent, { windowClass: 'fullWidth' });
  }
}