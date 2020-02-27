"use strict";

const { src, dest, series, parallel } = require('gulp');
const del = require('del');
const babel = require("gulp-babel");
const terser = require('gulp-terser');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const sourcemaps = require('gulp-sourcemaps');

// Clean assets
function clean() {
    return del(["dist/"]);
}

function javascript() {
    return src("src/**/*.js", {base: './src/'})
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({
        presets: ['@babel/preset-env']
    }))
    .pipe(terser({
        keep_fnames: true,
        mangle: false
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest("dist/"));
}

function css() {
    return src("src/**/*.css", {base: './src/'})
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(cssnano())
    .pipe(sourcemaps.write('.'))
    .pipe(dest("dist/"));
}

function html() {
    return src("src/**/*.html", {base: './src/'})
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest("dist/"));
}

exports.default = series(clean, parallel(javascript, css, html))
