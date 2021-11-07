import { getInputAsArray } from "./actionUtils";
import { Inputs } from "./constants";

export default function getCachePaths(): string[] {
    return getInputAsArray(Inputs.Path, {
        required: true
    });
}
