import { Injectable } from '@angular/core';
import { MyAddress } from 'src/models/address.models';
import { Coupon } from 'src/models/coupon.models';
import { Helper } from 'src/models/helper.models';
import { OrderRequest } from 'src/models/order-request.models';
import { PaymentMethod } from 'src/models/payment-method.models';
import { Product } from 'src/models/product.models';

export class CartItemAddOn {
  id: number;
  title: string;
  price: number;
  priceToShow: string;

  constructor(id: number, title: string, price: number, priceToShow: string) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.priceToShow = priceToShow;
  }
}

export class CartItem {
  id: string | undefined | null;
  title: string | undefined | null;
  subtitle: string | undefined | null;
  image: string | undefined | null;
  price: number | undefined | null;
  priceToShow: string | undefined | null;
  quantity: number | undefined | null;
  total: number | undefined | null;
  product: any;

  priceAddOn: number | undefined | null;
  addOns: Array<CartItemAddOn> | undefined | null;
  meta: any; // add new customization "meta"

  setQuantity(newQuantity: number) {
    this.quantity = newQuantity;
    this.total = ((this.price ?? 0) + (this.priceAddOn ?? 0)) * this.quantity;
  }

  getTotal(fixFloatingPoint: boolean): number {
    return fixFloatingPoint ? Number((this.total ?? 0).toFixed(2)) : (this.total ?? 0);
  }

  getTotalBase(fixFloatingPoint: boolean): number {
    let totalBase = (this.price ?? 0) * (this.quantity ?? 0);
    return fixFloatingPoint ? Number(totalBase.toFixed(2)) : totalBase;
  }

  static fromSaved(savedCartItem: CartItem): CartItem {
    let toReturn = new CartItem();
    toReturn.id = savedCartItem.id;
    toReturn.title = savedCartItem.title;
    toReturn.subtitle = savedCartItem.subtitle;
    toReturn.image = savedCartItem.image;
    toReturn.price = savedCartItem.price;
    toReturn.priceAddOn = savedCartItem.priceAddOn;
    toReturn.priceToShow = savedCartItem.priceToShow;
    toReturn.quantity = savedCartItem.quantity;
    toReturn.total = savedCartItem.total;
    toReturn.product = savedCartItem.product;
    toReturn.addOns = savedCartItem.addOns; // add new customization "verdor"
    toReturn.meta = savedCartItem.meta;
    return toReturn;
  }
}

export class ExtraCharge {
  id: string | undefined | null;
  title: string | undefined | null;
  price: number | undefined | null;
  isPercent: boolean | undefined | null;
  priceToShow: string | undefined | null;
  extraChargeObject: any;
}

export class Cart {
  static KEY_CART: string = 'gsw_cart';

  cartItems: Array<CartItem> | undefined | null;
  extraCharges: Array<ExtraCharge> | undefined | null;

  static restore(): Cart {
    let toReturn = new Cart();
    toReturn.cartItems = new Array<CartItem>();
    toReturn.extraCharges = new Array<ExtraCharge>();

    let savedCart = Cart.getSavedCart();
    if (savedCart) {
      if (savedCart.extraCharges && savedCart.extraCharges.length) toReturn.extraCharges = savedCart.extraCharges;
      if (savedCart.cartItems && savedCart.cartItems.length) for (let sCi of savedCart.cartItems) toReturn.cartItems.unshift(CartItem.fromSaved(sCi));
    }

    return toReturn;
  }

  removeExtraCharge(extraChargeId: string) {
    if (this.extraCharges) {
      let currIndex = -1;
      for (let i = 0; i < this.extraCharges.length; i++) {
        if (this.extraCharges[i].id == extraChargeId) {
          currIndex = i;
          break;
        }
      }
      if (currIndex != -1) this.extraCharges.splice(currIndex, 1);
    }
  }

  addExtraCharge(extraCharge: ExtraCharge) {
    if (this.extraCharges) {
      this.extraCharges.unshift(extraCharge);
    }
  }

  getTotalCartItems(fixFloatingPoint: boolean) {
    let toReturn = 0;
    if (this.cartItems) { for (let ci of this.cartItems) toReturn += (ci.total ?? 0); }
    return fixFloatingPoint ? Helper.toFixedNumber(Number(toReturn)) : toReturn;
  }

