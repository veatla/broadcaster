import { v5 as uuidv5 } from "uuid";

// Fixed namespace for private chat IDs — must never change once in production.
const PRIVATE_CHAT_NS = "1b671a64-40d5-491e-99b0-da01ff1f3341";

/**
 * Deterministic UUID v5 for a private chat between two users.
 * Sorting ensures privateChatId(A, B) === privateChatId(B, A).
 */
export function privateChatId(userA: string, userB: string): string {
    const [u1, u2] = [userA, userB].sort();
    return uuidv5(`${u1}:${u2}`, PRIVATE_CHAT_NS);
}
