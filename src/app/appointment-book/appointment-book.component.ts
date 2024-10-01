import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { PaymentMethod } from 'src/models/payment-method.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { FirebaseUploaderService } from '../services/network/firebase-uploader.service';

@Component({
  selector: 'app-appointment-book',
  templateUrl: './appointment-book.component.html',
  styleUrls: ['./appointment-book.component.scss']
})
export class AppointmentBookComponent {
  private subscriptions = new Array<Subscription>();
  private use24HourFormat = true;
  private minutesApart = 30;

  appointmentReason!: string;
  appointment_type!: string;

  weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  datesTimesData: Array<{ month: number, monthText: string, datesData: Array<{ date: Date, dateFormatted: string, times: Array<{ time: string, dateTimeMoment: moment.Moment }> }> }> = [];

  monthSelected = 0;
  timeSelected = "";

  indexMonthSelected = 0;
  indexDateSelected = 0;
  selectedDateTimeMoment!: moment.Moment;

  records: Array<{ title: string; url: string; }> = [];
  private recordTitle!: string;
  private locale!: string;
  private paymentMethod = new PaymentMethod();
  private stripeCardTokenId!: string;
  doctor = new Doctor();
  isLoading = true;

  constructor(private router: Router, private uiElementService: UiElementsService, private route: ActivatedRoute,
    private translate: TranslateService, private apiService: ApiService, private fireUpService: FirebaseUploaderService) { }


