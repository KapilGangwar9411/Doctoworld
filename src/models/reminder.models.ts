export class Reminder {
    notificationIds: Array<number>;
    title!: string;
    subTitle!: string;
    body!: string;
    time!: number;
    timeString!: string;
    
    constructor() {
        this.notificationIds = new Array<number>();
    }
}