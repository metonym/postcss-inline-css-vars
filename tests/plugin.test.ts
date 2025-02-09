import postcss from "postcss";
import { inlineCssVars } from "../src";

describe("inlineCssVars", () => {
  const process = (css: string) => {
    return postcss(inlineCssVars()).process(css.trim()).css.trim();
  };

  test("removes :root rule after processing", () => {
    const source = `
      :root { --primary-color: #ff0000; }
      h1 { color: red; }
    `;

    expect(process(source)).toBe("h1 { color: red; }");
  });

  test("replaces CSS variable with its value", () => {
    const source = `
      :root { --primary-color: #ff0000; }
      h1 { color: var(--primary-color); }
    `;

    expect(process(source)).toBe("h1 { color: #ff0000; }");
  });

  test("handles multiple CSS variables", () => {
    const source = `
      :root {
        --primary-color: #ff0000;
        --secondary-color: #00ff00;
      }
      h1 { color: var(--primary-color); }
      p { color: var(--secondary-color); }
    `;

    expect(process(source)).toMatchInlineSnapshot(`
"h1 { color: #ff0000; }
      p { color: #00ff00; }"
`);
  });

  test("removes declarations with undefined variables", () => {
    const source = `
      :root { 
        --defined-color: #ff0000;
      }
      .button { 
        color: var(--undefined-color);
        background: var(--defined-color);
      }
    `;

    expect(process(source)).toMatchInlineSnapshot(`
".button {
        background: #ff0000;
      }"
`);
  });

  test("removes declarations with any undefined variable in multi-var declarations", () => {
    const source = `
      :root { 
        --spacing-x: 10px;
      }
      .box { 
        margin: var(--spacing-y) var(--spacing-x);
        padding: var(--spacing-x) var(--spacing-x);
      }
    `;

    expect(process(source)).toMatchInlineSnapshot(`
".box {
        padding: 10px 10px;
      }"
`);
  });

  test("removes declarations with undefined variables instead of preserving them", () => {
    const source = `
      :root { --primary-color: #ff0000; }
      h1 { 
        color: var(--undefined-color);
        background: var(--primary-color);
      }
    `;

    expect(process(source)).toMatchInlineSnapshot(`
"h1 {
        background: #ff0000;
      }"
`);
  });

  test("handles nested CSS variables", () => {
    const source = `
      :root {
        --primary: #ff0000;
        --button-color: var(--primary);
      }
      button { color: var(--button-color); }
    `;
    const result = process(source);

    expect(result).not.toContain(":root");
    expect(result).toContain("color: #ff0000");
  });

  test("handles multiple var() references in single declaration", () => {
    const source = `
      :root {
        --spacing-x: 10px;
        --spacing-y: 20px;
      }
      .box { margin: var(--spacing-y) var(--spacing-x); }
    `;

    expect(process(source)).toMatchInlineSnapshot(`".box { margin: 20px 10px; }"`);
  });

  test("skips processing when no root vars present", () => {
    const source = `
      .button { 
        color: blue;
        padding: 10px;
      }
      .header {
        font-size: 16px;
      }
    `;

    expect(process(source)).toBe(source.trim());
  });

  test("ignores :root when part of a larger selector", () => {
    const source = `
      :root.dark {
        --primary-color: #000000;
      }
      :root.light {
        --primary-color: #ffffff;
      }
      .button { color: var(--primary-color); }
    `;

    expect(process(source)).toMatchInlineSnapshot(`
":root.dark {
        --primary-color: #000000;
      }
      :root.light {
        --primary-color: #ffffff;
      }
      .button { color: var(--primary-color); }"
`);
  });

  test("preserves all rules when complex :root selectors exist", () => {
    const source = `
      :root {
        --primary-color: #ffffff;
      }
      :root.dark {
        --primary-color: #000000;
      }
      .button { color: var(--primary-color); }
    `;

    expect(process(source)).toMatchInlineSnapshot(`
":root {
        --primary-color: #ffffff;
      }
      :root.dark {
        --primary-color: #000000;
      }
      .button { color: var(--primary-color); }"
`);
  });

  test("preserves rules with multiple complex :root selectors", () => {
    const source = `
      :root {
        --primary-color: #ffffff;
      }
      :root.dark {
        --primary-color: #000000;
      }
      :root[data-theme="custom"] {
        --primary-color: #ff0000;
      }
      .button { color: var(--primary-color); }
    `;

    expect(process(source)).toMatchInlineSnapshot(`
":root {
        --primary-color: #ffffff;
      }
      :root.dark {
        --primary-color: #000000;
      }
      :root[data-theme="custom"] {
        --primary-color: #ff0000;
      }
      .button { color: var(--primary-color); }"
`);
  });

  test("handles circular variable references", () => {
    const source = `
      :root {
        --color-a: var(--color-b);
        --color-b: var(--color-a);
      }
      .button { color: var(--color-a); }
    `;

    expect(process(source)).toBe(".button { color: var(--color-a); }");
  });

  test("resolves deeply nested variable references", () => {
    const source = `
      :root {
        --color-base: #ff0000;
        --color-primary: var(--color-base);
        --color-button: var(--color-primary);
        --color-special: var(--color-button);
      }
      .button { color: var(--color-special); }
    `;

    expect(process(source)).toBe(".button { color: #ff0000; }");
  });

  test("handles variables within complex values", () => {
    const source = `
      :root {
        --spacing: 20px;
        --color: blue;
      }
      .box { 
        margin: calc(var(--spacing) * 2) 10px;
        border: 1px solid var(--color);
      }
    `;

    expect(process(source)).toBe(
      ".box { \n        margin: calc(20px * 2) 10px;\n        border: 1px solid blue;\n      }"
    );
  });

  test("processes multiple :root declarations sequentially", () => {
    const source = `
      :root {
        --color: blue;
      }
      :root {
        --spacing: 20px;
      }
      .box { 
        color: var(--color);
        margin: var(--spacing);
      }
    `;

    expect(process(source)).toBe(
      ".box { \n        color: blue;\n        margin: 20px;\n      }"
    );
  });

  test("handles empty :root declarations", () => {
    const source = `
      :root {}
      :root {
        --color: blue;
      }
      .box { color: var(--color); }
    `;

    expect(process(source)).toBe(".box { color: blue; }");
  });

  test("handles variables with multiple values", () => {
    const source = `
      :root {
        --font-config: bold 16px/1.5 arial;
        --transform: translate(10px) scale(1.2);
      }
      .text { 
        font: var(--font-config);
        transform: var(--transform);
      }
    `;

    expect(process(source)).toBe(
      ".text { \n        font: bold 16px/1.5 arial;\n        transform: translate(10px) scale(1.2);\n      }"
    );
  });

  test("handles variables used multiple times in single value", () => {
    const source = `
      :root {
        --size: 10px;
      }
      .box { 
        box-shadow: var(--size) var(--size) black, calc(var(--size) * 2) calc(var(--size) * 2) gray;
      }
    `;

    expect(process(source)).toBe(
      ".box { \n        box-shadow: 10px 10px black, calc(10px * 2) calc(10px * 2) gray;\n      }"
    );
  });
});
