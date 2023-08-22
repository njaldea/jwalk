import { jwalker } from "./index";
import { describe, it, expect, vi } from "vitest";

const reservedtype = ["number", "string", "boolean", "tuple", "object", "map", "list"];
const primetype = ["number", "string", "boolean"];

// prettier-ignore
describe("jwalk", () => {
    it("type - basic", () => {
        jwalker<string>()
            .type("t", [{ type: "number" }]);
    });

    it("invalid args", () => {
        expect(() => jwalker<string>().type()).toThrowError("Invalid arguments provided.");
        expect(() => jwalker<string>().node()).toThrowError("Invalid arguments provided.");
    });

    it("missing root", () => {
        expect(() => jwalker<string>().build("text", null)).toThrowError("ROOT is not registered");
    });

    it("type - reserved", () => {
        expect(() => jwalker<string>().type("ROOT", []))
            .toThrowError("[ROOT] is reserved");
    });

    it("type - already registered", () => {
        expect(() => jwalker<string>().type("list", [])).toThrowError("[list] already registered");
        expect(() => jwalker<string>().type("map", [])).toThrowError("[map] already registered");
        expect(() => jwalker<string>().type("tuple", [])).toThrowError("[tuple] already registered");
        expect(() => jwalker<string>().type("object", [])).toThrowError("[object] already registered");
        expect(() => jwalker<string>()
            .type("TYPE", [{ type: "boolean" }])
            .type("TYPE", [])).toThrowError("[TYPE] already registered");
        expect(() => jwalker<string>()
            .node("NODE", "map", { content: "boolean"})
            .type("NODE", [])).toThrowError("[NODE] already registered");
    });

    it("type - empty", () => {
        expect(() => jwalker<string>().type("TYPE", []))
            .toThrowError("[TYPE] requires at least one alias type");
    });

    it("type - sub-type is missing", () => {
        expect(() => jwalker<string>().type("TYPE", [{}]))
            .toThrowError("[TYPE] \"type\" is required.");
    });

    it("node - duplicate", () => {
        expect(() => {
            const update = vi.fn();
            const destroy = vi.fn();
            const action = vi.fn(() => ({ update, destroy }));
            jwalker<string>()
                .node("t", "number", { action })
                .node("t", "number", { action });
        })
            .toThrowError("[t] already registered");
    });

    it.each(reservedtype.map((v) => [v]))("node - reserved type $s", (type) => {
        expect(() => {
            const update = vi.fn();
            const destroy = vi.fn();
            const action = vi.fn(() => ({ update, destroy }));
            jwalker<string>()
                .node(type, type, { action });
        })
            .toThrowError(`[${type}] is reserved`);
    });

    it("node - unknown alias", () => {
        expect(() => {
            const update = vi.fn();
            const destroy = vi.fn();
            const action = vi.fn(() => ({ update, destroy }));
            jwalker<string>().node("UnknownT", "WhatIsThis", { action });
        })
            .toThrowError("[UnknownT] unknown alias type [WhatIsThis]");
    });

    it("node - can't use node type for children alias", () => {
        expect(() => {
            const update = vi.fn();
            const destroy = vi.fn();
            const action = vi.fn(() => ({ update, destroy }));
            jwalker<string>()
                .node("NODE", "boolean", { action })
                .node("ROOT", "NODE", { action });
        })
            .toThrowError("[ROOT] can't use node type [NODE]");
    });

    it.each(primetype.map((v) => [v]))("node - builtin no action", (type) => {
        expect(() => jwalker<string>().node("T", type, {}))
            .toThrowError(`[T] requires an action [${type}]`);
    });

    it.each([
        ["number", 1, 4] as const,
        ["string", "123", "321"] as const,
        ["boolean", true, false] as const,
    ])("node - prime %s", (type, cvalue, nvalue) => {
        const update = vi.fn();
        const destroy = vi.fn();
        const action = vi.fn(() => ({ update, destroy }));

        const jwalk = jwalker<string>()
            .node("ROOT", type, { action })
            .build("text", cvalue);

        expect(action.mock.calls.length).eq(1);
        expect(action.mock.calls[0].length).eq(1);
        expect(action.mock.calls[0][0].context).eq("text");
        expect(action.mock.calls[0][0].value).eq(cvalue);
        expect(action.mock.calls[0][0].refs).deep.eq({});

        jwalk.update(nvalue);

        expect(update.mock.calls.length).eq(1);
        expect(update.mock.calls[0]).deep.eq([nvalue]);

        jwalk.destroy();

        expect(destroy.mock.calls.length).eq(1);
        expect(destroy.mock.calls[0]).deep.eq([]);
    });

    it.each([
        ["tuple", ["number", "boolean", "string"], [1, true, "3"], [3, true, "1"]] as const,
        ["object", ["a:number", "b:boolean", "c:string"], { a: 1, b: true, c: "3"}, { a: 3, b: true, c: "1" }] as const,
        ["list", "number", [1, 2], [2, 3]] as const,
        ["map", "number", {a:1, b:2}, {b:3, c:4}] as const
    ])("node - group %s", (type, content, cvalue, nvalue) => {
        const update = vi.fn();
        const destroy = vi.fn();
        const action = vi.fn(() => ({ update, destroy }));

        const jwalk = jwalker<string>()
            .node("ROOT", type, { content, action })
            .build("text", cvalue);

        expect(action.mock.calls.length).eq(1);
        expect(action.mock.calls[0].length).eq(1);
        expect(action.mock.calls[0][0].context).eq("text");
        expect(action.mock.calls[0][0].value).eq(cvalue);
        expect(action.mock.calls[0][0].refs).deep.eq({});

        jwalk.update(nvalue);

        expect(update.mock.calls.length).eq(1);
        expect(update.mock.calls[0]).deep.eq([nvalue]);

        jwalk.destroy();

        expect(destroy.mock.calls.length).eq(1);
        expect(destroy.mock.calls[0]).deep.eq([]);
    });

    it.each(primetype.map(v => [v]))("node - %s can't have content", (type) => {
        const update = vi.fn();
        const destroy = vi.fn();
        const action = vi.fn(() => ({ update, destroy }));

        expect(() => jwalker<string>().node("ROOT", type, { content: [], action }))
            .toThrowError(`[ROOT] "${type}" can't have "content"`);
    });

    it("node - refs", () => {
        const update = vi.fn();
        const destroy = vi.fn();
        const action = vi.fn(() => ({ update, destroy }));

        jwalker<string>()
            .node("REF", "number", { action })
            .node("ROOT", "number", { refs: ["REF"], action });
    });

    it.each([["tuple"], ["object"], ["list"], ["map"]])("node - %s without content", (type) => {
        const update = vi.fn();
        const destroy = vi.fn();
        const action = vi.fn(() => ({ update, destroy }));

        expect(() => jwalker<string>().node("ROOT", type, { action }))
            .toThrowError("[ROOT] missing/invalid content");
    });

    it.each([["tuple"], ["object"], ["list"], ["map"]])("node - %s should not have refs", (type) => {
        const update = vi.fn();
        const destroy = vi.fn();
        const action = vi.fn(() => ({ update, destroy }));

        expect(() => jwalker<string>().node("ROOT", type, { refs: {}, action }))
            .toThrowError(`[ROOT] "${type}" can't have "refs"`);
    });

    it.each([
        ["tuple", ["tuple"], "tuple"] as const,
        ["object", ["a:object"], "a:object"] as const
    ])("node - nested $s - not supported", (type, content, match) => {
        const update = vi.fn();
        const destroy = vi.fn();
        const action = vi.fn(() => ({ update, destroy }));

        expect(() => jwalker<string>().node("ROOT", type, { content, action }))
            .toThrowError(`[ROOT] nested group type is not supported. trying to use [${match}]`);
    });

    /**
     * For Coverage
     */
    it.each([
        ["tuple", ["prime"], ["alias"], [[1]], [[2]]] as const,
        ["object", ["a:prime"], ["b:alias"], {b: {a: 1}}, {b: {a: 2}}] as const,
        ["map", "prime", "alias", {b: {a: 1}}, {c: {d: 1}}] as const,
        ["list", "prime", "alias", [[1]], [[2], [3]]] as const
    ])("node - no action", (type, content, rootcontent, value, nvalue) => {
        const jwalk = jwalker<string>()
            .type("prime", [{ type: "number" }])
            .node("alias", type, { content })
            .node("ROOT", type, { content: rootcontent })
            .build("context", value);

        jwalk.update(nvalue);
        jwalk.destroy();
    });
});
