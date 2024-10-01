import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { RateRequest } from 'src/models/rate-request.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-rate-doctor',
  templateUrl: './rate-doctor.component.html',
  styleUrls: ['./rate-doctor.component.scss']
})
export class RateDoctorComponent {
  private subscriptions = new Array<Subscription>();
  private appointmentId = -1;
  doctor = new Doctor();
  rateReason!: string;
  rateRequest = new RateRequest();
  rateReasonExists = false;
  @Input() public feedback: any;

  constructor(private uiElementService: UiElementsService,private modalService: NgbModal, private activeModal: NgbActiveModal,
    private translate: TranslateService, private apiService: ApiService) { }

  ngOnInit() {
    console.log("feedback",this.feedback);
    if (this.feedback) {
      this.doctor = this.feedback.doctor;
      this.appointmentId = this.feedback.appointmentId;
      this.rateReason = this.feedback.rateReason;
      this.rateRequest.rating = 3;
      this.rateReasonExists = (this.rateReason != null && this.rateReason.length > 0);
    }
  }

  onDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  setRating(rating: number) {
    this.rateRequest.rating = rating;
  }

  submitRating() {
    if (!this.rateRequest.review || !this.rateRequest.review.length) {
      this.translate.get("err_review").subscribe(value => this.uiElementService.showErrorToastr(value));
    } else {
      this.translate.get("just_moment").subscribe(value => {
        this.uiElementService.presentLoading(value);
        this.subscriptions.push(this.apiService.postReviewDoctor(String(this.doctor.id), this.rateRequest).subscribe(res => {
          console.log("postReviewDoctor", res);
          Helper.addReviewedDoctorId(String(this.doctor.id + String(this.appointmentId)));
          this.uiElementService.dismissLoading();
          this.translate.get("review_done").subscribe(value => this.uiElementService.showSuccessToastr(value));
          this.activeModal.close();
        }, err => {
          this.uiElementService.dismissLoading();
          console.log("postReviewDoctor", err);
          let found = false;
          if (err && err.error && err.error.errors) {
            if (err.error.errors.review) {
              found = true;
              this.translate.get("err_review_length").subscribe(value => this.uiElementService.showErrorToastr(value));
            }
          }
          if (!found) this.translate.get("something_went_wrong").subscribe(value => this.uiElementService.showErrorToastr(value));
          this.activeModal.close();

        }));
      });
    }
  }
  close(){
    this.activeModal.close();
  }
}
