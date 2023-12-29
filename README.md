# SVGCanvas

** Aha! note: the current branch for all builds is `issue-fill-path` **

Draw on SVG using Canvas's 2D Context API. A maintained fork of
[gliffy's canvas2svg](https://github.com/gliffy/canvas2svg).

## Demo

https://zenozeng.github.io/svgcanvas/test/

## How it works

We create a mock 2d canvas context. Use the canvas context like you would on a
normal canvas. As you call methods, we build up a scene graph in SVG.

## Usage

```javascript
import { Context } from "svgcanvas";

const ctx = new Context(500, 500);

// draw your canvas like you would normally
ctx.fillStyle = "red";
ctx.fillRect(100, 100, 100, 100);

// serialize your SVG
const mySerializedSVG = ctx.getSerializedSvg();
```

Wrapping canvas elements:

```javascript
import { Context, Element } from "svgcanvas";

const canvas = document.createElement("canvas");
const context2D = canvas.getContext("2d");

// more options to pass into constructor:
const options = {
  height: 2000, // falsy values get converted to 500
  width: 0 / 0, // falsy values get converted to 500
  ctx: context2D, // existing Context2D to wrap around
  enableMirroring: false, // whether canvas mirroring (get image data) is enabled (defaults to false)
  document: undefined, // overrides default document object
};

// Creates a mock canvas context (mocks `context2D` above)
const ctx = new Context(options);

// draw your canvas like you would normally
ctx.fillStyle = "red";
ctx.fillRect(100, 100, 100, 100);

ctx.getSerializedSvg(); // returns the serialized SVG
ctx.getSvg(); // returns the inline svg element

// Creates a mock canvas element (mocks `canvas` above)
const dom = new Element(options);
dom.ctx; // the internal context, via `new Context(options)`
dom.wrapper; // a div with the svg as a child
dom.svg; // the inline svg element
```

Working with paths directly:

```javascript
import { Context, Path2D } from "svgcanvas";

const ctx = new Context(500, 500);

// Create a path:
const path = new Path2D(ctx, "M 230 80 L 275 80 Z"); // or ctx.createPath("M 230 80 L 275 80 Z");
ctx.stroke(path);

// serialize your SVG
const mySerializedSVG = ctx.getSerializedSvg();
```

## Tests

https://zenozeng.github.io/p5.js-svg/test/

To run the testsuite:

```
npm run test
```

To debug tests in a browser:

```
open test/index.html
npm run watch
```

## License

This library is licensed under the MIT license.
