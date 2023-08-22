import type { Memoizer } from "./builder";

export const memoizer: Memoizer = <Value>(value: Value) => {
    return (v: Value) => {
        if (v instanceof Object) {
            return true;
        } else if (v !== value) {
            value = v;
            return true;
        }
        return false;
    };
};