  getTotalCart(fixFloatingPoint: boolean) {
    let subTotal = Number(this.getTotalCartItems(false));

    let tax_in_percent = 0;
    if (this.extraCharges) {
      for (let ec of this.extraCharges) {
        if (ec.id == "tax_in_percent") {
          tax_in_percent = ec.isPercent ? ((subTotal * (ec.price ?? 0)) / 100) : (ec.price ?? 0);
          break;
        }
      }
    }

    let delivery_fee = 0;
    if (this.extraCharges) {
      for (let ec of this.extraCharges) {
        if (ec.id == "delivery_fee") {
          delivery_fee = ec.price ?? 0;
          break;
        }
      }
    }

    let coupon = 0;
    if (this.extraCharges) {
      for (let ec of this.extraCharges) {
        if (ec.id == "coupon") {
          coupon = ec.isPercent ? ((subTotal * (ec.price ?? 0)) / 100) : (ec.price ?? 0);
          break;
        }
      }
    }

    let toReturn = subTotal + tax_in_percent + delivery_fee - coupon;
    return fixFloatingPoint ? Helper.toFixedNumber(Number(toReturn)) : toReturn;
  }

  static getSavedCart(): Cart | undefined {
    let val = window.localStorage.getItem(Cart.KEY_CART);
    return val ? JSON.parse(val) : null;
  }

