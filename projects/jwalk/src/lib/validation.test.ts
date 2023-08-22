/* eslint-disable camelcase */

import { validate, builtin } from "./validation";
import { describe, expect, it } from "vitest";

// prettier-ignore
describe("jwalk - validate.type", () => {
    it("builtin", () => {
        expect(validate.type([], builtin)(null)).eq(false);
        expect(validate.type([{ type: "number" }], builtin)(1)).eq(true);
        expect(validate.type([{ type: "string" }], builtin)("text")).eq(true);
        expect(validate.type([{ type: "boolean" }], builtin)(false)).eq(true);
        expect(validate.type([{ type: "number" }], builtin)(null)).eq(false);
        expect(validate.type([{ type: "string" }], builtin)(null)).eq(false);
        expect(validate.type([{ type: "boolean" }], builtin)(null)).eq(false);
        expect(validate.type([{ type: "list", content: "number" }], builtin)(null)).eq(false);
        expect(validate.type([{ type: "list", content: "number" }], builtin)([1, null])).eq(false);
        expect(validate.type([{ type: "list", content: "number" }], builtin)([1, 2])).eq(true);
        expect(validate.type([{ type: "map", content: "number" }], builtin)(null)).eq(false);
        expect(validate.type([{ type: "map", content: "number" }], builtin)({a: 1, b: null})).eq(false);
        expect(validate.type([{ type: "map", content: "number" }], builtin)({a: 1, b: 2})).eq(true);
        expect(validate.type([{ type: "tuple", content: ["number", "boolean"] }], builtin)(null)).eq(false);
        expect(validate.type([{ type: "tuple", content: ["number", "boolean"] }], builtin)([1, null])).eq(false);
        expect(validate.type([{ type: "tuple", content: ["number", "boolean"] }], builtin)([1, false])).eq(true);
        expect(validate.type([{ type: "object", content: ["a:number"] }], builtin)(null)).eq(false);
        expect(validate.type([{ type: "object", content: ["a:number"] }], builtin)({a: null})).eq(false);
        expect(validate.type([{ type: "object", content: ["a:number"] }], builtin)({a: 1})).eq(true);
    });
});
