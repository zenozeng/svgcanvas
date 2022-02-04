class ImageUtils {

    /**
     * Convert svg dataurl to canvas element
     * 
     * @private
     */
    async svg2canvas(svgDataURL, width, height) {
        const svgImage = await new Promise((resolve) => {
            var svgImage = new Image();
            svgImage.onload = function() {
                resolve(svgImage);
            }
            svgImage.src = svgDataURL;
        })
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(svgImage, 0, 0);
        return canvas;
    }
    
    toDataURL(svgNode, width, height, type, encoderOptions, options) {
        var xml = new XMLSerializer().serializeToString(svgNode);
    
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

        if (!options) {
            options = {}
        }
    
        var SVGDataURL = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
        if (type === "image/svg+xml" || !type) {
            if (options.async) {
                return Promise.resolve(SVGDataURL)
            }
            return SVGDataURL;
        }
        if (type === "image/jpeg" || type === "image/png") {
            if (!options.async) {
                throw new Error('svgcanvas: options.async must be set to true if type is image/jpeg | image/png')
            }
            return (async () => {
                const canvas = await this.svg2canvas(SVGDataURL, width, height);
                const dataUrl = canvas.toDataURL(type, encoderOptions);
                canvas.remove();
                return dataUrl;
            })()
        }
        throw new Error('svgcanvas: Unknown type for toDataURL, please use image/jpeg | image/png | image/svg+xml.');
    }

    getImageData(svgNode, width, height, sx, sy, sw, sh, options) {
        if (!options) {
            options = {}
        }
        if (!options.async) {
            throw new Error('svgcanvas: options.async must be set to true for getImageData')
        }
        const svgDataURL = this.toDataURL(svgNode, width, height, 'image/svg+xml');
        return (async () => {
            const canvas = await this.svg2canvas(svgDataURL, width, height);
            const ctx = canvas.getContext('2d')
            const imageData = ctx.getImageData(sx, sy, sw, sh);
            canvas.remove();
            return imageData;
        })()
    }
}

const utils = new ImageUtils();

export default utils;