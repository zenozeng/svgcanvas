import { format } from "./utils";

export default (function () {
  "use strict";

  var Path2D;

  Path2D = function (ctx, arg) {
    if (!ctx) {
      console.error("Path2D must be passed the context");
    }
    if (typeof arg === "string") {
      // Initialize from string path.
      this.__pathString = arg;
    } else if (typeof arg === "object") {
      // Initialize by copying another path.
      this.__pathString = arg.__pathString;
    } else {
      // Initialize a new path.
      this.__pathString = "";
    }

    this.ctx = ctx;
    this.__currentPosition = { x: undefined, y: undefined };
  };

  Path2D.prototype.__matrixTransform = function (x, y) {
    return this.ctx.__matrixTransform(x, y);
  };

  Path2D.prototype.addPath = function (path, transform) {
    if (transform)
      console.error("transform argument to addPath is not supported");

    this.__pathString = this.__pathString + " " + path;
  };

  /**
   * Closes the current path
   */
  Path2D.prototype.closePath = function () {
    this.addPath("Z");
  };

  /**
   * Adds the move command to the current path element,
   * if the currentPathElement is not empty create a new path element
   */
  Path2D.prototype.moveTo = function (x, y) {
    // creates a new subpath with the given point
    this.__currentPosition = { x: x, y: y };
    this.addPath(
      format("M {x} {y}", {
        x: this.__matrixTransform(x, y).x,
        y: this.__matrixTransform(x, y).y,
      })
    );
  };

  /**
   * Adds a line to command
   */
  Path2D.prototype.lineTo = function (x, y) {
    this.__currentPosition = { x: x, y: y };
    if (this.__pathString.indexOf("M") > -1) {
      this.addPath(
        format("L {x} {y}", {
          x: this.__matrixTransform(x, y).x,
          y: this.__matrixTransform(x, y).y,
        })
      );
    } else {
      this.addPath(
        format("M {x} {y}", {
          x: this.__matrixTransform(x, y).x,
          y: this.__matrixTransform(x, y).y,
        })
      );
    }
  };

  /**
   *  Adds a rectangle to the path.
   */
  Path2D.prototype.rect = function (x, y, width, height) {
    this.moveTo(x, y);
    this.lineTo(x + width, y);
    this.lineTo(x + width, y + height);
    this.lineTo(x, y + height);
    this.lineTo(x, y);
  };

  /**
   * Add a bezier command
   */
  Path2D.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
    this.__currentPosition = { x: x, y: y };
    this.addPath(
      format("C {cp1x} {cp1y} {cp2x} {cp2y} {x} {y}", {
        cp1x: this.__matrixTransform(cp1x, cp1y).x,
        cp1y: this.__matrixTransform(cp1x, cp1y).y,
        cp2x: this.__matrixTransform(cp2x, cp2y).x,
        cp2y: this.__matrixTransform(cp2x, cp2y).y,
        x: this.__matrixTransform(x, y).x,
        y: this.__matrixTransform(x, y).y,
      })
    );
  };

  /**
   * Adds a quadratic curve to command
   */
  Path2D.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
    this.__currentPosition = { x: x, y: y };
    this.addPath(
      format("Q {cpx} {cpy} {x} {y}", {
        cpx: this.__matrixTransform(cpx, cpy).x,
        cpy: this.__matrixTransform(cpx, cpy).y,
        x: this.__matrixTransform(x, y).x,
        y: this.__matrixTransform(x, y).y,
      })
    );
  };

  /**
   *  Arc command!
   */
  Path2D.prototype.arc = function (
    x,
    y,
    radius,
    startAngle,
    endAngle,
    counterClockwise
  ) {
    // in canvas no circle is drawn if no angle is provided.
    if (startAngle === endAngle) {
      return;
    }
    startAngle = startAngle % (2 * Math.PI);
    endAngle = endAngle % (2 * Math.PI);
    if (startAngle === endAngle) {
      //circle time! subtract some of the angle so svg is happy (svg elliptical arc can't draw a full circle)
      endAngle =
        (endAngle + 2 * Math.PI - 0.001 * (counterClockwise ? -1 : 1)) %
        (2 * Math.PI);
    }
    var endX = x + radius * Math.cos(endAngle),
      endY = y + radius * Math.sin(endAngle),
      startX = x + radius * Math.cos(startAngle),
      startY = y + radius * Math.sin(startAngle),
      sweepFlag = counterClockwise ? 0 : 1,
      largeArcFlag = 0,
      diff = endAngle - startAngle;

    // https://github.com/gliffy/canvas2svg/issues/4
    if (diff < 0) {
      diff += 2 * Math.PI;
    }

    if (counterClockwise) {
      largeArcFlag = diff > Math.PI ? 0 : 1;
    } else {
      largeArcFlag = diff > Math.PI ? 1 : 0;
    }

    var scaleX = Math.hypot(
      this.ctx.__transformMatrix.a,
      this.ctx.__transformMatrix.b
    );
    var scaleY = Math.hypot(
      this.ctx.__transformMatrix.c,
      this.ctx.__transformMatrix.d
    );

    this.lineTo(startX, startY);
    this.addPath(
      format(
        "A {rx} {ry} {xAxisRotation} {largeArcFlag} {sweepFlag} {endX} {endY}",
        {
          rx: radius * scaleX,
          ry: radius * scaleY,
          xAxisRotation: 0,
          largeArcFlag: largeArcFlag,
          sweepFlag: sweepFlag,
          endX: this.__matrixTransform(endX, endY).x,
          endY: this.__matrixTransform(endX, endY).y,
        }
      )
    );

    this.__currentPosition = { x: endX, y: endY };
  };

  /**
   * Return a new normalized vector of given vector
   */
  var normalize = function (vector) {
    var len = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    return [vector[0] / len, vector[1] / len];
  };

  /**
   * Adds the arcTo to the current path. Based on Webkit implementation from
   * https://github.com/WebKit/webkit/blob/main/Source/WebCore/platform/graphics/cairo/PathCairo.cpp
   *
   * @see http://www.w3.org/TR/2015/WD-2dcontext-20150514/#dom-context-2d-arcto
   */
  Path2D.prototype.arcTo = function (x1, y1, x2, y2, radius) {
    // Let the point (x0, y0) be the last point in the subpath.
    var x0 = this.__currentPosition && this.__currentPosition.x;
    var y0 = this.__currentPosition && this.__currentPosition.y;

    // First ensure there is a subpath for (x1, y1).
    if (typeof x0 == "undefined" || typeof y0 == "undefined") {
      return;
    }

    // Negative values for radius must cause the implementation to throw an IndexSizeError exception.
    if (radius < 0) {
      throw new Error(
        "IndexSizeError: The radius provided (" + radius + ") is negative."
      );
    }

    // If the point (x0, y0) is equal to the point (x1, y1),
    // or if the point (x1, y1) is equal to the point (x2, y2),
    // or if the radius radius is zero,
    // then the method must add the point (x1, y1) to the subpath,
    // and connect that point to the previous point (x0, y0) by a straight line.
    if ((x0 === x1 && y0 === y1) || (x1 === x2 && y1 === y2) || radius === 0) {
      this.lineTo(x1, y1);
      return;
    }

    const p1p0 = [x0 - x1, y0 - y1];
    const p1p2 = [x2 - x1, y2 - y1];
    const p1p0_length = Math.hypot(p1p0[0], p1p0[1]);
    const p1p2_length = Math.hypot(p1p2[0], p1p2[1]);
    const cos_phi = (p1p0[0] * p1p2[0] + p1p0[1] * p1p2[1]) / (p1p0_length * p1p2_length);
    // all points on a line logic
    if (cos_phi == -1) {
      this.lineTo(x1, y1);
      return;
    }
    if (cos_phi == 1) {
      // add infinite far away point
      const max_length = 65535;
      const factor_max = max_length / p1p0_length;
      const ep = [xp0 + factor_max * p1p0[0], y0 + factor_max * p1p0[1]];
      this.lineTo(ep[0], ep[1]);
      return;
    }

    const tangent = radius / Math.tan(Math.acos(cos_phi) / 2);
    const factor_p1p0 = tangent / p1p0_length;
    const t_p1p0 = [x1 + factor_p1p0 * p1p0[0], y1 + factor_p1p0 * p1p0[1]];

    let orth_p1p0 = [p1p0[1], -p1p0[0]];
    const orth_p1p0_length = Math.hypot(orth_p1p0[0], orth_p1p0[1]);
    const factor_ra = radius / orth_p1p0_length;

    // angle between orth_p1p0 and p1p2 to get the right vector orthographic to p1p0
    const cos_alpha = (orth_p1p0[0] * p1p2[0] + orth_p1p0[1] * p1p2[1]) / (orth_p1p0_length * p1p2_length);
    if (cos_alpha < 0) {
      orth_p1p0 = [-orth_p1p0[0], -orth_p1p0[1]];
    }

    const p = [t_p1p0[0] + factor_ra * orth_p1p0[0], t_p1p0[1] + factor_ra * orth_p1p0[1]];

    // calculate angles for addArc
    orth_p1p0 = [-orth_p1p0[0], -orth_p1p0[1]];
    let sa = Math.acos(orth_p1p0[0] / orth_p1p0_length);
    if (orth_p1p0[1] < 0) {
      sa = 2 * Math.PI - sa;
    }

    // anticlockwise logic
    let anticlockwise = false;

    const factor_p1p2 = tangent / p1p2_length;
    const t_p1p2 = [x1 + factor_p1p2 * p1p2[0], y1 + factor_p1p2 * p1p2[1]];
    const orth_p1p2 = [t_p1p2[0] - p[0], t_p1p2[1] - p[1]];
    const orth_p1p2_length = Math.hypot(orth_p1p2[0], orth_p1p2[1]);
    let ea = Math.acos(orth_p1p2[0] / orth_p1p2_length);
    if (orth_p1p2[1] < 0) {
      ea = 2 * Math.PI - ea;
    }
    if (sa > ea && sa - ea < Math.PI)
        anticlockwise = true;
    if (sa < ea && ea - sa > Math.PI)
        anticlockwise = true;

    this.lineTo(t_p1p0[0], t_p1p0[1])
    this.arc(p[0], p[1], radius, sa, ea, anticlockwise)
  };

  /**
   *  Ellipse command!
   */
  Path2D.prototype.ellipse = function (
    x,
    y,
    radiusX,
    radiusY,
    rotation,
    startAngle,
    endAngle,
    counterClockwise
  ) {
    if (startAngle === endAngle) {
      return;
    }

    var transformedCenter = this.__matrixTransform(x, y);
    x = transformedCenter.x;
    y = transformedCenter.y;
    var scale = this.ctx.__getTransformScale();
    radiusX = radiusX * scale.x;
    radiusY = radiusY * scale.y;
    rotation = rotation + this.ctx.__getTransformRotation();

    startAngle = startAngle % (2 * Math.PI);
    endAngle = endAngle % (2 * Math.PI);
    if (startAngle === endAngle) {
      endAngle =
        (endAngle + 2 * Math.PI - 0.001 * (counterClockwise ? -1 : 1)) %
        (2 * Math.PI);
    }
    var endX =
        x +
        Math.cos(-rotation) * radiusX * Math.cos(endAngle) +
        Math.sin(-rotation) * radiusY * Math.sin(endAngle),
      endY =
        y -
        Math.sin(-rotation) * radiusX * Math.cos(endAngle) +
        Math.cos(-rotation) * radiusY * Math.sin(endAngle),
      startX =
        x +
        Math.cos(-rotation) * radiusX * Math.cos(startAngle) +
        Math.sin(-rotation) * radiusY * Math.sin(startAngle),
      startY =
        y -
        Math.sin(-rotation) * radiusX * Math.cos(startAngle) +
        Math.cos(-rotation) * radiusY * Math.sin(startAngle),
      sweepFlag = counterClockwise ? 0 : 1,
      largeArcFlag = 0,
      diff = endAngle - startAngle;

    if (diff < 0) {
      diff += 2 * Math.PI;
    }

    if (counterClockwise) {
      largeArcFlag = diff > Math.PI ? 0 : 1;
    } else {
      largeArcFlag = diff > Math.PI ? 1 : 0;
    }

    // Transform is already applied, so temporarily remove since lineTo
    // will apply it again.
    var currentTransform = this.ctx.__transformMatrix;
    this.ctx.resetTransform();
    this.lineTo(startX, startY);
    this.ctx.__transformMatrix = currentTransform;

    this.addPath(
      format(
        "A {rx} {ry} {xAxisRotation} {largeArcFlag} {sweepFlag} {endX} {endY}",
        {
          rx: radiusX,
          ry: radiusY,
          xAxisRotation: rotation * (180 / Math.PI),
          largeArcFlag: largeArcFlag,
          sweepFlag: sweepFlag,
          endX: endX,
          endY: endY,
        }
      )
    );

    this.__currentPosition = { x: endX, y: endY };
  };

  return Path2D;
})();
