import { APIError } from "../api-error";

/** HTTP 403 — base for permission/access denied errors */
export class Forbidden extends APIError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}
