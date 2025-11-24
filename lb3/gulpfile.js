import gulp from 'gulp';
import less from 'gulp-less';
import cleanCSS from 'gulp-clean-css';
import terser from 'gulp-terser';
import pug from 'gulp-pug';
import babel from 'gulp-babel';

export const compileLess = () => {
    return gulp.src('src/client/less/main.less')
        .pipe(less())
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist-gulp/css'));
};

export const compileJS = () => {
    return gulp.src('src/client/js/**/*.js')
        .pipe(babel({
            presets: [
                ['@babel/preset-env', {
                    targets: {
                        browsers: ['last 2 versions', 'ie >= 11']
                    },
                    modules: false
                }]
            ],
            plugins: [
                '@babel/plugin-syntax-dynamic-import'
            ]
        }))
        .pipe(terser())
        .pipe(gulp.dest('dist-gulp/js'));
};

export const compilePug = () => {
    return gulp.src('src/client/views/**/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('dist-gulp/html'));
};

export const copyImages = () => {
    return gulp.src('src/client/images/**/*')
        .pipe(gulp.dest('dist-gulp/images'));
};

export const watchLess = () => {
    return gulp.watch('src/client/less/**/*.less', compileLess);
};

export const watchJS = () => {
    return gulp.watch('src/client/js/**/*.js', compileJS);
};

export const watchPug = () => {
    return gulp.watch('src/client/views/**/*.pug', compilePug);
};

export const watchImages = () => {
    return gulp.watch('src/client/images/**/*', copyImages);
};

export const build = gulp.parallel(compileLess, compileJS, compilePug, copyImages);

export const dev = () => {
    build();
    
    gulp.watch('src/client/less/**/*.less', compileLess);
    gulp.watch('src/client/js/**/*.js', compileJS);
    gulp.watch('src/client/views/**/*.pug', compilePug);
    gulp.watch('src/client/images/**/*', copyImages);

    console.log('🚀 Gulp watchers started! Watching for changes...');
};

export const watch = gulp.parallel(watchLess, watchJS, watchPug, watchImages);

export default build;