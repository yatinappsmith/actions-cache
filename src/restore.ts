import * as core from "@actions/core";

import restore from "./utils/restore";
import validate from "./utils/validate";

async function run(): Promise<void> {
    try {
        validate();

        await restore();
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

export default run;
