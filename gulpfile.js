/**
 * Donaldson gulpfiles.js
 * 
 */

var gulp = require('gulp');
var path = require('path');
var argv = require('yargs').argv;
var mergeStream = require('merge-stream');
var requirejs = require('requirejs');
var $ = require('gulp-load-plugins')();
var isNotS = argv.ACSDOCROOT ? true : false;
var formats = {
	script : '*.{js,map}',
	style : '*.{sass,scss}',
	font : '*.{eot,svg,ttf,woff,woff2}',
	image : '*.{png,gif,jpg,ico}'
}
var pathNames = {
	sourcesUrl : isNotS ? path.join('..', '..', 'modules', 'estore', 'j2ee', 'acsdocroot.war') : 'development',
	targetUrl : isNotS ? argv.ACSDOCROOT : 'app',
	bowerLib : 'bower_components',
	styles : 'css',
	scripts : 'js',
	images : 'images',
	fonts : 'fonts',
	exclude : [ '!*/**/{build,demo,demos,test,tasks,docs,versions,source/dev,source/jquery,bootstrap-sass-official/assets/javascripts,angular-latest}/**/*' ],
	exBootstrap : '!*/**/bootstrap/**/*'
};

var sourcesPaths = {
	styles : {
		base : path.join(pathNames.sourcesUrl, pathNames.styles, '**', '*.css'),
		sass : path.join(pathNames.sourcesUrl, pathNames.styles, '**', formats.style),
		bower : [ path.join(pathNames.bowerLib, '**', '*.css'), pathNames.exBootstrap ].concat(pathNames.exclude),
		bootstrap : [ path.join(pathNames.bowerLib, '**', 'bootstrap-sass-official', '**', 'stylesheets', '**', formats.style) ].concat(pathNames.exclude)
	},
	scripts : {
		base : [ path.join(pathNames.sourcesUrl, pathNames.scripts, '**', formats.script), path.join(pathNames.sourcesUrl, pathNames.scripts, '**', '*.json') ],
		bower : [ path.join(pathNames.bowerLib, '**', formats.script) ].concat(pathNames.exclude, [ '!*/**/Gruntfile.js', '!*/**/gulpfile.js' ])
	},
	images :  {
		base : [ path.join(pathNames.sourcesUrl, '**', formats.image), '!' + path.join(pathNames.sourcesUrl, '**', pathNames.bowerLib, '**', formats.image)],
		bower : [ path.join(pathNames.bowerLib, '**', formats.image), pathNames.exBootstrap ].concat(pathNames.exclude),
		bootstrap : [ path.join(pathNames.bowerLib, '**', 'images', 'bootstrap', '**', formats.image) ].concat(pathNames.exclude)
	},
	fonts : {
		base : path.join(pathNames.sourcesUrl, pathNames.fonts, '**', formats.font),
		bower : [ path.join(pathNames.bowerLib, '**', formats.font) ].concat(pathNames.exclude),
	},
	war : [ path.join(pathNames.sourcesUrl, '{WEB-INF,META-INF}', '**', '*'), path.join(pathNames.sourcesUrl, '**', '*.{html,jsp}'), '!' + path.join(pathNames.sourcesUrl, pathNames.bowerLib, '**', '*') ]
};

var targetPaths = {
	styles : path.join(pathNames.targetUrl, pathNames.styles),
	scripts : path.join(pathNames.targetUrl, pathNames.scripts),
	images : path.join(pathNames.targetUrl, pathNames.images),
	fonts : path.join(pathNames.targetUrl, pathNames.fonts),
	j2eeBower : path.join('..', 'modules', 'estore', 'j2ee', 'acsdocroot.war', pathNames.bowerLib)
}

gulp.task('init-styles', [ 'init-bower' ], function() {
	return sassBootstrap();
});

gulp.task('styles', function() {
	var bcssStream, scssStream;
	var est = false;

	bcssStream = minifyCss(gulp.src(sourcesPaths.styles.base)).pipe(gulp.dest(targetPaths.styles)).pipe($.size());
	/* Styles Need Bootstrap Sass */
	path.exists(path.join(pathNames.bowerLib, 'bootstrap-sass-official'), function(exists) {
		est = exists;
		if (est) {
			scssStream = sassBootstrap();
		} else {
			gulp.start('init-styles');
		}
	});

	return est ? mergeStream(bcssStream, scssStream) : bcssStream;
});

gulp.task('optimization', function() {
	setTimeout(function() {
		if(gulp.tasks[ 'copy-bower' ].done === true || gulp.tasks[ 'copy-bower' ].running !== true) {
			requirejs.optimize({
				allowSourceOverwrites : true,
				appDir : pathNames.sourcesUrl + '/js',
				baseUrl : 'lib',
				dir : pathNames.targetUrl + '/js',
				mainConfigFile : 'requirejs-main.js',
				keepBuildDir : true,
				optimize : 'uglify',
				preserveLicenseComments : false,
				waitSeconds : 0
			}, function(buildResponse) {
				/* To get the optimized file contents. */
				/* var contents = fs.readFileSync(config.out, 'utf8'); */
			}, function(error) {
				console.log('RequireJS Optimization Failed.');
				console.log(error);
				/* Deal With JavaScript Files Without Optimization */
				gulp.start('scripts');
			});
		} else {
			var that = arguments;
			
			setTimeout(function() {
				that.callee();
			}, 100);
		}
	}, 1);
});

