export const builtin = {
    number: (v: unknown) => "number" === typeof v,
    boolean: (v: unknown) => "boolean" === typeof v,
    string: (v: unknown) => "string" === typeof v
} as const;

export const validate = {
    type: (
        detail: readonly { type: string; content?: readonly string[] | string }[],
        primes: Record<string, (v: unknown) => boolean>
    ): ((v: unknown) => boolean) => {
        const validators: ((v: unknown) => boolean)[] = [];
        for (const unit of detail) {
            if ("list" === unit.type) {
                validators.push((v) => {
                    if (Array.isArray(v)) {
                        return !v.some((i) => primes[unit.content as string](i));
                    }
                    return false;
                });
            } else if ("map" === unit.type) {
                validators.push((v) => {
                    if ("object" === typeof v && !Array.isArray(v) && null != v) {
                        return !Object.values(v).some((i) => primes[unit.content as string](i));
                    }
                    return false;
                });
            } else if ("tuple" === unit.type) {
                validators.push((v) => {
                    const content = unit.content as readonly string[];
                    if (Array.isArray(v) && v.length === content.length) {
                        for (let i = 0; i < content.length; ++i) {
                            if (!primes[content[i]](v[i])) {
                                return false;
                            }
                        }
                        return true;
                    }
                    return false;
                });
            } else if ("object" === unit.type) {
                validators.push((v) => {
                    const content = unit.content as readonly string[];
                    if (
                        "object" === typeof v &&
                        !Array.isArray(v) &&
                        null != v &&
                        Object.keys(v).length === content.length
                    ) {
                        const alias = v as Record<string, unknown>;
                        for (const cc of content) {
                            const [key, value] = cc.split(":");
                            if (!primes[value](alias[key])) {
                                return false;
                            }
                        }
                        return true;
                    }
                    return false;
                });
            } else {
                validators.push((v) => primes[unit.content as string](v));
            }
        }

        return (v) => validators.some((val) => val(v));
    }
};
