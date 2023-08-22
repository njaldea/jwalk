/* eslint-disable camelcase */

import { memoizer } from "./memoizer";
import { describe, expect, it } from "vitest";

// prettier-ignore
describe("jwalk - memoizer", () => {
    it("primitive", () => {
        const memo = memoizer(1);
        expect(memo(1)).eq(false);
        expect(memo(2)).eq(true);
        expect(memo(2)).eq(false);
    });
    it("object", () => {
        const memo = memoizer({});
        const ref = {};
        expect(memo(ref)).eq(true);
        expect(memo(ref)).eq(true);
        expect(memo({})).eq(true);
    });
});
