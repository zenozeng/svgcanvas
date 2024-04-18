function makePath(ctx, arg) {
  if (ctx.createPath) {
    return ctx.createPath(arg);
  } else {
    return new Path2D(arg);
  }
}

export default function path2D(ctx) {
  const path1 = makePath(
    ctx,
    `M 230 80
        A 45 45, 0, 1, 0, 275 125
        L 275 80 Z`
  );

  ctx.save();
  ctx.strokeStyle = "red";
  ctx.stroke(path1);
  ctx.fillStyle = "grey";
  ctx.fill(path1);

  ctx.translate(10, 25);
  ctx.lineWidth = 10;
  ctx.stroke(path1);

  ctx.rotate(Math.PI / 4);
  ctx.scale(1.5, 1.5);
  ctx.translate(10, 25);

  ctx.strokeStyle = "blue";
  ctx.stroke(path1);
  ctx.restore();

  ctx.save();
  // Stroke and fill the same path.
  ctx.beginPath();
  ctx.rect(10, 10, 40, 20);
  ctx.save();
  ctx.strokeStyle = "red";
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "green";
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Scaling path versus scaling the context.
  const path2 = makePath(
    ctx,
    `M -10 -10
     L 10 -10
     L 10 10
     L -10 10
     Z`
  );


  ctx.save();
  ctx.translate(25, 100);
  ctx.scale(2, 1);
  ctx.strokeStyle = "red";
  ctx.moveTo(-10, -10);
  ctx.lineTo(10, -10);
  ctx.lineTo(10, 10);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fillStyle = "grey";
  ctx.fill();
  ctx.scale(1 / 2, 1); // Reset scale so that stroke is not scaled.
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(100, 100);
  ctx.scale(2, 1);
  ctx.fillStyle = "grey";
  ctx.fill(path2);
  ctx.strokeStyle = "red";

  let pNext = makePath(ctx);
  // add first path, transform path, twice size, move 100,10
  pNext.addPath(path2, new DOMMatrix([
    2, 0,
    0, 1,
    0,
    0,
  ]));

  ctx.scale(1 / 2, 1); // Reset scale so that stroke is not scaled.
  ctx.stroke(pNext);
  ctx.restore();
}
