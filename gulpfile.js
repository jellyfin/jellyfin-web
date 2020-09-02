const { src, dest, series, parallel, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const sourcemaps = require('gulp-sourcemaps');
const mode = require('gulp-mode')({
    modes: ['development', 'production'],
    default: 'development',
    verbose: false
});
const stream = require('webpack-stream');
const inject = require('gulp-inject');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const gulpif = require('gulp-if');
const lazypipe = require('lazypipe');

sass.compiler = require('node-sass');

let config;
if (mode.production()) {
    config = require('./webpack.prod.js');
} else {
    config = require('./webpack.dev.js');
}

const options = {
    javascript: {
        query: ['src/**/*.js', '!src/bundle.js', '!src/standalone.js', '!src/scripts/apploader.js']
    },
    apploader: {
        query: ['src/standalone.js', 'src/scripts/apploader.js']
    },
    css: {
        query: ['src/**/*.css', 'src/**/*.scss']
    },
    html: {
        query: ['src/**/*.html', '!src/index.html']
    },
    images: {
        query: ['src/**/*.png', 'src/**/*.jpg', 'src/**/*.gif', 'src/**/*.svg']
    },
    copy: {
        query: ['src/**/*.json', 'src/**/*.ico', 'src/**/*.mp3']
    },
    injectBundle: {
        query: 'src/index.html'
    }
};

function serve() {
    browserSync.init({
        server: {
            baseDir: './dist'
        },
        port: 8080
    });

    const events = ['add', 'change'];

    watch(options.javascript.query).on('all', function (event, path) {
        if (events.includes(event)) {
            javascript(path);
        }
    });

    watch(options.apploader.query, apploader(true));

    watch('src/bundle.js', webpack);

    watch(options.css.query).on('all', function (event, path) {
        if (events.includes(event)) {
            css(path);
        }
    });

    watch(options.html.query).on('all', function (event, path) {
        if (events.includes(event)) {
            html(path);
        }
    });

    watch(options.images.query).on('all', function (event, path) {
        if (events.includes(event)) {
            images(path);
        }
    });

    watch(options.copy.query).on('all', function (event, path) {
        if (events.includes(event)) {
            copy(path);
        }
    });

    watch(options.injectBundle.query, injectBundle);
}

function clean() {
    return del(['dist/']);
}

const pipelineJavascript = lazypipe()
    .pipe(function () {
        return mode.development(sourcemaps.init({ loadMaps: true }));
    })
    .pipe(function () {
        return babel({
            presets: [
                ['@babel/preset-env']
            ]
        });
    })
    .pipe(function () {
        return terser({
            keep_fnames: true,
            mangle: false
        });
    })
    .pipe(function () {
        return mode.development(sourcemaps.write('.'));
    });

function javascript(query) {
    return src(typeof query !== 'function' ? query : options.javascript.query, { base: './src/' })
        .pipe(pipelineJavascript())
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function apploader(standalone) {
    function task() {
        return src(options.apploader.query, { base: './src/' })
            .pipe(gulpif(standalone, concat('scripts/apploader.js')))
            .pipe(pipelineJavascript())
            .pipe(dest('dist/'))
            .pipe(browserSync.stream());
    }

    task.displayName = 'apploader';

    return task;
}

function webpack() {
    return stream(config)
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function css(query) {
    return src(typeof query !== 'function' ? query : options.css.query, { base: './src/' })
        .pipe(mode.development(sourcemaps.init({ loadMaps: true })))
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss())
        .pipe(mode.development(sourcemaps.write('.')))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function html(query) {
    return src(typeof query !== 'function' ? query : options.html.query, { base: './src/' })
        .pipe(mode.production(htmlmin({ collapseWhitespace: true })))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function images(query) {
    return src(typeof query !== 'function' ? query : options.images.query, { base: './src/' })
        .pipe(mode.production(imagemin()))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function copy(query) {
    return src(typeof query !== 'function' ? query : options.copy.query, { base: './src/' })
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function injectBundle() {
    return src(options.injectBundle.query, { base: './src/' })
        .pipe(inject(
            src(['src/scripts/apploader.js'], { read: false }, { base: './src/' }), {
                relative: true,
                transform: function (filepath) {
                    return `<script src="${filepath}" defer></script>`;
                }
            }
        ))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function build(standalone) {
    return series(clean, parallel(javascript, apploader(standalone), webpack, css, html, images, copy));
}

exports.default = series(build(false), injectBundle);
exports.standalone = series(build(true), injectBundle);
exports.serve = series(exports.standalone, serve);
