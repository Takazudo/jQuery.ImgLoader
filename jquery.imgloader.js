(function() {
  var ns,
    __slice = Array.prototype.slice,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  ns = $.ImgLoaderNs = {};

  ns.createCachedFunction = function(requestedFunction) {
    var cache;
    cache = {};
    return function(key) {
      if (!cache[key]) {
        cache[key] = $.Deferred(function(defer) {
          return requestedFunction(defer, key);
        }).promise();
      }
      return cache[key];
    };
  };

  ns.fetchImg = ns.createCachedFunction(function(defer, src) {
    var cleanUp, img;
    img = new Image;
    cleanUp = function() {
      return img.onload = img.onerror = null;
    };
    defer.always(cleanUp);
    img.onload = function() {
      return defer.resolve($(img));
    };
    img.onerror = function() {
      return defer.reject({
        msg: 'img load failed'
      });
    };
    return img.src = src;
  });

  (function() {
    var cache;
    cache = {};
    return ns.loadImg = function(src) {
      return $.Deferred(function(defer) {
        return (ns.fetchImg(src)).then(function($img) {
          var $cachedImg, $cloned;
          if (!cache[src]) cache[src] = $img;
          $cachedImg = cache[src];
          $cloned = $cachedImg.clone();
          cache[src] = $cloned;
          return defer.resolve($cachedImg);
        }, function(error) {
          return defer.reject(error);
        });
      }).promise();
    };
  })();

  ns.Event = (function() {

    function Event() {
      this._callbacks = {};
    }

    Event.prototype.bind = function(ev, callback) {
      var evs, name, _base, _i, _len;
      evs = ev.split(' ');
      for (_i = 0, _len = evs.length; _i < _len; _i++) {
        name = evs[_i];
        (_base = this._callbacks)[name] || (_base[name] = []);
        this._callbacks[name].push(callback);
      }
      return this;
    };

    Event.prototype.one = function(ev, callback) {
      return this.bind(ev, function() {
        this.unbind(ev, arguments.callee);
        return callback.apply(this, arguments);
      });
    };

    Event.prototype.trigger = function() {
      var args, callback, ev, list, _i, _len, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      ev = args.shift();
      list = (_ref = this._callbacks) != null ? _ref[ev] : void 0;
      if (!list) return;
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        callback = list[_i];
        if (callback.apply(this, args) === false) break;
      }
      return this;
    };

    Event.prototype.unbind = function(ev, callback) {
      var cb, i, list, _len, _ref;
      if (!ev) {
        this._callbacks = {};
        return this;
      }
      list = (_ref = this._callbacks) != null ? _ref[ev] : void 0;
      if (!list) return this;
      if (!callback) {
        delete this._callbacks[ev];
        return this;
      }
      for (i = 0, _len = list.length; i < _len; i++) {
        cb = list[i];
        if (!(cb === callback)) continue;
        list = list.slice();
        list.splice(i, 1);
        this._callbacks[ev] = list;
        break;
      }
      return this;
    };

    return Event;

  })();

  ns.LoaderItem = (function(_super) {

    __extends(LoaderItem, _super);

    function LoaderItem(src) {
      this.src = src;
      LoaderItem.__super__.constructor.apply(this, arguments);
    }

    LoaderItem.prototype.load = function() {
      var _this = this;
      return $.Deferred(function(defer) {
        return (ns.loadImg(_this.src)).done(function($img) {
          _this.$img = $img;
          _this.trigger('load', $img);
          return defer.resolve($img);
        });
      }).promise();
    };

    return LoaderItem;

  })(ns.Event);

  ns.BasicLoader = (function(_super) {

    __extends(BasicLoader, _super);

    function BasicLoader() {
      BasicLoader.__super__.constructor.apply(this, arguments);
      this.items = [];
    }

    BasicLoader.prototype.add = function(loaderItem) {
      var src;
      if (($.type(loaderItem)) === 'string') {
        src = loaderItem;
        loaderItem = new ns.LoaderItem(src);
      }
      this.items.push(loaderItem);
      return this;
    };

    BasicLoader.prototype.load = function() {
      var count, laodDeferreds,
        _this = this;
      count = 0;
      laodDeferreds = $.map(this.items, function(item) {
        return item.bind('load', function($img) {
          _this.trigger('itemload', $img, count);
          return count++;
        }).load();
      });
      return $.Deferred(function(defer) {
        return ($.when.apply(_this, laodDeferreds)).done(function() {
          var $imgs, imgs;
          imgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          $imgs = $(imgs);
          _this.trigger('allload', $imgs);
          return defer.resolve($imgs);
        });
      });
    };

    return BasicLoader;

  })(ns.Event);

  ns.ChainLoader = (function(_super) {

    __extends(ChainLoader, _super);

    function ChainLoader(_chainsize, _delay) {
      this._chainsize = _chainsize;
      this._delay = _delay != null ? _delay : 0;
      ChainLoader.__super__.constructor.apply(this, arguments);
      this._presets = [];
      this._doneCount = 0;
      this._inLoadCount = 0;
      this._allDoneDefer = $.Deferred();
    }

    ChainLoader.prototype._finished = function() {
      return this._doneCount === this._presets.length;
    };

    ChainLoader.prototype._nextLoadAllowed = function() {
      return this._inLoadCount < this._chainsize;
    };

    ChainLoader.prototype._getImgs = function() {
      return $($.map(this._presets, function(preset) {
        return preset.item.$img;
      }));
    };

    ChainLoader.prototype._handleNext = function() {
      var $imgs,
        _this = this;
      if (this._finished()) {
        $imgs = this._getImgs();
        this.trigger('allload', $imgs);
        this._allDoneDefer.resolve($imgs);
        this;
      }
      $.each(this._presets, function(i, preset) {
        if (preset.started) return true;
        if (!_this._nextLoadAllowed()) return false;
        _this._inLoadCount++;
        preset.started = true;
        return preset.item.load().always(function($img) {
          preset.done = true;
          return setTimeout(function() {
            var done;
            done = function() {
              _this.trigger('itemload', $img, _this._doneCount);
              _this._inLoadCount--;
              _this._doneCount++;
              preset.defer.resolve();
              return _this._handleNext();
            };
            if (i === 0) {
              return done();
            } else {
              return _this._presets[i - 1].defer.done(function() {
                return done();
              });
            }
          }, _this._delay);
        });
      });
      return this;
    };

    ChainLoader.prototype.add = function(loaderItem) {
      var src;
      if (($.type(loaderItem)) === 'string') {
        src = loaderItem;
        loaderItem = new ns.LoaderItem(src);
      }
      this._presets.push({
        item: loaderItem,
        done: false,
        started: false,
        defer: $.Deferred()
      });
      return this;
    };

    ChainLoader.prototype.load = function() {
      this._handleNext();
      return this._allDoneDefer;
    };

    return ChainLoader;

  })(ns.Event);

  ns.Facade = (function() {
    var _this = this;

    (function() {
      var methods;
      methods = ['bind', 'trigger', 'load', 'one', 'unbind', 'add'];
      return $.each(methods, function(i, method) {
        return Facade.prototype[method] = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return this.loader[method].apply(this.loader, args);
        };
      });
    })();

    function Facade(_srcs, options) {
      var o,
        _this = this;
      this._srcs = _srcs;
      if (!(this instanceof arguments.callee)) {
        return new ns.Facade(_srcs, options);
      }
      this.options = o = $.extend({
        chainsize: 0,
        delay: 100
      }, options);
      if (o.chainsize) {
        this.loader = new ns.ChainLoader(o.chainsize, o.delay);
      } else {
        this.loader = new ns.BasicLoader;
      }
      $.each(this._srcs, function(i, src) {
        return _this.loader.add(new ns.LoaderItem(src));
      });
    }

    return Facade;

  }).call(this);

  $.loadImg = ns.loadImg;

  $.ImgLoader = ns.Facade;

}).call(this);
