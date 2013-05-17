/*! jQuery.ImgLoader (https://github.com/Takazudo/jQuery.ImgLoader)
 * lastupdate: 2013-05-17
 * version: 0.5.0
 * author: Takeshi Takatsudo 'Takazudo' <takazudo@gmail.com>
 * License: MIT */
(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function($, win, doc) {
    var ns, wait;
    ns = $.ImgLoaderNs = {};
    ns.support = {};
    ns.support.xhr2 = win.FormData != null;
    ns.createCachedFunction = function(requestedFunction) {
      var cache;
      cache = {};
      return function(key, options) {
        if (!cache[key]) {
          cache[key] = $.Deferred(function(defer) {
            return requestedFunction(defer, key, options);
          }).promise();
        }
        return cache[key];
      };
    };
    ns.fetchImg = ns.createCachedFunction(function(defer, src, options) {
      var $img, cleanUp, img, xhr;
      img = new Image;
      cleanUp = function() {
        return img.onload = img.onerror = null;
      };
      defer.always(cleanUp);
      $img = $(img);
      img.onload = function() {
        return defer.resolve($img);
      };
      img.onerror = function() {
        return defer.reject($img);
      };
      if (ns.support.xhr2 && (options != null ? options.useXHR2 : void 0)) {
        xhr = new ns.Xhr2Request(src, {
          timeout: options.timeout
        });
        defer.xhr = xhr;
        xhr.on('progress', function() {
          return defer.notify(xhr.currentLoadedInfo());
        });
        xhr.on('loadend timeout', function() {
          return img.src = src;
        });
        return xhr.send();
      } else {
        return img.src = src;
      }
    });
    (function() {
      var cache;
      cache = {};
      return ns.loadImg = function(src, useXHR2, timeout) {
        return $.Deferred(function(defer) {
          return (ns.fetchImg(src, {
            useXHR2: useXHR2,
            timeout: timeout
          })).progress(function(loadedInfo) {
            return defer.notify(loadedInfo);
          }).then(function($img) {
            var $cachedImg, $cloned;
            if (!cache[src]) {
              cache[src] = $img;
            }
            $cachedImg = cache[src];
            $cloned = $cachedImg.clone();
            cache[src] = $cloned;
            return defer.resolve($cachedImg);
          }, function($img) {
            return defer.reject($img);
          });
        }).promise();
      };
    })();
    wait = function(time) {
      return $.Deferred(function(defer) {
        return setTimeout(function() {
          return defer.resolve();
        }, time);
      });
    };
    ns.Event = (function() {

      function Event() {
        this._callbacks = {};
      }

      Event.prototype.on = function(ev, callback) {
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
        return this.on(ev, function() {
          this.off(ev, arguments.callee);
          return callback.apply(this, arguments);
        });
      };

      Event.prototype.trigger = function() {
        var args, callback, ev, list, _i, _len, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        ev = args.shift();
        list = (_ref = this._callbacks) != null ? _ref[ev] : void 0;
        if (!list) {
          return;
        }
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          callback = list[_i];
          if (callback.apply(this, args) === false) {
            break;
          }
        }
        return this;
      };

      Event.prototype.off = function(ev, callback) {
        var cb, i, list, _i, _len, _ref;
        if (!ev) {
          this._callbacks = {};
          return this;
        }
        list = (_ref = this._callbacks) != null ? _ref[ev] : void 0;
        if (!list) {
          return this;
        }
        if (!callback) {
          delete this._callbacks[ev];
          return this;
        }
        for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
          cb = list[i];
          if (!(cb === callback)) {
            continue;
          }
          list = list.slice();
          list.splice(i, 1);
          this._callbacks[ev] = list;
          break;
        }
        return this;
      };

      Event.prototype.bind = function() {
        return this.on.apply(this, arguments);
      };

      Event.prototype.unbind = function() {
        return this.off.apply(this, arguments);
      };

      return Event;

    })();
    ns.Xhr2Request = (function(_super) {

      __extends(Xhr2Request, _super);

      function Xhr2Request(url, options) {
        this.url = url;
        Xhr2Request.__super__.constructor.apply(this, arguments);
        this.options = $.extend({
          timeout: 10000
        }, options);
        this._prepare();
      }

      Xhr2Request.prototype._prepare = function() {
        var gotAnyProgress,
          _this = this;
        gotAnyProgress = false;
        this._request = new XMLHttpRequest;
        this._request.open('GET', this.url);
        this._request.timeout = this.options.timeout;
        this._request.onloadend = function() {
          return _this.trigger('loadend');
        };
        this._request.onprogress = function(e) {
          if (!gotAnyProgress) {
            gotAnyProgress = true;
            _this.totalSize = e.totalSize;
            _this.trigger('firstprogress');
          }
          _this.loadedSize = e.loaded;
          _this.loadedRatio = _this.loadedSize / _this.totalSize;
          return _this.trigger('progress');
        };
        this._request.ontimeout = function() {
          return _this.options.timeout;
        };
        return this;
      };

      Xhr2Request.prototype.currentLoadedInfo = function() {
        return {
          totalSize: this.totalSize,
          loadedSize: this.loadedSize,
          loadedRatio: this.loadedRatio
        };
      };

      Xhr2Request.prototype.send = function() {
        this._request.send();
        return this;
      };

      return Xhr2Request;

    })(ns.Event);
    ns.LoaderItem = (function(_super) {

      __extends(LoaderItem, _super);

      function LoaderItem(src, _useXHR2, _timeout) {
        this.src = src;
        this._useXHR2 = _useXHR2 != null ? _useXHR2 : true;
        this._timeout = _timeout != null ? _timeout : 10000;
        LoaderItem.__super__.constructor.apply(this, arguments);
      }

      LoaderItem.prototype.load = function() {
        var _this = this;
        return $.Deferred(function(defer) {
          return (ns.loadImg(_this.src, _this._useXHR2, _this._timeout)).progress(function(loadedInfo) {
            return _this.trigger('progress', loadedInfo);
          }).then(function($img) {
            _this.$img = $img;
            _this.trigger('success', _this.$img);
            _this.trigger('complete', _this.$img);
            return defer.resolve(_this.$img);
          }, function($img) {
            _this.$img = $img;
            _this.trigger('error', _this.$img);
            _this.trigger('complete', _this.$img);
            return defer.reject(_this.$img);
          });
        });
      };

      return LoaderItem;

    })(ns.Event);
    ns.AbstractLoader = (function(_super) {

      __extends(AbstractLoader, _super);

      function AbstractLoader() {
        AbstractLoader.__super__.constructor.apply(this, arguments);
      }

      AbstractLoader.prototype._prepareProgressInfo = function() {
        var items, l, p;
        items = this.items || this._presets;
        l = items.length;
        this.progressInfo = p = {
          loadedFileCount: 0,
          totalFileCount: l,
          loadedRatio: 0
        };
        this.ratioPerItem = 1 / l;
        return this;
      };

      AbstractLoader.prototype._updateProgressInfo = function(item, itemLoadedInfo) {
        var itemCurrentLoadedRatio, p;
        p = this.progressInfo;
        itemCurrentLoadedRatio = itemLoadedInfo.loadedRatio * this.ratioPerItem;
        p.loadedRatio = p.loadedRatio + itemCurrentLoadedRatio - (item.lastLoadedRatio || 0);
        if (p.loadedRatio > 1) {
          p.loadedRatio = 1;
        }
        item.lastLoadedRatio = itemCurrentLoadedRatio;
        return this;
      };

      return AbstractLoader;

    })(ns.Event);
    ns.BasicLoader = (function(_super) {

      __extends(BasicLoader, _super);

      function BasicLoader(_useXHR2, _timeout) {
        this._useXHR2 = _useXHR2 != null ? _useXHR2 : true;
        this._timeout = _timeout != null ? _timeout : 10000;
        BasicLoader.__super__.constructor.apply(this, arguments);
        this.items = [];
      }

      BasicLoader.prototype.add = function(loaderItem) {
        var src;
        if (($.type(loaderItem)) === 'string') {
          src = loaderItem;
          loaderItem = new ns.LoaderItem(src, this._useXHR2, this._timeout);
        }
        this.items.push(loaderItem);
        return loaderItem;
      };

      BasicLoader.prototype.load = function() {
        var loadDeferreds, p,
          _this = this;
        this._prepareProgressInfo();
        p = this.progressInfo;
        loadDeferreds = $.map(this.items, function(item) {
          item.on('progress', function(loadedInfo) {
            _this._updateProgressInfo(item, loadedInfo);
            return _this.trigger('progress', p);
          });
          item.on('complete', function($img) {
            p.loadedFileCount += 1;
            if (!(ns.support.xhr2 && _this._useXHR2)) {
              p.loadedRatio = p.loadedFileCount / p.totalFileCount;
              _this.trigger('progress', p);
            }
            return _this.trigger('itemload', $img, p);
          });
          return item.load();
        });
        return $.Deferred(function(defer) {
          return ($.when.apply(_this, loadDeferreds)).always(function() {
            var $imgs, imgs;
            imgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            $imgs = $(imgs);
            p.loadedRatio = 1;
            _this.trigger('progress', p);
            _this.trigger('allload', $imgs, p);
            return defer.resolve($imgs, p);
          });
        }).promise();
      };

      BasicLoader.prototype.kill = function() {
        var item, _i, _len, _ref;
        _ref = this.items;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          item.off();
        }
        this.trigger('kill');
        this.off();
        return this;
      };

      return BasicLoader;

    })(ns.AbstractLoader);
    ns.ChainLoader = (function(_super) {

      __extends(ChainLoader, _super);

      function ChainLoader(_pipesize, _delay, _useXHR2, _timeout) {
        this._pipesize = _pipesize;
        this._delay = _delay != null ? _delay : 0;
        this._useXHR2 = _useXHR2;
        this._timeout = _timeout;
        ChainLoader.__super__.constructor.apply(this, arguments);
        this._presets = [];
        this._inLoadCount = 0;
        this._allDoneDefer = $.Deferred();
      }

      ChainLoader.prototype._finished = function() {
        return this.progressInfo.loadedFileCount === this._presets.length;
      };

      ChainLoader.prototype._nextLoadAllowed = function() {
        return this._inLoadCount < this._pipesize;
      };

      ChainLoader.prototype._getImgs = function() {
        return $($.map(this._presets, function(preset) {
          return preset.item.$img;
        }));
      };

      ChainLoader.prototype._handleNext = function() {
        var $imgs, p,
          _this = this;
        p = this.progressInfo;
        if (this._finished()) {
          if (this._allloadFired) {
            return this;
          }
          this._allloadFired = true;
          $imgs = this._getImgs();
          this.trigger('progress', p);
          this.trigger('allload', $imgs, p);
          this._allDoneDefer.resolve($imgs);
          return this;
        }
        $.each(this._presets, function(i, preset) {
          var item;
          item = preset.item;
          if (preset.started) {
            return true;
          }
          if (!_this._nextLoadAllowed()) {
            return false;
          }
          _this._inLoadCount += 1;
          preset.started = true;
          item.on('progress', function(loadedInfo) {
            _this._updateProgressInfo(item, loadedInfo);
            return _this.trigger('progress', p);
          });
          item.on('complete', function($img) {
            var done;
            preset.done = true;
            done = function() {
              p.loadedFileCount += 1;
              _this._inLoadCount -= 1;
              if (!(ns.support.xhr2 && _this._useXHR2)) {
                p.loadedRatio = p.loadedFileCount / p.totalFileCount;
                _this.trigger('progress', p);
              }
              _this.trigger('itemload', $img, p);
              preset.defer.resolve($img);
              return (wait(_this._delay)).done(function() {
                return _this._handleNext();
              });
            };
            if (i === 0) {
              return done();
            } else {
              return _this._presets[i - 1].defer.always(function() {
                return done();
              });
            }
          });
          return item.load();
        });
        return this;
      };

      ChainLoader.prototype.add = function(loaderItem) {
        var preset, src;
        if (($.type(loaderItem)) === 'string') {
          src = loaderItem;
          loaderItem = new ns.LoaderItem(src, this._useXHR2, this._timeout);
        }
        preset = {
          item: loaderItem,
          done: false,
          started: false,
          defer: $.Deferred()
        };
        this._presets.push(preset);
        return preset.defer;
      };

      ChainLoader.prototype.load = function() {
        this._prepareProgressInfo();
        this._handleNext();
        return this._allDoneDefer;
      };

      ChainLoader.prototype.kill = function() {
        var preset, _i, _len, _ref;
        _ref = this._presets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          preset = _ref[_i];
          preset.item.off();
        }
        this.trigger('kill');
        this.off();
        return this;
      };

      return ChainLoader;

    })(ns.AbstractLoader);
    ns.LoaderFacade = (function() {
      var method, methods, _fn, _i, _len,
        _this = this;

      methods = ['bind', 'trigger', 'on', 'off', 'load', 'one', 'unbind', 'add', 'kill'];

      _fn = function(method) {
        return LoaderFacade.prototype[method] = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return this.loader[method].apply(this.loader, args);
        };
      };
      for (_i = 0, _len = methods.length; _i < _len; _i++) {
        method = methods[_i];
        _fn(method);
      }

      function LoaderFacade(options) {
        var o, src, _j, _len1, _ref;
        this.options = o = $.extend({
          srcs: [],
          pipesize: 0,
          delay: 100,
          timeout: 10000,
          useXHR2: false
        }, options);
        if (o.pipesize) {
          this.loader = new ns.ChainLoader(o.pipesize, o.delay, o.useXHR2, o.timeout);
        } else {
          this.loader = new ns.BasicLoader(o.useXHR2, o.timeout);
        }
        _ref = o.srcs;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          src = _ref[_j];
          this.loader.add(src);
        }
      }

      return LoaderFacade;

    }).call(this);
    $.loadImg = ns.loadImg;
    $.ImgLoader = ns.LoaderFacade;
    $.calcNaturalWH = ns.calcNaturalWH;
    return $.calcRectFitImgWH = ns.calcRectFitImgWH;
  })(jQuery, this, this.document);

}).call(this);
