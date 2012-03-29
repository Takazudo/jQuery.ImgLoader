/**
 * uglify
 * UglifyJS: https://github.com/mishoo/UglifyJS
 */
module.exports = function(grunt){
  
  var log = grunt.log;

  // Nodejs libs.
  var proc = require('child_process');

  grunt.registerMultiTask('uglify', 'uglify', function() {
    var done = this.async();
    var src = this.file.src;
    var dest = this.file.dest;
    var command = 'uglifyjs -o ' + dest + ' ' + src;
    var out = proc.exec(command, function(err, sout, serr){
      log.writeln('uglified.');
      done(true);
    });
  });

};