gulp.task('scripts', function() {
	gulp.src(sourcesPaths.scripts.base).pipe($.jshint({
		/* Visit http://www.jshint.com/docs/options/ to lookup detail */
		/* Enforcing */
		bitwise : false,
		camelcase : true,
		curly : true,
		eqeqeq : false,
		es3 : false,
		forin : false,
		freeze : false,
		immed : true,
		indent : 4,
		latedef : true,
		lookup : false,
		newcap : true,
		noarg : false,
		noempty : true,
		nonbsp : true,
		nonew : true,
		plusplus : false,
		quotmark : true,
		undef : true,
		unused : false,
		strict : false,
		maxparams : 5,
		maxdepth : 5,
		maxstatements : 10,
		maxcomplexity : 5,
		maxlen : 200,
		/* Environments */
		browser : true,
		jquery : true,
		node : true
	})).pipe($.jshint.reporter(require('jshint-stylish'))).pipe(gulp.dest(targetPaths.scripts)).pipe($.size({
		title : 'Scripts'
	}));
});

gulp.task('war', function() {
	gulp.src(sourcesPaths.war).pipe(gulp.dest(pathNames.targetUrl)).pipe($.size({
		title : 'War'
	}));
});

gulp.task('images', function() {
	gulp.src(sourcesPaths.images.base).pipe(gulp.dest(pathNames.targetUrl)).pipe($.size({
		title : 'Images'
	}));
});

gulp.task('fonts', function() {
	gulp.src(sourcesPaths.fonts.base).pipe(gulp.dest(targetPaths.fonts)).pipe($.size({
		title : 'Fonts'
	}));
});

/**
 * Install or Update Bower Components.
 */
gulp.task('init-bower', function() {
	return $.bower({
		analytics : false,
		cmd : 'update',
		directory : pathNames.bowerLib
	});
});

gulp.task('doNothing', function() {
	return null;
});

// Copy Bower Assets
gulp.task('copy-bower', [ 'init-bower' ], function() {
	var bcssStream, bjsStream, bFontsStream, bootFontsStream, bootImagesStream;

	bcssStream = minifyCss(gulp.src(sourcesPaths.styles.bower)).pipe(gulp.dest(targetPaths.styles)).pipe($.size({
		title : 'Bower CSS'
	}));
	bjsStream = gulp.src(sourcesPaths.scripts.bower).pipe(gulp.dest(path.join(targetPaths.scripts, 'lib'))).pipe($.size({
		title : 'Bower JS'
	}));
	bFontsStream = gulp.src(sourcesPaths.fonts.bower).pipe($.flatten()).pipe(gulp.dest(targetPaths.fonts)).pipe($.size({
		title : 'Bower Fonts'
	}));
	/* Copy Bootstrap Fonts Into images/bootstrap */
	bootImagesStream = gulp.src(sourcesPaths.images.bootstrap).pipe($.flatten({
		newPath : 'bootstrap'
	})).pipe(gulp.dest(targetPaths.images)).pipe($.size({
		title : 'Bootstrap Images'
	}));

	return mergeStream(bcssStream, bjsStream, bFontsStream, bootImagesStream);
});

gulp.task('clean', function() {
	return gulp.src(path.join(pathNames.targetUrl, '*'), {
		read : false
	}).pipe($.clean({
		force : true
	}));
});

gulp.task('clean-j2ee', function() {
	return gulp.src(path.join(targetPaths.j2eeBower, '*'), {
		read : false
	}).pipe($.clean({
		force : true
	}));
});

gulp.task('copy-bower-into-j2ee', [ 'init-bower', 'clean-j2ee' ], function() {
	gulp.src(sourcesPaths.styles.bower).pipe(gulp.dest(targetPaths.j2eeBower));
	gulp.src(sourcesPaths.styles.bootstrap).pipe(gulp.dest(targetPaths.j2eeBower));
	gulp.src(sourcesPaths.scripts.bower).pipe(gulp.dest(targetPaths.j2eeBower));
	gulp.src(sourcesPaths.fonts.bower).pipe(gulp.dest(targetPaths.j2eeBower));
	gulp.src(sourcesPaths.fonts.bootstrap).pipe(gulp.dest(targetPaths.j2eeBower));
});

gulp.task('watch', function(next) {
	gulp.watch([ sourcesPaths.styles.base, sourcesPaths.styles.sass ], [ 'styles' ]);
	gulp.watch(sourcesPaths.scripts.base, [ 'scripts' ]);
	gulp.watch(sourcesPaths.images.base, [ 'images' ]);
	gulp.watch(sourcesPaths.war, [ 'war' ]);
	gulp.watch('bower.json', [ 'copy-bower' ]);
});

// DEFAULT GULP TASK
gulp.task('default', function() {
	console.log('Build ' + (isNotS ? 'DEV' : 'STATIC'));
	var tasks = [ 'copy-bower', 'images', 'fonts', 'styles', 'optimization' ];
	
	if(!isNotS) {
		tasks.push('war');
	}
	gulp.start(tasks);
});

gulp.task('test', [ 'init-bower' ], function() {
	console.log('Build ' + (isNotS ? 'DEV' : 'STATIC'));
	var tasks = [ 'copy-bower', 'images', 'fonts', 'styles', 'scripts', 'watch' ];
	
	if(!isNotS) {
		tasks.push('war');
	}
	gulp.start(tasks);
});

function minifyCss(src) {
	return src.pipe($.minifyCss({
		keepSpecialComments : 0,
		processImport : false
	}));
}

function sassBootstrap() {
	return minifyCss(gulp.src(sourcesPaths.styles.sass).pipe($.sass({
		outputStyle : 'compact',
		precision : 8
	})).pipe($.autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))).pipe(gulp.dest(targetPaths.styles)).pipe($.size({
		title : 'Styles Sass'
	}));
}