export const builtin = {
    number: (v: unknown) => "number" === typeof v,
    boolean: (v: unknown) => "boolean" === typeof v,
    string: (v: unknown) => "string" === typeof v
} as const;

const isObject = (v: unknown): v is Record<string, unknown> => {
    return "object" === typeof v && !Array.isArray(v) && null != v;
};

const isArray = (v: unknown): v is unknown[] => {
    return Array.isArray(v);
};

// eslint-disable-next-line func-style
function* tie(first: readonly unknown[], second: readonly string[]) {
    for (let i = 0; i < first.length; ++i) {
        yield [first[i], second[i]] as const;
    }
}

export const validate = {
    type: (
        detail: readonly { type: string; content?: readonly string[] | string }[],
        primes: Record<string, (v: unknown) => boolean>
    ): ((v: unknown) => boolean) => {
        const validators: ((v: unknown) => boolean)[] = [];
        for (const unit of detail) {
            if ("list" === unit.type) {
                const content = unit.content as string;
                validators.push((v) => isArray(v) && v.every((i) => primes[content](i)));
            } else if ("map" === unit.type) {
                const content = unit.content as string;
                validators.push(
                    (v) => isObject(v) && Object.values(v).every((i) => primes[content](i))
                );
            } else if ("tuple" === unit.type) {
                const content = unit.content as readonly string[];
                validators.push(
                    (v) =>
                        isArray(v) &&
                        v.length === content.length &&
                        [...tie(v, content)].every(([a, b]) => primes[b](a))
                );
            } else if ("object" === unit.type) {
                const content = unit.content as readonly string[];
                validators.push(
                    (v) =>
                        isObject(v) &&
                        Object.keys(v).length === content.length &&
                        content.map((c) => c.split(":")).every(([key, t]) => primes[t](v[key]))
                );
            } else {
                validators.push((v) => primes[unit.type](v));
            }
        }

        return (v) => validators.some((val) => val(v));
    }
};
