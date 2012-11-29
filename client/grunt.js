/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    lint: {
      files: ['grunt.js', 'src/tooltip.js', 'src/bubblechart.js', 'src/vis.js']
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', 'src/tooltip.js', 'src/bubblechart.js', 'src/vis.js'],
        dest: 'dist/bp_bubblechart.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', 'dist/bp_bubblechart.js'],
        dest: 'dist/bp_bubblechart.min.js'
      }
    },
    mincss: {
      compress: {
        files: {
          "dist/bp_bubblechart.css": ["styles.css"]
        }
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {}
    },
    uglify: {}
  });

  grunt.loadNpmTasks('grunt-contrib-mincss');

  // Default task.
  grunt.registerTask('default', 'lint concat min mincss');
};
