var args            = require('yargs').argv;
var autoprefixer    = require('gulp-autoprefixer');
var bump            = require('gulp-bump');
var checktextdomain = require('gulp-checktextdomain');
var concat          = require('gulp-concat');
var cssnano         = require('gulp-cssnano');
var exec            = require('gulp-exec');
var gulp            = require('gulp-help')(require('gulp'));
var gulpif          = require('gulp-if');
var mergeStream     = require('merge-stream');
var plumber         = require('gulp-plumber');
var potomo          = require('gulp-potomo');
var pseudo          = require('gulp-pseudo-i18n');
var rename          = require('gulp-rename');
var runSequence     = require('run-sequence');
var sass            = require('gulp-sass');
var sort            = require('gulp-sort');
var wpPot           = require('gulp-wp-pot');
var yaml            = require('yamljs');

var config = yaml.load('config.yml');

/* CSS Task
 -------------------------------------------------- */
gulp.task('styles', 'Compile all stylesheets.', function() {
  return gulp.src( config.watch.scss, { base: '.' })
  .pipe(plumber({ errorHandler: function(error) {
      console.log(error.message);
      this.emit('end');
  }}))
  .pipe(sass({
    outputStyle: 'compact',
    sourcemap: false,
  }))
  .pipe(autoprefixer('last 1 version', '> 1%', 'ie 8', 'ie 7'))
  .pipe(gulpif(args.production, cssnano({
    discardComments: { removeAll: true }
  })))
  .pipe(rename(function(path) {
    path.dirname = path.dirname.replace('scss', 'css');
  }))
  .pipe(gulp.dest('.'))
},{
	options: { 'production': 'Minify the stylesheets.' }
});

/* Watch Task
 -------------------------------------------------- */
gulp.task('watch', 'Watch all stylesheets for changes.', function() {
  return gulp.watch( config.watch.scss, ['styles']);
},{
	options: { 'production': 'Minify the stylesheets.' }
});

/* Archive Task
 -------------------------------------------------- */
gulp.task('archive', 'Generate the plugin archive zip file.', function() {
  return gulp.src('./').pipe(exec('git archive -o ../gridable.zip HEAD'));
});

/* Default Task
 -------------------------------------------------- */
gulp.task('default', false, function() {
  gulp.start('styles', 'languages');
});

/* Version Task
 -------------------------------------------------- */
gulp.task('bump', 'Incrementally increase the plugin version.', function() {
  ['patch', 'minor', 'major'].some(function(arg) {
    if(!args[arg])return;
    for(var key in config.bump) {
      gulp.src(config.bump[key]).pipe(bump({
        type: arg,
        key: key,
      })).pipe(gulp.dest('.'));
    }
    return true;
  });
},{
	options: {
		'patch': 'e.g. v0.0.1',
		'minor': 'e.g. v0.1.0',
		'major': 'e.g. v1.0.0',
	}
});

/* Language Tasks
 -------------------------------------------------- */
gulp.task('languages', 'Generate the plugin language files.', function() {
  return runSequence('po', 'mo')
});
gulp.task('po', false, function() {
  return gulp.src(config.language.src)
  .pipe(checktextdomain({
    text_domain: config.language.domain,
    keywords: [
      '__:1,2d',
      '_e:1,2d',
      '_x:1,2c,3d',
      'esc_html__:1,2d',
      'esc_html_e:1,2d',
      'esc_html_x:1,2c,3d',
      'esc_attr__:1,2d',
      'esc_attr_e:1,2d',
      'esc_attr_x:1,2c,3d',
      '_ex:1,2c,3d',
      '_n:1,2,4d',
      '_nx:1,2,4c,5d',
      '_n_noop:1,2,3d',
      '_nx_noop:1,2,3c,4d',
    ],
  }))
  .pipe(sort())
  .pipe(wpPot({
    domain: config.language.domain,
    lastTranslator: config.language.translator,
    team: config.language.team,
  }))
  .pipe(pseudo({
    charMap: {},
  }))
  .pipe(rename(config.language.domain + '-en_US.po'))
  .pipe(gulp.dest(config.language.dest));
});
gulp.task('mo', false, function() {
  return gulp.src(config.language.dest + '*.po')
  .pipe(potomo())
  .pipe(gulp.dest(config.language.dest));
});
