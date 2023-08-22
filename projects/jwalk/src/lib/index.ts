import { Builder, type Memoizer, type Validation } from "./builder";
import { builtin } from "./validation";
export { memoizer } from "./memoizer";

const noop: Memoizer = () => () => true;

export type Options = {
    memoizer: Memoizer;
    /**
     * Not used yet.
     */
    validation: Validation;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jwalker = <Context = any>(options?: Partial<Options>) => {
    return new Builder<Context, "number" | "boolean" | "string", typeof builtin>(
        options?.memoizer ?? noop,
        options?.validation ?? "none",
        builtin,
        {}
    );
};
