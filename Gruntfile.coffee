module.exports = (grunt) ->

  grunt.task.loadTasks 'gruntcomponents/tasks'
  grunt.task.loadNpmTasks 'grunt-contrib-coffee'
  grunt.task.loadNpmTasks 'grunt-contrib-watch'
  grunt.task.loadNpmTasks 'grunt-contrib-concat'
  grunt.task.loadNpmTasks 'grunt-contrib-uglify'

  grunt.initConfig

    pkg: grunt.file.readJSON('package.json')
    banner: """
/*! <%= pkg.name %> (<%= pkg.repository.url %>)
 * lastupdate: <%= grunt.template.today("yyyy-mm-dd") %>
 * version: <%= pkg.version %>
 * author: <%= pkg.author %>
 * License: MIT */

"""

    growl:
      ok:
        title: 'COMPLETE!!'
        msg: '＼(^o^)／'

    concat:
      banner:
        options:
          banner: '<%= banner %>'
        src: [ '<%= coffee.main.dest %>' ]
        dest: '<%= coffee.main.dest %>'
        
    watch:
      files: ["**/*.coffee"]
      tasks: ["default"]

    uglify:
      options:
        banner: '<%= banner %>'
      main:
        src: "jquery.imgloader.js"
        dest: "jquery.imgloader.min.js"

    coffee:
      main:
        src: ["jquery.imgloader.coffee"]
        dest: "jquery.imgloader.js"
      demo2:
        src: ["demo2/script.coffee"]
        dest: "demo2/script.js"
      test:
        src: ["qunit/test.coffee"]
        dest: "qunit/test.js"

  grunt.registerTask "default", [
    "coffee"
    "concat"
    "uglify"
    "growl"
  ]
