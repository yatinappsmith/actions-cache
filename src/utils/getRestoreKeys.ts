import * as utils from "./actionUtils";
import { Inputs } from "./constants";

export default function getRestoreKeys(): string[] {
    return utils.getInputAsArray(Inputs.RestoreKeys);
}
