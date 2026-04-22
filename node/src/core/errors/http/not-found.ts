import { APIError } from "../api-error";

/** HTTP 404 — base for resource-not-found errors */
export class NotFound extends APIError {
    constructor(message = "Not Found") {
        super(message, 404);
    }
}
