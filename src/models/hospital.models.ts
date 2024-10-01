import { AvailabilityDateTime } from './doctor.models';
import { Category } from './category.models';

export class Hospital {
    id!: number;
    fee!: number;
    name!: string;
    tagline!: string;
    details!: string;
    meta: any;
    mediaurls!: { images: Array<any>; };
    address!: string;
    longitude!: string;
    latitude!: string;
    services!: Array<Category>;
    availability!: Array<AvailabilityDateTime>;
    is_favourite!: boolean;

    image!: string;
    images!: Array<string>;
    facilities!: string;
    showFacilities!: Array<any>;
}