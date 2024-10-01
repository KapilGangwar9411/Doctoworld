import { Helper } from "./helper.models";

export class MyAddress {
    id!: number;
    user_id!: number;
    title!: string;
    address1!: string;
    address2!: string;
    formatted_address!: string;
    longitude!: string;
    latitude!: string;

    static getAddressToShow(myAddress: MyAddress): string {
        let toReturn = "";
        if (myAddress.address1 && myAddress.address1.length) toReturn += myAddress.address1;
        toReturn += " ";
        if (myAddress.address2 && myAddress.address2.length) toReturn += myAddress.address2;
        toReturn += " ";
        if (myAddress.formatted_address && myAddress.formatted_address.length) toReturn += myAddress.formatted_address;
        return toReturn.trim();
    }

    static gettAddressTitleToShow(myAddress: MyAddress): string {
        let toReturn = "";
        if (myAddress.title && myAddress.title.length) toReturn += myAddress.title; else if (myAddress.formatted_address && myAddress.formatted_address.length) toReturn += myAddress.formatted_address;
        return toReturn.trim();
    }

    static testAddress(): MyAddress {
        let toReturn = new MyAddress();
        toReturn.latitude = "29.3036874";
        toReturn.longitude = "78.493881";
        return toReturn;
    }
}