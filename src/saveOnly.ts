import * as core from "@actions/core";

import * as utils from "./utils/actionUtils";
import getCacheKey from "./utils/getCacheKey";
import save from "./utils/save";
import validate from "./utils/validate";

// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on("uncaughtException", e => utils.logWarning(e.message));

async function run(): Promise<void> {
    try {
        validate();

        // Get the primary key from inputs. On correct usage, this will be the
        // output from either the getCacheKey, check or read actions.
        const primaryKey = getCacheKey();

        await save(primaryKey);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

export default run;
