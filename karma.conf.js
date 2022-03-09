process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha'],
        files: [
            'dist/rendering.test.js',
        ],
        preprocessors: {
            '**/*.js': ['sourcemap']
        },
        reporters: ['progress', 'coverage', 'mocha'],
        coverageReporter: {
            type: 'lcovonly',
            dir : 'coverage/',
            subdir: '.',
            file: 'lcov.info'
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['ChromeHeadless'],
        singleRun: true // output all logs to stdout instead of click debug button
    });
};