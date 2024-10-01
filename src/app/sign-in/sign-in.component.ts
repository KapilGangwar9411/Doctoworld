import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ConfirmationDialogService } from '../services/confirmation-dialog/confirmation-dialog.service';
import { ApiService } from '../services/network/api.service';
import { MyEventsService } from '../services/events/my-events.service';
import * as firebase from 'firebase/app';
import { SignUpRequest } from 'src/models/auth-signup-request.models';
import { Helper } from 'src/models/helper.models';
import { Constants } from 'src/models/constants.models';
import { AppConfig, APP_CONFIG } from '../app.config';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit, OnDestroy {
  showPage: string = 'login';
  private subscriptions = new Array<Subscription>();

  countries: any;
  phoneNumber?: string;
  countryCode: string = "";
  phoneNumberFull?: string;
  phoneNumberHint?: string;

  signUpRequest = new SignUpRequest();

  otp: string = "";
  private recaptchaVerifier?: firebase.auth.RecaptchaVerifier;
  private captchanotvarified = false;
  private captchaRendered = false;
  private result: any;
  private buttonDisabled: any = true;
  private component: any;
  private captchaVerified: boolean = false;
  private verfificationId: any;
  private timer: any;
  private minutes: number = 0;
  private seconds: number = 0;
  private totalSeconds: number = 0;
  private intervalCalled: boolean = false;
  private resendCode: boolean = false;
  private otpNotSent: boolean = true;
  private credential: any;
  private openDemoAlert: boolean = false;

  constructor(@Inject(APP_CONFIG) public config: AppConfig, private router: Router, private uiElementService: UiElementsService, private apiService: ApiService,
    private translate: TranslateService, private confirmationDialogService: ConfirmationDialogService, private myEventsService: MyEventsService) { }

  ngOnInit() {
    this.subscriptions.push(this.apiService.getCountries().subscribe(res => { this.countries = res; if (this.config.demoMode && !Helper.getLoggedInUser()) this.openDemoLogin(); }));
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  openDemoLogin() {
    this.openDemoAlert = true;
    this.countryCode = this.config.demoLoginCredentials.country;
    setTimeout(() => this.phoneNumber = this.config.demoLoginCredentials.phoneNumber, 500);
    this.translate.get(['demo_login_title', 'demo_login_message', 'okay']).subscribe(text => {
      this.confirmationDialogService.confirm(text['demo_login_title'], text['demo_login_message'], text['yes'], text['no']).then((confirmed) => {
        if (confirmed) {
          this.openDemoAlert = false;
        }
      }).catch(() => { console.log('err') });
    });
  }

  showDiv(divVal: string) {
    this.showPage = divVal;
  }

  changeHint() {
    this.phoneNumber = "";
    if (this.countryCode && this.countryCode.length) {
      this.translate.get('enter_phone_number_exluding').subscribe(value => this.phoneNumberHint = (value + " (+" + this.countryCode + ")"));
    } else {
      this.translate.get('enter_phone_number').subscribe(value => this.phoneNumberHint = value);
    }
  }

  alertPhoneLogin() {
    if (!this.countryCode || !this.countryCode.length) {
      this.translate.get("select_country").subscribe(value => this.uiElementService.showErrorToastr(value));
      return;
    }
    if (!this.phoneNumber || !String(this.phoneNumber).length) {
      this.uiElementService.showErrorToastr(this.phoneNumberHint!);
      return;
    }
    this.translate.get(['alert_phone', 'no', 'yes']).subscribe(text => {
      this.phoneNumberFull = "+" + this.countryCode + Helper.formatPhone(String(this.phoneNumber));
      this.confirmationDialogService.confirm(this.phoneNumberFull, text['alert_phone'], text['yes'], text['no']).then((confirmed) => { if (confirmed) this.checkIfExists() }).catch(() => { console.log('err') });
    });
    // this.checkIfExists();
  }

  alertPhoneSignup() {
    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (this.signUpRequest.name.length < 2) {
      this.translate.get("err_valid_name").subscribe(value => this.uiElementService.showErrorToastr(value));
    } else if (this.signUpRequest.email.length <= 5 || !reg.test(this.signUpRequest.email)) {
      this.translate.get("err_valid_email").subscribe(value => this.uiElementService.showErrorToastr(value));
    } else if (!this.countryCode || !this.countryCode.length || !this.phoneNumber || !String(this.phoneNumber).length) {
      this.translate.get("err_valid_phone").subscribe(value => this.uiElementService.showErrorToastr(value));
    } else {
      this.translate.get(['alert_phone', 'no', 'yes']).subscribe(text => {
        this.phoneNumberFull = "+" + this.countryCode + Helper.formatPhone(String(this.phoneNumber));
        this.confirmationDialogService.confirm(this.phoneNumberFull, text['alert_phone'], text['yes'], text['no']).then((confirmed) => {
          if (confirmed) {
            this.signUpRequest.password = String(Math.floor(100000 + Math.random() * 900000));
            this.signUpRequest.mobile_number = this.phoneNumberFull!;
            this.signUp();
          }
        }).catch(() => { console.log('err') });
      });
    }
  }

  private signUp() {
    this.translate.get("signing_up").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.createUser(this.signUpRequest).subscribe({
        next: (res) => {
          this.uiElementService.dismissLoading();
          this.initVerification();
        }, error: (err) => {
          console.log(err);
          this.uiElementService.dismissLoading();
          let errMsg;
          this.translate.get(['invalid_credentials', 'invalid_credential_email', 'invalid_credential_phone', 'invalid_credential_password']).subscribe(value => {
            errMsg = value['invalid_credentials'];
            if (err && err.error && err.error.errors) {
              if (err.error.errors.email) {
                errMsg = value['invalid_credential_email'];
              } else if (err.error.errors.mobile_number) {
                errMsg = value['invalid_credential_phone'];
              } else if (err.error.errors.password) {
                errMsg = value['invalid_credential_password'];
              }
            }
            this.uiElementService.showErrorToastr(errMsg);
          });
        }
      }));
    });
  }

  private checkIfExists() {
    this.translate.get('just_moment').subscribe(value => {
      // this.phoneNumberFull = "+" + this.countryCode + Helper.formatPhone(this.phoneNumber);
      this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.checkUser({ mobile_number: this.phoneNumberFull, role: Constants.ROLE_USER }).subscribe({
        next: (res) => {
          this.uiElementService.dismissLoading();
          this.initVerification();
        }, error: (err) => {
          console.log(err);
          this.uiElementService.dismissLoading();
          this.initRegistration();
        }
      }));
    });
  }

  private initRegistration() {
    this.showDiv("register");
  }

  private initVerification() {
    this.showDiv("verification");
    this.makeCaptcha();
    this.sendOTP();
  }

  private makeCaptcha() {
    if (!this.captchaRendered) {
      const component = this;
      this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        // 'size': 'normal',
        'size': 'invisible',
        'callback': function (response: any) {
          component.captchanotvarified = true;
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
      this.recaptchaVerifier.render().then(value => this.captchaRendered = true);
    }
  }

  private sendOTP() {
    this.resendCode = false;
    this.otpNotSent = true;
    this.sendOtpBrowser();
    // }
    if (this.intervalCalled) {
      clearInterval(this.timer);
    }
  }

  sendOtpBrowser() {
    this.translate.get('sending_otp').subscribe(value => {
      const component = this;
      this.uiElementService.presentLoading(value);
      firebase.auth().signInWithPhoneNumber(this.phoneNumberFull!, this.recaptchaVerifier!).then((confirmationResult) => {
        component.otpNotSent = false;
        component.result = confirmationResult;
        component.uiElementService.dismissLoading();
        component.translate.get("sending_otp_success").subscribe(value => component.uiElementService.showSuccessToastr(value));
        if (component.config.demoMode && component.phoneNumber == component.config.demoLoginCredentials.phoneNumber) { component.otp = component.config.demoLoginCredentials.otp; component.verifyOtpBrowser(); };
        if (component.intervalCalled) {
          clearInterval(component.timer);
        }
        component.createInterval();
      }).catch(function (error) {
        console.log("otp_send_fail", error);
        component.resendCode = true;
        component.uiElementService.dismissLoading();
        if (error.message) {
          component.uiElementService.showErrorToastr(error.message);
        } else {
          component.translate.get('sending_otp_fail').subscribe(text => component.uiElementService.showErrorToastr(text));
        }
      });
    })
  }

  private createInterval() {
    this.totalSeconds = 120;
    this.createTimer();
    this.timer = setInterval(() => this.createTimer(), 1000);
  }

  private createTimer() {
    this.intervalCalled = true;
    this.totalSeconds--;
    if (this.totalSeconds == 0) {
      this.otpNotSent = true;
      this.resendCode = true;
      clearInterval(this.timer);
    } else {
      this.seconds = (this.totalSeconds % 60);
      if (this.totalSeconds >= this.seconds) {
        this.minutes = (this.totalSeconds - this.seconds) / 60
      } else {
        this.minutes = 0;
      }
    }
  }

  submitOtp() {
    if (this.otp && String(this.otp).length) {
      this.otpNotSent = true;
      this.verifyOtpBrowser();
    } else {
      this.translate.get('enter_verification_code').subscribe(value => this.uiElementService.showErrorToastr(value));
    }
  }

  private verifyOtpBrowser() {
    const component = this;
    this.uiElementService.presentLoading(this.translate.instant('verifying_otp'));
    this.result.confirm(String(this.otp)).then(function (response: any) {
      component.uiElementService.dismissLoading();
      component.translate.get('otp_verified').subscribe(text => component.uiElementService.showSuccessToastr(text));
      component.getUserToken(response.user);
    }).catch(function (error: any) {
      console.log('otp_verify_fail', error);
      if (error.message) {
        component.uiElementService.showErrorToastr(error.message);
      } else {
        component.translate.get('verify_otp_err').subscribe(text => component.uiElementService.showErrorToastr(text));
      }
      component.uiElementService.dismissLoading();
    });
  }

  private getUserToken(user: any) {
    user.getIdToken(false).then((res: any) => {
      console.log('user_token_success', res);
      this.loginUser(res);
    }).catch((err: any) => {
      console.log('user_token_failure', err);
    });
  }
  private loginUser(token: string) {
    this.translate.get('just_moment').subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.loginUser({ token: token, role: Constants.ROLE_USER }).subscribe({
        next: (res) => {
          this.uiElementService.dismissLoading();
          Helper.setLoggedInUserResponse(res);
          this.apiService.setupHeaders(res.token!);
          this.myEventsService.setUserMeData(res.user!);
        }, error: (err) => {
          console.log(err);
          this.uiElementService.dismissLoading();
          this.uiElementService.showErrorToastr((err && err.error && err.error.message && String(err.error.message).toLowerCase().includes("role")) ? "User exists with different role" : "Something went wrong");
        }
      }));
    });
  }

  navHome() {
    this.router.navigateByUrl('home');
  }
}
