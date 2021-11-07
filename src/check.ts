import * as core from "@actions/core";
import * as cache from "@martijnhols/actions-cache";

import { setCacheHitOutput, setPrimaryKeyOutput } from "./utils/actionUtils";
import getCacheKey from "./utils/getCacheKey";
import getCachePaths from "./utils/getCachePaths";
import validate from "./utils/validate";

async function run(): Promise<void> {
    try {
        validate();

        const primaryKey = getCacheKey();
        setPrimaryKeyOutput(primaryKey);
        const cachePaths = getCachePaths();
        const cacheEntry = await cache.getCacheEntry(cachePaths, primaryKey);
        if (cacheEntry !== null) {
            core.info(`✅ Cache AVAILABLE for input key: ${primaryKey}`);
            setCacheHitOutput(true);
        } else {
            core.info(`❌ Cache MISSING for input key: ${primaryKey}`);
            setCacheHitOutput(false);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

export default run;
