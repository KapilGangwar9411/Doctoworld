import { Category } from './category.models';
import { ProductVendor } from './vendor-product.models';

export class Product {
    id!: number;
    title!: string;
    detail!: string;
    meta: any;
    price!: number;
    sale_price!: number;
    ratings!: number;
    ratings_count!: number;
    owner!: string; //admin,vendor
    parent_id!: number;
    attribute_term_id!: number;
    mediaurls!: { images: Array<any>; };
    created_at!: string;
    updated_at!: string;
    categories!: Array<Category>;
    vendor_products!: Array<ProductVendor>;
    addon_groups!: Array<ProductAddon>;
    is_favourite!: boolean;

    priceToShow!: string;
    images!: Array<string>;
    prescription_required!: boolean;
    reviewed!: boolean;
    vendorText!: string;
    in_stock!: boolean;
}

export class ProductAddon {
    id!: number;
    title!: string;
    product_id!: number;
    min_choices!: number;
    max_choices!: number;
    addon_choices!: Array<AddonChoice>;
}

export class AddonChoice {
    id!: number;
    title!: string;
    price!: number;
    product_addon_group_id!: number;
    created_at!: string;
    updated_at!: string;

    priceToShow!: string;
    isChecked!: boolean;
}