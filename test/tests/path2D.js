function makePath(ctx, arg) {
    if (ctx.createPath) {
        return ctx.createPath(arg);
    } else {
        return new Path2D(arg);
    }
}

export default function path2D(ctx) {
    const path1 = makePath(ctx, `M 230 80
        A 45 45, 0, 1, 0, 275 125
        L 275 80 Z`);

    ctx.strokeStyle = 'red';
    ctx.stroke(path1);
    ctx.fillStyle = 'grey';
    ctx.fill(path1);

    ctx.translate(10, 25);
    ctx.lineWidth = 10;
    ctx.stroke(path1);

    ctx.rotate(Math.PI / 4);
    ctx.scale(1.5, 1.5);
    ctx.translate(10, 25);

    ctx.strokeStyle = 'blue';
    ctx.stroke(path1);
 };