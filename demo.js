(function() {

  $(function() {
    var $chainsize, $delay, $form, $growl, $imgs, $options, $usechain, cleanGrowl, notify, randomSrcs, refresh;
    $imgs = $('#imgs');
    $growl = $('#growl');
    $form = $('form').bind('submit', function(e) {
      e.preventDefault();
      return refresh();
    });
    $usechain = $('[name=usechain]', $form);
    $options = $('.options', $form);
    $chainsize = $('[name=chainsize]', $form);
    $delay = $('[name=delay]', $form);
    $usechain.filter('[value=yes]').click(function() {
      $options.css('opacity', 1);
      $chainsize.prop('disabled', false);
      return $delay.prop('disabled', false);
    });
    $usechain.filter('[value=no]').click(function() {
      $options.css('opacity', 0.5);
      $chainsize.prop('disabled', true);
      return $delay.prop('disabled', true);
    });
    refresh = function() {
      var chainsize, delay, loader, options, usechain;
      $imgs.empty();
      if ($usechain.filter(':checked').val() === 'yes') usechain = true;
      chainsize = $chainsize.val() * 1;
      delay = $delay.val() * 1;
      if (usechain) {
        options = {
          chainsize: chainsize,
          delay: delay
        };
      } else {
        options = null;
      }
      loader = $.ImgLoader(randomSrcs(), options);
      loader.bind('itemload', function($img) {
        $imgs.append($img);
        notify("itemload fired: " + ($img.attr('src')));
        return setTimeout((function() {
          return $img.css('opacity', 1);
        }), 1);
      });
      loader.bind('allload', function() {
        return notify('allload fired');
      });
      return loader.load();
    };
    cleanGrowl = function() {
      var $items;
      $items = $growl.find('div');
      if ($items.size() > 30) return $($items.get().pop()).remove();
    };
    notify = function(msg) {
      var $item;
      msg = msg.replace(/\?.+/, '');
      $item = $("<div>" + msg + "</div>");
      $item.prependTo($growl);
      return cleanGrowl();
    };
    return randomSrcs = function() {
      var i, random, srcs;
      srcs = [];
      random = $.now();
      for (i = 1; i <= 50; i++) {
        srcs.push("imgs/" + i + ".jpg?" + random);
      }
      return srcs;
    };
  });

}).call(this);
