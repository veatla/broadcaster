import { APIError } from "../api-error";

/** HTTP 401 — base for missing or invalid authentication errors */
export class Unauthorized extends APIError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}
