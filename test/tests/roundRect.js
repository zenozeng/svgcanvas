export default function roundRect(ctx) {
  ctx.beginPath();
  ctx.roundRect(150, 20, 100, 50, 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(150, 150, 100, 50, 50);
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(150, 300, 50, 50, 50);
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(300, 20, 100, 50, 10);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(300, 150, 100, 50, [10, 20, 30, 50]);
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(300, 300, 50, 50, [10, 30]);
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(300, 400, 50, 50, [30]);
  ctx.stroke();
};