import { OrderPayment } from "./order-payment.models";
import { Order } from "./order.models";

export class OrderMultiVendor {
    payment: OrderPayment = new OrderPayment();
    order: Order = new Order();
}