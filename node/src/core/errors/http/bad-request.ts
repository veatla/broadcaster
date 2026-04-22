import { APIError } from "../api-error";

/** HTTP 400 — base for invalid input / failed validation errors */
export class BadRequest extends APIError {
    constructor(message = "Bad Request") {
        super(message, 400);
    }
}
