export default function clip(ctx) {
  // Draw a line with clipped areas removed.
  var scaleX = 1.5,
    scaleY = 1.2;

  ctx.rotate(Math.PI / 10);
  ctx.scale(scaleX, scaleY);
  ctx.translate(200, 25);

  // Draw unclipped line
  ctx.beginPath();
  ctx.moveTo(5, 10);
  ctx.lineTo(195, 200);
  ctx.stroke();

  ctx.save();

  // Remove clipped areas
  ctx.beginPath();
  ctx.rect(20, 30, 30, 10);
  ctx.rect(0, 0, 300, 300);
  ctx.stroke();
  ctx.clip("evenodd");

  // Draw line.
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(200, 200);
  ctx.stroke();

  ctx.restore();

  // Draw unclipped line
  ctx.beginPath();
  ctx.moveTo(15, 10);
  ctx.lineTo(205, 200);
  ctx.stroke();
}
