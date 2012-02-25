# jQuery.ImgLoader

jQuery.Imgloader handles multiple imgs' loading.  
Img elements are loaded progressively on the page. jQuery.ImgLoader loads imgs as background task. This triggers events when each imgs' loadings was completed. You can append the load-completed imgs to the page with this.

## demos

* [http://takazudo.github.com/jQuery.ImgLoader/demo1/example.html](http://takazudo.github.com/jQuery.ImgLoader/demo1/example.html)
* [http://takazudo.github.com/jQuery.ImgLoader/demo2/example.html](http://takazudo.github.com/jQuery.ImgLoader/demo2/example.html)

## Usage

### single image loading

$.loadImg(src) returns the deferred.  
It will be resolved when the img's loading was complete.

```javascript
$.loadImg('img1.jpg').then(function($img){
  $('#somewhere').append($img);
}, function(){
  alert('could not load 1.jpg');
})
```

### BasicLoader

BasicLoader is a simple loader.  
This starts loading all thrown srcs at once.  
You can bind 'itemload' and 'allload' event.  
'itemload' event will be fired when each imgs was loaded.  
'allload' event will be fired when all imgs were loaded.

```javascript
var loader = $.ImgLoader({
  srcs: [ 'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg' ]
});
loader.bind('itemload', function($img){
  $('#somewhere').append($img);
});
loader.bind('allload', function($img){
  alert('everything loaded!');
});
loader.load();
```

### ChainLoader

ChainLoader limits the number of img loading executed at once.  
BasicLoader sometimes gets troubled when the number of imgs were huge. It's tough work to load 100 imgs at once for browsers. If you specify 3 as pipesize, ChainLoader doesnot loads 4 or more imgs at once. This may help you to reduce the loads to the browser, and also keeps the loading order.

#### basics

Just throw 'pipesize' and 'delay'(optional) to $.ImgLoader.

```javascript
var loader = $.ImgLoader({
  srcs: [ 'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg' ],
  pipesize: 2,
  delay: 100 // optional
});
loader.bind('itemload', function($img){
  $('#somewhere').append($img);
});
loader.bind('allload', function($img){
  alert('everything loaded!');
});
loader.load();
```

The code above loads 'img1.jpg' and 'img2.jpg' at once first.  
When either of them was loaded, loader starts loading 'img3.jpg' after 100 millisec delay.

#### handle items one by one

You may want to handle each img's loading individually.  
Then, you can use 'add' method to register single loading task. It returns jQuery deferred about loading.

```javascript
var loader = $.ImgLoader({ pipesize: 2, });

loader.add('1.jpg').then(function($img){
  $('#somewhere').append($img);
}, function(){
  alert('could not load 1.jpg');
});
loader.add('2.jpg').then(function($img){
  $('#somewhere').append($img);
}, function(){
  alert('could not load 2.jpg');
});

loader.load();
```

#### stop loading immediately

Call 'kill' if you want to stop loading tasks.

```javascript
var loader = $.ImgLoader({
  srcs: [ 'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg' ],
  pipesize: 2
});
loader.bind('allload', function($img){
  alert('everything loaded! but this will not be fired');
});

loader.load();
loader.kill(); // stop all!
```

This 'kill' method is available for BasicLoader too.  
But, BasicLoader starts imgs' loading at once. You can't stop already-started imgs' loadings to the browsers. 'kill' stops the all future events about the imgs. But, background-loading cannnot be stopped. Use ChainLoader for huge amount of imgs.

## Depends

jQuery 1.7.1

## Browsers

IE6+ and other news browsers

## License

Copyright (c) 2012 "Takazudo" Takeshi Takatsudo  
Licensed under the MIT license.

## Misc

This scirpt was developed with following things.  

 * [CoffeeScript][coffeescript]
 * [grunt][grunt]

[coffeescript]: http://coffeescript.org/ "CoffeeScript"
[grunt]: https://github.com/cowboy/grunt "grunt"