  static setSavedCart(cartToSave: Cart | null | undefined) {
    if (cartToSave) {
      window.localStorage.setItem(Cart.KEY_CART, JSON.stringify(cartToSave));
    } else {
      window.localStorage.removeItem(Cart.KEY_CART);
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class ECommerceService {
  private myCart: Cart | undefined | null;
  private orderRequest: OrderRequest | undefined | null;
  private orderMeta: any;

  constructor() {
    this.initialize();
  }

  initialize() {
    this.myCart = Cart.restore();

    let tax_in_percent = Helper.getSetting("tax_in_percent");
    let delivery_fee = Helper.getSetting("delivery_fee");
    let currency_icon = Helper.getSetting("currency_icon") ?? "";

    this.myCart.removeExtraCharge("delivery_fee");
    this.myCart.removeExtraCharge("tax_in_percent");
    if (tax_in_percent != null && Number(tax_in_percent) > 0) {
      let ec = new ExtraCharge();
      ec.extraChargeObject = tax_in_percent;
      ec.id = "tax_in_percent";
      ec.title = "Service Fee";
      ec.isPercent = true;
      ec.price = Number(tax_in_percent);
      ec.priceToShow = ec.price + "%";
      this.myCart.addExtraCharge(ec);
    }
    if (delivery_fee != null && Number(delivery_fee) > 0) {
      let ec = new ExtraCharge();
      ec.extraChargeObject = delivery_fee;
      ec.id = "delivery_fee";
      ec.title = "Delivery Fee";
      ec.isPercent = false;
      ec.price = Number(delivery_fee);
      ec.priceToShow = currency_icon + ec.price;
      this.myCart.addExtraCharge(ec);
    }
  }

  clearCart() {
    Cart.setSavedCart(null);
    this.initialize();
    this.orderMeta = null;
    this.orderRequest = null;
  }

  getCartItemsWithProductId(proId: number): Array<CartItem> {
    let toReturn: Array<CartItem> = [];
    for (let ci of this.getCartItems()) if (this.getProductIdFromCartItemId(ci.id!) == proId) toReturn.push(ci);
    return toReturn;
  }

  removeCartItemWithProductId(proId: number): boolean {
    let index = -1;
    for (let i = 0; i < this.getCartItems().length; i++) {
      if (this.getProductIdFromCartItemId(this.getCartItems()[i].id!) == proId) {
        index = i;
        break;
      }
    }
    if (index != -1) {
      this.getCartItems().splice(index, 1);
      Cart.setSavedCart(this.myCart);
    }
    return index != -1;
  }

  getCartItems(): Array<CartItem> {
    return this.myCart?.cartItems ?? [];
  }

  getExtraCharges(): Array<ExtraCharge> {
    return this.myCart?.extraCharges ?? [];
  }

  getCartItemsCount(): number {
    return this.getCartItems().length ?? 0;
  }

  getCartItemsTotal(fixFloatingPoint: boolean) {
    return this.myCart?.getTotalCartItems(fixFloatingPoint);
  }

  getCartTotal(fixFloatingPoint: boolean) {
    return this.myCart?.getTotalCart(fixFloatingPoint);
  }

  calculateExtraChargePiceToShow(ec: ExtraCharge, fixFloatingPoint: boolean) {
    let ecCharge = ec.isPercent ? ((Number(this.myCart?.getTotalCartItems(false)) * (ec.price ?? 0)) / 100) : (ec.price ?? 0);
    return fixFloatingPoint ? Helper.toFixedNumber(Number(ecCharge)) : ecCharge;
  }

  isExistsCartItem(ci: CartItem): boolean {
    let index = -1;
    if (this.myCart && this.myCart.cartItems) {
      for (let i = 0; i < this.myCart.cartItems.length; i++) {
        if (this.myCart.cartItems[i].id == ci.id) {
          index = i;
          break;
        }
      }
    }
    return index != -1;
  }

  getCartProductQuantity(proId: number): number {
    let quantity = 0;
    for (let ci of this.getCartItemsWithProductId(proId)) quantity += (ci.quantity ?? 0);
    return quantity;
  }

  addOrIncrementCartItem(ci: CartItem): boolean {
    let index = -1;
    if (this.myCart && this.myCart.cartItems) {
      for (let i = 0; i < this.myCart.cartItems.length; i++) {
        if (this.myCart.cartItems[i].id == ci.id) {
          index = i;
          break;
        }
      }
      if (index == -1) {
        this.myCart.cartItems.push(ci);
      } else {
        ci.setQuantity((this.myCart.cartItems[index].quantity ?? 0) + 1);
        this.myCart.cartItems[index] = ci;
      }
    }
    Cart.setSavedCart(this.myCart);
    return index == -1;
  }

  removeOrDecrementCartItem(ci: CartItem): boolean {
    let index = -1;
    if (this.myCart && this.myCart.cartItems) {
      for (let i = 0; i < this.myCart.cartItems.length; i++) {
        if (this.myCart.cartItems[i].id == ci.id) {
          index = i;
          break;
        }
      }
    }
    let removed = false;
    if (index != -1) {
      if (this.myCart && this.myCart.cartItems) {
        if ((this.myCart.cartItems[index].quantity ?? 0) > 1) {
          ci.setQuantity((this.myCart.cartItems[index].quantity ?? 0) - 1);
          this.myCart.cartItems[index] = ci;
        } else {
          removed = true;
          this.myCart.cartItems.splice(index, 1);
        }
      }
      Cart.setSavedCart(this.myCart);
    }
    return removed;
  }

  //custom IMPLEMENTATION below.

  removeCoupon() {
    this.myCart?.removeExtraCharge("coupon");
  }

  //custom COUPON implementation below

  applyCoupon(coupon: Coupon | undefined | null) {
    this.myCart?.removeExtraCharge("coupon");

    if (coupon != null) {
      let ec = new ExtraCharge();
      ec.extraChargeObject = coupon;
      ec.id = "coupon";
      ec.title = coupon.title;
      ec.isPercent = coupon.type == "percent";
      ec.price = Number(coupon.reward);
      ec.priceToShow = ec.price + "%";

      this.myCart?.addExtraCharge(ec);

      this.setupOrderRequestBase();
      this.orderRequest!.coupon_code = coupon.code;
    } else {
      this.setupOrderRequestBase();
      this.orderRequest!.coupon_code = "";
    }
  }

  //custom PRODUCT implementation below

  genCartItemFromProduct(product: Product, addOns?: Array<CartItemAddOn>): CartItem {
    let ci = new CartItem();
    ci.addOns = addOns && addOns.length ? addOns : [];
    // if (product.addon_groups) {
    //   for (let group of product.addon_groups) {
    //     if (group.addon_choices) {
    //       for (let choice of group.addon_choices) {
    //         if (choice.selected) ci.addOns.push({ id: choice.id, title: choice.title, price: choice.price, priceToShow: choice.priceToShow });
    //         choice.selected = false;
    //       }
    //     }
    //   }
    // }
    ci.id = String((product.vendor_products && product.vendor_products[0]) ? product.vendor_products[0].id : product.id);
    if (ci.addOns.length) {
      ci.id += "+";
      for (let ao of ci.addOns) ci.id += (ao.id + "_");
      ci.id.substring(0, ci.id.lastIndexOf("_"));
    }
    let addOnPrice = 0;
    for (let ao of ci.addOns) addOnPrice += ao.price;
    ci.price = product.price;
    //sale_price adjustment
    if (product.sale_price) {
      ci.price! -= product.price!;
      ci.price! += product.sale_price;
    }
    ci.priceAddOn = addOnPrice;
    ci.title = product.title;
    ci.subtitle = (product.categories && product.categories[0]) ? product.categories[0].title : product.detail;
    ci.image = product.images![0];
    ci.product = product;
    ci.meta = product.meta; // add new customization "meta"
    let vendor = (product.vendor_products && product.vendor_products[0] && product.vendor_products[0].vendor) ? product.vendor_products[0].vendor : null;
    if (vendor) {
      ci.meta["vendor_id"] = vendor.id;
      ci.meta["vendor_name"] = vendor.name;
    }
    ci.setQuantity(1);
    return ci;
  }

  //custom ORDERREQUEST implementation below

  getOrderRequest(): OrderRequest {
    this.orderRequest!.products = [];
    for (let ci of this.getCartItems()) {
      let addonChoiceId = [];
      if (ci.addOns) for (let ciAddOn of ci.addOns) addonChoiceId.push({ choice_id: ciAddOn.id });
      // if (ci.product.addon_groups) {
      //   for (let addonGroup of ci.product.addon_groups) {
      //     if (addonGroup && addonGroup.addon_choices) {
      //       for (let addonChoice of addonGroup.addon_choices) {
      //         if (addonChoice.isChecked) addonChoiceId.push({ choice_id: addonChoice.id });
      //       }
      //     }
      //   }
      // }
      this.orderRequest!.products.push({ id: this.getProductIdFromCartItemId(ci.id!), quantity: ci.quantity!, addons: addonChoiceId });
    }
    //for (let ci of this.myCart!.cartItems!) this.orderRequest!.products.push({ id: ci.product.id, quantity: ci.quantity ?? 0 });
    if (this.orderMeta != null) this.orderRequest!.meta = JSON.stringify(this.orderMeta);
    return this.orderRequest!;
  }

  setupOrderRequestBase() {
    if (this.orderRequest == null) this.orderRequest = new OrderRequest();
    if (this.orderMeta == null) this.orderMeta = {};
  }

  setupOrderRequestAddress(address: MyAddress) {
    this.setupOrderRequestBase();
    this.orderRequest!.address_id = address.id;
  }

  setupOrderRequestPaymentMethod(paymentMethod: PaymentMethod) {
    this.setupOrderRequestBase();
    this.orderRequest!.payment_method_id = paymentMethod.id;
    this.orderRequest!.payment_method_slug = paymentMethod.slug;
  }

  setupOrderRequestMeta(key: string, value: string) {
    this.setupOrderRequestBase();
    this.orderMeta[key] = value;
  }

  hasOrderRequestMetaKey(key: string): boolean {
    this.setupOrderRequestBase();
    return this.orderMeta[key] != null;
  }

  removeOrderRequestMeta(key: string) {
    this.setupOrderRequestBase();
    this.orderMeta[key] = null;
  }
  // add new customization "notes"
  setupOrderRequestNotes(value: string) {
    this.setupOrderRequestBase();
    this.orderRequest!.notes = value;
  }

  // add new customization "order type"

  setupOrderRequestcCustomer_mobile(value: string) {
    this.setupOrderRequestBase();
    this.orderRequest!.customer_mobile = value;
  }

  setupOrderRequestCustomer_name(value: string) {
    this.setupOrderRequestBase();
    this.orderRequest!.customer_name = value;
  }

  setupOrderRequestIs_guest(value: boolean) {
    this.setupOrderRequestBase();
    this.orderRequest!.is_guest = value;
  }

  setupOrderRequestOrder_type(value: string) {
    this.setupOrderRequestBase();
    this.orderRequest!.order_type = value;
  }

  private getProductIdFromCartItemId(cartItemId: string): number {
    let ciId = String(cartItemId);
    return Number(ciId.includes("+") ? ciId.split("+")[0] : ciId);
  }

}
