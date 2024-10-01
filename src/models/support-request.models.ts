export class SupportRequest {
    name: string;
    email: string;
    message: string;

    constructor(name: string, email: string) {
        this.name = name;
        this.email = email;
        this.message = "";
    }
}