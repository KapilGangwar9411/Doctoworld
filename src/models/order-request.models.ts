export class OrderRequest {
    address_id!: number;
    payment_method_id!: number;
    payment_method_slug!: string;
    coupon_code!: string;
    products: Array<{ id: number; quantity: number; addons: Array<{ choice_id: number }> }>;
    meta!: string;
    notes!: string;
    order_type!: string;
  customer_mobile!: string;
  customer_name!: string;
  is_guest!: boolean;

    constructor() {
        this.products = new Array<{ id: number; quantity: number; addons: Array<{ choice_id: number }> }>();
    }
}