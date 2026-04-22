import { BadRequest } from "$app/core/errors/http";

export class IncorrectLoginDataError extends BadRequest {
    constructor() {
        super("Incorrect login data provided");
        this.name = "IncorrectLoginDataError";
    }
}
