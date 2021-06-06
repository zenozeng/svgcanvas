# SVGCanvas

Draw on SVG using Canvas's 2D Context API.
A maintained fork of [gliffy's canvas2svg](https://github.com/gliffy/canvas2svg).

## Demo

http://zenozeng.github.io/canvas2svg/test/playground.html

## How it works
We create a mock 2d canvas context. Use the canvas context like you would on a normal canvas. As you call methods, we 
build up a scene graph in SVG. Yay!

## Usage

```javascript
//Create a new mock canvas context. Pass in your desired width and height for your svg document.
var ctx = new C2S(500,500);

//draw your canvas like you would normally
ctx.fillStyle="red";
ctx.fillRect(100,100,100,100);
//etc...

//serialize your SVG
var mySerializedSVG = ctx.getSerializedSvg(); //true here, if you need to convert named to numbered entities.

//If you really need to you can access the shadow inline SVG created by calling:
var svg = ctx.getSvg();
```

## License

This library is licensed under the MIT license.
