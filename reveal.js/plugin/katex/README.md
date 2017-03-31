# KaTeX for reveal.js

This plugin for [reveal.js](https://github.com/hakimel/reveal.js) provides [KaTeX](https://github.com/Khan/KaTeX) support. You will then be able to write mathematical formulas into your presentations.

KaTeX is faster and lighter than MathJax, used by the default math plugin provided by reveal.js.

## Installation

Clone this repository with the following command.

```
git clone https://github.com/JeremyHeleine/KaTeX-for-reveal.js
```

Then, place the `katex` folder into the `plugin` directory of your reveal.js installation.

## Usage

To use this plugin, indicate it as a dependency of reveal.js, as in the example below.

```js
Reveal.initialize({
	dependencies: [
		{src: 'plugin/katex/katex.js', async: true}
	]
});
```

The math symbols in your slides will then be automatically interpreted by KaTeX. You have four choices to encapsulate your math symbols:

* between `$` and `$` or `\(` and `\)` for math in inline mode,
* between `$$` and `$$` or `\[` and `\]` for math in display mode.

## License

This plugin is released under the MIT license.
