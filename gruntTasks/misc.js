/**
 * misc
 * growlnotify: http://growl.info/extras.php#growlnotify
 */
module.exports = function(grunt){
  
  var log = grunt.log;

  // Nodejs libs.
  var proc = require('child_process');

  grunt.registerTask('notifyOK', 'done!', function(){
    proc.exec("growlnotify -t 'grunt.js' -m '＼(^o^)／'");
  });

};
