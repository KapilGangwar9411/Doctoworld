import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Howl } from 'howler';

@Injectable({
  providedIn: 'root'
})
export class NotificationPushService {
  public permission: Permission;

  constructor() {
    this.permission = this.isSupported() ? (<any>window).Notification.permission : 'default';
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }

  public isGranted(): boolean {
    return (<any>window).Notification.permission == "granted";
  }

  requestPermission(): void {
    let self = this;
    if ('Notification' in window) {
      Notification.requestPermission(function (status) {
        return self.permission = status;
      });
    }
  }

  create(title: string, options?: PushNotification, onNotiClick?:any): Observable<any> {
    let self = this;
    return new Observable(function (obs) {
      if (!('Notification' in window)) {
        console.log('Notifications are not available in this environment');
        obs.complete();
      }
      if (self.permission !== 'granted') {
        console.log("The user hasn't granted you permission to send push notifications");
        obs.complete();
      }
      let _notify = new Notification(title, options);
      _notify.onshow = function (e) {
        return obs.next({
          notification: _notify,
          event: e
        });
      };
      _notify.onclick = function (e) {
        if (onNotiClick != null) {
          onNotiClick();
        }
      };
      // _notify.onclick = function (e) {
      //   e.preventDefault(); // prevent the browser from focusing the Notification's tab
      //   window.open("http://www.mozilla.org", "_blank");
      // };
      _notify.onerror = function (e) {
        return obs.error({
          notification: _notify,
          event: e
        });
      };
      _notify.onclose = function () {
        return obs.complete();
      };
    });
  }

  generateNotification(source: Array<any>, onNotiClick?:any): void {
    let self = this;
    source.forEach((item) => {
      let options = {
        body: item.alertContent,
        icon: "assets/images/logo_small.png",
        sound: "assets/notification_sound.mp3"
      };
      self.create(item.title, options, onNotiClick).subscribe(res => {
        console.log("NOTI_RES", res);
        new Howl({
          src: ['assets/notification_sound.mp3']
        }).play();
      }, err => console.log("NOTI_CREATE", err));
    })
  }

}

export declare type Permission = 'denied' | 'granted' | 'default';
export interface PushNotification {
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
  renotify?: boolean;
  silent?: boolean;
  sound?: string;
  noscreen?: boolean;
  sticky?: boolean;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  vibrate?: number[];
} 