  ngOnInit() {
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      let data = JSON.parse(params["data"])
      this.doctor = data.doctor;
      this.paymentMethod = data["payment_gateway"];
      this.appointment_type = data["appointment_type"];
      this.locale = Helper.getLocale();
      this.onLoadSchedule();

    }));
  }

  onLoadSchedule() {
    this.isLoading = true;
    this.translate.get("loading_schedule").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.getDoctorSchedule(this.doctor.id, 30, moment().format("YYYY-MM-DD")).subscribe(res => {
        this.uiElementService.dismissLoading();
        if (res.schedule && res.schedule.length) {
          let now = moment();
          for (let availability of res.schedule) {
            let mom = moment(availability.time);
            if (mom > now && !availability.is_scheduled) this.insertDate(mom);
          }
          this.indexMonthSelected = 0;
          this.indexDateSelected = 0
          this.monthSelected = this.datesTimesData[this.indexMonthSelected].month;
        }
        this.isLoading = false;
      }, err => {
        console.log("getDoctorSchedule", err);
        this.uiElementService.dismissLoading();
        this.isLoading = false;
      }));
    });
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  private insertDate(mom: moment.Moment) {
    let indexMonth = -1;
    let date = mom.toDate();
    for (let i = 0; i < this.datesTimesData.length; i++) {
      if (this.datesTimesData[i].month == date.getMonth()) {
        indexMonth = i;
        break;
      }
    }

    if (indexMonth == -1) {
      this.datesTimesData.push({ month: date.getMonth(), monthText: moment(date).format("MMM YYYY"), datesData: [{ date: date, dateFormatted: mom.format("YYYY-MM-DD"), times: [{ time: Helper.formatMillisTime(mom.valueOf(), this.locale && this.locale.length ? this.locale : "en"), dateTimeMoment: mom }] }] });
    } else {
      let indexDate = -1;
      for (let i = 0; i < this.datesTimesData[indexMonth].datesData.length; i++) {
        if (this.datesTimesData[indexMonth].datesData[i].dateFormatted == mom.format("YYYY-MM-DD")) {
          indexDate = i;
          break;
        }
      }

      if (indexDate == -1) {
        this.datesTimesData[indexMonth].datesData.push({ date: date, dateFormatted: mom.format("YYYY-MM-DD"), times: [{ time: Helper.formatMillisTime(mom.valueOf(), this.locale && this.locale.length ? this.locale : "en"), dateTimeMoment: mom }] });
      } else {
        this.datesTimesData[indexMonth].datesData[indexDate].times.push({ time: Helper.formatMillisTime(mom.valueOf(), this.locale && this.locale.length ? this.locale : "en"), dateTimeMoment: mom });
      }

    }
  }

  changeMonth() {
    console.log("chnage",this.monthSelected)
    let index = -1;
    for (let i = 0; i < this.datesTimesData.length; i++) {
      if (this.datesTimesData[i].month == this.monthSelected) {
        index = i;
        break;
      }
    }
    if (index != -1) {
      this.indexMonthSelected = index;
      this.indexDateSelected = 0;
      this.timeSelected = "";
      // if (index == 0 || this.datesTimesData[index].datesData && this.datesTimesData[index].datesData.length > 27) {
      //   this.indexDateSelected = 0;
      //   this.timeSelected = "";
      // } else {
      //   this.translate.get("just_moment").subscribe(value => {
      //     this.uiElementService.presentLoading(value);
      //     let desiredMonth = moment().set('M', this.datesTimesData[index].month).set('D', 1);
      //     this.subscriptions.push(this.apiService.getDoctorSchedule(this.doctor.id, 30, desiredMonth.format("YYYY-MM-DD")).subscribe(res => {
      //       this.uiElementService.dismissLoading();
      //       if (res.schedule && res.schedule.length) {
      //         for (let availability of res.schedule) {
      //           let mom = moment(availability.time);
      //           this.insertDate(mom, availability.is_scheduled);
      //         }

      //         let indexNewMonth = -1;
      //         for (let i = 0; i < this.datesTimesData.length; i++) {
      //           if (this.datesTimesData[i].month == moment(res.schedule[res.schedule.length - 1].time).month()) {
      //             indexNewMonth = i;
      //             break;
      //           }
      //         }

      //         this.indexMonthSelected = indexNewMonth;
      //         this.indexDateSelected = 0;
      //         this.monthSelected = this.datesTimesData[this.indexMonthSelected].month;
      //       }
      //     }, err => {
      //       console.log("getDoctorSchedule", err);
      //       this.uiElementService.dismissLoading();
      //     }));
      //   });

      // }
    }
  }

  markSelectedDate(selectedDatesDataIndex: number) {
    this.indexDateSelected = selectedDatesDataIndex;
    this.timeSelected = "";
  }

  onTimeSelected(time: any) {
    if (time) {
      for (let timeData of this.datesTimesData[this.indexMonthSelected].datesData[this.indexDateSelected].times) {
        if (timeData.time == time) {
          this.selectedDateTimeMoment = timeData.dateTimeMoment;
          // if (timeData.is_scheduled) {
          //   this.translate.get("selected_time_availability_na").subscribe(value => this.uiElementService.presentToast(value));
          //   this.timeSelected = "";
          // } else {
          //   this.selectedDateTimeMoment = timeData.dateTimeMoment;
          // }
          break;
        }
      }
    }
  }

  createAppointment() {
    if (!this.monthSelected) {
      this.translate.get("err_field_date_select").subscribe(value => this.uiElementService.showErrorToastr(value));
    } else if (!this.selectedDateTimeMoment) {
      this.translate.get("err_field_time_select").subscribe(value => this.uiElementService.showErrorToastr(value));
    } else if (!this.appointmentReason || !this.appointmentReason.length) {
      this.translate.get("err_field_ap_reason").subscribe(value => this.uiElementService.showErrorToastr(value));
    } else {
      let dateFormatted = this.selectedDateTimeMoment.format("YYYY-MM-DD");
      if (this.selectedDateTimeMoment > moment()) {
        let apr = {
          payment_method_slug: this.paymentMethod.slug,
          amount: this.doctor.consultancy_fee,
          date: dateFormatted,
          time_from: this.selectedDateTimeMoment.format("HH:mm"),
          time_to: this.selectedDateTimeMoment.add(30, "m").format("HH:mm"),
          address: this.doctor.hospitalClosest.address,
          latitude: this.doctor.hospitalClosest.latitude,
          longitude: this.doctor.hospitalClosest.longitude,
          meta: JSON.stringify({ reason: this.appointmentReason, records: this.records, appointment_type: this.appointment_type })
        };
        this.translate.get(["ap_create_ing", "ap_create_ed", "ap_create_same_time", "ap_create_fail"]).subscribe(values => {
          this.uiElementService.presentLoading(values["ap_create_ing"]);
          this.subscriptions.push(this.apiService.createAppointment(String(this.doctor.id), apr).subscribe(res => {
            this.uiElementService.showSuccessToastr(values["ap_create_ed"]);
            this.router.navigate(['./appointment-booked'], {
              queryParams: {
                data: JSON.stringify({
                  payment: res.payment,
                  stripeTokenId: this.stripeCardTokenId,
                  payu_meta: {
                    name: res.user.name.replace(/\s/g, ''),
                    mobile: res.user.mobile_number.replace(/\s/g, ''),
                    email: res.user.email.replace(/\s/g, ''),
                    bookingId: String(Math.floor(Math.random() * (99 - 10 + 1) + 10)) + String(res.id),
                    productinfo: res.doctor.name.replace(/\s/g, ''),
                  }
                })
              }
            });
          }, err => {
            console.log("createAppointment", err);
            this.uiElementService.dismissLoading();
            if (err.status == 422) this.uiElementService.showErrorToastr(values["ap_create_same_time"]); else this.uiElementService.showErrorToastr(values["ap_create_fail"]);
          }));
        });
      } else {
        this.translate.get("err_field_timeslot_passed").subscribe(value => this.uiElementService.showErrorToastr(value));
      }
    }
  }

  onImageChange(e: any) {
    // if (e.target.files && e.target.files.length && e.target.accept == "image/*") {
    if (e.target.files && e.target.files.length) {
      const [file] = e.target.files;
      this.uploadImage(file);
    }
  }

  private uploadImage(file: any) {
    this.translate.get(["uploading_image", "uploading_fail"]).subscribe((values: any) => {
      this.uiElementService.presentLoading(values["uploading_image"]);
      this.fireUpService.uploadFile(file).then((res: any) => {
        this.uiElementService.dismissLoading();
        this.saveRecord(String(res));
      }, err => {
        console.log("resolveUriAndUpload", err);
        this.uiElementService.dismissLoading();
        this.uiElementService.showErrorToastr(values["uploading_fail"]);
      });
    });
  }

  saveRecord(recordLink: string) {
    this.records.push({ title: (this.recordTitle && this.recordTitle.length ? this.recordTitle : ("Attachment " + Number(this.records.length + 1).toString())), url: recordLink });
  }

  deleteRecord(index: any) {
    this.records.splice(index, 1);
    this.records.forEach((res, index) => res.title = (this.recordTitle && this.recordTitle.length ? this.recordTitle : ("Attachment " + (index + 1).toString())));
  }

}