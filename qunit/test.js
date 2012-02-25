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
      return equal($img.size(), 1, '1.jpg loaded');
    }, (ns.fetchImg('imgs/2.jpg')).done(function($img) {
      return equal($img.size(), 1, '2.jpg loaded');
    }, (ns.fetchImg('imgs/3.jpg')).done(function($img) {
      return equal($img.size(), 1, '3.jpg loaded');
    }, (ns.fetchImg('imgs/4.jpg')).done(function($img) {
      return equal($img.size(), 1, '4.jpg loaded');
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
      return equal($img.size(), 1, 'returned error img');
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
    var count, i, loader;
    expect(22);
    loader = new ns.BasicLoader;
    count = -1;
    loader.bind('itemload', function($img, i) {
      equal($img.size(), 1, ($img.attr('src')) + ' was loaded');
      equal(i, count + 1, "counter " + i + " was thrown");
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return equal($imgs.size(), 10, 'all imgs loaded');
    });
    for (i = 1; i <= 10; i++) {
      loader.add(new ns.LoaderItem("imgs/" + i + ".jpg"));
    }
    return loader.load().always(function($imgs) {
      equal($imgs.size(), 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('BasicLoader - add - as string', function() {
    var count, i, loader;
    expect(22);
    loader = new ns.BasicLoader;
    count = -1;
    loader.bind('itemload', function($img, i) {
      equal($img.size(), 1, ($img.attr('src')) + ' was loaded');
      equal(i, count + 1, "counter " + i + " was thrown");
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return equal($imgs.size(), 10, 'all imgs loaded');
    });
    for (i = 1; i <= 10; i++) {
      loader.add("imgs/" + i + ".jpg");
    }
    return loader.load().always(function($imgs) {
      equal($imgs.size(), 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('BasicLoader - kill', function() {
    var count, i, loader;
    expect(2);
    loader = new ns.BasicLoader;
    count = 0;
    loader.bind('itemload', function($img, i) {
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return ok(false, 'allload fired');
    });
    for (i = 1; i <= 100; i++) {
      loader.add(new ns.LoaderItem("imgs/" + i + ".jpg"));
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

  asyncTest('ChainLoader', function() {
    var count, i, loader;
    expect(22);
    loader = new ns.ChainLoader(3);
    count = -1;
    loader.bind('itemload', function($img, i) {
      equal($img.size(), 1, ($img.attr('src')) + ' was loaded');
      equal(i, count + 1, "counter " + i + " was thrown");
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return equal($imgs.size(), 10, 'all imgs loaded');
    });
    for (i = 1; i <= 10; i++) {
      loader.add(new ns.LoaderItem("imgs/" + i + ".jpg"));
    }
    return loader.load().always(function($imgs) {
      equal($imgs.size(), 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('ChainLoader - add - as string', function() {
    var count, i, loader;
    expect(22);
    loader = new ns.ChainLoader(3);
    count = -1;
    loader.bind('itemload', function($img, i) {
      equal($img.size(), 1, ($img.attr('src')) + ' was loaded');
      equal(i, count + 1, "counter " + i + " was thrown");
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return equal($imgs.size(), 10, 'all imgs loaded');
    });
    for (i = 1; i <= 10; i++) {
      loader.add("imgs/" + i + ".jpg");
    }
    return loader.load().always(function($imgs) {
      equal($imgs.size(), 10, 'done deferred worked');
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
    var count, i, loader;
    expect(2);
    loader = new ns.ChainLoader(3);
    count = 0;
    loader.bind('itemload', function($img, i) {
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return ok(false, 'allload fired');
    });
    for (i = 1; i <= 100; i++) {
      loader.add(new ns.LoaderItem("imgs/" + i + ".jpg"));
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

  test('LoaderFacade - without new handling', function() {
    var srcs;
    srcs = [1, 2, 3, 4];
    (function() {
      var loader;
      loader = new $.ImgLoader({
        srcs: srcs
      });
      return ok(loader instanceof $.ImgLoader, 'with new');
    })();
    return (function() {
      var loader;
      loader = $.ImgLoader({
        srcs: srcs
      });
      return ok(loader instanceof $.ImgLoader, 'without new');
    })();
  });

  asyncTest('LoaderFacade - to BasicLoader', function() {
    var count, i, loader, srcs;
    expect(22);
    srcs = [];
    for (i = 1; i <= 10; i++) {
      srcs.push("imgs/" + i + ".jpg");
    }
    loader = new $.ImgLoader({
      srcs: srcs
    });
    count = -1;
    loader.bind('itemload', function($img, i) {
      equal($img.size(), 1, ($img.attr('src')) + ' was loaded');
      equal(i, count + 1, "counter " + i + " was thrown");
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return equal($imgs.size(), 10, 'all imgs loaded');
    });
    return loader.load().always(function($imgs) {
      equal($imgs.size(), 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('LoaderFacade - to ChainLoader', function() {
    var count, i, loader, srcs;
    expect(22);
    srcs = [];
    for (i = 1; i <= 10; i++) {
      srcs.push("imgs/" + i + ".jpg");
    }
    loader = new $.ImgLoader({
      srcs: srcs,
      pipesize: 5
    });
    count = -1;
    loader.bind('itemload', function($img, i) {
      equal($img.size(), 1, ($img.attr('src')) + ' was loaded');
      equal(i, count + 1, "counter " + i + " was thrown");
      return count++;
    });
    loader.bind('allload', function($imgs) {
      return equal($imgs.size(), 10, 'all imgs loaded');
    });
    return loader.load().always(function($imgs) {
      equal($imgs.size(), 10, 'done deferred worked');
      return start();
    });
  });

  asyncTest('calcNaturalWH - ok', function() {
    expect(2);
    return ($.calcNaturalWH('imgs/1.jpg')).then(function(wh) {
      equal(wh.width, 320, "width caliculated correctly " + wh.width);
      return equal(wh.height, 320, "height caliculated correctly " + wh.height);
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
    var deferreds, i, srcs;
    expect(40);
    srcs = [];
    for (i = 1; i <= 10; i++) {
      srcs.push("imgs/" + i + ".jpg");
    }
    for (i = 1; i <= 10; i++) {
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
