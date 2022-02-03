function toString(obj) {
    if (typeof obj === 'string') {
        return obj
    }
    return obj.toString()
}

export {toString};