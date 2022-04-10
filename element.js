import Context from './context';
import imageUtils from './image';

function SVGCanvasElement(options) {

    this.ctx = new Context(options);
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

    Object.defineProperty(this, 'tagName', {
        get: function() {
            return "CANVAS";
        },
        set: function() {} // no-op
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
                _this.ctx[prop] = val;
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

/**
 * toDataURL returns a data URI containing a representation of the image in the format specified by the type parameter.
 * 
 * @param {String} type A DOMString indicating the image format. The default type is image/svg+xml; this image format will be also used if the specified type is not supported.
 * @param {Number} encoderOptions A Number between 0 and 1 indicating the image quality to be used when creating images using file formats that support lossy compression (such as image/jpeg or image/webp). A user agent will use its default quality value if this option is not specified, or if the number is outside the allowed range.
 * @param {Boolean} options.async Will return a Promise<String> if true, must be set to true if type is not image/svg+xml
 */
SVGCanvasElement.prototype.toDataURL = function(type, encoderOptions, options) {
    return imageUtils.toDataURL(this.svg, this.width, this.height, type, encoderOptions, options)
};

SVGCanvasElement.prototype.addEventListener = function() {
    return this.svg.addEventListener.apply(this.svg, arguments);
};

// will return wrapper element: <div><svg></svg></div>
SVGCanvasElement.prototype.getElement = function() {
    return this.wrapper;
};

SVGCanvasElement.prototype.getAttribute = function(prop) {
    return this.wrapper.getAttribute(prop);
};

SVGCanvasElement.prototype.setAttribute = function(prop, val) {
    this.wrapper.setAttribute(prop, val);
};

export default SVGCanvasElement;
