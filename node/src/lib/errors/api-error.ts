export class APIError {
    message!: string | unknown;
    status!: number;

    constructor(message: string | unknown, status: number = 500) {
        this.message = message;
        this.status = status;
    }
}
