/**
 * # Error architecture
 *
 * APIError (base)
 * └── HTTP errors — `core/errors/http/*`
 *     BadRequest | Unauthorized | Forbidden | NotFound |
 *     Conflict | UnprocessableEntity | InternalServerError
 *     └── Module-specific errors — `modules/<name>/errors/*`
 *         e.g. IncorrectLoginData, UsernameTaken, UserNotFound
 *
 * ## Rules
 * - **Handlers** only throw module-specific errors (leaf classes).
 * - **HTTP error classes** are only used as base classes or in catch blocks
 *   to read the status code — never instantiated directly in handlers.
 * - **Module errors** stay inside their module — other modules must not
 *   import them.
 * - The `$` request wrapper catches `APIError` and maps it to an HTTP
 *   response automatically via `error.status`.
 */
export class APIError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
    }
}
