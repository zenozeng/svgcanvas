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

export {toString, debug};