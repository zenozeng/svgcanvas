export default function arcTo(ctx) {
    ctx.beginPath();
    ctx.moveTo(100, 225);             // P0
    ctx.arcTo(300, 25, 500, 225, 75); // P1, P2 and the radius
    ctx.lineTo(500, 225);             // P2
    ctx.stroke();


    const path = [[50, 50], [50, 150], [100, 150], [100, 150], [200, 150], [200, 50], [300, 50],  [300, 150]];
    ctx.beginPath();
    let fromPoint = path[0];
    ctx.moveTo(fromPoint[0], fromPoint[1]);            
    for (let i = 1; i < path.length; i++) {
        const point = path[i];
        ctx.arcTo(fromPoint[0], fromPoint[1], point[0], point[1], 20); // P1, P2 and the radius
        fromPoint = point;
    }
    ctx.lineTo(300, 100)
    ctx.stroke();
};