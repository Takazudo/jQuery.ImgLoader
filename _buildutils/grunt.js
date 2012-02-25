// https://github.com/cowboy/grunt

var proc = require('child_process');

config.init({
  pkg: '<json:package.json>',
  meta: {
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      ' <%= template.today("m/d/yyyy") %>\n' +
      ' <%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
      ' * Copyright (c) <%= template.today("yyyy") %> <%= pkg.author.name %>;' +
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
    tasks: 'coffee min concat notifyOK'
  },
  min: {
    '../jquery.imgloader.min.js': [ '<banner>', '../jquery.imgloader.js' ]
  },
  coffee: {
    '../jquery.imgloader.js': [ '../jquery.imgloader.coffee' ],
    '../demo2/script.js': [ '../demo2/script.coffee' ],
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

task.registerTask('default', 'coffee min concat notifyOK');
