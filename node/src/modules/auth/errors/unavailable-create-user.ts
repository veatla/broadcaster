import { InternalServerError } from "$app/core/errors/http";

export class UnavailableCreateUserError extends InternalServerError {
    constructor() {
        super("Unavailable to create user!");
        this.name = "UnavailableCreateUserError";
    }
}
