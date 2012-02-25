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
    if ($.type loaderItem) == 'string'
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

  _finished: -> @_doneCount == @_presets.length
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
          if(i==0)
            done()
          else
            @_presets[i-1].defer.always -> done()
        , @_delay
      preset.item.load()
    @

  add: (loaderItem) ->
    if ($.type loaderItem) == 'string'
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

class ns.Facade
  
  # bind methods to loader
  methods = [ 'bind', 'trigger', 'load', 'one', 'unbind', 'add', 'kill' ]
  $.each methods, (i, method) =>
    @::[method] = (args...) -> @loader[method].apply @loader, args

  constructor: (options) ->

    # handle without new call
    if not (@ instanceof arguments.callee)
      return new ns.Facade(options)

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
# globalify

$.loadImg = ns.loadImg
$.ImgLoader = ns.Facade
