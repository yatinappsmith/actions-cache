import * as core from "@actions/core";
import * as cache from "@martijnhols/actions-cache";

import * as utils from "./actionUtils";
import { Inputs } from "./constants";

export default async function save(primaryKey: string): Promise<void> {
    const cachePaths = utils.getInputAsArray(Inputs.Path, {
        required: true
    });

    try {
        await cache.saveCache(cachePaths, primaryKey, {
            uploadChunkSize: utils.getInputAsInt(Inputs.UploadChunkSize)
        });
        core.info(`Cache saved with key: ${primaryKey}`);
    } catch (error) {
        if (error.name === cache.ValidationError.name) {
            throw error;
        } else if (error.name === cache.ReserveCacheError.name) {
            core.info(error.message);
        } else {
            utils.logWarning(error.message);
        }
    }
}
