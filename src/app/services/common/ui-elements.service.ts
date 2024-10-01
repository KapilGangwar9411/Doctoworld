import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class UiElementsService {
  private isLoading!: boolean;
  loadingText!: string;


  constructor(private toastr: ToastrService, private loadingController: NgxSpinnerService) { }

  showSuccessToastr(body: string, position?: string, duration?: number) {
    return this.toastr.success(body, "", { positionClass: `${(position && (position == "toast-bottom-center" || position == "toast-top-center")) ? position : 'toast-top-right'}`, timeOut: (duration && duration > 0) ? duration : 2000 });
  }

  showErrorToastr(body: string, position?: string, duration?: number) {
    return this.toastr.error(body, "", { positionClass: `${(position && (position == "toast-bottom-center" || position == "toast-top-center")) ? position : 'toast-top-right'}`, timeOut: (duration && duration > 0) ? duration : 2000 });
  }

  presentLoading(body: string) {
    return setTimeout(() => { this.loadingText = body ? body : "Loading..."; this.loadingController.show(); }, 100);
  }

  dismissLoading() {
    return this.loadingController.hide();
  }

}
