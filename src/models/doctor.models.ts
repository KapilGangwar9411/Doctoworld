import { User } from './user.models';
import { Category } from './category.models';
import { Hospital } from './hospital.models';
import * as moment from 'moment';

export class Doctor {
    id!: number;
    name!: string;
    tagline!: string;
    details!: string;
    meta: any;
    experience_years!: number;
    consultancy_fee!: number;
    fee!: number;
    address!: string;
    longitude!: string;
    latitude!: string;
    is_verified!: boolean;
    user_id!: number;
    is_favourite!: boolean;
    created_at!: string;
    updated_at!: string;
    ratings_count!: number;
    ratings!: number;
    mediaurls!: { images: Array<any>; };
    degrees!: Array<Category>;
    specializations!: Array<Category>;
    services!: Array<Category>;
    hospitals!: Array<Hospital>;
    availability!: Array<AvailabilityDateTime>;
    user!: User;

    hospitals_text!: string;
    degrees_text!: string;
    specializations_text!: string;
    services_text!: string;
    image!: string;
    hospitalClosest!: Hospital;
}

export class AvailabilityDateTime {
    days: string;
    from!: string;
    to!: string;
    selected!: boolean;
    dateFromISO!: string;
    dateToISO!: string;

    constructor(days: string) {
        this.days = days;
        this.setTime("07:00:00", "21:00:00");
    }

    setTime(timeFrom: string, timeTo: string) {
        let momentStart = moment();
        let momentReturn = moment();
        let time_start_split = timeFrom.split(":");
        momentStart.set({ hour: Number(time_start_split[0]), minute: Number(time_start_split[1]), second: 0, millisecond: 0 });
        let time_return_split = timeTo.split(":");
        momentReturn.set({ hour: Number(time_return_split[0]), minute: Number(time_return_split[1]), second: 0, millisecond: 0 });
        this.from = time_start_split[0] + ":" + time_start_split[1];
        this.to = time_return_split[0] + ":" + time_return_split[1];
        this.dateFromISO = momentStart.format();
        this.dateToISO = momentReturn.format();
    }

    static getDefault(): Array<AvailabilityDateTime> {
        let toReturn = [
            new AvailabilityDateTime("sun"),
            new AvailabilityDateTime("mon"),
            new AvailabilityDateTime("tue"),
            new AvailabilityDateTime("wed"),
            new AvailabilityDateTime("thu"),
            new AvailabilityDateTime("fri"),
            new AvailabilityDateTime("sat")
        ];
        return toReturn;
    }

    static getRequest(adt: AvailabilityDateTime): { days: string; from: string; to: string; } {
        let momentFromDate = moment(adt.dateFromISO);
        let momentToDate = moment(adt.dateToISO);
        return { days: adt.days, from: momentFromDate.format("HH:mm"), to: momentToDate.format("HH:mm") };
    }
}
