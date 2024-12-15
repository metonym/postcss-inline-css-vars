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

    expect(process(source)).toMatchSnapshot();
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

    expect(process(source)).toMatchSnapshot();
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

    expect(process(source)).toMatchSnapshot();
  });

  test("removes declarations with undefined variables instead of preserving them", () => {
    const source = `
      :root { --primary-color: #ff0000; }
      h1 { 
        color: var(--undefined-color);
        background: var(--primary-color);
      }
    `;

    expect(process(source)).toMatchSnapshot();
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

    expect(process(source)).toMatchSnapshot();
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

    expect(process(source)).toMatchSnapshot();
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

    expect(process(source)).toMatchSnapshot();
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

    expect(process(source)).toMatchSnapshot();
  });
});
