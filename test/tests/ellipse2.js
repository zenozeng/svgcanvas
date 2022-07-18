
export default function ellipse2(ctx) {
    // Draw a cylinder using ellipses and lines.
    var w = 100, h = 100, rx = 50, ry = 10;
    var scaleX = 1.5, scaleY = 1.2;

    ctx.rotate(Math.PI / 10);
    ctx.scale(scaleX, scaleY);
    ctx.translate(200, 25);

    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2 + ry);
    // upper arc top
    ctx.ellipse(0, -h / 2 + ry, rx, ry, Math.PI, 0, Math.PI, 0);
    ctx.moveTo(-w / 2, -h / 2 + ry);
    // upper arc bottom
    ctx.ellipse(0, -h / 2 + ry, rx, ry, Math.PI, 0, Math.PI, 1);
    ctx.moveTo(-w / 2, -h / 2 + ry);
    // left line
    ctx.lineTo(-w / 2, + h / 2 - ry);
    // lower arc
    ctx.ellipse(0, h / 2 - ry, rx, ry, Math.PI, 0, Math.PI, 1);
    // right line
    ctx.lineTo(w / 2, -h / 2 + ry);
    ctx.moveTo(-w / 2, -h / 2 + ry);
    ctx.closePath();

    // Remove scale before stroking because the SVG conversion is not correctly
    // scaling the stroke as well. Without this the pixel differences are too
    // high.
    ctx.resetTransform();
    ctx.stroke();
};