import * as core from "@actions/core";
import * as cache from "@martijnhols/actions-cache";

import * as utils from "./actionUtils";
import { State } from "./constants";
import getCacheKey from "./getCacheKey";
import getCachePaths from "./getCachePaths";
import getRestoreKeys from "./getRestoreKeys";

export default async function read(): Promise<void> {
    const primaryKey = getCacheKey();
    core.saveState(State.CachePrimaryKey, primaryKey);
    utils.setPrimaryKeyOutput(primaryKey);

    const restoreKeys = getRestoreKeys();
    const cachePaths = getCachePaths();

    try {
        const cacheKey = await cache.restoreCache(
            cachePaths,
            primaryKey,
            restoreKeys
        );
        if (!cacheKey) {
            core.info(
                `Cache not found for input keys: ${[
                    primaryKey,
                    ...restoreKeys
                ].join(", ")}`
            );
            return;
        }

        // Store the matched cache key
        utils.setCacheState(cacheKey);

        const isExactKeyMatch = utils.isExactKeyMatch(primaryKey, cacheKey);
        utils.setCacheHitOutput(isExactKeyMatch);

        core.info(`Cache restored from key: ${cacheKey}`);
    } catch (error) {
        if (error.name === cache.ValidationError.name) {
            throw error;
        } else {
            utils.logWarning(error.message);
            utils.setCacheHitOutput(false);
        }
    }
}
