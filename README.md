# ▲ + 💅 Better CSS Support for NextJS

> Feature-parity with NextJS's built-in CSS with the flexibility to support your favorite pre-processor(s)!

<p align="center">
  <a href="./LICENSE">License</a> ·
  <a href="./CHANGELOG.md">Changelog</a> ·
  <a href="./CONTRIBUTING.md">Contributing Guide</a>
</p>

This is a [NextJS](https://nextjs.org) configuration decorator with the goal of approximately mirroring NextJS's [built-in CSS support](https://nextjs.org/docs/basic-features/built-in-css-support) without losing the flexibility of technology choice. For example, at [Magic Labs](https://magic.link), we are invested in [LESS](http://lesscss.org)! However, the built-in CSS features of NextJS are very desirable, so we created `@magiclabs/next-css` to bridge the gap.

## 🔗 Installation

`@magiclabs/next-css` is available as an NPM package:

```bash
# Via NPM:
npm install --save @magiclabs/next-css

# Via Yarn:
yarn add @magiclabs/next-css
```

### Peer Dependencies

This module requires NextJS (`^12.0.0`) as a **peer dependency**. Additionally, any Webpack dependencies related to your CSS pre-processor of choice are required to be installed separately.

## 📚 Usage

The stylesheet is compiled to `.next/static/css`. Next.js will automatically add the css file to the HTML. In production, a chunk hash is added so that styles are updated when a new version of the stylesheet is deployed.

### Basic Configuration

Create a `next.config.js` in the root of your project (next to `pages/` and `package.json`).

```js
// next.config.js
const { withCSS } = require('@magiclabs/next-css'); // Please note the named export!

module.exports = withCSS({
  // Array of objects configuring any CSS pre-processors you like!
  preProcessors: [
    {
      extensions: [...], // i.e.: ["less"] or ["sass", "scss"]
      use: [...], // Receives same configuration as Webpack > Module > Rule > Use
    },
  ],

  // Also valid as a factory function!
  // Receives the same arguments as a NextJS custom `webpack` function.
  preProcessors: (config, options) => [...],
});
```

#### Configuration Fields

- `preProcessors`: An array of `PreProcessorItem` objects, or a function returning an array of `PreProcessorItem` objects with the following shape:
    - `extensions`: An array of `String` values representing CSS file extensions (i.e.: `"css"`, `"less"`, `"scss"`).
    - `use`: An array of objects compatible with [Webpack's Module Rules#UseEntry schema](https://webpack.js.org/configuration/module/#useentry).

## ⚡️ Quick Starts

You can easily configure `@magiclabs/next-css` for the following common use-cases:

- [LESS](#with-less)

### With [LESS](http://lesscss.org)

First, install your LESS-specific dependencies:

```bash
# Via NPM:
npm install --save less less-loader

# Via Yarn:
yarn add less less-loader
```

Next, configure the pre-processor with `@magiclabs/next-css`:

```js
// next.config.js
const { withCSS } = require('@magiclabs/next-css');

module.exports = withCSS({
  preProcessors: [
    {
      extensions: ["less"],
      use: [require.resolve('less-loader')],
    },
  ],
});
```

## ⚖️ Trade-offs

- More dependencies leads to longer NPM package installation times. These are _marginal_ for a typical project.

- This is a wholesale re-implementation of NextJS CSS support, so there may be some inconsistencies between the end results. NextJS notably benefits from aggressive internal optimizations which may be missing or unaccounted for here. That being said, we try our best to match the internal implementation as closely as possible.
