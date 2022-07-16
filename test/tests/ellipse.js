export default function ellipse(ctx) {
    // Draw shapes
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            var x = 25 + j * 50;               // x coordinate
            var y = 25 + i * 50;               // y coordinate
            var radiusX = 20;                  // Arc radius
            var radiusY = 10;                  // Arc radius
            var rotation = Math.PI + (Math.PI * (i+j)) / 8;
            var startAngle = 0;                     // Starting point on circle
            var endAngle = Math.PI + (Math.PI * j) / 2; // End point on circle
            var clockwise = i % 2 == 0 ? false : true; // clockwise or anticlockwise

            ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, clockwise);

            if (i > 1) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        }
    }
  
};