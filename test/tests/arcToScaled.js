export default function arcToScaled(ctx) {
  ctx.scale(2, 0.5);
  ctx.beginPath();
  ctx.moveTo(100, 50);
  ctx.arcTo(150, 50, 150, 100, 50);
  ctx.arcTo(150, 150, 100, 150, 50);
  ctx.arcTo(50, 150, 50, 100, 50);
  ctx.arcTo(50, 50, 100, 50, 50);

  // Reset the scale before we stroke since SVG stroke is not scaled.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.stroke();
};