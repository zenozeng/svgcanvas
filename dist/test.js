(function () {
    'use strict';

    /*!!
     *  SVGCanvas v2.0.1
     *  Draw on SVG using Canvas's 2D Context API.
     *
     *  Licensed under the MIT license:
     *  http://www.opensource.org/licenses/mit-license.php
     *
     *  Author:
     *  Kerry Liu
     *  Zeno Zeng
     *
     *  Copyright (c) 2014 Gliffy Inc.
     *  Copyright (c) 2021 Zeno Zeng
     */

    var Context = (function () {

        var STYLES, ctx, CanvasGradient, CanvasPattern, namedEntities;

        //helper function to format a string
        function format(str, args) {
            var keys = Object.keys(args), i;
            for (i=0; i<keys.length; i++) {
                str = str.replace(new RegExp("\\{" + keys[i] + "\\}", "gi"), args[keys[i]]);
            }
            return str;
        }

        //helper function that generates a random string
        function randomString(holder) {
            var chars, randomstring, i;
            if (!holder) {
                throw new Error("cannot create a random attribute name for an undefined object");
            }
            chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            randomstring = "";
            do {
                randomstring = "";
                for (i = 0; i < 12; i++) {
                    randomstring += chars[Math.floor(Math.random() * chars.length)];
                }
            } while (holder[randomstring]);
            return randomstring;
        }

        //helper function to map named to numbered entities
        function createNamedToNumberedLookup(items, radix) {
            var i, entity, lookup = {}, base10;
            items = items.split(',');
            radix = radix || 10;
            // Map from named to numbered entities.
            for (i = 0; i < items.length; i += 2) {
                entity = '&' + items[i + 1] + ';';
                base10 = parseInt(items[i], radix);
                lookup[entity] = '&#'+base10+';';
            }
            //FF and IE need to create a regex from hex values ie &nbsp; == \xa0
            lookup["\\xa0"] = '&#160;';
            return lookup;
        }

        //helper function to map canvas-textAlign to svg-textAnchor
        function getTextAnchor(textAlign) {
            //TODO: support rtl languages
            var mapping = {"left":"start", "right":"end", "center":"middle", "start":"start", "end":"end"};
            return mapping[textAlign] || mapping.start;
        }

        //helper function to map canvas-textBaseline to svg-dominantBaseline
        function getDominantBaseline(textBaseline) {
            //INFO: not supported in all browsers
            var mapping = {"alphabetic": "alphabetic", "hanging": "hanging", "top":"text-before-edge", "bottom":"text-after-edge", "middle":"central"};
            return mapping[textBaseline] || mapping.alphabetic;
        }

        // Unpack entities lookup where the numbers are in radix 32 to reduce the size
        // entity mapping courtesy of tinymce
        namedEntities = createNamedToNumberedLookup(
            '50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy,' +
                '5a,ordf,5b,laquo,5c,not,5d,shy,5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute,' +
                '5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm,5r,raquo,5s,frac14,5t,frac12,5u,frac34,' +
                '5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig,67,Ccedil,' +
                '68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde,' +
                '6i,Ograve,6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute,' +
                '6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN,6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml,' +
                '75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc,7b,euml,7c,igrave,7d,iacute,7e,icirc,' +
                '7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml,7n,divide,7o,oslash,' +
                '7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta,' +
                'sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu,' +
                'st,Nu,su,Xi,sv,Omicron,t0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi,' +
                't9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta,tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota,' +
                'tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho,u2,sigmaf,u3,sigma,u4,tau,' +
                'u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull,816,hellip,' +
                '81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym,' +
                '8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr,' +
                '8ek,hArr,8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod,' +
                '8gh,sum,8gi,minus,8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup,' +
                '8hb,int,8hk,there4,8hs,sim,8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4,' +
                'nsub,8k6,sube,8k7,supe,8kl,oplus,8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob,' +
                'rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades,9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0,' +
                'Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp,803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm,' +
                '80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo,80s,ldquo,80t,rdquo,80u,bdquo,810,dagger,' +
                '811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro', 32);


        //Some basic mappings for attributes and default values.
        STYLES = {
            "strokeStyle":{
                svgAttr : "stroke", //corresponding svg attribute
                canvas : "#000000", //canvas default
                svg : "none",       //svg default
                apply : "stroke"    //apply on stroke() or fill()
            },
            "fillStyle":{
                svgAttr : "fill",
                canvas : "#000000",
                svg : null, //svg default is black, but we need to special case this to handle canvas stroke without fill
                apply : "fill"
            },
            "lineCap":{
                svgAttr : "stroke-linecap",
                canvas : "butt",
                svg : "butt",
                apply : "stroke"
            },
            "lineJoin":{
                svgAttr : "stroke-linejoin",
                canvas : "miter",
                svg : "miter",
                apply : "stroke"
            },
            "miterLimit":{
                svgAttr : "stroke-miterlimit",
                canvas : 10,
                svg : 4,
                apply : "stroke"
            },
            "lineWidth":{
                svgAttr : "stroke-width",
                canvas : 1,
                svg : 1,
                apply : "stroke"
            },
            "globalAlpha": {
                svgAttr : "opacity",
                canvas : 1,
                svg : 1,
                apply :  "fill stroke"
            },
            "font":{
                //font converts to multiple svg attributes, there is custom logic for this
                canvas : "10px sans-serif"
            },
            "shadowColor":{
                canvas : "#000000"
            },
            "shadowOffsetX":{
                canvas : 0
            },
            "shadowOffsetY":{
                canvas : 0
            },
            "shadowBlur":{
                canvas : 0
            },
            "textAlign":{
                canvas : "start"
            },
            "textBaseline":{
                canvas : "alphabetic"
            },
            "lineDash" : {
                svgAttr : "stroke-dasharray",
                canvas : [],
                svg : null,
                apply : "stroke"
            }
        };

        /**
         *
         * @param gradientNode - reference to the gradient
         * @constructor
         */
        CanvasGradient = function (gradientNode, ctx) {
            this.__root = gradientNode;
            this.__ctx = ctx;
        };

        /**
         * Adds a color stop to the gradient root
         */
        CanvasGradient.prototype.addColorStop = function (offset, color) {
            var stop = this.__ctx.__createElement("stop"), regex, matches;
            stop.setAttribute("offset", offset);
            if (color.indexOf("rgba") !== -1) {
                //separate alpha value, since webkit can't handle it
                regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d?\.?\d*)\s*\)/gi;
                matches = regex.exec(color);
                stop.setAttribute("stop-color", format("rgb({r},{g},{b})", {r:matches[1], g:matches[2], b:matches[3]}));
                stop.setAttribute("stop-opacity", matches[4]);
            } else {
                stop.setAttribute("stop-color", color);
            }
            this.__root.appendChild(stop);
        };

        CanvasPattern = function (pattern, ctx) {
            this.__root = pattern;
            this.__ctx = ctx;
        };

        /**
         * The mock canvas context
         * @param o - options include:
         * ctx - existing Context2D to wrap around
         * width - width of your canvas (defaults to 500)
         * height - height of your canvas (defaults to 500)
         * enableMirroring - enables canvas mirroring (get image data) (defaults to false)
         * document - the document object (defaults to the current document)
         */
        ctx = function (o) {
            var defaultOptions = { width:500, height:500, enableMirroring : false}, options;

            //keep support for this way of calling C2S: new C2S(width,height)
            if (arguments.length > 1) {
                options = defaultOptions;
                options.width = arguments[0];
                options.height = arguments[1];
            } else if ( !o ) {
                options = defaultOptions;
            } else {
                options = o;
            }

            if (!(this instanceof ctx)) {
                //did someone call this without new?
                return new ctx(options);
            }

            //setup options
            this.width = options.width || defaultOptions.width;
            this.height = options.height || defaultOptions.height;
            this.enableMirroring = options.enableMirroring !== undefined ? options.enableMirroring : defaultOptions.enableMirroring;

            this.canvas = this;   ///point back to this instance!
            this.__document = options.document || document;

            // allow passing in an existing context to wrap around
            // if a context is passed in, we know a canvas already exist
            if (options.ctx) {
                this.__ctx = options.ctx;
            } else {
                this.__canvas = this.__document.createElement("canvas");
                this.__ctx = this.__canvas.getContext("2d");
            }

            this.__setDefaultStyles();
            this.__stack = [this.__getStyleState()];
            this.__groupStack = [];

            //the root svg element
            this.__root = this.__document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.__root.setAttribute("version", 1.1);
            this.__root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            this.__root.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            this.__root.setAttribute("width", this.width);
            this.__root.setAttribute("height", this.height);

            //make sure we don't generate the same ids in defs
            this.__ids = {};

            //defs tag
            this.__defs = this.__document.createElementNS("http://www.w3.org/2000/svg", "defs");
            this.__root.appendChild(this.__defs);

            //also add a group child. the svg element can't use the transform attribute
            this.__currentElement = this.__document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.__root.appendChild(this.__currentElement);

            // init transformation matrix
            this.resetTransform();
        };


        /**
         * Creates the specified svg element
         * @private
         */
        ctx.prototype.__createElement = function (elementName, properties, resetFill) {
            if (typeof properties === "undefined") {
                properties = {};
            }

            var element = this.__document.createElementNS("http://www.w3.org/2000/svg", elementName),
                keys = Object.keys(properties), i, key;
            if (resetFill) {
                //if fill or stroke is not specified, the svg element should not display. By default SVG's fill is black.
                element.setAttribute("fill", "none");
                element.setAttribute("stroke", "none");
            }
            for (i=0; i<keys.length; i++) {
                key = keys[i];
                element.setAttribute(key, properties[key]);
            }
            return element;
        };

        /**
         * Applies default canvas styles to the context
         * @private
         */
        ctx.prototype.__setDefaultStyles = function () {
            //default 2d canvas context properties see:http://www.w3.org/TR/2dcontext/
            var keys = Object.keys(STYLES), i, key;
            for (i=0; i<keys.length; i++) {
                key = keys[i];
                this[key] = STYLES[key].canvas;
            }
        };

        /**
         * Applies styles on restore
         * @param styleState
         * @private
         */
        ctx.prototype.__applyStyleState = function (styleState) {
            var keys = Object.keys(styleState), i, key;
            for (i=0; i<keys.length; i++) {
                key = keys[i];
                this[key] = styleState[key];
            }
        };

        /**
         * Gets the current style state
         * @return {Object}
         * @private
         */
        ctx.prototype.__getStyleState = function () {
            var i, styleState = {}, keys = Object.keys(STYLES), key;
            for (i=0; i<keys.length; i++) {
                key = keys[i];
                styleState[key] = this[key];
            }
            return styleState;
        };

        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
         */
        ctx.prototype.__applyTransformation = function (element, matrix) {
            const {a, b, c, d, e, f} = matrix || this.getTransform();
            element.setAttribute('transform', `matrix(${a} ${b} ${c} ${d} ${e} ${f})`);
        };

        /**
         * Apples the current styles to the current SVG element. On "ctx.fill" or "ctx.stroke"
         * @param type
         * @private
         */
        ctx.prototype.__applyStyleToCurrentElement = function (type) {
        	var currentElement = this.__currentElement;
        	var currentStyleGroup = this.__currentElementsToStyle;
        	if (currentStyleGroup) {
        		currentElement.setAttribute(type, "");
        		currentElement = currentStyleGroup.element;
        		currentStyleGroup.children.forEach(function (node) {
        			node.setAttribute(type, "");
        		});
        	}

            var keys = Object.keys(STYLES), i, style, value, id, regex, matches;
            for (i = 0; i < keys.length; i++) {
                style = STYLES[keys[i]];
                value = this[keys[i]];
                if (style.apply) {
                    //is this a gradient or pattern?
                    if (value instanceof CanvasPattern) {
                        //pattern
                        if (value.__ctx) {
                            //copy over defs
                            while(value.__ctx.__defs.childNodes.length) {
                                id = value.__ctx.__defs.childNodes[0].getAttribute("id");
                                this.__ids[id] = id;
                                this.__defs.appendChild(value.__ctx.__defs.childNodes[0]);
                            }
                        }
                        currentElement.setAttribute(style.apply, format("url(#{id})", {id:value.__root.getAttribute("id")}));
                    }
                    else if (value instanceof CanvasGradient) {
                        //gradient
                        currentElement.setAttribute(style.apply, format("url(#{id})", {id:value.__root.getAttribute("id")}));
                    } else if (style.apply.indexOf(type)!==-1 && style.svg !== value) {
                        if ((style.svgAttr === "stroke" || style.svgAttr === "fill") && value.indexOf("rgba") !== -1) {
                            //separate alpha value, since illustrator can't handle it
                            regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d?\.?\d*)\s*\)/gi;
                            matches = regex.exec(value);
                            currentElement.setAttribute(style.svgAttr, format("rgb({r},{g},{b})", {r:matches[1], g:matches[2], b:matches[3]}));
                            //should take globalAlpha here
                            var opacity = matches[4];
                            var globalAlpha = this.globalAlpha;
                            if (globalAlpha != null) {
                                opacity *= globalAlpha;
                            }
                            currentElement.setAttribute(style.svgAttr+"-opacity", opacity);
                        } else {
                            var attr = style.svgAttr;
                            if (keys[i] === 'globalAlpha') {
                                attr = type+'-'+style.svgAttr;
                                if (currentElement.getAttribute(attr)) {
                                     //fill-opacity or stroke-opacity has already been set by stroke or fill.
                                    continue;
                                }
                            }
                            //otherwise only update attribute if right type, and not svg default
                            currentElement.setAttribute(attr, value);
                        }
                    }
                }
            }
        };

        /**
         * Will return the closest group or svg node. May return the current element.
         * @private
         */
        ctx.prototype.__closestGroupOrSvg = function (node) {
            node = node || this.__currentElement;
            if (node.nodeName === "g" || node.nodeName === "svg") {
                return node;
            } else {
                return this.__closestGroupOrSvg(node.parentNode);
            }
        };

        /**
         * Returns the serialized value of the svg so far
         * @param fixNamedEntities - Standalone SVG doesn't support named entities, which document.createTextNode encodes.
         *                           If true, we attempt to find all named entities and encode it as a numeric entity.
         * @return serialized svg
         */
        ctx.prototype.getSerializedSvg = function (fixNamedEntities) {
            var serialized = new XMLSerializer().serializeToString(this.__root),
                keys, i, key, value, regexp, xmlns;

            //IE search for a duplicate xmnls because they didn't implement setAttributeNS correctly
            xmlns = /xmlns="http:\/\/www\.w3\.org\/2000\/svg".+xmlns="http:\/\/www\.w3\.org\/2000\/svg/gi;
            if (xmlns.test(serialized)) {
                serialized = serialized.replace('xmlns="http://www.w3.org/2000/svg','xmlns:xlink="http://www.w3.org/1999/xlink');
            }

            if (fixNamedEntities) {
                keys = Object.keys(namedEntities);
                //loop over each named entity and replace with the proper equivalent.
                for (i=0; i<keys.length; i++) {
                    key = keys[i];
                    value = namedEntities[key];
                    regexp = new RegExp(key, "gi");
                    if (regexp.test(serialized)) {
                        serialized = serialized.replace(regexp, value);
                    }
                }
            }

            return serialized;
        };


        /**
         * Returns the root svg
         * @return
         */
        ctx.prototype.getSvg = function () {
            return this.__root;
        };

        /**
         * Will generate a group tag.
         */
        ctx.prototype.save = function () {
            var group = this.__createElement("g");
            var parent = this.__closestGroupOrSvg();
            this.__groupStack.push(parent);
            parent.appendChild(group);
            this.__currentElement = group;
            this.__stack.push(this.__getStyleState());
        };

        /**
         * Sets current element to parent, or just root if already root
         */
        ctx.prototype.restore = function () {
            this.__currentElement = this.__groupStack.pop();
            this.__currentElementsToStyle = null;
            //Clearing canvas will make the poped group invalid, currentElement is set to the root group node.
            if (!this.__currentElement) {
                this.__currentElement = this.__root.childNodes[1];
            }
            var state = this.__stack.pop();
            this.__applyStyleState(state);
        };

        /**
         * Create a new Path Element
         */
        ctx.prototype.beginPath = function () {
            var path, parent;

            // Note that there is only one current default path, it is not part of the drawing state.
            // See also: https://html.spec.whatwg.org/multipage/scripting.html#current-default-path
            this.__currentDefaultPath = "";
            this.__currentPosition = {};

            path = this.__createElement("path", {}, true);
            parent = this.__closestGroupOrSvg();
            parent.appendChild(path);
            this.__currentElement = path;
        };

        /**
         * Helper function to apply currentDefaultPath to current path element
         * @private
         */
        ctx.prototype.__applyCurrentDefaultPath = function () {
        	var currentElement = this.__currentElement;
            if (currentElement.nodeName === "path") {
    			currentElement.setAttribute("d", this.__currentDefaultPath);
            } else {
    			console.error("Attempted to apply path command to node", currentElement.nodeName);
            }
        };

        /**
         * Helper function to add path command
         * @private
         */
        ctx.prototype.__addPathCommand = function (command) {
            this.__currentDefaultPath += " ";
            this.__currentDefaultPath += command;
        };

        /**
         * Adds the move command to the current path element,
         * if the currentPathElement is not empty create a new path element
         */
        ctx.prototype.moveTo = function (x,y) {
            if (this.__currentElement.nodeName !== "path") {
                this.beginPath();
            }

            // creates a new subpath with the given point
            this.__currentPosition = {x: x, y: y};
            this.__addPathCommand(format("M {x} {y}", {
                x: this.__matrixTransform(x, y).x, 
                y: this.__matrixTransform(x, y).y
            }));
        };

        /**
         * Closes the current path
         */
        ctx.prototype.closePath = function () {
            if (this.__currentDefaultPath) {
                this.__addPathCommand("Z");
            }
        };

        /**
         * Adds a line to command
         */
        ctx.prototype.lineTo = function (x, y) {
            this.__currentPosition = {x: x, y: y};
            if (this.__currentDefaultPath.indexOf('M') > -1) {
                this.__addPathCommand(format("L {x} {y}", {
                    x: this.__matrixTransform(x, y).x, 
                    y: this.__matrixTransform(x, y).y
                }));
            } else {
                this.__addPathCommand(format("M {x} {y}", {
                    x: this.__matrixTransform(x, y).x, 
                    y: this.__matrixTransform(x, y).y
                }));
            }
        };

        /**
         * Add a bezier command
         */
        ctx.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
            this.__currentPosition = {x: x, y: y};
            this.__addPathCommand(format("C {cp1x} {cp1y} {cp2x} {cp2y} {x} {y}",
                {
                    cp1x: this.__matrixTransform(cp1x, cp1y).x,
                    cp1y: this.__matrixTransform(cp1x, cp1y).y,
                    cp2x: this.__matrixTransform(cp2x, cp2y).x,
                    cp2y: this.__matrixTransform(cp2x, cp2y).y,
                    x: this.__matrixTransform(x, y).x, 
                    y: this.__matrixTransform(x, y).y
                }));
        };

        /**
         * Adds a quadratic curve to command
         */
        ctx.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
            this.__currentPosition = {x: x, y: y};
            this.__addPathCommand(format("Q {cpx} {cpy} {x} {y}", {
                cpx: this.__matrixTransform(cpx, cpy).x, 
                cpy: this.__matrixTransform(cpx, cpy).y,
                x: this.__matrixTransform(x, y).x, 
                y: this.__matrixTransform(x, y).y
            }));
        };


        /**
         * Return a new normalized vector of given vector
         */
        var normalize = function (vector) {
            var len = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
            return [vector[0] / len, vector[1] / len];
        };

        /**
         * Adds the arcTo to the current path
         *
         * @see http://www.w3.org/TR/2015/WD-2dcontext-20150514/#dom-context-2d-arcto
         */
        ctx.prototype.arcTo = function (x1, y1, x2, y2, radius) {
            // Let the point (x0, y0) be the last point in the subpath.
            var x0 = this.__currentPosition && this.__currentPosition.x;
            var y0 = this.__currentPosition && this.__currentPosition.y;

            // First ensure there is a subpath for (x1, y1).
            if (typeof x0 == "undefined" || typeof y0 == "undefined") {
                return;
            }

            // Negative values for radius must cause the implementation to throw an IndexSizeError exception.
            if (radius < 0) {
                throw new Error("IndexSizeError: The radius provided (" + radius + ") is negative.");
            }

            // If the point (x0, y0) is equal to the point (x1, y1),
            // or if the point (x1, y1) is equal to the point (x2, y2),
            // or if the radius radius is zero,
            // then the method must add the point (x1, y1) to the subpath,
            // and connect that point to the previous point (x0, y0) by a straight line.
            if (((x0 === x1) && (y0 === y1))
                || ((x1 === x2) && (y1 === y2))
                || (radius === 0)) {
                this.lineTo(x1, y1);
                return;
            }

            // Otherwise, if the points (x0, y0), (x1, y1), and (x2, y2) all lie on a single straight line,
            // then the method must add the point (x1, y1) to the subpath,
            // and connect that point to the previous point (x0, y0) by a straight line.
            var unit_vec_p1_p0 = normalize([x0 - x1, y0 - y1]);
            var unit_vec_p1_p2 = normalize([x2 - x1, y2 - y1]);
            if (unit_vec_p1_p0[0] * unit_vec_p1_p2[1] === unit_vec_p1_p0[1] * unit_vec_p1_p2[0]) {
                this.lineTo(x1, y1);
                return;
            }

            // Otherwise, let The Arc be the shortest arc given by circumference of the circle that has radius radius,
            // and that has one point tangent to the half-infinite line that crosses the point (x0, y0) and ends at the point (x1, y1),
            // and that has a different point tangent to the half-infinite line that ends at the point (x1, y1), and crosses the point (x2, y2).
            // The points at which this circle touches these two lines are called the start and end tangent points respectively.

            // note that both vectors are unit vectors, so the length is 1
            var cos = (unit_vec_p1_p0[0] * unit_vec_p1_p2[0] + unit_vec_p1_p0[1] * unit_vec_p1_p2[1]);
            var theta = Math.acos(Math.abs(cos));

            // Calculate origin
            var unit_vec_p1_origin = normalize([
                unit_vec_p1_p0[0] + unit_vec_p1_p2[0],
                unit_vec_p1_p0[1] + unit_vec_p1_p2[1]
            ]);
            var len_p1_origin = radius / Math.sin(theta / 2);
            var x = x1 + len_p1_origin * unit_vec_p1_origin[0];
            var y = y1 + len_p1_origin * unit_vec_p1_origin[1];

            // Calculate start angle and end angle
            // rotate 90deg clockwise (note that y axis points to its down)
            var unit_vec_origin_start_tangent = [
                -unit_vec_p1_p0[1],
                unit_vec_p1_p0[0]
            ];
            // rotate 90deg counter clockwise (note that y axis points to its down)
            var unit_vec_origin_end_tangent = [
                unit_vec_p1_p2[1],
                -unit_vec_p1_p2[0]
            ];
            var getAngle = function (vector) {
                // get angle (clockwise) between vector and (1, 0)
                var x = vector[0];
                var y = vector[1];
                if (y >= 0) { // note that y axis points to its down
                    return Math.acos(x);
                } else {
                    return -Math.acos(x);
                }
            };
            var startAngle = getAngle(unit_vec_origin_start_tangent);
            var endAngle = getAngle(unit_vec_origin_end_tangent);

            // Connect the point (x0, y0) to the start tangent point by a straight line
            this.lineTo(x + unit_vec_origin_start_tangent[0] * radius,
                        y + unit_vec_origin_start_tangent[1] * radius);

            // Connect the start tangent point to the end tangent point by arc
            // and adding the end tangent point to the subpath.
            this.arc(x, y, radius, startAngle, endAngle);
        };

        /**
         * Sets the stroke property on the current element
         */
        ctx.prototype.stroke = function () {
            if (this.__currentElement.nodeName === "path") {
                this.__currentElement.setAttribute("paint-order", "fill stroke markers");
            }
            this.__applyCurrentDefaultPath();
            this.__applyStyleToCurrentElement("stroke");
        };

        /**
         * Sets fill properties on the current element
         */
        ctx.prototype.fill = function () {
            if (this.__currentElement.nodeName === "path") {
                this.__currentElement.setAttribute("paint-order", "stroke fill markers");
            }
            this.__applyCurrentDefaultPath();
            this.__applyStyleToCurrentElement("fill");
        };

        /**
         *  Adds a rectangle to the path.
         */
        ctx.prototype.rect = function (x, y, width, height) {
            if (this.__currentElement.nodeName !== "path") {
                this.beginPath();
            }
            this.moveTo(x, y);
            this.lineTo(x+width, y);
            this.lineTo(x+width, y+height);
            this.lineTo(x, y+height);
            this.lineTo(x, y);
            this.closePath();
        };


        /**
         * adds a rectangle element
         */
        ctx.prototype.fillRect = function (x, y, width, height) {
            let {a, b, c, d, e, f} = this.getTransform();
            if (JSON.stringify([a, b, c, d, e, f]) === JSON.stringify([1, 0, 0, 1, 0, 0])) {
                //clear entire canvas
                if (x === 0 && y === 0 && width === this.width && height === this.height) {
                    this.__clearCanvas();
                }
            }
            var rect, parent;
            rect = this.__createElement("rect", {
                x : x,
                y : y,
                width : width,
                height : height
            }, true);
            parent = this.__closestGroupOrSvg();
            parent.appendChild(rect);
            this.__currentElement = rect;
            this.__applyTransformation(rect);
            this.__applyStyleToCurrentElement("fill");
        };

        /**
         * Draws a rectangle with no fill
         * @param x
         * @param y
         * @param width
         * @param height
         */
        ctx.prototype.strokeRect = function (x, y, width, height) {
            var rect, parent;
            rect = this.__createElement("rect", {
                x : x,
                y : y,
                width : width,
                height : height
            }, true);
            parent = this.__closestGroupOrSvg();
            parent.appendChild(rect);
            this.__currentElement = rect;
            this.__applyTransformation(rect);
            this.__applyStyleToCurrentElement("stroke");
        };


        /**
         * Clear entire canvas:
         * 1. save current transforms
         * 2. remove all the childNodes of the root g element
         */
        ctx.prototype.__clearCanvas = function () {
            var rootGroup = this.__root.childNodes[1];
            this.__root.removeChild(rootGroup);
            this.__currentElement = this.__document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.__root.appendChild(this.__currentElement);
            //reset __groupStack as all the child group nodes are all removed.
            this.__groupStack = [];
        };

        /**
         * "Clears" a canvas by just drawing a white rectangle in the current group.
         */
        ctx.prototype.clearRect = function (x, y, width, height) {
            let {a, b, c, d, e, f} = this.getTransform();
            if (JSON.stringify([a, b, c, d, e, f]) === JSON.stringify([1, 0, 0, 1, 0, 0])) {
                //clear entire canvas
                if (x === 0 && y === 0 && width === this.width && height === this.height) {
                    this.__clearCanvas();
                    return;
                }
            }
            var rect, parent = this.__closestGroupOrSvg();
            rect = this.__createElement("rect", {
                x : x,
                y : y,
                width : width,
                height : height,
                fill : "#FFFFFF"
            }, true);
            this.__applyTransformation(rect);
            parent.appendChild(rect);
        };

        /**
         * Adds a linear gradient to a defs tag.
         * Returns a canvas gradient object that has a reference to it's parent def
         */
        ctx.prototype.createLinearGradient = function (x1, y1, x2, y2) {
            var grad = this.__createElement("linearGradient", {
                id : randomString(this.__ids),
                x1 : x1+"px",
                x2 : x2+"px",
                y1 : y1+"px",
                y2 : y2+"px",
                "gradientUnits" : "userSpaceOnUse"
            }, false);
            this.__defs.appendChild(grad);
            return new CanvasGradient(grad, this);
        };

        /**
         * Adds a radial gradient to a defs tag.
         * Returns a canvas gradient object that has a reference to it's parent def
         */
        ctx.prototype.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
            var grad = this.__createElement("radialGradient", {
                id : randomString(this.__ids),
                cx : x1+"px",
                cy : y1+"px",
                r  : r1+"px",
                fx : x0+"px",
                fy : y0+"px",
                "gradientUnits" : "userSpaceOnUse"
            }, false);
            this.__defs.appendChild(grad);
            return new CanvasGradient(grad, this);

        };

        /**
         * Parses the font string and returns svg mapping
         * @private
         */
        ctx.prototype.__parseFont = function () {
            var regex = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\'\"\sa-z0-9]+?)\s*$/i;
            var fontPart = regex.exec( this.font );
            var data = {
                style : fontPart[1] || 'normal',
                size : fontPart[4] || '10px',
                family : fontPart[6] || 'sans-serif',
                weight: fontPart[3] || 'normal',
                decoration : fontPart[2] || 'normal',
                href : null
            };

            //canvas doesn't support underline natively, but we can pass this attribute
            if (this.__fontUnderline === "underline") {
                data.decoration = "underline";
            }

            //canvas also doesn't support linking, but we can pass this as well
            if (this.__fontHref) {
                data.href = this.__fontHref;
            }

            return data;
        };

        /**
         * Helper to link text fragments
         * @param font
         * @param element
         * @return {*}
         * @private
         */
        ctx.prototype.__wrapTextLink = function (font, element) {
            if (font.href) {
                var a = this.__createElement("a");
                a.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", font.href);
                a.appendChild(element);
                return a;
            }
            return element;
        };

        /**
         * Fills or strokes text
         * @param text
         * @param x
         * @param y
         * @param action - stroke or fill
         * @private
         */
        ctx.prototype.__applyText = function (text, x, y, action) {
            var font = this.__parseFont(),
                parent = this.__closestGroupOrSvg(),
                textElement = this.__createElement("text", {
                    "font-family" : font.family,
                    "font-size" : font.size,
                    "font-style" : font.style,
                    "font-weight" : font.weight,
                    "text-decoration" : font.decoration,
                    "x" : x,
                    "y" : y,
                    "text-anchor": getTextAnchor(this.textAlign),
                    "dominant-baseline": getDominantBaseline(this.textBaseline)
                }, true);

            textElement.appendChild(this.__document.createTextNode(text));
            this.__currentElement = textElement;
            this.__applyTransformation(textElement);
            this.__applyStyleToCurrentElement(action);
            parent.appendChild(this.__wrapTextLink(font,textElement));
        };

        /**
         * Creates a text element
         * @param text
         * @param x
         * @param y
         */
        ctx.prototype.fillText = function (text, x, y) {
            this.__applyText(text, x, y, "fill");
        };

        /**
         * Strokes text
         * @param text
         * @param x
         * @param y
         */
        ctx.prototype.strokeText = function (text, x, y) {
            this.__applyText(text, x, y, "stroke");
        };

        /**
         * No need to implement this for svg.
         * @param text
         * @return {TextMetrics}
         */
        ctx.prototype.measureText = function (text) {
            this.__ctx.font = this.font;
            return this.__ctx.measureText(text);
        };

        /**
         *  Arc command!
         */
        ctx.prototype.arc = function (x, y, radius, startAngle, endAngle, counterClockwise) {
            // in canvas no circle is drawn if no angle is provided.
            if (startAngle === endAngle) {
                return;
            }
            startAngle = startAngle % (2*Math.PI);
            endAngle = endAngle % (2*Math.PI);
            if (startAngle === endAngle) {
                //circle time! subtract some of the angle so svg is happy (svg elliptical arc can't draw a full circle)
                endAngle = ((endAngle + (2*Math.PI)) - 0.001 * (counterClockwise ? -1 : 1)) % (2*Math.PI);
            }
            var endX = x+radius*Math.cos(endAngle),
                endY = y+radius*Math.sin(endAngle),
                startX = x+radius*Math.cos(startAngle),
                startY = y+radius*Math.sin(startAngle),
                sweepFlag = counterClockwise ? 0 : 1,
                largeArcFlag = 0,
                diff = endAngle - startAngle;

            // https://github.com/gliffy/canvas2svg/issues/4
            if (diff < 0) {
                diff += 2*Math.PI;
            }

            if (counterClockwise) {
                largeArcFlag = diff > Math.PI ? 0 : 1;
            } else {
                largeArcFlag = diff > Math.PI ? 1 : 0;
            }

            this.lineTo(startX, startY);
            this.__addPathCommand(format("A {rx} {ry} {xAxisRotation} {largeArcFlag} {sweepFlag} {endX} {endY}",
                {
                    rx:radius,
                    ry:radius,
                    xAxisRotation:0,
                    largeArcFlag:largeArcFlag,
                    sweepFlag:sweepFlag,
                    endX: this.__matrixTransform(endX, endY).x, 
                    endY: this.__matrixTransform(endX, endY).y
                }));

            this.__currentPosition = {x: endX, y: endY};
        };

        /**
         * Generates a ClipPath from the clip command.
         */
        ctx.prototype.clip = function () {
            var group = this.__closestGroupOrSvg(),
                clipPath = this.__createElement("clipPath"),
                id =  randomString(this.__ids),
                newGroup = this.__createElement("g");

            this.__applyCurrentDefaultPath();
            group.removeChild(this.__currentElement);
            clipPath.setAttribute("id", id);
            clipPath.appendChild(this.__currentElement);

            this.__defs.appendChild(clipPath);

            //set the clip path to this group
            group.setAttribute("clip-path", format("url(#{id})", {id:id}));

            //clip paths can be scaled and transformed, we need to add another wrapper group to avoid later transformations
            // to this path
            group.appendChild(newGroup);

            this.__currentElement = newGroup;

        };

        /**
         * Draws a canvas, image or mock context to this canvas.
         * Note that all svg dom manipulation uses node.childNodes rather than node.children for IE support.
         * http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-drawimage
         */
        ctx.prototype.drawImage = function () {
            //convert arguments to a real array
            var args = Array.prototype.slice.call(arguments),
                image=args[0],
                dx, dy, dw, dh, sx=0, sy=0, sw, sh, parent, svg, defs, group,
                svgImage, canvas, context, id;

            if (args.length === 3) {
                dx = args[1];
                dy = args[2];
                sw = image.width;
                sh = image.height;
                dw = sw;
                dh = sh;
            } else if (args.length === 5) {
                dx = args[1];
                dy = args[2];
                dw = args[3];
                dh = args[4];
                sw = image.width;
                sh = image.height;
            } else if (args.length === 9) {
                sx = args[1];
                sy = args[2];
                sw = args[3];
                sh = args[4];
                dx = args[5];
                dy = args[6];
                dw = args[7];
                dh = args[8];
            } else {
                throw new Error("Invalid number of arguments passed to drawImage: " + arguments.length);
            }

            parent = this.__closestGroupOrSvg();
            const matrix = this.getTransform().translate(dx, dy);
            if (image instanceof ctx) {
                //canvas2svg mock canvas context. In the future we may want to clone nodes instead.
                //also I'm currently ignoring dw, dh, sw, sh, sx, sy for a mock context.
                svg = image.getSvg().cloneNode(true);
                if (svg.childNodes && svg.childNodes.length > 1) {
                    defs = svg.childNodes[0];
                    while(defs.childNodes.length) {
                        id = defs.childNodes[0].getAttribute("id");
                        this.__ids[id] = id;
                        this.__defs.appendChild(defs.childNodes[0]);
                    }
                    group = svg.childNodes[1];
                    if (group) {
                        this.__applyTransformation(group, matrix);
                        parent.appendChild(group);
                    }
                }
            } else if (image.nodeName === "CANVAS" || image.nodeName === "IMG") {
                //canvas or image
                svgImage = this.__createElement("image");
                svgImage.setAttribute("width", dw);
                svgImage.setAttribute("height", dh);
                svgImage.setAttribute("preserveAspectRatio", "none");

                if (sx || sy || sw !== image.width || sh !== image.height) {
                    //crop the image using a temporary canvas
                    canvas = this.__document.createElement("canvas");
                    canvas.width = dw;
                    canvas.height = dh;
                    context = canvas.getContext("2d");
                    context.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
                    image = canvas;
                }
                this.__applyTransformation(svgImage, matrix);
                svgImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href",
                    image.nodeName === "CANVAS" ? image.toDataURL() : image.getAttribute("src"));
                parent.appendChild(svgImage);
            }
        };

        /**
         * Generates a pattern tag
         */
        ctx.prototype.createPattern = function (image, repetition) {
            var pattern = this.__document.createElementNS("http://www.w3.org/2000/svg", "pattern"), id = randomString(this.__ids),
                img;
            pattern.setAttribute("id", id);
            pattern.setAttribute("width", image.width);
            pattern.setAttribute("height", image.height);
            if (image.nodeName === "CANVAS" || image.nodeName === "IMG") {
                img = this.__document.createElementNS("http://www.w3.org/2000/svg", "image");
                img.setAttribute("width", image.width);
                img.setAttribute("height", image.height);
                img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href",
                    image.nodeName === "CANVAS" ? image.toDataURL() : image.getAttribute("src"));
                pattern.appendChild(img);
                this.__defs.appendChild(pattern);
            } else if (image instanceof ctx) {
                pattern.appendChild(image.__root.childNodes[1]);
                this.__defs.appendChild(pattern);
            }
            return new CanvasPattern(pattern, this);
        };

        ctx.prototype.setLineDash = function (dashArray) {
            if (dashArray && dashArray.length > 0) {
                this.lineDash = dashArray.join(",");
            } else {
                this.lineDash = null;
            }
        };

        /**
         * SetTransform changes the current transformation matrix to 
         * the matrix given by the arguments as described below.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
         */
        ctx.prototype.setTransform = function (a, b, c, d, e, f) {
            if (a instanceof DOMMatrix) {
                this.__transformMatrix = new DOMMatrix([a.a, a.b, a.c, a.d, a.e, a.f]);
            } else {
                this.__transformMatrix = new DOMMatrix([a, b, c, d, e, f]);
            }
        };

        /**
         * GetTransform Returns a copy of the current transformation matrix,
         * as a newly created DOMMAtrix Object
         * 
         * @returns A DOMMatrix Object
         */
        ctx.prototype.getTransform = function () {
            let {a, b, c, d, e, f} = this.__transformMatrix;
            return new DOMMatrix([a, b, c, d, e, f]);
        };

        /**
         * ResetTransform resets the current transformation matrix to the identity matrix
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/resetTransform
         */
        ctx.prototype.resetTransform = function () {
            this.setTransform(1, 0, 0, 1, 0, 0);
        };

        /**
         * Add the scaling transformation described by the arguments to the current transformation matrix. 
         * 
         * @param x The x argument represents the scale factor in the horizontal direction 
         * @param y The y argument represents the scale factor in the vertical direction.
         * @see https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-scale
         */
        ctx.prototype.scale = function (x, y) {        
            if (y === undefined) {
                y = x;
            }
            // If either of the arguments are infinite or NaN, then return.
            if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
                return
            }
            let matrix = this.getTransform().scale(x, y);
            this.setTransform(matrix);
        };

        /**
         * Rotate adds a rotation to the transformation matrix.
         * 
         * @param angle The rotation angle, clockwise in radians. You can use degree * Math.PI / 180 to calculate a radian from a degree.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate
         * @see https://www.w3.org/TR/css-transforms-1
         */
        ctx.prototype.rotate = function (angle) {
            let matrix = this.getTransform().multiply(new DOMMatrix([
                Math.cos(angle),
                Math.sin(angle),
                -Math.sin(angle),
                Math.cos(angle),
                0,
                0
            ]));
            this.setTransform(matrix);
        };

        /**
         * Translate adds a translation transformation to the current matrix.
         * 
         * @param x Distance to move in the horizontal direction. Positive values are to the right, and negative to the left.
         * @param y Distance to move in the vertical direction. Positive values are down, and negative are up.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/translate
         */
        ctx.prototype.translate = function (x, y) {
            const matrix = this.getTransform().translate(x, y);
            this.setTransform(matrix);
        };

        /**
         * Transform multiplies the current transformation with the matrix described by the arguments of this method. 
         * This lets you scale, rotate, translate (move), and skew the context.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/transform
         */
        ctx.prototype.transform = function (a, b, c, d, e, f) {
            const matrix = this.getTransform().multiply(new DOMMatrix([a, b, c, d, e, f]));
            this.setTransform(matrix);
        };

        ctx.prototype.__matrixTransform = function(x, y) {
            return new DOMPoint(x, y).matrixTransform(this.__transformMatrix)
        };

        /**
         * Not yet implemented
         */
        ctx.prototype.drawFocusRing = function () {};
        ctx.prototype.createImageData = function () {};
        ctx.prototype.getImageData = function () {};
        ctx.prototype.putImageData = function () {};
        ctx.prototype.globalCompositeOperation = function () {};

        return ctx;
    }());

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

    function arc(ctx) {

        // Draw shapes
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                var x = 25 + j * 50;               // x coordinate
                var y = 25 + i * 50;               // y coordinate
                var radius = 20;                    // Arc radius
                var startAngle = 0;                     // Starting point on circle
                var endAngle = Math.PI + (Math.PI * j) / 2; // End point on circle
                var clockwise = i % 2 == 0 ? false : true; // clockwise or anticlockwise

                ctx.arc(x, y, radius, startAngle, endAngle, clockwise);

                if (i > 1) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
            }
        }
        
    }

    function arcTo$1(ctx) {
        ctx.beginPath();
        ctx.moveTo(150, 20);
        ctx.arcTo(150, 100, 50, 20, 30);
        ctx.stroke();

        ctx.fillStyle = 'blue';
        // base point
        ctx.fillRect(150, 20, 10, 10);

        ctx.fillStyle = 'red';
        // control point one
        ctx.fillRect(150, 100, 10, 10);
        // control point two
        ctx.fillRect(50, 20, 10, 10);
    }

    function arcTo(ctx) {
        ctx.beginPath();
        ctx.moveTo(100, 225);             // P0
        ctx.arcTo(300, 25, 500, 225, 75); // P1, P2 and the radius
        ctx.lineTo(500, 225);             // P2
        ctx.stroke();
    }

    function emptyArc(ctx) {

        // Draw shapes
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(100, 100, 100, Math.PI, Math.PI);
                ctx.fill();
            }
        }
        
    }

    function fillStyle(ctx) {
        for (var i = 0; i < 6; i++) {
            for (var j = 0; j < 6; j++) {
                ctx.fillStyle = 'rgb(' + Math.floor(255 - 42.5 * i) + ',' +
                    Math.floor(255 - 42.5 * j) + ',0)';
                ctx.fillRect(j * 25, i * 25, 25, 25);
            }
        }
    }

    function globalAlpha(ctx) {
        ctx.fillStyle = '#FD0';
        ctx.fillRect(0,0,75,75);
        ctx.fillStyle = '#6C0';
        ctx.fillRect(75,0,75,75);
        ctx.fillStyle = '#09F';
        ctx.fillRect(0,75,75,75);
        ctx.fillStyle = '#F30';
        ctx.fillRect(75,75,75,75);
        ctx.fillStyle = '#FFF';

        // set transparency value
        ctx.globalAlpha = 0.2;

        // Draw semi transparent circles
        for (let i=0;i<7;i++){
            ctx.beginPath();
            ctx.arc(75,75,10+10*i,0,Math.PI*2,true);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;
    }

    function gradient(ctx) {
        ctx.save();
        ctx.strokeStyle='rgba(0,0,0,0)';
        ctx.lineCap='butt';
        ctx.lineJoin='miter';
        ctx.miterLimit=10.0;
        ctx.font='10px sans-serif';
        ctx.save();
        var radialGradient_1389130830351 = ctx.createRadialGradient(6E1,6E1,0.0,6E1,6E1,5E1);
        radialGradient_1389130830351.addColorStop(0E0,'red');
        radialGradient_1389130830351.addColorStop(1E0,'blue');
        ctx.fillStyle=radialGradient_1389130830351;
        ctx.font='10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.5E1,1E1);
        ctx.lineTo(9.5E1,1E1);
        ctx.quadraticCurveTo(1.1E2,1E1,1.1E2,2.5E1);
        ctx.lineTo(1.1E2,9.5E1);
        ctx.quadraticCurveTo(1.1E2,1.1E2,9.5E1,1.1E2);
        ctx.lineTo(2.5E1,1.1E2);
        ctx.quadraticCurveTo(1E1,1.1E2,1E1,9.5E1);
        ctx.lineTo(1E1,2.5E1);
        ctx.quadraticCurveTo(1E1,1E1,2.5E1,1E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.save();
        var radialGradient_1389130830351 = ctx.createRadialGradient(3.5E1,1.45E2,0.0,3.5E1,1.45E2,2.5E1);
        radialGradient_1389130830351.addColorStop(0E0,'red');
        radialGradient_1389130830351.addColorStop(1E0,'blue');
        ctx.fillStyle=radialGradient_1389130830351;
        ctx.font='10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.5E1,1.2E2);
        ctx.lineTo(9.5E1,1.2E2);
        ctx.quadraticCurveTo(1.1E2,1.2E2,1.1E2,1.35E2);
        ctx.lineTo(1.1E2,2.05E2);
        ctx.quadraticCurveTo(1.1E2,2.2E2,9.5E1,2.2E2);
        ctx.lineTo(2.5E1,2.2E2);
        ctx.quadraticCurveTo(1E1,2.2E2,1E1,2.05E2);
        ctx.lineTo(1E1,1.35E2);
        ctx.quadraticCurveTo(1E1,1.2E2,2.5E1,1.2E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
    }

    function linecap(ctx) {
        var lineCap = ['butt','round','square'];

        // Draw guides
        ctx.strokeStyle = '#09f';
        ctx.beginPath();
        ctx.moveTo(10,10);
        ctx.lineTo(140,10);
        ctx.moveTo(10,140);
        ctx.lineTo(140,140);
        ctx.stroke();

        // Draw lines
        ctx.strokeStyle = 'black';
        for (let i=0;i<lineCap.length;i++){
            ctx.lineWidth = 15;
            ctx.lineCap = lineCap[i];
            ctx.beginPath();
            ctx.moveTo(25+i*50,10);
            ctx.lineTo(25+i*50,140);
            ctx.stroke();
        }
    }

    function linewidth(ctx) {
        for (var i = 0; i < 10; i++){
            ctx.lineWidth = 1+i;
            ctx.beginPath();
            ctx.moveTo(5+i*14,5);
            ctx.lineTo(5+i*14,140);
            ctx.stroke();
        }
    }

    function rgba(ctx) {
        // Draw background
        ctx.fillStyle = 'rgb(255,221,0)';
        ctx.fillRect(0,0,150,37.5);
        ctx.fillStyle = 'rgb(102,204,0)';
        ctx.fillRect(0,37.5,150,37.5);
        ctx.fillStyle = 'rgb(0,153,255)';
        ctx.fillRect(0,75,150,37.5);
        ctx.fillStyle = 'rgb(255,51,0)';
        ctx.fillRect(0,112.5,150,37.5);

        // Draw semi transparent rectangles
        for (var i=0;i<10;i++){
            ctx.fillStyle = 'rgba(255,255,255,'+(i+1)/10+')';
            for (var j=0;j<4;j++){
                ctx.fillRect(5+i*14,5+j*37.5,14,27.5);
            }
        }
    }

    // Example from https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate
    function rotate(ctx) {
        ctx.fillStyle = 'gray';
        ctx.fillRect(80, 60, 140, 30);

        // Matrix transformation
        ctx.translate(150, 75);
        ctx.rotate(Math.PI / 2);
        ctx.translate(-150, -75);

        // Rotated rectangle
        ctx.fillStyle = 'red';
        ctx.fillRect(80, 60, 140, 30);

        ctx.resetTransform();
    }

    function saveAndRestore(ctx) {
        ctx.fillRect(0, 0, 150, 150);   // Draw a rectangle with default settings
        ctx.save();                  // Save the default state

        ctx.fillStyle = '#09F';      // Make changes to the settings
        ctx.fillRect(15, 15, 120, 120); // Draw a rectangle with new settings

        ctx.save();                  // Save the current state
        ctx.fillStyle = '#FFF';      // Make changes to the settings
        ctx.globalAlpha = 0.5;
        ctx.fillRect(30, 30, 90, 90);   // Draw a rectangle with new settings

        ctx.restore();               // Restore previous state
        ctx.fillRect(45, 45, 60, 60);   // Draw a rectangle with restored settings

        ctx.restore();               // Restore original state
        ctx.fillRect(60, 60, 30, 30);   // Draw a rectangle with restored settings
    }

    function setLineDash(ctx) {
        ctx.save();
        ctx.lineWidth = 4;
        for (var i = 0; i < 10; i++){
            ctx.setLineDash([(i+1)*5,10]);
            ctx.beginPath();
            ctx.moveTo(5+i*14,5);
            ctx.lineTo(5+i*14,140);
            ctx.stroke();
        }
        ctx.restore();
    }

    function text(ctx) {
        ctx.font = "normal 36px Times";
        ctx.fillStyle = "#000000";
        ctx.fillText("A Text Example", 50, 50);
        ctx.font = "normal 36px Arial";
        ctx.strokeStyle = "#000000";
        ctx.strokeText("A Text Example", 50, 90);
    }

    function tiger(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0)';
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 10.0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.font = '10px sans-serif';
        ctx.translate(2E2, 2E2);
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.22304E2), 8.4285E1);
        ctx.bezierCurveTo((-1.22304E2), 8.4285E1, (-1.22203E2), 8.6179E1, (-1.23027E2), 8.616E1);
        ctx.bezierCurveTo((-1.23851E2), 8.6141E1, (-1.40305E2), 3.8066E1, (-1.60833E2), 4.0309E1);
        ctx.bezierCurveTo((-1.60833E2), 4.0309E1, (-1.4305E2), 3.2956E1, (-1.22304E2), 8.4285E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.18774E2), 8.1262E1);
        ctx.bezierCurveTo((-1.18774E2), 8.1262E1, (-1.19323E2), 8.3078E1, (-1.20092E2), 8.2779E1);
        ctx.bezierCurveTo((-1.2086E2), 8.2481E1, (-1.19977E2), 3.1675E1, (-1.40043E2), 2.6801E1);
        ctx.bezierCurveTo((-1.40043E2), 2.6801E1, (-1.2082E2), 2.5937E1, (-1.18774E2), 8.1262E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.1284E1), 1.2359E2);
        ctx.bezierCurveTo((-9.1284E1), 1.2359E2, (-8.9648E1), 1.2455E2, (-9.0118E1), 1.25227E2);
        ctx.bezierCurveTo((-9.0589E1), 1.25904E2, (-1.39763E2), 1.13102E2, (-1.49218E2), 1.31459E2);
        ctx.bezierCurveTo((-1.49218E2), 1.31459E2, (-1.45539E2), 1.12572E2, (-9.1284E1), 1.2359E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.4093E1), 1.33801E2);
        ctx.bezierCurveTo((-9.4093E1), 1.33801E2, (-9.2237E1), 1.34197E2, (-9.2471E1), 1.34988E2);
        ctx.bezierCurveTo((-9.2704E1), 1.35779E2, (-1.43407E2), 1.39121E2, (-1.46597E2), 1.59522E2);
        ctx.bezierCurveTo((-1.46597E2), 1.59522E2, (-1.49055E2), 1.40437E2, (-9.4093E1), 1.33801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.8304E1), 1.28276E2);
        ctx.bezierCurveTo((-9.8304E1), 1.28276E2, (-9.6526E1), 1.28939E2, (-9.6872E1), 1.29687E2);
        ctx.bezierCurveTo((-9.7218E1), 1.30435E2, (-1.47866E2), 1.26346E2, (-1.53998E2), 1.46064E2);
        ctx.bezierCurveTo((-1.53998E2), 1.46064E2, (-1.53646E2), 1.26825E2, (-9.8304E1), 1.28276E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.09009E2), 1.10072E2);
        ctx.bezierCurveTo((-1.09009E2), 1.10072E2, (-1.07701E2), 1.11446E2, (-1.0834E2), 1.11967E2);
        ctx.bezierCurveTo((-1.08979E2), 1.12488E2, (-1.52722E2), 8.6634E1, (-1.66869E2), 1.01676E2);
        ctx.bezierCurveTo((-1.66869E2), 1.01676E2, (-1.58128E2), 8.4533E1, (-1.09009E2), 1.10072E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.16554E2), 1.14263E2);
        ctx.bezierCurveTo((-1.16554E2), 1.14263E2, (-1.15098E2), 1.1548E2, (-1.15674E2), 1.16071E2);
        ctx.bezierCurveTo((-1.1625E2), 1.16661E2, (-1.62638E2), 9.5922E1, (-1.74992E2), 1.12469E2);
        ctx.bezierCurveTo((-1.74992E2), 1.12469E2, (-1.68247E2), 9.4447E1, (-1.16554E2), 1.14263E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.19154E2), 1.18335E2);
        ctx.bezierCurveTo((-1.19154E2), 1.18335E2, (-1.17546E2), 1.19343E2, (-1.18036E2), 1.20006E2);
        ctx.bezierCurveTo((-1.18526E2), 1.20669E2, (-1.67308E2), 1.06446E2, (-1.77291E2), 1.24522E2);
        ctx.bezierCurveTo((-1.77291E2), 1.24522E2, (-1.73066E2), 1.05749E2, (-1.19154E2), 1.18335E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.0842E2), 1.18949E2);
        ctx.bezierCurveTo((-1.0842E2), 1.18949E2, (-1.07298E2), 1.2048E2, (-1.07999E2), 1.20915E2);
        ctx.bezierCurveTo((-1.087E2), 1.2135E2, (-1.48769E2), 9.0102E1, (-1.64727E2), 1.03207E2);
        ctx.bezierCurveTo((-1.64727E2), 1.03207E2, (-1.53862E2), 8.7326E1, (-1.0842E2), 1.18949E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.282E2), 9E1);
        ctx.bezierCurveTo((-1.282E2), 9E1, (-1.276E2), 9.18E1, (-1.284E2), 9.2E1);
        ctx.bezierCurveTo((-1.292E2), 9.22E1, (-1.578E2), 5.02E1, (-1.77001E2), 5.78E1);
        ctx.bezierCurveTo((-1.77001E2), 5.78E1, (-1.618E2), 4.6E1, (-1.282E2), 9E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.27505E2), 9.6979E1);
        ctx.bezierCurveTo((-1.27505E2), 9.6979E1, (-1.2653E2), 9.8608E1, (-1.27269E2), 9.8975E1);
        ctx.bezierCurveTo((-1.28007E2), 9.9343E1, (-1.64992E2), 6.4499E1, (-1.82101E2), 7.6061E1);
        ctx.bezierCurveTo((-1.82101E2), 7.6061E1, (-1.69804E2), 6.1261E1, (-1.27505E2), 9.6979E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.72E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.2762E2), 1.01349E2);
        ctx.bezierCurveTo((-1.2762E2), 1.01349E2, (-1.26498E2), 1.0288E2, (-1.27199E2), 1.03315E2);
        ctx.bezierCurveTo((-1.279E2), 1.03749E2, (-1.67969E2), 7.2502E1, (-1.83927E2), 8.5607E1);
        ctx.bezierCurveTo((-1.83927E2), 8.5607E1, (-1.73062E2), 6.9726E1, (-1.2762E2), 1.01349E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.2983E2), 1.03065E2);
        ctx.bezierCurveTo((-1.29327E2), 1.09113E2, (-1.28339E2), 1.15682E2, (-1.266E2), 1.18801E2);
        ctx.bezierCurveTo((-1.266E2), 1.18801E2, (-1.302E2), 1.31201E2, (-1.214E2), 1.44401E2);
        ctx.bezierCurveTo((-1.214E2), 1.44401E2, (-1.218E2), 1.51601E2, (-1.202E2), 1.54801E2);
        ctx.bezierCurveTo((-1.202E2), 1.54801E2, (-1.162E2), 1.63201E2, (-1.114E2), 1.64001E2);
        ctx.bezierCurveTo((-1.07516E2), 1.64648E2, (-9.8793E1), 1.67717E2, (-8.8932E1), 1.69121E2);
        ctx.bezierCurveTo((-8.8932E1), 1.69121E2, (-7.18E1), 1.83201E2, (-7.5E1), 1.96001E2);
        ctx.bezierCurveTo((-7.5E1), 1.96001E2, (-7.54E1), 2.12401E2, (-7.9E1), 2.14001E2);
        ctx.bezierCurveTo((-7.9E1), 2.14001E2, (-6.74E1), 2.02801E2, (-7.7E1), 2.19601E2);
        ctx.lineTo((-8.14E1), 2.38401E2);
        ctx.bezierCurveTo((-8.14E1), 2.38401E2, (-5.58E1), 2.16801E2, (-7.14E1), 2.35201E2);
        ctx.lineTo((-8.14E1), 2.61201E2);
        ctx.bezierCurveTo((-8.14E1), 2.61201E2, (-6.18E1), 2.42801E2, (-6.9E1), 2.51201E2);
        ctx.lineTo((-7.22E1), 2.60001E2);
        ctx.bezierCurveTo((-7.22E1), 2.60001E2, (-2.9E1), 2.32801E2, (-5.98E1), 2.62401E2);
        ctx.bezierCurveTo((-5.98E1), 2.62401E2, (-5.18E1), 2.58801E2, (-4.74E1), 2.61601E2);
        ctx.bezierCurveTo((-4.74E1), 2.61601E2, (-4.06E1), 2.60401E2, (-4.14E1), 2.62001E2);
        ctx.bezierCurveTo((-4.14E1), 2.62001E2, (-6.22E1), 2.72401E2, (-6.58E1), 2.90801E2);
        ctx.bezierCurveTo((-6.58E1), 2.90801E2, (-5.74E1), 2.80801E2, (-6.06E1), 2.91601E2);
        ctx.lineTo((-6.02E1), 3.03201E2);
        ctx.bezierCurveTo((-6.02E1), 3.03201E2, (-5.62E1), 2.81601E2, (-5.66E1), 3.19201E2);
        ctx.bezierCurveTo((-5.66E1), 3.19201E2, (-3.74E1), 3.01201E2, (-4.9E1), 3.22001E2);
        ctx.lineTo((-4.9E1), 3.38801E2);
        ctx.bezierCurveTo((-4.9E1), 3.38801E2, (-3.38E1), 3.22401E2, (-4.02E1), 3.35201E2);
        ctx.bezierCurveTo((-4.02E1), 3.35201E2, (-3.02E1), 3.26401E2, (-3.42E1), 3.41601E2);
        ctx.bezierCurveTo((-3.42E1), 3.41601E2, (-3.5E1), 3.52001E2, (-3.06E1), 3.40801E2);
        ctx.bezierCurveTo((-3.06E1), 3.40801E2, (-1.46E1), 3.10201E2, (-2.06E1), 3.36401E2);
        ctx.bezierCurveTo((-2.06E1), 3.36401E2, (-2.14E1), 3.55601E2, (-1.66E1), 3.40801E2);
        ctx.bezierCurveTo((-1.66E1), 3.40801E2, (-1.62E1), 3.51201E2, (-7E0), 3.58401E2);
        ctx.bezierCurveTo((-7E0), 3.58401E2, (-8.2E0), 3.07601E2, 4.6E0, 3.43601E2);
        ctx.lineTo(8.6E0, 3.60001E2);
        ctx.bezierCurveTo(8.6E0, 3.60001E2, 1.14E1, 3.50801E2, 1.1E1, 3.45601E2);
        ctx.bezierCurveTo(1.1E1, 3.45601E2, 2.58E1, 3.29201E2, 1.9E1, 3.53601E2);
        ctx.bezierCurveTo(1.9E1, 3.53601E2, 3.42E1, 3.30801E2, 3.1E1, 3.44001E2);
        ctx.bezierCurveTo(3.1E1, 3.44001E2, 2.34E1, 3.60001E2, 2.5E1, 3.64801E2);
        ctx.bezierCurveTo(2.5E1, 3.64801E2, 4.18E1, 3.30001E2, 4.3E1, 3.28401E2);
        ctx.bezierCurveTo(4.3E1, 3.28401E2, 4.1E1, 3.70802E2, 5.18E1, 3.34801E2);
        ctx.bezierCurveTo(5.18E1, 3.34801E2, 5.74E1, 3.46801E2, 5.46E1, 3.51201E2);
        ctx.bezierCurveTo(5.46E1, 3.51201E2, 6.26E1, 3.43201E2, 6.18E1, 3.40001E2);
        ctx.bezierCurveTo(6.18E1, 3.40001E2, 6.64E1, 3.31801E2, 6.92E1, 3.45401E2);
        ctx.bezierCurveTo(6.92E1, 3.45401E2, 7.1E1, 3.54801E2, 7.26E1, 3.51601E2);
        ctx.bezierCurveTo(7.26E1, 3.51601E2, 7.66E1, 3.75602E2, 7.78E1, 3.52801E2);
        ctx.bezierCurveTo(7.78E1, 3.52801E2, 7.94E1, 3.39201E2, 7.22E1, 3.27601E2);
        ctx.bezierCurveTo(7.22E1, 3.27601E2, 7.3E1, 3.24401E2, 7.02E1, 3.20401E2);
        ctx.bezierCurveTo(7.02E1, 3.20401E2, 8.38E1, 3.42001E2, 7.66E1, 3.13201E2);
        ctx.bezierCurveTo(7.66E1, 3.13201E2, 8.7801E1, 3.21201E2, 8.9001E1, 3.21201E2);
        ctx.bezierCurveTo(8.9001E1, 3.21201E2, 7.54E1, 2.98001E2, 8.42E1, 3.02801E2);
        ctx.bezierCurveTo(8.42E1, 3.02801E2, 7.9E1, 2.92401E2, 9.7001E1, 3.04401E2);
        ctx.bezierCurveTo(9.7001E1, 3.04401E2, 8.1E1, 2.88401E2, 9.8601E1, 2.98001E2);
        ctx.bezierCurveTo(9.8601E1, 2.98001E2, 1.06601E2, 3.04401E2, 9.9001E1, 2.94401E2);
        ctx.bezierCurveTo(9.9001E1, 2.94401E2, 8.46E1, 2.78401E2, 1.06601E2, 2.96401E2);
        ctx.bezierCurveTo(1.06601E2, 2.96401E2, 1.18201E2, 3.12801E2, 1.19001E2, 3.15601E2);
        ctx.bezierCurveTo(1.19001E2, 3.15601E2, 1.09001E2, 2.86401E2, 1.04601E2, 2.83601E2);
        ctx.bezierCurveTo(1.04601E2, 2.83601E2, 1.13001E2, 2.47201E2, 1.54201E2, 2.62801E2);
        ctx.bezierCurveTo(1.54201E2, 2.62801E2, 1.61001E2, 2.80001E2, 1.65401E2, 2.61601E2);
        ctx.bezierCurveTo(1.65401E2, 2.61601E2, 1.78201E2, 2.55201E2, 1.89401E2, 2.82801E2);
        ctx.bezierCurveTo(1.89401E2, 2.82801E2, 1.93401E2, 2.69201E2, 1.92601E2, 2.66401E2);
        ctx.bezierCurveTo(1.92601E2, 2.66401E2, 1.99401E2, 2.67601E2, 1.98601E2, 2.66401E2);
        ctx.bezierCurveTo(1.98601E2, 2.66401E2, 2.11801E2, 2.70801E2, 2.13001E2, 2.70001E2);
        ctx.bezierCurveTo(2.13001E2, 2.70001E2, 2.19801E2, 2.76801E2, 2.20201E2, 2.73201E2);
        ctx.bezierCurveTo(2.20201E2, 2.73201E2, 2.29401E2, 2.76001E2, 2.27401E2, 2.72401E2);
        ctx.bezierCurveTo(2.27401E2, 2.72401E2, 2.36201E2, 2.88001E2, 2.36601E2, 2.91601E2);
        ctx.lineTo(2.39001E2, 2.77601E2);
        ctx.lineTo(2.41001E2, 2.80401E2);
        ctx.bezierCurveTo(2.41001E2, 2.80401E2, 2.42601E2, 2.72801E2, 2.41801E2, 2.71601E2);
        ctx.bezierCurveTo(2.41001E2, 2.70401E2, 2.61801E2, 2.78401E2, 2.66601E2, 2.99201E2);
        ctx.lineTo(2.68601E2, 3.07601E2);
        ctx.bezierCurveTo(2.68601E2, 3.07601E2, 2.74601E2, 2.92801E2, 2.73001E2, 2.88801E2);
        ctx.bezierCurveTo(2.73001E2, 2.88801E2, 2.78201E2, 2.89601E2, 2.78601E2, 2.94001E2);
        ctx.bezierCurveTo(2.78601E2, 2.94001E2, 2.82601E2, 2.70801E2, 2.77801E2, 2.64801E2);
        ctx.bezierCurveTo(2.77801E2, 2.64801E2, 2.82201E2, 2.64001E2, 2.83401E2, 2.67601E2);
        ctx.lineTo(2.83401E2, 2.60401E2);
        ctx.bezierCurveTo(2.83401E2, 2.60401E2, 2.90601E2, 2.61201E2, 2.90601E2, 2.58801E2);
        ctx.bezierCurveTo(2.90601E2, 2.58801E2, 2.95001E2, 2.54801E2, 2.97001E2, 2.59601E2);
        ctx.bezierCurveTo(2.97001E2, 2.59601E2, 2.84601E2, 2.24401E2, 3.03001E2, 2.43601E2);
        ctx.bezierCurveTo(3.03001E2, 2.43601E2, 3.10201E2, 2.54401E2, 3.06601E2, 2.35601E2);
        ctx.bezierCurveTo(3.03001E2, 2.16801E2, 2.99001E2, 2.15201E2, 3.03801E2, 2.14801E2);
        ctx.bezierCurveTo(3.03801E2, 2.14801E2, 3.04601E2, 2.11201E2, 3.02601E2, 2.09601E2);
        ctx.bezierCurveTo(3.00601E2, 2.08001E2, 3.03801E2, 2.09601E2, 3.03801E2, 2.09601E2);
        ctx.bezierCurveTo(3.03801E2, 2.09601E2, 3.08601E2, 2.13601E2, 3.03401E2, 1.91601E2);
        ctx.bezierCurveTo(3.03401E2, 1.91601E2, 3.09801E2, 1.93201E2, 2.97801E2, 1.64001E2);
        ctx.bezierCurveTo(2.97801E2, 1.64001E2, 3.00601E2, 1.61601E2, 2.96601E2, 1.53201E2);
        ctx.bezierCurveTo(2.96601E2, 1.53201E2, 3.04601E2, 1.57601E2, 3.07401E2, 1.56001E2);
        ctx.bezierCurveTo(3.07401E2, 1.56001E2, 3.07001E2, 1.54401E2, 3.03801E2, 1.50401E2);
        ctx.bezierCurveTo(3.03801E2, 1.50401E2, 2.82201E2, 9.56E1, 3.02601E2, 1.17601E2);
        ctx.bezierCurveTo(3.02601E2, 1.17601E2, 3.14451E2, 1.31151E2, 3.08051E2, 1.08351E2);
        ctx.bezierCurveTo(3.08051E2, 1.08351E2, 2.9894E2, 8.4341E1, 2.99717E2, 8.0045E1);
        ctx.lineTo((-1.2983E2), 1.03065E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.99717E2, 8.0245E1);
        ctx.bezierCurveTo(3.00345E2, 8.0426E1, 3.02551E2, 8.155E1, 3.03801E2, 8.32E1);
        ctx.bezierCurveTo(3.03801E2, 8.32E1, 3.10601E2, 9.4E1, 3.05401E2, 7.56E1);
        ctx.bezierCurveTo(3.05401E2, 7.56E1, 2.96201E2, 4.68E1, 3.05001E2, 5.8E1);
        ctx.bezierCurveTo(3.05001E2, 5.8E1, 3.11001E2, 6.52E1, 3.07801E2, 5.16E1);
        ctx.bezierCurveTo(3.03936E2, 3.5173E1, 3.01401E2, 2.88E1, 3.01401E2, 2.88E1);
        ctx.bezierCurveTo(3.01401E2, 2.88E1, 3.13001E2, 3.36E1, 2.86201E2, (-6E0));
        ctx.lineTo(2.95001E2, (-2.4E0));
        ctx.bezierCurveTo(2.95001E2, (-2.4E0), 2.75401E2, (-4.2E1), 2.53801E2, (-4.72E1));
        ctx.lineTo(2.45801E2, (-5.32E1));
        ctx.bezierCurveTo(2.45801E2, (-5.32E1), 2.84201E2, (-9.12E1), 2.71401E2, (-1.28E2));
        ctx.bezierCurveTo(2.71401E2, (-1.28E2), 2.64601E2, (-1.332E2), 2.55001E2, (-1.24E2));
        ctx.bezierCurveTo(2.55001E2, (-1.24E2), 2.48601E2, (-1.192E2), 2.42601E2, (-1.208E2));
        ctx.bezierCurveTo(2.42601E2, (-1.208E2), 2.11801E2, (-1.196E2), 2.09801E2, (-1.196E2));
        ctx.bezierCurveTo(2.07801E2, (-1.196E2), 1.73001E2, (-1.568E2), 1.07401E2, (-1.392E2));
        ctx.bezierCurveTo(1.07401E2, (-1.392E2), 1.02201E2, (-1.372E2), 9.7801E1, (-1.384E2));
        ctx.bezierCurveTo(9.7801E1, (-1.384E2), 7.94E1, (-1.544E2), 3.06E1, (-1.316E2));
        ctx.bezierCurveTo(3.06E1, (-1.316E2), 2.06E1, (-1.296E2), 1.9E1, (-1.296E2));
        ctx.bezierCurveTo(1.74E1, (-1.296E2), 1.46E1, (-1.296E2), 6.6E0, (-1.232E2));
        ctx.bezierCurveTo((-1.4E0), (-1.168E2), (-1.8E0), (-1.16E2), (-3.8E0), (-1.144E2));
        ctx.bezierCurveTo((-3.8E0), (-1.144E2), (-2.02E1), (-1.032E2), (-2.5E1), (-1.024E2));
        ctx.bezierCurveTo((-2.5E1), (-1.024E2), (-3.66E1), (-9.6E1), (-4.1E1), (-8.6E1));
        ctx.lineTo((-4.46E1), (-8.48E1));
        ctx.bezierCurveTo((-4.46E1), (-8.48E1), (-4.62E1), (-7.76E1), (-4.66E1), (-7.64E1));
        ctx.bezierCurveTo((-4.66E1), (-7.64E1), (-5.14E1), (-7.28E1), (-5.22E1), (-6.72E1));
        ctx.bezierCurveTo((-5.22E1), (-6.72E1), (-6.1E1), (-6.12E1), (-6.06E1), (-5.68E1));
        ctx.bezierCurveTo((-6.06E1), (-5.68E1), (-6.22E1), (-5.16E1), (-6.3E1), (-4.68E1));
        ctx.bezierCurveTo((-6.3E1), (-4.68E1), (-7.02E1), (-4.2E1), (-6.94E1), (-3.92E1));
        ctx.bezierCurveTo((-6.94E1), (-3.92E1), (-7.7E1), (-2.52E1), (-7.58E1), (-1.84E1));
        ctx.bezierCurveTo((-7.58E1), (-1.84E1), (-8.22E1), (-1.88E1), (-8.5E1), (-1.64E1));
        ctx.bezierCurveTo((-8.5E1), (-1.64E1), (-8.58E1), (-1.16E1), (-8.74E1), (-1.12E1));
        ctx.bezierCurveTo((-8.74E1), (-1.12E1), (-9.02E1), (-1E1), (-8.78E1), (-6E0));
        ctx.bezierCurveTo((-8.78E1), (-6E0), (-8.94E1), (-3.2E0), (-8.98E1), (-1.6E0));
        ctx.bezierCurveTo((-8.98E1), (-1.6E0), (-8.9E1), 1.2E0, (-9.34E1), 6.8E0);
        ctx.bezierCurveTo((-9.34E1), 6.8E0, (-9.98E1), 2.56E1, (-9.78E1), 3.08E1);
        ctx.bezierCurveTo((-9.78E1), 3.08E1, (-9.74E1), 3.56E1, (-1.002E2), 3.72E1);
        ctx.bezierCurveTo((-1.002E2), 3.72E1, (-1.038E2), 3.68E1, (-9.54E1), 4.88E1);
        ctx.bezierCurveTo((-9.54E1), 4.88E1, (-9.46E1), 5E1, (-9.78E1), 5.24E1);
        ctx.bezierCurveTo((-9.78E1), 5.24E1, (-1.15E2), 5.6E1, (-1.174E2), 7.24E1);
        ctx.bezierCurveTo((-1.174E2), 7.24E1, (-1.31E2), 8.72E1, (-1.31E2), 9.24E1);
        ctx.bezierCurveTo((-1.31E2), 9.4705E1, (-1.30729E2), 9.7852E1, (-1.3003E2), 1.02465E2);
        ctx.bezierCurveTo((-1.3003E2), 1.02465E2, (-1.306E2), 1.10801E2, (-1.03E2), 1.11601E2);
        ctx.bezierCurveTo((-7.54E1), 1.12401E2, 2.99717E2, 8.0245E1, 2.99717E2, 8.0245E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.156E2), 1.026E2);
        ctx.bezierCurveTo((-1.406E2), 6.32E1, (-1.262E2), 1.19601E2, (-1.262E2), 1.19601E2);
        ctx.bezierCurveTo((-1.174E2), 1.54001E2, 1.22E1, 1.16401E2, 1.22E1, 1.16401E2);
        ctx.bezierCurveTo(1.22E1, 1.16401E2, 1.81001E2, 8.6E1, 1.92201E2, 8.2E1);
        ctx.bezierCurveTo(2.03401E2, 7.8E1, 2.98601E2, 8.44E1, 2.98601E2, 8.44E1);
        ctx.lineTo(2.93001E2, 6.76E1);
        ctx.bezierCurveTo(2.28201E2, 2.12E1, 2.09001E2, 4.44E1, 1.95401E2, 4.04E1);
        ctx.bezierCurveTo(1.81801E2, 3.64E1, 1.84201E2, 4.6E1, 1.81001E2, 4.68E1);
        ctx.bezierCurveTo(1.77801E2, 4.76E1, 1.38601E2, 2.28E1, 1.32201E2, 2.36E1);
        ctx.bezierCurveTo(1.25801E2, 2.44E1, 1.00459E2, 6.49E-1, 1.15401E2, 3.24E1);
        ctx.bezierCurveTo(1.31401E2, 6.64E1, 5.7E1, 7.16E1, 4.02E1, 6.04E1);
        ctx.bezierCurveTo(2.34E1, 4.92E1, 4.74E1, 7.88E1, 4.74E1, 7.88E1);
        ctx.bezierCurveTo(6.58E1, 9.88E1, 3.14E1, 8.2E1, 3.14E1, 8.2E1);
        ctx.bezierCurveTo((-3E0), 6.92E1, (-2.7E1), 9.48E1, (-3.02E1), 9.56E1);
        ctx.bezierCurveTo((-3.34E1), 9.64E1, (-3.82E1), 9.96E1, (-3.9E1), 9.32E1);
        ctx.bezierCurveTo((-3.98E1), 8.68E1, (-4.731E1), 7.0099E1, (-7.9E1), 9.64E1);
        ctx.bezierCurveTo((-9.9E1), 1.13001E2, (-1.128E2), 9.1E1, (-1.128E2), 9.1E1);
        ctx.lineTo((-1.156E2), 1.026E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#e87f3a';
        ctx.fillStyle = 'rgba(232,127,58,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#e87f3a';
        ctx.fillStyle = 'rgba(232,127,58,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.3351E2, 2.5346E1);
        ctx.bezierCurveTo(1.2711E2, 2.6146E1, 1.01743E2, 2.407E0, 1.1671E2, 3.4146E1);
        ctx.bezierCurveTo(1.3331E2, 6.9346E1, 5.831E1, 7.3346E1, 4.151E1, 6.2146E1);
        ctx.bezierCurveTo(2.4709E1, 5.0946E1, 4.871E1, 8.0546E1, 4.871E1, 8.0546E1);
        ctx.bezierCurveTo(6.711E1, 1.00546E2, 3.2709E1, 8.3746E1, 3.2709E1, 8.3746E1);
        ctx.bezierCurveTo((-1.691E0), 7.0946E1, (-2.5691E1), 9.6546E1, (-2.8891E1), 9.7346E1);
        ctx.bezierCurveTo((-3.2091E1), 9.8146E1, (-3.6891E1), 1.01346E2, (-3.7691E1), 9.4946E1);
        ctx.bezierCurveTo((-3.8491E1), 8.8546E1, (-4.587E1), 7.2012E1, (-7.7691E1), 9.8146E1);
        ctx.bezierCurveTo((-9.8927E1), 1.15492E2, (-1.12418E2), 9.4037E1, (-1.12418E2), 9.4037E1);
        ctx.lineTo((-1.15618E2), 1.04146E2);
        ctx.bezierCurveTo((-1.40618E2), 6.4346E1, (-1.25546E2), 1.22655E2, (-1.25546E2), 1.22655E2);
        ctx.bezierCurveTo((-1.16745E2), 1.57056E2, 1.3509E1, 1.18146E2, 1.3509E1, 1.18146E2);
        ctx.bezierCurveTo(1.3509E1, 1.18146E2, 1.8231E2, 8.7746E1, 1.9351E2, 8.3746E1);
        ctx.bezierCurveTo(2.0471E2, 7.9746E1, 2.99038E2, 8.6073E1, 2.99038E2, 8.6073E1);
        ctx.lineTo(2.9351E2, 6.8764E1);
        ctx.bezierCurveTo(2.2871E2, 2.2364E1, 2.1031E2, 4.6146E1, 1.9671E2, 4.2146E1);
        ctx.bezierCurveTo(1.8311E2, 3.8146E1, 1.8551E2, 4.7746E1, 1.8231E2, 4.8546E1);
        ctx.bezierCurveTo(1.7911E2, 4.9346E1, 1.3991E2, 2.4546E1, 1.3351E2, 2.5346E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ea8c4d';
        ctx.fillStyle = 'rgba(234,140,77,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ea8c4d';
        ctx.fillStyle = 'rgba(234,140,77,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.34819E2, 2.7091E1);
        ctx.bezierCurveTo(1.28419E2, 2.7891E1, 1.03685E2, 3.862E0, 1.18019E2, 3.5891E1);
        ctx.bezierCurveTo(1.34219E2, 7.2092E1, 5.9619E1, 7.5092E1, 4.2819E1, 6.3892E1);
        ctx.bezierCurveTo(2.6019E1, 5.2692E1, 5.0019E1, 8.2292E1, 5.0019E1, 8.2292E1);
        ctx.bezierCurveTo(6.8419E1, 1.02292E2, 3.4019E1, 8.5492E1, 3.4019E1, 8.5492E1);
        ctx.bezierCurveTo((-3.81E-1), 7.2692E1, (-2.4382E1), 9.8292E1, (-2.7582E1), 9.9092E1);
        ctx.bezierCurveTo((-3.0782E1), 9.9892E1, (-3.5582E1), 1.03092E2, (-3.6382E1), 9.6692E1);
        ctx.bezierCurveTo((-3.7182E1), 9.0292E1, (-4.443E1), 7.3925E1, (-7.6382E1), 9.9892E1);
        ctx.bezierCurveTo((-9.8855E1), 1.17983E2, (-1.12036E2), 9.7074E1, (-1.12036E2), 9.7074E1);
        ctx.lineTo((-1.15636E2), 1.05692E2);
        ctx.bezierCurveTo((-1.39436E2), 6.6692E1, (-1.24891E2), 1.2571E2, (-1.24891E2), 1.2571E2);
        ctx.bezierCurveTo((-1.16091E2), 1.6011E2, 1.4819E1, 1.19892E2, 1.4819E1, 1.19892E2);
        ctx.bezierCurveTo(1.4819E1, 1.19892E2, 1.83619E2, 8.9492E1, 1.94819E2, 8.5492E1);
        ctx.bezierCurveTo(2.06019E2, 8.1492E1, 2.99474E2, 8.7746E1, 2.99474E2, 8.7746E1);
        ctx.lineTo(2.9402E2, 6.9928E1);
        ctx.bezierCurveTo(2.29219E2, 2.3528E1, 2.11619E2, 4.7891E1, 1.98019E2, 4.3891E1);
        ctx.bezierCurveTo(1.84419E2, 3.9891E1, 1.86819E2, 4.9491E1, 1.83619E2, 5.0292E1);
        ctx.bezierCurveTo(1.80419E2, 5.1092E1, 1.41219E2, 2.6291E1, 1.34819E2, 2.7091E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ec9961';
        ctx.fillStyle = 'rgba(236,153,97,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ec9961';
        ctx.fillStyle = 'rgba(236,153,97,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.36128E2, 2.8837E1);
        ctx.bezierCurveTo(1.29728E2, 2.9637E1, 1.04999E2, 5.605E0, 1.19328E2, 3.7637E1);
        ctx.bezierCurveTo(1.36128E2, 7.5193E1, 6.0394E1, 7.6482E1, 4.4128E1, 6.5637E1);
        ctx.bezierCurveTo(2.7328E1, 5.4437E1, 5.1328E1, 8.4037E1, 5.1328E1, 8.4037E1);
        ctx.bezierCurveTo(6.9728E1, 1.04037E2, 3.5328E1, 8.7237E1, 3.5328E1, 8.7237E1);
        ctx.bezierCurveTo(9.28E-1, 7.4437E1, (-2.3072E1), 1.00037E2, (-2.6272E1), 1.00837E2);
        ctx.bezierCurveTo((-2.9472E1), 1.01637E2, (-3.4272E1), 1.04837E2, (-3.5072E1), 9.8437E1);
        ctx.bezierCurveTo((-3.5872E1), 9.2037E1, (-4.2989E1), 7.5839E1, (-7.5073E1), 1.01637E2);
        ctx.bezierCurveTo((-9.8782E1), 1.20474E2, (-1.11655E2), 1.0011E2, (-1.11655E2), 1.0011E2);
        ctx.lineTo((-1.15655E2), 1.07237E2);
        ctx.bezierCurveTo((-1.37455E2), 7.0437E1, (-1.24236E2), 1.28765E2, (-1.24236E2), 1.28765E2);
        ctx.bezierCurveTo((-1.15436E2), 1.63165E2, 1.6128E1, 1.21637E2, 1.6128E1, 1.21637E2);
        ctx.bezierCurveTo(1.6128E1, 1.21637E2, 1.84928E2, 9.1237E1, 1.96129E2, 8.7237E1);
        ctx.bezierCurveTo(2.07329E2, 8.3237E1, 2.99911E2, 8.9419E1, 2.99911E2, 8.9419E1);
        ctx.lineTo(2.94529E2, 7.1092E1);
        ctx.bezierCurveTo(2.29729E2, 2.4691E1, 2.12929E2, 4.9637E1, 1.99329E2, 4.5637E1);
        ctx.bezierCurveTo(1.85728E2, 4.1637E1, 1.88128E2, 5.1237E1, 1.84928E2, 5.2037E1);
        ctx.bezierCurveTo(1.81728E2, 5.2837E1, 1.42528E2, 2.8037E1, 1.36128E2, 2.8837E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#eea575';
        ctx.fillStyle = 'rgba(238,165,117,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#eea575';
        ctx.fillStyle = 'rgba(238,165,117,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.37438E2, 3.0583E1);
        ctx.bezierCurveTo(1.31037E2, 3.1383E1, 1.06814E2, 7.129E0, 1.20637E2, 3.9383E1);
        ctx.bezierCurveTo(1.37438E2, 7.8583E1, 6.2237E1, 7.8583E1, 4.5437E1, 6.7383E1);
        ctx.bezierCurveTo(2.8637E1, 5.6183E1, 5.2637E1, 8.5783E1, 5.2637E1, 8.5783E1);
        ctx.bezierCurveTo(7.1037E1, 1.05783E2, 3.6637E1, 8.8983E1, 3.6637E1, 8.8983E1);
        ctx.bezierCurveTo(2.237E0, 7.6183E1, (-2.1763E1), 1.01783E2, (-2.4963E1), 1.02583E2);
        ctx.bezierCurveTo((-2.8163E1), 1.03383E2, (-3.2963E1), 1.06583E2, (-3.3763E1), 1.00183E2);
        ctx.bezierCurveTo((-3.4563E1), 9.3783E1, (-4.1548E1), 7.7752E1, (-7.3763E1), 1.03383E2);
        ctx.bezierCurveTo((-9.8709E1), 1.22965E2, (-1.11273E2), 1.03146E2, (-1.11273E2), 1.03146E2);
        ctx.lineTo((-1.15673E2), 1.08783E2);
        ctx.bezierCurveTo((-1.35473E2), 7.3982E1, (-1.23582E2), 1.31819E2, (-1.23582E2), 1.31819E2);
        ctx.bezierCurveTo((-1.14782E2), 1.6622E2, 1.7437E1, 1.23383E2, 1.7437E1, 1.23383E2);
        ctx.bezierCurveTo(1.7437E1, 1.23383E2, 1.86238E2, 9.2983E1, 1.97438E2, 8.8983E1);
        ctx.bezierCurveTo(2.08638E2, 8.4983E1, 3.00347E2, 9.1092E1, 3.00347E2, 9.1092E1);
        ctx.lineTo(2.95038E2, 7.2255E1);
        ctx.bezierCurveTo(2.30238E2, 2.5855E1, 2.14238E2, 5.1383E1, 2.00638E2, 4.7383E1);
        ctx.bezierCurveTo(1.87038E2, 4.3383E1, 1.89438E2, 5.2983E1, 1.86238E2, 5.3783E1);
        ctx.bezierCurveTo(1.83038E2, 5.4583E1, 1.43838E2, 2.9783E1, 1.37438E2, 3.0583E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#f1b288';
        ctx.fillStyle = 'rgba(241,178,136,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#f1b288';
        ctx.fillStyle = 'rgba(241,178,136,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.38747E2, 3.2328E1);
        ctx.bezierCurveTo(1.32347E2, 3.3128E1, 1.06383E2, 9.677E0, 1.21947E2, 4.1128E1);
        ctx.bezierCurveTo(1.41147E2, 7.9928E1, 6.3546E1, 8.0328E1, 4.6746E1, 6.9128E1);
        ctx.bezierCurveTo(2.9946E1, 5.7928E1, 5.3946E1, 8.7528E1, 5.3946E1, 8.7528E1);
        ctx.bezierCurveTo(7.2346E1, 1.07528E2, 3.7946E1, 9.0728E1, 3.7946E1, 9.0728E1);
        ctx.bezierCurveTo(3.546E0, 7.7928E1, (-2.0454E1), 1.03528E2, (-2.3654E1), 1.04328E2);
        ctx.bezierCurveTo((-2.6854E1), 1.05128E2, (-3.1654E1), 1.08328E2, (-3.2454E1), 1.01928E2);
        ctx.bezierCurveTo((-3.3254E1), 9.5528E1, (-4.0108E1), 7.9665E1, (-7.2454E1), 1.05128E2);
        ctx.bezierCurveTo((-9.8636E1), 1.25456E2, (-1.10891E2), 1.06183E2, (-1.10891E2), 1.06183E2);
        ctx.lineTo((-1.15691E2), 1.10328E2);
        ctx.bezierCurveTo((-1.33691E2), 7.7128E1, (-1.22927E2), 1.34874E2, (-1.22927E2), 1.34874E2);
        ctx.bezierCurveTo((-1.14127E2), 1.69274E2, 1.8746E1, 1.25128E2, 1.8746E1, 1.25128E2);
        ctx.bezierCurveTo(1.8746E1, 1.25128E2, 1.87547E2, 9.4728E1, 1.98747E2, 9.0728E1);
        ctx.bezierCurveTo(2.09947E2, 8.6728E1, 3.00783E2, 9.2764E1, 3.00783E2, 9.2764E1);
        ctx.lineTo(2.95547E2, 7.3419E1);
        ctx.bezierCurveTo(2.30747E2, 2.7019E1, 2.15547E2, 5.3128E1, 2.01947E2, 4.9128E1);
        ctx.bezierCurveTo(1.88347E2, 4.5128E1, 1.90747E2, 5.4728E1, 1.87547E2, 5.5528E1);
        ctx.bezierCurveTo(1.84347E2, 5.6328E1, 1.45147E2, 3.1528E1, 1.38747E2, 3.2328E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#f3bf9c';
        ctx.fillStyle = 'rgba(243,191,156,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#f3bf9c';
        ctx.fillStyle = 'rgba(243,191,156,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.40056E2, 3.4073E1);
        ctx.bezierCurveTo(1.33655E2, 3.4873E1, 1.07313E2, 1.1613E1, 1.23255E2, 4.2873E1);
        ctx.bezierCurveTo(1.43656E2, 8.2874E1, 6.4855E1, 8.2074E1, 4.8055E1, 7.0874E1);
        ctx.bezierCurveTo(3.1255E1, 5.9674E1, 5.5255E1, 8.9274E1, 5.5255E1, 8.9274E1);
        ctx.bezierCurveTo(7.3655E1, 1.09274E2, 3.9255E1, 9.2474E1, 3.9255E1, 9.2474E1);
        ctx.bezierCurveTo(4.855E0, 7.9674E1, (-1.9145E1), 1.05274E2, (-2.2345E1), 1.06074E2);
        ctx.bezierCurveTo((-2.5545E1), 1.06874E2, (-3.0345E1), 1.10074E2, (-3.1145E1), 1.03674E2);
        ctx.bezierCurveTo((-3.1945E1), 9.7274E1, (-3.8668E1), 8.1578E1, (-7.1145E1), 1.06874E2);
        ctx.bezierCurveTo((-9.8564E1), 1.27947E2, (-1.10509E2), 1.09219E2, (-1.10509E2), 1.09219E2);
        ctx.lineTo((-1.15709E2), 1.11874E2);
        ctx.bezierCurveTo((-1.31709E2), 8.1674E1, (-1.22273E2), 1.37929E2, (-1.22273E2), 1.37929E2);
        ctx.bezierCurveTo((-1.13473E2), 1.72329E2, 2.0055E1, 1.26874E2, 2.0055E1, 1.26874E2);
        ctx.bezierCurveTo(2.0055E1, 1.26874E2, 1.88856E2, 9.6474E1, 2.00056E2, 9.2474E1);
        ctx.bezierCurveTo(2.11256E2, 8.8474E1, 3.0122E2, 9.4437E1, 3.0122E2, 9.4437E1);
        ctx.lineTo(2.96056E2, 7.4583E1);
        ctx.bezierCurveTo(2.31256E2, 2.8183E1, 2.16856E2, 5.4874E1, 2.03256E2, 5.0874E1);
        ctx.bezierCurveTo(1.89656E2, 4.6873E1, 1.92056E2, 5.6474E1, 1.88856E2, 5.7274E1);
        ctx.bezierCurveTo(1.85656E2, 5.8074E1, 1.46456E2, 3.3273E1, 1.40056E2, 3.4073E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#f5ccb0';
        ctx.fillStyle = 'rgba(245,204,176,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#f5ccb0';
        ctx.fillStyle = 'rgba(245,204,176,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.41365E2, 3.5819E1);
        ctx.bezierCurveTo(1.34965E2, 3.6619E1, 1.07523E2, 1.3944E1, 1.24565E2, 4.4619E1);
        ctx.bezierCurveTo(1.46565E2, 8.4219E1, 6.6164E1, 8.3819E1, 4.9364E1, 7.2619E1);
        ctx.bezierCurveTo(3.2564E1, 6.1419E1, 5.6564E1, 9.1019E1, 5.6564E1, 9.1019E1);
        ctx.bezierCurveTo(7.4964E1, 1.11019E2, 4.0564E1, 9.4219E1, 4.0564E1, 9.4219E1);
        ctx.bezierCurveTo(6.164E0, 8.1419E1, (-1.7836E1), 1.07019E2, (-2.1036E1), 1.07819E2);
        ctx.bezierCurveTo((-2.4236E1), 1.08619E2, (-2.9036E1), 1.11819E2, (-2.9836E1), 1.05419E2);
        ctx.bezierCurveTo((-3.0636E1), 9.9019E1, (-3.7227E1), 8.3492E1, (-6.9836E1), 1.08619E2);
        ctx.bezierCurveTo((-9.8491E1), 1.30438E2, (-1.10127E2), 1.12256E2, (-1.10127E2), 1.12256E2);
        ctx.lineTo((-1.15727E2), 1.13419E2);
        ctx.bezierCurveTo((-1.30128E2), 8.5019E1, (-1.21618E2), 1.40983E2, (-1.21618E2), 1.40983E2);
        ctx.bezierCurveTo((-1.12818E2), 1.75384E2, 2.1364E1, 1.28619E2, 2.1364E1, 1.28619E2);
        ctx.bezierCurveTo(2.1364E1, 1.28619E2, 1.90165E2, 9.8219E1, 2.01365E2, 9.4219E1);
        ctx.bezierCurveTo(2.12565E2, 9.0219E1, 3.01656E2, 9.611E1, 3.01656E2, 9.611E1);
        ctx.lineTo(2.96565E2, 7.5746E1);
        ctx.bezierCurveTo(2.31765E2, 2.9346E1, 2.18165E2, 5.6619E1, 2.04565E2, 5.2619E1);
        ctx.bezierCurveTo(1.90965E2, 4.8619E1, 1.93365E2, 5.8219E1, 1.90165E2, 5.9019E1);
        ctx.bezierCurveTo(1.86965E2, 5.9819E1, 1.47765E2, 3.5019E1, 1.41365E2, 3.5819E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#f8d8c4';
        ctx.fillStyle = 'rgba(248,216,196,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#f8d8c4';
        ctx.fillStyle = 'rgba(248,216,196,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.42674E2, 3.7565E1);
        ctx.bezierCurveTo(1.36274E2, 3.8365E1, 1.08832E2, 1.5689E1, 1.25874E2, 4.6365E1);
        ctx.bezierCurveTo(1.47874E2, 8.5965E1, 6.7474E1, 8.5565E1, 5.0674E1, 7.4365E1);
        ctx.bezierCurveTo(3.3874E1, 6.3165E1, 5.7874E1, 9.2765E1, 5.7874E1, 9.2765E1);
        ctx.bezierCurveTo(7.6274E1, 1.12765E2, 4.1874E1, 9.5965E1, 4.1874E1, 9.5965E1);
        ctx.bezierCurveTo(7.473E0, 8.3165E1, (-1.6527E1), 1.08765E2, (-1.9727E1), 1.09565E2);
        ctx.bezierCurveTo((-2.2927E1), 1.10365E2, (-2.7727E1), 1.13565E2, (-2.8527E1), 1.07165E2);
        ctx.bezierCurveTo((-2.9327E1), 1.00765E2, (-3.5786E1), 8.5405E1, (-6.8527E1), 1.10365E2);
        ctx.bezierCurveTo((-9.8418E1), 1.32929E2, (-1.09745E2), 1.15293E2, (-1.09745E2), 1.15293E2);
        ctx.lineTo((-1.15745E2), 1.14965E2);
        ctx.bezierCurveTo((-1.29346E2), 8.8564E1, (-1.20963E2), 1.44038E2, (-1.20963E2), 1.44038E2);
        ctx.bezierCurveTo((-1.12163E2), 1.78438E2, 2.2673E1, 1.30365E2, 2.2673E1, 1.30365E2);
        ctx.bezierCurveTo(2.2673E1, 1.30365E2, 1.91474E2, 9.9965E1, 2.02674E2, 9.5965E1);
        ctx.bezierCurveTo(2.13874E2, 9.1965E1, 3.02093E2, 9.7783E1, 3.02093E2, 9.7783E1);
        ctx.lineTo(2.97075E2, 7.691E1);
        ctx.bezierCurveTo(2.32274E2, 3.051E1, 2.19474E2, 5.8365E1, 2.05874E2, 5.4365E1);
        ctx.bezierCurveTo(1.92274E2, 5.0365E1, 1.94674E2, 5.9965E1, 1.91474E2, 6.0765E1);
        ctx.bezierCurveTo(1.88274E2, 6.1565E1, 1.49074E2, 3.6765E1, 1.42674E2, 3.7565E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#fae5d7';
        ctx.fillStyle = 'rgba(250,229,215,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#fae5d7';
        ctx.fillStyle = 'rgba(250,229,215,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.43983E2, 3.931E1);
        ctx.bezierCurveTo(1.37583E2, 4.011E1, 1.10529E2, 1.7223E1, 1.27183E2, 4.811E1);
        ctx.bezierCurveTo(1.49183E2, 8.891E1, 6.8783E1, 8.731E1, 5.1983E1, 7.611E1);
        ctx.bezierCurveTo(3.5183E1, 6.491E1, 5.9183E1, 9.451E1, 5.9183E1, 9.451E1);
        ctx.bezierCurveTo(7.7583E1, 1.1451E2, 4.3183E1, 9.771E1, 4.3183E1, 9.771E1);
        ctx.bezierCurveTo(8.783E0, 8.491E1, (-1.5217E1), 1.1051E2, (-1.8417E1), 1.1131E2);
        ctx.bezierCurveTo((-2.1618E1), 1.1211E2, (-2.6418E1), 1.1531E2, (-2.7218E1), 1.0891E2);
        ctx.bezierCurveTo((-2.8018E1), 1.0251E2, (-3.4346E1), 8.7318E1, (-6.7218E1), 1.1211E2);
        ctx.bezierCurveTo((-9.8345E1), 1.3542E2, (-1.09363E2), 1.18329E2, (-1.09363E2), 1.18329E2);
        ctx.lineTo((-1.15764E2), 1.1651E2);
        ctx.bezierCurveTo((-1.28764E2), 9.251E1, (-1.20309E2), 1.47093E2, (-1.20309E2), 1.47093E2);
        ctx.bezierCurveTo((-1.11509E2), 1.81493E2, 2.3983E1, 1.3211E2, 2.3983E1, 1.3211E2);
        ctx.bezierCurveTo(2.3983E1, 1.3211E2, 1.92783E2, 1.0171E2, 2.03983E2, 9.771E1);
        ctx.bezierCurveTo(2.15183E2, 9.371E1, 3.02529E2, 9.9456E1, 3.02529E2, 9.9456E1);
        ctx.lineTo(2.97583E2, 7.8074E1);
        ctx.bezierCurveTo(2.32783E2, 3.1673E1, 2.20783E2, 6.011E1, 2.07183E2, 5.611E1);
        ctx.bezierCurveTo(1.93583E2, 5.211E1, 1.95983E2, 6.171E1, 1.92783E2, 6.251E1);
        ctx.bezierCurveTo(1.89583E2, 6.331E1, 1.50383E2, 3.851E1, 1.43983E2, 3.931E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#fcf2eb';
        ctx.fillStyle = 'rgba(252,242,235,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#fcf2eb';
        ctx.fillStyle = 'rgba(252,242,235,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.45292E2, 4.1055E1);
        ctx.bezierCurveTo(1.38892E2, 4.1855E1, 1.12917E2, 1.8411E1, 1.28492E2, 4.9855E1);
        ctx.bezierCurveTo(1.49692E2, 9.2656E1, 7.0092E1, 8.9056E1, 5.3292E1, 7.7856E1);
        ctx.bezierCurveTo(3.6492E1, 6.6656E1, 6.0492E1, 9.6256E1, 6.0492E1, 9.6256E1);
        ctx.bezierCurveTo(7.8892E1, 1.16256E2, 4.4492E1, 9.9456E1, 4.4492E1, 9.9456E1);
        ctx.bezierCurveTo(1.0092E1, 8.6656E1, (-1.3908E1), 1.12256E2, (-1.7108E1), 1.13056E2);
        ctx.bezierCurveTo((-2.0308E1), 1.13856E2, (-2.5108E1), 1.17056E2, (-2.5908E1), 1.10656E2);
        ctx.bezierCurveTo((-2.6708E1), 1.04256E2, (-3.2905E1), 8.9232E1, (-6.5908E1), 1.13856E2);
        ctx.bezierCurveTo((-9.8273E1), 1.37911E2, (-1.08982E2), 1.21365E2, (-1.08982E2), 1.21365E2);
        ctx.lineTo((-1.15782E2), 1.18056E2);
        ctx.bezierCurveTo((-1.28582E2), 9.4856E1, (-1.19654E2), 1.50147E2, (-1.19654E2), 1.50147E2);
        ctx.bezierCurveTo((-1.10854E2), 1.84547E2, 2.5292E1, 1.33856E2, 2.5292E1, 1.33856E2);
        ctx.bezierCurveTo(2.5292E1, 1.33856E2, 1.94093E2, 1.03456E2, 2.05293E2, 9.9456E1);
        ctx.bezierCurveTo(2.16493E2, 9.5456E1, 3.02965E2, 1.01128E2, 3.02965E2, 1.01128E2);
        ctx.lineTo(2.98093E2, 7.9237E1);
        ctx.bezierCurveTo(2.33292E2, 3.2837E1, 2.22093E2, 6.1856E1, 2.08493E2, 5.7856E1);
        ctx.bezierCurveTo(1.94893E2, 5.3855E1, 1.97293E2, 6.3456E1, 1.94093E2, 6.4256E1);
        ctx.bezierCurveTo(1.90892E2, 6.5056E1, 1.51692E2, 4.0255E1, 1.45292E2, 4.1055E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.158E2), 1.19601E2);
        ctx.bezierCurveTo((-1.286E2), 9.76E1, (-1.19E2), 1.53201E2, (-1.19E2), 1.53201E2);
        ctx.bezierCurveTo((-1.102E2), 1.87601E2, 2.66E1, 1.35601E2, 2.66E1, 1.35601E2);
        ctx.bezierCurveTo(2.66E1, 1.35601E2, 1.95401E2, 1.052E2, 2.06601E2, 1.012E2);
        ctx.bezierCurveTo(2.17801E2, 9.72E1, 3.03401E2, 1.028E2, 3.03401E2, 1.028E2);
        ctx.lineTo(2.98601E2, 8.04E1);
        ctx.bezierCurveTo(2.33801E2, 3.4E1, 2.23401E2, 6.36E1, 2.09801E2, 5.96E1);
        ctx.bezierCurveTo(1.96201E2, 5.56E1, 1.98601E2, 6.52E1, 1.95401E2, 6.6E1);
        ctx.bezierCurveTo(1.92201E2, 6.68E1, 1.53001E2, 4.2E1, 1.46601E2, 4.28E1);
        ctx.bezierCurveTo(1.40201E2, 4.36E1, 1.14981E2, 1.9793E1, 1.29801E2, 5.16E1);
        ctx.bezierCurveTo(1.52028E2, 9.9307E1, 6.9041E1, 8.9227E1, 5.46E1, 7.96E1);
        ctx.bezierCurveTo(3.78E1, 6.84E1, 6.18E1, 9.8E1, 6.18E1, 9.8E1);
        ctx.bezierCurveTo(8.02E1, 1.18001E2, 4.58E1, 1.012E2, 4.58E1, 1.012E2);
        ctx.bezierCurveTo(1.14E1, 8.84E1, (-1.26E1), 1.14001E2, (-1.58E1), 1.14801E2);
        ctx.bezierCurveTo((-1.9E1), 1.15601E2, (-2.38E1), 1.18801E2, (-2.46E1), 1.12401E2);
        ctx.bezierCurveTo((-2.54E1), 1.06E2, (-3.1465E1), 9.1144E1, (-6.46E1), 1.15601E2);
        ctx.bezierCurveTo((-9.82E1), 1.40401E2, (-1.086E2), 1.24401E2, (-1.086E2), 1.24401E2);
        ctx.lineTo((-1.158E2), 1.19601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.42E1), 1.49601E2);
        ctx.bezierCurveTo((-7.42E1), 1.49601E2, (-8.14E1), 1.61201E2, (-6.06E1), 1.74401E2);
        ctx.bezierCurveTo((-6.06E1), 1.74401E2, (-5.92E1), 1.75801E2, (-7.72E1), 1.71601E2);
        ctx.bezierCurveTo((-7.72E1), 1.71601E2, (-8.34E1), 1.69601E2, (-8.5E1), 1.59201E2);
        ctx.bezierCurveTo((-8.5E1), 1.59201E2, (-8.98E1), 1.54801E2, (-9.46E1), 1.49201E2);
        ctx.bezierCurveTo((-9.94E1), 1.43601E2, (-7.42E1), 1.49601E2, (-7.42E1), 1.49601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(6.58E1, 1.02E2);
        ctx.bezierCurveTo(6.58E1, 1.02E2, 8.3498E1, 1.28821E2, 8.29E1, 1.33601E2);
        ctx.bezierCurveTo(8.16E1, 1.44001E2, 8.14E1, 1.53601E2, 8.46E1, 1.57601E2);
        ctx.bezierCurveTo(8.7801E1, 1.61601E2, 9.6601E1, 1.94801E2, 9.6601E1, 1.94801E2);
        ctx.bezierCurveTo(9.6601E1, 1.94801E2, 9.6201E1, 1.96001E2, 1.08601E2, 1.58001E2);
        ctx.bezierCurveTo(1.08601E2, 1.58001E2, 1.20201E2, 1.42001E2, 1.00201E2, 1.23601E2);
        ctx.bezierCurveTo(1.00201E2, 1.23601E2, 6.5E1, 9.48E1, 6.58E1, 1.02E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.42E1), 1.76401E2);
        ctx.bezierCurveTo((-5.42E1), 1.76401E2, (-4.3E1), 1.83601E2, (-5.74E1), 2.14801E2);
        ctx.lineTo((-5.1E1), 2.12401E2);
        ctx.bezierCurveTo((-5.1E1), 2.12401E2, (-5.18E1), 2.23601E2, (-5.5E1), 2.26001E2);
        ctx.lineTo((-4.78E1), 2.22801E2);
        ctx.bezierCurveTo((-4.78E1), 2.22801E2, (-4.3E1), 2.30801E2, (-4.7E1), 2.35601E2);
        ctx.bezierCurveTo((-4.7E1), 2.35601E2, (-3.02E1), 2.43601E2, (-3.1E1), 2.50001E2);
        ctx.bezierCurveTo((-3.1E1), 2.50001E2, (-2.46E1), 2.42001E2, (-2.86E1), 2.35601E2);
        ctx.bezierCurveTo((-3.26E1), 2.29201E2, (-3.98E1), 2.33201E2, (-3.9E1), 2.14801E2);
        ctx.lineTo((-4.78E1), 2.18001E2);
        ctx.bezierCurveTo((-4.78E1), 2.18001E2, (-4.22E1), 2.09201E2, (-4.22E1), 2.02801E2);
        ctx.lineTo((-5.02E1), 2.05201E2);
        ctx.bezierCurveTo((-5.02E1), 2.05201E2, (-3.4731E1), 1.78623E2, (-4.54E1), 1.77201E2);
        ctx.bezierCurveTo((-5.14E1), 1.76401E2, (-5.42E1), 1.76401E2, (-5.42E1), 1.76401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.18E1), 1.93201E2);
        ctx.bezierCurveTo((-2.18E1), 1.93201E2, (-1.9E1), 1.88801E2, (-2.18E1), 1.89601E2);
        ctx.bezierCurveTo((-2.46E1), 1.90401E2, (-5.58E1), 2.05201E2, (-6.18E1), 2.14801E2);
        ctx.bezierCurveTo((-6.18E1), 2.14801E2, (-2.74E1), 1.90401E2, (-2.18E1), 1.93201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.14E1), 2.01201E2);
        ctx.bezierCurveTo((-1.14E1), 2.01201E2, (-8.6E0), 1.96801E2, (-1.14E1), 1.97601E2);
        ctx.bezierCurveTo((-1.42E1), 1.98401E2, (-4.54E1), 2.13201E2, (-5.14E1), 2.22801E2);
        ctx.bezierCurveTo((-5.14E1), 2.22801E2, (-1.7E1), 1.98401E2, (-1.14E1), 2.01201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.8E0, 1.86001E2);
        ctx.bezierCurveTo(1.8E0, 1.86001E2, 4.6E0, 1.81601E2, 1.8E0, 1.82401E2);
        ctx.bezierCurveTo((-1E0), 1.83201E2, (-3.22E1), 1.98001E2, (-3.82E1), 2.07601E2);
        ctx.bezierCurveTo((-3.82E1), 2.07601E2, (-3.8E0), 1.83201E2, 1.8E0, 1.86001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.14E1), 2.29601E2);
        ctx.bezierCurveTo((-2.14E1), 2.29601E2, (-2.14E1), 2.23601E2, (-2.42E1), 2.24401E2);
        ctx.bezierCurveTo((-2.7E1), 2.25201E2, (-6.3E1), 2.42801E2, (-6.9E1), 2.52401E2);
        ctx.bezierCurveTo((-6.9E1), 2.52401E2, (-2.7E1), 2.26801E2, (-2.14E1), 2.29601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.02E1), 2.18801E2);
        ctx.bezierCurveTo((-2.02E1), 2.18801E2, (-1.9E1), 2.14001E2, (-2.18E1), 2.14801E2);
        ctx.bezierCurveTo((-2.38E1), 2.14801E2, (-5.02E1), 2.26401E2, (-5.62E1), 2.36001E2);
        ctx.bezierCurveTo((-5.62E1), 2.36001E2, (-2.66E1), 2.14401E2, (-2.02E1), 2.18801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.46E1), 2.66401E2);
        ctx.lineTo((-4.46E1), 2.74001E2);
        ctx.bezierCurveTo((-4.46E1), 2.74001E2, (-3.42E1), 2.66401E2, (-3.06E1), 2.67601E2);
        ctx.bezierCurveTo((-3.06E1), 2.67601E2, (-3.74E1), 2.78801E2, (-3.82E1), 2.84001E2);
        ctx.bezierCurveTo((-3.82E1), 2.84001E2, (-2.78E1), 2.71201E2, (-2.22E1), 2.71601E2);
        ctx.bezierCurveTo((-2.22E1), 2.71601E2, (-1.46E1), 2.72001E2, (-1.46E1), 2.82801E2);
        ctx.bezierCurveTo((-1.46E1), 2.82801E2, (-9E0), 2.72401E2, (-5.8E0), 2.72801E2);
        ctx.bezierCurveTo((-5.8E0), 2.72801E2, (-4.6E0), 2.79201E2, (-5.8E0), 2.86001E2);
        ctx.bezierCurveTo((-5.8E0), 2.86001E2, (-1.8E0), 2.78401E2, 2.2E0, 2.80001E2);
        ctx.bezierCurveTo(2.2E0, 2.80001E2, 8.6E0, 2.78001E2, 7.8E0, 2.89601E2);
        ctx.bezierCurveTo(7.8E0, 2.89601E2, 7.8E0, 3.00001E2, 7E0, 3.02801E2);
        ctx.bezierCurveTo(7E0, 3.02801E2, 1.26E1, 2.76401E2, 1.5E1, 2.76001E2);
        ctx.bezierCurveTo(1.5E1, 2.76001E2, 2.3E1, 2.74801E2, 2.78E1, 2.83601E2);
        ctx.bezierCurveTo(2.78E1, 2.83601E2, 2.38E1, 2.76001E2, 2.86E1, 2.78001E2);
        ctx.bezierCurveTo(2.86E1, 2.78001E2, 3.94E1, 2.79601E2, 4.26E1, 2.86401E2);
        ctx.bezierCurveTo(4.26E1, 2.86401E2, 3.58E1, 2.74401E2, 4.14E1, 2.77601E2);
        ctx.bezierCurveTo(4.14E1, 2.77601E2, 4.82E1, 2.77601E2, 4.94E1, 2.84001E2);
        ctx.bezierCurveTo(4.94E1, 2.84001E2, 5.78E1, 3.05201E2, 5.98E1, 3.06801E2);
        ctx.bezierCurveTo(5.98E1, 3.06801E2, 5.22E1, 2.85201E2, 5.38E1, 2.85201E2);
        ctx.bezierCurveTo(5.38E1, 2.85201E2, 5.18E1, 2.73201E2, 5.7E1, 2.88001E2);
        ctx.bezierCurveTo(5.7E1, 2.88001E2, 5.38E1, 2.74001E2, 5.94E1, 2.74801E2);
        ctx.bezierCurveTo(6.5E1, 2.75601E2, 6.94E1, 2.85601E2, 7.78E1, 2.83201E2);
        ctx.bezierCurveTo(7.78E1, 2.83201E2, 8.7401E1, 2.88801E2, 8.9401E1, 2.19601E2);
        ctx.lineTo((-3.46E1), 2.66401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.98E1), 1.73601E2);
        ctx.bezierCurveTo((-2.98E1), 1.73601E2, (-1.5E1), 1.67601E2, 2.5E1, 1.73601E2);
        ctx.bezierCurveTo(2.5E1, 1.73601E2, 3.22E1, 1.74001E2, 3.9E1, 1.65201E2);
        ctx.bezierCurveTo(4.58E1, 1.56401E2, 7.26E1, 1.49201E2, 7.9E1, 1.51201E2);
        ctx.lineTo(8.8601E1, 1.57601E2);
        ctx.lineTo(8.9401E1, 1.58801E2);
        ctx.bezierCurveTo(8.9401E1, 1.58801E2, 1.01801E2, 1.69201E2, 1.02201E2, 1.76801E2);
        ctx.bezierCurveTo(1.02601E2, 1.84401E2, 8.7801E1, 2.32401E2, 7.82E1, 2.48401E2);
        ctx.bezierCurveTo(6.86E1, 2.64401E2, 5.9E1, 2.76801E2, 3.98E1, 2.74401E2);
        ctx.bezierCurveTo(3.98E1, 2.74401E2, 1.9E1, 2.70401E2, (-6.6E0), 2.74401E2);
        ctx.bezierCurveTo((-6.6E0), 2.74401E2, (-3.58E1), 2.72801E2, (-3.86E1), 2.64801E2);
        ctx.bezierCurveTo((-4.14E1), 2.56801E2, (-2.74E1), 2.41601E2, (-2.74E1), 2.41601E2);
        ctx.bezierCurveTo((-2.74E1), 2.41601E2, (-2.3E1), 2.33201E2, (-2.42E1), 2.18801E2);
        ctx.bezierCurveTo((-2.54E1), 2.04401E2, (-2.5E1), 1.76401E2, (-2.98E1), 1.73601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#e5668c';
        ctx.fillStyle = 'rgba(229,102,140,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#e5668c';
        ctx.fillStyle = 'rgba(229,102,140,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.8E0), 1.75601E2);
        ctx.bezierCurveTo(6E-1, 1.94001E2, (-2.9E1), 2.59201E2, (-2.9E1), 2.59201E2);
        ctx.bezierCurveTo((-3.1E1), 2.60801E2, (-1.634E1), 2.66846E2, (-6.2E0), 2.64401E2);
        ctx.bezierCurveTo(4.746E0, 2.61763E2, 4.5E1, 2.66001E2, 4.5E1, 2.66001E2);
        ctx.bezierCurveTo(6.86E1, 2.50401E2, 8.14E1, 2.06001E2, 8.14E1, 2.06001E2);
        ctx.bezierCurveTo(8.14E1, 2.06001E2, 9.1801E1, 1.82001E2, 7.42E1, 1.78801E2);
        ctx.bezierCurveTo(5.66E1, 1.75601E2, (-7.8E0), 1.75601E2, (-7.8E0), 1.75601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#b23259';
        ctx.fillStyle = 'rgba(178,50,89,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#b23259';
        ctx.fillStyle = 'rgba(178,50,89,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.831E0), 2.06497E2);
        ctx.bezierCurveTo((-6.505E0), 1.93707E2, (-4.921E0), 1.81906E2, (-7.8E0), 1.75601E2);
        ctx.bezierCurveTo((-7.8E0), 1.75601E2, 5.46E1, 1.82001E2, 6.58E1, 1.61201E2);
        ctx.bezierCurveTo(7.0041E1, 1.53326E2, 8.4801E1, 1.84001E2, 8.44E1, 1.93601E2);
        ctx.bezierCurveTo(8.44E1, 1.93601E2, 2.14E1, 2.08001E2, 6.6E0, 1.96801E2);
        ctx.lineTo((-9.831E0), 2.06497E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#a5264c';
        ctx.fillStyle = 'rgba(165,38,76,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#a5264c';
        ctx.fillStyle = 'rgba(165,38,76,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.4E0), 2.22801E2);
        ctx.bezierCurveTo((-5.4E0), 2.22801E2, (-3.4E0), 2.30001E2, (-5.8E0), 2.34001E2);
        ctx.bezierCurveTo((-5.8E0), 2.34001E2, (-7.4E0), 2.34801E2, (-8.6E0), 2.35201E2);
        ctx.bezierCurveTo((-8.6E0), 2.35201E2, (-7.4E0), 2.38801E2, (-1.4E0), 2.40401E2);
        ctx.bezierCurveTo((-1.4E0), 2.40401E2, 6E-1, 2.44801E2, 3E0, 2.45201E2);
        ctx.bezierCurveTo(5.4E0, 2.45601E2, 1.02E1, 2.51201E2, 1.42E1, 2.50001E2);
        ctx.bezierCurveTo(1.82E1, 2.48801E2, 2.94E1, 2.44801E2, 2.94E1, 2.44801E2);
        ctx.bezierCurveTo(2.94E1, 2.44801E2, 3.5E1, 2.41601E2, 4.38E1, 2.45201E2);
        ctx.bezierCurveTo(4.38E1, 2.45201E2, 4.6175E1, 2.44399E2, 4.66E1, 2.40401E2);
        ctx.bezierCurveTo(4.71E1, 2.35701E2, 5.02E1, 2.32001E2, 5.22E1, 2.30001E2);
        ctx.bezierCurveTo(5.42E1, 2.28001E2, 6.38E1, 2.15201E2, 6.26E1, 2.14801E2);
        ctx.bezierCurveTo(6.14E1, 2.14401E2, (-5.4E0), 2.22801E2, (-5.4E0), 2.22801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ff727f';
        ctx.fillStyle = 'rgba(255,114,127,1)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ff727f';
        ctx.fillStyle = 'rgba(255,114,127,1)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.8E0), 1.74401E2);
        ctx.bezierCurveTo((-9.8E0), 1.74401E2, (-1.26E1), 1.96801E2, (-9.4E0), 2.05201E2);
        ctx.bezierCurveTo((-6.2E0), 2.13601E2, (-7E0), 2.15601E2, (-7.8E0), 2.19601E2);
        ctx.bezierCurveTo((-8.6E0), 2.23601E2, (-4.2E0), 2.33601E2, 1.4E0, 2.39601E2);
        ctx.lineTo(1.34E1, 2.41201E2);
        ctx.bezierCurveTo(1.34E1, 2.41201E2, 2.86E1, 2.37601E2, 3.78E1, 2.40401E2);
        ctx.bezierCurveTo(3.78E1, 2.40401E2, 4.6794E1, 2.41744E2, 5.02E1, 2.26801E2);
        ctx.bezierCurveTo(5.02E1, 2.26801E2, 5.5E1, 2.20401E2, 6.22E1, 2.17601E2);
        ctx.bezierCurveTo(6.94E1, 2.14801E2, 7.66E1, 1.73201E2, 7.26E1, 1.65201E2);
        ctx.bezierCurveTo(6.86E1, 1.57201E2, 5.42E1, 1.52801E2, 3.82E1, 1.68401E2);
        ctx.bezierCurveTo(2.22E1, 1.84001E2, 2.02E1, 1.67201E2, (-9.8E0), 1.74401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-8.2E0), 2.49201E2);
        ctx.bezierCurveTo((-8.2E0), 2.49201E2, (-9E0), 2.47201E2, (-1.34E1), 2.46801E2);
        ctx.bezierCurveTo((-1.34E1), 2.46801E2, (-3.58E1), 2.43201E2, (-4.42E1), 2.30801E2);
        ctx.bezierCurveTo((-4.42E1), 2.30801E2, (-5.1E1), 2.25201E2, (-4.66E1), 2.36801E2);
        ctx.bezierCurveTo((-4.66E1), 2.36801E2, (-3.62E1), 2.57201E2, (-2.94E1), 2.60001E2);
        ctx.bezierCurveTo((-2.94E1), 2.60001E2, (-1.3E1), 2.64001E2, (-8.2E0), 2.49201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc3f4c';
        ctx.fillStyle = 'rgba(204,63,76,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc3f4c';
        ctx.fillStyle = 'rgba(204,63,76,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(7.1742E1, 1.85229E2);
        ctx.bezierCurveTo(7.2401E1, 1.77323E2, 7.4354E1, 1.68709E2, 7.26E1, 1.65201E2);
        ctx.bezierCurveTo(6.6154E1, 1.52307E2, 4.9181E1, 1.57695E2, 3.82E1, 1.68401E2);
        ctx.bezierCurveTo(2.22E1, 1.84001E2, 2.02E1, 1.67201E2, (-9.8E0), 1.74401E2);
        ctx.bezierCurveTo((-9.8E0), 1.74401E2, (-1.1545E1), 1.88364E2, (-1.0705E1), 1.98376E2);
        ctx.bezierCurveTo((-1.0705E1), 1.98376E2, 2.66E1, 1.86801E2, 2.74E1, 1.92401E2);
        ctx.bezierCurveTo(2.74E1, 1.92401E2, 2.9E1, 1.89201E2, 3.82E1, 1.89201E2);
        ctx.bezierCurveTo(4.74E1, 1.89201E2, 7.0142E1, 1.88029E2, 7.1742E1, 1.85229E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a51926';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a51926';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.86E1, 1.75201E2);
        ctx.bezierCurveTo(2.86E1, 1.75201E2, 3.34E1, 1.80001E2, 2.98E1, 1.89601E2);
        ctx.bezierCurveTo(2.98E1, 1.89601E2, 1.54E1, 2.05601E2, 1.74E1, 2.19601E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.94E1), 2.60001E2);
        ctx.bezierCurveTo((-1.94E1), 2.60001E2, (-2.38E1), 2.47201E2, (-1.5E1), 2.54001E2);
        ctx.bezierCurveTo((-1.5E1), 2.54001E2, (-1.02E1), 2.56001E2, (-1.14E1), 2.57601E2);
        ctx.bezierCurveTo((-1.26E1), 2.59201E2, (-1.82E1), 2.63201E2, (-1.94E1), 2.60001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.436E1), 2.61201E2);
        ctx.bezierCurveTo((-1.436E1), 2.61201E2, (-1.788E1), 2.50961E2, (-1.084E1), 2.56401E2);
        ctx.bezierCurveTo((-1.084E1), 2.56401E2, (-6.419E0), 2.58849E2, (-7.96E0), 2.59281E2);
        ctx.bezierCurveTo((-1.252E1), 2.60561E2, (-7.96E0), 2.63121E2, (-1.436E1), 2.61201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.56E0), 2.61201E2);
        ctx.bezierCurveTo((-9.56E0), 2.61201E2, (-1.308E1), 2.50961E2, (-6.04E0), 2.56401E2);
        ctx.bezierCurveTo((-6.04E0), 2.56401E2, (-1.665E0), 2.58711E2, (-3.16E0), 2.59281E2);
        ctx.bezierCurveTo((-6.52E0), 2.60561E2, (-3.16E0), 2.63121E2, (-9.56E0), 2.61201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.96E0), 2.61401E2);
        ctx.bezierCurveTo((-2.96E0), 2.61401E2, (-6.48E0), 2.51161E2, 5.6E-1, 2.56601E2);
        ctx.bezierCurveTo(5.6E-1, 2.56601E2, 4.943E0, 2.58933E2, 3.441E0, 2.59481E2);
        ctx.bezierCurveTo(4.8E-1, 2.60561E2, 3.441E0, 2.63321E2, (-2.96E0), 2.61401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.52E0, 2.61321E2);
        ctx.bezierCurveTo(3.52E0, 2.61321E2, 0E0, 2.51081E2, 7.041E0, 2.56521E2);
        ctx.bezierCurveTo(7.041E0, 2.56521E2, 1.0881E1, 2.58121E2, 9.921E0, 2.59401E2);
        ctx.bezierCurveTo(8.961E0, 2.60681E2, 9.921E0, 2.63241E2, 3.52E0, 2.61321E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.02E1, 2.62001E2);
        ctx.bezierCurveTo(1.02E1, 2.62001E2, 5.4E0, 2.49601E2, 1.46E1, 2.56001E2);
        ctx.bezierCurveTo(1.46E1, 2.56001E2, 1.94E1, 2.58001E2, 1.82E1, 2.59601E2);
        ctx.bezierCurveTo(1.7E1, 2.61201E2, 1.82E1, 2.64401E2, 1.02E1, 2.62001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a5264c';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a5264c';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.82E1), 2.44801E2);
        ctx.bezierCurveTo((-1.82E1), 2.44801E2, (-5E0), 2.42001E2, 1E0, 2.45201E2);
        ctx.bezierCurveTo(1E0, 2.45201E2, 7E0, 2.46401E2, 8.2E0, 2.46001E2);
        ctx.bezierCurveTo(9.4E0, 2.45601E2, 1.26E1, 2.45201E2, 1.26E1, 2.45201E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a5264c';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a5264c';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.58E1, 2.53601E2);
        ctx.bezierCurveTo(1.58E1, 2.53601E2, 2.78E1, 2.40001E2, 3.98E1, 2.44401E2);
        ctx.bezierCurveTo(4.6816E1, 2.46974E2, 4.58E1, 2.43601E2, 4.66E1, 2.40801E2);
        ctx.bezierCurveTo(4.74E1, 2.38001E2, 4.76E1, 2.33801E2, 5.26E1, 2.30801E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.3E1, 2.37601E2);
        ctx.bezierCurveTo(3.3E1, 2.37601E2, 2.9E1, 2.26801E2, 2.62E1, 2.39601E2);
        ctx.bezierCurveTo(2.34E1, 2.52401E2, 2.02E1, 2.56001E2, 1.86E1, 2.58801E2);
        ctx.bezierCurveTo(1.86E1, 2.58801E2, 1.86E1, 2.64001E2, 2.7E1, 2.63601E2);
        ctx.bezierCurveTo(2.7E1, 2.63601E2, 3.78E1, 2.63201E2, 3.82E1, 2.60401E2);
        ctx.bezierCurveTo(3.86E1, 2.57601E2, 3.7E1, 2.46001E2, 3.3E1, 2.37601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a5264c';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a5264c';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.7E1, 2.44801E2);
        ctx.bezierCurveTo(4.7E1, 2.44801E2, 5.06E1, 2.42401E2, 5.3E1, 2.43601E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a5264c';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#a5264c';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.35E1, 2.28401E2);
        ctx.bezierCurveTo(5.35E1, 2.28401E2, 5.64E1, 2.23501E2, 6.12E1, 2.22701E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#b2b2b2';
        ctx.fillStyle = 'rgba(178,178,178,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#b2b2b2';
        ctx.fillStyle = 'rgba(178,178,178,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.58E1), 2.65201E2);
        ctx.bezierCurveTo((-2.58E1), 2.65201E2, (-7.8E0), 2.68401E2, (-3.4E0), 2.66801E2);
        ctx.bezierCurveTo((-3.4E0), 2.66801E2, 5.4E0, 2.66801E2, (-3E0), 2.68801E2);
        ctx.bezierCurveTo((-3E0), 2.68801E2, (-1.58E1), 2.68801E2, (-2.38E1), 2.67601E2);
        ctx.bezierCurveTo((-2.38E1), 2.67601E2, (-3.54E1), 2.62001E2, (-2.58E1), 2.65201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.18E1), 1.72001E2);
        ctx.bezierCurveTo((-1.18E1), 1.72001E2, 5.8E0, 1.72001E2, 7.8E0, 1.72801E2);
        ctx.bezierCurveTo(7.8E0, 1.72801E2, 1.5E1, 2.03601E2, 1.14E1, 2.11201E2);
        ctx.bezierCurveTo(1.14E1, 2.11201E2, 1.02E1, 2.14001E2, 7.4E0, 2.08401E2);
        ctx.bezierCurveTo(7.4E0, 2.08401E2, (-1.1E1), 1.75601E2, (-1.42E1), 1.73601E2);
        ctx.bezierCurveTo((-1.74E1), 1.71601E2, (-1.3E1), 1.72001E2, (-1.18E1), 1.72001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-8.89E1), 1.69301E2);
        ctx.bezierCurveTo((-8.89E1), 1.69301E2, (-8E1), 1.71001E2, (-6.74E1), 1.73601E2);
        ctx.bezierCurveTo((-6.74E1), 1.73601E2, (-6.26E1), 1.96001E2, (-5.94E1), 2.00801E2);
        ctx.bezierCurveTo((-5.62E1), 2.05601E2, (-5.98E1), 2.05601E2, (-6.34E1), 2.02801E2);
        ctx.bezierCurveTo((-6.7E1), 2.00001E2, (-8.18E1), 1.86001E2, (-8.38E1), 1.81601E2);
        ctx.bezierCurveTo((-8.58E1), 1.77201E2, (-8.89E1), 1.69301E2, (-8.89E1), 1.69301E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.7039E1), 1.73818E2);
        ctx.bezierCurveTo((-6.7039E1), 1.73818E2, (-6.1239E1), 1.75366E2, (-6.023E1), 1.77581E2);
        ctx.bezierCurveTo((-5.9222E1), 1.79795E2, (-6.1432E1), 1.83092E2, (-6.1432E1), 1.83092E2);
        ctx.bezierCurveTo((-6.1432E1), 1.83092E2, (-6.2432E1), 1.86397E2, (-6.3634E1), 1.84235E2);
        ctx.bezierCurveTo((-6.4836E1), 1.82072E2, (-6.7708E1), 1.74412E2, (-6.7039E1), 1.73818E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.7E1), 1.73601E2);
        ctx.bezierCurveTo((-6.7E1), 1.73601E2, (-6.34E1), 1.78801E2, (-5.98E1), 1.78801E2);
        ctx.bezierCurveTo((-5.62E1), 1.78801E2, (-5.5818E1), 1.78388E2, (-5.3E1), 1.79001E2);
        ctx.bezierCurveTo((-4.84E1), 1.80001E2, (-4.88E1), 1.78001E2, (-4.22E1), 1.79201E2);
        ctx.bezierCurveTo((-3.956E1), 1.79681E2, (-3.7E1), 1.78801E2, (-3.42E1), 1.80001E2);
        ctx.bezierCurveTo((-3.14E1), 1.81201E2, (-2.82E1), 1.80401E2, (-2.7E1), 1.78401E2);
        ctx.bezierCurveTo((-2.58E1), 1.76401E2, (-2.1E1), 1.72201E2, (-2.1E1), 1.72201E2);
        ctx.bezierCurveTo((-2.1E1), 1.72201E2, (-3.38E1), 1.74001E2, (-3.66E1), 1.74801E2);
        ctx.bezierCurveTo((-3.66E1), 1.74801E2, (-5.9E1), 1.76001E2, (-6.7E1), 1.73601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.24E1), 1.73801E2);
        ctx.bezierCurveTo((-2.24E1), 1.73801E2, (-2.885E1), 1.77301E2, (-2.925E1), 1.79701E2);
        ctx.bezierCurveTo((-2.965E1), 1.82101E2, (-2.4E1), 1.85801E2, (-2.4E1), 1.85801E2);
        ctx.bezierCurveTo((-2.4E1), 1.85801E2, (-2.125E1), 1.90401E2, (-2.065E1), 1.88001E2);
        ctx.bezierCurveTo((-2.005E1), 1.85601E2, (-2.16E1), 1.74201E2, (-2.24E1), 1.73801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.9885E1), 1.79265E2);
        ctx.bezierCurveTo((-5.9885E1), 1.79265E2, (-5.2878E1), 1.90453E2, (-5.2661E1), 1.79242E2);
        ctx.bezierCurveTo((-5.2661E1), 1.79242E2, (-5.2104E1), 1.77984E2, (-5.3864E1), 1.77962E2);
        ctx.bezierCurveTo((-5.9939E1), 1.77886E2, (-5.8418E1), 1.73784E2, (-5.9885E1), 1.79265E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.2707E1), 1.79514E2);
        ctx.bezierCurveTo((-5.2707E1), 1.79514E2, (-4.4786E1), 1.90701E2, (-4.5422E1), 1.79421E2);
        ctx.bezierCurveTo((-4.5422E1), 1.79421E2, (-4.5415E1), 1.79089E2, (-4.7168E1), 1.78936E2);
        ctx.bezierCurveTo((-5.1915E1), 1.78522E2, (-5.157E1), 1.74004E2, (-5.2707E1), 1.79514E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-4.5494E1), 1.79522E2);
        ctx.bezierCurveTo((-4.5494E1), 1.79522E2, (-3.7534E1), 1.9015E2, (-3.8203E1), 1.80484E2);
        ctx.bezierCurveTo((-3.8203E1), 1.80484E2, (-3.8084E1), 1.79251E2, (-3.9738E1), 1.7895E2);
        ctx.bezierCurveTo((-4.363E1), 1.78244E2, (-4.3841E1), 1.74995E2, (-4.5494E1), 1.79522E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffcc';
        ctx.fillStyle = 'rgba(255,255,204,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.8618E1), 1.79602E2);
        ctx.bezierCurveTo((-3.8618E1), 1.79602E2, (-3.0718E1), 1.91163E2, (-3.037E1), 1.81382E2);
        ctx.bezierCurveTo((-3.037E1), 1.81382E2, (-2.8726E1), 1.80004E2, (-3.0472E1), 1.79782E2);
        ctx.bezierCurveTo((-3.629E1), 1.79042E2, (-3.5492E1), 1.74588E2, (-3.8618E1), 1.79602E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#e5e5b2';
        ctx.fillStyle = 'rgba(229,229,178,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#e5e5b2';
        ctx.fillStyle = 'rgba(229,229,178,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.4792E1), 1.83132E2);
        ctx.lineTo((-8.245E1), 1.81601E2);
        ctx.bezierCurveTo((-8.505E1), 1.76601E2, (-8.715E1), 1.70451E2, (-8.715E1), 1.70451E2);
        ctx.bezierCurveTo((-8.715E1), 1.70451E2, (-8.08E1), 1.71451E2, (-6.83E1), 1.74251E2);
        ctx.bezierCurveTo((-6.83E1), 1.74251E2, (-6.7424E1), 1.77569E2, (-6.5952E1), 1.83364E2);
        ctx.lineTo((-7.4792E1), 1.83132E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#e5e5b2';
        ctx.fillStyle = 'rgba(229,229,178,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#e5e5b2';
        ctx.fillStyle = 'rgba(229,229,178,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.724E0), 1.7847E2);
        ctx.bezierCurveTo((-1.139E1), 1.75964E2, (-1.2707E1), 1.74206E2, (-1.3357E1), 1.738E2);
        ctx.bezierCurveTo((-1.637E1), 1.71917E2, (-1.2227E1), 1.72294E2, (-1.1098E1), 1.72294E2);
        ctx.bezierCurveTo((-1.1098E1), 1.72294E2, 5.473E0, 1.72294E2, 7.356E0, 1.73047E2);
        ctx.bezierCurveTo(7.356E0, 1.73047E2, 7.88E0, 1.75289E2, 8.564E0, 1.7868E2);
        ctx.bezierCurveTo(8.564E0, 1.7868E2, (-1.524E0), 1.7667E2, (-9.724E0), 1.7847E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.388E1, 4.0321E1);
        ctx.bezierCurveTo(7.1601E1, 4.4281E1, 9.7121E1, 8.641E0, 9.8881E1, (-1.04E0));
        ctx.bezierCurveTo(1.00641E2, (-1.072E1), 9.0521E1, (-2.26E1), 9.0521E1, (-2.26E1));
        ctx.bezierCurveTo(9.1841E1, (-2.568E1), 8.7001E1, (-3.976E1), 8.1721E1, (-4.9E1));
        ctx.bezierCurveTo(7.6441E1, (-5.824E1), 6.054E1, (-5.7266E1), 4.3E1, (-5.824E1));
        ctx.bezierCurveTo(2.716E1, (-5.912E1), 8.68E0, (-3.58E1), 7.36E0, (-3.404E1));
        ctx.bezierCurveTo(6.04E0, (-3.228E1), 1.22E1, 6.001E0, 1.352E1, 1.1721E1);
        ctx.bezierCurveTo(1.484E1, 1.7441E1, 1.22E1, 4.3841E1, 1.22E1, 4.3841E1);
        ctx.bezierCurveTo(4.644E1, 3.4741E1, 1.616E1, 3.6361E1, 4.388E1, 4.0321E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ea8e51';
        ctx.fillStyle = 'rgba(234,142,81,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ea8e51';
        ctx.fillStyle = 'rgba(234,142,81,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(8.088E0, (-3.3392E1));
        ctx.bezierCurveTo(6.792E0, (-3.1664E1), 1.284E1, 5.921E0, 1.4136E1, 1.1537E1);
        ctx.bezierCurveTo(1.5432E1, 1.7153E1, 1.284E1, 4.3073E1, 1.284E1, 4.3073E1);
        ctx.bezierCurveTo(4.5512E1, 3.4193E1, 1.6728E1, 3.5729E1, 4.3944E1, 3.9617E1);
        ctx.bezierCurveTo(7.1161E1, 4.3505E1, 9.6217E1, 8.513E0, 9.7945E1, (-9.92E-1));
        ctx.bezierCurveTo(9.9673E1, (-1.0496E1), 8.9737E1, (-2.216E1), 8.9737E1, (-2.216E1));
        ctx.bezierCurveTo(9.1033E1, (-2.5184E1), 8.6281E1, (-3.9008E1), 8.1097E1, (-4.808E1));
        ctx.bezierCurveTo(7.5913E1, (-5.7152E1), 6.0302E1, (-5.6195E1), 4.308E1, (-5.7152E1));
        ctx.bezierCurveTo(2.7528E1, (-5.8016E1), 9.384E0, (-3.512E1), 8.088E0, (-3.3392E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#efaa7c';
        ctx.fillStyle = 'rgba(239,170,124,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#efaa7c';
        ctx.fillStyle = 'rgba(239,170,124,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(8.816E0, (-3.2744E1));
        ctx.bezierCurveTo(7.544E0, (-3.1048E1), 1.348E1, 5.841E0, 1.4752E1, 1.1353E1);
        ctx.bezierCurveTo(1.6024E1, 1.6865E1, 1.348E1, 4.2305E1, 1.348E1, 4.2305E1);
        ctx.bezierCurveTo(4.4884E1, 3.3145E1, 1.7296E1, 3.5097E1, 4.4008E1, 3.8913E1);
        ctx.bezierCurveTo(7.0721E1, 4.2729E1, 9.5313E1, 8.385E0, 9.7009E1, (-9.44E-1));
        ctx.bezierCurveTo(9.8705E1, (-1.0272E1), 8.8953E1, (-2.172E1), 8.8953E1, (-2.172E1));
        ctx.bezierCurveTo(9.0225E1, (-2.4688E1), 8.5561E1, (-3.8256E1), 8.0473E1, (-4.716E1));
        ctx.bezierCurveTo(7.5385E1, (-5.6064E1), 6.0063E1, (-5.5125E1), 4.316E1, (-5.6064E1));
        ctx.bezierCurveTo(2.7896E1, (-5.6912E1), 1.0088E1, (-3.444E1), 8.816E0, (-3.2744E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#f4c6a8';
        ctx.fillStyle = 'rgba(244,198,168,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#f4c6a8';
        ctx.fillStyle = 'rgba(244,198,168,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(9.544E0, (-3.2096E1));
        ctx.bezierCurveTo(8.296E0, (-3.0432E1), 1.412E1, 5.761E0, 1.5368E1, 1.1169E1);
        ctx.bezierCurveTo(1.6616E1, 1.6577E1, 1.412E1, 4.1537E1, 1.412E1, 4.1537E1);
        ctx.bezierCurveTo(4.3556E1, 3.2497E1, 1.7864E1, 3.4465E1, 4.4072E1, 3.8209E1);
        ctx.bezierCurveTo(7.0281E1, 4.1953E1, 9.4409E1, 8.257E0, 9.6073E1, (-8.95E-1));
        ctx.bezierCurveTo(9.7737E1, (-1.0048E1), 8.8169E1, (-2.128E1), 8.8169E1, (-2.128E1));
        ctx.bezierCurveTo(8.9417E1, (-2.4192E1), 8.4841E1, (-3.7504E1), 7.9849E1, (-4.624E1));
        ctx.bezierCurveTo(7.4857E1, (-5.4976E1), 5.9824E1, (-5.4055E1), 4.324E1, (-5.4976E1));
        ctx.bezierCurveTo(2.8264E1, (-5.5808E1), 1.0792E1, (-3.376E1), 9.544E0, (-3.2096E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#f9e2d3';
        ctx.fillStyle = 'rgba(249,226,211,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#f9e2d3';
        ctx.fillStyle = 'rgba(249,226,211,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.0272E1, (-3.1448E1));
        ctx.bezierCurveTo(9.048E0, (-2.9816E1), 1.476E1, 5.681E0, 1.5984E1, 1.0985E1);
        ctx.bezierCurveTo(1.7208E1, 1.6289E1, 1.476E1, 4.0769E1, 1.476E1, 4.0769E1);
        ctx.bezierCurveTo(4.2628E1, 3.1849E1, 1.8432E1, 3.3833E1, 4.4136E1, 3.7505E1);
        ctx.bezierCurveTo(6.9841E1, 4.1177E1, 9.3505E1, 8.129E0, 9.5137E1, (-8.48E-1));
        ctx.bezierCurveTo(9.6769E1, (-9.824E0), 8.7385E1, (-2.084E1), 8.7385E1, (-2.084E1));
        ctx.bezierCurveTo(8.8609E1, (-2.3696E1), 8.4121E1, (-3.6752E1), 7.9225E1, (-4.532E1));
        ctx.bezierCurveTo(7.4329E1, (-5.3888E1), 5.9585E1, (-5.2985E1), 4.332E1, (-5.3888E1));
        ctx.bezierCurveTo(2.8632E1, (-5.4704E1), 1.1496E1, (-3.308E1), 1.0272E1, (-3.1448E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.42E1, 3.68E1);
        ctx.bezierCurveTo(6.94E1, 4.04E1, 9.2601E1, 8E0, 9.4201E1, (-8E-1));
        ctx.bezierCurveTo(9.5801E1, (-9.6E0), 8.6601E1, (-2.04E1), 8.6601E1, (-2.04E1));
        ctx.bezierCurveTo(8.7801E1, (-2.32E1), 8.34E1, (-3.6E1), 7.86E1, (-4.44E1));
        ctx.bezierCurveTo(7.38E1, (-5.28E1), 5.9346E1, (-5.1914E1), 4.34E1, (-5.28E1));
        ctx.bezierCurveTo(2.9E1, (-5.36E1), 1.22E1, (-3.24E1), 1.1E1, (-3.08E1));
        ctx.bezierCurveTo(9.8E0, (-2.92E1), 1.54E1, 5.6E0, 1.66E1, 1.08E1);
        ctx.bezierCurveTo(1.78E1, 1.6E1, 1.54E1, 4E1, 1.54E1, 4E1);
        ctx.bezierCurveTo(4.09E1, 3.14E1, 1.9E1, 3.32E1, 4.42E1, 3.68E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(9.0601E1, 2.8E0);
        ctx.bezierCurveTo(9.0601E1, 2.8E0, 6.28E1, 1.04E1, 5.12E1, 8.8E0);
        ctx.bezierCurveTo(5.12E1, 8.8E0, 3.54E1, 2.2E0, 2.66E1, 2.4E1);
        ctx.bezierCurveTo(2.66E1, 2.4E1, 2.3E1, 3.12E1, 2.1E1, 3.32E1);
        ctx.bezierCurveTo(1.9E1, 3.52E1, 9.0601E1, 2.8E0, 9.0601E1, 2.8E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(9.4401E1, 6E-1);
        ctx.bezierCurveTo(9.4401E1, 6E-1, 6.54E1, 1.28E1, 5.54E1, 1.24E1);
        ctx.bezierCurveTo(5.54E1, 1.24E1, 3.9E1, 7.8E0, 3.06E1, 2.24E1);
        ctx.bezierCurveTo(3.06E1, 2.24E1, 2.22E1, 3.16E1, 1.9E1, 3.32E1);
        ctx.bezierCurveTo(1.9E1, 3.32E1, 1.86E1, 3.48E1, 2.5E1, 3.08E1);
        ctx.lineTo(3.54E1, 3.6E1);
        ctx.bezierCurveTo(3.54E1, 3.6E1, 5.02E1, 4.56E1, 5.98E1, 2.96E1);
        ctx.bezierCurveTo(5.98E1, 2.96E1, 6.38E1, 1.84E1, 6.38E1, 1.64E1);
        ctx.bezierCurveTo(6.38E1, 1.44E1, 8.5E1, 8.8E0, 8.6601E1, 8.4E0);
        ctx.bezierCurveTo(8.8201E1, 8E0, 9.4801E1, 3.8E0, 9.4401E1, 6E-1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#99cc32';
        ctx.fillStyle = 'rgba(153,204,50,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#99cc32';
        ctx.fillStyle = 'rgba(153,204,50,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.7E1, 3.6514E1);
        ctx.bezierCurveTo(4.0128E1, 3.6514E1, 3.1755E1, 3.2649E1, 3.1755E1, 2.64E1);
        ctx.bezierCurveTo(3.1755E1, 2.0152E1, 4.0128E1, 1.3887E1, 4.7E1, 1.3887E1);
        ctx.bezierCurveTo(5.3874E1, 1.3887E1, 5.9446E1, 1.8952E1, 5.9446E1, 2.52E1);
        ctx.bezierCurveTo(5.9446E1, 3.1449E1, 5.3874E1, 3.6514E1, 4.7E1, 3.6514E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#659900';
        ctx.fillStyle = 'rgba(101,153,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#659900';
        ctx.fillStyle = 'rgba(101,153,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.3377E1, 1.983E1);
        ctx.bezierCurveTo(3.8531E1, 2.0552E1, 3.3442E1, 2.2055E1, 3.3514E1, 2.1839E1);
        ctx.bezierCurveTo(3.5054E1, 1.722E1, 4.1415E1, 1.3887E1, 4.7E1, 1.3887E1);
        ctx.bezierCurveTo(5.1296E1, 1.3887E1, 5.5084E1, 1.5865E1, 5.732E1, 1.8875E1);
        ctx.bezierCurveTo(5.732E1, 1.8875E1, 5.2004E1, 1.8545E1, 4.3377E1, 1.983E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.54E1, 1.96E1);
        ctx.bezierCurveTo(5.54E1, 1.96E1, 5.1E1, 1.64E1, 5.1E1, 1.86E1);
        ctx.bezierCurveTo(5.1E1, 1.86E1, 5.46E1, 2.3E1, 5.54E1, 1.96E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.54E1, 2.7726E1);
        ctx.bezierCurveTo(4.2901E1, 2.7726E1, 4.0875E1, 2.57E1, 4.0875E1, 2.32E1);
        ctx.bezierCurveTo(4.0875E1, 2.0701E1, 4.2901E1, 1.8675E1, 4.54E1, 1.8675E1);
        ctx.bezierCurveTo(4.79E1, 1.8675E1, 4.9926E1, 2.0701E1, 4.9926E1, 2.32E1);
        ctx.bezierCurveTo(4.9926E1, 2.57E1, 4.79E1, 2.7726E1, 4.54E1, 2.7726E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.86E1), 1.44E1);
        ctx.bezierCurveTo((-5.86E1), 1.44E1, (-6.18E1), (-6.8E0), (-5.94E1), (-1.12E1));
        ctx.bezierCurveTo((-5.94E1), (-1.12E1), (-4.86E1), (-2.12E1), (-4.9E1), (-2.48E1));
        ctx.bezierCurveTo((-4.9E1), (-2.48E1), (-4.94E1), (-4.28E1), (-5.06E1), (-4.36E1));
        ctx.bezierCurveTo((-5.18E1), (-4.44E1), (-5.94E1), (-5.04E1), (-6.54E1), (-4.4E1));
        ctx.bezierCurveTo((-6.54E1), (-4.4E1), (-7.58E1), (-2.6E1), (-7.5E1), (-1.96E1));
        ctx.lineTo((-7.5E1), (-1.76E1));
        ctx.bezierCurveTo((-7.5E1), (-1.76E1), (-8.26E1), (-1.8E1), (-8.42E1), (-1.6E1));
        ctx.bezierCurveTo((-8.42E1), (-1.6E1), (-8.54E1), (-1.08E1), (-8.66E1), (-1.04E1));
        ctx.bezierCurveTo((-8.66E1), (-1.04E1), (-8.94E1), (-8E0), (-8.74E1), (-5.2E0));
        ctx.bezierCurveTo((-8.74E1), (-5.2E0), (-8.94E1), (-2.8E0), (-8.9E1), 1.2E0);
        ctx.lineTo((-8.14E1), 5.2E0);
        ctx.bezierCurveTo((-8.14E1), 5.2E0, (-7.94E1), 1.96E1, (-6.86E1), 2.48E1);
        ctx.bezierCurveTo((-6.3764E1), 2.7129E1, (-6.06E1), 2.04E1, (-5.86E1), 1.44E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.96E1), 1.256E1);
        ctx.bezierCurveTo((-5.96E1), 1.256E1, (-6.248E1), (-6.52E0), (-6.032E1), (-1.048E1));
        ctx.bezierCurveTo((-6.032E1), (-1.048E1), (-5.06E1), (-1.948E1), (-5.096E1), (-2.272E1));
        ctx.bezierCurveTo((-5.096E1), (-2.272E1), (-5.132E1), (-3.892E1), (-5.24E1), (-3.964E1));
        ctx.bezierCurveTo((-5.348E1), (-4.036E1), (-6.032E1), (-4.576E1), (-6.572E1), (-4E1));
        ctx.bezierCurveTo((-6.572E1), (-4E1), (-7.508E1), (-2.38E1), (-7.436E1), (-1.804E1));
        ctx.lineTo((-7.436E1), (-1.624E1));
        ctx.bezierCurveTo((-7.436E1), (-1.624E1), (-8.12E1), (-1.66E1), (-8.264E1), (-1.48E1));
        ctx.bezierCurveTo((-8.264E1), (-1.48E1), (-8.372E1), (-1.012E1), (-8.48E1), (-9.76E0));
        ctx.bezierCurveTo((-8.48E1), (-9.76E0), (-8.732E1), (-7.6E0), (-8.552E1), (-5.08E0));
        ctx.bezierCurveTo((-8.552E1), (-5.08E0), (-8.732E1), (-2.92E0), (-8.696E1), 6.8E-1);
        ctx.lineTo((-8.012E1), 4.28E0);
        ctx.bezierCurveTo((-8.012E1), 4.28E0, (-7.832E1), 1.724E1, (-6.86E1), 2.192E1);
        ctx.bezierCurveTo((-6.4248E1), 2.4015E1, (-6.14E1), 1.796E1, (-5.96E1), 1.256E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#eb955c';
        ctx.fillStyle = 'rgba(235,149,92,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#eb955c';
        ctx.fillStyle = 'rgba(235,149,92,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.105E1), (-4.261E1));
        ctx.bezierCurveTo((-5.214E1), (-4.347E1), (-5.963E1), (-4.924E1), (-6.548E1), (-4.3E1));
        ctx.bezierCurveTo((-6.548E1), (-4.3E1), (-7.562E1), (-2.545E1), (-7.484E1), (-1.921E1));
        ctx.lineTo((-7.484E1), (-1.726E1));
        ctx.bezierCurveTo((-7.484E1), (-1.726E1), (-8.225E1), (-1.765E1), (-8.381E1), (-1.57E1));
        ctx.bezierCurveTo((-8.381E1), (-1.57E1), (-8.498E1), (-1.063E1), (-8.615E1), (-1.024E1));
        ctx.bezierCurveTo((-8.615E1), (-1.024E1), (-8.888E1), (-7.9E0), (-8.693E1), (-5.17E0));
        ctx.bezierCurveTo((-8.693E1), (-5.17E0), (-8.888E1), (-2.83E0), (-8.849E1), 1.07E0);
        ctx.lineTo((-8.108E1), 4.97E0);
        ctx.bezierCurveTo((-8.108E1), 4.97E0, (-7.913E1), 1.901E1, (-6.86E1), 2.408E1);
        ctx.bezierCurveTo((-6.3886E1), 2.635E1, (-6.08E1), 1.979E1, (-5.885E1), 1.394E1);
        ctx.bezierCurveTo((-5.885E1), 1.394E1, (-6.197E1), (-6.73E0), (-5.963E1), (-1.102E1));
        ctx.bezierCurveTo((-5.963E1), (-1.102E1), (-4.91E1), (-2.077E1), (-4.949E1), (-2.428E1));
        ctx.bezierCurveTo((-4.949E1), (-2.428E1), (-4.988E1), (-4.183E1), (-5.105E1), (-4.261E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#f2b892';
        ctx.fillStyle = 'rgba(242,184,146,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#f2b892';
        ctx.fillStyle = 'rgba(242,184,146,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.15E1), (-4.162E1));
        ctx.bezierCurveTo((-5.248E1), (-4.254E1), (-5.986E1), (-4.808E1), (-6.556E1), (-4.2E1));
        ctx.bezierCurveTo((-6.556E1), (-4.2E1), (-7.544E1), (-2.49E1), (-7.468E1), (-1.882E1));
        ctx.lineTo((-7.468E1), (-1.692E1));
        ctx.bezierCurveTo((-7.468E1), (-1.692E1), (-8.19E1), (-1.73E1), (-8.342E1), (-1.54E1));
        ctx.bezierCurveTo((-8.342E1), (-1.54E1), (-8.456E1), (-1.046E1), (-8.57E1), (-1.008E1));
        ctx.bezierCurveTo((-8.57E1), (-1.008E1), (-8.836E1), (-7.8E0), (-8.646E1), (-5.14E0));
        ctx.bezierCurveTo((-8.646E1), (-5.14E0), (-8.836E1), (-2.86E0), (-8.798E1), 9.4E-1);
        ctx.lineTo((-8.076E1), 4.74E0);
        ctx.bezierCurveTo((-8.076E1), 4.74E0, (-7.886E1), 1.842E1, (-6.86E1), 2.336E1);
        ctx.bezierCurveTo((-6.4006E1), 2.5572E1, (-6.1E1), 1.918E1, (-5.91E1), 1.348E1);
        ctx.bezierCurveTo((-5.91E1), 1.348E1, (-6.214E1), (-6.66E0), (-5.986E1), (-1.084E1));
        ctx.bezierCurveTo((-5.986E1), (-1.084E1), (-4.96E1), (-2.034E1), (-4.998E1), (-2.376E1));
        ctx.bezierCurveTo((-4.998E1), (-2.376E1), (-5.036E1), (-4.086E1), (-5.15E1), (-4.162E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#f8dcc8';
        ctx.fillStyle = 'rgba(248,220,200,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#f8dcc8';
        ctx.fillStyle = 'rgba(248,220,200,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.195E1), (-4.063E1));
        ctx.bezierCurveTo((-5.282E1), (-4.161E1), (-6.009E1), (-4.692E1), (-6.564E1), (-4.1E1));
        ctx.bezierCurveTo((-6.564E1), (-4.1E1), (-7.526E1), (-2.435E1), (-7.452E1), (-1.843E1));
        ctx.lineTo((-7.452E1), (-1.658E1));
        ctx.bezierCurveTo((-7.452E1), (-1.658E1), (-8.155E1), (-1.695E1), (-8.303E1), (-1.51E1));
        ctx.bezierCurveTo((-8.303E1), (-1.51E1), (-8.414E1), (-1.029E1), (-8.525E1), (-9.92E0));
        ctx.bezierCurveTo((-8.525E1), (-9.92E0), (-8.784E1), (-7.7E0), (-8.599E1), (-5.11E0));
        ctx.bezierCurveTo((-8.599E1), (-5.11E0), (-8.784E1), (-2.89E0), (-8.747E1), 8.1E-1);
        ctx.lineTo((-8.044E1), 4.51E0);
        ctx.bezierCurveTo((-8.044E1), 4.51E0, (-7.859E1), 1.783E1, (-6.86E1), 2.264E1);
        ctx.bezierCurveTo((-6.4127E1), 2.4794E1, (-6.12E1), 1.857E1, (-5.935E1), 1.302E1);
        ctx.bezierCurveTo((-5.935E1), 1.302E1, (-6.231E1), (-6.59E0), (-6.009E1), (-1.066E1));
        ctx.bezierCurveTo((-6.009E1), (-1.066E1), (-5.01E1), (-1.991E1), (-5.047E1), (-2.324E1));
        ctx.bezierCurveTo((-5.047E1), (-2.324E1), (-5.084E1), (-3.989E1), (-5.195E1), (-4.063E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.96E1), 1.246E1);
        ctx.bezierCurveTo((-5.96E1), 1.246E1, (-6.248E1), (-6.52E0), (-6.032E1), (-1.048E1));
        ctx.bezierCurveTo((-6.032E1), (-1.048E1), (-5.06E1), (-1.948E1), (-5.096E1), (-2.272E1));
        ctx.bezierCurveTo((-5.096E1), (-2.272E1), (-5.132E1), (-3.892E1), (-5.24E1), (-3.964E1));
        ctx.bezierCurveTo((-5.316E1), (-4.068E1), (-6.032E1), (-4.576E1), (-6.572E1), (-4E1));
        ctx.bezierCurveTo((-6.572E1), (-4E1), (-7.508E1), (-2.38E1), (-7.436E1), (-1.804E1));
        ctx.lineTo((-7.436E1), (-1.624E1));
        ctx.bezierCurveTo((-7.436E1), (-1.624E1), (-8.12E1), (-1.66E1), (-8.264E1), (-1.48E1));
        ctx.bezierCurveTo((-8.264E1), (-1.48E1), (-8.372E1), (-1.012E1), (-8.48E1), (-9.76E0));
        ctx.bezierCurveTo((-8.48E1), (-9.76E0), (-8.732E1), (-7.6E0), (-8.552E1), (-5.08E0));
        ctx.bezierCurveTo((-8.552E1), (-5.08E0), (-8.732E1), (-2.92E0), (-8.696E1), 6.8E-1);
        ctx.lineTo((-8.012E1), 4.28E0);
        ctx.bezierCurveTo((-8.012E1), 4.28E0, (-7.832E1), 1.724E1, (-6.86E1), 2.192E1);
        ctx.bezierCurveTo((-6.4248E1), 2.4015E1, (-6.14E1), 1.786E1, (-5.96E1), 1.246E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.27E1), 6.2E0);
        ctx.bezierCurveTo((-6.27E1), 6.2E0, (-8.43E1), (-4E0), (-8.52E1), (-4.8E0));
        ctx.bezierCurveTo((-8.52E1), (-4.8E0), (-7.61E1), 3.4E0, (-7.53E1), 3.4E0);
        ctx.bezierCurveTo((-7.45E1), 3.4E0, (-6.27E1), 6.2E0, (-6.27E1), 6.2E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.98E1), 0E0);
        ctx.bezierCurveTo((-7.98E1), 0E0, (-6.14E1), 3.6E0, (-6.14E1), 8E0);
        ctx.bezierCurveTo((-6.14E1), 1.0912E1, (-6.1643E1), 2.4331E1, (-6.7E1), 2.28E1);
        ctx.bezierCurveTo((-7.54E1), 2.04E1, (-7.18E1), 6E0, (-7.98E1), 0E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#99cc32';
        ctx.fillStyle = 'rgba(153,204,50,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#99cc32';
        ctx.fillStyle = 'rgba(153,204,50,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.14E1), 3.8E0);
        ctx.bezierCurveTo((-7.14E1), 3.8E0, (-6.2422E1), 5.274E0, (-6.14E1), 8E0);
        ctx.bezierCurveTo((-6.08E1), 9.6E0, (-6.0137E1), 1.7908E1, (-6.56E1), 1.9E1);
        ctx.bezierCurveTo((-7.0152E1), 1.9911E1, (-7.2382E1), 9.69E0, (-7.14E1), 3.8E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.4595E1, 4.6349E1);
        ctx.bezierCurveTo(1.4098E1, 4.4607E1, 1.5409E1, 4.4738E1, 1.72E1, 4.42E1);
        ctx.bezierCurveTo(1.92E1, 4.36E1, 3.14E1, 3.98E1, 3.22E1, 3.72E1);
        ctx.bezierCurveTo(3.3E1, 3.46E1, 4.62E1, 3.9E1, 4.62E1, 3.9E1);
        ctx.bezierCurveTo(4.8E1, 3.98E1, 5.24E1, 4.24E1, 5.24E1, 4.24E1);
        ctx.bezierCurveTo(5.72E1, 4.36E1, 6.38E1, 4.4E1, 6.38E1, 4.4E1);
        ctx.bezierCurveTo(6.62E1, 4.5E1, 6.96E1, 4.78E1, 6.96E1, 4.78E1);
        ctx.bezierCurveTo(8.42E1, 5.8E1, 9.6601E1, 5.08E1, 9.6601E1, 5.08E1);
        ctx.bezierCurveTo(1.16601E2, 4.42E1, 1.10601E2, 2.7E1, 1.10601E2, 2.7E1);
        ctx.bezierCurveTo(1.07601E2, 1.8E1, 1.10801E2, 1.46E1, 1.10801E2, 1.46E1);
        ctx.bezierCurveTo(1.11001E2, 1.08E1, 1.18201E2, 1.72E1, 1.18201E2, 1.72E1);
        ctx.bezierCurveTo(1.20801E2, 2.14E1, 1.21601E2, 2.64E1, 1.21601E2, 2.64E1);
        ctx.bezierCurveTo(1.29601E2, 3.76E1, 1.26201E2, 1.98E1, 1.26201E2, 1.98E1);
        ctx.bezierCurveTo(1.26401E2, 1.88E1, 1.23601E2, 1.52E1, 1.23601E2, 1.4E1);
        ctx.bezierCurveTo(1.23601E2, 1.28E1, 1.21801E2, 9.4E0, 1.21801E2, 9.4E0);
        ctx.bezierCurveTo(1.18801E2, 6E0, 1.21201E2, (-1E0), 1.21201E2, (-1E0));
        ctx.bezierCurveTo(1.23001E2, (-1.48E1), 1.20801E2, (-1.3E1), 1.20801E2, (-1.3E1));
        ctx.bezierCurveTo(1.19601E2, (-1.48E1), 1.10401E2, (-4.8E0), 1.10401E2, (-4.8E0));
        ctx.bezierCurveTo(1.08201E2, (-1.4E0), 1.02201E2, 2E-1, 1.02201E2, 2E-1);
        ctx.bezierCurveTo(9.9401E1, 2E0, 9.6001E1, 6E-1, 9.6001E1, 6E-1);
        ctx.bezierCurveTo(9.3401E1, 2E-1, 8.7801E1, 7.2E0, 8.7801E1, 7.2E0);
        ctx.bezierCurveTo(9.0601E1, 7E0, 9.3001E1, 1.14E1, 9.5401E1, 1.16E1);
        ctx.bezierCurveTo(9.7801E1, 1.18E1, 9.9601E1, 9.2E0, 1.01201E2, 8.6E0);
        ctx.bezierCurveTo(1.02801E2, 8E0, 1.05601E2, 1.38E1, 1.05601E2, 1.38E1);
        ctx.bezierCurveTo(1.06001E2, 1.64E1, 1.00401E2, 2.12E1, 1.00401E2, 2.12E1);
        ctx.bezierCurveTo(1.00001E2, 2.58E1, 9.8401E1, 2.42E1, 9.8401E1, 2.42E1);
        ctx.bezierCurveTo(9.5401E1, 2.36E1, 9.4201E1, 2.74E1, 9.3201E1, 3.2E1);
        ctx.bezierCurveTo(9.2201E1, 3.66E1, 8.8001E1, 3.7E1, 8.8001E1, 3.7E1);
        ctx.bezierCurveTo(8.6401E1, 4.44E1, 8.52E1, 4.14E1, 8.52E1, 4.14E1);
        ctx.bezierCurveTo(8.5E1, 3.58E1, 7.9E1, 4.16E1, 7.9E1, 4.16E1);
        ctx.bezierCurveTo(7.78E1, 4.36E1, 7.32E1, 4.14E1, 7.32E1, 4.14E1);
        ctx.bezierCurveTo(6.64E1, 3.94E1, 6.88E1, 3.74E1, 6.88E1, 3.74E1);
        ctx.bezierCurveTo(7.06E1, 3.52E1, 8.18E1, 3.74E1, 8.18E1, 3.74E1);
        ctx.bezierCurveTo(8.4E1, 3.58E1, 7.6E1, 3.18E1, 7.6E1, 3.18E1);
        ctx.bezierCurveTo(7.54E1, 3E1, 7.64E1, 2.56E1, 7.64E1, 2.56E1);
        ctx.bezierCurveTo(7.76E1, 2.24E1, 8.44E1, 1.68E1, 8.44E1, 1.68E1);
        ctx.bezierCurveTo(9.3801E1, 1.56E1, 9.1001E1, 1.4E1, 9.1001E1, 1.4E1);
        ctx.bezierCurveTo(8.4801E1, 8.8E0, 7.9E1, 1.64E1, 7.9E1, 1.64E1);
        ctx.bezierCurveTo(7.68E1, 2.26E1, 5.94E1, 3.76E1, 5.94E1, 3.76E1);
        ctx.bezierCurveTo(5.46E1, 4.1E1, 5.72E1, 3.42E1, 5.32E1, 3.76E1);
        ctx.bezierCurveTo(4.92E1, 4.1E1, 2.86E1, 3.2E1, 2.86E1, 3.2E1);
        ctx.bezierCurveTo(1.7038E1, 3.0807E1, 1.4306E1, 4.6549E1, 1.0777E1, 4.3429E1);
        ctx.bezierCurveTo(1.0777E1, 4.3429E1, 1.6195E1, 5.1949E1, 1.4595E1, 4.6349E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.09401E2, (-1.2E2));
        ctx.bezierCurveTo(2.09401E2, (-1.2E2), 1.83801E2, (-1.12E2), 1.81001E2, (-9.32E1));
        ctx.bezierCurveTo(1.81001E2, (-9.32E1), 1.78601E2, (-7.04E1), 1.99001E2, (-5.28E1));
        ctx.bezierCurveTo(1.99001E2, (-5.28E1), 1.99401E2, (-4.64E1), 2.01401E2, (-4.32E1));
        ctx.bezierCurveTo(2.01401E2, (-4.32E1), 1.99801E2, (-3.84E1), 2.18601E2, (-4.6E1));
        ctx.lineTo(2.45801E2, (-5.44E1));
        ctx.bezierCurveTo(2.45801E2, (-5.44E1), 2.52201E2, (-5.68E1), 2.57401E2, (-6.56E1));
        ctx.bezierCurveTo(2.62601E2, (-7.44E1), 2.77801E2, (-9.32E1), 2.74201E2, (-1.184E2));
        ctx.bezierCurveTo(2.74201E2, (-1.184E2), 2.75401E2, (-1.296E2), 2.69401E2, (-1.3E2));
        ctx.bezierCurveTo(2.69401E2, (-1.3E2), 2.61001E2, (-1.316E2), 2.53801E2, (-1.24E2));
        ctx.bezierCurveTo(2.53801E2, (-1.24E2), 2.47001E2, (-1.208E2), 2.44601E2, (-1.212E2));
        ctx.lineTo(2.09401E2, (-1.2E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.64022E2, (-1.2099E2));
        ctx.bezierCurveTo(2.64022E2, (-1.2099E2), 2.66122E2, (-1.2992E2), 2.61282E2, (-1.2508E2));
        ctx.bezierCurveTo(2.61282E2, (-1.2508E2), 2.54242E2, (-1.1936E2), 2.46761E2, (-1.1936E2));
        ctx.bezierCurveTo(2.46761E2, (-1.1936E2), 2.32241E2, (-1.1716E2), 2.27841E2, (-1.0396E2));
        ctx.bezierCurveTo(2.27841E2, (-1.0396E2), 2.23881E2, (-7.712E1), 2.31801E2, (-7.14E1));
        ctx.bezierCurveTo(2.31801E2, (-7.14E1), 2.36641E2, (-6.392E1), 2.43681E2, (-7.052E1));
        ctx.bezierCurveTo(2.50722E2, (-7.712E1), 2.66222E2, (-1.0735E2), 2.64022E2, (-1.2099E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#323232';
        ctx.fillStyle = 'rgba(50,50,50,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#323232';
        ctx.fillStyle = 'rgba(50,50,50,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.63648E2, (-1.20632E2));
        ctx.bezierCurveTo(2.63648E2, (-1.20632E2), 2.65738E2, (-1.29376E2), 2.60986E2, (-1.24624E2));
        ctx.bezierCurveTo(2.60986E2, (-1.24624E2), 2.54074E2, (-1.19008E2), 2.46729E2, (-1.19008E2));
        ctx.bezierCurveTo(2.46729E2, (-1.19008E2), 2.32473E2, (-1.16848E2), 2.28153E2, (-1.03888E2));
        ctx.bezierCurveTo(2.28153E2, (-1.03888E2), 2.24265E2, (-7.7536E1), 2.32041E2, (-7.192E1));
        ctx.bezierCurveTo(2.32041E2, (-7.192E1), 2.36793E2, (-6.4576E1), 2.43705E2, (-7.1056E1));
        ctx.bezierCurveTo(2.50618E2, (-7.7536E1), 2.65808E2, (-1.0724E2), 2.63648E2, (-1.20632E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#666666';
        ctx.fillStyle = 'rgba(102,102,102,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#666666';
        ctx.fillStyle = 'rgba(102,102,102,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.63274E2, (-1.20274E2));
        ctx.bezierCurveTo(2.63274E2, (-1.20274E2), 2.65354E2, (-1.28832E2), 2.6069E2, (-1.24168E2));
        ctx.bezierCurveTo(2.6069E2, (-1.24168E2), 2.53906E2, (-1.18656E2), 2.46697E2, (-1.18656E2));
        ctx.bezierCurveTo(2.46697E2, (-1.18656E2), 2.32705E2, (-1.16536E2), 2.28465E2, (-1.03816E2));
        ctx.bezierCurveTo(2.28465E2, (-1.03816E2), 2.24649E2, (-7.7952E1), 2.32281E2, (-7.244E1));
        ctx.bezierCurveTo(2.32281E2, (-7.244E1), 2.36945E2, (-6.5232E1), 2.43729E2, (-7.1592E1));
        ctx.bezierCurveTo(2.50514E2, (-7.7952E1), 2.65394E2, (-1.0713E2), 2.63274E2, (-1.20274E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#999999';
        ctx.fillStyle = 'rgba(153,153,153,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#999999';
        ctx.fillStyle = 'rgba(153,153,153,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.629E2, (-1.19916E2));
        ctx.bezierCurveTo(2.629E2, (-1.19916E2), 2.6497E2, (-1.28288E2), 2.60394E2, (-1.23712E2));
        ctx.bezierCurveTo(2.60394E2, (-1.23712E2), 2.53738E2, (-1.18304E2), 2.46665E2, (-1.18304E2));
        ctx.bezierCurveTo(2.46665E2, (-1.18304E2), 2.32937E2, (-1.16224E2), 2.28777E2, (-1.03744E2));
        ctx.bezierCurveTo(2.28777E2, (-1.03744E2), 2.25033E2, (-7.8368E1), 2.32521E2, (-7.296E1));
        ctx.bezierCurveTo(2.32521E2, (-7.296E1), 2.37097E2, (-6.5888E1), 2.43753E2, (-7.2128E1));
        ctx.bezierCurveTo(2.5041E2, (-7.8368E1), 2.6498E2, (-1.0702E2), 2.629E2, (-1.19916E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.62526E2, (-1.19558E2));
        ctx.bezierCurveTo(2.62526E2, (-1.19558E2), 2.64586E2, (-1.27744E2), 2.60098E2, (-1.23256E2));
        ctx.bezierCurveTo(2.60098E2, (-1.23256E2), 2.53569E2, (-1.17952E2), 2.46633E2, (-1.17952E2));
        ctx.bezierCurveTo(2.46633E2, (-1.17952E2), 2.33169E2, (-1.15912E2), 2.29089E2, (-1.03672E2));
        ctx.bezierCurveTo(2.29089E2, (-1.03672E2), 2.25417E2, (-7.8784E1), 2.32761E2, (-7.348E1));
        ctx.bezierCurveTo(2.32761E2, (-7.348E1), 2.37249E2, (-6.6544E1), 2.43777E2, (-7.2664E1));
        ctx.bezierCurveTo(2.50305E2, (-7.8784E1), 2.64566E2, (-1.0691E2), 2.62526E2, (-1.19558E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.62151E2, (-1.192E2));
        ctx.bezierCurveTo(2.62151E2, (-1.192E2), 2.64201E2, (-1.272E2), 2.59801E2, (-1.228E2));
        ctx.bezierCurveTo(2.59801E2, (-1.228E2), 2.53401E2, (-1.176E2), 2.46601E2, (-1.176E2));
        ctx.bezierCurveTo(2.46601E2, (-1.176E2), 2.33401E2, (-1.156E2), 2.29401E2, (-1.036E2));
        ctx.bezierCurveTo(2.29401E2, (-1.036E2), 2.25801E2, (-7.92E1), 2.33001E2, (-7.4E1));
        ctx.bezierCurveTo(2.33001E2, (-7.4E1), 2.37401E2, (-6.72E1), 2.43801E2, (-7.32E1));
        ctx.bezierCurveTo(2.50201E2, (-7.92E1), 2.64151E2, (-1.068E2), 2.62151E2, (-1.192E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.06E1, 8.4E1);
        ctx.bezierCurveTo(5.06E1, 8.4E1, 3.02E1, 6.48E1, 2.22E1, 6.4E1);
        ctx.bezierCurveTo(2.22E1, 6.4E1, (-1.22E1), 6E1, (-2.7E1), 7.8E1);
        ctx.bezierCurveTo((-2.7E1), 7.8E1, (-9.4E0), 5.76E1, 1.82E1, 6.32E1);
        ctx.bezierCurveTo(1.82E1, 6.32E1, (-3.4E0), 5.88E1, (-1.58E1), 6.2E1);
        ctx.bezierCurveTo((-1.58E1), 6.2E1, (-3.26E1), 6.2E1, (-4.22E1), 7.6E1);
        ctx.lineTo((-4.5E1), 8.08E1);
        ctx.bezierCurveTo((-4.5E1), 8.08E1, (-4.1E1), 6.6E1, (-2.26E1), 6E1);
        ctx.bezierCurveTo((-2.26E1), 6E1, 2E-1, 5.52E1, 1.1E1, 6E1);
        ctx.bezierCurveTo(1.1E1, 6E1, (-1.06E1), 5.32E1, (-2.06E1), 5.52E1);
        ctx.bezierCurveTo((-2.06E1), 5.52E1, (-5.1E1), 5.28E1, (-6.38E1), 7.92E1);
        ctx.bezierCurveTo((-6.38E1), 7.92E1, (-5.98E1), 6.48E1, (-4.5E1), 5.76E1);
        ctx.bezierCurveTo((-4.5E1), 5.76E1, (-3.14E1), 4.88E1, (-1.1E1), 5.16E1);
        ctx.bezierCurveTo((-1.1E1), 5.16E1, 3.4E0, 5.48E1, 8.6E0, 5.72E1);
        ctx.bezierCurveTo(1.38E1, 5.96E1, 1.26E1, 5.68E1, 4.2E0, 5.2E1);
        ctx.bezierCurveTo(4.2E0, 5.2E1, (-1.4E0), 4.2E1, (-1.54E1), 4.24E1);
        ctx.bezierCurveTo((-1.54E1), 4.24E1, (-5.82E1), 4.6E1, (-6.86E1), 5.8E1);
        ctx.bezierCurveTo((-6.86E1), 5.8E1, (-5.5E1), 4.68E1, (-4.46E1), 4.4E1);
        ctx.bezierCurveTo((-4.46E1), 4.4E1, (-2.22E1), 3.6E1, (-1.38E1), 3.68E1);
        ctx.bezierCurveTo((-1.38E1), 3.68E1, 1.1E1, 3.78E1, 1.86E1, 3.38E1);
        ctx.bezierCurveTo(1.86E1, 3.38E1, 7.4E0, 3.88E1, 1.06E1, 4.2E1);
        ctx.bezierCurveTo(1.38E1, 4.52E1, 2.06E1, 5.28E1, 2.06E1, 5.4E1);
        ctx.bezierCurveTo(2.06E1, 5.52E1, 4.48E1, 7.73E1, 4.84E1, 8.17E1);
        ctx.lineTo(5.06E1, 8.4E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.89E2, 2.78E2);
        ctx.bezierCurveTo(1.89E2, 2.78E2, 1.735E2, 2.415E2, 1.61E2, 2.32E2);
        ctx.bezierCurveTo(1.61E2, 2.32E2, 1.87E2, 2.48E2, 1.905E2, 2.66E2);
        ctx.bezierCurveTo(1.905E2, 2.66E2, 1.905E2, 2.76E2, 1.89E2, 2.78E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.36E2, 2.855E2);
        ctx.bezierCurveTo(2.36E2, 2.855E2, 2.095E2, 2.305E2, 1.91E2, 2.065E2);
        ctx.bezierCurveTo(1.91E2, 2.065E2, 2.345E2, 2.44E2, 2.395E2, 2.705E2);
        ctx.lineTo(2.4E2, 2.76E2);
        ctx.lineTo(2.37E2, 2.735E2);
        ctx.bezierCurveTo(2.37E2, 2.735E2, 2.365E2, 2.825E2, 2.36E2, 2.855E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.925E2, 2.37E2);
        ctx.bezierCurveTo(2.925E2, 2.37E2, 2.3E2, 1.775E2, 2.285E2, 1.75E2);
        ctx.bezierCurveTo(2.285E2, 1.75E2, 2.89E2, 2.41E2, 2.92E2, 2.485E2);
        ctx.bezierCurveTo(2.92E2, 2.485E2, 2.9E2, 2.395E2, 2.925E2, 2.37E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.04E2, 2.805E2);
        ctx.bezierCurveTo(1.04E2, 2.805E2, 1.235E2, 2.285E2, 1.425E2, 2.51E2);
        ctx.bezierCurveTo(1.425E2, 2.51E2, 1.575E2, 2.61E2, 1.57E2, 2.64E2);
        ctx.bezierCurveTo(1.57E2, 2.64E2, 1.53E2, 2.575E2, 1.35E2, 2.58E2);
        ctx.bezierCurveTo(1.35E2, 2.58E2, 1.16E2, 2.55E2, 1.04E2, 2.805E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.945E2, 1.53E2);
        ctx.bezierCurveTo(2.945E2, 1.53E2, 2.495E2, 1.245E2, 2.42E2, 1.23E2);
        ctx.bezierCurveTo(2.30193E2, 1.20639E2, 2.915E2, 1.52E2, 2.965E2, 1.625E2);
        ctx.bezierCurveTo(2.965E2, 1.625E2, 2.985E2, 1.6E2, 2.945E2, 1.53E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.43801E2, 2.59601E2);
        ctx.bezierCurveTo(1.43801E2, 2.59601E2, 1.64201E2, 2.57601E2, 1.71001E2, 2.50801E2);
        ctx.lineTo(1.75401E2, 2.54401E2);
        ctx.lineTo(1.93001E2, 2.16001E2);
        ctx.lineTo(1.96601E2, 2.21201E2);
        ctx.bezierCurveTo(1.96601E2, 2.21201E2, 2.11001E2, 2.06401E2, 2.10201E2, 1.98401E2);
        ctx.bezierCurveTo(2.09401E2, 1.90401E2, 2.23001E2, 2.04401E2, 2.23001E2, 2.04401E2);
        ctx.bezierCurveTo(2.23001E2, 2.04401E2, 2.22201E2, 1.92801E2, 2.29401E2, 1.99601E2);
        ctx.bezierCurveTo(2.29401E2, 1.99601E2, 2.27001E2, 1.84001E2, 2.35401E2, 1.92001E2);
        ctx.bezierCurveTo(2.35401E2, 1.92001E2, 2.24864E2, 1.61844E2, 2.47401E2, 1.87601E2);
        ctx.bezierCurveTo(2.53001E2, 1.94001E2, 2.48601E2, 1.87201E2, 2.48601E2, 1.87201E2);
        ctx.bezierCurveTo(2.48601E2, 1.87201E2, 2.22601E2, 1.39201E2, 2.44201E2, 1.53601E2);
        ctx.bezierCurveTo(2.44201E2, 1.53601E2, 2.46201E2, 1.30801E2, 2.45001E2, 1.26401E2);
        ctx.bezierCurveTo(2.43801E2, 1.22001E2, 2.41801E2, 9.96E1, 2.37001E2, 9.44E1);
        ctx.bezierCurveTo(2.32201E2, 8.92E1, 2.37401E2, 8.76E1, 2.43001E2, 9.28E1);
        ctx.bezierCurveTo(2.43001E2, 9.28E1, 2.31801E2, 6.88E1, 2.45001E2, 8.08E1);
        ctx.bezierCurveTo(2.45001E2, 8.08E1, 2.41401E2, 6.56E1, 2.37001E2, 6.28E1);
        ctx.bezierCurveTo(2.37001E2, 6.28E1, 2.31401E2, 4.56E1, 2.46601E2, 5.64E1);
        ctx.bezierCurveTo(2.46601E2, 5.64E1, 2.42201E2, 4.4E1, 2.39001E2, 4.08E1);
        ctx.bezierCurveTo(2.39001E2, 4.08E1, 2.27401E2, 1.32E1, 2.34601E2, 1.8E1);
        ctx.lineTo(2.39001E2, 2.16E1);
        ctx.bezierCurveTo(2.39001E2, 2.16E1, 2.32201E2, 7.6E0, 2.38601E2, 1.2E1);
        ctx.bezierCurveTo(2.45001E2, 1.64E1, 2.45001E2, 1.6E1, 2.45001E2, 1.6E1);
        ctx.bezierCurveTo(2.45001E2, 1.6E1, 2.23801E2, (-1.72E1), 2.44201E2, 4E-1);
        ctx.bezierCurveTo(2.44201E2, 4E-1, 2.36042E2, (-1.3518E1), 2.32601E2, (-2.04E1));
        ctx.bezierCurveTo(2.32601E2, (-2.04E1), 2.13801E2, (-4.08E1), 2.28201E2, (-3.44E1));
        ctx.lineTo(2.33001E2, (-3.28E1));
        ctx.bezierCurveTo(2.33001E2, (-3.28E1), 2.24201E2, (-4.28E1), 2.16201E2, (-4.44E1));
        ctx.bezierCurveTo(2.08201E2, (-4.6E1), 2.18601E2, (-5.24E1), 2.25001E2, (-5.04E1));
        ctx.bezierCurveTo(2.31401E2, (-4.84E1), 2.47001E2, (-4.08E1), 2.47001E2, (-4.08E1));
        ctx.bezierCurveTo(2.47001E2, (-4.08E1), 2.59801E2, (-2.2E1), 2.63801E2, (-2.16E1));
        ctx.bezierCurveTo(2.63801E2, (-2.16E1), 2.43801E2, (-2.92E1), 2.49801E2, (-2.12E1));
        ctx.bezierCurveTo(2.49801E2, (-2.12E1), 2.64201E2, (-7.2E0), 2.57001E2, (-7.6E0));
        ctx.bezierCurveTo(2.57001E2, (-7.6E0), 2.51001E2, (-4E-1), 2.55801E2, 8.4E0);
        ctx.bezierCurveTo(2.55801E2, 8.4E0, 2.37342E2, (-9.991E0), 2.52201E2, 1.56E1);
        ctx.lineTo(2.59001E2, 3.2E1);
        ctx.bezierCurveTo(2.59001E2, 3.2E1, 2.34601E2, 7.2E0, 2.45801E2, 2.92E1);
        ctx.bezierCurveTo(2.45801E2, 2.92E1, 2.63001E2, 5.28E1, 2.65001E2, 5.32E1);
        ctx.bezierCurveTo(2.67001E2, 5.36E1, 2.71401E2, 6.24E1, 2.71401E2, 6.24E1);
        ctx.lineTo(2.67001E2, 6.04E1);
        ctx.lineTo(2.72201E2, 6.92E1);
        ctx.bezierCurveTo(2.72201E2, 6.92E1, 2.61001E2, 5.72E1, 2.67001E2, 7.04E1);
        ctx.lineTo(2.72601E2, 8.48E1);
        ctx.bezierCurveTo(2.72601E2, 8.48E1, 2.52201E2, 6.28E1, 2.65801E2, 9.24E1);
        ctx.bezierCurveTo(2.65801E2, 9.24E1, 2.49401E2, 8.72E1, 2.58201E2, 1.044E2);
        ctx.bezierCurveTo(2.58201E2, 1.044E2, 2.56601E2, 1.20401E2, 2.57001E2, 1.25601E2);
        ctx.bezierCurveTo(2.57401E2, 1.30801E2, 2.58601E2, 1.59201E2, 2.54201E2, 1.67201E2);
        ctx.bezierCurveTo(2.49801E2, 1.75201E2, 2.60201E2, 1.94401E2, 2.62201E2, 1.98401E2);
        ctx.bezierCurveTo(2.64201E2, 2.02401E2, 2.67801E2, 2.13201E2, 2.59001E2, 2.04001E2);
        ctx.bezierCurveTo(2.50201E2, 1.94801E2, 2.54601E2, 2.00401E2, 2.56601E2, 2.09201E2);
        ctx.bezierCurveTo(2.58601E2, 2.18001E2, 2.64601E2, 2.33601E2, 2.63801E2, 2.39201E2);
        ctx.bezierCurveTo(2.63801E2, 2.39201E2, 2.62601E2, 2.40401E2, 2.59401E2, 2.36801E2);
        ctx.bezierCurveTo(2.59401E2, 2.36801E2, 2.44601E2, 2.14001E2, 2.46201E2, 2.28401E2);
        ctx.bezierCurveTo(2.46201E2, 2.28401E2, 2.45001E2, 2.36401E2, 2.41801E2, 2.45201E2);
        ctx.bezierCurveTo(2.41801E2, 2.45201E2, 2.38601E2, 2.56001E2, 2.38601E2, 2.47201E2);
        ctx.bezierCurveTo(2.38601E2, 2.47201E2, 2.35401E2, 2.30401E2, 2.32601E2, 2.38001E2);
        ctx.bezierCurveTo(2.29801E2, 2.45601E2, 2.26201E2, 2.51601E2, 2.23401E2, 2.54001E2);
        ctx.bezierCurveTo(2.20601E2, 2.56401E2, 2.15401E2, 2.33601E2, 2.14201E2, 2.44001E2);
        ctx.bezierCurveTo(2.14201E2, 2.44001E2, 2.02201E2, 2.31601E2, 1.97401E2, 2.48001E2);
        ctx.lineTo(1.85801E2, 2.64401E2);
        ctx.bezierCurveTo(1.85801E2, 2.64401E2, 1.85401E2, 2.52001E2, 1.84201E2, 2.58001E2);
        ctx.bezierCurveTo(1.84201E2, 2.58001E2, 1.54201E2, 2.64001E2, 1.43801E2, 2.59601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.09401E2, (-9.72E1));
        ctx.bezierCurveTo(1.09401E2, (-9.72E1), 9.7801E1, (-1.052E2), 9.3801E1, (-1.048E2));
        ctx.bezierCurveTo(8.9801E1, (-1.044E2), 1.21401E2, (-1.136E2), 1.62601E2, (-8.6E1));
        ctx.bezierCurveTo(1.62601E2, (-8.6E1), 1.67401E2, (-8.32E1), 1.71001E2, (-8.36E1));
        ctx.bezierCurveTo(1.71001E2, (-8.36E1), 1.74201E2, (-8.12E1), 1.71401E2, (-7.76E1));
        ctx.bezierCurveTo(1.71401E2, (-7.76E1), 1.62601E2, (-6.8E1), 1.73801E2, (-5.68E1));
        ctx.bezierCurveTo(1.73801E2, (-5.68E1), 1.92201E2, (-5E1), 1.86601E2, (-5.88E1));
        ctx.bezierCurveTo(1.86601E2, (-5.88E1), 1.97401E2, (-5.48E1), 1.99801E2, (-5.08E1));
        ctx.bezierCurveTo(2.02201E2, (-4.68E1), 2.01001E2, (-5.08E1), 2.01001E2, (-5.08E1));
        ctx.bezierCurveTo(2.01001E2, (-5.08E1), 1.94601E2, (-5.8E1), 1.88601E2, (-6.32E1));
        ctx.bezierCurveTo(1.88601E2, (-6.32E1), 1.83401E2, (-6.52E1), 1.80601E2, (-7.36E1));
        ctx.bezierCurveTo(1.77801E2, (-8.2E1), 1.75401E2, (-9.2E1), 1.79801E2, (-9.52E1));
        ctx.bezierCurveTo(1.79801E2, (-9.52E1), 1.75801E2, (-9.08E1), 1.76601E2, (-9.48E1));
        ctx.bezierCurveTo(1.77401E2, (-9.88E1), 1.81001E2, (-1.024E2), 1.82601E2, (-1.028E2));
        ctx.bezierCurveTo(1.84201E2, (-1.032E2), 2.00601E2, (-1.19E2), 2.07401E2, (-1.194E2));
        ctx.bezierCurveTo(2.07401E2, (-1.194E2), 1.98201E2, (-1.18E2), 1.95201E2, (-1.19E2));
        ctx.bezierCurveTo(1.92201E2, (-1.2E2), 1.65601E2, (-1.314E2), 1.59601E2, (-1.326E2));
        ctx.bezierCurveTo(1.59601E2, (-1.326E2), 1.42801E2, (-1.392E2), 1.54801E2, (-1.372E2));
        ctx.bezierCurveTo(1.54801E2, (-1.372E2), 1.90601E2, (-1.334E2), 2.08801E2, (-1.202E2));
        ctx.bezierCurveTo(2.08801E2, (-1.202E2), 2.01601E2, (-1.286E2), 1.83201E2, (-1.356E2));
        ctx.bezierCurveTo(1.83201E2, (-1.356E2), 1.61001E2, (-1.482E2), 1.25801E2, (-1.432E2));
        ctx.bezierCurveTo(1.25801E2, (-1.432E2), 1.08001E2, (-1.4E2), 1.00201E2, (-1.382E2));
        ctx.bezierCurveTo(1.00201E2, (-1.382E2), 9.7601E1, (-1.388E2), 9.7001E1, (-1.392E2));
        ctx.bezierCurveTo(9.6401E1, (-1.396E2), 8.46E1, (-1.486E2), 5.7E1, (-1.416E2));
        ctx.bezierCurveTo(5.7E1, (-1.416E2), 4E1, (-1.37E2), 3.14E1, (-1.322E2));
        ctx.bezierCurveTo(3.14E1, (-1.322E2), 1.62E1, (-1.31E2), 1.26E1, (-1.278E2));
        ctx.bezierCurveTo(1.26E1, (-1.278E2), (-6E0), (-1.132E2), (-8E0), (-1.124E2));
        ctx.bezierCurveTo((-1E1), (-1.116E2), (-2.14E1), (-1.04E2), (-2.22E1), (-1.036E2));
        ctx.bezierCurveTo((-2.22E1), (-1.036E2), 2.4E0, (-1.102E2), 4.8E0, (-1.126E2));
        ctx.bezierCurveTo(7.2E0, (-1.15E2), 2.46E1, (-1.176E2), 2.7E1, (-1.162E2));
        ctx.bezierCurveTo(2.94E1, (-1.148E2), 3.78E1, (-1.154E2), 2.82E1, (-1.148E2));
        ctx.bezierCurveTo(2.82E1, (-1.148E2), 1.03801E2, (-1E2), 1.04601E2, (-9.8E1));
        ctx.bezierCurveTo(1.05401E2, (-9.6E1), 1.09401E2, (-9.72E1), 1.09401E2, (-9.72E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.80801E2, (-1.064E2));
        ctx.bezierCurveTo(1.80801E2, (-1.064E2), 1.70601E2, (-1.138E2), 1.68601E2, (-1.138E2));
        ctx.bezierCurveTo(1.66601E2, (-1.138E2), 1.54201E2, (-1.24E2), 1.50001E2, (-1.236E2));
        ctx.bezierCurveTo(1.45801E2, (-1.232E2), 1.33601E2, (-1.332E2), 1.06201E2, (-1.25E2));
        ctx.bezierCurveTo(1.06201E2, (-1.25E2), 1.05601E2, (-1.27E2), 1.09201E2, (-1.278E2));
        ctx.bezierCurveTo(1.09201E2, (-1.278E2), 1.15601E2, (-1.3E2), 1.16001E2, (-1.306E2));
        ctx.bezierCurveTo(1.16001E2, (-1.306E2), 1.36201E2, (-1.348E2), 1.43401E2, (-1.312E2));
        ctx.bezierCurveTo(1.43401E2, (-1.312E2), 1.52601E2, (-1.286E2), 1.58801E2, (-1.224E2));
        ctx.bezierCurveTo(1.58801E2, (-1.224E2), 1.70001E2, (-1.192E2), 1.73201E2, (-1.202E2));
        ctx.bezierCurveTo(1.73201E2, (-1.202E2), 1.82001E2, (-1.18E2), 1.82401E2, (-1.162E2));
        ctx.bezierCurveTo(1.82401E2, (-1.162E2), 1.88201E2, (-1.132E2), 1.86401E2, (-1.106E2));
        ctx.bezierCurveTo(1.86401E2, (-1.106E2), 1.86801E2, (-1.09E2), 1.80801E2, (-1.064E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.6833E2, (-1.08509E2));
        ctx.bezierCurveTo(1.69137E2, (-1.07877E2), 1.70156E2, (-1.07779E2), 1.70761E2, (-1.0697E2));
        ctx.bezierCurveTo(1.70995E2, (-1.06656E2), 1.70706E2, (-1.0633E2), 1.70391E2, (-1.06233E2));
        ctx.bezierCurveTo(1.69348E2, (-1.05916E2), 1.68292E2, (-1.06486E2), 1.6715E2, (-1.05898E2));
        ctx.bezierCurveTo(1.66748E2, (-1.05691E2), 1.66106E2, (-1.05873E2), 1.65553E2, (-1.06022E2));
        ctx.bezierCurveTo(1.63921E2, (-1.06463E2), 1.62092E2, (-1.06488E2), 1.60401E2, (-1.058E2));
        ctx.bezierCurveTo(1.58416E2, (-1.06929E2), 1.56056E2, (-1.06345E2), 1.53975E2, (-1.07346E2));
        ctx.bezierCurveTo(1.53917E2, (-1.07373E2), 1.53695E2, (-1.07027E2), 1.53621E2, (-1.07054E2));
        ctx.bezierCurveTo(1.50575E2, (-1.08199E2), 1.46832E2, (-1.07916E2), 1.44401E2, (-1.102E2));
        ctx.bezierCurveTo(1.41973E2, (-1.10612E2), 1.39616E2, (-1.11074E2), 1.37188E2, (-1.11754E2));
        ctx.bezierCurveTo(1.3537E2, (-1.12263E2), 1.33961E2, (-1.13252E2), 1.32341E2, (-1.14084E2));
        ctx.bezierCurveTo(1.30964E2, (-1.14792E2), 1.29507E2, (-1.15314E2), 1.27973E2, (-1.15686E2));
        ctx.bezierCurveTo(1.2611E2, (-1.16138E2), 1.24279E2, (-1.16026E2), 1.22386E2, (-1.16546E2));
        ctx.bezierCurveTo(1.22293E2, (-1.16571E2), 1.22101E2, (-1.16227E2), 1.22019E2, (-1.16254E2));
        ctx.bezierCurveTo(1.21695E2, (-1.16362E2), 1.21405E2, (-1.16945E2), 1.21234E2, (-1.16892E2));
        ctx.bezierCurveTo(1.19553E2, (-1.1637E2), 1.18065E2, (-1.17342E2), 1.16401E2, (-1.17E2));
        ctx.bezierCurveTo(1.15223E2, (-1.18224E2), 1.13495E2, (-1.17979E2), 1.11949E2, (-1.18421E2));
        ctx.bezierCurveTo(1.08985E2, (-1.19269E2), 1.05831E2, (-1.17999E2), 1.02801E2, (-1.19E2));
        ctx.bezierCurveTo(1.06914E2, (-1.20842E2), 1.11601E2, (-1.1961E2), 1.15663E2, (-1.21679E2));
        ctx.bezierCurveTo(1.17991E2, (-1.22865E2), 1.20653E2, (-1.21763E2), 1.23223E2, (-1.22523E2));
        ctx.bezierCurveTo(1.2371E2, (-1.22667E2), 1.24401E2, (-1.22869E2), 1.24801E2, (-1.222E2));
        ctx.bezierCurveTo(1.24935E2, (-1.22335E2), 1.25117E2, (-1.22574E2), 1.25175E2, (-1.22546E2));
        ctx.bezierCurveTo(1.27625E2, (-1.21389E2), 1.2994E2, (-1.20115E2), 1.32422E2, (-1.19049E2));
        ctx.bezierCurveTo(1.32763E2, (-1.18903E2), 1.33295E2, (-1.19135E2), 1.33547E2, (-1.18933E2));
        ctx.bezierCurveTo(1.35067E2, (-1.17717E2), 1.3701E2, (-1.1782E2), 1.38401E2, (-1.166E2));
        ctx.bezierCurveTo(1.40099E2, (-1.17102E2), 1.41892E2, (-1.16722E2), 1.43621E2, (-1.17346E2));
        ctx.bezierCurveTo(1.43698E2, (-1.17373E2), 1.43932E2, (-1.17032E2), 1.43965E2, (-1.17054E2));
        ctx.bezierCurveTo(1.45095E2, (-1.17802E2), 1.4625E2, (-1.17531E2), 1.47142E2, (-1.17227E2));
        ctx.bezierCurveTo(1.4748E2, (-1.17112E2), 1.48143E2, (-1.16865E2), 1.48448E2, (-1.16791E2));
        ctx.bezierCurveTo(1.49574E2, (-1.16515E2), 1.5043E2, (-1.16035E2), 1.51609E2, (-1.15852E2));
        ctx.bezierCurveTo(1.51723E2, (-1.15834E2), 1.51908E2, (-1.16174E2), 1.5198E2, (-1.16146E2));
        ctx.bezierCurveTo(1.53103E2, (-1.15708E2), 1.54145E2, (-1.15764E2), 1.54801E2, (-1.146E2));
        ctx.bezierCurveTo(1.54936E2, (-1.14735E2), 1.55101E2, (-1.14973E2), 1.55183E2, (-1.14946E2));
        ctx.bezierCurveTo(1.5621E2, (-1.14608E2), 1.56859E2, (-1.13853E2), 1.5796E2, (-1.13612E2));
        ctx.bezierCurveTo(1.58445E2, (-1.13506E2), 1.59057E2, (-1.1288E2), 1.59633E2, (-1.12704E2));
        ctx.bezierCurveTo(1.62025E2, (-1.11973E2), 1.63868E2, (-1.10444E2), 1.66062E2, (-1.09549E2));
        ctx.bezierCurveTo(1.66821E2, (-1.09239E2), 1.67697E2, (-1.09005E2), 1.6833E2, (-1.08509E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(9.1696E1, (-1.22739E2));
        ctx.bezierCurveTo(8.9178E1, (-1.24464E2), 8.681E1, (-1.2557E2), 8.4368E1, (-1.27356E2));
        ctx.bezierCurveTo(8.4187E1, (-1.27489E2), 8.3827E1, (-1.27319E2), 8.3625E1, (-1.27441E2));
        ctx.bezierCurveTo(8.2618E1, (-1.2805E2), 8.173E1, (-1.28631E2), 8.0748E1, (-1.29327E2));
        ctx.bezierCurveTo(8.0209E1, (-1.29709E2), 7.9388E1, (-1.29698E2), 7.888E1, (-1.29956E2));
        ctx.bezierCurveTo(7.6336E1, (-1.31248E2), 7.3707E1, (-1.31806E2), 7.12E1, (-1.33E2));
        ctx.bezierCurveTo(7.1882E1, (-1.33638E2), 7.3004E1, (-1.33394E2), 7.36E1, (-1.342E2));
        ctx.bezierCurveTo(7.3795E1, (-1.3392E2), 7.4033E1, (-1.33636E2), 7.4386E1, (-1.33827E2));
        ctx.bezierCurveTo(7.6064E1, (-1.34731E2), 7.7914E1, (-1.34884E2), 7.959E1, (-1.34794E2));
        ctx.bezierCurveTo(8.1294E1, (-1.34702E2), 8.3014E1, (-1.34397E2), 8.4789E1, (-1.34125E2));
        ctx.bezierCurveTo(8.5096E1, (-1.34078E2), 8.5295E1, (-1.33555E2), 8.5618E1, (-1.33458E2));
        ctx.bezierCurveTo(8.7846E1, (-1.32795E2), 9.0235E1, (-1.3332E2), 9.2354E1, (-1.32482E2));
        ctx.bezierCurveTo(9.3945E1, (-1.31853E2), 9.5515E1, (-1.3103E2), 9.6754E1, (-1.29755E2));
        ctx.bezierCurveTo(9.7006E1, (-1.29495E2), 9.6681E1, (-1.29194E2), 9.6401E1, (-1.29E2));
        ctx.bezierCurveTo(9.6789E1, (-1.29109E2), 9.7062E1, (-1.28903E2), 9.7173E1, (-1.2859E2));
        ctx.bezierCurveTo(9.7257E1, (-1.28351E2), 9.7257E1, (-1.28049E2), 9.7173E1, (-1.2781E2));
        ctx.bezierCurveTo(9.7061E1, (-1.27498E2), 9.6782E1, (-1.27397E2), 9.6408E1, (-1.27346E2));
        ctx.bezierCurveTo(9.5001E1, (-1.27156E2), 9.6773E1, (-1.28536E2), 9.6073E1, (-1.28088E2));
        ctx.bezierCurveTo(9.48E1, (-1.27274E2), 9.5546E1, (-1.25868E2), 9.4801E1, (-1.246E2));
        ctx.bezierCurveTo(9.4521E1, (-1.24794E2), 9.4291E1, (-1.25012E2), 9.4401E1, (-1.254E2));
        ctx.bezierCurveTo(9.4635E1, (-1.24878E2), 9.4033E1, (-1.24588E2), 9.3865E1, (-1.24272E2));
        ctx.bezierCurveTo(9.348E1, (-1.23547E2), 9.2581E1, (-1.22132E2), 9.1696E1, (-1.22739E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.9198E1, (-1.15391E2));
        ctx.bezierCurveTo(5.6044E1, (-1.16185E2), 5.2994E1, (-1.1607E2), 4.9978E1, (-1.17346E2));
        ctx.bezierCurveTo(4.9911E1, (-1.17374E2), 4.9688E1, (-1.17027E2), 4.9624E1, (-1.17054E2));
        ctx.bezierCurveTo(4.8258E1, (-1.17648E2), 4.734E1, (-1.18614E2), 4.6264E1, (-1.1966E2));
        ctx.bezierCurveTo(4.5351E1, (-1.20548E2), 4.3693E1, (-1.20161E2), 4.2419E1, (-1.20648E2));
        ctx.bezierCurveTo(4.2095E1, (-1.20772E2), 4.1892E1, (-1.21284E2), 4.1591E1, (-1.21323E2));
        ctx.bezierCurveTo(4.0372E1, (-1.2148E2), 3.9445E1, (-1.22429E2), 3.84E1, (-1.23E2));
        ctx.bezierCurveTo(4.0736E1, (-1.23795E2), 4.3147E1, (-1.23764E2), 4.5609E1, (-1.24148E2));
        ctx.bezierCurveTo(4.5722E1, (-1.24166E2), 4.5867E1, (-1.23845E2), 4.6E1, (-1.23845E2));
        ctx.bezierCurveTo(4.6136E1, (-1.23845E2), 4.6266E1, (-1.24066E2), 4.64E1, (-1.242E2));
        ctx.bezierCurveTo(4.6595E1, (-1.2392E2), 4.6897E1, (-1.23594E2), 4.7154E1, (-1.23848E2));
        ctx.bezierCurveTo(4.7702E1, (-1.24388E2), 4.8258E1, (-1.24198E2), 4.8798E1, (-1.24158E2));
        ctx.bezierCurveTo(4.8942E1, (-1.24148E2), 4.9067E1, (-1.23845E2), 4.92E1, (-1.23845E2));
        ctx.bezierCurveTo(4.9336E1, (-1.23845E2), 4.9467E1, (-1.24156E2), 4.96E1, (-1.24156E2));
        ctx.bezierCurveTo(4.9736E1, (-1.24155E2), 4.9867E1, (-1.23845E2), 5E1, (-1.23845E2));
        ctx.bezierCurveTo(5.0136E1, (-1.23845E2), 5.0266E1, (-1.24066E2), 5.04E1, (-1.242E2));
        ctx.bezierCurveTo(5.1092E1, (-1.23418E2), 5.1977E1, (-1.23972E2), 5.2799E1, (-1.23793E2));
        ctx.bezierCurveTo(5.3837E1, (-1.23566E2), 5.4104E1, (-1.22418E2), 5.5178E1, (-1.2212E2));
        ctx.bezierCurveTo(5.9893E1, (-1.20816E2), 6.403E1, (-1.18671E2), 6.8393E1, (-1.16584E2));
        ctx.bezierCurveTo(6.87E1, (-1.16437E2), 6.891E1, (-1.16189E2), 6.88E1, (-1.158E2));
        ctx.bezierCurveTo(6.9067E1, (-1.158E2), 6.938E1, (-1.15888E2), 6.957E1, (-1.15756E2));
        ctx.bezierCurveTo(7.0628E1, (-1.15024E2), 7.1669E1, (-1.14476E2), 7.2366E1, (-1.13378E2));
        ctx.bezierCurveTo(7.2582E1, (-1.13039E2), 7.2253E1, (-1.12632E2), 7.202E1, (-1.12684E2));
        ctx.bezierCurveTo(6.7591E1, (-1.13679E2), 6.3585E1, (-1.14287E2), 5.9198E1, (-1.15391E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.5338E1, (-7.1179E1));
        ctx.bezierCurveTo(4.3746E1, (-7.2398E1), 4.3162E1, (-7.4429E1), 4.2034E1, (-7.6221E1));
        ctx.bezierCurveTo(4.182E1, (-7.6561E1), 4.2094E1, (-7.6875E1), 4.2411E1, (-7.6964E1));
        ctx.bezierCurveTo(4.2971E1, (-7.7123E1), 4.3514E1, (-7.6645E1), 4.3923E1, (-7.6443E1));
        ctx.bezierCurveTo(4.5668E1, (-7.5581E1), 4.7203E1, (-7.4339E1), 4.92E1, (-7.42E1));
        ctx.bezierCurveTo(5.119E1, (-7.1966E1), 5.545E1, (-7.1581E1), 5.5457E1, (-6.82E1));
        ctx.bezierCurveTo(5.5458E1, (-6.7341E1), 5.403E1, (-6.8259E1), 5.36E1, (-6.74E1));
        ctx.bezierCurveTo(5.1149E1, (-6.8403E1), 4.876E1, (-6.83E1), 4.638E1, (-6.9767E1));
        ctx.bezierCurveTo(4.5763E1, (-7.0148E1), 4.6093E1, (-7.0601E1), 4.5338E1, (-7.1179E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cc7226';
        ctx.fillStyle = 'rgba(204,114,38,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.78E1, (-1.23756E2));
        ctx.bezierCurveTo(1.7935E1, (-1.23755E2), 2.4966E1, (-1.23522E2), 2.4949E1, (-1.23408E2));
        ctx.bezierCurveTo(2.4904E1, (-1.23099E2), 1.7174E1, (-1.2205E2), 1.681E1, (-1.2222E2));
        ctx.bezierCurveTo(1.6646E1, (-1.22296E2), 9.134E0, (-1.19866E2), 9E0, (-1.2E2));
        ctx.bezierCurveTo(9.268E0, (-1.20135E2), 1.7534E1, (-1.23756E2), 1.78E1, (-1.23756E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.32E1, (-1.14E2));
        ctx.bezierCurveTo(3.32E1, (-1.14E2), 1.84E1, (-1.122E2), 1.4E1, (-1.11E2));
        ctx.bezierCurveTo(9.6E0, (-1.098E2), (-9E0), (-1.022E2), (-1.2E1), (-1.002E2));
        ctx.bezierCurveTo((-1.2E1), (-1.002E2), (-2.54E1), (-9.48E1), (-4.24E1), (-7.48E1));
        ctx.bezierCurveTo((-4.24E1), (-7.48E1), (-3.48E1), (-7.82E1), (-3.26E1), (-8.1E1));
        ctx.bezierCurveTo((-3.26E1), (-8.1E1), (-1.9E1), (-9.36E1), (-1.92E1), (-9.1E1));
        ctx.bezierCurveTo((-1.92E1), (-9.1E1), (-7E0), (-9.96E1), (-7.6E0), (-9.74E1));
        ctx.bezierCurveTo((-7.6E0), (-9.74E1), 1.68E1, (-1.086E2), 1.48E1, (-1.054E2));
        ctx.bezierCurveTo(1.48E1, (-1.054E2), 3.64E1, (-1.1E2), 3.54E1, (-1.08E2));
        ctx.bezierCurveTo(3.54E1, (-1.08E2), 5.42E1, (-1.036E2), 5.14E1, (-1.034E2));
        ctx.bezierCurveTo(5.14E1, (-1.034E2), 4.56E1, (-1.022E2), 5.2E1, (-9.86E1));
        ctx.bezierCurveTo(5.2E1, (-9.86E1), 4.86E1, (-9.42E1), 4.32E1, (-9.82E1));
        ctx.bezierCurveTo(3.78E1, (-1.022E2), 4.08E1, (-1E2), 3.58E1, (-9.9E1));
        ctx.bezierCurveTo(3.58E1, (-9.9E1), 3.32E1, (-9.82E1), 2.86E1, (-1.022E2));
        ctx.bezierCurveTo(2.86E1, (-1.022E2), 2.3E1, (-1.068E2), 1.42E1, (-1.032E2));
        ctx.bezierCurveTo(1.42E1, (-1.032E2), (-1.64E1), (-9.06E1), (-1.84E1), (-9E1));
        ctx.bezierCurveTo((-1.84E1), (-9E1), (-2.2E1), (-8.72E1), (-2.44E1), (-8.36E1));
        ctx.bezierCurveTo((-2.44E1), (-8.36E1), (-3.02E1), (-7.92E1), (-3.32E1), (-7.78E1));
        ctx.bezierCurveTo((-3.32E1), (-7.78E1), (-4.6E1), (-6.62E1), (-4.72E1), (-6.48E1));
        ctx.bezierCurveTo((-4.72E1), (-6.48E1), (-5.06E1), (-5.96E1), (-5.14E1), (-5.92E1));
        ctx.bezierCurveTo((-5.14E1), (-5.92E1), (-4.5E1), (-6.3E1), (-4.3E1), (-6.5E1));
        ctx.bezierCurveTo((-4.3E1), (-6.5E1), (-2.9E1), (-7.5E1), (-2.36E1), (-7.58E1));
        ctx.bezierCurveTo((-2.36E1), (-7.58E1), (-1.92E1), (-7.88E1), (-1.84E1), (-8.02E1));
        ctx.bezierCurveTo((-1.84E1), (-8.02E1), (-4E0), (-8.94E1), 2E-1, (-8.94E1));
        ctx.bezierCurveTo(2E-1, (-8.94E1), 9.4E0, (-8.42E1), 1.18E1, (-9.12E1));
        ctx.bezierCurveTo(1.18E1, (-9.12E1), 1.76E1, (-9.3E1), 2.32E1, (-9.18E1));
        ctx.bezierCurveTo(2.32E1, (-9.18E1), 2.64E1, (-9.44E1), 2.56E1, (-9.66E1));
        ctx.bezierCurveTo(2.56E1, (-9.66E1), 2.72E1, (-9.84E1), 2.82E1, (-9.46E1));
        ctx.bezierCurveTo(2.82E1, (-9.46E1), 3.16E1, (-9.1E1), 3.64E1, (-9.3E1));
        ctx.bezierCurveTo(3.64E1, (-9.3E1), 4.04E1, (-9.32E1), 3.84E1, (-9.08E1));
        ctx.bezierCurveTo(3.84E1, (-9.08E1), 3.4E1, (-8.7E1), 2.22E1, (-8.68E1));
        ctx.bezierCurveTo(2.22E1, (-8.68E1), 9.8E0, (-8.62E1), (-6.6E0), (-7.86E1));
        ctx.bezierCurveTo((-6.6E0), (-7.86E1), (-3.64E1), (-6.82E1), (-4.56E1), (-5.78E1));
        ctx.bezierCurveTo((-4.56E1), (-5.78E1), (-5.2E1), (-4.9E1), (-5.74E1), (-4.78E1));
        ctx.bezierCurveTo((-5.74E1), (-4.78E1), (-6.32E1), (-4.7E1), (-6.92E1), (-3.96E1));
        ctx.bezierCurveTo((-6.92E1), (-3.96E1), (-5.94E1), (-4.54E1), (-5.04E1), (-4.54E1));
        ctx.bezierCurveTo((-5.04E1), (-4.54E1), (-4.64E1), (-4.78E1), (-5.02E1), (-4.42E1));
        ctx.bezierCurveTo((-5.02E1), (-4.42E1), (-5.38E1), (-3.66E1), (-5.22E1), (-3.12E1));
        ctx.bezierCurveTo((-5.22E1), (-3.12E1), (-5.28E1), (-2.6E1), (-5.36E1), (-2.44E1));
        ctx.bezierCurveTo((-5.36E1), (-2.44E1), (-6.14E1), (-1.16E1), (-6.14E1), (-9.2E0));
        ctx.bezierCurveTo((-6.14E1), (-6.8E0), (-6.02E1), 3E0, (-5.98E1), 3.6E0);
        ctx.bezierCurveTo((-5.94E1), 4.2E0, (-6.08E1), 2E0, (-5.7E1), 4.4E0);
        ctx.bezierCurveTo((-5.32E1), 6.8E0, (-5.04E1), 8.4E0, (-4.96E1), 1.12E1);
        ctx.bezierCurveTo((-4.88E1), 1.4E1, (-5.16E1), 5.8E0, (-5.18E1), 4E0);
        ctx.bezierCurveTo((-5.2E1), 2.2E0, (-5.62E1), (-5E0), (-5.54E1), (-7.4E0));
        ctx.bezierCurveTo((-5.54E1), (-7.4E0), (-5.44E1), (-6.4E0), (-5.36E1), (-5E0));
        ctx.bezierCurveTo((-5.36E1), (-5E0), (-5.42E1), (-5.6E0), (-5.36E1), (-9.2E0));
        ctx.bezierCurveTo((-5.36E1), (-9.2E0), (-5.28E1), (-1.44E1), (-5.14E1), (-1.76E1));
        ctx.bezierCurveTo((-5E1), (-2.08E1), (-4.8E1), (-2.46E1), (-4.76E1), (-2.54E1));
        ctx.bezierCurveTo((-4.72E1), (-2.62E1), (-4.72E1), (-3.2E1), (-4.58E1), (-2.94E1));
        ctx.lineTo((-4.24E1), (-2.68E1));
        ctx.bezierCurveTo((-4.24E1), (-2.68E1), (-4.52E1), (-2.94E1), (-4.3E1), (-3.16E1));
        ctx.bezierCurveTo((-4.3E1), (-3.16E1), (-4.4E1), (-3.72E1), (-4.22E1), (-3.98E1));
        ctx.bezierCurveTo((-4.22E1), (-3.98E1), (-3.52E1), (-4.82E1), (-3.36E1), (-4.92E1));
        ctx.bezierCurveTo((-3.2E1), (-5.02E1), (-3.34E1), (-4.98E1), (-3.34E1), (-4.98E1));
        ctx.bezierCurveTo((-3.34E1), (-4.98E1), (-2.74E1), (-5.4E1), (-3.32E1), (-5.24E1));
        ctx.bezierCurveTo((-3.32E1), (-5.24E1), (-3.72E1), (-5.08E1), (-4.02E1), (-5.08E1));
        ctx.bezierCurveTo((-4.02E1), (-5.08E1), (-4.78E1), (-4.88E1), (-4.38E1), (-5.3E1));
        ctx.bezierCurveTo((-3.98E1), (-5.72E1), (-2.98E1), (-6.26E1), (-2.6E1), (-6.24E1));
        ctx.lineTo((-2.52E1), (-6.08E1));
        ctx.lineTo((-1.4E1), (-6.32E1));
        ctx.lineTo((-1.52E1), (-6.24E1));
        ctx.bezierCurveTo((-1.52E1), (-6.24E1), (-1.54E1), (-6.26E1), (-1.12E1), (-6.3E1));
        ctx.bezierCurveTo((-7E0), (-6.34E1), (-1.2E0), (-6.2E1), 2E-1, (-6.38E1));
        ctx.bezierCurveTo(1.6E0, (-6.56E1), 5E0, (-6.66E1), 4.6E0, (-6.52E1));
        ctx.bezierCurveTo(4.2E0, (-6.38E1), 4E0, (-6.18E1), 4E0, (-6.18E1));
        ctx.bezierCurveTo(4E0, (-6.18E1), 9E0, (-6.76E1), 8.4E0, (-6.54E1));
        ctx.bezierCurveTo(7.8E0, (-6.32E1), (-4E-1), (-5.8E1), (-1.8E0), (-5.18E1));
        ctx.lineTo(8.6E0, (-6E1));
        ctx.lineTo(1.22E1, (-6.3E1));
        ctx.bezierCurveTo(1.22E1, (-6.3E1), 1.58E1, (-6.08E1), 1.6E1, (-6.24E1));
        ctx.bezierCurveTo(1.62E1, (-6.4E1), 2.08E1, (-6.98E1), 2.2E1, (-6.96E1));
        ctx.bezierCurveTo(2.32E1, (-6.94E1), 2.52E1, (-7.22E1), 2.5E1, (-6.96E1));
        ctx.bezierCurveTo(2.48E1, (-6.7E1), 3.24E1, (-6.16E1), 3.24E1, (-6.16E1));
        ctx.bezierCurveTo(3.24E1, (-6.16E1), 3.56E1, (-6.34E1), 3.7E1, (-6.2E1));
        ctx.bezierCurveTo(3.84E1, (-6.06E1), 4.26E1, (-8.18E1), 4.26E1, (-8.18E1));
        ctx.lineTo(6.76E1, (-9.24E1));
        ctx.lineTo(1.11201E2, (-9.58E1));
        ctx.lineTo(9.4201E1, (-1.026E2));
        ctx.lineTo(3.32E1, (-1.14E2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#4c0000';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#4c0000';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.14E1, 8.5E1);
        ctx.bezierCurveTo(5.14E1, 8.5E1, 3.64E1, 6.82E1, 2.8E1, 6.56E1);
        ctx.bezierCurveTo(2.8E1, 6.56E1, 1.46E1, 5.88E1, (-1E1), 6.66E1);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#4c0000';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#4c0000';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.48E1, 6.42E1);
        ctx.bezierCurveTo(2.48E1, 6.42E1, (-4E-1), 5.62E1, (-1.58E1), 6.04E1);
        ctx.bezierCurveTo((-1.58E1), 6.04E1, (-3.42E1), 6.24E1, (-4.26E1), 7.62E1);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#4c0000';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#4c0000';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.12E1, 6.3E1);
        ctx.bezierCurveTo(2.12E1, 6.3E1, 4.2E0, 5.58E1, (-1.06E1), 5.36E1);
        ctx.bezierCurveTo((-1.06E1), 5.36E1, (-2.72E1), 5.1E1, (-4.38E1), 5.82E1);
        ctx.bezierCurveTo((-4.38E1), 5.82E1, (-5.6E1), 6.42E1, (-6.14E1), 7.44E1);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#4c0000';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#4c0000';
        ctx.lineWidth = 2E0;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.22E1, 6.34E1);
        ctx.bezierCurveTo(2.22E1, 6.34E1, 6.8E0, 5.24E1, 5.8E0, 5.1E1);
        ctx.bezierCurveTo(5.8E0, 5.1E1, (-1.2E0), 4E1, (-1.42E1), 3.96E1);
        ctx.bezierCurveTo((-1.42E1), 3.96E1, (-3.56E1), 4.04E1, (-5.28E1), 4.84E1);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.0895E1, 5.4407E1);
        ctx.bezierCurveTo(2.2437E1, 5.587E1, 4.94E1, 8.48E1, 4.94E1, 8.48E1);
        ctx.bezierCurveTo(8.46E1, 1.21401E2, 5.66E1, 8.72E1, 5.66E1, 8.72E1);
        ctx.bezierCurveTo(4.9E1, 8.24E1, 3.98E1, 6.36E1, 3.98E1, 6.36E1);
        ctx.bezierCurveTo(3.86E1, 6.08E1, 5.38E1, 7.08E1, 5.38E1, 7.08E1);
        ctx.bezierCurveTo(5.78E1, 7.16E1, 7.14E1, 9.08E1, 7.14E1, 9.08E1);
        ctx.bezierCurveTo(6.46E1, 8.84E1, 6.94E1, 9.56E1, 6.94E1, 9.56E1);
        ctx.bezierCurveTo(7.22E1, 9.76E1, 9.2601E1, 1.13201E2, 9.2601E1, 1.13201E2);
        ctx.bezierCurveTo(9.6201E1, 1.17201E2, 1.00201E2, 1.18801E2, 1.00201E2, 1.18801E2);
        ctx.bezierCurveTo(1.14201E2, 1.13601E2, 1.07801E2, 1.26801E2, 1.07801E2, 1.26801E2);
        ctx.bezierCurveTo(1.10201E2, 1.33601E2, 1.15801E2, 1.22001E2, 1.15801E2, 1.22001E2);
        ctx.bezierCurveTo(1.27001E2, 1.052E2, 1.10601E2, 1.07601E2, 1.10601E2, 1.07601E2);
        ctx.bezierCurveTo(8.06E1, 1.10401E2, 7.38E1, 9.44E1, 7.38E1, 9.44E1);
        ctx.bezierCurveTo(7.14E1, 9.2E1, 8.02E1, 9.44E1, 8.02E1, 9.44E1);
        ctx.bezierCurveTo(8.8601E1, 9.64E1, 7.3E1, 8.2E1, 7.3E1, 8.2E1);
        ctx.bezierCurveTo(7.54E1, 8.2E1, 8.46E1, 8.88E1, 8.46E1, 8.88E1);
        ctx.bezierCurveTo(9.5001E1, 9.8E1, 9.7001E1, 9.6E1, 9.7001E1, 9.6E1);
        ctx.bezierCurveTo(1.15001E2, 8.72E1, 1.25401E2, 9.48E1, 1.25401E2, 9.48E1);
        ctx.bezierCurveTo(1.27401E2, 9.64E1, 1.21801E2, 1.032E2, 1.23401E2, 1.08401E2);
        ctx.bezierCurveTo(1.25001E2, 1.13601E2, 1.29801E2, 1.26001E2, 1.29801E2, 1.26001E2);
        ctx.bezierCurveTo(1.27401E2, 1.27601E2, 1.27801E2, 1.38401E2, 1.27801E2, 1.38401E2);
        ctx.bezierCurveTo(1.44601E2, 1.61601E2, 1.35001E2, 1.59601E2, 1.35001E2, 1.59601E2);
        ctx.bezierCurveTo(1.19401E2, 1.59201E2, 1.34201E2, 1.66801E2, 1.34201E2, 1.66801E2);
        ctx.bezierCurveTo(1.37401E2, 1.68801E2, 1.46201E2, 1.76001E2, 1.46201E2, 1.76001E2);
        ctx.bezierCurveTo(1.43401E2, 1.74801E2, 1.41801E2, 1.80001E2, 1.41801E2, 1.80001E2);
        ctx.bezierCurveTo(1.46601E2, 1.84001E2, 1.43801E2, 1.88801E2, 1.43801E2, 1.88801E2);
        ctx.bezierCurveTo(1.37801E2, 1.90001E2, 1.36601E2, 1.94001E2, 1.36601E2, 1.94001E2);
        ctx.bezierCurveTo(1.43401E2, 2.02001E2, 1.33401E2, 2.02401E2, 1.33401E2, 2.02401E2);
        ctx.bezierCurveTo(1.37001E2, 2.06801E2, 1.32201E2, 2.18801E2, 1.32201E2, 2.18801E2);
        ctx.bezierCurveTo(1.27401E2, 2.18801E2, 1.21001E2, 2.24401E2, 1.21001E2, 2.24401E2);
        ctx.bezierCurveTo(1.23401E2, 2.29201E2, 1.13001E2, 2.34801E2, 1.13001E2, 2.34801E2);
        ctx.bezierCurveTo(1.04601E2, 2.36401E2, 1.07401E2, 2.43201E2, 1.07401E2, 2.43201E2);
        ctx.bezierCurveTo(9.9401E1, 2.49201E2, 9.7001E1, 2.65201E2, 9.7001E1, 2.65201E2);
        ctx.bezierCurveTo(9.6201E1, 2.75601E2, 9.3801E1, 2.78801E2, 9.9001E1, 2.76801E2);
        ctx.bezierCurveTo(1.04201E2, 2.74801E2, 1.03401E2, 2.62401E2, 1.03401E2, 2.62401E2);
        ctx.bezierCurveTo(9.8601E1, 2.46801E2, 1.41401E2, 2.30801E2, 1.41401E2, 2.30801E2);
        ctx.bezierCurveTo(1.45401E2, 2.29201E2, 1.46201E2, 2.24001E2, 1.46201E2, 2.24001E2);
        ctx.bezierCurveTo(1.48201E2, 2.24401E2, 1.57001E2, 2.32001E2, 1.57001E2, 2.32001E2);
        ctx.bezierCurveTo(1.64601E2, 2.43201E2, 1.65001E2, 2.34001E2, 1.65001E2, 2.34001E2);
        ctx.bezierCurveTo(1.66201E2, 2.30401E2, 1.64601E2, 2.24401E2, 1.64601E2, 2.24401E2);
        ctx.bezierCurveTo(1.70601E2, 2.02801E2, 1.56601E2, 1.96401E2, 1.56601E2, 1.96401E2);
        ctx.bezierCurveTo(1.46601E2, 1.62801E2, 1.60601E2, 1.71201E2, 1.60601E2, 1.71201E2);
        ctx.bezierCurveTo(1.63401E2, 1.76801E2, 1.74201E2, 1.82001E2, 1.74201E2, 1.82001E2);
        ctx.lineTo(1.77801E2, 1.79601E2);
        ctx.bezierCurveTo(1.76201E2, 1.74801E2, 1.84601E2, 1.68801E2, 1.84601E2, 1.68801E2);
        ctx.bezierCurveTo(1.87401E2, 1.75201E2, 1.93401E2, 1.67201E2, 1.93401E2, 1.67201E2);
        ctx.bezierCurveTo(1.97001E2, 1.42801E2, 2.09401E2, 1.57201E2, 2.09401E2, 1.57201E2);
        ctx.bezierCurveTo(2.13401E2, 1.58401E2, 2.14601E2, 1.51601E2, 2.14601E2, 1.51601E2);
        ctx.bezierCurveTo(2.18201E2, 1.41201E2, 2.14601E2, 1.27601E2, 2.14601E2, 1.27601E2);
        ctx.bezierCurveTo(2.18201E2, 1.27201E2, 2.27801E2, 1.33201E2, 2.27801E2, 1.33201E2);
        ctx.bezierCurveTo(2.30601E2, 1.29601E2, 2.21401E2, 1.12801E2, 2.25401E2, 1.15201E2);
        ctx.bezierCurveTo(2.29401E2, 1.17601E2, 2.33801E2, 1.19201E2, 2.33801E2, 1.19201E2);
        ctx.bezierCurveTo(2.34601E2, 1.17201E2, 2.24601E2, 1.04801E2, 2.24601E2, 1.04801E2);
        ctx.bezierCurveTo(2.20201E2, 1.02E2, 2.15001E2, 8.16E1, 2.15001E2, 8.16E1);
        ctx.bezierCurveTo(2.22201E2, 8.52E1, 2.12201E2, 7E1, 2.12201E2, 7E1);
        ctx.bezierCurveTo(2.12201E2, 6.68E1, 2.18201E2, 5.56E1, 2.18201E2, 5.56E1);
        ctx.bezierCurveTo(2.17401E2, 4.88E1, 2.18201E2, 4.92E1, 2.18201E2, 4.92E1);
        ctx.bezierCurveTo(2.21001E2, 5.04E1, 2.29001E2, 5.2E1, 2.22201E2, 4.56E1);
        ctx.bezierCurveTo(2.15401E2, 3.92E1, 2.23001E2, 3.44E1, 2.23001E2, 3.44E1);
        ctx.bezierCurveTo(2.27401E2, 3.16E1, 2.13801E2, 3.2E1, 2.13801E2, 3.2E1);
        ctx.bezierCurveTo(2.08601E2, 2.76E1, 2.09001E2, 2.36E1, 2.09001E2, 2.36E1);
        ctx.bezierCurveTo(2.17001E2, 2.56E1, 2.02601E2, 1.12E1, 2.00201E2, 7.6E0);
        ctx.bezierCurveTo(1.97801E2, 4E0, 2.07401E2, (-1.2E0), 2.07401E2, (-1.2E0));
        ctx.bezierCurveTo(2.20601E2, (-4.8E0), 2.09001E2, (-8E0), 2.09001E2, (-8E0));
        ctx.bezierCurveTo(1.89401E2, (-7.6E0), 2.00201E2, (-1.84E1), 2.00201E2, (-1.84E1));
        ctx.bezierCurveTo(2.06201E2, (-1.8E1), 2.04601E2, (-2.04E1), 2.04601E2, (-2.04E1));
        ctx.bezierCurveTo(1.99401E2, (-2.16E1), 1.89801E2, (-2.8E1), 1.89801E2, (-2.8E1));
        ctx.bezierCurveTo(1.85801E2, (-3.16E1), 1.89401E2, (-3.08E1), 1.89401E2, (-3.08E1));
        ctx.bezierCurveTo(2.06201E2, (-2.96E1), 1.77401E2, (-4.08E1), 1.77401E2, (-4.08E1));
        ctx.bezierCurveTo(1.85401E2, (-4.08E1), 1.67401E2, (-5.12E1), 1.67401E2, (-5.12E1));
        ctx.bezierCurveTo(1.65401E2, (-5.28E1), 1.62201E2, (-6.04E1), 1.62201E2, (-6.04E1));
        ctx.bezierCurveTo(1.56201E2, (-6.56E1), 1.51401E2, (-7.24E1), 1.51401E2, (-7.24E1));
        ctx.bezierCurveTo(1.51001E2, (-7.68E1), 1.46201E2, (-8.16E1), 1.46201E2, (-8.16E1));
        ctx.bezierCurveTo(1.34601E2, (-9.52E1), 1.29001E2, (-9.48E1), 1.29001E2, (-9.48E1));
        ctx.bezierCurveTo(1.14201E2, (-9.84E1), 1.09001E2, (-9.76E1), 1.09001E2, (-9.76E1));
        ctx.lineTo(5.62E1, (-9.32E1));
        ctx.bezierCurveTo(2.98E1, (-8.04E1), 3.76E1, (-5.94E1), 3.76E1, (-5.94E1));
        ctx.bezierCurveTo(4.4E1, (-5.1E1), 5.32E1, (-5.48E1), 5.32E1, (-5.48E1));
        ctx.bezierCurveTo(5.78E1, (-6.1E1), 6.94E1, (-5.88E1), 6.94E1, (-5.88E1));
        ctx.bezierCurveTo(8.9801E1, (-5.56E1), 8.7201E1, (-5.92E1), 8.7201E1, (-5.92E1));
        ctx.bezierCurveTo(8.4801E1, (-6.38E1), 6.86E1, (-7E1), 6.84E1, (-7.06E1));
        ctx.bezierCurveTo(6.82E1, (-7.12E1), 5.94E1, (-7.46E1), 5.94E1, (-7.46E1));
        ctx.bezierCurveTo(5.64E1, (-7.58E1), 5.2E1, (-8.5E1), 5.2E1, (-8.5E1));
        ctx.bezierCurveTo(4.88E1, (-8.84E1), 6.46E1, (-8.26E1), 6.46E1, (-8.26E1));
        ctx.bezierCurveTo(6.34E1, (-8.16E1), 7.08E1, (-7.76E1), 7.08E1, (-7.76E1));
        ctx.bezierCurveTo(8.8201E1, (-7.86E1), 9.8801E1, (-6.78E1), 9.8801E1, (-6.78E1));
        ctx.bezierCurveTo(1.09601E2, (-5.12E1), 1.09801E2, (-5.94E1), 1.09801E2, (-5.94E1));
        ctx.bezierCurveTo(1.12601E2, (-6.88E1), 1.00801E2, (-9E1), 1.00801E2, (-9E1));
        ctx.bezierCurveTo(1.01201E2, (-9.2E1), 1.09401E2, (-8.54E1), 1.09401E2, (-8.54E1));
        ctx.bezierCurveTo(1.10801E2, (-8.74E1), 1.11601E2, (-8.16E1), 1.11601E2, (-8.16E1));
        ctx.bezierCurveTo(1.11801E2, (-7.92E1), 1.15601E2, (-7.12E1), 1.15601E2, (-7.12E1));
        ctx.bezierCurveTo(1.18401E2, (-5.82E1), 1.22001E2, (-6.56E1), 1.22001E2, (-6.56E1));
        ctx.lineTo(1.26601E2, (-5.62E1));
        ctx.bezierCurveTo(1.28001E2, (-5.36E1), 1.22001E2, (-4.6E1), 1.22001E2, (-4.6E1));
        ctx.bezierCurveTo(1.21801E2, (-4.32E1), 1.22601E2, (-4.34E1), 1.17001E2, (-3.58E1));
        ctx.bezierCurveTo(1.11401E2, (-2.82E1), 1.14801E2, (-2.38E1), 1.14801E2, (-2.38E1));
        ctx.bezierCurveTo(1.13401E2, (-1.72E1), 1.22201E2, (-1.76E1), 1.22201E2, (-1.76E1));
        ctx.bezierCurveTo(1.24801E2, (-1.54E1), 1.28201E2, (-1.54E1), 1.28201E2, (-1.54E1));
        ctx.bezierCurveTo(1.30001E2, (-1.34E1), 1.32401E2, (-1.4E1), 1.32401E2, (-1.4E1));
        ctx.bezierCurveTo(1.34001E2, (-1.78E1), 1.40201E2, (-1.58E1), 1.40201E2, (-1.58E1));
        ctx.bezierCurveTo(1.41601E2, (-1.82E1), 1.49801E2, (-1.86E1), 1.49801E2, (-1.86E1));
        ctx.bezierCurveTo(1.50801E2, (-2.12E1), 1.51201E2, (-2.28E1), 1.54601E2, (-2.34E1));
        ctx.bezierCurveTo(1.58001E2, (-2.4E1), 1.33401E2, (-6.7E1), 1.33401E2, (-6.7E1));
        ctx.bezierCurveTo(1.39801E2, (-6.78E1), 1.31601E2, (-8.02E1), 1.31601E2, (-8.02E1));
        ctx.bezierCurveTo(1.29401E2, (-8.68E1), 1.40801E2, (-7.22E1), 1.43001E2, (-7.08E1));
        ctx.bezierCurveTo(1.45201E2, (-6.94E1), 1.46201E2, (-6.72E1), 1.44601E2, (-6.74E1));
        ctx.bezierCurveTo(1.43001E2, (-6.76E1), 1.41201E2, (-6.54E1), 1.42601E2, (-6.52E1));
        ctx.bezierCurveTo(1.44001E2, (-6.5E1), 1.57001E2, (-5E1), 1.60401E2, (-3.98E1));
        ctx.bezierCurveTo(1.63801E2, (-2.96E1), 1.69801E2, (-2.56E1), 1.76001E2, (-1.96E1));
        ctx.bezierCurveTo(1.82201E2, (-1.36E1), 1.81401E2, 1.06E1, 1.81401E2, 1.06E1);
        ctx.bezierCurveTo(1.81001E2, 1.94E1, 1.87001E2, 3E1, 1.87001E2, 3E1);
        ctx.bezierCurveTo(1.89001E2, 3.38E1, 1.84801E2, 5.2E1, 1.84801E2, 5.2E1);
        ctx.bezierCurveTo(1.82801E2, 5.42E1, 1.84201E2, 5.5E1, 1.84201E2, 5.5E1);
        ctx.bezierCurveTo(1.85201E2, 5.62E1, 1.92001E2, 6.94E1, 1.92001E2, 6.94E1);
        ctx.bezierCurveTo(1.90201E2, 6.92E1, 1.93801E2, 7.28E1, 1.93801E2, 7.28E1);
        ctx.bezierCurveTo(1.99001E2, 7.88E1, 1.92601E2, 7.58E1, 1.92601E2, 7.58E1);
        ctx.bezierCurveTo(1.86601E2, 7.42E1, 1.93601E2, 8.4E1, 1.93601E2, 8.4E1);
        ctx.bezierCurveTo(1.94801E2, 8.58E1, 1.85801E2, 8.12E1, 1.85801E2, 8.12E1);
        ctx.bezierCurveTo(1.76601E2, 8.06E1, 1.88201E2, 8.78E1, 1.88201E2, 8.78E1);
        ctx.bezierCurveTo(1.96801E2, 9.5E1, 1.85401E2, 9.06E1, 1.85401E2, 9.06E1);
        ctx.bezierCurveTo(1.80801E2, 8.88E1, 1.84001E2, 9.56E1, 1.84001E2, 9.56E1);
        ctx.bezierCurveTo(1.87201E2, 9.72E1, 2.04401E2, 1.042E2, 2.04401E2, 1.042E2);
        ctx.bezierCurveTo(2.04801E2, 1.08001E2, 2.01801E2, 1.13001E2, 2.01801E2, 1.13001E2);
        ctx.bezierCurveTo(2.02201E2, 1.17001E2, 2.00001E2, 1.20401E2, 2.00001E2, 1.20401E2);
        ctx.bezierCurveTo(1.98801E2, 1.28601E2, 1.98201E2, 1.29401E2, 1.98201E2, 1.29401E2);
        ctx.bezierCurveTo(1.94001E2, 1.29601E2, 1.86601E2, 1.43401E2, 1.86601E2, 1.43401E2);
        ctx.bezierCurveTo(1.84801E2, 1.46001E2, 1.74601E2, 1.58001E2, 1.74601E2, 1.58001E2);
        ctx.bezierCurveTo(1.72601E2, 1.65001E2, 1.54601E2, 1.57801E2, 1.54601E2, 1.57801E2);
        ctx.bezierCurveTo(1.48001E2, 1.61201E2, 1.50001E2, 1.57801E2, 1.50001E2, 1.57801E2);
        ctx.bezierCurveTo(1.49601E2, 1.55601E2, 1.54401E2, 1.49601E2, 1.54401E2, 1.49601E2);
        ctx.bezierCurveTo(1.61401E2, 1.47001E2, 1.58801E2, 1.36201E2, 1.58801E2, 1.36201E2);
        ctx.bezierCurveTo(1.62801E2, 1.34801E2, 1.51601E2, 1.32001E2, 1.51801E2, 1.30801E2);
        ctx.bezierCurveTo(1.52001E2, 1.29601E2, 1.57801E2, 1.28201E2, 1.57801E2, 1.28201E2);
        ctx.bezierCurveTo(1.65801E2, 1.26201E2, 1.61401E2, 1.23801E2, 1.61401E2, 1.23801E2);
        ctx.bezierCurveTo(1.60801E2, 1.19801E2, 1.63801E2, 1.14201E2, 1.63801E2, 1.14201E2);
        ctx.bezierCurveTo(1.75401E2, 1.13401E2, 1.63801E2, 9.72E1, 1.63801E2, 9.72E1);
        ctx.bezierCurveTo(1.53001E2, 8.96E1, 1.52001E2, 8.38E1, 1.52001E2, 8.38E1);
        ctx.bezierCurveTo(1.64601E2, 7.56E1, 1.56401E2, 6.32E1, 1.56601E2, 5.96E1);
        ctx.bezierCurveTo(1.56801E2, 5.6E1, 1.58001E2, 3.44E1, 1.58001E2, 3.44E1);
        ctx.bezierCurveTo(1.56001E2, 2.82E1, 1.53001E2, 1.46E1, 1.53001E2, 1.46E1);
        ctx.bezierCurveTo(1.55201E2, 9.4E0, 1.62601E2, (-3.2E0), 1.62601E2, (-3.2E0));
        ctx.bezierCurveTo(1.65401E2, (-7.4E0), 1.74201E2, (-1.22E1), 1.72001E2, (-1.52E1));
        ctx.bezierCurveTo(1.69801E2, (-1.82E1), 1.62001E2, (-1.64E1), 1.62001E2, (-1.64E1));
        ctx.bezierCurveTo(1.54201E2, (-1.78E1), 1.54801E2, (-1.26E1), 1.54801E2, (-1.26E1));
        ctx.bezierCurveTo(1.53201E2, (-1.16E1), 1.52401E2, (-6.6E0), 1.52401E2, (-6.6E0));
        ctx.bezierCurveTo(1.5168E2, 1.333E0, 1.42801E2, 7.6E0, 1.42801E2, 7.6E0);
        ctx.bezierCurveTo(1.31601E2, 1.38E1, 1.40801E2, 1.78E1, 1.40801E2, 1.78E1);
        ctx.bezierCurveTo(1.46801E2, 2.44E1, 1.37001E2, 2.46E1, 1.37001E2, 2.46E1);
        ctx.bezierCurveTo(1.26001E2, 2.28E1, 1.34201E2, 3.3E1, 1.34201E2, 3.3E1);
        ctx.bezierCurveTo(1.45001E2, 4.58E1, 1.42001E2, 4.86E1, 1.42001E2, 4.86E1);
        ctx.bezierCurveTo(1.31801E2, 4.96E1, 1.44401E2, 5.88E1, 1.44401E2, 5.88E1);
        ctx.bezierCurveTo(1.44401E2, 5.88E1, 1.43601E2, 5.68E1, 1.43801E2, 5.86E1);
        ctx.bezierCurveTo(1.44001E2, 6.04E1, 1.47001E2, 6.46E1, 1.47801E2, 6.66E1);
        ctx.bezierCurveTo(1.48601E2, 6.86E1, 1.44601E2, 6.88E1, 1.44601E2, 6.88E1);
        ctx.bezierCurveTo(1.45201E2, 7.84E1, 1.29801E2, 7.42E1, 1.29801E2, 7.42E1);
        ctx.bezierCurveTo(1.29801E2, 7.42E1, 1.29801E2, 7.42E1, 1.28201E2, 7.44E1);
        ctx.bezierCurveTo(1.26601E2, 7.46E1, 1.15401E2, 7.38E1, 1.09601E2, 7.16E1);
        ctx.bezierCurveTo(1.03801E2, 6.94E1, 9.7001E1, 6.94E1, 9.7001E1, 6.94E1);
        ctx.bezierCurveTo(9.7001E1, 6.94E1, 9.3001E1, 7.12E1, 8.54E1, 7.1E1);
        ctx.bezierCurveTo(7.78E1, 7.08E1, 6.98E1, 7.36E1, 6.98E1, 7.36E1);
        ctx.bezierCurveTo(6.54E1, 7.32E1, 7.4E1, 6.88E1, 7.42E1, 6.9E1);
        ctx.bezierCurveTo(7.44E1, 6.92E1, 8E1, 6.36E1, 7.2E1, 6.42E1);
        ctx.bezierCurveTo(5.0203E1, 6.5835E1, 3.94E1, 5.56E1, 3.94E1, 5.56E1);
        ctx.bezierCurveTo(3.74E1, 5.42E1, 3.48E1, 5.14E1, 3.48E1, 5.14E1);
        ctx.bezierCurveTo(2.48E1, 4.94E1, 3.62E1, 6.38E1, 3.62E1, 6.38E1);
        ctx.bezierCurveTo(3.74E1, 6.52E1, 3.6E1, 6.62E1, 3.6E1, 6.62E1);
        ctx.bezierCurveTo(3.52E1, 6.46E1, 2.74E1, 5.92E1, 2.74E1, 5.92E1);
        ctx.bezierCurveTo(2.4589E1, 5.8227E1, 2.3226E1, 5.6893E1, 2.0895E1, 5.4407E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#4c0000';
        ctx.fillStyle = 'rgba(76,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#4c0000';
        ctx.fillStyle = 'rgba(76,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3E0), 4.28E1);
        ctx.bezierCurveTo((-3E0), 4.28E1, 8.6E0, 4.84E1, 1.12E1, 5.12E1);
        ctx.bezierCurveTo(1.38E1, 5.4E1, 2.78E1, 6.54E1, 2.78E1, 6.54E1);
        ctx.bezierCurveTo(2.78E1, 6.54E1, 2.24E1, 6.34E1, 1.98E1, 6.16E1);
        ctx.bezierCurveTo(1.72E1, 5.98E1, 6.4E0, 5.16E1, 6.4E0, 5.16E1);
        ctx.bezierCurveTo(6.4E0, 5.16E1, 2.6E0, 4.56E1, (-3E0), 4.28E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#99cc32';
        ctx.fillStyle = 'rgba(153,204,50,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#99cc32';
        ctx.fillStyle = 'rgba(153,204,50,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.1009E1), 1.1603E1);
        ctx.bezierCurveTo((-6.0672E1), 1.1455E1, (-6.1196E1), 8.743E0, (-6.14E1), 8.2E0);
        ctx.bezierCurveTo((-6.2422E1), 5.474E0, (-7.14E1), 4E0, (-7.14E1), 4E0);
        ctx.bezierCurveTo((-7.1627E1), 5.365E0, (-7.1682E1), 6.961E0, (-7.1576E1), 8.599E0);
        ctx.bezierCurveTo((-7.1576E1), 8.599E0, (-6.6708E1), 1.4118E1, (-6.1009E1), 1.1603E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#659900';
        ctx.fillStyle = 'rgba(101,153,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#659900';
        ctx.fillStyle = 'rgba(101,153,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.1009E1), 1.1403E1);
        ctx.bezierCurveTo((-6.1458E1), 1.1561E1, (-6.1024E1), 8.669E0, (-6.12E1), 8.2E0);
        ctx.bezierCurveTo((-6.2222E1), 5.474E0, (-7.14E1), 3.9E0, (-7.14E1), 3.9E0);
        ctx.bezierCurveTo((-7.1627E1), 5.265E0, (-7.1682E1), 6.861E0, (-7.1576E1), 8.499E0);
        ctx.bezierCurveTo((-7.1576E1), 8.499E0, (-6.7308E1), 1.3618E1, (-6.1009E1), 1.1403E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.54E1), 1.1546E1);
        ctx.bezierCurveTo((-6.6025E1), 1.1546E1, (-6.6531E1), 1.0406E1, (-6.6531E1), 9E0);
        ctx.bezierCurveTo((-6.6531E1), 7.595E0, (-6.6025E1), 6.455E0, (-6.54E1), 6.455E0);
        ctx.bezierCurveTo((-6.4775E1), 6.455E0, (-6.4268E1), 7.595E0, (-6.4268E1), 9E0);
        ctx.bezierCurveTo((-6.4268E1), 1.0406E1, (-6.4775E1), 1.1546E1, (-6.54E1), 1.1546E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.54E1), 9E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.11E2), 1.09601E2);
        ctx.bezierCurveTo((-1.11E2), 1.09601E2, (-1.166E2), 1.19601E2, (-9.18E1), 1.13601E2);
        ctx.bezierCurveTo((-9.18E1), 1.13601E2, (-7.78E1), 1.12401E2, (-7.54E1), 1.10001E2);
        ctx.bezierCurveTo((-7.42E1), 1.10801E2, (-6.5834E1), 1.13734E2, (-6.3E1), 1.14401E2);
        ctx.bezierCurveTo((-5.62E1), 1.16001E2, (-4.78E1), 1.06E2, (-4.78E1), 1.06E2);
        ctx.bezierCurveTo((-4.78E1), 1.06E2, (-4.32E1), 9.55E1, (-4.04E1), 9.55E1);
        ctx.bezierCurveTo((-3.76E1), 9.55E1, (-4.08E1), 9.71E1, (-4.08E1), 9.71E1);
        ctx.bezierCurveTo((-4.08E1), 9.71E1, (-4.74E1), 1.07201E2, (-4.7E1), 1.08801E2);
        ctx.bezierCurveTo((-4.7E1), 1.08801E2, (-5.22E1), 1.28801E2, (-6.82E1), 1.29601E2);
        ctx.bezierCurveTo((-6.82E1), 1.29601E2, (-8.435E1), 1.30551E2, (-8.3E1), 1.36401E2);
        ctx.bezierCurveTo((-8.3E1), 1.36401E2, (-7.42E1), 1.34001E2, (-7.18E1), 1.36401E2);
        ctx.bezierCurveTo((-7.18E1), 1.36401E2, (-6.1E1), 1.36001E2, (-6.9E1), 1.42401E2);
        ctx.lineTo((-7.58E1), 1.54001E2);
        ctx.bezierCurveTo((-7.58E1), 1.54001E2, (-7.566E1), 1.57919E2, (-8.58E1), 1.54401E2);
        ctx.bezierCurveTo((-9.56E1), 1.51001E2, (-1.059E2), 1.38101E2, (-1.059E2), 1.38101E2);
        ctx.bezierCurveTo((-1.059E2), 1.38101E2, (-1.2185E2), 1.23551E2, (-1.11E2), 1.09601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#e59999';
        ctx.fillStyle = 'rgba(229,153,153,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#e59999';
        ctx.fillStyle = 'rgba(229,153,153,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.122E2), 1.13601E2);
        ctx.bezierCurveTo((-1.122E2), 1.13601E2, (-1.142E2), 1.23201E2, (-7.74E1), 1.12801E2);
        ctx.bezierCurveTo((-7.74E1), 1.12801E2, (-7.3E1), 1.12801E2, (-7.06E1), 1.13601E2);
        ctx.bezierCurveTo((-6.82E1), 1.14401E2, (-5.62E1), 1.17201E2, (-5.42E1), 1.16001E2);
        ctx.bezierCurveTo((-5.42E1), 1.16001E2, (-6.14E1), 1.29601E2, (-7.3E1), 1.28001E2);
        ctx.bezierCurveTo((-7.3E1), 1.28001E2, (-8.62E1), 1.29601E2, (-8.58E1), 1.34401E2);
        ctx.bezierCurveTo((-8.58E1), 1.34401E2, (-8.18E1), 1.41601E2, (-7.7E1), 1.44001E2);
        ctx.bezierCurveTo((-7.7E1), 1.44001E2, (-7.42E1), 1.46401E2, (-7.46E1), 1.49601E2);
        ctx.bezierCurveTo((-7.5E1), 1.52801E2, (-7.78E1), 1.54401E2, (-7.98E1), 1.55201E2);
        ctx.bezierCurveTo((-8.18E1), 1.56001E2, (-8.5E1), 1.52801E2, (-8.66E1), 1.52801E2);
        ctx.bezierCurveTo((-8.82E1), 1.52801E2, (-9.66E1), 1.46401E2, (-1.01E2), 1.41601E2);
        ctx.bezierCurveTo((-1.054E2), 1.36801E2, (-1.138E2), 1.24801E2, (-1.134E2), 1.22001E2);
        ctx.bezierCurveTo((-1.13E2), 1.19201E2, (-1.122E2), 1.13601E2, (-1.122E2), 1.13601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#b26565';
        ctx.fillStyle = 'rgba(178,101,101,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#b26565';
        ctx.fillStyle = 'rgba(178,101,101,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.09E2), 1.31051E2);
        ctx.bezierCurveTo((-1.064E2), 1.35001E2, (-1.032E2), 1.39201E2, (-1.01E2), 1.41601E2);
        ctx.bezierCurveTo((-9.66E1), 1.46401E2, (-8.82E1), 1.52801E2, (-8.66E1), 1.52801E2);
        ctx.bezierCurveTo((-8.5E1), 1.52801E2, (-8.18E1), 1.56001E2, (-7.98E1), 1.55201E2);
        ctx.bezierCurveTo((-7.78E1), 1.54401E2, (-7.5E1), 1.52801E2, (-7.46E1), 1.49601E2);
        ctx.bezierCurveTo((-7.42E1), 1.46401E2, (-7.7E1), 1.44001E2, (-7.7E1), 1.44001E2);
        ctx.bezierCurveTo((-8.0066E1), 1.42468E2, (-8.2806E1), 1.38976E2, (-8.4385E1), 1.36653E2);
        ctx.bezierCurveTo((-8.4385E1), 1.36653E2, (-8.42E1), 1.39201E2, (-8.94E1), 1.38401E2);
        ctx.bezierCurveTo((-9.46E1), 1.37601E2, (-9.98E1), 1.34801E2, (-1.014E2), 1.31601E2);
        ctx.bezierCurveTo((-1.03E2), 1.28401E2, (-1.054E2), 1.26001E2, (-1.038E2), 1.29601E2);
        ctx.bezierCurveTo((-1.022E2), 1.33201E2, (-9.98E1), 1.36801E2, (-9.82E1), 1.37201E2);
        ctx.bezierCurveTo((-9.66E1), 1.37601E2, (-9.7E1), 1.38801E2, (-9.94E1), 1.38401E2);
        ctx.bezierCurveTo((-1.018E2), 1.38001E2, (-1.046E2), 1.37601E2, (-1.09E2), 1.32401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.116E2), 1.10001E2);
        ctx.bezierCurveTo((-1.116E2), 1.10001E2, (-1.098E2), 9.64E1, (-1.086E2), 9.24E1);
        ctx.bezierCurveTo((-1.086E2), 9.24E1, (-1.094E2), 8.56E1, (-1.07E2), 8.14E1);
        ctx.bezierCurveTo((-1.046E2), 7.72E1, (-1.026E2), 7.1E1, (-9.96E1), 6.56E1);
        ctx.bezierCurveTo((-9.66E1), 6.02E1, (-9.64E1), 5.62E1, (-9.24E1), 5.46E1);
        ctx.bezierCurveTo((-8.84E1), 5.3E1, (-8.24E1), 4.44E1, (-7.96E1), 4.34E1);
        ctx.bezierCurveTo((-7.68E1), 4.24E1, (-7.7E1), 4.32E1, (-7.7E1), 4.32E1);
        ctx.bezierCurveTo((-7.7E1), 4.32E1, (-7.02E1), 2.84E1, (-5.66E1), 3.24E1);
        ctx.bezierCurveTo((-5.66E1), 3.24E1, (-7.28E1), 2.96E1, (-5.7E1), 2.02E1);
        ctx.bezierCurveTo((-5.7E1), 2.02E1, (-6.18E1), 2.13E1, (-5.85E1), 1.43E1);
        ctx.bezierCurveTo((-5.6299E1), 9.632E0, (-5.68E1), 1.64E1, (-6.78E1), 2.82E1);
        ctx.bezierCurveTo((-6.78E1), 2.82E1, (-7.28E1), 3.68E1, (-7.8E1), 3.98E1);
        ctx.bezierCurveTo((-8.32E1), 4.28E1, (-9.52E1), 4.98E1, (-9.64E1), 5.36E1);
        ctx.bezierCurveTo((-9.76E1), 5.74E1, (-1.008E2), 6.32E1, (-1.028E2), 6.48E1);
        ctx.bezierCurveTo((-1.048E2), 6.64E1, (-1.076E2), 7.06E1, (-1.08E2), 7.4E1);
        ctx.bezierCurveTo((-1.08E2), 7.4E1, (-1.092E2), 7.8E1, (-1.106E2), 7.92E1);
        ctx.bezierCurveTo((-1.12E2), 8.04E1, (-1.122E2), 8.36E1, (-1.122E2), 8.56E1);
        ctx.bezierCurveTo((-1.122E2), 8.76E1, (-1.142E2), 9.04E1, (-1.14E2), 9.28E1);
        ctx.bezierCurveTo((-1.14E2), 9.28E1, (-1.132E2), 1.11801E2, (-1.136E2), 1.13801E2);
        ctx.lineTo((-1.116E2), 1.10001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.202E2), 1.14601E2);
        ctx.bezierCurveTo((-1.202E2), 1.14601E2, (-1.222E2), 1.13201E2, (-1.266E2), 1.19201E2);
        ctx.bezierCurveTo((-1.266E2), 1.19201E2, (-1.193E2), 1.52201E2, (-1.193E2), 1.53601E2);
        ctx.bezierCurveTo((-1.193E2), 1.53601E2, (-1.182E2), 1.51501E2, (-1.195E2), 1.44301E2);
        ctx.bezierCurveTo((-1.208E2), 1.37101E2, (-1.217E2), 1.24401E2, (-1.217E2), 1.24401E2);
        ctx.lineTo((-1.202E2), 1.14601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.86E1), 5.4E1);
        ctx.bezierCurveTo((-9.86E1), 5.4E1, (-1.162E2), 5.72E1, (-1.158E2), 8.64E1);
        ctx.lineTo((-1.166E2), 1.11201E2);
        ctx.bezierCurveTo((-1.166E2), 1.11201E2, (-1.178E2), 8.56E1, (-1.19E2), 8.4E1);
        ctx.bezierCurveTo((-1.202E2), 8.24E1, (-1.162E2), 7.12E1, (-1.194E2), 7.72E1);
        ctx.bezierCurveTo((-1.194E2), 7.72E1, (-1.334E2), 9.12E1, (-1.254E2), 1.12401E2);
        ctx.bezierCurveTo((-1.254E2), 1.12401E2, (-1.239E2), 1.15701E2, (-1.269E2), 1.11101E2);
        ctx.bezierCurveTo((-1.269E2), 1.11101E2, (-1.315E2), 9.85E1, (-1.304E2), 9.21E1);
        ctx.bezierCurveTo((-1.304E2), 9.21E1, (-1.302E2), 8.99E1, (-1.283E2), 8.71E1);
        ctx.bezierCurveTo((-1.283E2), 8.71E1, (-1.197E2), 7.54E1, (-1.17E2), 7.31E1);
        ctx.bezierCurveTo((-1.17E2), 7.31E1, (-1.152E2), 5.87E1, (-9.98E1), 5.35E1);
        ctx.bezierCurveTo((-9.98E1), 5.35E1, (-9.41E1), 5.12E1, (-9.86E1), 5.4E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.08E1, (-1.22E1));
        ctx.bezierCurveTo(4.146E1, (-1.2554E1), 4.1451E1, (-1.3524E1), 4.2031E1, (-1.3697E1));
        ctx.bezierCurveTo(4.318E1, (-1.4041E1), 4.3344E1, (-1.5108E1), 4.3862E1, (-1.5892E1));
        ctx.bezierCurveTo(4.4735E1, (-1.7211E1), 4.4928E1, (-1.8744E1), 4.551E1, (-2.0235E1));
        ctx.bezierCurveTo(4.5782E1, (-2.0935E1), 4.5809E1, (-2.189E1), 4.5496E1, (-2.255E1));
        ctx.bezierCurveTo(4.4322E1, (-2.5031E1), 4.362E1, (-2.748E1), 4.2178E1, (-2.9906E1));
        ctx.bezierCurveTo(4.191E1, (-3.0356E1), 4.1648E1, (-3.115E1), 4.1447E1, (-3.1748E1));
        ctx.bezierCurveTo(4.0984E1, (-3.3132E1), 3.9727E1, (-3.4123E1), 3.8867E1, (-3.5443E1));
        ctx.bezierCurveTo(3.8579E1, (-3.5884E1), 3.9104E1, (-3.6809E1), 3.8388E1, (-3.6893E1));
        ctx.bezierCurveTo(3.7491E1, (-3.6998E1), 3.6042E1, (-3.7578E1), 3.5809E1, (-3.6552E1));
        ctx.bezierCurveTo(3.5221E1, (-3.3965E1), 3.6232E1, (-3.1442E1), 3.72E1, (-2.9E1));
        ctx.bezierCurveTo(3.6418E1, (-2.8308E1), 3.6752E1, (-2.7387E1), 3.6904E1, (-2.662E1));
        ctx.bezierCurveTo(3.7614E1, (-2.3014E1), 3.6416E1, (-1.9662E1), 3.5655E1, (-1.6188E1));
        ctx.bezierCurveTo(3.5632E1, (-1.6084E1), 3.5974E1, (-1.5886E1), 3.5946E1, (-1.5824E1));
        ctx.bezierCurveTo(3.4724E1, (-1.3138E1), 3.3272E1, (-1.0693E1), 3.1453E1, (-8.312E0));
        ctx.bezierCurveTo(3.0695E1, (-7.32E0), 2.9823E1, (-6.404E0), 2.9326E1, (-5.341E0));
        ctx.bezierCurveTo(2.8958E1, (-4.554E0), 2.855E1, (-3.588E0), 2.88E1, (-2.6E0));
        ctx.bezierCurveTo(2.5365E1, 1.8E-1, 2.3115E1, 4.025E0, 2.0504E1, 7.871E0);
        ctx.bezierCurveTo(2.0042E1, 8.551E0, 2.0333E1, 9.76E0, 2.0884E1, 1.0029E1);
        ctx.bezierCurveTo(2.1697E1, 1.0427E1, 2.2653E1, 9.403E0, 2.3123E1, 8.557E0);
        ctx.bezierCurveTo(2.3512E1, 7.859E0, 2.3865E1, 7.209E0, 2.4356E1, 6.566E0);
        ctx.bezierCurveTo(2.4489E1, 6.391E0, 2.431E1, 5.972E0, 2.4445E1, 5.851E0);
        ctx.bezierCurveTo(2.7078E1, 3.504E0, 2.8747E1, 5.68E-1, 3.12E1, (-1.8E0));
        ctx.bezierCurveTo(3.315E1, (-2.129E0), 3.4687E1, (-3.127E0), 3.6435E1, (-4.14E0));
        ctx.bezierCurveTo(3.6743E1, (-4.319E0), 3.7267E1, (-4.07E0), 3.7557E1, (-4.265E0));
        ctx.bezierCurveTo(3.931E1, (-5.442E0), 3.9308E1, (-7.478E0), 3.9414E1, (-9.388E0));
        ctx.bezierCurveTo(3.9464E1, (-1.0272E1), 3.966E1, (-1.1589E1), 4.08E1, (-1.22E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.1959E1, (-1.6666E1));
        ctx.bezierCurveTo(3.2083E1, (-1.6743E1), 3.1928E1, (-1.7166E1), 3.2037E1, (-1.7382E1));
        ctx.bezierCurveTo(3.2199E1, (-1.7706E1), 3.2602E1, (-1.7894E1), 3.2764E1, (-1.8218E1));
        ctx.bezierCurveTo(3.2873E1, (-1.8434E1), 3.271E1, (-1.8814E1), 3.2846E1, (-1.8956E1));
        ctx.bezierCurveTo(3.5179E1, (-2.1403E1), 3.5436E1, (-2.4427E1), 3.44E1, (-2.74E1));
        ctx.bezierCurveTo(3.5424E1, (-2.802E1), 3.5485E1, (-2.9282E1), 3.506E1, (-3.0129E1));
        ctx.bezierCurveTo(3.4207E1, (-3.1829E1), 3.4014E1, (-3.3755E1), 3.3039E1, (-3.5298E1));
        ctx.bezierCurveTo(3.2237E1, (-3.6567E1), 3.0659E1, (-3.7811E1), 2.9288E1, (-3.6508E1));
        ctx.bezierCurveTo(2.8867E1, (-3.6108E1), 2.8546E1, (-3.5321E1), 2.8824E1, (-3.4609E1));
        ctx.bezierCurveTo(2.8888E1, (-3.4446E1), 2.9173E1, (-3.43E1), 2.9146E1, (-3.4218E1));
        ctx.bezierCurveTo(2.9039E1, (-3.3894E1), 2.8493E1, (-3.367E1), 2.8487E1, (-3.3398E1));
        ctx.bezierCurveTo(2.8457E1, (-3.1902E1), 2.7503E1, (-3.0391E1), 2.8133E1, (-2.9062E1));
        ctx.bezierCurveTo(2.8905E1, (-2.7433E1), 2.9724E1, (-2.5576E1), 3.04E1, (-2.38E1));
        ctx.bezierCurveTo(2.9166E1, (-2.1684E1), 3.0199E1, (-1.9235E1), 2.8446E1, (-1.7358E1));
        ctx.bezierCurveTo(2.831E1, (-1.7212E1), 2.8319E1, (-1.6826E1), 2.8441E1, (-1.6624E1));
        ctx.bezierCurveTo(2.8733E1, (-1.6138E1), 2.9139E1, (-1.5732E1), 2.9625E1, (-1.544E1));
        ctx.bezierCurveTo(2.9827E1, (-1.5319E1), 3.0175E1, (-1.5317E1), 3.0375E1, (-1.5441E1));
        ctx.bezierCurveTo(3.0953E1, (-1.5803E1), 3.1351E1, (-1.629E1), 3.1959E1, (-1.6666E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(9.4771E1, (-2.6977E1));
        ctx.bezierCurveTo(9.616E1, (-2.5185E1), 9.645E1, (-2.239E1), 9.4401E1, (-2.1E1));
        ctx.bezierCurveTo(9.4951E1, (-1.7691E1), 9.8302E1, (-1.967E1), 1.00401E2, (-2.02E1));
        ctx.bezierCurveTo(1.00292E2, (-2.0588E1), 1.00519E2, (-2.0932E1), 1.00802E2, (-2.0937E1));
        ctx.bezierCurveTo(1.01859E2, (-2.0952E1), 1.02539E2, (-2.1984E1), 1.03601E2, (-2.18E1));
        ctx.bezierCurveTo(1.04035E2, (-2.3357E1), 1.05673E2, (-2.4059E1), 1.06317E2, (-2.5439E1));
        ctx.bezierCurveTo(1.08043E2, (-2.9134E1), 1.07452E2, (-3.3407E1), 1.04868E2, (-3.6653E1));
        ctx.bezierCurveTo(1.04666E2, (-3.6907E1), 1.04883E2, (-3.7424E1), 1.04759E2, (-3.7786E1));
        ctx.bezierCurveTo(1.04003E2, (-3.9997E1), 1.01935E2, (-4.0312E1), 1.00001E2, (-4.1E1));
        ctx.bezierCurveTo(9.8824E1, (-4.4875E1), 9.8163E1, (-4.8906E1), 9.6401E1, (-5.26E1));
        ctx.bezierCurveTo(9.4787E1, (-5.285E1), 9.4089E1, (-5.4589E1), 9.2752E1, (-5.5309E1));
        ctx.bezierCurveTo(9.1419E1, (-5.6028E1), 9.0851E1, (-5.4449E1), 9.0892E1, (-5.3403E1));
        ctx.bezierCurveTo(9.0899E1, (-5.3198E1), 9.1351E1, (-5.2974E1), 9.1181E1, (-5.2609E1));
        ctx.bezierCurveTo(9.1105E1, (-5.2445E1), 9.0845E1, (-5.2334E1), 9.0845E1, (-5.22E1));
        ctx.bezierCurveTo(9.0846E1, (-5.2065E1), 9.1067E1, (-5.1934E1), 9.1201E1, (-5.18E1));
        ctx.bezierCurveTo(9.0283E1, (-5.098E1), 8.886E1, (-5.0503E1), 8.8565E1, (-4.9358E1));
        ctx.bezierCurveTo(8.7611E1, (-4.5648E1), 9.0184E1, (-4.2523E1), 9.1852E1, (-3.9322E1));
        ctx.bezierCurveTo(9.2443E1, (-3.8187E1), 9.1707E1, (-3.6916E1), 9.0947E1, (-3.5708E1));
        ctx.bezierCurveTo(9.0509E1, (-3.5013E1), 9.0617E1, (-3.3886E1), 9.0893E1, (-3.303E1));
        ctx.bezierCurveTo(9.1645E1, (-3.0699E1), 9.3236E1, (-2.896E1), 9.4771E1, (-2.6977E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.7611E1, (-8.591E0));
        ctx.bezierCurveTo(5.6124E1, (-6.74E0), 5.2712E1, (-4.171E0), 5.5629E1, (-2.243E0));
        ctx.bezierCurveTo(5.5823E1, (-2.114E0), 5.6193E1, (-2.11E0), 5.6366E1, (-2.244E0));
        ctx.bezierCurveTo(5.8387E1, (-3.809E0), 6.039E1, (-4.712E0), 6.2826E1, (-5.294E0));
        ctx.bezierCurveTo(6.295E1, (-5.323E0), 6.3224E1, (-4.856E0), 6.3593E1, (-5.017E0));
        ctx.bezierCurveTo(6.5206E1, (-5.72E0), 6.7216E1, (-5.662E0), 6.84E1, (-7E0));
        ctx.bezierCurveTo(7.2167E1, (-6.776E0), 7.5732E1, (-7.892E0), 7.9123E1, (-9.2E0));
        ctx.bezierCurveTo(8.0284E1, (-9.648E0), 8.1554E1, (-1.0207E1), 8.2755E1, (-1.0709E1));
        ctx.bezierCurveTo(8.4131E1, (-1.1285E1), 8.5335E1, (-1.2213E1), 8.6447E1, (-1.3354E1));
        ctx.bezierCurveTo(8.658E1, (-1.349E1), 8.6934E1, (-1.34E1), 8.7201E1, (-1.34E1));
        ctx.bezierCurveTo(8.7161E1, (-1.4263E1), 8.8123E1, (-1.439E1), 8.837E1, (-1.5012E1));
        ctx.bezierCurveTo(8.8462E1, (-1.5244E1), 8.8312E1, (-1.564E1), 8.8445E1, (-1.5742E1));
        ctx.bezierCurveTo(9.0583E1, (-1.7372E1), 9.1503E1, (-1.939E1), 9.0334E1, (-2.1767E1));
        ctx.bezierCurveTo(9.0049E1, (-2.2345E1), 8.98E1, (-2.2963E1), 8.9234E1, (-2.3439E1));
        ctx.bezierCurveTo(8.8149E1, (-2.435E1), 8.7047E1, (-2.3496E1), 8.6E1, (-2.38E1));
        ctx.bezierCurveTo(8.5841E1, (-2.3172E1), 8.5112E1, (-2.3344E1), 8.4726E1, (-2.3146E1));
        ctx.bezierCurveTo(8.3867E1, (-2.2707E1), 8.2534E1, (-2.3292E1), 8.1675E1, (-2.2854E1));
        ctx.bezierCurveTo(8.0313E1, (-2.2159E1), 7.9072E1, (-2.199E1), 7.765E1, (-2.1613E1));
        ctx.bezierCurveTo(7.7338E1, (-2.1531E1), 7.656E1, (-2.1627E1), 7.64E1, (-2.1E1));
        ctx.bezierCurveTo(7.6266E1, (-2.1134E1), 7.6118E1, (-2.1368E1), 7.6012E1, (-2.1346E1));
        ctx.bezierCurveTo(7.4104E1, (-2.095E1), 7.2844E1, (-2.0736E1), 7.1543E1, (-1.9044E1));
        ctx.bezierCurveTo(7.144E1, (-1.8911E1), 7.0998E1, (-1.909E1), 7.0839E1, (-1.8955E1));
        ctx.bezierCurveTo(6.9882E1, (-1.8147E1), 6.9477E1, (-1.6913E1), 6.8376E1, (-1.6241E1));
        ctx.bezierCurveTo(6.8175E1, (-1.6118E1), 6.7823E1, (-1.6286E1), 6.7629E1, (-1.6157E1));
        ctx.bezierCurveTo(6.6983E1, (-1.5726E1), 6.6616E1, (-1.5085E1), 6.5974E1, (-1.4638E1));
        ctx.bezierCurveTo(6.5645E1, (-1.4409E1), 6.5245E1, (-1.4734E1), 6.5277E1, (-1.499E1));
        ctx.bezierCurveTo(6.5522E1, (-1.6937E1), 6.6175E1, (-1.8724E1), 6.56E1, (-2.06E1));
        ctx.bezierCurveTo(6.7677E1, (-2.312E1), 7.0194E1, (-2.5069E1), 7.2E1, (-2.78E1));
        ctx.bezierCurveTo(7.2015E1, (-2.9966E1), 7.2707E1, (-3.2112E1), 7.2594E1, (-3.4189E1));
        ctx.bezierCurveTo(7.2584E1, (-3.4382E1), 7.2296E1, (-3.5115E1), 7.217E1, (-3.5462E1));
        ctx.bezierCurveTo(7.1858E1, (-3.6316E1), 7.2764E1, (-3.7382E1), 7.192E1, (-3.8106E1));
        ctx.bezierCurveTo(7.0516E1, (-3.9309E1), 6.9224E1, (-3.8433E1), 6.84E1, (-3.7E1));
        ctx.bezierCurveTo(6.6562E1, (-3.661E1), 6.4496E1, (-3.5917E1), 6.2918E1, (-3.7151E1));
        ctx.bezierCurveTo(6.1911E1, (-3.7938E1), 6.1333E1, (-3.8844E1), 6.0534E1, (-3.99E1));
        ctx.bezierCurveTo(5.9549E1, (-4.1202E1), 5.9884E1, (-4.2638E1), 5.9954E1, (-4.4202E1));
        ctx.bezierCurveTo(5.996E1, (-4.433E1), 5.9645E1, (-4.4466E1), 5.9645E1, (-4.46E1));
        ctx.bezierCurveTo(5.9646E1, (-4.4735E1), 5.9866E1, (-4.4866E1), 6E1, (-4.5E1));
        ctx.bezierCurveTo(5.9294E1, (-4.5626E1), 5.9019E1, (-4.6684E1), 5.8E1, (-4.7E1));
        ctx.bezierCurveTo(5.8305E1, (-4.8092E1), 5.7629E1, (-4.8976E1), 5.6758E1, (-4.9278E1));
        ctx.bezierCurveTo(5.4763E1, (-4.9969E1), 5.3086E1, (-4.8057E1), 5.1194E1, (-4.7984E1));
        ctx.bezierCurveTo(5.068E1, (-4.7965E1), 5.0213E1, (-4.9003E1), 4.9564E1, (-4.9328E1));
        ctx.bezierCurveTo(4.9132E1, (-4.9544E1), 4.8428E1, (-4.9577E1), 4.8066E1, (-4.9311E1));
        ctx.bezierCurveTo(4.7378E1, (-4.8807E1), 4.6789E1, (-4.8693E1), 4.6031E1, (-4.8488E1));
        ctx.bezierCurveTo(4.4414E1, (-4.8052E1), 4.3136E1, (-4.6958E1), 4.1656E1, (-4.6103E1));
        ctx.bezierCurveTo(4.0171E1, (-4.5246E1), 3.9216E1, (-4.3809E1), 3.8136E1, (-4.2489E1));
        ctx.bezierCurveTo(3.7195E1, (-4.1337E1), 3.7059E1, (-3.8923E1), 3.8479E1, (-3.8423E1));
        ctx.bezierCurveTo(4.0322E1, (-3.7773E1), 4.1626E1, (-4.0476E1), 4.3592E1, (-4.015E1));
        ctx.bezierCurveTo(4.3904E1, (-4.0099E1), 4.411E1, (-3.9788E1), 4.4E1, (-3.94E1));
        ctx.bezierCurveTo(4.4389E1, (-3.9291E1), 4.4607E1, (-3.952E1), 4.48E1, (-3.98E1));
        ctx.bezierCurveTo(4.5658E1, (-3.8781E1), 4.6822E1, (-3.8444E1), 4.776E1, (-3.7571E1));
        ctx.bezierCurveTo(4.873E1, (-3.6667E1), 5.0476E1, (-3.7085E1), 5.1491E1, (-3.6088E1));
        ctx.bezierCurveTo(5.302E1, (-3.4586E1), 5.2461E1, (-3.1905E1), 5.44E1, (-3.06E1));
        ctx.bezierCurveTo(5.3814E1, (-2.9287E1), 5.3207E1, (-2.801E1), 5.2872E1, (-2.6583E1));
        ctx.bezierCurveTo(5.259E1, (-2.5377E1), 5.3584E1, (-2.418E1), 5.4795E1, (-2.4271E1));
        ctx.bezierCurveTo(5.6053E1, (-2.4365E1), 5.6315E1, (-2.5124E1), 5.68E1, (-2.62E1));
        ctx.bezierCurveTo(5.7067E1, (-2.5933E1), 5.7536E1, (-2.5636E1), 5.7495E1, (-2.542E1));
        ctx.bezierCurveTo(5.7038E1, (-2.3033E1), 5.6011E1, (-2.104E1), 5.5553E1, (-1.8609E1));
        ctx.bezierCurveTo(5.5494E1, (-1.8292E1), 5.5189E1, (-1.809E1), 5.48E1, (-1.82E1));
        ctx.bezierCurveTo(5.4332E1, (-1.4051E1), 5.028E1, (-1.1657E1), 4.7735E1, (-8.492E0));
        ctx.bezierCurveTo(4.7332E1, (-7.99E0), 4.7328E1, (-6.741E0), 4.7737E1, (-6.338E0));
        ctx.bezierCurveTo(4.914E1, (-4.951E0), 5.11E1, (-6.497E0), 5.28E1, (-7E0));
        ctx.bezierCurveTo(5.3013E1, (-8.206E0), 5.3872E1, (-9.148E0), 5.5204E1, (-9.092E0));
        ctx.bezierCurveTo(5.546E1, (-9.082E0), 5.5695E1, (-9.624E0), 5.6019E1, (-9.754E0));
        ctx.bezierCurveTo(5.6367E1, (-9.892E0), 5.6869E1, (-9.668E0), 5.7155E1, (-9.866E0));
        ctx.bezierCurveTo(5.8884E1, (-1.1061E1), 6.0292E1, (-1.2167E1), 6.203E1, (-1.3356E1));
        ctx.bezierCurveTo(6.2222E1, (-1.3487E1), 6.2566E1, (-1.3328E1), 6.2782E1, (-1.3436E1));
        ctx.bezierCurveTo(6.3107E1, (-1.3598E1), 6.3294E1, (-1.3985E1), 6.3617E1, (-1.417E1));
        ctx.bezierCurveTo(6.3965E1, (-1.437E1), 6.4207E1, (-1.408E1), 6.44E1, (-1.38E1));
        ctx.bezierCurveTo(6.3754E1, (-1.3451E1), 6.375E1, (-1.2494E1), 6.3168E1, (-1.2292E1));
        ctx.bezierCurveTo(6.2393E1, (-1.2024E1), 6.1832E1, (-1.1511E1), 6.1158E1, (-1.1064E1));
        ctx.bezierCurveTo(6.0866E1, (-1.0871E1), 6.0207E1, (-1.1119E1), 6.0103E1, (-1.094E1));
        ctx.bezierCurveTo(5.9505E1, (-9.912E0), 5.8321E1, (-9.474E0), 5.7611E1, (-8.591E0));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.2E0, (-5.8E1));
        ctx.bezierCurveTo(2.2E0, (-5.8E1), (-7.038E0), (-6.0872E1), (-1.82E1), (-3.52E1));
        ctx.bezierCurveTo((-1.82E1), (-3.52E1), (-2.06E1), (-3E1), (-2.3E1), (-2.8E1));
        ctx.bezierCurveTo((-2.54E1), (-2.6E1), (-3.66E1), (-2.24E1), (-3.86E1), (-1.84E1));
        ctx.lineTo((-4.9E1), (-2.4E0));
        ctx.bezierCurveTo((-4.9E1), (-2.4E0), (-3.42E1), (-1.84E1), (-3.1E1), (-2.08E1));
        ctx.bezierCurveTo((-3.1E1), (-2.08E1), (-2.3E1), (-2.92E1), (-2.62E1), (-2.24E1));
        ctx.bezierCurveTo((-2.62E1), (-2.24E1), (-4.02E1), (-1.16E1), (-3.9E1), (-2.4E0));
        ctx.bezierCurveTo((-3.9E1), (-2.4E0), (-4.46E1), 1.2E1, (-4.54E1), 1.4E1);
        ctx.bezierCurveTo((-4.54E1), 1.4E1, (-2.94E1), (-1.8E1), (-2.7E1), (-1.92E1));
        ctx.bezierCurveTo((-2.46E1), (-2.04E1), (-2.34E1), (-2.04E1), (-2.46E1), (-1.68E1));
        ctx.bezierCurveTo((-2.58E1), (-1.32E1), (-2.62E1), 3.2E0, (-2.9E1), 5.2E0);
        ctx.bezierCurveTo((-2.9E1), 5.2E0, (-2.1E1), (-1.52E1), (-2.18E1), (-1.84E1));
        ctx.bezierCurveTo((-2.18E1), (-1.84E1), (-1.86E1), (-2.2E1), (-1.62E1), (-1.68E1));
        ctx.lineTo((-1.74E1), (-8E-1));
        ctx.lineTo((-1.3E1), 1.12E1);
        ctx.bezierCurveTo((-1.3E1), 1.12E1, (-1.54E1), 0E0, (-1.38E1), (-1.56E1));
        ctx.bezierCurveTo((-1.38E1), (-1.56E1), (-1.58E1), (-2.6E1), (-1.18E1), (-2.04E1));
        ctx.bezierCurveTo((-7.8E0), (-1.48E1), 1.8E0, (-8.8E0), 1.8E0, (-4E0));
        ctx.bezierCurveTo(1.8E0, (-4E0), (-3.4E0), (-2.16E1), (-1.26E1), (-2.64E1));
        ctx.lineTo((-1.66E1), (-2.04E1));
        ctx.lineTo((-1.78E1), (-2.24E1));
        ctx.bezierCurveTo((-1.78E1), (-2.24E1), (-2.14E1), (-2.32E1), (-1.7E1), (-3E1));
        ctx.bezierCurveTo((-1.26E1), (-3.68E1), (-1.3E1), (-3.76E1), (-1.3E1), (-3.76E1));
        ctx.bezierCurveTo((-1.3E1), (-3.76E1), (-6.6E0), (-3.04E1), (-5E0), (-3.04E1));
        ctx.bezierCurveTo((-5E0), (-3.04E1), 8.2E0, (-3.8E1), 9.4E0, (-1.36E1));
        ctx.bezierCurveTo(9.4E0, (-1.36E1), 1.62E1, (-2.8E1), 7E0, (-3.48E1));
        ctx.bezierCurveTo(7E0, (-3.48E1), (-7.8E0), (-3.68E1), (-6.6E0), (-4.2E1));
        ctx.lineTo(6E-1, (-5.44E1));
        ctx.bezierCurveTo(4.2E0, (-5.96E1), 2.6E0, (-5.68E1), 2.6E0, (-5.68E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.78E1), (-4.16E1));
        ctx.bezierCurveTo((-1.78E1), (-4.16E1), (-3.06E1), (-4.16E1), (-3.38E1), (-3.64E1));
        ctx.lineTo((-4.1E1), (-2.68E1));
        ctx.bezierCurveTo((-4.1E1), (-2.68E1), (-2.38E1), (-3.68E1), (-1.98E1), (-3.8E1));
        ctx.bezierCurveTo((-1.58E1), (-3.92E1), (-1.78E1), (-4.16E1), (-1.78E1), (-4.16E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.78E1), (-3.52E1));
        ctx.bezierCurveTo((-5.78E1), (-3.52E1), (-5.98E1), (-3.4E1), (-6.02E1), (-3.12E1));
        ctx.bezierCurveTo((-6.06E1), (-2.84E1), (-6.3E1), (-2.8E1), (-6.22E1), (-2.52E1));
        ctx.bezierCurveTo((-6.14E1), (-2.24E1), (-5.94E1), (-2E1), (-5.94E1), (-2.4E1));
        ctx.bezierCurveTo((-5.94E1), (-2.8E1), (-5.78E1), (-3E1), (-5.7E1), (-3.12E1));
        ctx.bezierCurveTo((-5.62E1), (-3.24E1), (-5.46E1), (-3.68E1), (-5.78E1), (-3.52E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.66E1), 2.6E1);
        ctx.bezierCurveTo((-6.66E1), 2.6E1, (-7.5E1), 2.2E1, (-7.82E1), 1.84E1);
        ctx.bezierCurveTo((-8.14E1), 1.48E1, (-8.0948E1), 1.9966E1, (-8.58E1), 1.96E1);
        ctx.bezierCurveTo((-9.1647E1), 1.9159E1, (-9.06E1), 3.2E0, (-9.06E1), 3.2E0);
        ctx.lineTo((-9.46E1), 1.08E1);
        ctx.bezierCurveTo((-9.46E1), 1.08E1, (-9.58E1), 2.52E1, (-8.78E1), 2.28E1);
        ctx.bezierCurveTo((-8.3893E1), 2.1628E1, (-8.26E1), 2.32E1, (-8.42E1), 2.4E1);
        ctx.bezierCurveTo((-8.58E1), 2.48E1, (-7.86E1), 2.52E1, (-8.14E1), 2.68E1);
        ctx.bezierCurveTo((-8.42E1), 2.84E1, (-6.98E1), 2.32E1, (-7.22E1), 3.36E1);
        ctx.lineTo((-6.66E1), 2.6E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.92E1), 4.04E1);
        ctx.bezierCurveTo((-7.92E1), 4.04E1, (-9.46E1), 4.48E1, (-9.82E1), 3.52E1);
        ctx.bezierCurveTo((-9.82E1), 3.52E1, (-1.03E2), 3.76E1, (-1.008E2), 4.06E1);
        ctx.bezierCurveTo((-9.86E1), 4.36E1, (-9.74E1), 4.4E1, (-9.74E1), 4.4E1);
        ctx.bezierCurveTo((-9.74E1), 4.4E1, (-9.2E1), 4.52E1, (-9.26E1), 4.6E1);
        ctx.bezierCurveTo((-9.32E1), 4.68E1, (-9.56E1), 5.02E1, (-9.56E1), 5.02E1);
        ctx.bezierCurveTo((-9.56E1), 5.02E1, (-8.54E1), 4.42E1, (-7.92E1), 4.04E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.49201E2, 1.18601E2);
        ctx.bezierCurveTo(1.48774E2, 1.20735E2, 1.47103E2, 1.21536E2, 1.45201E2, 1.22201E2);
        ctx.bezierCurveTo(1.43284E2, 1.21243E2, 1.40686E2, 1.18137E2, 1.38801E2, 1.20201E2);
        ctx.bezierCurveTo(1.38327E2, 1.19721E2, 1.37548E2, 1.19661E2, 1.37204E2, 1.18999E2);
        ctx.bezierCurveTo(1.36739E2, 1.18101E2, 1.37011E2, 1.17055E2, 1.36669E2, 1.16257E2);
        ctx.bezierCurveTo(1.36124E2, 1.14985E2, 1.35415E2, 1.13619E2, 1.35601E2, 1.12201E2);
        ctx.bezierCurveTo(1.37407E2, 1.11489E2, 1.38002E2, 1.09583E2, 1.37528E2, 1.0782E2);
        ctx.bezierCurveTo(1.37459E2, 1.07563E2, 1.3703E2, 1.07366E2, 1.3723E2, 1.07017E2);
        ctx.bezierCurveTo(1.37416E2, 1.06694E2, 1.37734E2, 1.06467E2, 1.38001E2, 1.062E2);
        ctx.bezierCurveTo(1.37866E2, 1.06335E2, 1.37721E2, 1.06568E2, 1.3761E2, 1.06548E2);
        ctx.bezierCurveTo(1.37E2, 1.06442E2, 1.37124E2, 1.05805E2, 1.37254E2, 1.05418E2);
        ctx.bezierCurveTo(1.37839E2, 1.03672E2, 1.39853E2, 1.03408E2, 1.41201E2, 1.046E2);
        ctx.bezierCurveTo(1.41457E2, 1.04035E2, 1.41966E2, 1.04229E2, 1.42401E2, 1.042E2);
        ctx.bezierCurveTo(1.42351E2, 1.03621E2, 1.42759E2, 1.03094E2, 1.42957E2, 1.02674E2);
        ctx.bezierCurveTo(1.43475E2, 1.01576E2, 1.45104E2, 1.02682E2, 1.45901E2, 1.0207E2);
        ctx.bezierCurveTo(1.46977E2, 1.01245E2, 1.4804E2, 1.00546E2, 1.49118E2, 1.01149E2);
        ctx.bezierCurveTo(1.50927E2, 1.02162E2, 1.52636E2, 1.03374E2, 1.53835E2, 1.05115E2);
        ctx.bezierCurveTo(1.5441E2, 1.05949E2, 1.5465E2, 1.0723E2, 1.54592E2, 1.08188E2);
        ctx.bezierCurveTo(1.54554E2, 1.08835E2, 1.53173E2, 1.08483E2, 1.5283E2, 1.09412E2);
        ctx.bezierCurveTo(1.52185E2, 1.1116E2, 1.54016E2, 1.11679E2, 1.54772E2, 1.13017E2);
        ctx.bezierCurveTo(1.5497E2, 1.13366E2, 1.54706E2, 1.1367E2, 1.54391E2, 1.13768E2);
        ctx.bezierCurveTo(1.5398E2, 1.13896E2, 1.53196E2, 1.13707E2, 1.53334E2, 1.1416E2);
        ctx.bezierCurveTo(1.54306E2, 1.17353E2, 1.5155E2, 1.18031E2, 1.49201E2, 1.18601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.396E2, 1.38201E2);
        ctx.bezierCurveTo(1.39593E2, 1.36463E2, 1.37992E2, 1.34707E2, 1.39201E2, 1.33001E2);
        ctx.bezierCurveTo(1.39336E2, 1.33135E2, 1.39467E2, 1.33356E2, 1.39601E2, 1.33356E2);
        ctx.bezierCurveTo(1.39736E2, 1.33356E2, 1.39867E2, 1.33135E2, 1.40001E2, 1.33001E2);
        ctx.bezierCurveTo(1.41496E2, 1.35217E2, 1.45148E2, 1.36145E2, 1.45006E2, 1.38991E2);
        ctx.bezierCurveTo(1.44984E2, 1.39438E2, 1.43897E2, 1.40356E2, 1.44801E2, 1.41001E2);
        ctx.bezierCurveTo(1.42988E2, 1.42349E2, 1.42933E2, 1.44719E2, 1.42001E2, 1.46601E2);
        ctx.bezierCurveTo(1.40763E2, 1.46315E2, 1.39551E2, 1.45952E2, 1.38401E2, 1.45401E2);
        ctx.bezierCurveTo(1.38753E2, 1.43915E2, 1.38636E2, 1.42231E2, 1.39456E2, 1.40911E2);
        ctx.bezierCurveTo(1.3989E2, 1.40213E2, 1.39603E2, 1.39134E2, 1.396E2, 1.38201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.66E1), 1.29201E2);
        ctx.bezierCurveTo((-2.66E1), 1.29201E2, (-4.3458E1), 1.39337E2, (-2.94E1), 1.24001E2);
        ctx.bezierCurveTo((-2.06E1), 1.14401E2, (-1.06E1), 1.08801E2, (-1.06E1), 1.08801E2);
        ctx.bezierCurveTo((-1.06E1), 1.08801E2, (-2E-1), 1.044E2, 3.4E0, 1.032E2);
        ctx.bezierCurveTo(7E0, 1.02E2, 2.22E1, 9.68E1, 2.54E1, 9.64E1);
        ctx.bezierCurveTo(2.86E1, 9.6E1, 3.82E1, 9.2E1, 4.5E1, 9.6E1);
        ctx.bezierCurveTo(5.18E1, 1E2, 5.98E1, 1.044E2, 5.98E1, 1.044E2);
        ctx.bezierCurveTo(5.98E1, 1.044E2, 4.34E1, 9.6E1, 3.98E1, 9.84E1);
        ctx.bezierCurveTo(3.62E1, 1.008E2, 2.9E1, 1.004E2, 2.3E1, 1.036E2);
        ctx.bezierCurveTo(2.3E1, 1.036E2, 8.2E0, 1.08001E2, 5E0, 1.10001E2);
        ctx.bezierCurveTo(1.8E0, 1.12001E2, (-8.6E0), 1.23601E2, (-1.02E1), 1.22801E2);
        ctx.bezierCurveTo((-1.18E1), 1.22001E2, (-9.8E0), 1.21601E2, (-8.6E0), 1.18801E2);
        ctx.bezierCurveTo((-7.4E0), 1.16001E2, (-9.4E0), 1.14401E2, (-1.74E1), 1.20801E2);
        ctx.bezierCurveTo((-2.54E1), 1.27201E2, (-2.66E1), 1.29201E2, (-2.66E1), 1.29201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.9195E1), 1.23234E2);
        ctx.bezierCurveTo((-1.9195E1), 1.23234E2, (-1.7785E1), 1.10194E2, (-9.307E0), 1.11859E2);
        ctx.bezierCurveTo((-9.307E0), 1.11859E2, (-1.081E0), 1.07689E2, 1.641E0, 1.05721E2);
        ctx.bezierCurveTo(1.641E0, 1.05721E2, 9.78E0, 1.04019E2, 1.109E1, 1.03402E2);
        ctx.bezierCurveTo(2.9569E1, 9.4702E1, 4.4288E1, 9.9221E1, 4.4835E1, 9.8101E1);
        ctx.bezierCurveTo(4.5381E1, 9.6982E1, 6.5006E1, 1.04099E2, 6.8615E1, 1.08185E2);
        ctx.bezierCurveTo(6.9006E1, 1.08628E2, 5.8384E1, 1.02588E2, 4.8686E1, 1.00697E2);
        ctx.bezierCurveTo(4.0413E1, 9.9083E1, 1.8811E1, 1.00944E2, 7.905E0, 1.0648E2);
        ctx.bezierCurveTo(4.932E0, 1.07989E2, (-4.013E0), 1.13773E2, (-6.544E0), 1.13662E2);
        ctx.bezierCurveTo((-9.075E0), 1.1355E2, (-1.9195E1), 1.23234E2, (-1.9195E1), 1.23234E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.3E1), 1.48801E2);
        ctx.bezierCurveTo((-2.3E1), 1.48801E2, (-3.82E1), 1.46401E2, (-2.14E1), 1.44801E2);
        ctx.bezierCurveTo((-2.14E1), 1.44801E2, (-3.4E0), 1.42801E2, 6E-1, 1.37601E2);
        ctx.bezierCurveTo(6E-1, 1.37601E2, 1.42E1, 1.28401E2, 1.7E1, 1.28001E2);
        ctx.bezierCurveTo(1.98E1, 1.27601E2, 4.98E1, 1.20401E2, 5.02E1, 1.18001E2);
        ctx.bezierCurveTo(5.06E1, 1.15601E2, 5.62E1, 1.15601E2, 5.78E1, 1.16401E2);
        ctx.bezierCurveTo(5.94E1, 1.17201E2, 5.86E1, 1.18401E2, 5.58E1, 1.19201E2);
        ctx.bezierCurveTo(5.3E1, 1.20001E2, 2.18E1, 1.36401E2, 1.54E1, 1.37601E2);
        ctx.bezierCurveTo(9E0, 1.38801E2, (-2.6E0), 1.46401E2, (-7.4E0), 1.47601E2);
        ctx.bezierCurveTo((-1.22E1), 1.48801E2, (-2.3E1), 1.48801E2, (-2.3E1), 1.48801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.48E0), 1.41403E2);
        ctx.bezierCurveTo((-3.48E0), 1.41403E2, (-1.2062E1), 1.40574E2, (-3.461E0), 1.39755E2);
        ctx.bezierCurveTo((-3.461E0), 1.39755E2, 5.355E0, 1.36331E2, 7.403E0, 1.33668E2);
        ctx.bezierCurveTo(7.403E0, 1.33668E2, 1.4367E1, 1.28957E2, 1.58E1, 1.28753E2);
        ctx.bezierCurveTo(1.7234E1, 1.28548E2, 3.1194E1, 1.24861E2, 3.1399E1, 1.23633E2);
        ctx.bezierCurveTo(3.1604E1, 1.22404E2, 6.567E1, 1.09823E2, 7.009E1, 1.13013E2);
        ctx.bezierCurveTo(7.3001E1, 1.15114E2, 6.31E1, 1.13437E2, 5.3466E1, 1.17847E2);
        ctx.bezierCurveTo(5.2111E1, 1.18467E2, 1.8258E1, 1.33054E2, 1.4981E1, 1.33668E2);
        ctx.bezierCurveTo(1.1704E1, 1.34283E2, 5.765E0, 1.38174E2, 3.307E0, 1.38788E2);
        ctx.bezierCurveTo(8.5E-1, 1.39403E2, (-3.48E0), 1.41403E2, (-3.48E0), 1.41403E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.14E1), 1.43601E2);
        ctx.bezierCurveTo((-1.14E1), 1.43601E2, (-6.2E0), 1.43201E2, (-7.4E0), 1.44801E2);
        ctx.bezierCurveTo((-8.6E0), 1.46401E2, (-1.1E1), 1.45601E2, (-1.1E1), 1.45601E2);
        ctx.lineTo((-1.14E1), 1.43601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.86E1), 1.45201E2);
        ctx.bezierCurveTo((-1.86E1), 1.45201E2, (-1.34E1), 1.44801E2, (-1.46E1), 1.46401E2);
        ctx.bezierCurveTo((-1.58E1), 1.48001E2, (-1.82E1), 1.47201E2, (-1.82E1), 1.47201E2);
        ctx.lineTo((-1.86E1), 1.45201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.9E1), 1.46801E2);
        ctx.bezierCurveTo((-2.9E1), 1.46801E2, (-2.38E1), 1.46401E2, (-2.5E1), 1.48001E2);
        ctx.bezierCurveTo((-2.62E1), 1.49601E2, (-2.86E1), 1.48801E2, (-2.86E1), 1.48801E2);
        ctx.lineTo((-2.9E1), 1.46801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.66E1), 1.47601E2);
        ctx.bezierCurveTo((-3.66E1), 1.47601E2, (-3.14E1), 1.47201E2, (-3.26E1), 1.48801E2);
        ctx.bezierCurveTo((-3.38E1), 1.50401E2, (-3.62E1), 1.49601E2, (-3.62E1), 1.49601E2);
        ctx.lineTo((-3.66E1), 1.47601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.8E0, 1.08001E2);
        ctx.bezierCurveTo(1.8E0, 1.08001E2, 6.2E0, 1.08001E2, 5E0, 1.09601E2);
        ctx.bezierCurveTo(3.8E0, 1.11201E2, 6E-1, 1.10801E2, 6E-1, 1.10801E2);
        ctx.lineTo(1.8E0, 1.08001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-8.2E0), 1.13601E2);
        ctx.bezierCurveTo((-8.2E0), 1.13601E2, (-1.694E0), 1.1146E2, (-4.2E0), 1.14801E2);
        ctx.bezierCurveTo((-5.4E0), 1.16401E2, (-7.8E0), 1.15601E2, (-7.8E0), 1.15601E2);
        ctx.lineTo((-8.2E0), 1.13601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.94E1), 1.18401E2);
        ctx.bezierCurveTo((-1.94E1), 1.18401E2, (-1.42E1), 1.18001E2, (-1.54E1), 1.19601E2);
        ctx.bezierCurveTo((-1.66E1), 1.21201E2, (-1.9E1), 1.20401E2, (-1.9E1), 1.20401E2);
        ctx.lineTo((-1.94E1), 1.18401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.7E1), 1.24401E2);
        ctx.bezierCurveTo((-2.7E1), 1.24401E2, (-2.18E1), 1.24001E2, (-2.3E1), 1.25601E2);
        ctx.bezierCurveTo((-2.42E1), 1.27201E2, (-2.66E1), 1.26401E2, (-2.66E1), 1.26401E2);
        ctx.lineTo((-2.7E1), 1.24401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.38E1), 1.29201E2);
        ctx.bezierCurveTo((-3.38E1), 1.29201E2, (-2.86E1), 1.28801E2, (-2.98E1), 1.30401E2);
        ctx.bezierCurveTo((-3.1E1), 1.32001E2, (-3.34E1), 1.31201E2, (-3.34E1), 1.31201E2);
        ctx.lineTo((-3.38E1), 1.29201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.282E0, 1.35598E2);
        ctx.bezierCurveTo(5.282E0, 1.35598E2, 1.2203E1, 1.35066E2, 1.0606E1, 1.37195E2);
        ctx.bezierCurveTo(9.009E0, 1.39325E2, 5.814E0, 1.3826E2, 5.814E0, 1.3826E2);
        ctx.lineTo(5.282E0, 1.35598E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.5682E1, 1.30798E2);
        ctx.bezierCurveTo(1.5682E1, 1.30798E2, 2.2603E1, 1.30266E2, 2.1006E1, 1.32395E2);
        ctx.bezierCurveTo(1.9409E1, 1.34525E2, 1.6214E1, 1.3346E2, 1.6214E1, 1.3346E2);
        ctx.lineTo(1.5682E1, 1.30798E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.6482E1, 1.26398E2);
        ctx.bezierCurveTo(2.6482E1, 1.26398E2, 3.3403E1, 1.25866E2, 3.1806E1, 1.27995E2);
        ctx.bezierCurveTo(3.0209E1, 1.30125E2, 2.7014E1, 1.2906E2, 2.7014E1, 1.2906E2);
        ctx.lineTo(2.6482E1, 1.26398E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.6882E1, 1.21598E2);
        ctx.bezierCurveTo(3.6882E1, 1.21598E2, 4.3803E1, 1.21066E2, 4.2206E1, 1.23195E2);
        ctx.bezierCurveTo(4.0609E1, 1.25325E2, 3.7414E1, 1.2426E2, 3.7414E1, 1.2426E2);
        ctx.lineTo(3.6882E1, 1.21598E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(9.282E0, 1.03598E2);
        ctx.bezierCurveTo(9.282E0, 1.03598E2, 1.6203E1, 1.03066E2, 1.4606E1, 1.05195E2);
        ctx.bezierCurveTo(1.3009E1, 1.07325E2, 9.014E0, 1.0706E2, 9.014E0, 1.0706E2);
        ctx.lineTo(9.282E0, 1.03598E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.9282E1, 1.00398E2);
        ctx.bezierCurveTo(1.9282E1, 1.00398E2, 2.6203E1, 9.9866E1, 2.4606E1, 1.01995E2);
        ctx.bezierCurveTo(2.3009E1, 1.04125E2, 1.8614E1, 1.0386E2, 1.8614E1, 1.0386E2);
        ctx.lineTo(1.9282E1, 1.00398E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.4E0), 1.40401E2);
        ctx.bezierCurveTo((-3.4E0), 1.40401E2, 1.8E0, 1.40001E2, 6E-1, 1.41601E2);
        ctx.bezierCurveTo((-6E-1), 1.43201E2, (-3E0), 1.42401E2, (-3E0), 1.42401E2);
        ctx.lineTo((-3.4E0), 1.40401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.66E1), 4.12E1);
        ctx.bezierCurveTo((-7.66E1), 4.12E1, (-8.1E1), 5E1, (-8.14E1), 5.32E1);
        ctx.bezierCurveTo((-8.14E1), 5.32E1, (-8.06E1), 4.44E1, (-7.94E1), 4.24E1);
        ctx.bezierCurveTo((-7.82E1), 4.04E1, (-7.66E1), 4.12E1, (-7.66E1), 4.12E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#992600';
        ctx.fillStyle = 'rgba(153,38,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-9.5E1), 5.52E1);
        ctx.bezierCurveTo((-9.5E1), 5.52E1, (-9.82E1), 6.96E1, (-9.78E1), 7.24E1);
        ctx.bezierCurveTo((-9.78E1), 7.24E1, (-9.9E1), 6.08E1, (-9.86E1), 5.96E1);
        ctx.bezierCurveTo((-9.82E1), 5.84E1, (-9.5E1), 5.52E1, (-9.5E1), 5.52E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.42E1), (-1.94E1));
        ctx.lineTo((-7.44E1), (-1.62E1));
        ctx.lineTo((-7.66E1), (-1.6E1));
        ctx.bezierCurveTo((-7.66E1), (-1.6E1), (-6.24E1), (-3.4E0), (-6.18E1), 4.2E0);
        ctx.bezierCurveTo((-6.18E1), 4.2E0, (-6.1E1), (-4E0), (-7.42E1), (-1.94E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.0216E1), (-1.8135E1));
        ctx.bezierCurveTo((-7.0647E1), (-1.8551E1), (-7.0428E1), (-1.9296E1), (-7.0836E1), (-1.9556E1));
        ctx.bezierCurveTo((-7.1645E1), (-2.0072E1), (-6.9538E1), (-2.0129E1), (-6.9766E1), (-2.0845E1));
        ctx.bezierCurveTo((-7.0149E1), (-2.2051E1), (-6.9962E1), (-2.2072E1), (-7.0084E1), (-2.3348E1));
        ctx.bezierCurveTo((-7.0141E1), (-2.3946E1), (-6.9553E1), (-2.5486E1), (-6.9168E1), (-2.5926E1));
        ctx.bezierCurveTo((-6.7722E1), (-2.7578E1), (-6.9046E1), (-3.051E1), (-6.7406E1), (-3.2061E1));
        ctx.bezierCurveTo((-6.7102E1), (-3.235E1), (-6.6726E1), (-3.2902E1), (-6.6441E1), (-3.332E1));
        ctx.bezierCurveTo((-6.5782E1), (-3.4283E1), (-6.4598E1), (-3.4771E1), (-6.3648E1), (-3.5599E1));
        ctx.bezierCurveTo((-6.333E1), (-3.5875E1), (-6.3531E1), (-3.6702E1), (-6.2962E1), (-3.661E1));
        ctx.bezierCurveTo((-6.2248E1), (-3.6495E1), (-6.1007E1), (-3.6625E1), (-6.1052E1), (-3.5784E1));
        ctx.bezierCurveTo((-6.1165E1), (-3.3664E1), (-6.2494E1), (-3.1944E1), (-6.3774E1), (-3.0276E1));
        ctx.bezierCurveTo((-6.3323E1), (-2.9572E1), (-6.3781E1), (-2.8937E1), (-6.4065E1), (-2.838E1));
        ctx.bezierCurveTo((-6.54E1), (-2.576E1), (-6.5211E1), (-2.2919E1), (-6.5385E1), (-2.0079E1));
        ctx.bezierCurveTo((-6.539E1), (-1.9994E1), (-6.5697E1), (-1.9916E1), (-6.5689E1), (-1.9863E1));
        ctx.bezierCurveTo((-6.5336E1), (-1.7528E1), (-6.4752E1), (-1.5329E1), (-6.3873E1), (-1.31E1));
        ctx.bezierCurveTo((-6.3507E1), (-1.217E1), (-6.3036E1), (-1.1275E1), (-6.2886E1), (-1.0348E1));
        ctx.bezierCurveTo((-6.2775E1), (-9.662E0), (-6.2672E1), (-8.829E0), (-6.308E1), (-8.124E0));
        ctx.bezierCurveTo((-6.1045E1), (-5.234E0), (-6.2354E1), (-2.583E0), (-6.1185E1), 9.48E-1);
        ctx.bezierCurveTo((-6.0978E1), 1.573E0, (-5.9286E1), 3.487E0, (-5.9749E1), 3.326E0);
        ctx.bezierCurveTo((-6.2262E1), 2.455E0, (-6.2374E1), 2.057E0, (-6.2551E1), 1.304E0);
        ctx.bezierCurveTo((-6.2697E1), 6.81E-1, (-6.3027E1), (-6.96E-1), (-6.3264E1), (-1.298E0));
        ctx.bezierCurveTo((-6.3328E1), (-1.462E0), (-6.3499E1), (-3.346E0), (-6.3577E1), (-3.468E0));
        ctx.bezierCurveTo((-6.509E1), (-5.85E0), (-6.3732E1), (-5.674E0), (-6.5102E1), (-8.032E0));
        ctx.bezierCurveTo((-6.653E1), (-8.712E0), (-6.7496E1), (-9.816E0), (-6.8619E1), (-1.0978E1));
        ctx.bezierCurveTo((-6.8817E1), (-1.1182E1), (-6.7674E1), (-1.1906E1), (-6.7855E1), (-1.2119E1));
        ctx.bezierCurveTo((-6.8947E1), (-1.3408E1), (-7.01E1), (-1.4175E1), (-6.9764E1), (-1.5668E1));
        ctx.bezierCurveTo((-6.9609E1), (-1.6358E1), (-6.9472E1), (-1.7415E1), (-7.0216E1), (-1.8135E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.38E1), (-1.64E1));
        ctx.bezierCurveTo((-7.38E1), (-1.64E1), (-7.34E1), (-9.6E0), (-7.1E1), (-8E0));
        ctx.bezierCurveTo((-6.86E1), (-6.4E0), (-6.98E1), (-7.2E0), (-7.3E1), (-8.4E0));
        ctx.bezierCurveTo((-7.62E1), (-9.6E0), (-7.5E1), (-1.04E1), (-7.5E1), (-1.04E1));
        ctx.bezierCurveTo((-7.5E1), (-1.04E1), (-7.78E1), (-1E1), (-7.54E1), (-8E0));
        ctx.bezierCurveTo((-7.3E1), (-6E0), (-6.94E1), (-3.6E0), (-7.1E1), (-3.6E0));
        ctx.bezierCurveTo((-7.26E1), (-3.6E0), (-8.02E1), (-7.6E0), (-8.02E1), (-1.04E1));
        ctx.bezierCurveTo((-8.02E1), (-1.32E1), (-8.12E1), (-1.73E1), (-8.12E1), (-1.73E1));
        ctx.bezierCurveTo((-8.12E1), (-1.73E1), (-8.01E1), (-1.81E1), (-7.53E1), (-1.8E1));
        ctx.bezierCurveTo((-7.53E1), (-1.8E1), (-7.39E1), (-1.73E1), (-7.38E1), (-1.64E1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.46E1), 2.2E0);
        ctx.bezierCurveTo((-7.46E1), 2.2E0, (-8.312E1), (-5.91E-1), (-1.016E2), 2.8E0);
        ctx.bezierCurveTo((-1.016E2), 2.8E0, (-9.2569E1), 7.22E-1, (-7.38E1), 3E0);
        ctx.bezierCurveTo((-6.35E1), 4.25E0, (-7.46E1), 2.2E0, (-7.46E1), 2.2E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.2502E1), 2.129E0);
        ctx.bezierCurveTo((-7.2502E1), 2.129E0, (-8.0748E1), (-1.389E0), (-9.9453E1), 3.92E-1);
        ctx.bezierCurveTo((-9.9453E1), 3.92E-1, (-9.0275E1), (-8.97E-1), (-7.1774E1), 2.995E0);
        ctx.bezierCurveTo((-6.162E1), 5.131E0, (-7.2502E1), 2.129E0, (-7.2502E1), 2.129E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.0714E1), 2.222E0);
        ctx.bezierCurveTo((-7.0714E1), 2.222E0, (-7.8676E1), (-1.899E0), (-9.7461E1), (-1.514E0));
        ctx.bezierCurveTo((-9.7461E1), (-1.514E0), (-8.8213E1), (-2.118E0), (-7.0052E1), 3.14E0);
        ctx.bezierCurveTo((-6.0086E1), 6.025E0, (-7.0714E1), 2.222E0, (-7.0714E1), 2.222E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.9444E1), 2.445E0);
        ctx.bezierCurveTo((-6.9444E1), 2.445E0, (-7.6268E1), (-1.862E0), (-9.3142E1), (-2.96E0));
        ctx.bezierCurveTo((-9.3142E1), (-2.96E0), (-8.4803E1), (-2.79E0), (-6.8922E1), 3.319E0);
        ctx.bezierCurveTo((-6.0206E1), 6.672E0, (-6.9444E1), 2.445E0, (-6.9444E1), 2.445E0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.584E1, 1.2961E1);
        ctx.bezierCurveTo(4.584E1, 1.2961E1, 4.491E1, 1.3605E1, 4.5124E1, 1.2424E1);
        ctx.bezierCurveTo(4.5339E1, 1.1243E1, 7.3547E1, (-1.927E0), 7.7161E1, (-1.677E0));
        ctx.bezierCurveTo(7.7161E1, (-1.677E0), 4.6913E1, 1.1529E1, 4.584E1, 1.2961E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.2446E1, 1.36E1);
        ctx.bezierCurveTo(4.2446E1, 1.36E1, 4.157E1, 1.4315E1, 4.1691E1, 1.3121E1);
        ctx.bezierCurveTo(4.1812E1, 1.1927E1, 6.8899E1, (-3.418E0), 7.2521E1, (-3.452E0));
        ctx.bezierCurveTo(7.2521E1, (-3.452E0), 4.3404E1, 1.2089E1, 4.2446E1, 1.36E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.916E1, 1.4975E1);
        ctx.bezierCurveTo(3.916E1, 1.4975E1, 3.8332E1, 1.5747E1, 3.8374E1, 1.4547E1);
        ctx.bezierCurveTo(3.8416E1, 1.3348E1, 5.8233E1, (-2.149E0), 6.8045E1, (-4.023E0));
        ctx.bezierCurveTo(6.8045E1, (-4.023E0), 5.0015E1, 4.104E0, 3.916E1, 1.4975E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.6284E1, 1.6838E1);
        ctx.bezierCurveTo(3.6284E1, 1.6838E1, 3.5539E1, 1.7532E1, 3.5577E1, 1.6453E1);
        ctx.bezierCurveTo(3.5615E1, 1.5373E1, 5.3449E1, 1.426E0, 6.228E1, (-2.6E-1));
        ctx.bezierCurveTo(6.228E1, (-2.6E-1), 4.6054E1, 7.054E0, 3.6284E1, 1.6838E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.6E0, 1.64801E2);
        ctx.bezierCurveTo(4.6E0, 1.64801E2, (-1.06E1), 1.62401E2, 6.2E0, 1.60801E2);
        ctx.bezierCurveTo(6.2E0, 1.60801E2, 2.42E1, 1.58801E2, 2.82E1, 1.53601E2);
        ctx.bezierCurveTo(2.82E1, 1.53601E2, 4.18E1, 1.44401E2, 4.46E1, 1.44001E2);
        ctx.bezierCurveTo(4.74E1, 1.43601E2, 6.38E1, 1.40001E2, 6.42E1, 1.37601E2);
        ctx.bezierCurveTo(6.46E1, 1.35201E2, 7.06E1, 1.32801E2, 7.22E1, 1.33601E2);
        ctx.bezierCurveTo(7.38E1, 1.34401E2, 7.38E1, 1.43601E2, 7.1E1, 1.44401E2);
        ctx.bezierCurveTo(6.82E1, 1.45201E2, 4.94E1, 1.52401E2, 4.3E1, 1.53601E2);
        ctx.bezierCurveTo(3.66E1, 1.54801E2, 2.5E1, 1.62401E2, 2.02E1, 1.63601E2);
        ctx.bezierCurveTo(1.54E1, 1.64801E2, 4.6E0, 1.64801E2, 4.6E0, 1.64801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(7.76E1, 1.27401E2);
        ctx.bezierCurveTo(7.76E1, 1.27401E2, 7.46E1, 1.29001E2, 7.34E1, 1.31601E2);
        ctx.bezierCurveTo(7.34E1, 1.31601E2, 6.7E1, 1.42201E2, 5.28E1, 1.45401E2);
        ctx.bezierCurveTo(5.28E1, 1.45401E2, 2.98E1, 1.54401E2, 2.2E1, 1.56401E2);
        ctx.bezierCurveTo(2.2E1, 1.56401E2, 8.6E0, 1.61401E2, 1.2E0, 1.60601E2);
        ctx.bezierCurveTo(1.2E0, 1.60601E2, (-5.8E0), 1.60801E2, 4E-1, 1.62401E2);
        ctx.bezierCurveTo(4E-1, 1.62401E2, 2.06E1, 1.60401E2, 2.4E1, 1.58601E2);
        ctx.bezierCurveTo(2.4E1, 1.58601E2, 3.96E1, 1.53401E2, 4.26E1, 1.50801E2);
        ctx.bezierCurveTo(4.56E1, 1.48201E2, 6.38E1, 1.43201E2, 6.6E1, 1.41201E2);
        ctx.bezierCurveTo(6.82E1, 1.39201E2, 7.8E1, 1.30801E2, 7.76E1, 1.27401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.8882E1, 1.58911E2);
        ctx.bezierCurveTo(1.8882E1, 1.58911E2, 2.4111E1, 1.58685E2, 2.2958E1, 1.60234E2);
        ctx.bezierCurveTo(2.1805E1, 1.61784E2, 1.9357E1, 1.6091E2, 1.9357E1, 1.6091E2);
        ctx.lineTo(1.8882E1, 1.58911E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.168E1, 1.60263E2);
        ctx.bezierCurveTo(1.168E1, 1.60263E2, 1.6908E1, 1.60037E2, 1.5756E1, 1.61586E2);
        ctx.bezierCurveTo(1.4603E1, 1.63136E2, 1.2155E1, 1.62263E2, 1.2155E1, 1.62263E2);
        ctx.lineTo(1.168E1, 1.60263E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.251E0, 1.61511E2);
        ctx.bezierCurveTo(1.251E0, 1.61511E2, 6.48E0, 1.61284E2, 5.327E0, 1.62834E2);
        ctx.bezierCurveTo(4.174E0, 1.64383E2, 1.726E0, 1.6351E2, 1.726E0, 1.6351E2);
        ctx.lineTo(1.251E0, 1.61511E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.383E0), 1.62055E2);
        ctx.bezierCurveTo((-6.383E0), 1.62055E2, (-1.154E0), 1.61829E2, (-2.307E0), 1.63378E2);
        ctx.bezierCurveTo((-3.46E0), 1.64928E2, (-5.908E0), 1.64054E2, (-5.908E0), 1.64054E2);
        ctx.lineTo((-6.383E0), 1.62055E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.5415E1, 1.51513E2);
        ctx.bezierCurveTo(3.5415E1, 1.51513E2, 4.2375E1, 1.51212E2, 4.084E1, 1.53274E2);
        ctx.bezierCurveTo(3.9306E1, 1.55336E2, 3.6047E1, 1.54174E2, 3.6047E1, 1.54174E2);
        ctx.lineTo(3.5415E1, 1.51513E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.573E1, 1.47088E2);
        ctx.bezierCurveTo(4.573E1, 1.47088E2, 5.1689E1, 1.43787E2, 5.1155E1, 1.48849E2);
        ctx.bezierCurveTo(5.0885E1, 1.51405E2, 4.6362E1, 1.49749E2, 4.6362E1, 1.49749E2);
        ctx.lineTo(4.573E1, 1.47088E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.4862E1, 1.44274E2);
        ctx.bezierCurveTo(5.4862E1, 1.44274E2, 6.2021E1, 1.40573E2, 6.0287E1, 1.46035E2);
        ctx.bezierCurveTo(5.9509E1, 1.48485E2, 5.5493E1, 1.46935E2, 5.5493E1, 1.46935E2);
        ctx.lineTo(5.4862E1, 1.44274E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(6.4376E1, 1.39449E2);
        ctx.bezierCurveTo(6.4376E1, 1.39449E2, 6.8735E1, 1.34548E2, 6.9801E1, 1.4121E2);
        ctx.bezierCurveTo(7.0207E1, 1.43748E2, 6.5008E1, 1.4211E2, 6.5008E1, 1.4211E2);
        ctx.lineTo(6.4376E1, 1.39449E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.6834E1, 1.55997E2);
        ctx.bezierCurveTo(2.6834E1, 1.55997E2, 3.2062E1, 1.5577E2, 3.091E1, 1.5732E2);
        ctx.bezierCurveTo(2.9757E1, 1.58869E2, 2.7308E1, 1.57996E2, 2.7308E1, 1.57996E2);
        ctx.lineTo(2.6834E1, 1.55997E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(6.2434E1, 3.4603E1);
        ctx.bezierCurveTo(6.2434E1, 3.4603E1, 6.1708E1, 3.5268E1, 6.1707E1, 3.4197E1);
        ctx.bezierCurveTo(6.1707E1, 3.3127E1, 7.9191E1, 1.9863E1, 8.8034E1, 1.8479E1);
        ctx.bezierCurveTo(8.8034E1, 1.8479E1, 7.1935E1, 2.5208E1, 6.2434E1, 3.4603E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(6.54E1, 9.84E1);
        ctx.bezierCurveTo(6.54E1, 9.84E1, 8.7401E1, 1.20801E2, 9.6601E1, 1.24401E2);
        ctx.bezierCurveTo(9.6601E1, 1.24401E2, 1.05801E2, 1.35601E2, 1.01801E2, 1.61601E2);
        ctx.bezierCurveTo(1.01801E2, 1.61601E2, 9.8601E1, 1.69201E2, 9.5401E1, 1.48401E2);
        ctx.bezierCurveTo(9.5401E1, 1.48401E2, 9.8601E1, 1.23201E2, 8.7401E1, 1.39201E2);
        ctx.bezierCurveTo(8.7401E1, 1.39201E2, 7.9E1, 1.29301E2, 8.54E1, 1.29601E2);
        ctx.bezierCurveTo(8.54E1, 1.29601E2, 8.8601E1, 1.31601E2, 8.9001E1, 1.30001E2);
        ctx.bezierCurveTo(8.9401E1, 1.28401E2, 8.14E1, 1.14801E2, 6.42E1, 1.004E2);
        ctx.bezierCurveTo(4.7E1, 8.6E1, 6.54E1, 9.84E1, 6.54E1, 9.84E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(7E0, 1.37201E2);
        ctx.bezierCurveTo(7E0, 1.37201E2, 6.8E0, 1.35401E2, 8.6E0, 1.36201E2);
        ctx.bezierCurveTo(1.04E1, 1.37001E2, 1.04601E2, 1.43201E2, 1.36201E2, 1.67201E2);
        ctx.bezierCurveTo(1.36201E2, 1.67201E2, 9.1001E1, 1.44001E2, 7E0, 1.37201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.74E1, 1.32801E2);
        ctx.bezierCurveTo(1.74E1, 1.32801E2, 1.72E1, 1.31001E2, 1.9E1, 1.31801E2);
        ctx.bezierCurveTo(2.08E1, 1.32601E2, 1.57401E2, 1.31601E2, 1.81001E2, 1.64001E2);
        ctx.bezierCurveTo(1.81001E2, 1.64001E2, 1.59001E2, 1.38801E2, 1.74E1, 1.32801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.9E1, 1.28801E2);
        ctx.bezierCurveTo(2.9E1, 1.28801E2, 2.88E1, 1.27001E2, 3.06E1, 1.27801E2);
        ctx.bezierCurveTo(3.24E1, 1.28601E2, 2.05801E2, 1.15601E2, 2.29401E2, 1.48001E2);
        ctx.bezierCurveTo(2.29401E2, 1.48001E2, 2.19801E2, 1.22401E2, 2.9E1, 1.28801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.9E1, 1.24001E2);
        ctx.bezierCurveTo(3.9E1, 1.24001E2, 3.88E1, 1.22201E2, 4.06E1, 1.23001E2);
        ctx.bezierCurveTo(4.24E1, 1.23801E2, 1.64601E2, 8.52E1, 1.88201E2, 1.17601E2);
        ctx.bezierCurveTo(1.88201E2, 1.17601E2, 1.74801E2, 9.3E1, 3.9E1, 1.24001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.9E1), 1.46801E2);
        ctx.bezierCurveTo((-1.9E1), 1.46801E2, (-1.92E1), 1.45001E2, (-1.74E1), 1.45801E2);
        ctx.bezierCurveTo((-1.56E1), 1.46601E2, 2.2E0, 1.48801E2, 4.2E0, 1.87601E2);
        ctx.bezierCurveTo(4.2E0, 1.87601E2, (-3E0), 1.45601E2, (-1.9E1), 1.46801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.78E1), 1.48401E2);
        ctx.bezierCurveTo((-2.78E1), 1.48401E2, (-2.8E1), 1.46601E2, (-2.62E1), 1.47401E2);
        ctx.bezierCurveTo((-2.44E1), 1.48201E2, (-1.02E1), 1.43601E2, (-1.3E1), 1.82401E2);
        ctx.bezierCurveTo((-1.3E1), 1.82401E2, (-1.18E1), 1.47201E2, (-2.78E1), 1.48401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.58E1), 1.48801E2);
        ctx.bezierCurveTo((-3.58E1), 1.48801E2, (-3.6E1), 1.47001E2, (-3.42E1), 1.47801E2);
        ctx.bezierCurveTo((-3.24E1), 1.48601E2, (-1.7E1), 1.49201E2, (-2.94E1), 1.71601E2);
        ctx.bezierCurveTo((-2.94E1), 1.71601E2, (-1.98E1), 1.47601E2, (-3.58E1), 1.48801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.1526E1, 1.04465E2);
        ctx.bezierCurveTo(1.1526E1, 1.04465E2, 1.1082E1, 1.06464E2, 1.2631E1, 1.05247E2);
        ctx.bezierCurveTo(2.8699E1, 9.2622E1, 6.1141E1, 3.372E1, 1.16826E2, 2.8086E1);
        ctx.bezierCurveTo(1.16826E2, 2.8086E1, 7.8518E1, 1.5976E1, 1.1526E1, 1.04465E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.2726E1, 1.02665E2);
        ctx.bezierCurveTo(2.2726E1, 1.02665E2, 2.1363E1, 1.01472E2, 2.3231E1, 1.00847E2);
        ctx.bezierCurveTo(2.5099E1, 1.00222E2, 1.37541E2, 2.772E1, 1.76826E2, 3.5686E1);
        ctx.bezierCurveTo(1.76826E2, 3.5686E1, 1.49719E2, 2.8176E1, 2.2726E1, 1.02665E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.885E0, 1.08767E2);
        ctx.bezierCurveTo(1.885E0, 1.08767E2, 1.376E0, 1.10366E2, 3.087E0, 1.0939E2);
        ctx.bezierCurveTo(1.2062E1, 1.0427E2, 1.5677E1, 4.7059E1, 5.9254E1, 4.5804E1);
        ctx.bezierCurveTo(5.9254E1, 4.5804E1, 2.6843E1, 3.109E1, 1.885E0, 1.08767E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.8038E1), 1.19793E2);
        ctx.bezierCurveTo((-1.8038E1), 1.19793E2, (-1.9115E1), 1.21079E2, (-1.7162E1), 1.20825E2);
        ctx.bezierCurveTo((-6.916E0), 1.19493E2, 1.4489E1, 7.8222E1, 5.8928E1, 8.3301E1);
        ctx.bezierCurveTo(5.8928E1, 8.3301E1, 2.6962E1, 6.8955E1, (-1.8038E1), 1.19793E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-6.8E0), 1.13667E2);
        ctx.bezierCurveTo((-6.8E0), 1.13667E2, (-7.611E0), 1.15136E2, (-5.742E0), 1.14511E2);
        ctx.bezierCurveTo(4.057E0, 1.11237E2, 1.7141E1, 6.6625E1, 6.1729E1, 6.3078E1);
        ctx.bezierCurveTo(6.1729E1, 6.3078E1, 2.7603E1, 5.5135E1, (-6.8E0), 1.13667E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.5078E1), 1.24912E2);
        ctx.bezierCurveTo((-2.5078E1), 1.24912E2, (-2.5951E1), 1.25954E2, (-2.4369E1), 1.25748E2);
        ctx.bezierCurveTo((-1.607E1), 1.24669E2, 1.268E0, 9.124E1, 3.7264E1, 9.5354E1);
        ctx.bezierCurveTo(3.7264E1, 9.5354E1, 1.1371E1, 8.3734E1, (-2.5078E1), 1.24912E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.2677E1), 1.30821E2);
        ctx.bezierCurveTo((-3.2677E1), 1.30821E2, (-3.3682E1), 1.31866E2, (-3.2091E1), 1.31748E2);
        ctx.bezierCurveTo((-2.7923E1), 1.31439E2, 2.715E0, 9.836E1, 2.1183E1, 1.13862E2);
        ctx.bezierCurveTo(2.1183E1, 1.13862E2, 9.168E0, 9.5139E1, (-3.2677E1), 1.30821E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.6855E1, 9.8898E1);
        ctx.bezierCurveTo(3.6855E1, 9.8898E1, 3.5654E1, 9.7543E1, 3.7586E1, 9.7158E1);
        ctx.bezierCurveTo(3.9518E1, 9.6774E1, 1.60221E2, 3.9061E1, 1.98184E2, 5.1927E1);
        ctx.bezierCurveTo(1.98184E2, 5.1927E1, 1.72243E2, 4.1053E1, 3.6855E1, 9.8898E1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.4E0, 1.63201E2);
        ctx.bezierCurveTo(3.4E0, 1.63201E2, 3.2E0, 1.61401E2, 5E0, 1.62201E2);
        ctx.bezierCurveTo(6.8E0, 1.63001E2, 2.22E1, 1.63601E2, 9.8E0, 1.86001E2);
        ctx.bezierCurveTo(9.8E0, 1.86001E2, 1.94E1, 1.62001E2, 3.4E0, 1.63201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.38E1, 1.61601E2);
        ctx.bezierCurveTo(1.38E1, 1.61601E2, 1.36E1, 1.59801E2, 1.54E1, 1.60601E2);
        ctx.bezierCurveTo(1.72E1, 1.61401E2, 3.5E1, 1.63601E2, 3.7E1, 2.02401E2);
        ctx.bezierCurveTo(3.7E1, 2.02401E2, 2.98E1, 1.60401E2, 1.38E1, 1.61601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.06E1, 1.60001E2);
        ctx.bezierCurveTo(2.06E1, 1.60001E2, 2.04E1, 1.58201E2, 2.22E1, 1.59001E2);
        ctx.bezierCurveTo(2.4E1, 1.59801E2, 4.86E1, 1.63201E2, 7.22E1, 1.95601E2);
        ctx.bezierCurveTo(7.22E1, 1.95601E2, 3.66E1, 1.58801E2, 2.06E1, 1.60001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.8225E1, 1.57972E2);
        ctx.bezierCurveTo(2.8225E1, 1.57972E2, 2.7788E1, 1.56214E2, 2.9678E1, 1.56768E2);
        ctx.bezierCurveTo(3.1568E1, 1.57322E2, 5.2002E1, 1.55423E2, 9.0099E1, 1.89599E2);
        ctx.bezierCurveTo(9.0099E1, 1.89599E2, 4.3924E1, 1.54656E2, 2.8225E1, 1.57972E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.8625E1, 1.53572E2);
        ctx.bezierCurveTo(3.8625E1, 1.53572E2, 3.8188E1, 1.51814E2, 4.0078E1, 1.52368E2);
        ctx.bezierCurveTo(4.1968E1, 1.52922E2, 7.6802E1, 1.57423E2, 1.28499E2, 1.92399E2);
        ctx.bezierCurveTo(1.28499E2, 1.92399E2, 5.4324E1, 1.50256E2, 3.8625E1, 1.53572E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.8E0), 1.42001E2);
        ctx.bezierCurveTo((-1.8E0), 1.42001E2, (-2E0), 1.40201E2, (-2E-1), 1.41001E2);
        ctx.bezierCurveTo(1.6E0, 1.41801E2, 5.5E1, 1.44401E2, 8.54E1, 1.71201E2);
        ctx.bezierCurveTo(8.54E1, 1.71201E2, 5.0499E1, 1.46426E2, (-1.8E0), 1.42001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.18E1), 1.46001E2);
        ctx.bezierCurveTo((-1.18E1), 1.46001E2, (-1.2E1), 1.44201E2, (-1.02E1), 1.45001E2);
        ctx.bezierCurveTo((-8.4E0), 1.45801E2, 1.62E1, 1.49201E2, 3.98E1, 1.81601E2);
        ctx.bezierCurveTo(3.98E1, 1.81601E2, 4.2E0, 1.44801E2, (-1.18E1), 1.46001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.9503E1, 1.48962E2);
        ctx.bezierCurveTo(4.9503E1, 1.48962E2, 4.8938E1, 1.47241E2, 5.0864E1, 1.47655E2);
        ctx.bezierCurveTo(5.279E1, 1.48068E2, 8.786E1, 1.50004E2, 1.41981E2, 1.81098E2);
        ctx.bezierCurveTo(1.41981E2, 1.81098E2, 6.4317E1, 1.46704E2, 4.9503E1, 1.48962E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(5.7903E1, 1.46562E2);
        ctx.bezierCurveTo(5.7903E1, 1.46562E2, 5.7338E1, 1.44841E2, 5.9264E1, 1.45255E2);
        ctx.bezierCurveTo(6.119E1, 1.45668E2, 9.626E1, 1.47604E2, 1.50381E2, 1.78698E2);
        ctx.bezierCurveTo(1.50381E2, 1.78698E2, 7.3317E1, 1.43904E2, 5.7903E1, 1.46562E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1E-1;
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(6.7503E1, 1.41562E2);
        ctx.bezierCurveTo(6.7503E1, 1.41562E2, 6.6938E1, 1.39841E2, 6.8864E1, 1.40255E2);
        ctx.bezierCurveTo(7.079E1, 1.40668E2, 1.1386E2, 1.45004E2, 2.03582E2, 1.79298E2);
        ctx.bezierCurveTo(2.03582E2, 1.79298E2, 8.2917E1, 1.38904E2, 6.7503E1, 1.41562E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-4.38E1), 1.48401E2);
        ctx.bezierCurveTo((-4.38E1), 1.48401E2, (-3.86E1), 1.48001E2, (-3.98E1), 1.49601E2);
        ctx.bezierCurveTo((-4.1E1), 1.51201E2, (-4.34E1), 1.50401E2, (-4.34E1), 1.50401E2);
        ctx.lineTo((-4.38E1), 1.48401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.3E1), 1.62401E2);
        ctx.bezierCurveTo((-1.3E1), 1.62401E2, (-7.8E0), 1.62001E2, (-9E0), 1.63601E2);
        ctx.bezierCurveTo((-1.02E1), 1.65201E2, (-1.26E1), 1.64401E2, (-1.26E1), 1.64401E2);
        ctx.lineTo((-1.3E1), 1.62401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.18E1), 1.62001E2);
        ctx.bezierCurveTo((-2.18E1), 1.62001E2, (-1.66E1), 1.61601E2, (-1.78E1), 1.63201E2);
        ctx.bezierCurveTo((-1.9E1), 1.64801E2, (-2.14E1), 1.64001E2, (-2.14E1), 1.64001E2);
        ctx.lineTo((-2.18E1), 1.62001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.17169E2), 1.50182E2);
        ctx.bezierCurveTo((-1.17169E2), 1.50182E2, (-1.12124E2), 1.51505E2, (-1.13782E2), 1.52624E2);
        ctx.bezierCurveTo((-1.15439E2), 1.53744E2, (-1.17446E2), 1.52202E2, (-1.17446E2), 1.52202E2);
        ctx.lineTo((-1.17169E2), 1.50182E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.15169E2), 1.40582E2);
        ctx.bezierCurveTo((-1.15169E2), 1.40582E2, (-1.10124E2), 1.41905E2, (-1.11782E2), 1.43024E2);
        ctx.bezierCurveTo((-1.13439E2), 1.44144E2, (-1.15446E2), 1.42602E2, (-1.15446E2), 1.42602E2);
        ctx.lineTo((-1.15169E2), 1.40582E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.22369E2), 1.36182E2);
        ctx.bezierCurveTo((-1.22369E2), 1.36182E2, (-1.17324E2), 1.37505E2, (-1.18982E2), 1.38624E2);
        ctx.bezierCurveTo((-1.20639E2), 1.39744E2, (-1.22646E2), 1.38202E2, (-1.22646E2), 1.38202E2);
        ctx.lineTo((-1.22369E2), 1.36182E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-4.26E1), 2.11201E2);
        ctx.bezierCurveTo((-4.26E1), 2.11201E2, (-4.42E1), 2.11201E2, (-4.82E1), 2.13201E2);
        ctx.bezierCurveTo((-5.02E1), 2.13201E2, (-6.14E1), 2.16801E2, (-6.7E1), 2.26801E2);
        ctx.bezierCurveTo((-6.7E1), 2.26801E2, (-5.46E1), 2.17201E2, (-4.26E1), 2.11201E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.5116E1, 3.03847E2);
        ctx.bezierCurveTo(4.5257E1, 3.04105E2, 4.5312E1, 3.04525E2, 4.5604E1, 3.04542E2);
        ctx.bezierCurveTo(4.6262E1, 3.04582E2, 4.7495E1, 3.04883E2, 4.737E1, 3.04247E2);
        ctx.bezierCurveTo(4.6522E1, 2.99941E2, 4.5648E1, 2.95004E2, 4.1515E1, 2.93197E2);
        ctx.bezierCurveTo(4.0876E1, 2.92918E2, 3.9434E1, 2.93331E2, 3.936E1, 2.94215E2);
        ctx.bezierCurveTo(3.9233E1, 2.95739E2, 3.9116E1, 2.97088E2, 3.9425E1, 2.98554E2);
        ctx.bezierCurveTo(3.9725E1, 2.99975E2, 4.1883E1, 2.99985E2, 4.28E1, 2.98601E2);
        ctx.bezierCurveTo(4.3736E1, 3.00273E2, 4.4168E1, 3.02116E2, 4.5116E1, 3.03847E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.4038E1, 3.08581E2);
        ctx.bezierCurveTo(3.4786E1, 3.09994E2, 3.4659E1, 3.11853E2, 3.6074E1, 3.12416E2);
        ctx.bezierCurveTo(3.6814E1, 3.1271E2, 3.8664E1, 3.11735E2, 3.8246E1, 3.10661E2);
        ctx.bezierCurveTo(3.7444E1, 3.086E2, 3.7056E1, 3.06361E2, 3.5667E1, 3.0455E2);
        ctx.bezierCurveTo(3.5467E1, 3.04288E2, 3.5707E1, 3.03755E2, 3.5547E1, 3.03427E2);
        ctx.bezierCurveTo(3.4953E1, 3.02207E2, 3.3808E1, 3.01472E2, 3.24E1, 3.01801E2);
        ctx.bezierCurveTo(3.1285E1, 3.04004E2, 3.2433E1, 3.06133E2, 3.3955E1, 3.07842E2);
        ctx.bezierCurveTo(3.4091E1, 3.07994E2, 3.3925E1, 3.0837E2, 3.4038E1, 3.08581E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.564E0), 3.03391E2);
        ctx.bezierCurveTo((-5.672E0), 3.03014E2, (-5.71E0), 3.02551E2, (-5.545E0), 3.0223E2);
        ctx.bezierCurveTo((-5.014E0), 3.01197E2, (-4.221E0), 3.00075E2, (-4.558E0), 2.99053E2);
        ctx.bezierCurveTo((-4.906E0), 2.97997E2, (-6.022E0), 2.98179E2, (-6.672E0), 2.98748E2);
        ctx.bezierCurveTo((-7.807E0), 2.99742E2, (-7.856E0), 3.01568E2, (-8.547E0), 3.02927E2);
        ctx.bezierCurveTo((-8.743E0), 3.03313E2, (-8.692E0), 3.03886E2, (-9.133E0), 3.04277E2);
        ctx.bezierCurveTo((-9.607E0), 3.04698E2, (-1.0047E1), 3.06222E2, (-9.951E0), 3.06793E2);
        ctx.bezierCurveTo((-9.898E0), 3.07106E2, (-1.0081E1), 3.17014E2, (-9.859E0), 3.16751E2);
        ctx.bezierCurveTo((-9.24E0), 3.16018E2, (-6.19E0), 3.06284E2, (-6.121E0), 3.05392E2);
        ctx.bezierCurveTo((-6.064E0), 3.04661E2, (-5.332E0), 3.04196E2, (-5.564E0), 3.03391E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.1202E1), 2.96599E2);
        ctx.bezierCurveTo((-2.8568E1), 2.941E2, (-2.5778E1), 2.91139E2, (-2.622E1), 2.87427E2);
        ctx.bezierCurveTo((-2.6336E1), 2.86451E2, (-2.8111E1), 2.86978E2, (-2.8298E1), 2.87824E2);
        ctx.bezierCurveTo((-2.91E1), 2.91449E2, (-3.1139E1), 2.9411E2, (-3.3707E1), 2.96502E2);
        ctx.bezierCurveTo((-3.5903E1), 2.98549E2, (-3.7765E1), 3.04893E2, (-3.8E1), 3.05401E2);
        ctx.bezierCurveTo((-3.4303E1), 3.00145E2, (-3.2046E1), 2.97399E2, (-3.1202E1), 2.96599E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-4.4776E1), 2.90635E2);
        ctx.bezierCurveTo((-4.4253E1), 2.90265E2, (-4.4555E1), 2.89774E2, (-4.4338E1), 2.89442E2);
        ctx.bezierCurveTo((-4.3385E1), 2.87984E2, (-4.2084E1), 2.86738E2, (-4.2066E1), 2.85E2);
        ctx.bezierCurveTo((-4.2063E1), 2.84723E2, (-4.2441E1), 2.84414E2, (-4.2776E1), 2.84638E2);
        ctx.bezierCurveTo((-4.3053E1), 2.84822E2, (-4.3395E1), 2.84952E2, (-4.3503E1), 2.85082E2);
        ctx.bezierCurveTo((-4.5533E1), 2.87531E2, (-4.6933E1), 2.90202E2, (-4.8376E1), 2.93014E2);
        ctx.bezierCurveTo((-4.8559E1), 2.93371E2, (-4.9703E1), 2.97862E2, (-4.939E1), 2.97973E2);
        ctx.bezierCurveTo((-4.9151E1), 2.98058E2, (-4.7431E1), 2.93877E2, (-4.7221E1), 2.93763E2);
        ctx.bezierCurveTo((-4.5958E1), 2.93077E2, (-4.5946E1), 2.91462E2, (-4.4776E1), 2.90635E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-2.8043E1), 3.10179E2);
        ctx.bezierCurveTo((-2.7599E1), 3.0931E2, (-2.6023E1), 3.08108E2, (-2.6136E1), 3.07219E2);
        ctx.bezierCurveTo((-2.6254E1), 3.06291E2, (-2.5786E1), 3.04848E2, (-2.6698E1), 3.05536E2);
        ctx.bezierCurveTo((-2.7955E1), 3.06484E2, (-3.1404E1), 3.07833E2, (-3.1674E1), 3.13641E2);
        ctx.bezierCurveTo((-3.17E1), 3.14212E2, (-2.8726E1), 3.11519E2, (-2.8043E1), 3.10179E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.36E1), 2.93001E2);
        ctx.bezierCurveTo((-1.32E1), 2.92333E2, (-1.2492E1), 2.92806E2, (-1.2033E1), 2.92543E2);
        ctx.bezierCurveTo((-1.1385E1), 2.92171E2, (-1.0774E1), 2.91613E2, (-1.0482E1), 2.90964E2);
        ctx.bezierCurveTo((-9.512E0), 2.88815E2, (-7.743E0), 2.86995E2, (-7.6E0), 2.84601E2);
        ctx.bezierCurveTo((-9.091E0), 2.83196E2, (-9.77E0), 2.85236E2, (-1.04E1), 2.86201E2);
        ctx.bezierCurveTo((-1.1723E1), 2.84554E2, (-1.2722E1), 2.86428E2, (-1.4022E1), 2.86947E2);
        ctx.bezierCurveTo((-1.4092E1), 2.86975E2, (-1.4305E1), 2.86628E2, (-1.438E1), 2.86655E2);
        ctx.bezierCurveTo((-1.5557E1), 2.87095E2, (-1.6237E1), 2.88176E2, (-1.7235E1), 2.88957E2);
        ctx.bezierCurveTo((-1.7406E1), 2.89091E2, (-1.7811E1), 2.88911E2, (-1.7958E1), 2.89047E2);
        ctx.bezierCurveTo((-1.861E1), 2.8965E2, (-1.9583E1), 2.89975E2, (-1.9863E1), 2.90657E2);
        ctx.bezierCurveTo((-2.0973E1), 2.93364E2, (-2.4113E1), 2.95459E2, (-2.6E1), 3.03001E2);
        ctx.bezierCurveTo((-2.5619E1), 3.0391E2, (-2.1488E1), 2.96359E2, (-2.1001E1), 2.95661E2);
        ctx.bezierCurveTo((-2.0165E1), 2.94465E2, (-2.0047E1), 2.97322E2, (-1.8771E1), 2.96656E2);
        ctx.bezierCurveTo((-1.872E1), 2.96629E2, (-1.8534E1), 2.96867E2, (-1.84E1), 2.97001E2);
        ctx.bezierCurveTo((-1.8206E1), 2.96721E2, (-1.7988E1), 2.96492E2, (-1.76E1), 2.96601E2);
        ctx.bezierCurveTo((-1.76E1), 2.96201E2, (-1.7734E1), 2.95645E2, (-1.7533E1), 2.95486E2);
        ctx.bezierCurveTo((-1.6296E1), 2.94509E2, (-1.638E1), 2.93441E2, (-1.56E1), 2.92201E2);
        ctx.bezierCurveTo((-1.5142E1), 2.9299E2, (-1.4081E1), 2.92271E2, (-1.36E1), 2.93001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(4.62E1, 3.47401E2);
        ctx.bezierCurveTo(4.62E1, 3.47401E2, 5.36E1, 3.27001E2, 4.92E1, 3.15801E2);
        ctx.bezierCurveTo(4.92E1, 3.15801E2, 6.06E1, 3.37401E2, 5.6E1, 3.48601E2);
        ctx.bezierCurveTo(5.6E1, 3.48601E2, 5.56E1, 3.38201E2, 5.16E1, 3.33201E2);
        ctx.bezierCurveTo(5.16E1, 3.33201E2, 4.76E1, 3.46001E2, 4.62E1, 3.47401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.14E1, 3.44801E2);
        ctx.bezierCurveTo(3.14E1, 3.44801E2, 3.68E1, 3.36001E2, 2.88E1, 3.17601E2);
        ctx.bezierCurveTo(2.88E1, 3.17601E2, 2.8E1, 3.38001E2, 2.12E1, 3.49001E2);
        ctx.bezierCurveTo(2.12E1, 3.49001E2, 3.54E1, 3.28801E2, 3.14E1, 3.44801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.14E1, 3.42801E2);
        ctx.bezierCurveTo(2.14E1, 3.42801E2, 2.12E1, 3.22801E2, 2.16E1, 3.19801E2);
        ctx.bezierCurveTo(2.16E1, 3.19801E2, 1.78E1, 3.36401E2, 7.6E0, 3.46001E2);
        ctx.bezierCurveTo(7.6E0, 3.46001E2, 2.2E1, 3.34001E2, 2.14E1, 3.42801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(1.18E1, 3.10801E2);
        ctx.bezierCurveTo(1.18E1, 3.10801E2, 1.78E1, 3.24401E2, 7.8E0, 3.42801E2);
        ctx.bezierCurveTo(7.8E0, 3.42801E2, 1.42E1, 3.30601E2, 9.4E0, 3.23601E2);
        ctx.bezierCurveTo(9.4E0, 3.23601E2, 1.2E1, 3.20201E2, 1.18E1, 3.10801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-7.4E0), 3.42401E2);
        ctx.bezierCurveTo((-7.4E0), 3.42401E2, (-8.4E0), 3.26801E2, (-6.6E0), 3.24601E2);
        ctx.bezierCurveTo((-6.6E0), 3.24601E2, (-6.4E0), 3.18201E2, (-6.8E0), 3.17201E2);
        ctx.bezierCurveTo((-6.8E0), 3.17201E2, (-2.8E0), 3.11001E2, (-2.6E0), 3.18401E2);
        ctx.bezierCurveTo((-2.6E0), 3.18401E2, (-1.2E0), 3.26201E2, 1.6E0, 3.30801E2);
        ctx.bezierCurveTo(1.6E0, 3.30801E2, 5.2E0, 3.36201E2, 5E0, 3.42601E2);
        ctx.bezierCurveTo(5E0, 3.42601E2, (-5E0), 3.12401E2, (-7.4E0), 3.42401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-1.1E1), 3.14801E2);
        ctx.bezierCurveTo((-1.1E1), 3.14801E2, (-1.76E1), 3.25601E2, (-1.94E1), 3.44601E2);
        ctx.bezierCurveTo((-1.94E1), 3.44601E2, (-2.08E1), 3.38401E2, (-1.7E1), 3.24001E2);
        ctx.bezierCurveTo((-1.7E1), 3.24001E2, (-1.28E1), 3.08601E2, (-1.1E1), 3.14801E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.28E1), 3.34601E2);
        ctx.bezierCurveTo((-3.28E1), 3.34601E2, (-2.78E1), 3.29201E2, (-2.64E1), 3.24201E2);
        ctx.bezierCurveTo((-2.64E1), 3.24201E2, (-2.28E1), 3.08401E2, (-2.92E1), 3.17001E2);
        ctx.bezierCurveTo((-2.92E1), 3.17001E2, (-2.9E1), 3.25001E2, (-3.72E1), 3.32401E2);
        ctx.bezierCurveTo((-3.72E1), 3.32401E2, (-3.24E1), 3.30001E2, (-3.28E1), 3.34601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.86E1), 3.29601E2);
        ctx.bezierCurveTo((-3.86E1), 3.29601E2, (-3.52E1), 3.12201E2, (-3.44E1), 3.11401E2);
        ctx.bezierCurveTo((-3.44E1), 3.11401E2, (-3.26E1), 3.08001E2, (-3.54E1), 3.11201E2);
        ctx.bezierCurveTo((-3.54E1), 3.11201E2, (-4.42E1), 3.30401E2, (-4.82E1), 3.37001E2);
        ctx.bezierCurveTo((-4.82E1), 3.37001E2, (-4.02E1), 3.27801E2, (-3.86E1), 3.29601E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-4.44E1), 3.13001E2);
        ctx.bezierCurveTo((-4.44E1), 3.13001E2, (-3.28E1), 2.90601E2, (-5.46E1), 3.16401E2);
        ctx.bezierCurveTo((-5.46E1), 3.16401E2, (-4.36E1), 3.06601E2, (-4.44E1), 3.13001E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-5.98E1), 2.98401E2);
        ctx.bezierCurveTo((-5.98E1), 2.98401E2, (-5.5E1), 2.79601E2, (-5.24E1), 2.79801E2);
        ctx.bezierCurveTo((-5.24E1), 2.79801E2, (-4.42E1), 2.70801E2, (-5.08E1), 2.81401E2);
        ctx.bezierCurveTo((-5.08E1), 2.81401E2, (-5.68E1), 2.91001E2, (-5.62E1), 3.00801E2);
        ctx.bezierCurveTo((-5.62E1), 3.00801E2, (-5.68E1), 2.91201E2, (-5.98E1), 2.98401E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.705E2, 2.87E2);
        ctx.bezierCurveTo(2.705E2, 2.87E2, 2.585E2, 2.77E2, 2.56E2, 2.735E2);
        ctx.bezierCurveTo(2.56E2, 2.735E2, 2.695E2, 2.92E2, 2.695E2, 2.99E2);
        ctx.bezierCurveTo(2.695E2, 2.99E2, 2.72E2, 2.915E2, 2.705E2, 2.87E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.76E2, 2.65E2);
        ctx.bezierCurveTo(2.76E2, 2.65E2, 2.55E2, 2.5E2, 2.515E2, 2.425E2);
        ctx.bezierCurveTo(2.515E2, 2.425E2, 2.78E2, 2.72E2, 2.78E2, 2.765E2);
        ctx.bezierCurveTo(2.78E2, 2.765E2, 2.785E2, 2.675E2, 2.76E2, 2.65E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.93E2, 1.11E2);
        ctx.bezierCurveTo(2.93E2, 1.11E2, 2.81E2, 1.03E2, 2.795E2, 1.05E2);
        ctx.bezierCurveTo(2.795E2, 1.05E2, 2.9E2, 1.115E2, 2.925E2, 1.2E2);
        ctx.bezierCurveTo(2.925E2, 1.2E2, 2.91E2, 1.11E2, 2.93E2, 1.11E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = '#cccccc';
        ctx.fillStyle = 'rgba(204,204,204,1)';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(3.015E2, 1.915E2);
        ctx.lineTo(2.84E2, 1.795E2);
        ctx.bezierCurveTo(2.84E2, 1.795E2, 3.03E2, 1.965E2, 3.035E2, 2.005E2);
        ctx.lineTo(3.015E2, 1.915E2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-8.925E1), 1.69E2);
        ctx.lineTo((-6.725E1), 1.7375E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.9E1), 3.31E2);
        ctx.bezierCurveTo((-3.9E1), 3.31E2, (-3.95E1), 3.275E2, (-4.85E1), 3.38E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo((-3.35E1), 3.36E2);
        ctx.bezierCurveTo((-3.35E1), 3.36E2, (-3.15E1), 3.295E2, (-3.8E1), 3.34E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px sans-serif';
        ctx.beginPath();
        ctx.moveTo(2.05E1, 3.445E2);
        ctx.bezierCurveTo(2.05E1, 3.445E2, 2.2E1, 3.335E2, 1.05E1, 3.465E2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        ctx.restore();
        ctx.restore();

    }

    function transform(ctx) {
        // case 1
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.setTransform(1,1,0,1,0,0);
        ctx.fillRect(0,0,100,100);
        ctx.resetTransform();

        // case 2
        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 50, 50);
        ctx.resetTransform();

        // case 3
        ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(100, 0);
        ctx.transform(2, 0, 0, 2, 0, 0);
        ctx.lineTo(100, 100);
        ctx.transform(2, 0, 0, 1, 0, 0);
        ctx.lineTo(100, 100);
        ctx.closePath();
        ctx.fill();
        ctx.resetTransform();
    }

    const tests = [
        tiger,
        arc, 
        arcTo$1, 
        arcTo, 
        emptyArc, 
        fillStyle, 
        globalAlpha, 
        gradient, 
        linecap, 
        linewidth, 
        rgba, 
        rotate, 
        saveAndRestore, 
        setLineDash,
        text,
        transform
    ];

    for (let fn of tests) {
        let name = fn.name;
        // Container
        const container = document.createElement('div');
        container.className = 'example';
        container.id = 'example-' + name;
        container.innerHTML = `<h2>${name}</h2><div class="canvas"></div><div class="svg"></div>`;
        // Canvas
        const canvas = document.createElement('canvas');
        container.querySelector('.canvas').appendChild(canvas);
        // SVGCanvas
        const svgcanvas = new SVGCanvasElement();
        container.querySelector('.svg').appendChild(svgcanvas.getElement());
        document.querySelector('body').appendChild(container);
        // Render
        for (let c of [canvas, svgcanvas]) {
            c.width = 500;
            c.height = 500;
            const ctx = c.getContext('2d');
            fn(ctx);
        }
    }

}());
