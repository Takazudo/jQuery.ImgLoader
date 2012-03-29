/**
 * grunt
 * This compiles coffee to js
 *
 * grunt: https://github.com/cowboy/grunt
 */
module.exports = function(grunt){

  grunt.initConfig({
    pkg: '<json:info.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        ' <%= grunt.template.today("m/d/yyyy") %>\n' +
        ' <%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      '../jquery.imgloader.js': [ '<banner>', '../jquery.imgloader.js' ]
    },
    watch: {
      files: [
        '../*.coffee',
        '../demo2/script.coffee',
        '../qunit/test.coffee'
      ],
      tasks: 'coffee concat notifyOK'
    },
    uglify: {
      '../jquery.imgloader.min.js': '../jquery.imgloader.js'
    },
    coffee: {
      '../jquery.imgloader.js': [ '../jquery.imgloader.coffee' ],
      '../demo2/script.js': [ '../demo2/script.coffee' ],
      '../qunit/test.js': [ '../qunit/test.coffee' ]
    }
  });

  grunt.loadTasks('tasks');
  grunt.registerTask('default', 'coffee concat notifyOK');

};
