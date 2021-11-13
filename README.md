# SVGCanvas

Draw on SVG using Canvas's 2D Context API.
A maintained fork of [gliffy's canvas2svg](https://github.com/gliffy/canvas2svg).

## Demo

https://zenozeng.github.io/svgcanvas/test/

## How it works

We create a mock 2d canvas context. Use the canvas context like you would on a normal canvas. As you call methods, we build up a scene graph in SVG.

## Usage

```javascript
import {Context} from 'svgcanvas'

const ctx = new Context(500, 500);

//draw your canvas like you would normally
ctx.fillStyle="red";
ctx.fillRect(100,100,100,100);

// serialize your SVG
const mySerializedSVG = ctx.getSerializedSvg(); 
```

## CHANGELOG

### v2.0.5

- Fix adding CanvasPattern ([Xavier Delamotte](https://github.com/x4d3)) [#7](https://github.com/zenozeng/svgcanvas/pull/7)

### v2.0.4

- fix: push/pop transformMatrixStack when save/restore, for https://github.com/zenozeng/p5.js-svg/issues/191

### v2.0.3

- feat: sync element's width and height to context

### v2.0.2

- feat: Implement CanvasTransform Interface, https://github.com/gliffy/canvas2svg/pull/83
- feat: ClearCanvas in fillRect
- feat: Element API
- feat: ESM
- fix: Recreate root `<g>` when __clearCanvas to remove all attributes
- chore: Bundle JavaScript using Rollup
- chore: GitHub Actions

### v1.x

- v1.0.19 Fix __parseFont to not crash
- v1.0.18 clip was not working, the path never made it to the clip area
- v1.0.17 Fix bug with drawing in an empty context. Fix image translation problem. Fix globalAlpha issue.
- v1.0.16 Add npm publishing support, bower file and optimize for arcs with no angles.
- v1.0.15 Setup travis, add testharness and debug playground, and fix regression for __createElement refactor
- v1.0.14 bugfix for gradients, move __createElement to scoped createElement function, so all classes have access. 
- v1.0.13 set paint order before stroke and fill to make them behavior like canvas
- v1.0.12 Implementation of ctx.prototype.arcTo.
- v1.0.11 call lineTo instead moveTo in ctx.arc, fixes closePath issue and straight line issue
- v1.0.10 when lineTo called, use M instead of L unless subpath exists
- v1.0.9 use currentDefaultPath instead of <path>'s d attribute, fixes stroke's different behavior in SVG and canvas.
- v1.0.8 reusing __createElement and adding a properties undefined check
- v1.0.7 fixes for multiple transforms and fills and better text support from stafyniaksacha
- v1.0.6 basic support for text baseline (contribution from KoKuToru)
- v1.0.5 fixes for #5 and #6 (with contributions from KoKuToru)
- v1.0.4 generate ids that start with a letter
- v1.0.3 fixed #4 where largeArcFlag was set incorrectly in some cases 
- v1.0.2 Split up rgba values set in fill/stroke to allow illustrator import support.
- v1.0.1 Allow C2S to be called as a function. https://github.com/gliffy/canvas2svg/issues/2 
- v1.0.0 Initial release

## License

This library is licensed under the MIT license.
