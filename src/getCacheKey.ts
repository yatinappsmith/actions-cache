import * as core from "@actions/core";

import { setPrimaryKeyOutput } from "./utils/actionUtils";
import getCacheKey from "./utils/getCacheKey";
import validate from "./utils/validate";

async function run(): Promise<void> {
    try {
        validate();

        const primaryKey = getCacheKey();
        setPrimaryKeyOutput(primaryKey);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

export default run;
