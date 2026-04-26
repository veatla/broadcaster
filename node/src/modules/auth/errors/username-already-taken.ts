import { Conflict } from "$app/core/errors/http";

export class UsernameAlreadyTaken extends Conflict {
    constructor() {
        super("Username is already taken!");
        this.name = "UsernameAlreadyTaken";
    }
}
