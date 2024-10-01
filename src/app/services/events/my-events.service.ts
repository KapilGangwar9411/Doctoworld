import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs'; // For rxjs 6
import { User } from 'src/models/user.models';
import { MyAddress } from 'src/models/address.models';

@Injectable({
    providedIn: 'root'
})
export class MyEventsService {
    private unReadApIds = new BehaviorSubject<Array<number>>([]);
    private customEvent = new Subject<string>();
    private selectedLanguage = new Subject<string>();
    private currentUser = new Subject<User>();
    private currentLocation = new Subject<MyAddress>();
    private addressChanged = new Subject<any>();

    constructor() { }

    public getUnReadAppointmentIdsObservable(): Observable<Array<number>> {
        return this.unReadApIds.asObservable();
    }

    public setUnReadAppointmentIds(data: Array<string>) {
        let numberData = [];
        if (data && data.length) for (let d of data) numberData.push(Number(d));
        this.unReadApIds.next(numberData);
    }

    public getLanguageObservable(): Observable<string> {
        return this.selectedLanguage.asObservable();
    }

    public setLanguageData(data: string) {
        this.selectedLanguage.next(data);
    }

    public getUserMeObservable(): Observable<User> {
        return this.currentUser.asObservable();
    }

    public setUserMeData(data: User) {
        this.currentUser.next(data);
    }

    public setAddressData(data: MyAddress) {
        this.currentLocation.next(data);
    }

    public getAddressObservable(): Observable<MyAddress> {
        return this.currentLocation.asObservable();
    }

    public setAddressChanged(data: any) {
        this.addressChanged.next(data);
    }

    public getAddressChangedObservable(): Observable<any> {
        return this.addressChanged.asObservable();
    }

    public setCustomEventData(data: string) {
        this.customEvent.next(data);
    }

    public getCustomEventObservable(): Observable<string> {
        return this.customEvent.asObservable();
    }
}
