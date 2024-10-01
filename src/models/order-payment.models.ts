import { PaymentMethod } from './payment-method.models';

export class OrderPayment {
    id!: number;
    payable_id!: number;
    payer_id!: number;
    amount!: number;
    status!: string;
    payment_method!: PaymentMethod;
}