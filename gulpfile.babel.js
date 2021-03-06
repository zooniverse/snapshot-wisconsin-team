import gulp from 'gulp';
import autoprefixer from 'autoprefixer';
import browserify from 'browserify';
import watchify from 'watchify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import eslint from 'gulp-eslint';
import babelify from 'babelify';
import uglify from 'gulp-uglify';
import rimraf from 'rimraf';
import notify from 'gulp-notify';
import browserSync, { reload } from 'browser-sync';
import sourcemaps from 'gulp-sourcemaps';
import stylus from 'gulp-stylus';
import htmlReplace from 'gulp-html-replace';
import imagemin from 'gulp-imagemin';
import runSequence from 'run-sequence';
import nib from 'nib';

const paths = {
  bundle: 'app.js',
  srcJsx: 'src/Index.js',
  srcCss: 'src/**/main.styl',
  srcImg: 'src/images/**',
  dest: 'public',
  destJs: 'public/js',
  destImg: 'public/images'
};

gulp.task('clean', cb => {
  rimraf('./public/*/*', cb);
});

gulp.task('browserSync', () => {
  browserSync({
    server: {
      baseDir: './public/'
    }
  });
});

gulp.task('watchify', () => {
  let bundler = watchify(browserify(paths.srcJsx, watchify.args));

  function rebundle() {
    return bundler
      .bundle()
      .on('error', notify.onError())
      .pipe(source(paths.bundle))
      .pipe(gulp.dest(paths.destJs))
      .pipe(reload({stream: true}));
  }

  bundler.transform(babelify)
  .on('update', rebundle);
  return rebundle();
});

gulp.task('browserify', () => {
  browserify(paths.srcJsx)
  .transform(babelify)
  .bundle()
  .pipe(source(paths.bundle))
  .pipe(buffer())
  .pipe(sourcemaps.init())
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(paths.destJs));
});

gulp.task('styles', () => {
  gulp.src(paths.srcCss)
    .pipe(stylus({
      use: nib()
    }))
    .pipe(gulp.dest(paths.dest));
});

gulp.task('htmlReplace', () => {
  gulp.src('./public/index.html')
  .pipe(htmlReplace({css: 'styles/main.css', js: 'js/app.js'}))
  .pipe(gulp.dest(paths.dest));
});

gulp.task('images', () => {
  gulp.src(paths.srcImg)
  .pipe(imagemin())
  .pipe(gulp.dest(paths.destImg));
});

gulp.task('lint', () => {
  gulp.src(paths.srcJsx)
  .pipe(eslint())
  .pipe(eslint.format());
});

gulp.task('watchTask', () => {
  gulp.watch(paths.srcCss, ['styles']);
  gulp.watch(paths.srcJsx, ['lint']);
});

gulp.task('watch', cb => {
  runSequence('clean', ['browserSync', 'watchTask', 'watchify', 'styles', 'lint', 'images'], cb);
});

gulp.task('build', cb => {
  process.env.NODE_ENV = 'production';
  runSequence('clean', ['browserify', 'styles', 'htmlReplace', 'images'], cb);
});
