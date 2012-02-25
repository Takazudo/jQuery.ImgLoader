// https://github.com/cowboy/grunt

var proc = require('child_process');

config.init({
  watch: {
    files: [
      '../*.coffee',
      '../qunit/test.coffee'
    ],
    tasks: 'coffee min notifyOK'
  },
  min: {
    '../jquery.imgloader.min.js': [ '../jquery.imgloader.js' ]
  },
  coffee: {
    '../jquery.imgloader.js': [ '../jquery.imgloader.coffee' ],
    '../demo.js': [ '../demo.coffee' ],
    '../qunit/test.js': [ '../qunit/test.coffee' ]
  }
});

task.registerBasicTask('coffee', 'compile CoffeeScripts', function(data, name) {
  var done = this.async();
  var command = 'coffee -j ' + name + ' -c ' + data.join(' ');
  proc.exec(command, function(err, sout, serr){
    if(serr){
      proc.exec("growlnotify -t 'COFFEE COMPILE ERROR!' -m '" + serr + "'");
      done(false);
    }else{
      done(true);
    }
  });
});

task.registerTask('notifyOK', 'done!', function(){
  proc.exec("growlnotify -t 'grunt.js' -m '＼(^o^)／'");
});

task.registerTask('default', 'coffee min notifyOK');
