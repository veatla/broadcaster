import { APIError } from "../api-error";

/** HTTP 409 — base for uniqueness / state-conflict errors */
export class Conflict extends APIError {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}
