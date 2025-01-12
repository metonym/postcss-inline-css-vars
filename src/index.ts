import type { Plugin } from "postcss";

const isCssVar = (value: string) => value.includes("var(");

const ROOT_SELECTOR = ":root";

const RE_CSS_VARS = /var\((--[^)]+)\)/g;

const extractVarNames = (value: string): string[] => {
  const matches = [...value.matchAll(RE_CSS_VARS)];
  return matches.map((match) => match[1]);
};

export const inlineCssVars = (): Plugin => {
  return {
    postcssPlugin: "postcss-inline-css-vars",
    Once(root) {
      /**
       * Check if there are any :root rules with additional selectors.
       * In this case, we don't want to process the :root rules since
       * we cannot safely inline the CSS variables.
       * @example
       * :root { --primary-color: #000000; }
       * :root.dark { --primary-color: #ffffff; }
       */
      let has_complex_root_rules = false;

      root.walkRules((rule) => {
        if (
          rule.selector.includes(ROOT_SELECTOR) &&
          rule.selector !== ROOT_SELECTOR
        ) {
          has_complex_root_rules = true;
          return false;
        }
      });

      if (has_complex_root_rules) return;

      let css_vars: Record<string, string> = {};
      let has_root_vars = false;

      root.walkRules(ROOT_SELECTOR, (rule) => {
        has_root_vars = true;
        rule.walkDecls((decl) => {
          css_vars[decl.prop] = decl.value;
        });
        rule.remove();
      });

      if (!has_root_vars) return;

      let changed = true;

      while (changed) {
        changed = false;

        for (const [prop, value] of Object.entries(css_vars)) {
          if (isCssVar(value)) {
            const new_value = value.replace(
              RE_CSS_VARS,
              (match, varName) => {
                return css_vars[varName] || match;
              }
            );

            if (new_value !== value) {
              css_vars[prop] = new_value;
              changed = true;
            }
          }
        }
      }

      root.walkDecls((decl) => {
        if (isCssVar(decl.value)) {
          const var_names = extractVarNames(decl.value);
          const has_undefined_var = var_names.some(
            (var_name) => !css_vars[var_name]
          );

          if (has_undefined_var) {
            // Remove declaration if the CSS variable does not exist.
            decl.remove();
          } else {
            // Replace all variables with their resolved values.
            decl.value = decl.value.replace(RE_CSS_VARS, (match, var_name) => {
              return css_vars[var_name] || match;
            });
          }
        }
      });
    },
  };
};
