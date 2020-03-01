'use strict';

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
    modes: ["development", "production"],
    default: "development",
    verbose: false
});
const stream = require('webpack-stream');
const inject = require('gulp-inject');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');

sass.compiler = require('node-sass')


if (mode.production()) {
    var config = require('./webpack.prod.js');
} else {
    var config = require('./webpack.dev.js');
}

function serve() {
    browserSync.init({
        server: {
            baseDir: "./dist"
        },
        port: 8080
    });

    watch(['src/**/*.js', '!src/bundle.js'], javascript);
    watch('src/bundle.js', webpack);
    watch('src/**/*.css', css);
    watch(['src/**/*.html', '!src/index.html'], html);
    watch(['src/**/*.png', 'src/**/*.jpg', 'src/**/*.gif', 'src/**/*.svg'], images);
    watch(['src/**/*.json', 'src/**/*.ico'], copy);
    watch('src/index.html', injectBundle);
    watch(['src/standalone.js', 'src/scripts/apploader.js'], standalone);
}

function standalone() {
    return src(['src/standalone.js', 'src/scripts/apploader.js'], { base: './src/' })
        .pipe(concat('scripts/apploader.js'))
        .pipe(dest('dist/'));
}

function clean() {
    return del(['dist/']);
}

function javascript() {
    return src(['src/**/*.js', '!src/bundle.js'], { base: './src/' })
        .pipe(mode.development(sourcemaps.init({ loadMaps: true })))
        .pipe(babel({
            presets: [
                ['@babel/preset-env']
            ]
        }))
        .pipe(terser({
            keep_fnames: true,
            mangle: false
        }))
        .pipe(mode.development(sourcemaps.write('.')))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function webpack() {
    return stream(config)
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function css() {
    return src(['src/**/*.css', 'src/**/*.scss'], { base: './src/' })
        .pipe(mode.development(sourcemaps.init({ loadMaps: true })))
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss())
        .pipe(mode.development(sourcemaps.write('.')))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function html() {
    return src(['src/**/*.html', '!src/index.html'], { base: './src/' })
        .pipe(mode.production(htmlmin({ collapseWhitespace: true })))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function images() {
    return src(['src/**/*.png', 'src/**/*.jpg', 'src/**/*.gif', 'src/**/*.svg'], { base: './src/' })
        .pipe(mode.production(imagemin()))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function copy() {
    return src(['src/**/*.json', 'src/**/*.ico'], { base: './src/' })
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

function injectBundle() {
    return src('src/index.html', { base: './src/' })
        .pipe(inject(
            src(['src/scripts/apploader.js'], { read: false }, { base: './src/' }), { relative: true }
        ))
        .pipe(dest('dist/'))
        .pipe(browserSync.stream());
}

exports.default = series(clean, parallel(javascript, webpack, css, html, images, copy), injectBundle)
exports.standalone = series(exports.default, standalone)
exports.serve = series(exports.standalone, serve)
