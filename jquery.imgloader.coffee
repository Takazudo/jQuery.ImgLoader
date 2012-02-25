ns = $.ImgLoaderNs = {}

# ============================================================
# utility
# http://msdn.microsoft.com/ja-jp/scriptjunkie/gg723713.aspx
# by caching deferreds, 'fetchImg' does not throw multiple request about one src
# to wait the first img's loading.

ns.createCachedFunction = (requestedFunction) ->
  cache = {}
  (key) ->
    if(!cache[key])
      cache[key] = $.Deferred (defer) ->
        requestedFunction defer, key
      .promise()
    cache[key]

ns.fetchImg = ns.createCachedFunction (defer, src) ->
  img = new Image
  cleanUp = -> img.onload = img.onerror = null
  defer.always cleanUp
  $img = $(img)
  img.onload = -> defer.resolve $img
  img.onerror = -> defer.reject $img
  img.src = src

do ->
  # 'loadImg' returns the load-completed img in stash.
  # then put cloned img into the stash back for future use.
  # it must be load-completed on the next time
  cache = {} # $img stash
  ns.loadImg = (src) ->
    $.Deferred (defer) ->
      (ns.fetchImg src).then ($img) ->
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

  bind: (ev, callback) ->
    evs = ev.split(' ')
    for name in evs
      @_callbacks[name] or= []
      @_callbacks[name].push(callback)
    @

  one: (ev, callback) ->
    @bind ev, ->
      @unbind(ev, arguments.callee)
      callback.apply(@, arguments)

  trigger: (args...) ->
    ev = args.shift()
    list = @_callbacks?[ev]
    return unless list
    for callback in list
      if callback.apply(@, args) is false
        break
    @

  unbind: (ev, callback) ->
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

# ============================================================
# item class

class ns.LoaderItem extends ns.Event
  constructor: (@src) ->
    super

  load: ->
    $.Deferred (defer) =>
      (ns.loadImg @src).pipe ($img) =>
        @$img = $img
        @trigger 'success', @$img
        @trigger 'complete', @$img
        defer.resolve @$img
      , ($img) =>
        @$img = $img
        @trigger 'error', @$img
        @trigger 'complete', @$img
        defer.reject @$img
    .promise()

# ============================================================
# item load organizers

class ns.BasicLoader extends ns.Event
  constructor: ->
    super
    @items = []

  add: (loaderItem) ->
    if ($.type loaderItem) is 'string'
      src = loaderItem
      loaderItem = new ns.LoaderItem src
    @items.push loaderItem
    loaderItem

  load: ->
    count = 0
    laodDeferreds = $.map @items, (item) =>
      item.bind 'complete', ($img) =>
        @trigger 'itemload', $img, count
        count++
      .load()
    $.Deferred (defer) =>
      ($.when.apply @, laodDeferreds).always (imgs...) =>
        $imgs = $(imgs)
        @trigger 'allload', $imgs
        defer.resolve $imgs

  kill: ->
    $.each @items, (i, item) ->
      item.unbind()
    @trigger 'kill'
    @unbind()
    @

class ns.ChainLoader extends ns.Event
  constructor: (@_pipesize, @_delay=0) ->
    super
    @_presets = []
    @_doneCount = 0
    @_inLoadCount = 0
    @_allDoneDefer = $.Deferred()

  _finished: -> @_doneCount is @_presets.length
  _nextLoadAllowed: -> (@_inLoadCount < @_pipesize)
  _getImgs: ->
    $($.map @_presets, (preset) -> preset.item.$img)

  _handleNext: ->
    if @_finished()
      if @_allloadFired then return @
      @_allloadFired = true
      $imgs = @_getImgs()
      @trigger 'allload', $imgs
      @_allDoneDefer.resolve($imgs)
      return @
    $.each @_presets, (i, preset) =>
      if preset.started then return true
      if not @_nextLoadAllowed() then return false
      @_inLoadCount++
      preset.started = true
      preset.item.one 'complete', ($img) =>
        preset.done = true
        setTimeout =>
          done = =>
            @trigger 'itemload', $img, @_doneCount
            @_inLoadCount--
            @_doneCount++
            preset.defer.resolve $img
            @_handleNext()
          if(i is 0)
            done()
          else
            @_presets[i-1].defer.always -> done()
        , @_delay
      preset.item.load()
    @

  add: (loaderItem) ->
    if ($.type loaderItem) is 'string'
      src = loaderItem
      loaderItem = new ns.LoaderItem src
    preset =
      item:loaderItem
      done:false,
      started: false
      defer: $.Deferred()
    @_presets.push preset
    preset.defer

  load: ->
    @_handleNext()
    @_allDoneDefer

  kill: ->
    $.each @_presets, (i, preset) ->
      preset.item.unbind()
    @trigger 'kill'
    @unbind()
    @

# ============================================================
# facade

class ns.LoaderFacade
  
  # bind methods to loader
  methods = [ 'bind', 'trigger', 'load', 'one', 'unbind', 'add', 'kill' ]
  $.each methods, (i, method) =>
    @::[method] = (args...) -> @loader[method].apply @loader, args

  constructor: (options) ->

    # handle without new call
    if not (@ instanceof arguments.callee)
      return new ns.LoaderFacade(options)

    @options = o = $.extend(
      srcs: []
      pipesize: 0
      delay: 100
    , options)

    if o.pipesize
      @loader = new ns.ChainLoader o.pipesize, o.delay
    else
      @loader = new ns.BasicLoader
    $.each o.srcs, (i, src) =>
      @loader.add new ns.LoaderItem src

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
      (img.naturalWidth is undefined) or
      (img.naturalWidth is 0) or
      (img.naturalHeight is undefined) or
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
      if naturalWHDetectable img
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
