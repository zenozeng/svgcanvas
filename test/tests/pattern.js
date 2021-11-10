export default function pattern(ctx) {
  // Create a pattern
  const patternCanvas = document.createElement('canvas');
  const patternContext = patternCanvas.getContext('2d');

  // Give the pattern a width and height of 50
  patternCanvas.width = 50;
  patternCanvas.height = 50;

  // Give the pattern a background color and draw an arc
  patternContext.fillStyle = '#fec';
  patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
  patternContext.arc(0, 0, 50, 0, .5 * Math.PI);
  patternContext.stroke();

  const pattern = ctx.createPattern(patternCanvas, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, 50, 50);

  var img = new Image();
  img.src = 'pattern.png';
  img.onload = function() {
    var pattern = ctx.createPattern(img, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(50, 50, 300, 300);
  };

};
