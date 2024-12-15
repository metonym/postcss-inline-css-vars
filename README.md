# postcss-inline-css-vars

> PostCSS plugin to inline `:root` CSS variables.

This PostCSS plugin inlines CSS custom properties (CSS variables) by replacing `var()` references with their actual values.

```diff
- :root {
-  --primary-color: #000000;
- }

.button {
- color: var(--primary-color);
+ color: #000000;
}
```

Once processed, the `:root` CSS variables are removed from the output.

The plugin supports nested variables.

```css
:root {
  --primary: #ff0000;
  --button-color: var(--primary);
}
```

Non-existent CSS variables are removed from the output. The `:root` declaration will still be removed.

```css
:root {
  --primary: #ff0000;
}

.button {
  color: var(--button-color); /* Declaration is removed */
}
```

If the input contains `:root` declarations with other selectors, all `:root` declarations will be preserved.

For instance, the following example assumes dynamically applied themes. As such, CSS variables cannot be inlined without having to generate more CSS.

```css
:root {
  --primary-color: #ffffff;
}

:root.dark {
  --primary-color: #000000;
}
```

## Installation

```bash
# NPM
npm i -D postcss-inline-css-vars

# pnpm
pnpm i -D postcss-inline-css-vars

# Yarn
yarn add -D postcss-inline-css-vars

# Bun
bun add -D postcss-inline-css-vars
```

## Usage

### Basic Usage

```js
import { inlineCssVars } from "postcss-inline-css-vars";

postcss(inlineCssVars()).process(css);
```

## Changelog

[CHANGELOG.md](CHANGELOG.md)

## License

[MIT](LICENSE)
