export default function emptyArc(ctx) {

    // Draw shapes
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.arc(100, 100, 100, Math.PI, Math.PI);
            ctx.fill();
        }
    }
    
};
