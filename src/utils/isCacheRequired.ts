import * as core from "@actions/core";

import { Inputs } from "./constants";

export default function isCacheRequired(): boolean {
    return (
        core.getInput(Inputs.Required, {
            required: false
        }) !== "false"
    );
}
