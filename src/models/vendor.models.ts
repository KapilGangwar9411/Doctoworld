import { User } from './user.models';

export class Vendor {
    id!: number;
    name!: string;
    tagline!: string;
    details!: string;
    meta: any;
    mediaurls!: { images: Array<any>; };
    minimum_order!: number;
    delivery_fee!: number;
    area!: string;
    address!: string;
    longitude!: number;
    latitude!: number;
    is_verified!: number;
    user_id!: number;
    user!: User;

    image!: string;
    distance!: number;
    distance_toshow!: string;
    categories!: Array<any>;
    categories_text!: string;
    is_favourite!: boolean;
}