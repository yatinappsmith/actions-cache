import * as core from "@actions/core";

import read from "./utils/read";
import validate from "./utils/validate";

async function run(): Promise<void> {
    try {
        validate();

        await read();
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

export default run;
