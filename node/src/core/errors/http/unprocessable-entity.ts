import { APIError } from "../api-error";

/** HTTP 422 — base for semantically invalid data errors */
export class UnprocessableEntity extends APIError {
    constructor(message = "Unprocessable Entity") {
        super(message, 422);
    }
}
