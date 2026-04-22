import { APIError } from "../api-error";

/** HTTP 500 — base for unexpected / infra-level failures */
export class InternalServerError extends APIError {
    constructor(message = "Internal Server Error") {
        super(message, 500);
    }
}
