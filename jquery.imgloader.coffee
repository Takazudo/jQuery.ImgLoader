(($, win, doc) ->

  ns = $.ImgLoaderNs = {}
  ns.support = {}
  ns.support.xhr2 = win.FormData? # from Modernizr

  # ============================================================
  # utility
  # http://msdn.microsoft.com/ja-jp/scriptjunkie/gg723713.aspx
  # by caching deferreds, 'fetchImg' does not throw multiple request about one src
  # to wait the first img's loading.

  ns.createCachedFunction = (requestedFunction) ->
    cache = {}
    (key, options) ->
      if(!cache[key])
        cache[key] = $.Deferred (defer) ->
          requestedFunction defer, key, options
        .promise()
      cache[key]

  ns.fetchImg = ns.createCachedFunction (defer, src, options) ->
    img = new Image
    cleanUp = -> img.onload = img.onerror = null
    defer.always cleanUp
    $img = $(img)
    img.onload = -> defer.resolve $img
    img.onerror = -> defer.reject $img
    if ns.support.xhr2 and options?.useXHR2
      xhr = new ns.Xhr2Request src, { timeout: options.timeout }
      defer.xhr = xhr
      xhr.on 'progress', ->
        defer.notify xhr.currentLoadedInfo()
      xhr.on 'loadend timeout', ->
        img.src = src
      xhr.send()
    else
      img.src = src

  do ->
    # 'loadImg' returns the load-completed img in stash.
    # then put cloned img into the stash back for future use.
    # it must be load-completed on the next time
    cache = {} # $img stash
    ns.loadImg = (src, useXHR2, timeout) ->
      $.Deferred (defer) ->
        (ns.fetchImg src, { useXHR2: useXHR2, timeout: timeout })
        .progress (loadedInfo) ->
          defer.notify loadedInfo
        .then ($img) ->
          if(!cache[src]) then cache[src] = $img
          $cachedImg = cache[src]
          $cloned = $cachedImg.clone()
          cache[src] = $cloned
          defer.resolve $cachedImg
        , ($img) ->
          defer.reject $img
      .promise()

  # setTimeout wrapper
  wait = (time) ->
    $.Deferred (defer) ->
      setTimeout ->
        defer.resolve()
      , time

  # ============================================================
  # event module

  class ns.Event
    constructor: ->
      @_callbacks = {}

    on: (ev, callback) ->
      evs = ev.split(' ')
      for name in evs
        @_callbacks[name] or= []
        @_callbacks[name].push(callback)
      @

    one: (ev, callback) ->
      @on ev, ->
        @off(ev, arguments.callee)
        callback.apply(@, arguments)

    trigger: (args...) ->
      ev = args.shift()
      list = @_callbacks?[ev]
      return unless list
      for callback in list
        if callback.apply(@, args) is false
          break
      @

    off: (ev, callback) ->
      unless ev
        @_callbacks = {}
        return @

      list = @_callbacks?[ev]
      return this unless list

      unless callback
        delete @_callbacks[ev]
        return this

      for cb, i in list when cb is callback
        list = list.slice()
        list.splice(i, 1)
        @_callbacks[ev] = list
        break
      @

    bind: -> @on.apply @, arguments
    unbind: -> @off.apply @, arguments

  # ============================================================
  # xhr2 wrapper class
  
  class ns.Xhr2Request extends ns.Event

    constructor: (@url, options) ->
      super
      @options = $.extend
        timeout: 10000
      , options
      @_prepare()

    _prepare: ->

      gotAnyProgress = false

      @_request = new XMLHttpRequest
      @_request.open('GET', @url)
      @_request.timeout = @options.timeout

      @_request.onloadend = =>
        @trigger 'loadend'

      @_request.onprogress = (e) =>
        unless gotAnyProgress
          gotAnyProgress = true
          @totalSize = e.totalSize
          @trigger 'firstprogress'
        @loadedSize = e.loaded
        @loadedRatio = @loadedSize / @totalSize
        @trigger 'progress'

      @_request.ontimeout = => @options.timeout
      @

    currentLoadedInfo: ->
      {
        totalSize: @totalSize
        loadedSize: @loadedSize
        loadedRatio: @loadedRatio
      }

    send: ->
      @_request.send()
      @


  # ============================================================
  # item class

  class ns.LoaderItem extends ns.Event

    constructor: (@src, @_useXHR2=true, @_timeout=10000) ->
      super

    load: ->
      $.Deferred (defer) =>
        (ns.loadImg @src, @_useXHR2, @_timeout)
        .progress (loadedInfo) =>
          @trigger 'progress', loadedInfo
        .then ($img) =>
          @$img = $img
          @trigger 'success', @$img
          @trigger 'complete', @$img
          defer.resolve @$img
        , ($img) =>
          @$img = $img
          @trigger 'error', @$img
          @trigger 'complete', @$img
          defer.reject @$img

  # ============================================================
  # item load organizers
  
  class ns.AbstractLoader extends ns.Event
    
    constructor: ->
      super

    _prepareProgressInfo: ->
      items = @items or @_presets
      l = items.length
      @progressInfo = p =
        loadedFileCount: 0
        totalFileCount: l
        loadedRatio: 0
      @ratioPerItem = 1 / l
      @

    _updateProgressInfo: (item, itemLoadedInfo) ->
      p = @progressInfo
      itemCurrentLoadedRatio = itemLoadedInfo.loadedRatio * @ratioPerItem
      p.loadedRatio = p.loadedRatio + itemCurrentLoadedRatio - (item.lastLoadedRatio or 0)
      if p.loadedRatio > 1
        p.loadedRatio = 1
      item.lastLoadedRatio = itemCurrentLoadedRatio
      @

  class ns.BasicLoader extends ns.AbstractLoader

    constructor: (@_useXHR2 = true, @_timeout = 10000) ->
      super
      @items = []

    add: (loaderItem) ->
      if ($.type loaderItem) is 'string'
        src = loaderItem
        loaderItem = new ns.LoaderItem src, @_useXHR2, @_timeout
      @items.push loaderItem
      loaderItem

    load: ->

      @_prepareProgressInfo()
      p = @progressInfo

      loadDeferreds = $.map @items, (item) =>

        item.on 'progress', (loadedInfo) =>
          @_updateProgressInfo item, loadedInfo
          @trigger 'progress', p

        item.on 'complete', ($img) =>
          p.loadedFileCount += 1
          unless ns.support.xhr2 and @_useXHR2
            p.loadedRatio = p.loadedFileCount / p.totalFileCount
            @trigger 'progress', p
          @trigger 'itemload', $img, p

        item.load()

      $.Deferred (defer) =>
        ($.when.apply @, loadDeferreds).always (imgs...) =>
          $imgs = $(imgs)
          p.loadedRatio = 1
          @trigger 'progress', p 
          @trigger 'allload', $imgs, p
          defer.resolve $imgs, p
      .promise()

    kill: ->
      for item in @items
        item.off()
      @trigger 'kill'
      @off()
      @

  class ns.ChainLoader extends ns.AbstractLoader

    constructor: (@_pipesize, @_delay=0, @_useXHR2, @_timeout) ->
      super
      @_presets = []
      @_inLoadCount = 0
      @_allDoneDefer = $.Deferred()

    _finished: -> @progressInfo.loadedFileCount is @_presets.length
    _nextLoadAllowed: -> (@_inLoadCount < @_pipesize)
    _getImgs: ->
      $($.map @_presets, (preset) -> preset.item.$img)

    _handleNext: ->

      p = @progressInfo

      if @_finished()
        if @_allloadFired then return @
        @_allloadFired = true
        $imgs = @_getImgs()
        @trigger 'progress', p 
        @trigger 'allload', $imgs, p
        @_allDoneDefer.resolve($imgs)
        return @

      $.each @_presets, (i, preset) =>
        
        item = preset.item

        if preset.started then return true
        if not @_nextLoadAllowed() then return false

        @_inLoadCount += 1
        preset.started = true
        
        item.on 'progress', (loadedInfo) =>
          @_updateProgressInfo item, loadedInfo
          @trigger 'progress', p

        item.on 'complete', ($img) =>
          preset.done = true
          done = =>
            p.loadedFileCount += 1
            @_inLoadCount -= 1
            unless ns.support.xhr2 and @_useXHR2
              p.loadedRatio = p.loadedFileCount / p.totalFileCount
              @trigger 'progress', p
            @trigger 'itemload', $img, p
            preset.defer.resolve $img
            (wait @_delay).done => @_handleNext()
          if(i is 0)
            done()
          else
            # invoke done if previous item was complete
            @_presets[i-1].defer.always -> done()

        item.load()
      @

    add: (loaderItem) ->
      if ($.type loaderItem) is 'string'
        src = loaderItem
        loaderItem = new ns.LoaderItem src, @_useXHR2, @_timeout
      preset =
        item:loaderItem
        done:false,
        started: false
        defer: $.Deferred()
      @_presets.push preset
      preset.defer

    load: ->
      @_prepareProgressInfo()
      @_handleNext()
      @_allDoneDefer

    kill: ->
      for preset in @_presets
        preset.item.off()
      @trigger 'kill'
      @off()
      @

  # ============================================================
  # facade

  class ns.LoaderFacade
    
    # bind methods to loader
    methods = [ 'bind', 'trigger', 'on', 'off', 'load', 'one', 'unbind', 'add', 'kill' ]
    for method in methods
      do (method) =>
        @::[method] = (args...) -> @loader[method].apply @loader, args

    constructor: (options) ->

      # handle without new call
      if not (@ instanceof arguments.callee)
        return new ns.LoaderFacade(options)

      @options = o = $.extend
        srcs: []
        pipesize: 0
        delay: 100
        timeout: 10000
        useXHR2: true
      , options

      if o.pipesize
        @loader = new ns.ChainLoader o.pipesize, o.delay, o.useXHR2, o.timeout
      else
        @loader = new ns.BasicLoader o.useXHR2, o.timeout
      for src in o.srcs
        @loader.add src

  # ============================================================
  # calcNaturalWH

  do ->

    cache = {} # cache caliculation result

    # prepare holder to caliculation
    $holder = null

    $holderSetup = ->
      $.Deferred (defer) ->
        $ ->
          $holder = $('<div id="calcNaturalWH-tempholder"></div>').css
            position: 'absolute'
            left: '-9999px'
            top: '-9999px'
          $('body').append $holder
          defer.resolve()
      .promise()

    naturalWHDetectable = (img) ->
      if(
        (not img.naturalWidth?) or
        (img.naturalWidth is 0) or
        (not img.naturalHeight?) or
        (img.naturalHeight is 0)
      )
        false
      else
        true

    # try caliculation 10 times if failed.
    # I don't know why but this caliculation fails sometimes.
    # delaying caliculation works well against this
    tryCalc = ($img, src) ->

      $img = $img.clone() # to avoid test style applied here
      img = $img[0]

      $.Deferred (defer) ->

        res = {}

        # prepare elements
        $img.css(width: 'auto', height: 'auto')
        $div = $('<div></div>').append($img)
        $holder.append $div

        count = 0
        oneTry = ->
          res.width = img.naturalWidth or $img.width()
          res.height = img.naturalHeight or $img.height()
          if(count > 10)
            $div.remove()
            defer.reject()
          else
            if (!res.width or !res.height)
              count++
              (wait 100).done -> oneTry()
            else
              cache[src]
              $div.remove()
              defer.resolve res

        oneTry()

      .promise()

    # main
    ns.calcNaturalWH = ns.createCachedFunction (defer, src) ->
      (ns.loadImg src).then ($img) ->
        img = $img[0]
        if not (naturalWHDetectable img)
          $holderSetup().done ->
            (tryCalc $img, src).then (wh) ->
              defer.resolve wh, $img
            , ->
              defer.reject()
        else
          wh =
            width: img.naturalWidth
            height: img.naturalHeight
          cache[src] = wh
          defer.resolve wh, $img
      , ->
        defer.reject()

  # ============================================================
  # globalify

  $.loadImg = ns.loadImg
  $.ImgLoader = ns.LoaderFacade
  $.calcNaturalWH = ns.calcNaturalWH

) jQuery, @, @document
