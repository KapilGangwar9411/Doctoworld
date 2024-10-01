import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { ProcessPaymentComponent } from '../process-payment/process-payment.component';
import { MyEventsService } from '../services/events/my-events.service';

@Component({
  selector: 'app-appointment-booked',
  templateUrl: './appointment-booked.component.html',
  styleUrls: ['./appointment-booked.component.scss']
})
export class AppointmentBookedComponent {
  private subscriptions = new Array<Subscription>();
  processing: boolean = false;
  paymentDone: boolean = false;

  private navTo!: string;

  constructor(private router: Router, private route: ActivatedRoute, private myEventsService: MyEventsService, private modalService: NgbModal) {
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      let data = JSON.parse(params["data"]);
      console.log("data", data)
      let vendor_id = data["vendor_id"];
      this.navTo = data["navto"];
      let appointmentPayment = data["payment"];
      let payuMeta = data["payu_meta"];
      let stripeTokenId = data["stripeTokenId"];
      let authorizeNetCard = data["authorizeNetCard"];
      this.paymentDone = appointmentPayment.payment_method.slug == "cod";
      this.processing = appointmentPayment.payment_method.slug != "cod";
      if (appointmentPayment.payment_method.slug != "cod") {
        const modalRef = this.modalService.open(ProcessPaymentComponent, { size: 'xl' });
        modalRef.componentInstance.state = { payment: appointmentPayment, payuMeta: payuMeta, stripeTokenId: stripeTokenId, authorizeNetCard: authorizeNetCard };
        modalRef.result.then(data => {
          if (data) {
            this.onUpdate();
          }
        })
      }

    }));
  }

  onUpdate() {
    let listenProcessPayment = window.localStorage.getItem("listen_process_payment");
    console.log("listenProcessPayment", listenProcessPayment, "this.processing", this.processing);
    if (listenProcessPayment && listenProcessPayment.length) {
      let resultProcessPayment = window.localStorage.getItem("result_process_payment");
      this.paymentDone = resultProcessPayment && resultProcessPayment == "true" ? true : false;
      this.processing = false;
      window.localStorage.removeItem("listen_process_payment");
    }
  }
  trackOrder() {
  }

  navMyAppointments(navAps: boolean) {
    this.router.navigate(['./my-appointment']);
    // if (navAps) setTimeout(() => this.myEventsService.setCustomEventData(this.navTo && this.navTo.length ? this.navTo : "nav:my_appointments"), 500);
  }
}
