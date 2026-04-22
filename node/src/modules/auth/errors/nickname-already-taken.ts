import { Conflict } from "$app/core/errors/http";

export class NicknameAlreadyTaken extends Conflict {
    constructor() {
        super("Nickname is already taken!");
        this.name = "NicknameAlreadyTaken";
    }
}
