const DEBUG = true;

function toString(obj) {
    if (!obj) {
        return obj
    }
    if (typeof obj === 'string') {
        return obj
    }
    return obj + '';
}

function debug(...data) {
    if (DEBUG) {
        console.debug(...data)
    }
}

function serializeXML(node) {
    var xml = new XMLSerializer().serializeToString(node);

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
    return xml;
}

export {toString, debug, serializeXML};