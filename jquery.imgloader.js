/*! jQuery.ImgLoader - v0.1.0 -  3/29/2012
 * https://github.com/Takazudo/jQuery.ImgLoader
 * Copyright (c) 2012 "Takazudo" Takeshi Takatsudo; Licensed MIT */

(function() {
  var __slice = Array.prototype.slice,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  (function($, win, doc) {
    var ns, wait;
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
      var $img, cleanUp, img;
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
          return (ns.loadImg(_this.src)).pipe(function($img) {
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
        return loaderItem;
      };

      BasicLoader.prototype.load = function() {
        var count, laodDeferreds,
          _this = this;
        count = 0;
        laodDeferreds = $.map(this.items, function(item) {
          return item.bind('complete', function($img) {
            _this.trigger('itemload', $img, count);
            return count++;
          }).load();
        });
        return $.Deferred(function(defer) {
          return ($.when.apply(_this, laodDeferreds)).always(function() {
            var $imgs, imgs;
            imgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            $imgs = $(imgs);
            _this.trigger('allload', $imgs);
            return defer.resolve($imgs);
          });
        });
      };

      BasicLoader.prototype.kill = function() {
        $.each(this.items, function(i, item) {
          return item.unbind();
        });
        this.trigger('kill');
        this.unbind();
        return this;
      };

      return BasicLoader;

    })(ns.Event);
    ns.ChainLoader = (function(_super) {

      __extends(ChainLoader, _super);

      function ChainLoader(_pipesize, _delay) {
        this._pipesize = _pipesize;
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
        return this._inLoadCount < this._pipesize;
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
          if (this._allloadFired) return this;
          this._allloadFired = true;
          $imgs = this._getImgs();
          this.trigger('allload', $imgs);
          this._allDoneDefer.resolve($imgs);
          return this;
        }
        $.each(this._presets, function(i, preset) {
          if (preset.started) return true;
          if (!_this._nextLoadAllowed()) return false;
          _this._inLoadCount++;
          preset.started = true;
          preset.item.one('complete', function($img) {
            preset.done = true;
            return setTimeout(function() {
              var done;
              done = function() {
                _this.trigger('itemload', $img, _this._doneCount);
                _this._inLoadCount--;
                _this._doneCount++;
                preset.defer.resolve($img);
                return _this._handleNext();
              };
              if (i === 0) {
                return done();
              } else {
                return _this._presets[i - 1].defer.always(function() {
                  return done();
                });
              }
            }, _this._delay);
          });
          return preset.item.load();
        });
        return this;
      };

      ChainLoader.prototype.add = function(loaderItem) {
        var preset, src;
        if (($.type(loaderItem)) === 'string') {
          src = loaderItem;
          loaderItem = new ns.LoaderItem(src);
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
        this._handleNext();
        return this._allDoneDefer;
      };

      ChainLoader.prototype.kill = function() {
        $.each(this._presets, function(i, preset) {
          return preset.item.unbind();
        });
        this.trigger('kill');
        this.unbind();
        return this;
      };

      return ChainLoader;

    })(ns.Event);
    ns.LoaderFacade = (function() {
      var methods,
        _this = this;

      methods = ['bind', 'trigger', 'load', 'one', 'unbind', 'add', 'kill'];

      $.each(methods, function(i, method) {
        return LoaderFacade.prototype[method] = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return this.loader[method].apply(this.loader, args);
        };
      });

      function LoaderFacade(options) {
        var o,
          _this = this;
        if (!(this instanceof arguments.callee)) {
          return new ns.LoaderFacade(options);
        }
        this.options = o = $.extend({
          srcs: [],
          pipesize: 0,
          delay: 100
        }, options);
        if (o.pipesize) {
          this.loader = new ns.ChainLoader(o.pipesize, o.delay);
        } else {
          this.loader = new ns.BasicLoader;
        }
        $.each(o.srcs, function(i, src) {
          return _this.loader.add(new ns.LoaderItem(src));
        });
      }

      return LoaderFacade;

    }).call(this);
    (function() {
      var $holder, $holderSetup, cache, naturalWHDetectable, tryCalc;
      cache = {};
      $holder = null;
      $holderSetup = function() {
        return $.Deferred(function(defer) {
          return $(function() {
            $holder = $('<div id="calcNaturalWH-tempholder"></div>').css({
              position: 'absolute',
              left: '-9999px',
              top: '-9999px'
            });
            $('body').append($holder);
            return defer.resolve();
          });
        }).promise();
      };
      naturalWHDetectable = function(img) {
        if ((img.naturalWidth === void 0) || (img.naturalWidth === 0) || (img.naturalHeight === void 0) || (img.naturalHeight === 0)) {
          return false;
        } else {
          return true;
        }
      };
      tryCalc = function($img, src) {
        var img;
        $img = $img.clone();
        img = $img[0];
        return $.Deferred(function(defer) {
          var $div, count, oneTry, res;
          res = {};
          $img.css({
            width: 'auto',
            height: 'auto'
          });
          $div = $('<div></div>').append($img);
          $holder.append($div);
          count = 0;
          oneTry = function() {
            res.width = img.naturalWidth || $img.width();
            res.height = img.naturalHeight || $img.height();
            if (count > 10) {
              $div.remove();
              return defer.reject();
            } else {
              if (!res.width || !res.height) {
                count++;
                return (wait(100)).done(function() {
                  return oneTry();
                });
              } else {
                cache[src];
                $div.remove();
                return defer.resolve(res);
              }
            }
          };
          return oneTry();
        }).promise();
      };
      return ns.calcNaturalWH = ns.createCachedFunction(function(defer, src) {
        return (ns.loadImg(src)).then(function($img) {
          var img, wh;
          img = $img[0];
          if (!(naturalWHDetectable(img))) {
            return $holderSetup().done(function() {
              return (tryCalc($img, src)).then(function(wh) {
                return defer.resolve(wh, $img);
              }, function() {
                return defer.reject();
              });
            });
          } else {
            wh = {
              width: img.naturalWidth,
              height: img.naturalHeight
            };
            cache[src] = wh;
            return defer.resolve(wh, $img);
          }
        }, function() {
          return defer.reject();
        });
      });
    })();
    $.loadImg = ns.loadImg;
    $.ImgLoader = ns.LoaderFacade;
    return $.calcNaturalWH = ns.calcNaturalWH;
  })(jQuery, this, this.document);

}).call(this);
