# markdown-it-dollarmath

[![ci-badge]][ci-link]
[![npm-badge]][npm-link]

A [markdown-it](https://github.com/markdown-it/markdown-it) plugin for $-delimited math environments.

See <https://executablebooks.github.io/markdown-it-dollarmath/> for a demonstration!

Note there is a similar plugin [markdown-it-texmath](https://github.com/goessner/markdown-it-texmath).
`markdown-it-dollarmath` package differs in that it is optimised for dollar math:
it is more performant, handles backslash ``\\`` escaping properly, and allows for more configuration.

## Usage

Options:

- `allow_space`: Parse inline math when there is space after/before the opening/closing `$`, e.g. `$ a $`
- `allow_digits`: Parse inline math when there is a digit before/after the opening/closing `$`, e.g. `1$` or `$2`
- `double_inline`: Search for double-dollar math within inline contexts
- `allow_labels`: Capture math blocks with label suffix, e.g. `$$a=1$$ (eq1)`
- `labelNormalizer`: Function to normalize the label, by default replaces whitespace with `-` (to align with [HTML5 ids](https://html.spec.whatwg.org/multipage/dom.html#global-attributes:the-id-attribute-2))

You should "bring your own" math render, provided as an option to the plugin.
This function should take the string plus (optional) options, and return a string.
For example, below the [KaTeX](https://github.com/Khan/KaTeX) render is used.

As a Node module:

```javascript
import { renderToString } from "katex"
import MarkdownIt from "markdown-it"
import dollarmathPlugin from "markdown-it-dollarmath"

const mdit = MarkdownIt().use(dollarmathPlugin, {
    allow_space: true,
    allow_digits: true,
    double_inline: true,
    allow_labels: true,
    labelNormalizer: (label: string) => {
        return label.replace(/[\s]+/g, "-")
    }
    renderer: renderToString,
    optionsInline: { throwOnError: false, displayMode: false },
    optionsBlock: { throwOnError: false, displayMode: true }
})
const text = mdit.render("$a = 1$")
```

In the browser:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Example Page</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css">
        <script src="https://cdn.jsdelivr.net/npm/markdown-it@12/dist/markdown-it.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js"></script>
        <script src="https://unpkg.com/markdown-it-dollarmath"></script>
    </head>
    <body>
        <div id="demo"></div>
        <script>
            const options = { 
                renderer: katex.renderToString, 
                optionsInline: { throwOnError: false, displayMode: false },
                optionsBlock: { throwOnError: false, displayMode: true }
            };
            const text = window.markdownit().use(window.markdownitDollarmath, options).render("$a = 1$");
            document.getElementById("demo").innerHTML = text
        </script>
    </body>
</html>
```

## Development

### Features

- TypeScript
- Code Formatting ([prettier])
- Code Linting ([eslint])
- Testing and coverage ([jest])
- Continuous Integration ([GitHub Actions])
- Bundled as both UMD and ESM ([rollup])
- Upload as [NPM] package and [unpkg] CDN
- Simple demonstration website ([GitHub Pages])

### Getting Started

1. Create a GitHub repository [from the template](https://docs.github.com/en/github-ae@latest/github/creating-cloning-and-archiving-repositories/creating-a-repository-on-github/creating-a-repository-from-a-template).
2. Replace package details in the following files:
   - `package.json`
   - `LICENSE`
   - `README.md`
   - `rollup.config.js`
3. Install the `node_module` dependencies: `npm install` or `npm ci` (see [Install a project with a clean slate](https://docs.npmjs.com/cli/v7/commands/npm-ci)).
4. Run code formatting; `npm run format`, and linting: `npm run lint:fix`.
5. Run the unit tests; `npm test`, or with coverage; `npm test -- --coverage`.

Now you can start to adapt the code in `src/index.ts` for your plugin, starting with the [markdown-it development recommendations](https://github.com/markdown-it/markdown-it/blob/master/docs/development.md).

Modify the test in `tests/fixtures.spec.ts`, to load your plugin, then the "fixtures" in `tests/fixtures`, to provide a set of potential Markdown inputs and expected HTML outputs.

On commits/PRs to the `master` branch, the GH actions will trigger, running the linting, unit tests, and build tests.
Additionally setup and uncomment the [codecov](https://about.codecov.io/) action in `.github/workflows/ci.yml`, to provide automated CI coverage.

Finally, you can update the version of your package, e.g.: `npm version patch -m "🚀 RELEASE: v%s"`, build; `npm run build`, and publish; `npm publish`.

Finally, you can adapt the HTML document in `docs/`, to load both markdown-it and the plugin (from [unpkg]), then render text from an input area.
This can be deployed by [GitHub Pages].

[ci-badge]: https://github.com/executablebooks/markdown-it-dollarmath/workflows/CI/badge.svg
[ci-link]: https://github.com/executablebooks/markdown-it--plugin-template/actions
[npm-badge]: https://img.shields.io/npm/v/markdown-it-dollarmath.svg
[npm-link]: https://www.npmjs.com/package/markdown-it-dollarmath

[GitHub Actions]: https://docs.github.com/en/actions
[GitHub Pages]: https://docs.github.com/en/pages
[prettier]: https://prettier.io/
[eslint]: https://eslint.org/
[Jest]: https://facebook.github.io/jest/
[Rollup]: https://rollupjs.org
[npm]: https://www.npmjs.com
[unpkg]: https://unpkg.com/
