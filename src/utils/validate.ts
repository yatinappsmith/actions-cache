import { isGhes, isValidEvent } from "./actionUtils";
import { Events } from "./constants";

export default function validate(): void {
    if (isGhes()) {
        throw new Error(
            "Cache action is not supported on GHES. See https://github.com/actions/cache/issues/505 for more details"
        );
    }

    // Validate inputs, this can cause task failure
    if (!isValidEvent()) {
        throw new Error(
            `Event Validation Error: The event type ${
                process.env[Events.Key]
            } is not supported because it's not tied to a branch or tag ref.`
        );
    }
}
