import * as core from "@actions/core";

import { Inputs } from "./constants";

export default function isCacheRequired(): string {
    return core.getInput(Inputs.Required, { required: false });
}
