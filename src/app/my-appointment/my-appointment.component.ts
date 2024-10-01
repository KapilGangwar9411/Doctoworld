import { Component, Inject, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { Appointment } from 'src/models/appointment.models';
import { Chat } from 'src/models/chat.models';
import { Constants } from 'src/models/constants.models';
import { Helper } from 'src/models/helper.models';
import { User } from 'src/models/user.models';
import { AppConfig, APP_CONFIG } from '../app.config';
import { ChatComponent } from '../chat/chat.component';
import { RateDoctorComponent } from '../rate-doctor/rate-doctor.component';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ConfirmationDialogService } from '../services/confirmation-dialog/confirmation-dialog.service';
import { MyEventsService } from '../services/events/my-events.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-my-appointment',
  templateUrl: './my-appointment.component.html',
  styleUrls: ['./my-appointment.component.scss']
})
export class MyAppointmentComponent implements OnInit {
  private once = false;
  private subscriptions = new Array<Subscription>();
  appointments = new Array<Appointment>();
  isLoading = true;
  pageNo = 1;
  pageSize: number = 0;
  pageTotal: number = 0;
  isResponsive = true;
  optionsAppointment = -1;
  userMe = new User();

  unRedAppointmentIds: Array<number> = [];
  showAppDetails = new Appointment();
  ap_date_formatted!: string;
  private reviewedDoctorIds = new Array<string>();
  private nextUrl!: string;

  constructor(@Inject(APP_CONFIG) public config: AppConfig, private translate: TranslateService, private uiElementService: UiElementsService, private apiService: ApiService,
    private myEvent: MyEventsService, private router: Router, private modalService:NgbModal, private confirmationDialogService: ConfirmationDialogService) { }


  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  ngOnInit() {
    this.myEvent.getUnReadAppointmentIdsObservable().subscribe(res => {
      if (res && res.length) this.unRedAppointmentIds = res;
      console.log("unRedAppointmentIds: ", this.unRedAppointmentIds);
    });

    this.userMe = Helper.getLoggedInUser();
    if (this.userMe != null) {
      this.translate.get("loading").subscribe(value => {
        // this.uiElementService.presentLoading(value);
        this.getAppointments();
      });
    } else {
      this.isLoading = false;
    }
  }

  getAppointments() {
    this.apiService.getAppointments(this.userMe.id, this.pageNo).subscribe(res => {
      this.isLoading = false;
      // this.pageNo = res.meta!.current_page;
      // this.pageSize = res.meta!.per_page;
      // this.pageTotal = res.meta!.total;
      this.nextUrl = res.links.next;
      this.appointments = this.appointments.concat(res.data);
      this.reFilter();
      this.uiElementService.dismissLoading();
      console.log("app",this.appointments);
    }, err => {
      console.log("getAppointments", err);
      this.isLoading = false;
      this.uiElementService.dismissLoading();
    });
  }



  confirmCancel(ap: Appointment) {
    this.showOptions(ap);
    this.translate.get(["cancel_ap_title", "cancel_ap_message", "no", "yes"]).subscribe(values => this.confirmationDialogService.confirm(values["cancel_ap_title"], values["cancel_ap_message"], values["yes"], values["no"]).then((confirmed) => {
      if (confirmed) {
        this.updateAppointmentStatus(String(ap.id), 'cancelled');
      }
    }).catch(() => { console.log('err') }));
    // this.translate.get(["cancel_ap_title", "cancel_ap_message", "no", "yes"]).subscribe(values => {
    //   // this.alertCtrl.create({
    //   //   header: values["cancel_ap_title"],
    //   //   message: values["cancel_ap_message"],
    //   //   buttons: [{
    //   //     text: values["no"],
    //   //     handler: () => { }
    //   //   }, {
    //   //     text: values["yes"],
    //   //     handler: () => {
    //   //       this.updateAppointmentStatus(ap.id, 'cancelled');
    //   //     }
    //   //   }]
    //   // }).then(alert => alert.present());
    // });

    // this.translate.get("just_moment").subscribe(value => {
    //   this.uiElementService.presentToast(value);
    //   this.subscriptions.push(this.apiService.getAppointmentById(ap.id).subscribe(res => {
    //     this.uiElementService.dismissLoading();
    //     if (res && res.doctor && res.doctor.hospitals) {
    //       if (res.status != "cancelled" && res.status != "rejected") {
    //         this.translate.get(["cancel_ap_title", "cancel_ap_message", "no", "yes"]).subscribe(values => {
    //           this.alertCtrl.create({
    //             header: values["cancel_ap_title"],
    //             message: values["cancel_ap_message"],
    //             buttons: [{
    //               text: values["no"],
    //               handler: () => { }
    //             }, {
    //               text: values["yes"],
    //               handler: () => {
    //                 this.updateAppointmentStatus(ap.id, 'cancelled');
    //               }
    //             }]
    //           }).then(alert => alert.present());
    //         });
    //       } else {
    //         this.updateAppointmentInList(res, this.appointmentsAll);
    //         this.updateAppointmentInList(res, this.appointmentsUpcoming);
    //         this.updateAppointmentInList(res, this.appointmentsPast);
    //       }
    //     }
    //   }, err => {
    //     console.log("updateAppointment", err);
    //     this.uiElementService.dismissLoading();
    //   }));
    // });

  }

