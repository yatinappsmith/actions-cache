import * as core from "@actions/core";

import { Inputs } from "./constants";

export default function getCacheKey(): string {
    return core.getInput(Inputs.Key, { required: true });
}
