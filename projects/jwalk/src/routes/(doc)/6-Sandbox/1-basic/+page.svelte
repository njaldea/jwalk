<script lang="ts">
    import type { UpdateArg } from "../../tseditor";
    import Sandbox from "../../Sandbox.svelte";

    const update = (detail: UpdateArg) => {
        if (iframe) {
            iframe.contentWindow?.postMessage({
                type: "module",
                id: "content",
                code: detail.module,
                map: detail.importmap
            });
        }
    };

    let iframe: HTMLIFrameElement;
</script>

<h1>Sandbox</h1>

<iframe bind:this={iframe} title="preview" src="/preview/log"></iframe>
<div>
    <Sandbox
        {update}
        code={`import { jwalker, memoizer } from "@nil-/jwalk";

type ActionInstance<Value> = { update: (v: Value) => void; destroy: () => void; };

const actionize = <Value>(tag: string, value: Value, impl?: () => ActionInstance<Value>) => {
    console.log(tag, "INIT", JSON.stringify(value));
    const i = impl?.();
    return {
        update: (value: Value) => {
            console.log(tag, "UPDATE", JSON.stringify(value));
            i?.update(value);
        },
        destroy: () => {
            i?.destroy();
            console.log(tag, "DESTROY", "-");
        }
    };
};

const j = jwalker()
// const j = jwalker({ memoizer })
    .node("Boolean", "boolean", { action: ({ value }) => actionize("BOOL", value) })
    .node("Number", "number", { action: ({ value }) => actionize("NUMBER", value) })
    .node("ROOT", "tuple", {
        content: ["Boolean", "Number"],
        action: ({ value, auto }) => 
            actionize("ROOT", value, () => auto(() => null, () => {}, value))
    })
    .build(null, [true, 100]);

j.update([false, 200]);

j.destroy();
`}
    />
</div>

<style>
    div {
        position: relative;
        min-height: 300px;
        padding-top: 5px;
        flex: 1;
    }
    iframe {
        width: 100%;
        height: 250px;
        border: none;
        box-sizing: border-box;
        overflow: scroll;
    }
</style>
