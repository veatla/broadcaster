import { Forbidden } from "$app/core/errors/http";

export class DeviceLimitExceededError extends Forbidden {
    constructor() {
        super("Device limit exceeded");
        this.name = "DeviceLimitExceededError";
    }
}
