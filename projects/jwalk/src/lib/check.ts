import type { GroupType } from "./types/utils";

const grouptype = ["tuple", "object", "map", "list"] as readonly string[];

export type TypeDetailNode<Context, Type> = Type extends GroupType
    ? {
          type: Type;
          content: Type extends "tuple" | "object" ? readonly string[] : string;
          action?: (args: {
              readonly context: Context;
              readonly value: unknown;
              readonly refs: unknown;
              readonly auto: unknown;
              readonly meta: unknown;
          }) => { update: (vv: unknown) => void; destroy: () => void };
      }
    : {
          type: Type;
          refs?: readonly string[];
          action: (args: {
              readonly context: Context;
              readonly value: unknown;
              readonly refs: unknown;
          }) => { update: (vv: unknown) => void; destroy: () => void };
      };

export type TypeDetail<Context> =
    | TypeDetailNode<Context, "map">
    | TypeDetailNode<Context, "list">
    | TypeDetailNode<Context, "object">
    | TypeDetailNode<Context, "tuple">
    | TypeDetailNode<Context, string>; // for non-group type

const validateTypeContent = (
    query: (query: string) => boolean,
    tag: string,
    type: string,
    content?: readonly string[] | string
) => {
    if ("object" === type) {
        if (!Array.isArray(content)) {
            throw new Error(`[${tag}] missing/invalid content`);
        }
        for (const v of content as string[]) {
            const content = v.split(":");
            if (content.length !== 2) {
                throw new Error(`[${tag}] expecting "key:type" format. trying to use [${v}]`);
            }
            if (grouptype.includes(content[1])) {
                throw new Error(
                    `[${tag}] nested group type is not supported. trying to use [${v}]`
                );
            }
            if (!query(content[1])) {
                throw new Error(`[${tag}] invalid alias type [${content[1]}]`);
            }
        }
    } else if ("tuple" === type) {
        if (!Array.isArray(content)) {
            throw new Error(`[${tag}] missing/invalid content`);
        }
        for (const v of content as string[]) {
            if (grouptype.includes(v)) {
                throw new Error(
                    `[${tag}] nested group type is not supported. trying to use [${v}]`
                );
            }
            if (!query(v)) {
                throw new Error(`[${tag}] invalid alias type [${v}]`);
            }
        }
    } else if ("map" === type || "list" === type) {
        if ("string" !== typeof content) {
            throw new Error(`[${tag}] missing/invalid content`);
        }
        if (!query(content)) {
            throw new Error(`[${tag}] invalid alias type [${content}]`);
        }
    } else {
        if (null != content) {
            throw new Error(`[${tag}] unexpected content provided`);
        }
        if (!query(type)) {
            throw new Error(`[${tag}] invalid alias type [${type}]`);
        }
    }
};

export const check = {
    type: (
        type: string,
        detail: readonly { type: string; content?: readonly string[] | string }[],
        primes: Record<string, unknown>,
        nodes: Record<string, unknown>
    ) => {
        if (type in primes || type in nodes || grouptype.includes(type)) {
            throw new Error(`[${type}] already registered`);
        }
        if ("ROOT" === type) {
            throw new Error(`[${type}] is reserved`);
        }
        if (0 === detail.length) {
            throw new Error(`[${type}] requires at least one alias type`);
        }
        for (const item of detail) {
            if (!("type" in item)) {
                throw new Error(`[${type}] "type" is required.`);
            }
            validateTypeContent((t) => t in primes, type, item.type, item.content);
        }
    },
    node: <Context>(
        type: string,
        t: TypeDetail<Context>,
        primes: Record<string, unknown>,
        nodes: Record<string, TypeDetail<Context>>
    ) => {
        if (type in primes || grouptype.includes(type)) {
            throw new Error(`[${type}] is reserved`);
        }

        if (type in nodes) {
            throw new Error(`[${type}] already registered`);
        }

        if (!(t.type in primes) && !grouptype.includes(t.type)) {
            if (t.type in nodes) {
                throw new Error(`[${type}] can't use node type [${t.type}]`);
            } else {
                throw new Error(`[${type}] unknown alias type [${t.type}]`);
            }
        }

        if (t.type in primes && null == t.action) {
            throw new Error(`[${type}] requires an action [${t.type}]`);
        }

        if (grouptype.includes(t.type)) {
            if ("refs" in t) {
                throw new Error(`[${type}] "${t.type}" can't have "refs"`);
            }
            validateTypeContent(
                (t) => t in primes || t in nodes,
                type,
                t.type,
                (t as TypeDetailNode<Context, GroupType>).content
            );
        } else {
            if ("content" in t) {
                throw new Error(`[${type}] "${t.type}" can't have "content"`);
            }
            if ("refs" in t) {
                // same rules as tuple
                validateTypeContent((t) => t in nodes, type, "tuple", t.refs);
            }
        }
    }
};
