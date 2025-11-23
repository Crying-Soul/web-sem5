const gulp = require('gulp');
const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const pug = require('gulp-pug');
const terser = require('gulp-terser');
const rename = require('gulp-rename');

// LESS -> CSS + минификация
// LESS -> build/css
gulp.task('styles', function () {
  return gulp.src('src/styles/*.less')
    .pipe(less())
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('build/css'));
});

// Pug -> HTML
// Pug -> build/html
gulp.task('templates', function () {
  return gulp.src('src/templates/**/*.pug')
    .pipe(pug())
    .pipe(gulp.dest('build/html'));
});

// Babel (TS/JS) -> JS + минификация
// TS/JS -> build/js
gulp.task('scripts', function () {
  return gulp.src('src/**/*.ts')
    .pipe(babel({ presets: ['@babel/preset-env', '@babel/preset-typescript'] }))
    .pipe(terser())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('build/js'));
});

// Копирование статических файлов
// Статика -> build/static
gulp.task('static', function () {
  return gulp.src(['src/assets/**/*', 'src/*.html'])
    .pipe(gulp.dest('build/static'));
});

// Сборка в папку dist (для Webpack)
// Webpack кладёт только в dist/
// gulp dist — только копирование, не сборка
gulp.task('dist', function () {
  return gulp.src('dist/**/*').pipe(gulp.dest('build/dist'));
});

gulp.task('default', gulp.parallel('styles', 'templates', 'scripts', 'static', 'dist'));