  navAppointmentDetail(ap: any) {
    this.showAppDetails = ap;
    this.ap_date_formatted = Helper.formatTimestampDateTime((this.showAppDetails.date + " " + this.showAppDetails.time_from), Helper.getLocale());
    // this.showOptions(ap);
    // window.localStorage.setItem("appointment", JSON.stringify(ap));
    // this.navCtrl.navigateForward(['./appointment-detail']);
  }


  chatAppointment(ap: Appointment) {
    if (ap.status != "accepted") {
      this.translate.get(("appointment_status_msg_" + ap.status)).subscribe(value => this.uiElementService.showErrorToastr(value));
    } else if (ap.momentAppointment > moment.now()) {
      this.translate.get("appointment_not_started").subscribe(value => this.uiElementService.showErrorToastr((value + " " + ap.date_toshow + ", " + ap.time_from_toshow)));
    } else {
      if (this.userMe != null) {
        let chat = new Chat();
        chat.chatId = ap.doctor.user_id + Constants.ROLE_DOCTOR;
        chat.chatImage = ap.doctor.user.image_url;
        chat.chatName = ap.doctor.name;
        chat.chatStatus = Helper.formatTimestampDateTime((ap.date + " " + ap.time_from), Helper.getLocale()) + " | " + ((ap.meta && ap.meta.reason) ? ap.meta.reason : ap.doctor.specializations_text);
        chat.myId = ap.user.id + Constants.ROLE_USER;
        // let navigationExtras: NavigationExtras = { state: { chat: chat, doctor_user: ap.doctor.user, ap_id: ap.id } };
        // this.navCtrl.navigateForward(['./chat'], navigationExtras);
        const modalRef = this.modalService.open( ChatComponent, { windowClass: 'fullWidth' }); 
        modalRef.componentInstance.chatDetails = { chat: chat, doctor_user: ap.doctor.user, ap_id: ap.id };
      } else {
        this.alertLogin();
      }
    }
  }

  showOptions(ap: Appointment) {
    this.optionsAppointment = this.optionsAppointment == ap.id ? -1 : ap.id;
  }

