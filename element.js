var Context = require('./context');

function SVGCanvasElement(options) {

    var debug = options && options.debug;

    this.ctx = new Context(100, 100, {debug: debug});
    this.svg = this.ctx.__root;

    // sync attributes to svg
    var svg = this.svg;
    var _this = this;

    var wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.appendChild(svg);
    this.wrapper = wrapper;

    Object.defineProperty(this, 'className', {
        get: function() {
            return wrapper.getAttribute('class') || '';
        },
        set: function(val) {
            return wrapper.setAttribute('class', val);
        }
    });

    ["width", "height"].forEach(function(prop) {
        Object.defineProperty(_this, prop, {
            get: function() {
                return svg.getAttribute(prop) | 0;
            },
            set: function(val) {
                if (isNaN(val) || (typeof val === "undefined")) {
                    return;
                }
                _this.ctx['__'+prop] = val;
                svg.setAttribute(prop, val);
                return wrapper[prop] = val;
            }
        });
    });

    ["style", "id"].forEach(function(prop) {
        Object.defineProperty(_this, prop, {
            get: function() {
                return wrapper[prop];
            },
            set: function(val) {
                if (typeof val !== "undefined") {
                    return wrapper[prop] = val;
                }
            }
        });
    });

    ["getBoundingClientRect"].forEach(function(fn) {
        _this[fn] = function() {
            return svg[fn]();
        };
    });
}

SVGCanvasElement.prototype.getContext = function(type) {
    if (type !== '2d') {
        throw new Error('Unsupported type of context for SVGCanvas');
    }

    return this.ctx;
};

// you should always use URL.revokeObjectURL after your work done
SVGCanvasElement.prototype.toObjectURL = function() {
    var data = new XMLSerializer().serializeToString(this.svg);
    var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    return URL.createObjectURL(svg);
};

SVGCanvasElement.prototype.toDataURL = function(type, options) {
    var xml = new XMLSerializer().serializeToString(this.svg);

    // documentMode is an IE-only property
    // http://msdn.microsoft.com/en-us/library/ie/cc196988(v=vs.85).aspx
    // http://stackoverflow.com/questions/10964966/detect-ie-version-prior-to-v9-in-javascript
    var isIE = document.documentMode;

    if (isIE) {
        // This is patch from canvas2svg
        // IE search for a duplicate xmnls because they didn't implement setAttributeNS correctly
        var xmlns = /xmlns="http:\/\/www\.w3\.org\/2000\/svg".+xmlns="http:\/\/www\.w3\.org\/2000\/svg/gi;
        if(xmlns.test(xml)) {
            xml = xml.replace('xmlns="http://www.w3.org/2000/svg','xmlns:xlink="http://www.w3.org/1999/xlink');
        }
    }

    var SVGDataURL = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
    if (type === "image/svg+xml" || !type) {
        return SVGDataURL;
    }
    if (type === "image/jpeg" || type === "image/png") {
        var canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        var ctx = canvas.getContext('2d');
        var img = new Image();
        img.src = SVGDataURL;
        if (img.complete && img.width > 0 && img.height > 0) {
            // for chrome, it's ready immediately
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL(type, options);
        } else {
            // for firefox, it's not possible to provide sync api in current thread
            // and web worker doesn't provide canvas API, so
            throw new Error('svgcanvas.toDataURL() for jpeg/png is only available in Chrome.');
        }
    }
    throw new Error('Unknown type for SVGCanvas.prototype.toDataURL, please use image/jpeg | image/png | image/svg+xml.');
};

SVGCanvasElement.prototype.addEventListener = function() {
    return this.svg.addEventListener.apply(this, arguments);
};

// will return wrapper element: <div><svg></svg></div>
SVGCanvasElement.prototype.getElement = function() {
    return this.wrapper;
};

module.exports = SVGCanvasElement;
