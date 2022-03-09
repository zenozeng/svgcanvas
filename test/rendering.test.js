import {Element} from '../index'
import arc from './tests/arc'
import arcTo from './tests/arcTo'
import arcTo2 from './tests/arcTo2'
import emptyArc from './tests/emptyArc'
import fillstyle from './tests/fillstyle'
import globalAlpha from './tests/globalalpha'
import gradient from './tests/gradient'
import linecap from './tests/linecap'
import linewidth from './tests/linewidth'
import rgba from './tests/rgba'
import rotate from './tests/rotate'
import saveandrestore from './tests/saveandrestore'
import setLineDash from './tests/setLineDash'
import text from './tests/text'
import tiger from './tests/tiger'
import transform from './tests/transform'
import pattern from "./tests/pattern";

const tests = {
    tiger,
    arc,
    arcTo,
    arcTo2,
    emptyArc,
    fillstyle,
    globalAlpha,
    gradient,
    linecap,
    linewidth,
    rgba,
    rotate,
    saveandrestore,
    setLineDash,
    text,
    transform,
    pattern
};

const config = {
    pixelDensity: 3 // for 200% and 150%
}

class RenderingTester {
    constructor(fn) {
        this.fn = fn
    }

    async test() {
        const width = 500;
        const height = 500;
        const canvas = document.createElement('canvas');
        const svgcanvas = new Element();
    }

    getPixels(image) {
        const canvas = document.createElement('canvas');
        const width = 100 * config.pixelDensity;
        const height = 100 * config.pixelDensity;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        return ctx.getImageData(0, 0, width, height);
    }    

    diffPixels(imgData1, imgData2) {
        const canvas = document.createElement('canvas');
        const width = 100 * config.pixelDensity;
        const height = 100 * config.pixelDensity;
        const diffImgData = canvas.getContext('2d').getImageData(0, 0, width, height);
        let $this = this;
        for (var i = 0; i < imgData1.data.length; i += 4) {
            var indexes = [i, i+1, i+2, i+3];
            indexes.forEach(function(i) {
                diffImgData.data[i] = 0;
            });
            if(indexes.some(function(i) {
                return Math.abs(imgData1.data[i] - imgData2.data[i]) > $this.maxPixelDiff;
            })) {
                diffImgData.data[i+3] = 255; // set black
            }
        }
        return diffImgData;
    }    
}

describe('RenderTest', () => {
    for (let fn of Object.keys(tests)) {
        it(`should render same results for ${fn}`, async () => {

        })
    }
})
