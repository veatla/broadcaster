import { APIError } from "./api-error";

export class UnauthorizedError extends APIError {
    constructor(message = "Unauthorized!", status: number = 401) {
        super(message, status);
    }
}
