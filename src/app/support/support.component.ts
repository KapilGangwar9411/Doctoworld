import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { SupportRequest } from 'src/models/support-request.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent {
  private subscriptions = new Array<Subscription>();
  supportRequest: SupportRequest;

  constructor(private translate: TranslateService, private uiElementService: UiElementsService, private apiService: ApiService, private router: Router) {
    let userMe = apiService.getUserMe();
    this.supportRequest = new SupportRequest(userMe.name, userMe.email);
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  submit() {
    this.supportRequest.message = this.supportRequest.message.trim();
    if (this.supportRequest && this.supportRequest.message) {
      this.translate.get(["supporting", "supporting_success", "something_wrong"]).subscribe(values => {
        this.uiElementService.presentLoading(values["supporting"]);
        this.subscriptions.push(this.apiService.submitSupport(this.supportRequest).subscribe(res => {
          this.uiElementService.dismissLoading();
          this.uiElementService.showSuccessToastr(values["supporting_success"]);
          this.router.navigate(['home']);
        }, err => {
          console.log("submitSupport", err);
          this.uiElementService.dismissLoading();
          this.uiElementService.showErrorToastr(values["something_wrong"]);
        }));
      });
    } else {
      this.translate.get("err_valid_support_msg").subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }
}
