export class Category {
    id!: number;
    parent_id!: number;
    title!: string;
    slug!: string;
    meta: any;
    mediaurls!: { images: Array<any>; };

    image!: string;
}