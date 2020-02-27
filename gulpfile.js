'use strict';

const { src, dest, series, parallel } = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const sourcemaps = require('gulp-sourcemaps');
const webpack_stream = require('webpack-stream');
const webpack_config = require('./webpack.prod.js');
const inject = require('gulp-inject');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');

function devBrowser() {
    browserSync.init({
        server: {
            baseDir: "./dist"
        },
        port: 8080
    });
}

function setStandalone() {
    return src(['src/standalone.js', 'src/scripts/apploader.js'], {base: './src/'})
    .pipe(concat('scripts/apploader.js'))
    .pipe(dest('dist/'));
}

// Clean assets
function clean() {
    return del(['dist/']);
}

function javascript() {
    return src(['src/**/*.js', '!src/bundle.js'], {base: './src/'})
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({
        presets: ['@babel/preset-env']
    }))
    .pipe(terser({
        keep_fnames: true,
        mangle: false
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist/'));
}

function webpack() {
    return webpack_stream(webpack_config)
    .pipe(dest('dist/'));
}

function css() {
    return src('src/**/*.css', {base: './src/'})
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(postcss([
        autoprefixer(),
        cssnano()
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist/'));
}

function html() {
    return src(['src/**/*.html', '!src/index.html'], {base: './src/'})
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('dist/'));
}

function images() {
    return src(['src/**/*.png', 'src/**/*.jpg', 'src/**/*.gif', 'src/**/*.svg'], {base: './src/'})
    .pipe(imagemin())
    .pipe(dest('dist/'))
}

function copy() {
    return src(['src/**/*.json', 'src/**/*.ico'], {base: './src/'})
    .pipe(dest('dist/'))
}

function injectBundle() {
    return src('src/index.html', {base: './src/'})
    .pipe(inject(
        src(['src/scripts/apploader.js'], {read: false}, {base: './src/'}), {relative: true}
    ))
    .pipe(dest('dist/'))
}

exports.default = series(clean, parallel(javascript, webpack, css, html, images, copy), injectBundle)
exports.run = series(exports.default, setStandalone, devBrowser)
