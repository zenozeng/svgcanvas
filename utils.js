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


//helper function to format a string
function format(str, args) {
    var keys = Object.keys(args), i;
    for (i=0; i<keys.length; i++) {
        str = str.replace(new RegExp("\\{" + keys[i] + "\\}", "gi"), args[keys[i]]);
    }
    return str;
}

export {toString, debug, format};