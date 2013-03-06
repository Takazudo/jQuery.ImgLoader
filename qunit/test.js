(function() {
  var ns, wait;

  ns = $.ImgLoaderNs;

  wait = function(time) {
    return $.Deferred(function(defer) {
      return setTimeout(function() {
        return defer.resolve();
      }, time || 300);
    });
  };

  asyncTest('Event - bind/trigger', function() {
    var eventer;
    expect(1);
    eventer = new ns.Event;
    eventer.bind('foo', function() {
      ok(true, 'foo event triggered');
      return start();
    });
    return eventer.trigger('foo');
  });

  asyncTest('Event - bind with args', function() {
    var eventer;
    expect(4);
    eventer = new ns.Event;
    eventer.bind('foo', function(arg1, arg2, arg3) {
      ok(true, 'foo event triggered');
      equal(arg1, 1, 'arg was passed');
      equal(arg2, 2, 'arg was passed');
      equal(arg3, 3, 'arg was passed');
      return start();
    });
    return eventer.trigger('foo', 1, 2, 3);
  });

  asyncTest('Event - unbind', function() {
    var eventer;
    expect(1);
    eventer = new ns.Event;
    eventer.bind('foo', function() {
      return ok(false, 'event was fired');
    });
    eventer.unbind('foo');
    eventer.trigger('foo');
    return wait(0).done(function() {
      ok(true, 'event was not fired');
      return start();
    });
  });

  asyncTest('Event - one', function() {
    var eventer;
    expect(1);
    eventer = new ns.Event;
    eventer.one('foo', function() {
      return ok(true, 'event was fired');
    });
    eventer.trigger('foo');
    eventer.trigger('foo');
    eventer.trigger('foo');
    return wait(0).done(function() {
      return start();
    });
  });

  asyncTest('fetchImg - basics', function() {
    expect(4);
    return $.when((ns.fetchImg('imgs/1.jpg')).done(function($img) {
      return equal($img.length, 1, '1.jpg loaded');
    }, (ns.fetchImg('imgs/2.jpg')).done(function($img) {
      return equal($img.length, 1, '2.jpg loaded');
    }, (ns.fetchImg('imgs/3.jpg')).done(function($img) {
      return equal($img.length, 1, '3.jpg loaded');
    }, (ns.fetchImg('imgs/4.jpg')).done(function($img) {
      return equal($img.length, 1, '4.jpg loaded');
    }))))).always(function() {
      return wait().done(start);
    });
  });

  asyncTest('fetchImg - error', function() {
    expect(2);
    return $.when((ns.fetchImg('nothinghere.jpg')).then(function($img) {
      return ok(false, 'img was not loaded but it saied ok');
    }, function($img) {
      ok(true, 'deferred returned error');
      return equal($img.length, 1, 'returned error img');
    })).always(function() {
      return start();
    });
  });

  asyncTest('fetchImg - ensure same img', function() {
    expect(2);
    return $.when((ns.fetchImg('imgs/1.jpg')).done(function($img) {
      return $img;
    }), (ns.fetchImg('imgs/1.jpg')).done(function($img) {
      return $img;
    })).always(function($img1, $img2) {
      equal($img1.attr('src'), $img2.attr('src'), 'same img');
      equal($img1[0], $img2[0], 'same dom');
      return start();
    });
  });

  asyncTest('loadImg - basic', function() {
    expect(2);
    return $.when((ns.loadImg('imgs/1.jpg')).then(function($img) {
      return $img;
    }), (ns.loadImg('imgs/1.jpg')).then(function($img) {
      return $img;
    })).always(function($img1, $img2) {
      equal($img1.attr('src'), $img2.attr('src'), 'same img');
      notEqual($img1[0], $img2[0], 'but another dom');
      return start();
    });
  });

  asyncTest('LoaderItem - load', function() {
    expect(2);
    return $.when($.Deferred(function(defer) {
      var item;
      item = new ns.LoaderItem('imgs/1.jpg');
      return item.load().done(function($img) {
        equal($img.attr('src'), 'imgs/1.jpg', '1.jpg was loaded');
        return defer.resolve($img);
      });
    }), $.Deferred(function(defer) {
      var item;
      item = new ns.LoaderItem('imgs/2.jpg');
      return item.load().done(function($img) {
        equal($img.attr('src'), 'imgs/2.jpg', '2.jpg was loaded');
        return defer.resolve($img);
      });
    })).always(function() {
      return start();
    });
  });

  asyncTest('LoaderItem - event - success/complete', function() {
    var item;
    expect(4);
    item = new ns.LoaderItem('imgs/1.jpg');
    item.bind('complete', function($img) {
      ok(true, 'complete event fired');
      return equal($img.attr('src'), 'imgs/1.jpg', '1.jpg was thrown to handler');
    });
    item.bind('success', function($img) {
      ok(true, 'success event fired');
      return equal($img.attr('src'), 'imgs/1.jpg', '1.jpg was thrown to handler');
    });
    return item.load().always(function() {
      return start();
    });
  });

  asyncTest('LoaderItem - event - error/complete', function() {
    var item;
    expect(4);
    item = new ns.LoaderItem('nothinghere.jpg');
    item.bind('complete', function($img) {
      ok(true, 'complete event fired');
      return equal($img.attr('src'), 'nothinghere.jpg', '1.jpg was thrown to handler');
    });
    item.bind('error', function($img) {
      ok(true, 'error event fired');
      return equal($img.attr('src'), 'nothinghere.jpg', '1.jpg was thrown to handler');
    });
    return item.load().always(function() {
      return start();
    });
  });

  asyncTest('BasicLoader - basics', function() {
    var i, lastProgressLoadedFileCount, loader, _i;
    loader = new ns.BasicLoader;
    lastProgressLoadedFileCount = 0;
    loader.one('progress', function(progressInfo) {
      var p;
      p = progressInfo;
      return equal(p.totalFileCount, 10, "totalFileCount on progress: " + p.totalFileCount);
    });
    loader.bind('progress', function(progressInfo) {
      var p, _ref;
      p = progressInfo;
      ok((0 <= (_ref = p.loadedFileCount) && _ref <= 10), "loadedFileCount on progress: " + p.loadedFileCount);
      lastProgressLoadedFileCount = p.loadedFileCount;
      if (lastProgressLoadedFileCount < p.loadedFileCount) {
        return ok(false, 'loaded count bugged');
      }
    });
    loader.bind('itemload', function($img, progressInfo) {
      var p;
      p = progressInfo;
      equal($img.length, 1, ($img.attr('src')) + ' was loaded');
      lastProgressLoadedFileCount = p.loadedFileCount;
      if (lastProgressLoadedFileCount < p.loadedFileCount) {
        return ok(false, 'loaded count bugged');
      }
    });
    loader.bind('allload', function($imgs, progressInfo) {
      equal($imgs.length, 10, 'all imgs loaded');
      return equal(progressInfo.loadedRatio, 1, 'loadedRatio 1 on allload');
    });
    for (i = _i = 1; _i <= 10; i = ++_i) {
      loader.add("imgs/" + i + ".jpg?" + (Math.random()));
    }
    return loader.load().always(function($imgs, progressInfo) {
      equal($imgs.length, 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('BasicLoader - no xhr2', function() {
    var i, lastProgressLoadedFileCount, loader, progressEventOccured, _i;
    loader = new ns.BasicLoader(false);
    lastProgressLoadedFileCount = 0;
    progressEventOccured = 0;
    loader.one('progress', function(progressInfo) {
      var p;
      p = progressInfo;
      return equal(p.totalFileCount, 10, "totalFileCount on progress: " + p.totalFileCount);
    });
    loader.bind('progress', function(progressInfo) {
      var p, _ref;
      p = progressInfo;
      ok((0 <= (_ref = p.loadedFileCount) && _ref <= 10), "loadedFileCount on progress: " + p.loadedFileCount);
      lastProgressLoadedFileCount = p.loadedFileCount;
      progressEventOccured += 1;
      if (lastProgressLoadedFileCount < p.loadedFileCount) {
        return ok(false, 'loaded count bugged');
      }
    });
    loader.bind('itemload', function($img, progressInfo) {
      var p;
      p = progressInfo;
      equal($img.length, 1, ($img.attr('src')) + ' was loaded');
      lastProgressLoadedFileCount = p.loadedFileCount;
      if (lastProgressLoadedFileCount < p.loadedFileCount) {
        return ok(false, 'loaded count bugged');
      }
    });
    loader.bind('allload', function($imgs, progressInfo) {
      equal($imgs.length, 10, 'all imgs loaded');
      return equal(progressInfo.loadedRatio, 1, 'loadedRatio 1 on allload');
    });
    for (i = _i = 1; _i <= 10; i = ++_i) {
      loader.add("imgs/" + i + ".jpg?" + (Math.random()));
    }
    return loader.load().always(function($imgs, progressInfo) {
      equal(progressEventOccured, 11, 'how many times progress event occured');
      equal($imgs.length, 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('BasicLoader - kill', function() {
    var count, i, loader, _i;
    expect(2);
    loader = new ns.BasicLoader;
    count = 0;
    loader.bind('itemload', function($img, i) {
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return ok(false, 'allload fired');
    });
    for (i = _i = 1; _i <= 100; i = ++_i) {
      loader.add("imgs/" + i + ".jpg?" + (Math.random()));
    }
    loader.bind('kill', function() {
      var count_killedTiming;
      ok(count < 100, "" + count + " items were loaded. loading was stopped.");
      count_killedTiming = count;
      return wait(1000).done(function() {
        equal(count_killedTiming, count, "no itemload evets were occured after kill. " + count_killedTiming + " - " + count);
        return start();
      });
    });
    loader.load();
    return wait(100).done(function() {
      return loader.kill();
    });
  });

  asyncTest('ChainLoader - basics', function() {
    var i, lastProgressLoadedFileCount, loader, progressEventOccured, _i;
    loader = new ns.ChainLoader(3);
    lastProgressLoadedFileCount = 0;
    progressEventOccured = 0;
    loader.one('progress', function(progressInfo) {
      var p;
      p = progressInfo;
      return equal(p.totalFileCount, 10, "totalFileCount on progress: " + p.totalFileCount);
    });
    loader.on('progress', function(progressInfo) {
      var p, _ref;
      p = progressInfo;
      ok((0 <= (_ref = p.loadedFileCount) && _ref <= 10), "loadedFileCount on progress: " + p.loadedFileCount);
      lastProgressLoadedFileCount = p.loadedFileCount;
      progressEventOccured += 1;
      if (lastProgressLoadedFileCount < p.loadedFileCount) {
        return ok(false, 'loaded count bugged');
      }
    });
    loader.on('itemload', function($img, progressInfo) {
      var p;
      p = progressInfo;
      equal($img.length, 1, ($img.attr('src')) + ' was loaded');
      lastProgressLoadedFileCount = p.loadedFileCount;
      if (lastProgressLoadedFileCount < p.loadedFileCount) {
        return ok(false, 'loaded count bugged');
      }
    });
    loader.on('allload', function($imgs, progressInfo) {
      equal($imgs.length, 10, 'all imgs loaded');
      return equal(progressInfo.loadedRatio, 1, 'loadedRatio 1 on allload');
    });
    for (i = _i = 1; _i <= 10; i = ++_i) {
      loader.add("imgs/" + i + ".jpg?" + (Math.random()));
    }
    return loader.load().always(function($imgs) {
      equal($imgs.length, 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('ChainLoader - no xhr2', function() {
    var i, lastProgressLoadedFileCount, loader, progressEventOccured, _i;
    loader = new ns.ChainLoader(3, 0, false);
    lastProgressLoadedFileCount = 0;
    progressEventOccured = 0;
    loader.one('progress', function(progressInfo) {
      var p;
      p = progressInfo;
      return equal(p.totalFileCount, 10, "totalFileCount on progress: " + p.totalFileCount);
    });
    loader.on('progress', function(progressInfo) {
      var p, _ref;
      p = progressInfo;
      ok((0 <= (_ref = p.loadedFileCount) && _ref <= 10), "loadedFileCount on progress: " + p.loadedFileCount);
      lastProgressLoadedFileCount = p.loadedFileCount;
      progressEventOccured += 1;
      if (lastProgressLoadedFileCount < p.loadedFileCount) {
        return ok(false, 'loaded count bugged');
      }
    });
    loader.on('itemload', function($img, progressInfo) {
      var p;
      p = progressInfo;
      equal($img.length, 1, ($img.attr('src')) + ' was loaded');
      lastProgressLoadedFileCount = p.loadedFileCount;
      if (lastProgressLoadedFileCount < p.loadedFileCount) {
        return ok(false, 'loaded count bugged');
      }
    });
    loader.on('allload', function($imgs, progressInfo) {
      equal($imgs.length, 10, 'all imgs loaded');
      return equal(progressInfo.loadedRatio, 1, 'loadedRatio 1 on allload');
    });
    for (i = _i = 1; _i <= 10; i = ++_i) {
      loader.add("imgs/" + i + ".jpg?" + (Math.random()));
    }
    return loader.load().always(function($imgs) {
      equal(progressEventOccured, 11, 'how many times progress event occured');
      equal($imgs.length, 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('ChainLoader - add - handles returned defer', function() {
    var loader;
    expect(4);
    loader = new ns.ChainLoader(3);
    (loader.add('imgs/1.jpg')).done(function($img) {
      ok(true, 'loader add returned defer');
      return equal($img.attr('src'), 'imgs/1.jpg', 'loader add returned img as deferred arg');
    });
    (loader.add('imgs/2.jpg')).done(function($img) {
      ok(true, 'loader add returned defer');
      return equal($img.attr('src'), 'imgs/2.jpg', 'loader add returned img as deferred arg');
    });
    return loader.load().always(function() {
      return start();
    });
  });

  asyncTest('ChainLoader - kill', function() {
    var count, i, loader, _i;
    expect(2);
    loader = new ns.ChainLoader(3);
    count = 0;
    loader.bind('itemload', function($img, i) {
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return ok(false, 'allload fired');
    });
    for (i = _i = 1; _i <= 100; i = ++_i) {
      loader.add("imgs/" + i + ".jpg?" + (Math.random()));
    }
    loader.bind('kill', function() {
      var count_killedTiming;
      ok(count < 100, "" + count + " items were loaded. loading was stopped.");
      count_killedTiming = count;
      return wait(1000).done(function() {
        equal(count_killedTiming, count, "no itemload evets were occured after kill. " + count_killedTiming + " - " + count);
        return start();
      });
    });
    loader.load();
    return wait(100).done(function() {
      return loader.kill();
    });
  });

  asyncTest('LoaderFacade - to BasicLoader', function() {
    var i, loader, srcs, _i;
    expect(12);
    srcs = [];
    for (i = _i = 1; _i <= 10; i = ++_i) {
      srcs.push("imgs/" + i + ".jpg?" + (Math.random()));
    }
    loader = new $.ImgLoader({
      srcs: srcs
    });
    loader.bind('itemload', function($img, p) {
      return equal($img.length, 1, ($img.attr('src')) + ' was loaded');
    });
    loader.bind('allload', function($imgs) {
      return equal($imgs.length, 10, 'all imgs loaded');
    });
    return loader.load().always(function($imgs) {
      equal($imgs.length, 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('LoaderFacade - to ChainLoader', function() {
    var i, loader, srcs, _i;
    expect(12);
    srcs = [];
    for (i = _i = 1; _i <= 10; i = ++_i) {
      srcs.push("imgs/" + i + ".jpg?" + (Math.random()));
    }
    loader = new $.ImgLoader({
      srcs: srcs,
      pipesize: 5
    });
    loader.bind('itemload', function($img, i) {
      return equal($img.length, 1, ($img.attr('src')) + ' was loaded');
    });
    loader.bind('allload', function($imgs) {
      return equal($imgs.length, 10, 'all imgs loaded');
    });
    return loader.load().always(function($imgs) {
      equal($imgs.length, 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('calcNaturalWH - ok', function() {
    expect(3);
    return ($.calcNaturalWH('imgs/1.jpg')).then(function(wh, $img) {
      equal(wh.width, 320, "width caliculated correctly " + wh.width);
      equal(wh.height, 320, "height caliculated correctly " + wh.height);
      return equal($img.attr('src'), 'imgs/1.jpg', 'img element was returned');
    }, function() {
      return ok(false, 'failed');
    }).always(function() {
      return start();
    });
  });

  asyncTest('calcNaturalWH - ng', function() {
    expect(1);
    return ($.calcNaturalWH('nothinghere.jpg')).then(function(wh) {
      return ok(false, 'successed unexpectedly');
    }, function() {
      return ok(true, 'fails when img was 404');
    }).always(function() {
      return start();
    });
  });

  asyncTest('calcNaturalWH - try many at once', function() {
    var deferreds, i, srcs, _i, _j;
    expect(40);
    srcs = [];
    for (i = _i = 1; _i <= 10; i = ++_i) {
      srcs.push("imgs/" + i + ".jpg");
    }
    for (i = _j = 1; _j <= 10; i = ++_j) {
      srcs.push("imgs/" + i + ".jpg");
    }
    deferreds = $.map(srcs, function(src) {
      return ($.calcNaturalWH(src)).then(function(wh) {
        equal(wh.width, 320, "" + src + " width caliculated correctly " + wh.width);
        return equal(wh.height, 320, "" + src + " height caliculated correctly " + wh.height);
      });
    });
    return ($.when.apply(this, deferreds)).always(function() {
      return start();
    });
  });

}).call(this);
