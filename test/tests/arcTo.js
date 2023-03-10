export default function arcTo(ctx) {
    ctx.beginPath();
    ctx.moveTo(150, 20);
    ctx.arcTo(150, 100, 250, 20, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(450, 100, 20, 180/180*Math.PI, 45/180*Math.PI, true);
    ctx.stroke();

    ctx.fillStyle = 'blue';
    // base point
    ctx.fillRect(150, 20, 2, 2);

    ctx.fillStyle = 'red';
    // control point one
    ctx.fillRect(150, 100, 2, 2);
    // control point two
    ctx.fillRect(250, 20, 2, 2);

    ctx.beginPath();
    ctx.moveTo(150, 200);
    ctx.arcTo(250, 200, 250, 250, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(150, 400);
    ctx.arcTo(50, 400, 20, 450, 20);
    ctx.stroke();
};