  private updateAppointmentStatus(apId: string, statusToUpdate: string) {
    this.translate.get("just_moment").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.updateAppointment(apId, { status: statusToUpdate }).subscribe(res => {
        this.translate.get(("appointment_status_msg_" + res.status)).subscribe(value => this.uiElementService.showSuccessToastr(value));
        this.uiElementService.dismissLoading();
        this.updateAppointmentInList(res);
      }, err => {
        console.log("updateAppointment", err);
        this.uiElementService.dismissLoading();
      }));
    });
  }

  private updateAppointmentInList(ap: Appointment) {
    let index = -1;
    for (let i = 0; i < this.appointments.length; i++) {
      if (this.appointments[i].id == ap.id) {
        index = i;
        break;
      }
    }
    if (index != -1) {
      this.appointments[index] = ap;
      if (ap.status == "cancelled" || ap.status == "rejected" || ap.status == "complete") {
        this.reFilter();
      }
    }
  }

  // private reFilter() {
  //   let appointmentUpcoming = new Appointment();
  //   appointmentUpcoming.id = -1;
  //   appointmentUpcoming.type = "upcoming_appointments";
  //   let appointmentPast = new Appointment();
  //   appointmentPast.id = -2;
  //   appointmentPast.type = "past_appointments";

  //   let statusesPast = "cancelled,rejected,complete";

  //   let allAppointments = new Array<Appointment>();
  //   allAppointments.push(appointmentUpcoming);
  //   for (let order of this.appointments) if (order.id && order.id > 0 && !statusesPast.includes(order.status)) allAppointments.push(order);
  //   allAppointments.push(appointmentPast);
  //   for (let order of this.appointments) if (order.id && order.id > 0 && statusesPast.includes(order.status)) allAppointments.push(order);

  //   if (allAppointments[1].id < 0) allAppointments.splice(0, 1);
  //   if (allAppointments[allAppointments.length - 1].id < 0) allAppointments.splice(allAppointments.length - 1, 1);
  //   this.appointments = allAppointments.length ? allAppointments : [];
  // }


  private reFilter() {
    let appointmentUpcoming = new Appointment();
    appointmentUpcoming.id = -1;
    appointmentUpcoming.type = "upcoming_appointments";
    let appointmentPast = new Appointment();
    appointmentPast.id = -2;
    appointmentPast.type = "past_appointments";

    let statusesPast = "cancelled,rejected,complete";
    let now = moment();

    let allAppointments = new Array<Appointment>();
    let pendingAppointmentIds = new Array<number>();
    allAppointments.push(appointmentUpcoming);
    for (let order of this.appointments) if (order.id && order.id > 0 && !statusesPast.includes(order.status) && !this.appointmentDatePassed(now, order)) { allAppointments.push(order); pendingAppointmentIds.push(order.id); order.reschedule = false}
    allAppointments.push(appointmentPast);
    for (let order of this.appointments) if (order.id && order.id > 0 && !pendingAppointmentIds.includes(order.id)) {
      order.reschedule = true
      allAppointments.push(order);
    };

    if (allAppointments[1].id < 0) allAppointments.splice(0, 1);
    if (allAppointments[allAppointments.length - 1].id < 0) allAppointments.splice(allAppointments.length - 1, 1);
    this.appointments = allAppointments.length ? allAppointments : [];
  }

  private appointmentDatePassed(momentNow: number | moment.Moment, appointment: Appointment): boolean {
    if (!appointment.momentAppointment) appointment.momentAppointment = moment(appointment.date + " " + appointment.time_from);
    return momentNow > appointment.momentAppointment;
  }

  alertLogin() {
    if (!this.userMe) {
      this.translate.get("alert_login_short").subscribe(value => this.uiElementService.showErrorToastr(value));
      this.router.navigate(['./sign-in']);
    }
  }

  onScrollDown() {
    if(this.nextUrl && this.nextUrl.length){
      this.isLoading = true;
      this.pageNo += 1;
      this.getAppointments();
    }
  }

  onChangePage(event: any) {
    // this.pageNo = event;
    // this.appointments = new Array<Appointment>();
    // this.isLoading = true;
    // this.translate.get("loading").subscribe(value => {
    //   // this.uiElementService.presentLoading(value);
    //   this.getAppointments();
    // });
  }

  viewRecord(recordLink: any) {
    window.open(recordLink,'_blank');
  }

  canRate(): boolean {
     this.reviewedDoctorIds = Helper.getReviewedDoctorIds();
    return this.showAppDetails.status == "complete" && !this.reviewedDoctorIds.includes(String(this.showAppDetails.doctor.id + String(this.showAppDetails.id)));
  }
  // rateDoc() {
  //   let navigationExtras: NavigationExtras = { state: { doctor: this.showAppDetails.doctor, appointmentId: this.showAppDetails.id } };
  //   this.router.navigate(['./add-feedback'], navigationExtras);
  // }

  rateDoc() {
    if(this.canRate()){
      const modalRef = this.modalService.open( RateDoctorComponent, {windowClass: 'fullWidth'}) ;
      modalRef.componentInstance.feedback = { doctor: this.showAppDetails.doctor, appointmentId: this.showAppDetails.id };
    }else {
      this.translate.get("you_have_rated").subscribe(value => this.uiElementService.showErrorToastr(value)); 
    }
  }

  confirmReschedule(ap: Appointment){
    window.localStorage.setItem(Constants.TEMP_DOCTOR, JSON.stringify(ap.doctor));
    this.router.navigateByUrl('doctor-info');
  }
}
