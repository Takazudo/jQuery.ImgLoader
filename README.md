# jQuery.ImgLoader

jQuery.Imgloader handles multiple imgs' preload.  

Img elements are loaded progressively on the page. jQuery.ImgLoader loads imgs as background task. This triggers events when each imgs' loading was completed. You can append the load-completed imgs to the page with this.

You can also get img loading progress ratio using xhr2.

## demos

* [http://takazudo.github.com/jQuery.ImgLoader/demo1/example.html](http://takazudo.github.com/jQuery.ImgLoader/demo1/example.html)
* [http://takazudo.github.com/jQuery.ImgLoader/demo2/example.html](http://takazudo.github.com/jQuery.ImgLoader/demo2/example.html)
* [http://takazudo.github.com/jQuery.ImgLoader/demo3/example.html](http://takazudo.github.com/jQuery.ImgLoader/demo3/example.html)

## Usage

### $.loadImg - handles single img's preload

$.loadImg(src) returns deferred object which handles loading.  
It will be resolved when the specified img's loading was complete.

```javascript
$.loadImg('img1.jpg').then(function($img){
  $('#somewhere').append($img);
}, function(){
  alert('could not load 1.jpg');
})
```

### $.ImgLoader - BasicLoader

BasicLoader is a simple loader.  
This starts preload about all thrown srcs at once.  
You can bind 'progress'/'itemload'/'allload' event.  
'itemload' event will be fired when each img was loaded.  
'progress' event will be fired when xhr2 was progressed (or on itemload as fallback).  
'allload' event will be fired when all imgs were loaded.

```javascript
var loader = new $.ImgLoader({
  srcs: [ 'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg' ],
  useXHR2: true, // use xhr2 if the browser supports it (optional) (default: true)
  timeout: 20000 // xhr2 timeout (optional) (default: 10000)
});
loader.on('progress', function(progressInfo){
  console.log(progressInfo.loadedRatio); // 0.45
});
loader.on('itemload', function($img){
  $('#somewhere').append($img);
});
loader.on('allload', function($img){
  alert('everything loaded!');
});
loader.load();
```

### $.ImgLoader - ChainLoader

ChainLoader limits the number of img loading executed at once.  
BasicLoader sometimes gets troubled when the number of imgs were huge. It's tough work to load 100 imgs at once for browsers. If you specify 3 as pipesize, ChainLoader doesnot loads 4 or more imgs at once. This may help you to reduce the load to the browser, also keeps the loading order.

#### ChainLoader - basics

Just throw 'pipesize' and 'delay'(optional) to $.ImgLoader.

```javascript
var loader = new $.ImgLoader({
  srcs: [ 'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg' ],
  pipesize: 2, // max connections (optional)
  delay: 100, // interval between each img loads (optional)
  useXHR2: false, // use xhr2 if the browser supports it (optional) (default: false)
  timeout: 20000 // xhr2 timeout (optional) (default: 10000)
});
loader.on('progress', function(progressInfo){
  console.log(progressInfo.loadedRatio); // 0.45
});
loader.on('itemload', function($img){
  $('#somewhere').append($img);
});
loader.on('allload', function($img){
  alert('everything loaded!');
});
loader.load();
```

The code above loads 'img1.jpg' and 'img2.jpg' at once first.  
When either of them was loaded, loader starts loading 'img3.jpg' after 100 millisec delay.

#### ChainLoader - 'add' handle items one by one

You may want to handle each img's loading individually.  
Then, you can use 'add' method to register single loading task. It returns jQuery deferred about preload.

```javascript
var loader = new $.ImgLoader({ pipesize: 2, });

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

#### ChainLoader - 'kill' stop all loading immediately

Call 'kill' if you want to stop loading tasks.

```javascript
var loader = new $.ImgLoader({
  srcs: [ 'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg' ],
  pipesize: 2
});
loader.on('allload', function($img){
  alert('everything loaded! but this will not be fired');
});

loader.load();
loader.kill(); // stop all!
```

Note: This 'kill' method is available for BasicLoader too.  
But, BasicLoader starts imgs' loading at once. You can't stop already-started imgs' loadings to the browsers. 'kill' stops all future events about these imgs. But, preloadings, themselves cannnot be stopped. Use ChainLoader for huge amount of imgs.

### $.calcNaturalWH - caliculate natural width / heigth

$.calcNaturalWH caliculates img's natural width / height.  
Newer browsers have naturalWidth/naturalHeight feature. With these, we can get the img's original width/height. But these features are sometimes difficult to handle because it fails and returns zero before the img was not load-completed.  
$.calcNaturalWH preloads img as background task then returns the values you want.  
This also works on old browsers which do not have naturalWidth/naturalHeight feature using tricky way.

```javascript
$.calcNaturalWH('../imgs/1.jpg').then(function(wh, $img){
  alert(wh.width); // 320
  alert(wh.height); // 320
  $('#somewhere').append($img);
}, function(){
  alert('failed because of 404 or something');
});
```

## Depends

jQuery 1.9.1

## Browsers

IE6+ and other new browsers

## License

Copyright (c) 2012 "Takazudo" Takeshi Takatsudo  
Licensed under the MIT license.

## Misc

This scirpt was developed with following things.  

 * [CoffeeScript][coffeescript]
 * [grunt][grunt]

[coffeescript]: http://coffeescript.org/ "CoffeeScript"
[grunt]: https://github.com/cowboy/grunt "grunt"
