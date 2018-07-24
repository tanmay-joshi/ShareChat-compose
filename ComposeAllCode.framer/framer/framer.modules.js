require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"CameraLayer":[function(require,module,exports){
var CameraLayer,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

CameraLayer = (function(superClass) {
  extend(CameraLayer, superClass);

  function CameraLayer(options) {
    var baseOptions, customProps, ref, ref1, ref2, ref3, ref4;
    if (options == null) {
      options = {};
    }
    customProps = {
      facing: true,
      flipped: true,
      autoFlip: true,
      resolution: true,
      fit: true
    };
    baseOptions = Object.keys(options).filter(function(key) {
      return !customProps[key];
    }).reduce(function(clone, key) {
      clone[key] = options[key];
      return clone;
    }, {});
    CameraLayer.__super__.constructor.call(this, baseOptions);
    this._facing = (ref = options.facing) != null ? ref : 'back';
    this._flipped = (ref1 = options.flipped) != null ? ref1 : false;
    this._autoFlip = (ref2 = options.autoFlip) != null ? ref2 : true;
    this._resolution = (ref3 = options.resolution) != null ? ref3 : 480;
    this._started = false;
    this._device = null;
    this._matchedFacing = 'unknown';
    this._stream = null;
    this._scheduledRestart = null;
    this._recording = null;
    this.backgroundColor = 'transparent';
    this.clip = true;
    this.player.src = '';
    this.player.autoplay = true;
    this.player.muted = true;
    this.player.playsinline = true;
    this.player.style.objectFit = (ref4 = options.fit) != null ? ref4 : 'cover';
  }

  CameraLayer.define('facing', {
    get: function() {
      return this._facing;
    },
    set: function(facing) {
      this._facing = facing === 'front' ? facing : 'back';
      return this._setRestart();
    }
  });

  CameraLayer.define('flipped', {
    get: function() {
      return this._flipped;
    },
    set: function(flipped) {
      this._flipped = flipped;
      return this._setRestart();
    }
  });

  CameraLayer.define('autoFlip', {
    get: function() {
      return this._autoFlip;
    },
    set: function(autoFlip) {
      this._autoFlip = autoFlip;
      return this._setRestart();
    }
  });

  CameraLayer.define('resolution', {
    get: function() {
      return this._resolution;
    },
    set: function(resolution) {
      this._resolution = resolution;
      return this._setRestart();
    }
  });

  CameraLayer.define('fit', {
    get: function() {
      return this.player.style.objectFit;
    },
    set: function(fit) {
      return this.player.style.objectFit = fit;
    }
  });

  CameraLayer.define('isRecording', {
    get: function() {
      var ref;
      return ((ref = this._recording) != null ? ref.recorder.state : void 0) === 'recording';
    }
  });

  CameraLayer.prototype.toggleFacing = function() {
    this._facing = this._facing === 'front' ? 'back' : 'front';
    return this._setRestart();
  };

  CameraLayer.prototype.capture = function(width, height, ratio) {
    var canvas, context, url;
    if (width == null) {
      width = this.width;
    }
    if (height == null) {
      height = this.height;
    }
    if (ratio == null) {
      ratio = window.devicePixelRatio;
    }
    canvas = document.createElement("canvas");
    canvas.width = ratio * width;
    canvas.height = ratio * height;
    context = canvas.getContext("2d");
    this.draw(context);
    url = canvas.toDataURL();
    this.emit('capture', url);
    return url;
  };

  CameraLayer.prototype.draw = function(context) {
    var clipBox, cover, layerBox, ref, videoBox, videoHeight, videoWidth, x, y;
    if (!context) {
      return;
    }
    cover = function(srcW, srcH, dstW, dstH) {
      var scale, scaleX, scaleY;
      scaleX = dstW / srcW;
      scaleY = dstH / srcH;
      scale = scaleX > scaleY ? scaleX : scaleY;
      return {
        width: srcW * scale,
        height: srcH * scale
      };
    };
    ref = this.player, videoWidth = ref.videoWidth, videoHeight = ref.videoHeight;
    clipBox = {
      width: context.canvas.width,
      height: context.canvas.height
    };
    layerBox = cover(this.width, this.height, clipBox.width, clipBox.height);
    videoBox = cover(videoWidth, videoHeight, layerBox.width, layerBox.height);
    x = (clipBox.width - videoBox.width) / 2;
    y = (clipBox.height - videoBox.height) / 2;
    return context.drawImage(this.player, x, y, videoBox.width, videoBox.height);
  };

  CameraLayer.prototype.start = function() {
    return this._enumerateDevices().then((function(_this) {
      return function(devices) {
        var device, i, len;
        devices = devices.filter(function(device) {
          return device.kind === 'videoinput';
        });
        for (i = 0, len = devices.length; i < len; i++) {
          device = devices[i];
          if (device.label.indexOf(_this._facing) !== -1) {
            _this._matchedFacing = _this._facing;
            return device;
          }
        }
        _this._matchedFacing = 'unknown';
        if (devices.length > 0) {
          return devices[0];
        } else {
          return Promise.reject();
        }
      };
    })(this)).then((function(_this) {
      return function(device) {
        var constraints, ref;
        if (!device || device.deviceId === ((ref = _this._device) != null ? ref.deviceId : void 0)) {
          return;
        }
        _this.stop();
        _this._device = device;
        constraints = {
          video: {
            mandatory: {
              minWidth: _this._resolution,
              minHeight: _this._resolution
            },
            optional: [
              {
                sourceId: _this._device.deviceId
              }
            ]
          },
          audio: true
        };
        return _this._getUserMedia(constraints);
      };
    })(this)).then((function(_this) {
      return function(stream) {
        _this.player.srcObject = stream;
        _this._started = true;
        _this._stream = stream;
        return _this._flip();
      };
    })(this))["catch"](function(error) {
      return console.error(error);
    });
  };

  CameraLayer.prototype.stop = function() {
    var ref;
    this._started = false;
    this.player.pause();
    this.player.srcObject = null;
    if ((ref = this._stream) != null) {
      ref.getTracks().forEach(function(track) {
        return track.stop();
      });
    }
    this._stream = null;
    this._device = null;
    if (this._scheduledRestart) {
      cancelAnimationFrame(this._scheduledRestart);
      return this._scheduledRestart = null;
    }
  };

  CameraLayer.prototype.startRecording = function() {
    var chunks, recorder;
    if (this._recording) {
      this._recording.recorder.stop();
      this._recording = null;
    }
    chunks = [];
    recorder = new MediaRecorder(this._stream, {
      mimeType: 'video/webm'
    });
    recorder.addEventListener('start', (function(_this) {
      return function(event) {
        return _this.emit('startrecording');
      };
    })(this));
    recorder.addEventListener('dataavailable', function(event) {
      return chunks.push(event.data);
    });
    recorder.addEventListener('stop', (function(_this) {
      return function(event) {
        var blob, url;
        blob = new Blob(chunks);
        url = window.URL.createObjectURL(blob);
        _this.emit('stoprecording');
        return _this.emit('record', url);
      };
    })(this));
    recorder.start();
    return this._recording = {
      recorder: recorder,
      chunks: chunks
    };
  };

  CameraLayer.prototype.stopRecording = function() {
    if (!this._recording) {
      return;
    }
    this._recording.recorder.stop();
    return this._recording = null;
  };

  CameraLayer.prototype.onCapture = function(callback) {
    return this.on('capture', callback);
  };

  CameraLayer.prototype.onStartRecording = function(callback) {
    return this.on('startrecording', callback);
  };

  CameraLayer.prototype.onStopRecording = function(callback) {
    return this.on('stoprecording', callback);
  };

  CameraLayer.prototype.onRecord = function(callback) {
    return this.on('record', callback);
  };

  CameraLayer.prototype._setRestart = function() {
    if (!this._started || this._scheduledRestart) {
      return;
    }
    return this._scheduledRestart = requestAnimationFrame((function(_this) {
      return function() {
        _this._scheduledRestart = null;
        return _this.start();
      };
    })(this));
  };

  CameraLayer.prototype._flip = function() {
    var x;
    if (this._autoFlip) {
      this._flipped = this._matchedFacing === 'front';
    }
    x = this._flipped ? -1 : 1;
    return this.player.style.webkitTransform = "scale(" + x + ", 1)";
  };

  CameraLayer.prototype._enumerateDevices = function() {
    try {
      return navigator.mediaDevices.enumerateDevices();
    } catch (error1) {
      return Promise.reject();
    }
  };

  CameraLayer.prototype._getUserMedia = function(constraints) {
    return new Promise(function(resolve, reject) {
      var gum;
      try {
        gum = navigator.getUserMedia || navigator.webkitGetUserMedia;
        return gum.call(navigator, constraints, resolve, reject);
      } catch (error1) {
        return reject();
      }
    });
  };

  return CameraLayer;

})(VideoLayer);

if (typeof module !== "undefined" && module !== null) {
  module.exports = CameraLayer;
}

Framer.CameraLayer = CameraLayer;


},{}],"FontAwesome":[function(require,module,exports){
var classNames, fontAwesomeCSS,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

classNames = {
  "500px": "&#xf26e;",
  "adjust": "&#xf042;",
  "adn": "&#xf170;",
  "align-center": "&#xf037;",
  "align-justify": "&#xf039;",
  "align-left": "&#xf036;",
  "align-right": "&#xf038;",
  "amazon": "&#xf270;",
  "ambulance": "&#xf0f9;",
  "anchor": "&#xf13d;",
  "android": "&#xf17b;",
  "angellist": "&#xf209;",
  "angle-double-down": "&#xf103;",
  "angle-double-left": "&#xf100;",
  "angle-double-right": "&#xf101;",
  "angle-double-up": "&#xf102;",
  "angle-down": "&#xf107;",
  "angle-left": "&#xf104;",
  "angle-right": "&#xf105;",
  "angle-up": "&#xf106;",
  "apple": "&#xf179;",
  "archive": "&#xf187;",
  "area-chart": "&#xf1fe;",
  "arrow-circle-down": "&#xf0ab;",
  "arrow-circle-left": "&#xf0a8;",
  "arrow-circle-o-down": "&#xf01a;",
  "arrow-circle-o-left": "&#xf190;",
  "arrow-circle-o-right": "&#xf18e;",
  "arrow-circle-o-up": "&#xf01b;",
  "arrow-circle-right": "&#xf0a9;",
  "arrow-circle-up": "&#xf0aa;",
  "arrow-down": "&#xf063;",
  "arrow-left": "&#xf060;",
  "arrow-right": "&#xf061;",
  "arrow-up": "&#xf062;",
  "arrows": "&#xf047;",
  "arrows-alt": "&#xf0b2;",
  "arrows-h": "&#xf07e;",
  "arrows-v": "&#xf07d;",
  "asterisk": "&#xf069;",
  "at": "&#xfa;",
  "automobile (alias)": "&#xf1b9;",
  "backward": "&#xf04a;",
  "balance-scale": "&#xf24e;",
  "ban": "&#xf05e;",
  "bank (alias)": "&#xf19c;",
  "bar-chart": "&#xf080;",
  "bar-chart-o (alias)": "&#xf080;",
  "barcode": "&#xf02a;",
  "bars": "&#xf0c9;",
  "battery-0 (alias)": "&#xf244;",
  "battery-1 (alias)": "&#xf243;",
  "battery-2 (alias)": "&#xf242;",
  "battery-3 (alias)": "&#xf241;",
  "battery-4 (alias)": "&#xf240;",
  "battery-empty": "&#xf244;",
  "battery-full": "&#xf240;",
  "battery-half": "&#xf242;",
  "battery-quarter": "&#xf243;",
  "battery-three-quarters": "&#xf241;",
  "bed": "&#xf236;",
  "beer": "&#xf0fc;",
  "behance": "&#xf1b4;",
  "behance-square": "&#xf1b5;",
  "bell": "&#xf0f3;",
  "bell-o": "&#xf0a2;",
  "bell-slash": "&#xf1f6;",
  "bell-slash-o": "&#xf1f7;",
  "bicycle": "&#xf206;",
  "binoculars": "&#xf1e5;",
  "birthday-cake": "&#xf1fd;",
  "bitbucket": "&#xf171;",
  "bitbucket-square": "&#xf172;",
  "bitcoin (alias)": "&#xf15a;",
  "black-tie": "&#xf27e;",
  "bold": "&#xf032;",
  "bolt": "&#xf0e7;",
  "bomb": "&#xf1e2;",
  "book": "&#xf02d;",
  "bookmark": "&#xf02e;",
  "bookmark-o": "&#xf097;",
  "briefcase": "&#xf0b1;",
  "btc": "&#xf15a;",
  "bug": "&#xf188;",
  "building": "&#xf1ad;",
  "building-o": "&#xf0f7;",
  "bullhorn": "&#xf0a1;",
  "bullseye": "&#xf140;",
  "bus": "&#xf207;",
  "buysellads": "&#xf20d;",
  "cab (alias)": "&#xf1ba;",
  "calculator": "&#xf1ec;",
  "calendar": "&#xf073;",
  "calendar-check-o": "&#xf274;",
  "calendar-minus-o": "&#xf272;",
  "calendar-o": "&#xf133;",
  "calendar-plus-o": "&#xf271;",
  "calendar-times-o": "&#xf273;",
  "camera": "&#xf030;",
  "camera-retro": "&#xf083;",
  "car": "&#xf1b9;",
  "caret-down": "&#xf0d7;",
  "caret-left": "&#xf0d9;",
  "caret-right": "&#xf0da;",
  "caret-square-o-down": "&#xf150;",
  "caret-square-o-left": "&#xf191;",
  "caret-square-o-right": "&#xf152;",
  "caret-square-o-up": "&#xf151;",
  "caret-up": "&#xf0d8;",
  "cart-arrow-down": "&#xf218;",
  "cart-plus": "&#xf217;",
  "cc": "&#xf20a;",
  "cc-amex": "&#xf1f3;",
  "cc-diners-club": "&#xf24c;",
  "cc-discover": "&#xf1f2;",
  "cc-jcb": "&#xf24b;",
  "cc-mastercard": "&#xf1f1;",
  "cc-paypal": "&#xf1f4;",
  "cc-stripe": "&#xf1f5;",
  "cc-visa": "&#xf1f0;",
  "certificate": "&#xf0a3;",
  "chain (alias)": "&#xf0c1;",
  "chain-broken": "&#xf127;",
  "check": "&#xf00c;",
  "check-circle": "&#xf058;",
  "check-circle-o": "&#xf05d;",
  "check-square": "&#xf14a;",
  "check-square-o": "&#xf046;",
  "chevron-circle-down": "&#xf13a;",
  "chevron-circle-left": "&#xf137;",
  "chevron-circle-right": "&#xf138;",
  "chevron-circle-up": "&#xf139;",
  "chevron-down": "&#xf078;",
  "chevron-left": "&#xf053;",
  "chevron-right": "&#xf054;",
  "chevron-up": "&#xf077;",
  "child": "&#xf1ae;",
  "chrome": "&#xf268;",
  "circle": "&#xf111;",
  "circle-o": "&#xf10c;",
  "circle-o-notch": "&#xf1ce;",
  "circle-thin": "&#xf1db;",
  "clipboard": "&#xf0ea;",
  "clock-o": "&#xf017;",
  "clone": "&#xf24d;",
  "close (alias)": "&#xf00d;",
  "cloud": "&#xf0c2;",
  "cloud-download": "&#xf0ed;",
  "cloud-upload": "&#xf0ee;",
  "cny (alias)": "&#xf157;",
  "code": "&#xf121;",
  "code-fork": "&#xf126;",
  "codepen": "&#xf1cb;",
  "coffee": "&#xf0f4;",
  "cog": "&#xf013;",
  "cogs": "&#xf085;",
  "columns": "&#xf0db;",
  "comment": "&#xf075;",
  "comment-o": "&#xf0e5;",
  "commenting": "&#xf27a;",
  "commenting-o": "&#xf27b;",
  "comments": "&#xf086;",
  "comments-o": "&#xf0e6;",
  "compass": "&#xf14e;",
  "compress": "&#xf066;",
  "connectdevelop": "&#xf20e;",
  "contao": "&#xf26d;",
  "copy (alias)": "&#xf0c5;",
  "copyright": "&#xf1f9;",
  "creative-commons": "&#xf25e;",
  "credit-card": "&#xf09d;",
  "crop": "&#xf125;",
  "crosshairs": "&#xf05b;",
  "css3": "&#xf13c;",
  "cube": "&#xf1b2;",
  "cubes": "&#xf1b3;",
  "cut (alias)": "&#xf0c4;",
  "cutlery": "&#xf0f5;",
  "dashboard (alias)": "&#xf0e4;",
  "dashcube": "&#xf210;",
  "database": "&#xf1c0;",
  "dedent (alias)": "&#xf03b;",
  "delicious": "&#xf1a5;",
  "desktop": "&#xf108;",
  "deviantart": "&#xf1bd;",
  "diamond": "&#xf219;",
  "digg": "&#xf1a6;",
  "dollar (alias)": "&#xf155;",
  "dot-circle-o": "&#xf192;",
  "download": "&#xf019;",
  "dribbble": "&#xf17d;",
  "dropbox": "&#xf16b;",
  "drupal": "&#xf1a9;",
  "edit (alias)": "&#xf044;",
  "eject": "&#xf052;",
  "ellipsis-h": "&#xf141;",
  "ellipsis-v": "&#xf142;",
  "empire": "&#xf1d1;",
  "envelope": "&#xf0e0;",
  "envelope-o": "&#xf003;",
  "envelope-square": "&#xf199;",
  "eraser": "&#xf12d;",
  "eur": "&#xf153;",
  "euro (alias)": "&#xf153;",
  "exchange": "&#xf0ec;",
  "exclamation": "&#xf12a;",
  "exclamation-circle": "&#xf06a;",
  "exclamation-triangle": "&#xf071;",
  "expand": "&#xf065;",
  "expeditedssl": "&#xf23e;",
  "external-link": "&#xf08e;",
  "external-link-square": "&#xf14c;",
  "eye": "&#xf06e;",
  "eye-slash": "&#xf070;",
  "eyedropper": "&#xf1fb;",
  "ffacebook": "&#xf09a;",
  "ffacebook-f (alias)": "&#xf09a;",
  "4.3ffacebook-official": "&#xf230;",
  "ffacebook-square": "&#xf082;",
  "ffast-backward": "&#xf049;",
  "ffast-forward": "&#xf050;",
  "4.1ffax": "&#xf1ac;",
  "feed (alias)": "&#xf09e;",
  "female": "&#xf182;",
  "fighter-jet": "&#xf0fb;",
  "file": "&#xf15b;",
  "file-archive-o": "&#xf1c6;",
  "file-audio-o": "&#xf1c7;",
  "file-code-o": "&#xf1c9;",
  "file-excel-o": "&#xf1c3;",
  "file-image-o": "&#xf1c5;",
  "file-movie-o (alias)": "&#xf1c8;",
  "file-o": "&#xf016;",
  "file-pdf-o": "&#xf1c1;",
  "file-photo-o (alias)": "&#xf1c5;",
  "file-picture-o (alias)": "&#xf1c5;",
  "file-powerpoint-o": "&#xf1c4;",
  "file-sound-o (alias)": "&#xf1c7;",
  "file-text": "&#xf15c;",
  "file-text-o": "&#xf0f6;",
  "file-video-o": "&#xf1c8;",
  "file-word-o": "&#xf1c2;",
  "file-zip-o (alias)": "&#xf1c6;",
  "files-o": "&#xf0c5;",
  "film": "&#xf008;",
  "filter": "&#xf0b0;",
  "fire": "&#xf06d;",
  "fire-extinguisher": "&#xf134;",
  "firefox": "&#xf269;",
  "flag": "&#xf024;",
  "flag-checkered": "&#xf11e;",
  "flag-o": "&#xf11d;",
  "flash (alias)": "&#xf0e7;",
  "flask": "&#xf0c3;",
  "flickr": "&#xf16e;",
  "floppy-o": "&#xf0c7;",
  "folder": "&#xf07b;",
  "folder-o": "&#xf114;",
  "folder-open": "&#xf07c;",
  "folder-open-o": "&#xf115;",
  "font": "&#xf031;",
  "fonticons": "&#xf280;",
  "forumbee": "&#xf211;",
  "forward": "&#xf04e;",
  "foursquare": "&#xf180;",
  "frown-o": "&#xf119;",
  "futbol-o": "&#xf1e3;",
  "gamepad": "&#xf11b;",
  "gavel": "&#xf0e3;",
  "gbp": "&#xf154;",
  "ge (alias)": "&#xf1d1;",
  "gear (alias)": "&#xf013;",
  "gears (alias)": "&#xf085;",
  "genderless": "&#xf22d;",
  "get-pocket": "&#xf265;",
  "gg": "&#xf260;",
  "gg-circle": "&#xf261;",
  "gift": "&#xf06b;",
  "git": "&#xf1d3;",
  "git-square": "&#xf1d2;",
  "github": "&#xf09b;",
  "github-alt": "&#xf113;",
  "github-square": "&#xf092;",
  "gittip (alias)": "&#xf184;",
  "glass": "&#xf000;",
  "globe": "&#xf0ac;",
  "google": "&#xf1a0;",
  "google-plus": "&#xf0d5;",
  "google-plus-square": "&#xf0d4;",
  "google-wallet": "&#xf1ee;",
  "graduation-cap": "&#xf19d;",
  "gratipay": "&#xf184;",
  "group (alias)": "&#xf0c0;",
  "h-square": "&#xf0fd;",
  "hacker-news": "&#xf1d4;",
  "hand-grab-o (alias)": "&#xf255;",
  "hand-lizard-o": "&#xf258;",
  "hand-o-down": "&#xf0a7;",
  "hand-o-left": "&#xf0a5;",
  "hand-o-right": "&#xf0a4;",
  "hand-o-up": "&#xf0a6;",
  "hand-paper-o": "&#xf256;",
  "hand-peace-o": "&#xf25b;",
  "hand-pointer-o": "&#xf25a;",
  "hand-rock-o": "&#xf255;",
  "hand-scissors-o": "&#xf257;",
  "hand-spock-o": "&#xf259;",
  "hand-stop-o (alias)": "&#xf256;",
  "hdd-o": "&#xf0a0;",
  "header": "&#xf1dc;",
  "headphones": "&#xf025;",
  "heart": "&#xf004;",
  "heart-o": "&#xf08a;",
  "heartbeat": "&#xf21e;",
  "history": "&#xf1da;",
  "home": "&#xf015;",
  "hospital-o": "&#xf0f8;",
  "hotel (alias)": "&#xf236;",
  "hourglass": "&#xf254;",
  "hourglass-1 (alias)": "&#xf251;",
  "hourglass-2 (alias)": "&#xf252;",
  "hourglass-3 (alias)": "&#xf253;",
  "hourglass-end": "&#xf253;",
  "hourglass-half": "&#xf252;",
  "hourglass-o": "&#xf250;",
  "hourglass-start": "&#xf251;",
  "houzz": "&#xf27c;",
  "html5": "&#xf13b;",
  "i-cursor": "&#xf246;",
  "ils": "&#xf20b;",
  "image (alias)": "&#xf03e;",
  "inbox": "&#xf01c;",
  "indent": "&#xf03c;",
  "industry": "&#xf275;",
  "info": "&#xf129;",
  "info-circle": "&#xf05a;",
  "inr": "&#xf156;",
  "instagram": "&#xf16d;",
  "institution (alias)": "&#xf19c;",
  "internet-explorer": "&#xf26b;",
  "intersex (alias)": "&#xf224;",
  "ioxhost": "&#xf208;",
  "italic": "&#xf033;",
  "joomla": "&#xf1aa;",
  "jpy": "&#xf157;",
  "jsfiddle": "&#xf1cc;",
  "key": "&#xf084;",
  "keyboard-o": "&#xf11c;",
  "krw": "&#xf159;",
  "language": "&#xf1ab;",
  "laptop": "&#xf109;",
  "lastfm": "&#xf202;",
  "lastfm-square": "&#xf203;",
  "leaf": "&#xf06c;",
  "leanpub": "&#xf212;",
  "legal (alias)": "&#xf0e3;",
  "lemon-o": "&#xf094;",
  "level-down": "&#xf149;",
  "level-up": "&#xf148;",
  "life-bouy (alias)": "&#xf1cd;",
  "life-buoy (alias)": "&#xf1cd;",
  "life-ring": "&#xf1cd;",
  "life-saver (alias)": "&#xf1cd;",
  "lightbulb-o": "&#xf0eb;",
  "line-chart": "&#xf201;",
  "link": "&#xf0c1;",
  "linkedin": "&#xf0e1;",
  "linkedin-square": "&#xf08c;",
  "linux": "&#xf17c;",
  "list": "&#xf03a;",
  "list-alt": "&#xf022;",
  "list-ol": "&#xf0cb;",
  "list-ul": "&#xf0ca;",
  "location-arrow": "&#xf124;",
  "lock": "&#xf023;",
  "long-arrow-down": "&#xf175;",
  "long-arrow-left": "&#xf177;",
  "long-arrow-right": "&#xf178;",
  "long-arrow-up": "&#xf176;",
  "magic": "&#xf0d0;",
  "magnet": "&#xf076;",
  "mail-forward (alias)": "&#xf064;",
  "mail-reply (alias)": "&#xf112;",
  "mail-reply-all (alias)": "&#xf122;",
  "male": "&#xf183;",
  "map": "&#xf279;",
  "map-marker": "&#xf041;",
  "map-o": "&#xf278;",
  "map-pin": "&#xf276;",
  "map-signs": "&#xf277;",
  "mars": "&#xf222;",
  "mars-double": "&#xf227;",
  "mars-stroke": "&#xf229;",
  "mars-stroke-h": "&#xf22b;",
  "mars-stroke-v": "&#xf22a;",
  "maxcdn": "&#xf136;",
  "meanpath": "&#xf20c;",
  "medium": "&#xf23a;",
  "medkit": "&#xfa;",
  "meh-o": "&#xf11a;",
  "mercury": "&#xf223;",
  "microphone": "&#xf130;",
  "microphone-slash": "&#xf131;",
  "minus": "&#xf068;",
  "minus-circle": "&#xf056;",
  "minus-square": "&#xf146;",
  "minus-square-o": "&#xf147;",
  "mobile": "&#xf10b;",
  "mobile-phone (alias)": "&#xf10b;",
  "money": "&#xf0d6;",
  "moon-o": "&#xf186;",
  "mortar-board (alias)": "&#xf19d;",
  "motorcycle": "&#xf21c;",
  "mouse-pointer": "&#xf245;",
  "music": "&#xf001;",
  "navicon (alias)": "&#xf0c9;",
  "neuter": "&#xf22c;",
  "newspaper-o": "&#xf1ea;",
  "object-group": "&#xf247;",
  "object-ungroup": "&#xf248;",
  "odnoklassniki": "&#xf263;",
  "odnoklassniki-square": "&#xf264;",
  "opencart": "&#xf23d;",
  "openid": "&#xf19b;",
  "opera": "&#xf26a;",
  "optin-monster": "&#xf23c;",
  "outdent": "&#xf03b;",
  "pagelines": "&#xf18c;",
  "paint-brush": "&#xf1fc;",
  "paper-plane": "&#xf1d8;",
  "paper-plane-o": "&#xf1d9;",
  "paperclip": "&#xf0c6;",
  "paragraph": "&#xf1dd;",
  "paste (alias)": "&#xf0ea;",
  "pause": "&#xf04c;",
  "paw": "&#xf1b0;",
  "paypal": "&#xf1ed;",
  "pencil": "&#xf040;",
  "pencil-square": "&#xf14b;",
  "pencil-square-o": "&#xf044;",
  "phone": "&#xf095;",
  "phone-square": "&#xf098;",
  "photo (alias)": "&#xf03e;",
  "picture-o": "&#xf03e;",
  "pie-chart": "&#xf200;",
  "pied-piper": "&#xf1a7;",
  "pied-piper-alt": "&#xf1a8;",
  "pinterest": "&#xf0d2;",
  "pinterest-p": "&#xf231;",
  "pinterest-square": "&#xf0d3;",
  "plane": "&#xf072;",
  "play": "&#xf04b;",
  "play-circle": "&#xf144;",
  "play-circle-o": "&#xf01d;",
  "plug": "&#xf1e6;",
  "plus": "&#xf067;",
  "plus-circle": "&#xf055;",
  "plus-square": "&#xf0fe;",
  "plus-square-o": "&#xf196;",
  "power-off": "&#xf011;",
  "print": "&#xf02f;",
  "puzzle-piece": "&#xf12e;",
  "qq": "&#xf1d6;",
  "qrcode": "&#xf029;",
  "question": "&#xf128;",
  "question-circle": "&#xf059;",
  "quote-left": "&#xf10d;",
  "quote-right": "&#xf10e;",
  "ra (alias)": "&#xf1d0;",
  "random": "&#xf074;",
  "rebel": "&#xf1d0;",
  "recycle": "&#xf1b8;",
  "reddit": "&#xf1a1;",
  "reddit-square": "&#xf1a2;",
  "refresh": "&#xf021;",
  "registered": "&#xf25d;",
  "remove (alias)": "&#xf00d;",
  "renren": "&#xf18b;",
  "reorder (alias)": "&#xf0c9;",
  "repeat": "&#xf01e;",
  "reply": "&#xf112;",
  "reply-all": "&#xf122;",
  "retweet": "&#xf079;",
  "rmb (alias)": "&#xf157;",
  "road": "&#xf018;",
  "rocket": "&#xf135;",
  "rotate-left (alias)": "&#xf0e2;",
  "rotate-right (alias)": "&#xf01e;",
  "rouble (alias)": "&#xf158;",
  "rss": "&#xf09e;",
  "rss-square": "&#xf143;",
  "rub": "&#xf158;",
  "ruble (alias)": "&#xf158;",
  "rupee (alias)": "&#xf156;",
  "fari": "&#xf267;",
  "save (alias)": "&#xf0c7;",
  "scissors": "&#xf0c4;",
  "search": "&#xf002;",
  "search-minus": "&#xf010;",
  "search-plus": "&#xf00e;",
  "sellsy": "&#xf213;",
  "send (alias)": "&#xf1d8;",
  "send-o (alias)": "&#xf1d9;",
  "server": "&#xf233;",
  "share": "&#xf064;",
  "share-alt": "&#xf1e0;",
  "share-alt-square": "&#xf1e1;",
  "share-square": "&#xf14d;",
  "share-square-o": "&#xf045;",
  "shekel (alias)": "&#xf20b;",
  "sheqel (alias)": "&#xf20b;",
  "shield": "&#xf132;",
  "ship": "&#xf21a;",
  "shirtsinbulk": "&#xf214;",
  "shopping-cart": "&#xf07a;",
  "sign-in": "&#xf090;",
  "sign-out": "&#xf08b;",
  "signal": "&#xf012;",
  "simplybuilt": "&#xf215;",
  "sitemap": "&#xf0e8;",
  "skyatlas": "&#xf216;",
  "skype": "&#xf17e;",
  "slack": "&#xf198;",
  "sliders": "&#xf1de;",
  "slideshare": "&#xf1e7;",
  "smile-o": "&#xf118;",
  "soccer-ball-o (alias)": "&#xf1e3;",
  "sort": "&#xf0dc;",
  "sort-alpha-asc": "&#xf15d;",
  "sort-alpha-desc": "&#xf15e;",
  "sort-amount-asc": "&#xf160;",
  "sort-amount-desc": "&#xf161;",
  "sort-asc": "&#xf0de;",
  "sort-desc": "&#xf0dd;",
  "sort-down (alias)": "&#xf0dd;",
  "sort-numeric-asc": "&#xf162;",
  "sort-numeric-desc": "&#xf163;",
  "sort-up (alias)": "&#xf0de;",
  "soundcloud": "&#xf1be;",
  "space-shuttle": "&#xf197;",
  "spinner": "&#xf110;",
  "spoon": "&#xf1b1;",
  "spotify": "&#xf1bc;",
  "square": "&#xf0c8;",
  "square-o": "&#xf096;",
  "stack-exchange": "&#xf18d;",
  "stack-overflow": "&#xf16c;",
  "star": "&#xf005;",
  "star-half": "&#xf089;",
  "star-half-empty (alias)": "&#xf123;",
  "star-half-full (alias)": "&#xf123;",
  "star-half-o": "&#xf123;",
  "star-o": "&#xf006;",
  "steam": "&#xf1b6;",
  "steam-square": "&#xf1b7;",
  "step-backward": "&#xf048;",
  "step-forward": "&#xf051;",
  "stethoscope": "&#xf0f1;",
  "sticky-note": "&#xf249;",
  "sticky-note-o": "&#xf24a;",
  "stop": "&#xf04d;",
  "street-view": "&#xf21d;",
  "strikethrough": "&#xf0cc;",
  "stumbleupon": "&#xf1a4;",
  "stumbleupon-circle": "&#xf1a3;",
  "subscript": "&#xf12c;",
  "subway": "&#xf239;",
  "suitcase": "&#xf0f2;",
  "sun-o": "&#xf185;",
  "superscript": "&#xf12b;",
  "support (alias)": "&#xf1cd;",
  "table": "&#xf0ce;",
  "tablet": "&#xf10a;",
  "tachometer": "&#xf0e4;",
  "tag": "&#xf02b;",
  "tags": "&#xf02c;",
  "tasks": "&#xf0ae;",
  "taxi": "&#xf1ba;",
  "television": "&#xf26c;",
  "tencent-weibo": "&#xf1d5;",
  "terminal": "&#xf120;",
  "text-height": "&#xf034;",
  "text-width": "&#xf035;",
  "th": "&#xf00a;",
  "th-large": "&#xf009;",
  "th-list": "&#xf00b;",
  "thumb-tack": "&#xf08d;",
  "thumbs-down": "&#xf165;",
  "thumbs-o-down": "&#xf088;",
  "thumbs-o-up": "&#xf087;",
  "thumbs-up": "&#xf164;",
  "ticket": "&#xf145;",
  "times": "&#xf00d;",
  "times-circle": "&#xf057;",
  "times-circle-o": "&#xf05c;",
  "tint": "&#xf043;",
  "toggle-down (alias)": "&#xf150;",
  "toggle-left (alias)": "&#xf191;",
  "toggle-off": "&#xf204;",
  "toggle-on": "&#xf205;",
  "toggle-right (alias)": "&#xf152;",
  "toggle-up (alias)": "&#xf151;",
  "trademark": "&#xf25c;",
  "train": "&#xf238;",
  "transgender": "&#xf224;",
  "transgender-alt": "&#xf225;",
  "trash": "&#xf1f8;",
  "trash-o": "&#xf014;",
  "tree": "&#xf1bb;",
  "trello": "&#xf181;",
  "tripadvisor": "&#xf262;",
  "trophy": "&#xf091;",
  "truck": "&#xf0d1;",
  "try": "&#xf195;",
  "tty": "&#xf1e4;",
  "tumblr": "&#xf173;",
  "tumblr-square": "&#xf174;",
  "turkish-lira (alias)": "&#xf195;",
  "tv (alias)": "&#xf26c;",
  "twitch": "&#xf1e8;",
  "twitter": "&#xf099;",
  "twitter-square": "&#xf081;",
  "umbrella": "&#xf0e9;",
  "underline": "&#xf0cd;",
  "undo": "&#xf0e2;",
  "university": "&#xf19c;",
  "unlink (alias)": "&#xf127;",
  "unlock": "&#xf09c;",
  "unlock-alt": "&#xf13e;",
  "unsorted (alias)": "&#xf0dc;",
  "upload": "&#xf093;",
  "usd": "&#xf155;",
  "user": "&#xf007;",
  "user-md": "&#xf0f0;",
  "user-plus": "&#xf234;",
  "user-secret": "&#xf21b;",
  "user-times": "&#xf235;",
  "users": "&#xf0c0;",
  "venus": "&#xf221;",
  "venus-double": "&#xf226;",
  "venus-mars": "&#xf228;",
  "viacoin": "&#xf237;",
  "video-camera": "&#xf03d;",
  "vimeo": "&#xf27d;",
  "vimeo-square": "&#xf194;",
  "vine": "&#xf1ca;",
  "vk": "&#xf189;",
  "volume-down": "&#xf027;",
  "volume-off": "&#xf026;",
  "volume-up": "&#xf028;",
  "warning (alias)": "&#xf071;",
  "wechat (alias)": "&#xf1d7;",
  "weibo": "&#xf18a;",
  "weixin": "&#xf1d7;",
  "whatsapp": "&#xf232;",
  "wheelchair": "&#xf193;",
  "wifi": "&#xf1eb;",
  "wikipedia-w": "&#xf266;",
  "windows": "&#xf17a;",
  "won (alias)": "&#xf159;",
  "wordpress": "&#xf19a;",
  "wrench": "&#xf0ad;",
  "xing": "&#xf168;",
  "xing-square": "&#xf169;",
  "y-combinator": "&#xf23b;",
  "y-combinator-square (alias)": "&#xf1d4;",
  "yahoo": "&#xf19e;",
  "yc (alias)": "&#xf23b;",
  "yc-square (alias)": "&#xf1d4;",
  "yelp": "&#xf1e9;",
  "yen (alias)": "&#xf157;",
  "youtube": "&#xf167;",
  "youtube-play": "&#xf16a;",
  "youtube-square": "&#xf166;"
};

fontAwesomeCSS = "	/*!\n *  Font Awesome 4.4.0 by @davegandy - http://fontawesome.io - @fontawesome\n *  License - http://fontawesome.io/license (Font: SIL OFL 1.1, CSS: MIT License)\n */\n/* FONT PATH\n * -------------------------- */\n@font-face {\n  font-family: 'FontAwesome';\n  src: url('modules/fonts/fontawesome-webfont.eot?v=4.4.0');\n  src: url('modules/fonts/fontawesome-webfont.eot?#iefix&v=4.4.0') format('embedded-opentype'), url('modules/fonts/fontawesome-webfont.woff2?v=4.4.0') format('woff2'), url('modules/fonts/fontawesome-webfont.woff?v=4.4.0') format('woff'), url('modules/fonts/fontawesome-webfont.ttf?v=4.4.0') format('truetype'), url('modules/fonts/fontawesome-webfont.svg?v=4.4.0#fontawesomeregular') format('svg');\n  font-weight: normal;\n  font-style: normal;\n}\n.fa{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;text-rendering:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.fa-lg{font-size:1.33333333em;line-height:.75em;vertical-align:-15%}.fa-2x{font-size:2em}.fa-3x{font-size:3em}.fa-4x{font-size:4em}.fa-5x{font-size:5em}.fa-fw{width:1.28571429em;text-align:center}.fa-ul{padding-left:0;margin-left:2.14285714em;list-style-type:none}.fa-ul > li{position:relative}.fa-li{position:absolute;left:-2.14285714em;width:2.14285714em;top:.14285714em;text-align:center}.fa-li.fa-lg{left:-1.85714286em}.fa-border{padding:.2em .25em .15em;border:solid .08em #eee;border-radius:.1em}.fa-pull-left{float:left}.fa-pull-right{float:right}.fa.fa-pull-left{margin-right:.3em}.fa.fa-pull-right{margin-left:.3em}.pull-right{float:right}.pull-left{float:left}.fa.pull-left{margin-right:.3em}.fa.pull-right{margin-left:.3em}.fa-spin{-webkit-animation:fa-spin 2s infinite linear;animation:fa-spin 2s infinite linear}.fa-pulse{-webkit-animation:fa-spin 1s infinite steps(8);animation:fa-spin 1s infinite steps(8)}@-webkit-keyframes fa-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}100%{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}@keyframes fa-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}100%{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}.fa-rotate-90{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=1);-webkit-transform:rotate(90deg);-ms-transform:rotate(90deg);transform:rotate(90deg)}.fa-rotate-180{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=2);-webkit-transform:rotate(180deg);-ms-transform:rotate(180deg);transform:rotate(180deg)}.fa-rotate-270{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=3);-webkit-transform:rotate(270deg);-ms-transform:rotate(270deg);transform:rotate(270deg)}.fa-flip-horizontal{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=0,mirror=1);-webkit-transform:scale(-1,1);-ms-transform:scale(-1,1);transform:scale(-1,1)}.fa-flip-vertical{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=2,mirror=1);-webkit-transform:scale(1,-1);-ms-transform:scale(1,-1);transform:scale(1,-1)}:root .fa-rotate-90,:root .fa-rotate-180,:root .fa-rotate-270,:root .fa-flip-horizontal,:root .fa-flip-vertical{filter:none}.fa-stack{position:relative;display:inline-block;width:2em;height:2em;line-height:2em;vertical-align:middle}.fa-stack-1x,.fa-stack-2x{position:absolute;left:0;width:100%;text-align:center}.fa-stack-1x{line-height:inherit}.fa-stack-2x{font-size:2em}.fa-inverse{color:#fff}.fa-glass:before{content:\"\f000\"}.fa-music:before{content:\"\f001\"}.fa-search:before{content:\"\f002\"}.fa-envelope-o:before{content:\"\f003\"}.fa-heart:before{content:\"\f004\"}.fa-star:before{content:\"\f005\"}.fa-star-o:before{content:\"\f006\"}.fa-user:before{content:\"\f007\"}.fa-film:before{content:\"\f008\"}.fa-th-large:before{content:\"\f009\"}.fa-th:before{content:\"\f00a\"}.fa-th-list:before{content:\"\f00b\"}.fa-check:before{content:\"\f00c\"}.fa-remove:before,.fa-close:before,.fa-times:before{content:\"\f00d\"}.fa-search-plus:before{content:\"\f00e\"}.fa-search-minus:before{content:\"\f010\"}.fa-power-off:before{content:\"\f011\"}.fa-signal:before{content:\"\f012\"}.fa-gear:before,.fa-cog:before{content:\"\f013\"}.fa-trash-o:before{content:\"\f014\"}.fa-home:before{content:\"\f015\"}.fa-file-o:before{content:\"\f016\"}.fa-clock-o:before{content:\"\f017\"}.fa-road:before{content:\"\f018\"}.fa-download:before{content:\"\f019\"}.fa-arrow-circle-o-down:before{content:\"\f01a\"}.fa-arrow-circle-o-up:before{content:\"\f01b\"}.fa-inbox:before{content:\"\f01c\"}.fa-play-circle-o:before{content:\"\f01d\"}.fa-rotate-right:before,.fa-repeat:before{content:\"\f01e\"}.fa-refresh:before{content:\"\f021\"}.fa-list-alt:before{content:\"\f022\"}.fa-lock:before{content:\"\f023\"}.fa-flag:before{content:\"\f024\"}.fa-headphones:before{content:\"\f025\"}.fa-volume-off:before{content:\"\f026\"}.fa-volume-down:before{content:\"\f027\"}.fa-volume-up:before{content:\"\f028\"}.fa-qrcode:before{content:\"\f029\"}.fa-barcode:before{content:\"\f02a\"}.fa-tag:before{content:\"\f02b\"}.fa-tags:before{content:\"\f02c\"}.fa-book:before{content:\"\f02d\"}.fa-bookmark:before{content:\"\f02e\"}.fa-print:before{content:\"\f02f\"}.fa-camera:before{content:\"\f030\"}.fa-font:before{content:\"\f031\"}.fa-bold:before{content:\"\f032\"}.fa-italic:before{content:\"\f033\"}.fa-text-height:before{content:\"\f034\"}.fa-text-width:before{content:\"\f035\"}.fa-align-left:before{content:\"\f036\"}.fa-align-center:before{content:\"\f037\"}.fa-align-right:before{content:\"\f038\"}.fa-align-justify:before{content:\"\f039\"}.fa-list:before{content:\"\f03a\"}.fa-dedent:before,.fa-outdent:before{content:\"\f03b\"}.fa-indent:before{content:\"\f03c\"}.fa-video-camera:before{content:\"\f03d\"}.fa-photo:before,.fa-image:before,.fa-picture-o:before{content:\"\f03e\"}.fa-pencil:before{content:\"\f040\"}.fa-map-marker:before{content:\"\f041\"}.fa-adjust:before{content:\"\f042\"}.fa-tint:before{content:\"\f043\"}.fa-edit:before,.fa-pencil-square-o:before{content:\"\f044\"}.fa-share-square-o:before{content:\"\f045\"}.fa-check-square-o:before{content:\"\f046\"}.fa-arrows:before{content:\"\f047\"}.fa-step-backward:before{content:\"\f048\"}.fa-fast-backward:before{content:\"\f049\"}.fa-backward:before{content:\"\f04a\"}.fa-play:before{content:\"\f04b\"}.fa-pause:before{content:\"\f04c\"}.fa-stop:before{content:\"\f04d\"}.fa-forward:before{content:\"\f04e\"}.fa-fast-forward:before{content:\"\f050\"}.fa-step-forward:before{content:\"\f051\"}.fa-eject:before{content:\"\f052\"}.fa-chevron-left:before{content:\"\f053\"}.fa-chevron-right:before{content:\"\f054\"}.fa-plus-circle:before{content:\"\f055\"}.fa-minus-circle:before{content:\"\f056\"}.fa-times-circle:before{content:\"\f057\"}.fa-check-circle:before{content:\"\f058\"}.fa-question-circle:before{content:\"\f059\"}.fa-info-circle:before{content:\"\f05a\"}.fa-crosshairs:before{content:\"\f05b\"}.fa-times-circle-o:before{content:\"\f05c\"}.fa-check-circle-o:before{content:\"\f05d\"}.fa-ban:before{content:\"\f05e\"}.fa-arrow-left:before{content:\"\f060\"}.fa-arrow-right:before{content:\"\f061\"}.fa-arrow-up:before{content:\"\f062\"}.fa-arrow-down:before{content:\"\f063\"}.fa-mail-forward:before,.fa-share:before{content:\"\f064\"}.fa-expand:before{content:\"\f065\"}.fa-compress:before{content:\"\f066\"}.fa-plus:before{content:\"\f067\"}.fa-minus:before{content:\"\f068\"}.fa-asterisk:before{content:\"\f069\"}.fa-exclamation-circle:before{content:\"\f06a\"}.fa-gift:before{content:\"\f06b\"}.fa-leaf:before{content:\"\f06c\"}.fa-fire:before{content:\"\f06d\"}.fa-eye:before{content:\"\f06e\"}.fa-eye-slash:before{content:\"\f070\"}.fa-warning:before,.fa-exclamation-triangle:before{content:\"\f071\"}.fa-plane:before{content:\"\f072\"}.fa-calendar:before{content:\"\f073\"}.fa-random:before{content:\"\f074\"}.fa-comment:before{content:\"\f075\"}.fa-magnet:before{content:\"\f076\"}.fa-chevron-up:before{content:\"\f077\"}.fa-chevron-down:before{content:\"\f078\"}.fa-retweet:before{content:\"\f079\"}.fa-shopping-cart:before{content:\"\f07a\"}.fa-folder:before{content:\"\f07b\"}.fa-folder-open:before{content:\"\f07c\"}.fa-arrows-v:before{content:\"\f07d\"}.fa-arrows-h:before{content:\"\f07e\"}.fa-bar-chart-o:before,.fa-bar-chart:before{content:\"\f080\"}.fa-twitter-square:before{content:\"\f081\"}.fa-facebook-square:before{content:\"\f082\"}.fa-camera-retro:before{content:\"\f083\"}.fa-key:before{content:\"\f084\"}.fa-gears:before,.fa-cogs:before{content:\"\f085\"}.fa-comments:before{content:\"\f086\"}.fa-thumbs-o-up:before{content:\"\f087\"}.fa-thumbs-o-down:before{content:\"\f088\"}.fa-star-half:before{content:\"\f089\"}.fa-heart-o:before{content:\"\f08a\"}.fa-sign-out:before{content:\"\f08b\"}.fa-linkedin-square:before{content:\"\f08c\"}.fa-thumb-tack:before{content:\"\f08d\"}.fa-external-link:before{content:\"\f08e\"}.fa-sign-in:before{content:\"\f090\"}.fa-trophy:before{content:\"\f091\"}.fa-github-square:before{content:\"\f092\"}.fa-upload:before{content:\"\f093\"}.fa-lemon-o:before{content:\"\f094\"}.fa-phone:before{content:\"\f095\"}.fa-square-o:before{content:\"\f096\"}.fa-bookmark-o:before{content:\"\f097\"}.fa-phone-square:before{content:\"\f098\"}.fa-twitter:before{content:\"\f099\"}.fa-facebook-f:before,.fa-facebook:before{content:\"\f09a\"}.fa-github:before{content:\"\f09b\"}.fa-unlock:before{content:\"\f09c\"}.fa-credit-card:before{content:\"\f09d\"}.fa-feed:before,.fa-rss:before{content:\"\f09e\"}.fa-hdd-o:before{content:\"\f0a0\"}.fa-bullhorn:before{content:\"\f0a1\"}.fa-bell:before{content:\"\f0f3\"}.fa-certificate:before{content:\"\f0a3\"}.fa-hand-o-right:before{content:\"\f0a4\"}.fa-hand-o-left:before{content:\"\f0a5\"}.fa-hand-o-up:before{content:\"\f0a6\"}.fa-hand-o-down:before{content:\"\f0a7\"}.fa-arrow-circle-left:before{content:\"\f0a8\"}.fa-arrow-circle-right:before{content:\"\f0a9\"}.fa-arrow-circle-up:before{content:\"\f0aa\"}.fa-arrow-circle-down:before{content:\"\f0ab\"}.fa-globe:before{content:\"\f0ac\"}.fa-wrench:before{content:\"\f0ad\"}.fa-tasks:before{content:\"\f0ae\"}.fa-filter:before{content:\"\f0b0\"}.fa-briefcase:before{content:\"\f0b1\"}.fa-arrows-alt:before{content:\"\f0b2\"}.fa-group:before,.fa-users:before{content:\"\f0c0\"}.fa-chain:before,.fa-link:before{content:\"\f0c1\"}.fa-cloud:before{content:\"\f0c2\"}.fa-flask:before{content:\"\f0c3\"}.fa-cut:before,.fa-scissors:before{content:\"\f0c4\"}.fa-copy:before,.fa-files-o:before{content:\"\f0c5\"}.fa-paperclip:before{content:\"\f0c6\"}.fa-save:before,.fa-floppy-o:before{content:\"\f0c7\"}.fa-square:before{content:\"\f0c8\"}.fa-navicon:before,.fa-reorder:before,.fa-bars:before{content:\"\f0c9\"}.fa-list-ul:before{content:\"\f0ca\"}.fa-list-ol:before{content:\"\f0cb\"}.fa-strikethrough:before{content:\"\f0cc\"}.fa-underline:before{content:\"\f0cd\"}.fa-table:before{content:\"\f0ce\"}.fa-magic:before{content:\"\f0d0\"}.fa-truck:before{content:\"\f0d1\"}.fa-pinterest:before{content:\"\f0d2\"}.fa-pinterest-square:before{content:\"\f0d3\"}.fa-google-plus-square:before{content:\"\f0d4\"}.fa-google-plus:before{content:\"\f0d5\"}.fa-money:before{content:\"\f0d6\"}.fa-caret-down:before{content:\"\f0d7\"}.fa-caret-up:before{content:\"\f0d8\"}.fa-caret-left:before{content:\"\f0d9\"}.fa-caret-right:before{content:\"\f0da\"}.fa-columns:before{content:\"\f0db\"}.fa-unsorted:before,.fa-sort:before{content:\"\f0dc\"}.fa-sort-down:before,.fa-sort-desc:before{content:\"\f0dd\"}.fa-sort-up:before,.fa-sort-asc:before{content:\"\f0de\"}.fa-envelope:before{content:\"\f0e0\"}.fa-linkedin:before{content:\"\f0e1\"}.fa-rotate-left:before,.fa-undo:before{content:\"\f0e2\"}.fa-legal:before,.fa-gavel:before{content:\"\f0e3\"}.fa-dashboard:before,.fa-tachometer:before{content:\"\f0e4\"}.fa-comment-o:before{content:\"\f0e5\"}.fa-comments-o:before{content:\"\f0e6\"}.fa-flash:before,.fa-bolt:before{content:\"\f0e7\"}.fa-sitemap:before{content:\"\f0e8\"}.fa-umbrella:before{content:\"\f0e9\"}.fa-paste:before,.fa-clipboard:before{content:\"\f0ea\"}.fa-lightbulb-o:before{content:\"\f0eb\"}.fa-exchange:before{content:\"\f0ec\"}.fa-cloud-download:before{content:\"\f0ed\"}.fa-cloud-upload:before{content:\"\f0ee\"}.fa-user-md:before{content:\"\f0f0\"}.fa-stethoscope:before{content:\"\f0f1\"}.fa-suitcase:before{content:\"\f0f2\"}.fa-bell-o:before{content:\"\f0a2\"}.fa-coffee:before{content:\"\f0f4\"}.fa-cutlery:before{content:\"\f0f5\"}.fa-file-text-o:before{content:\"\f0f6\"}.fa-building-o:before{content:\"\f0f7\"}.fa-hospital-o:before{content:\"\f0f8\"}.fa-ambulance:before{content:\"\f0f9\"}.fa-medkit:before{content:\"\f0fa\"}.fa-fighter-jet:before{content:\"\f0fb\"}.fa-beer:before{content:\"\f0fc\"}.fa-h-square:before{content:\"\f0fd\"}.fa-plus-square:before{content:\"\f0fe\"}.fa-angle-double-left:before{content:\"\f100\"}.fa-angle-double-right:before{content:\"\f101\"}.fa-angle-double-up:before{content:\"\f102\"}.fa-angle-double-down:before{content:\"\f103\"}.fa-angle-left:before{content:\"\f104\"}.fa-angle-right:before{content:\"\f105\"}.fa-angle-up:before{content:\"\f106\"}.fa-angle-down:before{content:\"\f107\"}.fa-desktop:before{content:\"\f108\"}.fa-laptop:before{content:\"\f109\"}.fa-tablet:before{content:\"\f10a\"}.fa-mobile-phone:before,.fa-mobile:before{content:\"\f10b\"}.fa-circle-o:before{content:\"\f10c\"}.fa-quote-left:before{content:\"\f10d\"}.fa-quote-right:before{content:\"\f10e\"}.fa-spinner:before{content:\"\f110\"}.fa-circle:before{content:\"\f111\"}.fa-mail-reply:before,.fa-reply:before{content:\"\f112\"}.fa-github-alt:before{content:\"\f113\"}.fa-folder-o:before{content:\"\f114\"}.fa-folder-open-o:before{content:\"\f115\"}.fa-smile-o:before{content:\"\f118\"}.fa-frown-o:before{content:\"\f119\"}.fa-meh-o:before{content:\"\f11a\"}.fa-gamepad:before{content:\"\f11b\"}.fa-keyboard-o:before{content:\"\f11c\"}.fa-flag-o:before{content:\"\f11d\"}.fa-flag-checkered:before{content:\"\f11e\"}.fa-terminal:before{content:\"\f120\"}.fa-code:before{content:\"\f121\"}.fa-mail-reply-all:before,.fa-reply-all:before{content:\"\f122\"}.fa-star-half-empty:before,.fa-star-half-full:before,.fa-star-half-o:before{content:\"\f123\"}.fa-location-arrow:before{content:\"\f124\"}.fa-crop:before{content:\"\f125\"}.fa-code-fork:before{content:\"\f126\"}.fa-unlink:before,.fa-chain-broken:before{content:\"\f127\"}.fa-question:before{content:\"\f128\"}.fa-info:before{content:\"\f129\"}.fa-exclamation:before{content:\"\f12a\"}.fa-superscript:before{content:\"\f12b\"}.fa-subscript:before{content:\"\f12c\"}.fa-eraser:before{content:\"\f12d\"}.fa-puzzle-piece:before{content:\"\f12e\"}.fa-microphone:before{content:\"\f130\"}.fa-microphone-slash:before{content:\"\f131\"}.fa-shield:before{content:\"\f132\"}.fa-calendar-o:before{content:\"\f133\"}.fa-fire-extinguisher:before{content:\"\f134\"}.fa-rocket:before{content:\"\f135\"}.fa-maxcdn:before{content:\"\f136\"}.fa-chevron-circle-left:before{content:\"\f137\"}.fa-chevron-circle-right:before{content:\"\f138\"}.fa-chevron-circle-up:before{content:\"\f139\"}.fa-chevron-circle-down:before{content:\"\f13a\"}.fa-html5:before{content:\"\f13b\"}.fa-css3:before{content:\"\f13c\"}.fa-anchor:before{content:\"\f13d\"}.fa-unlock-alt:before{content:\"\f13e\"}.fa-bullseye:before{content:\"\f140\"}.fa-ellipsis-h:before{content:\"\f141\"}.fa-ellipsis-v:before{content:\"\f142\"}.fa-rss-square:before{content:\"\f143\"}.fa-play-circle:before{content:\"\f144\"}.fa-ticket:before{content:\"\f145\"}.fa-minus-square:before{content:\"\f146\"}.fa-minus-square-o:before{content:\"\f147\"}.fa-level-up:before{content:\"\f148\"}.fa-level-down:before{content:\"\f149\"}.fa-check-square:before{content:\"\f14a\"}.fa-pencil-square:before{content:\"\f14b\"}.fa-external-link-square:before{content:\"\f14c\"}.fa-share-square:before{content:\"\f14d\"}.fa-compass:before{content:\"\f14e\"}.fa-toggle-down:before,.fa-caret-square-o-down:before{content:\"\f150\"}.fa-toggle-up:before,.fa-caret-square-o-up:before{content:\"\f151\"}.fa-toggle-right:before,.fa-caret-square-o-right:before{content:\"\f152\"}.fa-euro:before,.fa-eur:before{content:\"\f153\"}.fa-gbp:before{content:\"\f154\"}.fa-dollar:before,.fa-usd:before{content:\"\f155\"}.fa-rupee:before,.fa-inr:before{content:\"\f156\"}.fa-cny:before,.fa-rmb:before,.fa-yen:before,.fa-jpy:before{content:\"\f157\"}.fa-ruble:before,.fa-rouble:before,.fa-rub:before{content:\"\f158\"}.fa-won:before,.fa-krw:before{content:\"\f159\"}.fa-bitcoin:before,.fa-btc:before{content:\"\f15a\"}.fa-file:before{content:\"\f15b\"}.fa-file-text:before{content:\"\f15c\"}.fa-sort-alpha-asc:before{content:\"\f15d\"}.fa-sort-alpha-desc:before{content:\"\f15e\"}.fa-sort-amount-asc:before{content:\"\f160\"}.fa-sort-amount-desc:before{content:\"\f161\"}.fa-sort-numeric-asc:before{content:\"\f162\"}.fa-sort-numeric-desc:before{content:\"\f163\"}.fa-thumbs-up:before{content:\"\f164\"}.fa-thumbs-down:before{content:\"\f165\"}.fa-youtube-square:before{content:\"\f166\"}.fa-youtube:before{content:\"\f167\"}.fa-xing:before{content:\"\f168\"}.fa-xing-square:before{content:\"\f169\"}.fa-youtube-play:before{content:\"\f16a\"}.fa-dropbox:before{content:\"\f16b\"}.fa-stack-overflow:before{content:\"\f16c\"}.fa-instagram:before{content:\"\f16d\"}.fa-flickr:before{content:\"\f16e\"}.fa-adn:before{content:\"\f170\"}.fa-bitbucket:before{content:\"\f171\"}.fa-bitbucket-square:before{content:\"\f172\"}.fa-tumblr:before{content:\"\f173\"}.fa-tumblr-square:before{content:\"\f174\"}.fa-long-arrow-down:before{content:\"\f175\"}.fa-long-arrow-up:before{content:\"\f176\"}.fa-long-arrow-left:before{content:\"\f177\"}.fa-long-arrow-right:before{content:\"\f178\"}.fa-apple:before{content:\"\f179\"}.fa-windows:before{content:\"\f17a\"}.fa-android:before{content:\"\f17b\"}.fa-linux:before{content:\"\f17c\"}.fa-dribbble:before{content:\"\f17d\"}.fa-skype:before{content:\"\f17e\"}.fa-foursquare:before{content:\"\f180\"}.fa-trello:before{content:\"\f181\"}.fa-female:before{content:\"\f182\"}.fa-male:before{content:\"\f183\"}.fa-gittip:before,.fa-gratipay:before{content:\"\f184\"}.fa-sun-o:before{content:\"\f185\"}.fa-moon-o:before{content:\"\f186\"}.fa-archive:before{content:\"\f187\"}.fa-bug:before{content:\"\f188\"}.fa-vk:before{content:\"\f189\"}.fa-weibo:before{content:\"\f18a\"}.fa-renren:before{content:\"\f18b\"}.fa-pagelines:before{content:\"\f18c\"}.fa-stack-exchange:before{content:\"\f18d\"}.fa-arrow-circle-o-right:before{content:\"\f18e\"}.fa-arrow-circle-o-left:before{content:\"\f190\"}.fa-toggle-left:before,.fa-caret-square-o-left:before{content:\"\f191\"}.fa-dot-circle-o:before{content:\"\f192\"}.fa-wheelchair:before{content:\"\f193\"}.fa-vimeo-square:before{content:\"\f194\"}.fa-turkish-lira:before,.fa-try:before{content:\"\f195\"}.fa-plus-square-o:before{content:\"\f196\"}.fa-space-shuttle:before{content:\"\f197\"}.fa-slack:before{content:\"\f198\"}.fa-envelope-square:before{content:\"\f199\"}.fa-wordpress:before{content:\"\f19a\"}.fa-openid:before{content:\"\f19b\"}.fa-institution:before,.fa-bank:before,.fa-university:before{content:\"\f19c\"}.fa-mortar-board:before,.fa-graduation-cap:before{content:\"\f19d\"}.fa-yahoo:before{content:\"\f19e\"}.fa-google:before{content:\"\f1a0\"}.fa-reddit:before{content:\"\f1a1\"}.fa-reddit-square:before{content:\"\f1a2\"}.fa-stumbleupon-circle:before{content:\"\f1a3\"}.fa-stumbleupon:before{content:\"\f1a4\"}.fa-delicious:before{content:\"\f1a5\"}.fa-digg:before{content:\"\f1a6\"}.fa-pied-piper:before{content:\"\f1a7\"}.fa-pied-piper-alt:before{content:\"\f1a8\"}.fa-drupal:before{content:\"\f1a9\"}.fa-joomla:before{content:\"\f1aa\"}.fa-language:before{content:\"\f1ab\"}.fa-fax:before{content:\"\f1ac\"}.fa-building:before{content:\"\f1ad\"}.fa-child:before{content:\"\f1ae\"}.fa-paw:before{content:\"\f1b0\"}.fa-spoon:before{content:\"\f1b1\"}.fa-cube:before{content:\"\f1b2\"}.fa-cubes:before{content:\"\f1b3\"}.fa-behance:before{content:\"\f1b4\"}.fa-behance-square:before{content:\"\f1b5\"}.fa-steam:before{content:\"\f1b6\"}.fa-steam-square:before{content:\"\f1b7\"}.fa-recycle:before{content:\"\f1b8\"}.fa-automobile:before,.fa-car:before{content:\"\f1b9\"}.fa-cab:before,.fa-taxi:before{content:\"\f1ba\"}.fa-tree:before{content:\"\f1bb\"}.fa-spotify:before{content:\"\f1bc\"}.fa-deviantart:before{content:\"\f1bd\"}.fa-soundcloud:before{content:\"\f1be\"}.fa-database:before{content:\"\f1c0\"}.fa-file-pdf-o:before{content:\"\f1c1\"}.fa-file-word-o:before{content:\"\f1c2\"}.fa-file-excel-o:before{content:\"\f1c3\"}.fa-file-powerpoint-o:before{content:\"\f1c4\"}.fa-file-photo-o:before,.fa-file-picture-o:before,.fa-file-image-o:before{content:\"\f1c5\"}.fa-file-zip-o:before,.fa-file-archive-o:before{content:\"\f1c6\"}.fa-file-sound-o:before,.fa-file-audio-o:before{content:\"\f1c7\"}.fa-file-movie-o:before,.fa-file-video-o:before{content:\"\f1c8\"}.fa-file-code-o:before{content:\"\f1c9\"}.fa-vine:before{content:\"\f1ca\"}.fa-codepen:before{content:\"\f1cb\"}.fa-jsfiddle:before{content:\"\f1cc\"}.fa-life-bouy:before,.fa-life-buoy:before,.fa-life-saver:before,.fa-support:before,.fa-life-ring:before{content:\"\f1cd\"}.fa-circle-o-notch:before{content:\"\f1ce\"}.fa-ra:before,.fa-rebel:before{content:\"\f1d0\"}.fa-ge:before,.fa-empire:before{content:\"\f1d1\"}.fa-git-square:before{content:\"\f1d2\"}.fa-git:before{content:\"\f1d3\"}.fa-y-combinator-square:before,.fa-yc-square:before,.fa-hacker-news:before{content:\"\f1d4\"}.fa-tencent-weibo:before{content:\"\f1d5\"}.fa-qq:before{content:\"\f1d6\"}.fa-wechat:before,.fa-weixin:before{content:\"\f1d7\"}.fa-send:before,.fa-paper-plane:before{content:\"\f1d8\"}.fa-send-o:before,.fa-paper-plane-o:before{content:\"\f1d9\"}.fa-history:before{content:\"\f1da\"}.fa-circle-thin:before{content:\"\f1db\"}.fa-header:before{content:\"\f1dc\"}.fa-paragraph:before{content:\"\f1dd\"}.fa-sliders:before{content:\"\f1de\"}.fa-share-alt:before{content:\"\f1e0\"}.fa-share-alt-square:before{content:\"\f1e1\"}.fa-bomb:before{content:\"\f1e2\"}.fa-soccer-ball-o:before,.fa-futbol-o:before{content:\"\f1e3\"}.fa-tty:before{content:\"\f1e4\"}.fa-binoculars:before{content:\"\f1e5\"}.fa-plug:before{content:\"\f1e6\"}.fa-slideshare:before{content:\"\f1e7\"}.fa-twitch:before{content:\"\f1e8\"}.fa-yelp:before{content:\"\f1e9\"}.fa-newspaper-o:before{content:\"\f1ea\"}.fa-wifi:before{content:\"\f1eb\"}.fa-calculator:before{content:\"\f1ec\"}.fa-paypal:before{content:\"\f1ed\"}.fa-google-wallet:before{content:\"\f1ee\"}.fa-cc-visa:before{content:\"\f1f0\"}.fa-cc-mastercard:before{content:\"\f1f1\"}.fa-cc-discover:before{content:\"\f1f2\"}.fa-cc-amex:before{content:\"\f1f3\"}.fa-cc-paypal:before{content:\"\f1f4\"}.fa-cc-stripe:before{content:\"\f1f5\"}.fa-bell-slash:before{content:\"\f1f6\"}.fa-bell-slash-o:before{content:\"\f1f7\"}.fa-trash:before{content:\"\f1f8\"}.fa-copyright:before{content:\"\f1f9\"}.fa-at:before{content:\"\f1fa\"}.fa-eyedropper:before{content:\"\f1fb\"}.fa-paint-brush:before{content:\"\f1fc\"}.fa-birthday-cake:before{content:\"\f1fd\"}.fa-area-chart:before{content:\"\f1fe\"}.fa-pie-chart:before{content:\"\f200\"}.fa-line-chart:before{content:\"\f201\"}.fa-lastfm:before{content:\"\f202\"}.fa-lastfm-square:before{content:\"\f203\"}.fa-toggle-off:before{content:\"\f204\"}.fa-toggle-on:before{content:\"\f205\"}.fa-bicycle:before{content:\"\f206\"}.fa-bus:before{content:\"\f207\"}.fa-ioxhost:before{content:\"\f208\"}.fa-angellist:before{content:\"\f209\"}.fa-cc:before{content:\"\f20a\"}.fa-shekel:before,.fa-sheqel:before,.fa-ils:before{content:\"\f20b\"}.fa-meanpath:before{content:\"\f20c\"}.fa-buysellads:before{content:\"\f20d\"}.fa-connectdevelop:before{content:\"\f20e\"}.fa-dashcube:before{content:\"\f210\"}.fa-forumbee:before{content:\"\f211\"}.fa-leanpub:before{content:\"\f212\"}.fa-sellsy:before{content:\"\f213\"}.fa-shirtsinbulk:before{content:\"\f214\"}.fa-simplybuilt:before{content:\"\f215\"}.fa-skyatlas:before{content:\"\f216\"}.fa-cart-plus:before{content:\"\f217\"}.fa-cart-arrow-down:before{content:\"\f218\"}.fa-diamond:before{content:\"\f219\"}.fa-ship:before{content:\"\f21a\"}.fa-user-secret:before{content:\"\f21b\"}.fa-motorcycle:before{content:\"\f21c\"}.fa-street-view:before{content:\"\f21d\"}.fa-heartbeat:before{content:\"\f21e\"}.fa-venus:before{content:\"\f221\"}.fa-mars:before{content:\"\f222\"}.fa-mercury:before{content:\"\f223\"}.fa-intersex:before,.fa-transgender:before{content:\"\f224\"}.fa-transgender-alt:before{content:\"\f225\"}.fa-venus-double:before{content:\"\f226\"}.fa-mars-double:before{content:\"\f227\"}.fa-venus-mars:before{content:\"\f228\"}.fa-mars-stroke:before{content:\"\f229\"}.fa-mars-stroke-v:before{content:\"\f22a\"}.fa-mars-stroke-h:before{content:\"\f22b\"}.fa-neuter:before{content:\"\f22c\"}.fa-genderless:before{content:\"\f22d\"}.fa-facebook-official:before{content:\"\f230\"}.fa-pinterest-p:before{content:\"\f231\"}.fa-whatsapp:before{content:\"\f232\"}.fa-server:before{content:\"\f233\"}.fa-user-plus:before{content:\"\f234\"}.fa-user-times:before{content:\"\f235\"}.fa-hotel:before,.fa-bed:before{content:\"\f236\"}.fa-viacoin:before{content:\"\f237\"}.fa-train:before{content:\"\f238\"}.fa-subway:before{content:\"\f239\"}.fa-medium:before{content:\"\f23a\"}.fa-yc:before,.fa-y-combinator:before{content:\"\f23b\"}.fa-optin-monster:before{content:\"\f23c\"}.fa-opencart:before{content:\"\f23d\"}.fa-expeditedssl:before{content:\"\f23e\"}.fa-battery-4:before,.fa-battery-full:before{content:\"\f240\"}.fa-battery-3:before,.fa-battery-three-quarters:before{content:\"\f241\"}.fa-battery-2:before,.fa-battery-half:before{content:\"\f242\"}.fa-battery-1:before,.fa-battery-quarter:before{content:\"\f243\"}.fa-battery-0:before,.fa-battery-empty:before{content:\"\f244\"}.fa-mouse-pointer:before{content:\"\f245\"}.fa-i-cursor:before{content:\"\f246\"}.fa-object-group:before{content:\"\f247\"}.fa-object-ungroup:before{content:\"\f248\"}.fa-sticky-note:before{content:\"\f249\"}.fa-sticky-note-o:before{content:\"\f24a\"}.fa-cc-jcb:before{content:\"\f24b\"}.fa-cc-diners-club:before{content:\"\f24c\"}.fa-clone:before{content:\"\f24d\"}.fa-balance-scale:before{content:\"\f24e\"}.fa-hourglass-o:before{content:\"\f250\"}.fa-hourglass-1:before,.fa-hourglass-start:before{content:\"\f251\"}.fa-hourglass-2:before,.fa-hourglass-half:before{content:\"\f252\"}.fa-hourglass-3:before,.fa-hourglass-end:before{content:\"\f253\"}.fa-hourglass:before{content:\"\f254\"}.fa-hand-grab-o:before,.fa-hand-rock-o:before{content:\"\f255\"}.fa-hand-stop-o:before,.fa-hand-paper-o:before{content:\"\f256\"}.fa-hand-scissors-o:before{content:\"\f257\"}.fa-hand-lizard-o:before{content:\"\f258\"}.fa-hand-spock-o:before{content:\"\f259\"}.fa-hand-pointer-o:before{content:\"\f25a\"}.fa-hand-peace-o:before{content:\"\f25b\"}.fa-trademark:before{content:\"\f25c\"}.fa-registered:before{content:\"\f25d\"}.fa-creative-commons:before{content:\"\f25e\"}.fa-gg:before{content:\"\f260\"}.fa-gg-circle:before{content:\"\f261\"}.fa-tripadvisor:before{content:\"\f262\"}.fa-odnoklassniki:before{content:\"\f263\"}.fa-odnoklassniki-square:before{content:\"\f264\"}.fa-get-pocket:before{content:\"\f265\"}.fa-wikipedia-w:before{content:\"\f266\"}.fa-safari:before{content:\"\f267\"}.fa-chrome:before{content:\"\f268\"}.fa-firefox:before{content:\"\f269\"}.fa-opera:before{content:\"\f26a\"}.fa-internet-explorer:before{content:\"\f26b\"}.fa-tv:before,.fa-television:before{content:\"\f26c\"}.fa-contao:before{content:\"\f26d\"}.fa-500px:before{content:\"\f26e\"}.fa-amazon:before{content:\"\f270\"}.fa-calendar-plus-o:before{content:\"\f271\"}.fa-calendar-minus-o:before{content:\"\f272\"}.fa-calendar-times-o:before{content:\"\f273\"}.fa-calendar-check-o:before{content:\"\f274\"}.fa-industry:before{content:\"\f275\"}.fa-map-pin:before{content:\"\f276\"}.fa-map-signs:before{content:\"\f277\"}.fa-map-o:before{content:\"\f278\"}.fa-map:before{content:\"\f279\"}.fa-commenting:before{content:\"\f27a\"}.fa-commenting-o:before{content:\"\f27b\"}.fa-houzz:before{content:\"\f27c\"}.fa-vimeo:before{content:\"\f27d\"}.fa-black-tie:before{content:\"\f27e\"}.fa-fonticons:before{content:\"\f280\"}";

module.exports = (function(superClass) {
  extend(exports, superClass);

  function exports(options) {
    var faImported;
    if (options == null) {
      options = {};
    }
    if (options.backgroundColor == null) {
      options.backgroundColor = '';
    }
    if (options.color == null) {
      options.color = 'black';
    }
    if (options.clip == null) {
      options.clip = false;
    }
    if (options.fontSize == null) {
      options.fontSize = 40;
    }
    faImported = document.getElementsByClassName('fa');
    if (faImported.length === 0) {
      Utils.insertCSS(fontAwesomeCSS);
    }
    exports.__super__.constructor.apply(this, arguments);
    this.style = {
      fontFamily: 'FontAwesome'
    };
  }

  exports.define("icon", {
    get: function() {
      return this.html;
    },
    set: function(val) {
      val = val.replace('fa-', '');
      if (classNames[val] != null) {
        return this.html = classNames[val];
      } else {
        return this.html = val;
      }
    }
  });

  exports.define("fontSize", {
    set: function(val) {
      var size, style;
      this.style.fontSize = val + 'px';
      this.style.lineHeight = val + 'px';
      style = {
        fontFamily: 'FontAwesome',
        fontSize: val + 'px',
        lineHeight: val + 'px'
      };
      size = Utils.textSize(this.icon, style);
      this.width = size.width;
      return this.height = size.height;
    }
  });

  exports.define("color", {
    set: function(val) {
      return this.style.color = val;
    }
  });

  return exports;

})(Layer);


},{}],"framer-camera-input/CameraInput":[function(require,module,exports){
var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

exports.CameraInput = (function(superClass) {
  extend(CameraInput, superClass);

  function CameraInput(options) {
    this.options = options != null ? options : {};
    _.defaults(this.options, {
      ignoreEvents: false
    });
    CameraInput.__super__.constructor.call(this, this.options);
    this.changeHandler = function(event) {
      var file, url;
      if (this.options.callback) {
        file = this._element.files[0];
        url = URL.createObjectURL(file);
        return this.options.callback(url, file.type);
      }
    };
    this.changeHandler = this.changeHandler.bind(this);
    Events.wrap(this._element).addEventListener("change", this.changeHandler);
  }

  CameraInput.prototype._createElement = function() {
    if (this._element != null) {
      return;
    }
    this._element = document.createElement("input");
    this._element.type = "file";
    this._element.capture = true;
    this._element.classList.add("framerLayer");
    this._element.style["-webkit-appearance"] = "none";
    this._element.style["-webkit-text-size-adjust"] = "none";
    this._element.style["outline"] = "none";
    switch (this.options.accept) {
      case "image":
        return this._element.accept = "image/*";
      case "video":
        return this._element.accept = "video/*";
      default:
        return this._element.accept = "image/*,video/*";
    }
  };

  CameraInput.define("accept", {
    get: function() {
      return this._element.accept;
    },
    set: function(value) {
      switch (value) {
        case "image":
          return this._element.accept = "image/*";
        case "video":
          return this._element.accept = "video/*";
        default:
          return this._element.accept = "image/*,video/*";
      }
    }
  });

  return CameraInput;

})(TextLayer);


},{}],"input-framer/input":[function(require,module,exports){
var _inputStyle, calculatePixelRatio, growthRatio, imageHeight,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

exports.keyboardLayer = new Layer({
  x: 0,
  y: Screen.height,
  width: Screen.width,
  height: 432,
  html: "<img style='width: 100%;' src='modules/keyboard.png'/>"
});

growthRatio = Screen.width / 732;

imageHeight = growthRatio * 432;

_inputStyle = Object.assign({}, Framer.LayerStyle, calculatePixelRatio = function(layer, value) {
  return (value * layer.context.pixelMultiplier) + "px";
}, {
  fontSize: function(layer) {
    return calculatePixelRatio(layer, layer._properties.fontSize);
  },
  lineHeight: function(layer) {
    return layer._properties.lineHeight + "em";
  },
  padding: function(layer) {
    var padding, paddingValue, paddingValues, pixelMultiplier;
    pixelMultiplier = layer.context.pixelMultiplier;
    padding = [];
    paddingValue = layer._properties.padding;
    if (Number.isInteger(paddingValue)) {
      return calculatePixelRatio(layer, paddingValue);
    }
    paddingValues = layer._properties.padding.split(" ");
    switch (paddingValues.length) {
      case 4:
        padding.top = parseFloat(paddingValues[0]);
        padding.right = parseFloat(paddingValues[1]);
        padding.bottom = parseFloat(paddingValues[2]);
        padding.left = parseFloat(paddingValues[3]);
        break;
      case 3:
        padding.top = parseFloat(paddingValues[0]);
        padding.right = parseFloat(paddingValues[1]);
        padding.bottom = parseFloat(paddingValues[2]);
        padding.left = parseFloat(paddingValues[1]);
        break;
      case 2:
        padding.top = parseFloat(paddingValues[0]);
        padding.right = parseFloat(paddingValues[1]);
        padding.bottom = parseFloat(paddingValues[0]);
        padding.left = parseFloat(paddingValues[1]);
        break;
      default:
        padding.top = parseFloat(paddingValues[0]);
        padding.right = parseFloat(paddingValues[0]);
        padding.bottom = parseFloat(paddingValues[0]);
        padding.left = parseFloat(paddingValues[0]);
    }
    return (padding.top * pixelMultiplier) + "px " + (padding.right * pixelMultiplier) + "px " + (padding.bottom * pixelMultiplier) + "px " + (padding.left * pixelMultiplier) + "px";
  }
});

exports.keyboardLayer.states = {
  shown: {
    y: Screen.height - imageHeight
  }
};

exports.keyboardLayer.states.animationOptions = {
  curve: "spring(500,50,15)"
};

exports.Input = (function(superClass) {
  extend(Input, superClass);

  Input.define("style", {
    get: function() {
      return this.input.style;
    },
    set: function(value) {
      return _.extend(this.input.style, value);
    }
  });

  Input.define("value", {
    get: function() {
      return this.input.value;
    },
    set: function(value) {
      return this.input.value = value;
    }
  });

  function Input(options) {
    if (options == null) {
      options = {};
    }
    this.enable = bind(this.enable, this);
    if (options.setup == null) {
      options.setup = false;
    }
    if (options.width == null) {
      options.width = Screen.width;
    }
    if (options.clip == null) {
      options.clip = false;
    }
    if (options.height == null) {
      options.height = 60;
    }
    if (options.backgroundColor == null) {
      options.backgroundColor = options.setup ? "rgba(255, 60, 47, .5)" : "rgba(255, 255, 255, .01)";
    }
    if (options.fontSize == null) {
      options.fontSize = 30;
    }
    if (options.lineHeight == null) {
      options.lineHeight = 1;
    }
    if (options.padding == null) {
      options.padding = 10;
    }
    if (options.text == null) {
      options.text = "";
    }
    if (options.placeholder == null) {
      options.placeholder = "";
    }
    if (options.virtualKeyboard == null) {
      options.virtualKeyboard = Utils.isMobile() ? false : true;
    }
    if (options.type == null) {
      options.type = "text";
    }
    if (options.goButton == null) {
      options.goButton = false;
    }
    if (options.autoCorrect == null) {
      options.autoCorrect = "on";
    }
    if (options.autoComplete == null) {
      options.autoComplete = "on";
    }
    if (options.autoCapitalize == null) {
      options.autoCapitalize = "on";
    }
    if (options.spellCheck == null) {
      options.spellCheck = "on";
    }
    if (options.autofocus == null) {
      options.autofocus = false;
    }
    if (options.textColor == null) {
      options.textColor = "#000";
    }
    if (options.fontFamily == null) {
      options.fontFamily = "-apple-system";
    }
    if (options.fontWeight == null) {
      options.fontWeight = "500";
    }
    if (options.submit == null) {
      options.submit = false;
    }
    if (options.tabIndex == null) {
      options.tabIndex = 0;
    }
    if (options.textarea == null) {
      options.textarea = false;
    }
    if (options.disabled == null) {
      options.disabled = false;
    }
    Input.__super__.constructor.call(this, options);
    this._properties.fontSize = options.fontSize;
    this._properties.lineHeight = options.lineHeight;
    this._properties.padding = options.padding;
    if (options.placeholderColor != null) {
      this.placeholderColor = options.placeholderColor;
    }
    this.input = document.createElement(options.textarea ? 'textarea' : 'input');
    this.input.id = "input-" + (_.now());
    this.input.style.width = _inputStyle["width"](this);
    this.input.style.height = _inputStyle["height"](this);
    this.input.style.fontSize = _inputStyle["fontSize"](this);
    this.input.style.lineHeight = _inputStyle["lineHeight"](this);
    this.input.style.outline = "none";
    this.input.style.border = "none";
    this.input.style.backgroundColor = options.backgroundColor;
    this.input.style.padding = _inputStyle["padding"](this);
    this.input.style.fontFamily = options.fontFamily;
    this.input.style.color = options.textColor;
    this.input.style.fontWeight = options.fontWeight;
    this.input.value = options.text;
    this.input.type = options.type;
    this.input.placeholder = options.placeholder;
    this.input.setAttribute("tabindex", options.tabindex);
    this.input.setAttribute("autocorrect", options.autoCorrect);
    this.input.setAttribute("autocomplete", options.autoComplete);
    this.input.setAttribute("autocapitalize", options.autoCapitalize);
    if (options.disabled === true) {
      this.input.setAttribute("disabled", true);
    }
    if (options.autofocus === true) {
      this.input.setAttribute("autofocus", true);
    }
    this.input.setAttribute("spellcheck", options.spellCheck);
    this.form = document.createElement("form");
    if ((options.goButton && !options.submit) || !options.submit) {
      this.form.action = "#";
      this.form.addEventListener("submit", function(event) {
        return event.preventDefault();
      });
    }
    this.form.appendChild(this.input);
    this._element.appendChild(this.form);
    this.backgroundColor = "transparent";
    if (this.placeholderColor) {
      this.updatePlaceholderColor(options.placeholderColor);
    }
    if (!Utils.isMobile() && options.virtualKeyboard === true) {
      this.input.addEventListener("focus", function() {
        exports.keyboardLayer.bringToFront();
        return exports.keyboardLayer.stateCycle();
      });
      this.input.addEventListener("blur", function() {
        return exports.keyboardLayer.animate("default");
      });
    }
  }

  Input.prototype.updatePlaceholderColor = function(color) {
    var css;
    this.placeholderColor = color;
    if (this.pageStyle != null) {
      document.head.removeChild(this.pageStyle);
    }
    this.pageStyle = document.createElement("style");
    this.pageStyle.type = "text/css";
    css = "#" + this.input.id + "::-webkit-input-placeholder { color: " + this.placeholderColor + "; }";
    this.pageStyle.appendChild(document.createTextNode(css));
    return document.head.appendChild(this.pageStyle);
  };

  Input.prototype.focus = function() {
    return this.input.focus();
  };

  Input.prototype.unfocus = function() {
    return this.input.blur();
  };

  Input.prototype.onFocus = function(cb) {
    return this.input.addEventListener("focus", function() {
      return cb.apply(this);
    });
  };

  Input.prototype.onBlur = function(cb) {
    return this.input.addEventListener("blur", function() {
      return cb.apply(this);
    });
  };

  Input.prototype.onUnfocus = Input.onBlur;

  Input.prototype.disable = function() {
    return this.input.setAttribute("disabled", true);
  };

  Input.prototype.enable = function() {
    return this.input.removeAttribute("disabled", true);
  };

  return Input;

})(Layer);


},{}],"myModule":[function(require,module,exports){
exports.myVar = "myVariable";

exports.myFunction = function() {
  return print("myFunction is running");
};

exports.myArray = [1, 2, 3];


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL015TGlicmFyeS9BcHBzL1Byb2plY3RBcHBzL1NoYXJlQ2hhdC1jb21wb3NlL0NvbXBvc2VBbGxDb2RlLmZyYW1lci9tb2R1bGVzL215TW9kdWxlLmNvZmZlZSIsIi4uLy4uLy4uLy4uLy4uL015TGlicmFyeS9BcHBzL1Byb2plY3RBcHBzL1NoYXJlQ2hhdC1jb21wb3NlL0NvbXBvc2VBbGxDb2RlLmZyYW1lci9tb2R1bGVzL2lucHV0LWZyYW1lci9pbnB1dC5jb2ZmZWUiLCIuLi8uLi8uLi8uLi8uLi9NeUxpYnJhcnkvQXBwcy9Qcm9qZWN0QXBwcy9TaGFyZUNoYXQtY29tcG9zZS9Db21wb3NlQWxsQ29kZS5mcmFtZXIvbW9kdWxlcy9mcmFtZXItY2FtZXJhLWlucHV0L0NhbWVyYUlucHV0LmNvZmZlZSIsIi4uLy4uLy4uLy4uLy4uL015TGlicmFyeS9BcHBzL1Byb2plY3RBcHBzL1NoYXJlQ2hhdC1jb21wb3NlL0NvbXBvc2VBbGxDb2RlLmZyYW1lci9tb2R1bGVzL0ZvbnRBd2Vzb21lLmNvZmZlZSIsIi4uLy4uLy4uLy4uLy4uL015TGlicmFyeS9BcHBzL1Byb2plY3RBcHBzL1NoYXJlQ2hhdC1jb21wb3NlL0NvbXBvc2VBbGxDb2RlLmZyYW1lci9tb2R1bGVzL0NhbWVyYUxheWVyLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyBBZGQgdGhlIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgcHJvamVjdCBpbiBGcmFtZXIgU3R1ZGlvLiBcbiMgbXlNb2R1bGUgPSByZXF1aXJlIFwibXlNb2R1bGVcIlxuIyBSZWZlcmVuY2UgdGhlIGNvbnRlbnRzIGJ5IG5hbWUsIGxpa2UgbXlNb2R1bGUubXlGdW5jdGlvbigpIG9yIG15TW9kdWxlLm15VmFyXG5cbmV4cG9ydHMubXlWYXIgPSBcIm15VmFyaWFibGVcIlxuXG5leHBvcnRzLm15RnVuY3Rpb24gPSAtPlxuXHRwcmludCBcIm15RnVuY3Rpb24gaXMgcnVubmluZ1wiXG5cbmV4cG9ydHMubXlBcnJheSA9IFsxLCAyLCAzXSIsImV4cG9ydHMua2V5Ym9hcmRMYXllciA9IG5ldyBMYXllclxuXHR4OjAsIHk6U2NyZWVuLmhlaWdodCwgd2lkdGg6U2NyZWVuLndpZHRoLCBoZWlnaHQ6NDMyXG5cdGh0bWw6XCI8aW1nIHN0eWxlPSd3aWR0aDogMTAwJTsnIHNyYz0nbW9kdWxlcy9rZXlib2FyZC5wbmcnLz5cIlxuXG4jc2NyZWVuIHdpZHRoIHZzLiBzaXplIG9mIGltYWdlIHdpZHRoXG5ncm93dGhSYXRpbyA9IFNjcmVlbi53aWR0aCAvIDczMlxuaW1hZ2VIZWlnaHQgPSBncm93dGhSYXRpbyAqIDQzMlxuXG4jIEV4dGVuZHMgdGhlIExheWVyU3R5bGUgY2xhc3Mgd2hpY2ggZG9lcyB0aGUgcGl4ZWwgcmF0aW8gY2FsY3VsYXRpb25zIGluIGZyYW1lclxuX2lucHV0U3R5bGUgPVxuXHRPYmplY3QuYXNzaWduKHt9LCBGcmFtZXIuTGF5ZXJTdHlsZSxcblx0XHRjYWxjdWxhdGVQaXhlbFJhdGlvID0gKGxheWVyLCB2YWx1ZSkgLT5cblx0XHRcdCh2YWx1ZSAqIGxheWVyLmNvbnRleHQucGl4ZWxNdWx0aXBsaWVyKSArIFwicHhcIlxuXG5cdFx0Zm9udFNpemU6IChsYXllcikgLT5cblx0XHRcdGNhbGN1bGF0ZVBpeGVsUmF0aW8obGF5ZXIsIGxheWVyLl9wcm9wZXJ0aWVzLmZvbnRTaXplKVxuXG5cdFx0bGluZUhlaWdodDogKGxheWVyKSAtPlxuXHRcdFx0KGxheWVyLl9wcm9wZXJ0aWVzLmxpbmVIZWlnaHQpICsgXCJlbVwiXG5cblx0XHRwYWRkaW5nOiAobGF5ZXIpIC0+XG5cdFx0XHR7IHBpeGVsTXVsdGlwbGllciB9ID0gbGF5ZXIuY29udGV4dFxuXHRcdFx0cGFkZGluZyA9IFtdXG5cdFx0XHRwYWRkaW5nVmFsdWUgPSBsYXllci5fcHJvcGVydGllcy5wYWRkaW5nXG5cblx0XHRcdCMgQ2hlY2sgaWYgd2UgaGF2ZSBhIHNpbmdsZSBudW1iZXIgYXMgaW50ZWdlclxuXHRcdFx0aWYgTnVtYmVyLmlzSW50ZWdlcihwYWRkaW5nVmFsdWUpXG5cdFx0XHRcdHJldHVybiBjYWxjdWxhdGVQaXhlbFJhdGlvKGxheWVyLCBwYWRkaW5nVmFsdWUpXG5cblx0XHRcdCMgSWYgd2UgaGF2ZSBtdWx0aXBsZSB2YWx1ZXMgdGhleSBjb21lIGFzIHN0cmluZyAoZS5nLiBcIjEgMiAzIDRcIilcblx0XHRcdHBhZGRpbmdWYWx1ZXMgPSBsYXllci5fcHJvcGVydGllcy5wYWRkaW5nLnNwbGl0KFwiIFwiKVxuXG5cdFx0XHRzd2l0Y2ggcGFkZGluZ1ZhbHVlcy5sZW5ndGhcblx0XHRcdFx0d2hlbiA0XG5cdFx0XHRcdFx0cGFkZGluZy50b3AgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMF0pXG5cdFx0XHRcdFx0cGFkZGluZy5yaWdodCA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1sxXSlcblx0XHRcdFx0XHRwYWRkaW5nLmJvdHRvbSA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1syXSlcblx0XHRcdFx0XHRwYWRkaW5nLmxlZnQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbM10pXG5cblx0XHRcdFx0d2hlbiAzXG5cdFx0XHRcdFx0cGFkZGluZy50b3AgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMF0pXG5cdFx0XHRcdFx0cGFkZGluZy5yaWdodCA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1sxXSlcblx0XHRcdFx0XHRwYWRkaW5nLmJvdHRvbSA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1syXSlcblx0XHRcdFx0XHRwYWRkaW5nLmxlZnQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMV0pXG5cblx0XHRcdFx0d2hlbiAyXG5cdFx0XHRcdFx0cGFkZGluZy50b3AgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMF0pXG5cdFx0XHRcdFx0cGFkZGluZy5yaWdodCA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1sxXSlcblx0XHRcdFx0XHRwYWRkaW5nLmJvdHRvbSA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1swXSlcblx0XHRcdFx0XHRwYWRkaW5nLmxlZnQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMV0pXG5cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHBhZGRpbmcudG9wID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcucmlnaHQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMF0pXG5cdFx0XHRcdFx0cGFkZGluZy5ib3R0b20gPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMF0pXG5cdFx0XHRcdFx0cGFkZGluZy5sZWZ0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXG5cdFx0XHQjIFJldHVybiBhcyA0LXZhbHVlIHN0cmluZyAoZS5nIFwiMXB4IDJweCAzcHggNHB4XCIpXG5cdFx0XHRcIiN7cGFkZGluZy50b3AgKiBwaXhlbE11bHRpcGxpZXJ9cHggI3twYWRkaW5nLnJpZ2h0ICogcGl4ZWxNdWx0aXBsaWVyfXB4ICN7cGFkZGluZy5ib3R0b20gKiBwaXhlbE11bHRpcGxpZXJ9cHggI3twYWRkaW5nLmxlZnQgKiBwaXhlbE11bHRpcGxpZXJ9cHhcIlxuXHQpXG5cbmV4cG9ydHMua2V5Ym9hcmRMYXllci5zdGF0ZXMgPVxuXHRzaG93bjpcblx0XHR5OiBTY3JlZW4uaGVpZ2h0IC0gaW1hZ2VIZWlnaHRcblxuZXhwb3J0cy5rZXlib2FyZExheWVyLnN0YXRlcy5hbmltYXRpb25PcHRpb25zID1cblx0Y3VydmU6IFwic3ByaW5nKDUwMCw1MCwxNSlcIlxuXG5jbGFzcyBleHBvcnRzLklucHV0IGV4dGVuZHMgTGF5ZXJcblx0QGRlZmluZSBcInN0eWxlXCIsXG5cdFx0Z2V0OiAtPiBAaW5wdXQuc3R5bGVcblx0XHRzZXQ6ICh2YWx1ZSkgLT5cblx0XHRcdF8uZXh0ZW5kIEBpbnB1dC5zdHlsZSwgdmFsdWVcblxuXHRAZGVmaW5lIFwidmFsdWVcIixcblx0XHRnZXQ6IC0+IEBpbnB1dC52YWx1ZVxuXHRcdHNldDogKHZhbHVlKSAtPlxuXHRcdFx0QGlucHV0LnZhbHVlID0gdmFsdWVcblxuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMgPSB7fSkgLT5cblx0XHRvcHRpb25zLnNldHVwID89IGZhbHNlXG5cdFx0b3B0aW9ucy53aWR0aCA/PSBTY3JlZW4ud2lkdGhcblx0XHRvcHRpb25zLmNsaXAgPz0gZmFsc2Vcblx0XHRvcHRpb25zLmhlaWdodCA/PSA2MFxuXHRcdG9wdGlvbnMuYmFja2dyb3VuZENvbG9yID89IGlmIG9wdGlvbnMuc2V0dXAgdGhlbiBcInJnYmEoMjU1LCA2MCwgNDcsIC41KVwiIGVsc2UgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIC4wMSlcIiAjIFwidHJhbnNwYXJlbnRcIiBzZWVtcyB0byBjYXVzZSBhIGJ1ZyBpbiBsYXRlc3Qgc2FmYXJpIHZlcnNpb25cblx0XHRvcHRpb25zLmZvbnRTaXplID89IDMwXG5cdFx0b3B0aW9ucy5saW5lSGVpZ2h0ID89IDFcblx0XHRvcHRpb25zLnBhZGRpbmcgPz0gMTBcblx0XHRvcHRpb25zLnRleHQgPz0gXCJcIlxuXHRcdG9wdGlvbnMucGxhY2Vob2xkZXIgPz0gXCJcIlxuXHRcdG9wdGlvbnMudmlydHVhbEtleWJvYXJkID89IGlmIFV0aWxzLmlzTW9iaWxlKCkgdGhlbiBmYWxzZSBlbHNlIHRydWVcblx0XHRvcHRpb25zLnR5cGUgPz0gXCJ0ZXh0XCJcblx0XHRvcHRpb25zLmdvQnV0dG9uID89IGZhbHNlXG5cdFx0b3B0aW9ucy5hdXRvQ29ycmVjdCA/PSBcIm9uXCJcblx0XHRvcHRpb25zLmF1dG9Db21wbGV0ZSA/PSBcIm9uXCJcblx0XHRvcHRpb25zLmF1dG9DYXBpdGFsaXplID89IFwib25cIlxuXHRcdG9wdGlvbnMuc3BlbGxDaGVjayA/PSBcIm9uXCJcblx0XHRvcHRpb25zLmF1dG9mb2N1cyA/PSBmYWxzZVxuXHRcdG9wdGlvbnMudGV4dENvbG9yID89IFwiIzAwMFwiXG5cdFx0b3B0aW9ucy5mb250RmFtaWx5ID89IFwiLWFwcGxlLXN5c3RlbVwiXG5cdFx0b3B0aW9ucy5mb250V2VpZ2h0ID89IFwiNTAwXCJcblx0XHRvcHRpb25zLnN1Ym1pdCA/PSBmYWxzZVxuXHRcdG9wdGlvbnMudGFiSW5kZXggPz0gMFxuXHRcdG9wdGlvbnMudGV4dGFyZWEgPz0gZmFsc2Vcblx0XHRvcHRpb25zLmRpc2FibGVkID89IGZhbHNlXG5cblx0XHRzdXBlciBvcHRpb25zXG5cblx0XHQjIEFkZCBhZGRpdGlvbmFsIHByb3BlcnRpZXNcblx0XHRAX3Byb3BlcnRpZXMuZm9udFNpemUgPSBvcHRpb25zLmZvbnRTaXplXG5cdFx0QF9wcm9wZXJ0aWVzLmxpbmVIZWlnaHQgPSBvcHRpb25zLmxpbmVIZWlnaHRcblx0XHRAX3Byb3BlcnRpZXMucGFkZGluZyA9IG9wdGlvbnMucGFkZGluZ1xuXG5cdFx0QHBsYWNlaG9sZGVyQ29sb3IgPSBvcHRpb25zLnBsYWNlaG9sZGVyQ29sb3IgaWYgb3B0aW9ucy5wbGFjZWhvbGRlckNvbG9yP1xuXHRcdEBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgaWYgb3B0aW9ucy50ZXh0YXJlYSB0aGVuICd0ZXh0YXJlYScgZWxzZSAnaW5wdXQnXG5cdFx0QGlucHV0LmlkID0gXCJpbnB1dC0je18ubm93KCl9XCJcblxuXHRcdCMgQWRkIHN0eWxpbmcgdG8gdGhlIGlucHV0IGVsZW1lbnRcblx0XHRAaW5wdXQuc3R5bGUud2lkdGggPSBfaW5wdXRTdHlsZVtcIndpZHRoXCJdKEApXG5cdFx0QGlucHV0LnN0eWxlLmhlaWdodCA9IF9pbnB1dFN0eWxlW1wiaGVpZ2h0XCJdKEApXG5cdFx0QGlucHV0LnN0eWxlLmZvbnRTaXplID0gX2lucHV0U3R5bGVbXCJmb250U2l6ZVwiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5saW5lSGVpZ2h0ID0gX2lucHV0U3R5bGVbXCJsaW5lSGVpZ2h0XCJdKEApXG5cdFx0QGlucHV0LnN0eWxlLm91dGxpbmUgPSBcIm5vbmVcIlxuXHRcdEBpbnB1dC5zdHlsZS5ib3JkZXIgPSBcIm5vbmVcIlxuXHRcdEBpbnB1dC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBvcHRpb25zLmJhY2tncm91bmRDb2xvclxuXHRcdEBpbnB1dC5zdHlsZS5wYWRkaW5nID0gX2lucHV0U3R5bGVbXCJwYWRkaW5nXCJdKEApXG5cdFx0QGlucHV0LnN0eWxlLmZvbnRGYW1pbHkgPSBvcHRpb25zLmZvbnRGYW1pbHlcblx0XHRAaW5wdXQuc3R5bGUuY29sb3IgPSBvcHRpb25zLnRleHRDb2xvclxuXHRcdEBpbnB1dC5zdHlsZS5mb250V2VpZ2h0ID0gb3B0aW9ucy5mb250V2VpZ2h0XG5cblx0XHRAaW5wdXQudmFsdWUgPSBvcHRpb25zLnRleHRcblx0XHRAaW5wdXQudHlwZSA9IG9wdGlvbnMudHlwZVxuXHRcdEBpbnB1dC5wbGFjZWhvbGRlciA9IG9wdGlvbnMucGxhY2Vob2xkZXJcblx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwidGFiaW5kZXhcIiwgb3B0aW9ucy50YWJpbmRleFxuXHRcdEBpbnB1dC5zZXRBdHRyaWJ1dGUgXCJhdXRvY29ycmVjdFwiLCBvcHRpb25zLmF1dG9Db3JyZWN0XG5cdFx0QGlucHV0LnNldEF0dHJpYnV0ZSBcImF1dG9jb21wbGV0ZVwiLCBvcHRpb25zLmF1dG9Db21wbGV0ZVxuXHRcdEBpbnB1dC5zZXRBdHRyaWJ1dGUgXCJhdXRvY2FwaXRhbGl6ZVwiLCBvcHRpb25zLmF1dG9DYXBpdGFsaXplXG5cdFx0aWYgb3B0aW9ucy5kaXNhYmxlZCA9PSB0cnVlXG5cdFx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwiZGlzYWJsZWRcIiwgdHJ1ZVxuXHRcdGlmIG9wdGlvbnMuYXV0b2ZvY3VzID09IHRydWVcblx0XHRcdEBpbnB1dC5zZXRBdHRyaWJ1dGUgXCJhdXRvZm9jdXNcIiwgdHJ1ZVxuXHRcdEBpbnB1dC5zZXRBdHRyaWJ1dGUgXCJzcGVsbGNoZWNrXCIsIG9wdGlvbnMuc3BlbGxDaGVja1xuXHRcdEBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCBcImZvcm1cIlxuXG5cdFx0aWYgKG9wdGlvbnMuZ29CdXR0b24gJiYgIW9wdGlvbnMuc3VibWl0KSB8fCAhb3B0aW9ucy5zdWJtaXRcblx0XHRcdEBmb3JtLmFjdGlvbiA9IFwiI1wiXG5cdFx0XHRAZm9ybS5hZGRFdmVudExpc3RlbmVyIFwic3VibWl0XCIsIChldmVudCkgLT5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG5cdFx0QGZvcm0uYXBwZW5kQ2hpbGQgQGlucHV0XG5cdFx0QF9lbGVtZW50LmFwcGVuZENoaWxkIEBmb3JtXG5cblx0XHRAYmFja2dyb3VuZENvbG9yID0gXCJ0cmFuc3BhcmVudFwiXG5cdFx0QHVwZGF0ZVBsYWNlaG9sZGVyQ29sb3Igb3B0aW9ucy5wbGFjZWhvbGRlckNvbG9yIGlmIEBwbGFjZWhvbGRlckNvbG9yXG5cblx0XHQjb25seSBzaG93IGhvbm9yIHZpcnR1YWwga2V5Ym9hcmQgb3B0aW9uIHdoZW4gbm90IG9uIG1vYmlsZSxcblx0XHQjb3RoZXJ3aXNlIGlnbm9yZVxuXHRcdGlmICFVdGlscy5pc01vYmlsZSgpICYmIG9wdGlvbnMudmlydHVhbEtleWJvYXJkIGlzIHRydWVcblx0XHRcdEBpbnB1dC5hZGRFdmVudExpc3RlbmVyIFwiZm9jdXNcIiwgLT5cblx0XHRcdFx0ZXhwb3J0cy5rZXlib2FyZExheWVyLmJyaW5nVG9Gcm9udCgpXG5cdFx0XHRcdGV4cG9ydHMua2V5Ym9hcmRMYXllci5zdGF0ZUN5Y2xlKClcblx0XHRcdEBpbnB1dC5hZGRFdmVudExpc3RlbmVyIFwiYmx1clwiLCAtPlxuXHRcdFx0XHRleHBvcnRzLmtleWJvYXJkTGF5ZXIuYW5pbWF0ZShcImRlZmF1bHRcIilcblxuXHR1cGRhdGVQbGFjZWhvbGRlckNvbG9yOiAoY29sb3IpIC0+XG5cdFx0QHBsYWNlaG9sZGVyQ29sb3IgPSBjb2xvclxuXHRcdGlmIEBwYWdlU3R5bGU/XG5cdFx0XHRkb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkIEBwYWdlU3R5bGVcblx0XHRAcGFnZVN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCBcInN0eWxlXCJcblx0XHRAcGFnZVN0eWxlLnR5cGUgPSBcInRleHQvY3NzXCJcblx0XHRjc3MgPSBcIiMje0BpbnB1dC5pZH06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIgeyBjb2xvcjogI3tAcGxhY2Vob2xkZXJDb2xvcn07IH1cIlxuXHRcdEBwYWdlU3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUgY3NzKVxuXHRcdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQgQHBhZ2VTdHlsZVxuXG5cdGZvY3VzOiAoKSAtPlxuXHRcdEBpbnB1dC5mb2N1cygpXG5cblx0dW5mb2N1czogKCkgLT5cblx0XHRAaW5wdXQuYmx1cigpXG5cblx0b25Gb2N1czogKGNiKSAtPlxuXHRcdEBpbnB1dC5hZGRFdmVudExpc3RlbmVyIFwiZm9jdXNcIiwgLT5cblx0XHRcdGNiLmFwcGx5KEApXG5cblx0b25CbHVyOiAoY2IpIC0+XG5cdFx0QGlucHV0LmFkZEV2ZW50TGlzdGVuZXIgXCJibHVyXCIsIC0+XG5cdFx0XHRjYi5hcHBseShAKVxuXG5cdG9uVW5mb2N1czogdGhpcy5vbkJsdXJcblx0XG5cdGRpc2FibGU6ICgpIC0+XG5cdFx0QGlucHV0LnNldEF0dHJpYnV0ZSBcImRpc2FibGVkXCIsIHRydWVcblxuXHRlbmFibGU6ICgpID0+XG5cdFx0QGlucHV0LnJlbW92ZUF0dHJpYnV0ZSBcImRpc2FibGVkXCIsIHRydWVcblx0XG4iLCJjbGFzcyBleHBvcnRzLkNhbWVyYUlucHV0IGV4dGVuZHMgVGV4dExheWVyXG5cdGNvbnN0cnVjdG9yOiAoQG9wdGlvbnM9e30pIC0+XG5cdFx0Xy5kZWZhdWx0cyBAb3B0aW9ucyxcblx0XHRcdGlnbm9yZUV2ZW50czogZmFsc2Vcblx0XHRzdXBlciBAb3B0aW9uc1xuXG5cdFx0QGNoYW5nZUhhbmRsZXIgPSAoZXZlbnQpIC0+XG5cdFx0XHRpZihAb3B0aW9ucy5jYWxsYmFjaylcblx0XHRcdFx0ZmlsZSA9IEBfZWxlbWVudC5maWxlc1swXVxuXHRcdFx0XHR1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGZpbGUpXG5cdFx0XHRcdEBvcHRpb25zLmNhbGxiYWNrKHVybCwgZmlsZS50eXBlKVxuXG5cdFx0QGNoYW5nZUhhbmRsZXIgPSBAY2hhbmdlSGFuZGxlci5iaW5kIEBcblx0XHRFdmVudHMud3JhcChAX2VsZW1lbnQpLmFkZEV2ZW50TGlzdGVuZXIgXCJjaGFuZ2VcIiwgQGNoYW5nZUhhbmRsZXJcblxuXHRfY3JlYXRlRWxlbWVudDogLT5cblx0XHRyZXR1cm4gaWYgQF9lbGVtZW50P1xuXHRcdEBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgXCJpbnB1dFwiXG5cdFx0QF9lbGVtZW50LnR5cGUgPSBcImZpbGVcIlxuXHRcdEBfZWxlbWVudC5jYXB0dXJlID0gdHJ1ZVxuXHRcdEBfZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZnJhbWVyTGF5ZXJcIilcblx0XHRAX2VsZW1lbnQuc3R5bGVbXCItd2Via2l0LWFwcGVhcmFuY2VcIl0gPSBcIm5vbmVcIlxuXHRcdEBfZWxlbWVudC5zdHlsZVtcIi13ZWJraXQtdGV4dC1zaXplLWFkanVzdFwiXSA9IFwibm9uZVwiXG5cdFx0QF9lbGVtZW50LnN0eWxlW1wib3V0bGluZVwiXSA9IFwibm9uZVwiXG5cdFx0c3dpdGNoIEBvcHRpb25zLmFjY2VwdFxuXHRcdFx0d2hlbiBcImltYWdlXCIgdGhlbiBAX2VsZW1lbnQuYWNjZXB0ID0gXCJpbWFnZS8qXCJcblx0XHRcdHdoZW4gXCJ2aWRlb1wiIHRoZW4gQF9lbGVtZW50LmFjY2VwdCA9IFwidmlkZW8vKlwiXG5cdFx0XHRlbHNlIEBfZWxlbWVudC5hY2NlcHQgPSBcImltYWdlLyosdmlkZW8vKlwiXG5cblx0QGRlZmluZSBcImFjY2VwdFwiLFxuXHRcdGdldDogLT5cblx0XHRcdEBfZWxlbWVudC5hY2NlcHRcblx0XHRzZXQ6ICh2YWx1ZSkgLT5cblx0XHRcdHN3aXRjaCB2YWx1ZVxuXHRcdFx0XHR3aGVuIFwiaW1hZ2VcIiB0aGVuIEBfZWxlbWVudC5hY2NlcHQgPSBcImltYWdlLypcIlxuXHRcdFx0XHR3aGVuIFwidmlkZW9cIiB0aGVuIEBfZWxlbWVudC5hY2NlcHQgPSBcInZpZGVvLypcIlxuXHRcdFx0XHRlbHNlIEBfZWxlbWVudC5hY2NlcHQgPSBcImltYWdlLyosdmlkZW8vKlwiIiwiY2xhc3NOYW1lcyA9IHtcIjUwMHB4XCI6XCImI3hmMjZlO1wiLFwiYWRqdXN0XCI6XCImI3hmMDQyO1wiLFwiYWRuXCI6XCImI3hmMTcwO1wiLFwiYWxpZ24tY2VudGVyXCI6XCImI3hmMDM3O1wiLFwiYWxpZ24tanVzdGlmeVwiOlwiJiN4ZjAzOTtcIixcImFsaWduLWxlZnRcIjpcIiYjeGYwMzY7XCIsXCJhbGlnbi1yaWdodFwiOlwiJiN4ZjAzODtcIixcImFtYXpvblwiOlwiJiN4ZjI3MDtcIixcImFtYnVsYW5jZVwiOlwiJiN4ZjBmOTtcIixcImFuY2hvclwiOlwiJiN4ZjEzZDtcIixcImFuZHJvaWRcIjpcIiYjeGYxN2I7XCIsXCJhbmdlbGxpc3RcIjpcIiYjeGYyMDk7XCIsXCJhbmdsZS1kb3VibGUtZG93blwiOlwiJiN4ZjEwMztcIixcImFuZ2xlLWRvdWJsZS1sZWZ0XCI6XCImI3hmMTAwO1wiLFwiYW5nbGUtZG91YmxlLXJpZ2h0XCI6XCImI3hmMTAxO1wiLFwiYW5nbGUtZG91YmxlLXVwXCI6XCImI3hmMTAyO1wiLFwiYW5nbGUtZG93blwiOlwiJiN4ZjEwNztcIixcImFuZ2xlLWxlZnRcIjpcIiYjeGYxMDQ7XCIsXCJhbmdsZS1yaWdodFwiOlwiJiN4ZjEwNTtcIixcImFuZ2xlLXVwXCI6XCImI3hmMTA2O1wiLFwiYXBwbGVcIjpcIiYjeGYxNzk7XCIsXCJhcmNoaXZlXCI6XCImI3hmMTg3O1wiLFwiYXJlYS1jaGFydFwiOlwiJiN4ZjFmZTtcIixcImFycm93LWNpcmNsZS1kb3duXCI6XCImI3hmMGFiO1wiLFwiYXJyb3ctY2lyY2xlLWxlZnRcIjpcIiYjeGYwYTg7XCIsXCJhcnJvdy1jaXJjbGUtby1kb3duXCI6XCImI3hmMDFhO1wiLFwiYXJyb3ctY2lyY2xlLW8tbGVmdFwiOlwiJiN4ZjE5MDtcIixcImFycm93LWNpcmNsZS1vLXJpZ2h0XCI6XCImI3hmMThlO1wiLFwiYXJyb3ctY2lyY2xlLW8tdXBcIjpcIiYjeGYwMWI7XCIsXCJhcnJvdy1jaXJjbGUtcmlnaHRcIjpcIiYjeGYwYTk7XCIsXCJhcnJvdy1jaXJjbGUtdXBcIjpcIiYjeGYwYWE7XCIsXCJhcnJvdy1kb3duXCI6XCImI3hmMDYzO1wiLFwiYXJyb3ctbGVmdFwiOlwiJiN4ZjA2MDtcIixcImFycm93LXJpZ2h0XCI6XCImI3hmMDYxO1wiLFwiYXJyb3ctdXBcIjpcIiYjeGYwNjI7XCIsXCJhcnJvd3NcIjpcIiYjeGYwNDc7XCIsXCJhcnJvd3MtYWx0XCI6XCImI3hmMGIyO1wiLFwiYXJyb3dzLWhcIjpcIiYjeGYwN2U7XCIsXCJhcnJvd3MtdlwiOlwiJiN4ZjA3ZDtcIixcImFzdGVyaXNrXCI6XCImI3hmMDY5O1wiLFwiYXRcIjpcIiYjeGZhO1wiLFwiYXV0b21vYmlsZSAoYWxpYXMpXCI6XCImI3hmMWI5O1wiLFwiYmFja3dhcmRcIjpcIiYjeGYwNGE7XCIsXCJiYWxhbmNlLXNjYWxlXCI6XCImI3hmMjRlO1wiLFwiYmFuXCI6XCImI3hmMDVlO1wiLFwiYmFuayAoYWxpYXMpXCI6XCImI3hmMTljO1wiLFwiYmFyLWNoYXJ0XCI6XCImI3hmMDgwO1wiLFwiYmFyLWNoYXJ0LW8gKGFsaWFzKVwiOlwiJiN4ZjA4MDtcIixcImJhcmNvZGVcIjpcIiYjeGYwMmE7XCIsXCJiYXJzXCI6XCImI3hmMGM5O1wiLFwiYmF0dGVyeS0wIChhbGlhcylcIjpcIiYjeGYyNDQ7XCIsXCJiYXR0ZXJ5LTEgKGFsaWFzKVwiOlwiJiN4ZjI0MztcIixcImJhdHRlcnktMiAoYWxpYXMpXCI6XCImI3hmMjQyO1wiLFwiYmF0dGVyeS0zIChhbGlhcylcIjpcIiYjeGYyNDE7XCIsXCJiYXR0ZXJ5LTQgKGFsaWFzKVwiOlwiJiN4ZjI0MDtcIixcImJhdHRlcnktZW1wdHlcIjpcIiYjeGYyNDQ7XCIsXCJiYXR0ZXJ5LWZ1bGxcIjpcIiYjeGYyNDA7XCIsXCJiYXR0ZXJ5LWhhbGZcIjpcIiYjeGYyNDI7XCIsXCJiYXR0ZXJ5LXF1YXJ0ZXJcIjpcIiYjeGYyNDM7XCIsXCJiYXR0ZXJ5LXRocmVlLXF1YXJ0ZXJzXCI6XCImI3hmMjQxO1wiLFwiYmVkXCI6XCImI3hmMjM2O1wiLFwiYmVlclwiOlwiJiN4ZjBmYztcIixcImJlaGFuY2VcIjpcIiYjeGYxYjQ7XCIsXCJiZWhhbmNlLXNxdWFyZVwiOlwiJiN4ZjFiNTtcIixcImJlbGxcIjpcIiYjeGYwZjM7XCIsXCJiZWxsLW9cIjpcIiYjeGYwYTI7XCIsXCJiZWxsLXNsYXNoXCI6XCImI3hmMWY2O1wiLFwiYmVsbC1zbGFzaC1vXCI6XCImI3hmMWY3O1wiLFwiYmljeWNsZVwiOlwiJiN4ZjIwNjtcIixcImJpbm9jdWxhcnNcIjpcIiYjeGYxZTU7XCIsXCJiaXJ0aGRheS1jYWtlXCI6XCImI3hmMWZkO1wiLFwiYml0YnVja2V0XCI6XCImI3hmMTcxO1wiLFwiYml0YnVja2V0LXNxdWFyZVwiOlwiJiN4ZjE3MjtcIixcImJpdGNvaW4gKGFsaWFzKVwiOlwiJiN4ZjE1YTtcIixcImJsYWNrLXRpZVwiOlwiJiN4ZjI3ZTtcIixcImJvbGRcIjpcIiYjeGYwMzI7XCIsXCJib2x0XCI6XCImI3hmMGU3O1wiLFwiYm9tYlwiOlwiJiN4ZjFlMjtcIixcImJvb2tcIjpcIiYjeGYwMmQ7XCIsXCJib29rbWFya1wiOlwiJiN4ZjAyZTtcIixcImJvb2ttYXJrLW9cIjpcIiYjeGYwOTc7XCIsXCJicmllZmNhc2VcIjpcIiYjeGYwYjE7XCIsXCJidGNcIjpcIiYjeGYxNWE7XCIsXCJidWdcIjpcIiYjeGYxODg7XCIsXCJidWlsZGluZ1wiOlwiJiN4ZjFhZDtcIixcImJ1aWxkaW5nLW9cIjpcIiYjeGYwZjc7XCIsXCJidWxsaG9yblwiOlwiJiN4ZjBhMTtcIixcImJ1bGxzZXllXCI6XCImI3hmMTQwO1wiLFwiYnVzXCI6XCImI3hmMjA3O1wiLFwiYnV5c2VsbGFkc1wiOlwiJiN4ZjIwZDtcIixcImNhYiAoYWxpYXMpXCI6XCImI3hmMWJhO1wiLFwiY2FsY3VsYXRvclwiOlwiJiN4ZjFlYztcIixcImNhbGVuZGFyXCI6XCImI3hmMDczO1wiLFwiY2FsZW5kYXItY2hlY2stb1wiOlwiJiN4ZjI3NDtcIixcImNhbGVuZGFyLW1pbnVzLW9cIjpcIiYjeGYyNzI7XCIsXCJjYWxlbmRhci1vXCI6XCImI3hmMTMzO1wiLFwiY2FsZW5kYXItcGx1cy1vXCI6XCImI3hmMjcxO1wiLFwiY2FsZW5kYXItdGltZXMtb1wiOlwiJiN4ZjI3MztcIixcImNhbWVyYVwiOlwiJiN4ZjAzMDtcIixcImNhbWVyYS1yZXRyb1wiOlwiJiN4ZjA4MztcIixcImNhclwiOlwiJiN4ZjFiOTtcIixcImNhcmV0LWRvd25cIjpcIiYjeGYwZDc7XCIsXCJjYXJldC1sZWZ0XCI6XCImI3hmMGQ5O1wiLFwiY2FyZXQtcmlnaHRcIjpcIiYjeGYwZGE7XCIsXCJjYXJldC1zcXVhcmUtby1kb3duXCI6XCImI3hmMTUwO1wiLFwiY2FyZXQtc3F1YXJlLW8tbGVmdFwiOlwiJiN4ZjE5MTtcIixcImNhcmV0LXNxdWFyZS1vLXJpZ2h0XCI6XCImI3hmMTUyO1wiLFwiY2FyZXQtc3F1YXJlLW8tdXBcIjpcIiYjeGYxNTE7XCIsXCJjYXJldC11cFwiOlwiJiN4ZjBkODtcIixcImNhcnQtYXJyb3ctZG93blwiOlwiJiN4ZjIxODtcIixcImNhcnQtcGx1c1wiOlwiJiN4ZjIxNztcIixcImNjXCI6XCImI3hmMjBhO1wiLFwiY2MtYW1leFwiOlwiJiN4ZjFmMztcIixcImNjLWRpbmVycy1jbHViXCI6XCImI3hmMjRjO1wiLFwiY2MtZGlzY292ZXJcIjpcIiYjeGYxZjI7XCIsXCJjYy1qY2JcIjpcIiYjeGYyNGI7XCIsXCJjYy1tYXN0ZXJjYXJkXCI6XCImI3hmMWYxO1wiLFwiY2MtcGF5cGFsXCI6XCImI3hmMWY0O1wiLFwiY2Mtc3RyaXBlXCI6XCImI3hmMWY1O1wiLFwiY2MtdmlzYVwiOlwiJiN4ZjFmMDtcIixcImNlcnRpZmljYXRlXCI6XCImI3hmMGEzO1wiLFwiY2hhaW4gKGFsaWFzKVwiOlwiJiN4ZjBjMTtcIixcImNoYWluLWJyb2tlblwiOlwiJiN4ZjEyNztcIixcImNoZWNrXCI6XCImI3hmMDBjO1wiLFwiY2hlY2stY2lyY2xlXCI6XCImI3hmMDU4O1wiLFwiY2hlY2stY2lyY2xlLW9cIjpcIiYjeGYwNWQ7XCIsXCJjaGVjay1zcXVhcmVcIjpcIiYjeGYxNGE7XCIsXCJjaGVjay1zcXVhcmUtb1wiOlwiJiN4ZjA0NjtcIixcImNoZXZyb24tY2lyY2xlLWRvd25cIjpcIiYjeGYxM2E7XCIsXCJjaGV2cm9uLWNpcmNsZS1sZWZ0XCI6XCImI3hmMTM3O1wiLFwiY2hldnJvbi1jaXJjbGUtcmlnaHRcIjpcIiYjeGYxMzg7XCIsXCJjaGV2cm9uLWNpcmNsZS11cFwiOlwiJiN4ZjEzOTtcIixcImNoZXZyb24tZG93blwiOlwiJiN4ZjA3ODtcIixcImNoZXZyb24tbGVmdFwiOlwiJiN4ZjA1MztcIixcImNoZXZyb24tcmlnaHRcIjpcIiYjeGYwNTQ7XCIsXCJjaGV2cm9uLXVwXCI6XCImI3hmMDc3O1wiLFwiY2hpbGRcIjpcIiYjeGYxYWU7XCIsXCJjaHJvbWVcIjpcIiYjeGYyNjg7XCIsXCJjaXJjbGVcIjpcIiYjeGYxMTE7XCIsXCJjaXJjbGUtb1wiOlwiJiN4ZjEwYztcIixcImNpcmNsZS1vLW5vdGNoXCI6XCImI3hmMWNlO1wiLFwiY2lyY2xlLXRoaW5cIjpcIiYjeGYxZGI7XCIsXCJjbGlwYm9hcmRcIjpcIiYjeGYwZWE7XCIsXCJjbG9jay1vXCI6XCImI3hmMDE3O1wiLFwiY2xvbmVcIjpcIiYjeGYyNGQ7XCIsXCJjbG9zZSAoYWxpYXMpXCI6XCImI3hmMDBkO1wiLFwiY2xvdWRcIjpcIiYjeGYwYzI7XCIsXCJjbG91ZC1kb3dubG9hZFwiOlwiJiN4ZjBlZDtcIixcImNsb3VkLXVwbG9hZFwiOlwiJiN4ZjBlZTtcIixcImNueSAoYWxpYXMpXCI6XCImI3hmMTU3O1wiLFwiY29kZVwiOlwiJiN4ZjEyMTtcIixcImNvZGUtZm9ya1wiOlwiJiN4ZjEyNjtcIixcImNvZGVwZW5cIjpcIiYjeGYxY2I7XCIsXCJjb2ZmZWVcIjpcIiYjeGYwZjQ7XCIsXCJjb2dcIjpcIiYjeGYwMTM7XCIsXCJjb2dzXCI6XCImI3hmMDg1O1wiLFwiY29sdW1uc1wiOlwiJiN4ZjBkYjtcIixcImNvbW1lbnRcIjpcIiYjeGYwNzU7XCIsXCJjb21tZW50LW9cIjpcIiYjeGYwZTU7XCIsXCJjb21tZW50aW5nXCI6XCImI3hmMjdhO1wiLFwiY29tbWVudGluZy1vXCI6XCImI3hmMjdiO1wiLFwiY29tbWVudHNcIjpcIiYjeGYwODY7XCIsXCJjb21tZW50cy1vXCI6XCImI3hmMGU2O1wiLFwiY29tcGFzc1wiOlwiJiN4ZjE0ZTtcIixcImNvbXByZXNzXCI6XCImI3hmMDY2O1wiLFwiY29ubmVjdGRldmVsb3BcIjpcIiYjeGYyMGU7XCIsXCJjb250YW9cIjpcIiYjeGYyNmQ7XCIsXCJjb3B5IChhbGlhcylcIjpcIiYjeGYwYzU7XCIsXCJjb3B5cmlnaHRcIjpcIiYjeGYxZjk7XCIsXCJjcmVhdGl2ZS1jb21tb25zXCI6XCImI3hmMjVlO1wiLFwiY3JlZGl0LWNhcmRcIjpcIiYjeGYwOWQ7XCIsXCJjcm9wXCI6XCImI3hmMTI1O1wiLFwiY3Jvc3NoYWlyc1wiOlwiJiN4ZjA1YjtcIixcImNzczNcIjpcIiYjeGYxM2M7XCIsXCJjdWJlXCI6XCImI3hmMWIyO1wiLFwiY3ViZXNcIjpcIiYjeGYxYjM7XCIsXCJjdXQgKGFsaWFzKVwiOlwiJiN4ZjBjNDtcIixcImN1dGxlcnlcIjpcIiYjeGYwZjU7XCIsXCJkYXNoYm9hcmQgKGFsaWFzKVwiOlwiJiN4ZjBlNDtcIixcImRhc2hjdWJlXCI6XCImI3hmMjEwO1wiLFwiZGF0YWJhc2VcIjpcIiYjeGYxYzA7XCIsXCJkZWRlbnQgKGFsaWFzKVwiOlwiJiN4ZjAzYjtcIixcImRlbGljaW91c1wiOlwiJiN4ZjFhNTtcIixcImRlc2t0b3BcIjpcIiYjeGYxMDg7XCIsXCJkZXZpYW50YXJ0XCI6XCImI3hmMWJkO1wiLFwiZGlhbW9uZFwiOlwiJiN4ZjIxOTtcIixcImRpZ2dcIjpcIiYjeGYxYTY7XCIsXCJkb2xsYXIgKGFsaWFzKVwiOlwiJiN4ZjE1NTtcIixcImRvdC1jaXJjbGUtb1wiOlwiJiN4ZjE5MjtcIixcImRvd25sb2FkXCI6XCImI3hmMDE5O1wiLFwiZHJpYmJibGVcIjpcIiYjeGYxN2Q7XCIsXCJkcm9wYm94XCI6XCImI3hmMTZiO1wiLFwiZHJ1cGFsXCI6XCImI3hmMWE5O1wiLFwiZWRpdCAoYWxpYXMpXCI6XCImI3hmMDQ0O1wiLFwiZWplY3RcIjpcIiYjeGYwNTI7XCIsXCJlbGxpcHNpcy1oXCI6XCImI3hmMTQxO1wiLFwiZWxsaXBzaXMtdlwiOlwiJiN4ZjE0MjtcIixcImVtcGlyZVwiOlwiJiN4ZjFkMTtcIixcImVudmVsb3BlXCI6XCImI3hmMGUwO1wiLFwiZW52ZWxvcGUtb1wiOlwiJiN4ZjAwMztcIixcImVudmVsb3BlLXNxdWFyZVwiOlwiJiN4ZjE5OTtcIixcImVyYXNlclwiOlwiJiN4ZjEyZDtcIixcImV1clwiOlwiJiN4ZjE1MztcIixcImV1cm8gKGFsaWFzKVwiOlwiJiN4ZjE1MztcIixcImV4Y2hhbmdlXCI6XCImI3hmMGVjO1wiLFwiZXhjbGFtYXRpb25cIjpcIiYjeGYxMmE7XCIsXCJleGNsYW1hdGlvbi1jaXJjbGVcIjpcIiYjeGYwNmE7XCIsXCJleGNsYW1hdGlvbi10cmlhbmdsZVwiOlwiJiN4ZjA3MTtcIixcImV4cGFuZFwiOlwiJiN4ZjA2NTtcIixcImV4cGVkaXRlZHNzbFwiOlwiJiN4ZjIzZTtcIixcImV4dGVybmFsLWxpbmtcIjpcIiYjeGYwOGU7XCIsXCJleHRlcm5hbC1saW5rLXNxdWFyZVwiOlwiJiN4ZjE0YztcIixcImV5ZVwiOlwiJiN4ZjA2ZTtcIixcImV5ZS1zbGFzaFwiOlwiJiN4ZjA3MDtcIixcImV5ZWRyb3BwZXJcIjpcIiYjeGYxZmI7XCIsXCJmZmFjZWJvb2tcIjpcIiYjeGYwOWE7XCIsXCJmZmFjZWJvb2stZiAoYWxpYXMpXCI6XCImI3hmMDlhO1wiLFwiNC4zZmZhY2Vib29rLW9mZmljaWFsXCI6XCImI3hmMjMwO1wiLFwiZmZhY2Vib29rLXNxdWFyZVwiOlwiJiN4ZjA4MjtcIixcImZmYXN0LWJhY2t3YXJkXCI6XCImI3hmMDQ5O1wiLFwiZmZhc3QtZm9yd2FyZFwiOlwiJiN4ZjA1MDtcIixcIjQuMWZmYXhcIjpcIiYjeGYxYWM7XCIsXCJmZWVkIChhbGlhcylcIjpcIiYjeGYwOWU7XCIsXCJmZW1hbGVcIjpcIiYjeGYxODI7XCIsXCJmaWdodGVyLWpldFwiOlwiJiN4ZjBmYjtcIixcImZpbGVcIjpcIiYjeGYxNWI7XCIsXCJmaWxlLWFyY2hpdmUtb1wiOlwiJiN4ZjFjNjtcIixcImZpbGUtYXVkaW8tb1wiOlwiJiN4ZjFjNztcIixcImZpbGUtY29kZS1vXCI6XCImI3hmMWM5O1wiLFwiZmlsZS1leGNlbC1vXCI6XCImI3hmMWMzO1wiLFwiZmlsZS1pbWFnZS1vXCI6XCImI3hmMWM1O1wiLFwiZmlsZS1tb3ZpZS1vIChhbGlhcylcIjpcIiYjeGYxYzg7XCIsXCJmaWxlLW9cIjpcIiYjeGYwMTY7XCIsXCJmaWxlLXBkZi1vXCI6XCImI3hmMWMxO1wiLFwiZmlsZS1waG90by1vIChhbGlhcylcIjpcIiYjeGYxYzU7XCIsXCJmaWxlLXBpY3R1cmUtbyAoYWxpYXMpXCI6XCImI3hmMWM1O1wiLFwiZmlsZS1wb3dlcnBvaW50LW9cIjpcIiYjeGYxYzQ7XCIsXCJmaWxlLXNvdW5kLW8gKGFsaWFzKVwiOlwiJiN4ZjFjNztcIixcImZpbGUtdGV4dFwiOlwiJiN4ZjE1YztcIixcImZpbGUtdGV4dC1vXCI6XCImI3hmMGY2O1wiLFwiZmlsZS12aWRlby1vXCI6XCImI3hmMWM4O1wiLFwiZmlsZS13b3JkLW9cIjpcIiYjeGYxYzI7XCIsXCJmaWxlLXppcC1vIChhbGlhcylcIjpcIiYjeGYxYzY7XCIsXCJmaWxlcy1vXCI6XCImI3hmMGM1O1wiLFwiZmlsbVwiOlwiJiN4ZjAwODtcIixcImZpbHRlclwiOlwiJiN4ZjBiMDtcIixcImZpcmVcIjpcIiYjeGYwNmQ7XCIsXCJmaXJlLWV4dGluZ3Vpc2hlclwiOlwiJiN4ZjEzNDtcIixcImZpcmVmb3hcIjpcIiYjeGYyNjk7XCIsXCJmbGFnXCI6XCImI3hmMDI0O1wiLFwiZmxhZy1jaGVja2VyZWRcIjpcIiYjeGYxMWU7XCIsXCJmbGFnLW9cIjpcIiYjeGYxMWQ7XCIsXCJmbGFzaCAoYWxpYXMpXCI6XCImI3hmMGU3O1wiLFwiZmxhc2tcIjpcIiYjeGYwYzM7XCIsXCJmbGlja3JcIjpcIiYjeGYxNmU7XCIsXCJmbG9wcHktb1wiOlwiJiN4ZjBjNztcIixcImZvbGRlclwiOlwiJiN4ZjA3YjtcIixcImZvbGRlci1vXCI6XCImI3hmMTE0O1wiLFwiZm9sZGVyLW9wZW5cIjpcIiYjeGYwN2M7XCIsXCJmb2xkZXItb3Blbi1vXCI6XCImI3hmMTE1O1wiLFwiZm9udFwiOlwiJiN4ZjAzMTtcIixcImZvbnRpY29uc1wiOlwiJiN4ZjI4MDtcIixcImZvcnVtYmVlXCI6XCImI3hmMjExO1wiLFwiZm9yd2FyZFwiOlwiJiN4ZjA0ZTtcIixcImZvdXJzcXVhcmVcIjpcIiYjeGYxODA7XCIsXCJmcm93bi1vXCI6XCImI3hmMTE5O1wiLFwiZnV0Ym9sLW9cIjpcIiYjeGYxZTM7XCIsXCJnYW1lcGFkXCI6XCImI3hmMTFiO1wiLFwiZ2F2ZWxcIjpcIiYjeGYwZTM7XCIsXCJnYnBcIjpcIiYjeGYxNTQ7XCIsXCJnZSAoYWxpYXMpXCI6XCImI3hmMWQxO1wiLFwiZ2VhciAoYWxpYXMpXCI6XCImI3hmMDEzO1wiLFwiZ2VhcnMgKGFsaWFzKVwiOlwiJiN4ZjA4NTtcIixcImdlbmRlcmxlc3NcIjpcIiYjeGYyMmQ7XCIsXCJnZXQtcG9ja2V0XCI6XCImI3hmMjY1O1wiLFwiZ2dcIjpcIiYjeGYyNjA7XCIsXCJnZy1jaXJjbGVcIjpcIiYjeGYyNjE7XCIsXCJnaWZ0XCI6XCImI3hmMDZiO1wiLFwiZ2l0XCI6XCImI3hmMWQzO1wiLFwiZ2l0LXNxdWFyZVwiOlwiJiN4ZjFkMjtcIixcImdpdGh1YlwiOlwiJiN4ZjA5YjtcIixcImdpdGh1Yi1hbHRcIjpcIiYjeGYxMTM7XCIsXCJnaXRodWItc3F1YXJlXCI6XCImI3hmMDkyO1wiLFwiZ2l0dGlwIChhbGlhcylcIjpcIiYjeGYxODQ7XCIsXCJnbGFzc1wiOlwiJiN4ZjAwMDtcIixcImdsb2JlXCI6XCImI3hmMGFjO1wiLFwiZ29vZ2xlXCI6XCImI3hmMWEwO1wiLFwiZ29vZ2xlLXBsdXNcIjpcIiYjeGYwZDU7XCIsXCJnb29nbGUtcGx1cy1zcXVhcmVcIjpcIiYjeGYwZDQ7XCIsXCJnb29nbGUtd2FsbGV0XCI6XCImI3hmMWVlO1wiLFwiZ3JhZHVhdGlvbi1jYXBcIjpcIiYjeGYxOWQ7XCIsXCJncmF0aXBheVwiOlwiJiN4ZjE4NDtcIixcImdyb3VwIChhbGlhcylcIjpcIiYjeGYwYzA7XCIsXCJoLXNxdWFyZVwiOlwiJiN4ZjBmZDtcIixcImhhY2tlci1uZXdzXCI6XCImI3hmMWQ0O1wiLFwiaGFuZC1ncmFiLW8gKGFsaWFzKVwiOlwiJiN4ZjI1NTtcIixcImhhbmQtbGl6YXJkLW9cIjpcIiYjeGYyNTg7XCIsXCJoYW5kLW8tZG93blwiOlwiJiN4ZjBhNztcIixcImhhbmQtby1sZWZ0XCI6XCImI3hmMGE1O1wiLFwiaGFuZC1vLXJpZ2h0XCI6XCImI3hmMGE0O1wiLFwiaGFuZC1vLXVwXCI6XCImI3hmMGE2O1wiLFwiaGFuZC1wYXBlci1vXCI6XCImI3hmMjU2O1wiLFwiaGFuZC1wZWFjZS1vXCI6XCImI3hmMjViO1wiLFwiaGFuZC1wb2ludGVyLW9cIjpcIiYjeGYyNWE7XCIsXCJoYW5kLXJvY2stb1wiOlwiJiN4ZjI1NTtcIixcImhhbmQtc2Npc3NvcnMtb1wiOlwiJiN4ZjI1NztcIixcImhhbmQtc3BvY2stb1wiOlwiJiN4ZjI1OTtcIixcImhhbmQtc3RvcC1vIChhbGlhcylcIjpcIiYjeGYyNTY7XCIsXCJoZGQtb1wiOlwiJiN4ZjBhMDtcIixcImhlYWRlclwiOlwiJiN4ZjFkYztcIixcImhlYWRwaG9uZXNcIjpcIiYjeGYwMjU7XCIsXCJoZWFydFwiOlwiJiN4ZjAwNDtcIixcImhlYXJ0LW9cIjpcIiYjeGYwOGE7XCIsXCJoZWFydGJlYXRcIjpcIiYjeGYyMWU7XCIsXCJoaXN0b3J5XCI6XCImI3hmMWRhO1wiLFwiaG9tZVwiOlwiJiN4ZjAxNTtcIixcImhvc3BpdGFsLW9cIjpcIiYjeGYwZjg7XCIsXCJob3RlbCAoYWxpYXMpXCI6XCImI3hmMjM2O1wiLFwiaG91cmdsYXNzXCI6XCImI3hmMjU0O1wiLFwiaG91cmdsYXNzLTEgKGFsaWFzKVwiOlwiJiN4ZjI1MTtcIixcImhvdXJnbGFzcy0yIChhbGlhcylcIjpcIiYjeGYyNTI7XCIsXCJob3VyZ2xhc3MtMyAoYWxpYXMpXCI6XCImI3hmMjUzO1wiLFwiaG91cmdsYXNzLWVuZFwiOlwiJiN4ZjI1MztcIixcImhvdXJnbGFzcy1oYWxmXCI6XCImI3hmMjUyO1wiLFwiaG91cmdsYXNzLW9cIjpcIiYjeGYyNTA7XCIsXCJob3VyZ2xhc3Mtc3RhcnRcIjpcIiYjeGYyNTE7XCIsXCJob3V6elwiOlwiJiN4ZjI3YztcIixcImh0bWw1XCI6XCImI3hmMTNiO1wiLFwiaS1jdXJzb3JcIjpcIiYjeGYyNDY7XCIsXCJpbHNcIjpcIiYjeGYyMGI7XCIsXCJpbWFnZSAoYWxpYXMpXCI6XCImI3hmMDNlO1wiLFwiaW5ib3hcIjpcIiYjeGYwMWM7XCIsXCJpbmRlbnRcIjpcIiYjeGYwM2M7XCIsXCJpbmR1c3RyeVwiOlwiJiN4ZjI3NTtcIixcImluZm9cIjpcIiYjeGYxMjk7XCIsXCJpbmZvLWNpcmNsZVwiOlwiJiN4ZjA1YTtcIixcImluclwiOlwiJiN4ZjE1NjtcIixcImluc3RhZ3JhbVwiOlwiJiN4ZjE2ZDtcIixcImluc3RpdHV0aW9uIChhbGlhcylcIjpcIiYjeGYxOWM7XCIsXCJpbnRlcm5ldC1leHBsb3JlclwiOlwiJiN4ZjI2YjtcIixcImludGVyc2V4IChhbGlhcylcIjpcIiYjeGYyMjQ7XCIsXCJpb3hob3N0XCI6XCImI3hmMjA4O1wiLFwiaXRhbGljXCI6XCImI3hmMDMzO1wiLFwiam9vbWxhXCI6XCImI3hmMWFhO1wiLFwianB5XCI6XCImI3hmMTU3O1wiLFwianNmaWRkbGVcIjpcIiYjeGYxY2M7XCIsXCJrZXlcIjpcIiYjeGYwODQ7XCIsXCJrZXlib2FyZC1vXCI6XCImI3hmMTFjO1wiLFwia3J3XCI6XCImI3hmMTU5O1wiLFwibGFuZ3VhZ2VcIjpcIiYjeGYxYWI7XCIsXCJsYXB0b3BcIjpcIiYjeGYxMDk7XCIsXCJsYXN0Zm1cIjpcIiYjeGYyMDI7XCIsXCJsYXN0Zm0tc3F1YXJlXCI6XCImI3hmMjAzO1wiLFwibGVhZlwiOlwiJiN4ZjA2YztcIixcImxlYW5wdWJcIjpcIiYjeGYyMTI7XCIsXCJsZWdhbCAoYWxpYXMpXCI6XCImI3hmMGUzO1wiLFwibGVtb24tb1wiOlwiJiN4ZjA5NDtcIixcImxldmVsLWRvd25cIjpcIiYjeGYxNDk7XCIsXCJsZXZlbC11cFwiOlwiJiN4ZjE0ODtcIixcImxpZmUtYm91eSAoYWxpYXMpXCI6XCImI3hmMWNkO1wiLFwibGlmZS1idW95IChhbGlhcylcIjpcIiYjeGYxY2Q7XCIsXCJsaWZlLXJpbmdcIjpcIiYjeGYxY2Q7XCIsXCJsaWZlLXNhdmVyIChhbGlhcylcIjpcIiYjeGYxY2Q7XCIsXCJsaWdodGJ1bGItb1wiOlwiJiN4ZjBlYjtcIixcImxpbmUtY2hhcnRcIjpcIiYjeGYyMDE7XCIsXCJsaW5rXCI6XCImI3hmMGMxO1wiLFwibGlua2VkaW5cIjpcIiYjeGYwZTE7XCIsXCJsaW5rZWRpbi1zcXVhcmVcIjpcIiYjeGYwOGM7XCIsXCJsaW51eFwiOlwiJiN4ZjE3YztcIixcImxpc3RcIjpcIiYjeGYwM2E7XCIsXCJsaXN0LWFsdFwiOlwiJiN4ZjAyMjtcIixcImxpc3Qtb2xcIjpcIiYjeGYwY2I7XCIsXCJsaXN0LXVsXCI6XCImI3hmMGNhO1wiLFwibG9jYXRpb24tYXJyb3dcIjpcIiYjeGYxMjQ7XCIsXCJsb2NrXCI6XCImI3hmMDIzO1wiLFwibG9uZy1hcnJvdy1kb3duXCI6XCImI3hmMTc1O1wiLFwibG9uZy1hcnJvdy1sZWZ0XCI6XCImI3hmMTc3O1wiLFwibG9uZy1hcnJvdy1yaWdodFwiOlwiJiN4ZjE3ODtcIixcImxvbmctYXJyb3ctdXBcIjpcIiYjeGYxNzY7XCIsXCJtYWdpY1wiOlwiJiN4ZjBkMDtcIixcIm1hZ25ldFwiOlwiJiN4ZjA3NjtcIixcIm1haWwtZm9yd2FyZCAoYWxpYXMpXCI6XCImI3hmMDY0O1wiLFwibWFpbC1yZXBseSAoYWxpYXMpXCI6XCImI3hmMTEyO1wiLFwibWFpbC1yZXBseS1hbGwgKGFsaWFzKVwiOlwiJiN4ZjEyMjtcIixcIm1hbGVcIjpcIiYjeGYxODM7XCIsXCJtYXBcIjpcIiYjeGYyNzk7XCIsXCJtYXAtbWFya2VyXCI6XCImI3hmMDQxO1wiLFwibWFwLW9cIjpcIiYjeGYyNzg7XCIsXCJtYXAtcGluXCI6XCImI3hmMjc2O1wiLFwibWFwLXNpZ25zXCI6XCImI3hmMjc3O1wiLFwibWFyc1wiOlwiJiN4ZjIyMjtcIixcIm1hcnMtZG91YmxlXCI6XCImI3hmMjI3O1wiLFwibWFycy1zdHJva2VcIjpcIiYjeGYyMjk7XCIsXCJtYXJzLXN0cm9rZS1oXCI6XCImI3hmMjJiO1wiLFwibWFycy1zdHJva2UtdlwiOlwiJiN4ZjIyYTtcIixcIm1heGNkblwiOlwiJiN4ZjEzNjtcIixcIm1lYW5wYXRoXCI6XCImI3hmMjBjO1wiLFwibWVkaXVtXCI6XCImI3hmMjNhO1wiLFwibWVka2l0XCI6XCImI3hmYTtcIixcIm1laC1vXCI6XCImI3hmMTFhO1wiLFwibWVyY3VyeVwiOlwiJiN4ZjIyMztcIixcIm1pY3JvcGhvbmVcIjpcIiYjeGYxMzA7XCIsXCJtaWNyb3Bob25lLXNsYXNoXCI6XCImI3hmMTMxO1wiLFwibWludXNcIjpcIiYjeGYwNjg7XCIsXCJtaW51cy1jaXJjbGVcIjpcIiYjeGYwNTY7XCIsXCJtaW51cy1zcXVhcmVcIjpcIiYjeGYxNDY7XCIsXCJtaW51cy1zcXVhcmUtb1wiOlwiJiN4ZjE0NztcIixcIm1vYmlsZVwiOlwiJiN4ZjEwYjtcIixcIm1vYmlsZS1waG9uZSAoYWxpYXMpXCI6XCImI3hmMTBiO1wiLFwibW9uZXlcIjpcIiYjeGYwZDY7XCIsXCJtb29uLW9cIjpcIiYjeGYxODY7XCIsXCJtb3J0YXItYm9hcmQgKGFsaWFzKVwiOlwiJiN4ZjE5ZDtcIixcIm1vdG9yY3ljbGVcIjpcIiYjeGYyMWM7XCIsXCJtb3VzZS1wb2ludGVyXCI6XCImI3hmMjQ1O1wiLFwibXVzaWNcIjpcIiYjeGYwMDE7XCIsXCJuYXZpY29uIChhbGlhcylcIjpcIiYjeGYwYzk7XCIsXCJuZXV0ZXJcIjpcIiYjeGYyMmM7XCIsXCJuZXdzcGFwZXItb1wiOlwiJiN4ZjFlYTtcIixcIm9iamVjdC1ncm91cFwiOlwiJiN4ZjI0NztcIixcIm9iamVjdC11bmdyb3VwXCI6XCImI3hmMjQ4O1wiLFwib2Rub2tsYXNzbmlraVwiOlwiJiN4ZjI2MztcIixcIm9kbm9rbGFzc25pa2ktc3F1YXJlXCI6XCImI3hmMjY0O1wiLFwib3BlbmNhcnRcIjpcIiYjeGYyM2Q7XCIsXCJvcGVuaWRcIjpcIiYjeGYxOWI7XCIsXCJvcGVyYVwiOlwiJiN4ZjI2YTtcIixcIm9wdGluLW1vbnN0ZXJcIjpcIiYjeGYyM2M7XCIsXCJvdXRkZW50XCI6XCImI3hmMDNiO1wiLFwicGFnZWxpbmVzXCI6XCImI3hmMThjO1wiLFwicGFpbnQtYnJ1c2hcIjpcIiYjeGYxZmM7XCIsXCJwYXBlci1wbGFuZVwiOlwiJiN4ZjFkODtcIixcInBhcGVyLXBsYW5lLW9cIjpcIiYjeGYxZDk7XCIsXCJwYXBlcmNsaXBcIjpcIiYjeGYwYzY7XCIsXCJwYXJhZ3JhcGhcIjpcIiYjeGYxZGQ7XCIsXCJwYXN0ZSAoYWxpYXMpXCI6XCImI3hmMGVhO1wiLFwicGF1c2VcIjpcIiYjeGYwNGM7XCIsXCJwYXdcIjpcIiYjeGYxYjA7XCIsXCJwYXlwYWxcIjpcIiYjeGYxZWQ7XCIsXCJwZW5jaWxcIjpcIiYjeGYwNDA7XCIsXCJwZW5jaWwtc3F1YXJlXCI6XCImI3hmMTRiO1wiLFwicGVuY2lsLXNxdWFyZS1vXCI6XCImI3hmMDQ0O1wiLFwicGhvbmVcIjpcIiYjeGYwOTU7XCIsXCJwaG9uZS1zcXVhcmVcIjpcIiYjeGYwOTg7XCIsXCJwaG90byAoYWxpYXMpXCI6XCImI3hmMDNlO1wiLFwicGljdHVyZS1vXCI6XCImI3hmMDNlO1wiLFwicGllLWNoYXJ0XCI6XCImI3hmMjAwO1wiLFwicGllZC1waXBlclwiOlwiJiN4ZjFhNztcIixcInBpZWQtcGlwZXItYWx0XCI6XCImI3hmMWE4O1wiLFwicGludGVyZXN0XCI6XCImI3hmMGQyO1wiLFwicGludGVyZXN0LXBcIjpcIiYjeGYyMzE7XCIsXCJwaW50ZXJlc3Qtc3F1YXJlXCI6XCImI3hmMGQzO1wiLFwicGxhbmVcIjpcIiYjeGYwNzI7XCIsXCJwbGF5XCI6XCImI3hmMDRiO1wiLFwicGxheS1jaXJjbGVcIjpcIiYjeGYxNDQ7XCIsXCJwbGF5LWNpcmNsZS1vXCI6XCImI3hmMDFkO1wiLFwicGx1Z1wiOlwiJiN4ZjFlNjtcIixcInBsdXNcIjpcIiYjeGYwNjc7XCIsXCJwbHVzLWNpcmNsZVwiOlwiJiN4ZjA1NTtcIixcInBsdXMtc3F1YXJlXCI6XCImI3hmMGZlO1wiLFwicGx1cy1zcXVhcmUtb1wiOlwiJiN4ZjE5NjtcIixcInBvd2VyLW9mZlwiOlwiJiN4ZjAxMTtcIixcInByaW50XCI6XCImI3hmMDJmO1wiLFwicHV6emxlLXBpZWNlXCI6XCImI3hmMTJlO1wiLFwicXFcIjpcIiYjeGYxZDY7XCIsXCJxcmNvZGVcIjpcIiYjeGYwMjk7XCIsXCJxdWVzdGlvblwiOlwiJiN4ZjEyODtcIixcInF1ZXN0aW9uLWNpcmNsZVwiOlwiJiN4ZjA1OTtcIixcInF1b3RlLWxlZnRcIjpcIiYjeGYxMGQ7XCIsXCJxdW90ZS1yaWdodFwiOlwiJiN4ZjEwZTtcIixcInJhIChhbGlhcylcIjpcIiYjeGYxZDA7XCIsXCJyYW5kb21cIjpcIiYjeGYwNzQ7XCIsXCJyZWJlbFwiOlwiJiN4ZjFkMDtcIixcInJlY3ljbGVcIjpcIiYjeGYxYjg7XCIsXCJyZWRkaXRcIjpcIiYjeGYxYTE7XCIsXCJyZWRkaXQtc3F1YXJlXCI6XCImI3hmMWEyO1wiLFwicmVmcmVzaFwiOlwiJiN4ZjAyMTtcIixcInJlZ2lzdGVyZWRcIjpcIiYjeGYyNWQ7XCIsXCJyZW1vdmUgKGFsaWFzKVwiOlwiJiN4ZjAwZDtcIixcInJlbnJlblwiOlwiJiN4ZjE4YjtcIixcInJlb3JkZXIgKGFsaWFzKVwiOlwiJiN4ZjBjOTtcIixcInJlcGVhdFwiOlwiJiN4ZjAxZTtcIixcInJlcGx5XCI6XCImI3hmMTEyO1wiLFwicmVwbHktYWxsXCI6XCImI3hmMTIyO1wiLFwicmV0d2VldFwiOlwiJiN4ZjA3OTtcIixcInJtYiAoYWxpYXMpXCI6XCImI3hmMTU3O1wiLFwicm9hZFwiOlwiJiN4ZjAxODtcIixcInJvY2tldFwiOlwiJiN4ZjEzNTtcIixcInJvdGF0ZS1sZWZ0IChhbGlhcylcIjpcIiYjeGYwZTI7XCIsXCJyb3RhdGUtcmlnaHQgKGFsaWFzKVwiOlwiJiN4ZjAxZTtcIixcInJvdWJsZSAoYWxpYXMpXCI6XCImI3hmMTU4O1wiLFwicnNzXCI6XCImI3hmMDllO1wiLFwicnNzLXNxdWFyZVwiOlwiJiN4ZjE0MztcIixcInJ1YlwiOlwiJiN4ZjE1ODtcIixcInJ1YmxlIChhbGlhcylcIjpcIiYjeGYxNTg7XCIsXCJydXBlZSAoYWxpYXMpXCI6XCImI3hmMTU2O1wiLFwiZmFyaVwiOlwiJiN4ZjI2NztcIixcInNhdmUgKGFsaWFzKVwiOlwiJiN4ZjBjNztcIixcInNjaXNzb3JzXCI6XCImI3hmMGM0O1wiLFwic2VhcmNoXCI6XCImI3hmMDAyO1wiLFwic2VhcmNoLW1pbnVzXCI6XCImI3hmMDEwO1wiLFwic2VhcmNoLXBsdXNcIjpcIiYjeGYwMGU7XCIsXCJzZWxsc3lcIjpcIiYjeGYyMTM7XCIsXCJzZW5kIChhbGlhcylcIjpcIiYjeGYxZDg7XCIsXCJzZW5kLW8gKGFsaWFzKVwiOlwiJiN4ZjFkOTtcIixcInNlcnZlclwiOlwiJiN4ZjIzMztcIixcInNoYXJlXCI6XCImI3hmMDY0O1wiLFwic2hhcmUtYWx0XCI6XCImI3hmMWUwO1wiLFwic2hhcmUtYWx0LXNxdWFyZVwiOlwiJiN4ZjFlMTtcIixcInNoYXJlLXNxdWFyZVwiOlwiJiN4ZjE0ZDtcIixcInNoYXJlLXNxdWFyZS1vXCI6XCImI3hmMDQ1O1wiLFwic2hla2VsIChhbGlhcylcIjpcIiYjeGYyMGI7XCIsXCJzaGVxZWwgKGFsaWFzKVwiOlwiJiN4ZjIwYjtcIixcInNoaWVsZFwiOlwiJiN4ZjEzMjtcIixcInNoaXBcIjpcIiYjeGYyMWE7XCIsXCJzaGlydHNpbmJ1bGtcIjpcIiYjeGYyMTQ7XCIsXCJzaG9wcGluZy1jYXJ0XCI6XCImI3hmMDdhO1wiLFwic2lnbi1pblwiOlwiJiN4ZjA5MDtcIixcInNpZ24tb3V0XCI6XCImI3hmMDhiO1wiLFwic2lnbmFsXCI6XCImI3hmMDEyO1wiLFwic2ltcGx5YnVpbHRcIjpcIiYjeGYyMTU7XCIsXCJzaXRlbWFwXCI6XCImI3hmMGU4O1wiLFwic2t5YXRsYXNcIjpcIiYjeGYyMTY7XCIsXCJza3lwZVwiOlwiJiN4ZjE3ZTtcIixcInNsYWNrXCI6XCImI3hmMTk4O1wiLFwic2xpZGVyc1wiOlwiJiN4ZjFkZTtcIixcInNsaWRlc2hhcmVcIjpcIiYjeGYxZTc7XCIsXCJzbWlsZS1vXCI6XCImI3hmMTE4O1wiLFwic29jY2VyLWJhbGwtbyAoYWxpYXMpXCI6XCImI3hmMWUzO1wiLFwic29ydFwiOlwiJiN4ZjBkYztcIixcInNvcnQtYWxwaGEtYXNjXCI6XCImI3hmMTVkO1wiLFwic29ydC1hbHBoYS1kZXNjXCI6XCImI3hmMTVlO1wiLFwic29ydC1hbW91bnQtYXNjXCI6XCImI3hmMTYwO1wiLFwic29ydC1hbW91bnQtZGVzY1wiOlwiJiN4ZjE2MTtcIixcInNvcnQtYXNjXCI6XCImI3hmMGRlO1wiLFwic29ydC1kZXNjXCI6XCImI3hmMGRkO1wiLFwic29ydC1kb3duIChhbGlhcylcIjpcIiYjeGYwZGQ7XCIsXCJzb3J0LW51bWVyaWMtYXNjXCI6XCImI3hmMTYyO1wiLFwic29ydC1udW1lcmljLWRlc2NcIjpcIiYjeGYxNjM7XCIsXCJzb3J0LXVwIChhbGlhcylcIjpcIiYjeGYwZGU7XCIsXCJzb3VuZGNsb3VkXCI6XCImI3hmMWJlO1wiLFwic3BhY2Utc2h1dHRsZVwiOlwiJiN4ZjE5NztcIixcInNwaW5uZXJcIjpcIiYjeGYxMTA7XCIsXCJzcG9vblwiOlwiJiN4ZjFiMTtcIixcInNwb3RpZnlcIjpcIiYjeGYxYmM7XCIsXCJzcXVhcmVcIjpcIiYjeGYwYzg7XCIsXCJzcXVhcmUtb1wiOlwiJiN4ZjA5NjtcIixcInN0YWNrLWV4Y2hhbmdlXCI6XCImI3hmMThkO1wiLFwic3RhY2stb3ZlcmZsb3dcIjpcIiYjeGYxNmM7XCIsXCJzdGFyXCI6XCImI3hmMDA1O1wiLFwic3Rhci1oYWxmXCI6XCImI3hmMDg5O1wiLFwic3Rhci1oYWxmLWVtcHR5IChhbGlhcylcIjpcIiYjeGYxMjM7XCIsXCJzdGFyLWhhbGYtZnVsbCAoYWxpYXMpXCI6XCImI3hmMTIzO1wiLFwic3Rhci1oYWxmLW9cIjpcIiYjeGYxMjM7XCIsXCJzdGFyLW9cIjpcIiYjeGYwMDY7XCIsXCJzdGVhbVwiOlwiJiN4ZjFiNjtcIixcInN0ZWFtLXNxdWFyZVwiOlwiJiN4ZjFiNztcIixcInN0ZXAtYmFja3dhcmRcIjpcIiYjeGYwNDg7XCIsXCJzdGVwLWZvcndhcmRcIjpcIiYjeGYwNTE7XCIsXCJzdGV0aG9zY29wZVwiOlwiJiN4ZjBmMTtcIixcInN0aWNreS1ub3RlXCI6XCImI3hmMjQ5O1wiLFwic3RpY2t5LW5vdGUtb1wiOlwiJiN4ZjI0YTtcIixcInN0b3BcIjpcIiYjeGYwNGQ7XCIsXCJzdHJlZXQtdmlld1wiOlwiJiN4ZjIxZDtcIixcInN0cmlrZXRocm91Z2hcIjpcIiYjeGYwY2M7XCIsXCJzdHVtYmxldXBvblwiOlwiJiN4ZjFhNDtcIixcInN0dW1ibGV1cG9uLWNpcmNsZVwiOlwiJiN4ZjFhMztcIixcInN1YnNjcmlwdFwiOlwiJiN4ZjEyYztcIixcInN1YndheVwiOlwiJiN4ZjIzOTtcIixcInN1aXRjYXNlXCI6XCImI3hmMGYyO1wiLFwic3VuLW9cIjpcIiYjeGYxODU7XCIsXCJzdXBlcnNjcmlwdFwiOlwiJiN4ZjEyYjtcIixcInN1cHBvcnQgKGFsaWFzKVwiOlwiJiN4ZjFjZDtcIixcInRhYmxlXCI6XCImI3hmMGNlO1wiLFwidGFibGV0XCI6XCImI3hmMTBhO1wiLFwidGFjaG9tZXRlclwiOlwiJiN4ZjBlNDtcIixcInRhZ1wiOlwiJiN4ZjAyYjtcIixcInRhZ3NcIjpcIiYjeGYwMmM7XCIsXCJ0YXNrc1wiOlwiJiN4ZjBhZTtcIixcInRheGlcIjpcIiYjeGYxYmE7XCIsXCJ0ZWxldmlzaW9uXCI6XCImI3hmMjZjO1wiLFwidGVuY2VudC13ZWlib1wiOlwiJiN4ZjFkNTtcIixcInRlcm1pbmFsXCI6XCImI3hmMTIwO1wiLFwidGV4dC1oZWlnaHRcIjpcIiYjeGYwMzQ7XCIsXCJ0ZXh0LXdpZHRoXCI6XCImI3hmMDM1O1wiLFwidGhcIjpcIiYjeGYwMGE7XCIsXCJ0aC1sYXJnZVwiOlwiJiN4ZjAwOTtcIixcInRoLWxpc3RcIjpcIiYjeGYwMGI7XCIsXCJ0aHVtYi10YWNrXCI6XCImI3hmMDhkO1wiLFwidGh1bWJzLWRvd25cIjpcIiYjeGYxNjU7XCIsXCJ0aHVtYnMtby1kb3duXCI6XCImI3hmMDg4O1wiLFwidGh1bWJzLW8tdXBcIjpcIiYjeGYwODc7XCIsXCJ0aHVtYnMtdXBcIjpcIiYjeGYxNjQ7XCIsXCJ0aWNrZXRcIjpcIiYjeGYxNDU7XCIsXCJ0aW1lc1wiOlwiJiN4ZjAwZDtcIixcInRpbWVzLWNpcmNsZVwiOlwiJiN4ZjA1NztcIixcInRpbWVzLWNpcmNsZS1vXCI6XCImI3hmMDVjO1wiLFwidGludFwiOlwiJiN4ZjA0MztcIixcInRvZ2dsZS1kb3duIChhbGlhcylcIjpcIiYjeGYxNTA7XCIsXCJ0b2dnbGUtbGVmdCAoYWxpYXMpXCI6XCImI3hmMTkxO1wiLFwidG9nZ2xlLW9mZlwiOlwiJiN4ZjIwNDtcIixcInRvZ2dsZS1vblwiOlwiJiN4ZjIwNTtcIixcInRvZ2dsZS1yaWdodCAoYWxpYXMpXCI6XCImI3hmMTUyO1wiLFwidG9nZ2xlLXVwIChhbGlhcylcIjpcIiYjeGYxNTE7XCIsXCJ0cmFkZW1hcmtcIjpcIiYjeGYyNWM7XCIsXCJ0cmFpblwiOlwiJiN4ZjIzODtcIixcInRyYW5zZ2VuZGVyXCI6XCImI3hmMjI0O1wiLFwidHJhbnNnZW5kZXItYWx0XCI6XCImI3hmMjI1O1wiLFwidHJhc2hcIjpcIiYjeGYxZjg7XCIsXCJ0cmFzaC1vXCI6XCImI3hmMDE0O1wiLFwidHJlZVwiOlwiJiN4ZjFiYjtcIixcInRyZWxsb1wiOlwiJiN4ZjE4MTtcIixcInRyaXBhZHZpc29yXCI6XCImI3hmMjYyO1wiLFwidHJvcGh5XCI6XCImI3hmMDkxO1wiLFwidHJ1Y2tcIjpcIiYjeGYwZDE7XCIsXCJ0cnlcIjpcIiYjeGYxOTU7XCIsXCJ0dHlcIjpcIiYjeGYxZTQ7XCIsXCJ0dW1ibHJcIjpcIiYjeGYxNzM7XCIsXCJ0dW1ibHItc3F1YXJlXCI6XCImI3hmMTc0O1wiLFwidHVya2lzaC1saXJhIChhbGlhcylcIjpcIiYjeGYxOTU7XCIsXCJ0diAoYWxpYXMpXCI6XCImI3hmMjZjO1wiLFwidHdpdGNoXCI6XCImI3hmMWU4O1wiLFwidHdpdHRlclwiOlwiJiN4ZjA5OTtcIixcInR3aXR0ZXItc3F1YXJlXCI6XCImI3hmMDgxO1wiLFwidW1icmVsbGFcIjpcIiYjeGYwZTk7XCIsXCJ1bmRlcmxpbmVcIjpcIiYjeGYwY2Q7XCIsXCJ1bmRvXCI6XCImI3hmMGUyO1wiLFwidW5pdmVyc2l0eVwiOlwiJiN4ZjE5YztcIixcInVubGluayAoYWxpYXMpXCI6XCImI3hmMTI3O1wiLFwidW5sb2NrXCI6XCImI3hmMDljO1wiLFwidW5sb2NrLWFsdFwiOlwiJiN4ZjEzZTtcIixcInVuc29ydGVkIChhbGlhcylcIjpcIiYjeGYwZGM7XCIsXCJ1cGxvYWRcIjpcIiYjeGYwOTM7XCIsXCJ1c2RcIjpcIiYjeGYxNTU7XCIsXCJ1c2VyXCI6XCImI3hmMDA3O1wiLFwidXNlci1tZFwiOlwiJiN4ZjBmMDtcIixcInVzZXItcGx1c1wiOlwiJiN4ZjIzNDtcIixcInVzZXItc2VjcmV0XCI6XCImI3hmMjFiO1wiLFwidXNlci10aW1lc1wiOlwiJiN4ZjIzNTtcIixcInVzZXJzXCI6XCImI3hmMGMwO1wiLFwidmVudXNcIjpcIiYjeGYyMjE7XCIsXCJ2ZW51cy1kb3VibGVcIjpcIiYjeGYyMjY7XCIsXCJ2ZW51cy1tYXJzXCI6XCImI3hmMjI4O1wiLFwidmlhY29pblwiOlwiJiN4ZjIzNztcIixcInZpZGVvLWNhbWVyYVwiOlwiJiN4ZjAzZDtcIixcInZpbWVvXCI6XCImI3hmMjdkO1wiLFwidmltZW8tc3F1YXJlXCI6XCImI3hmMTk0O1wiLFwidmluZVwiOlwiJiN4ZjFjYTtcIixcInZrXCI6XCImI3hmMTg5O1wiLFwidm9sdW1lLWRvd25cIjpcIiYjeGYwMjc7XCIsXCJ2b2x1bWUtb2ZmXCI6XCImI3hmMDI2O1wiLFwidm9sdW1lLXVwXCI6XCImI3hmMDI4O1wiLFwid2FybmluZyAoYWxpYXMpXCI6XCImI3hmMDcxO1wiLFwid2VjaGF0IChhbGlhcylcIjpcIiYjeGYxZDc7XCIsXCJ3ZWlib1wiOlwiJiN4ZjE4YTtcIixcIndlaXhpblwiOlwiJiN4ZjFkNztcIixcIndoYXRzYXBwXCI6XCImI3hmMjMyO1wiLFwid2hlZWxjaGFpclwiOlwiJiN4ZjE5MztcIixcIndpZmlcIjpcIiYjeGYxZWI7XCIsXCJ3aWtpcGVkaWEtd1wiOlwiJiN4ZjI2NjtcIixcIndpbmRvd3NcIjpcIiYjeGYxN2E7XCIsXCJ3b24gKGFsaWFzKVwiOlwiJiN4ZjE1OTtcIixcIndvcmRwcmVzc1wiOlwiJiN4ZjE5YTtcIixcIndyZW5jaFwiOlwiJiN4ZjBhZDtcIixcInhpbmdcIjpcIiYjeGYxNjg7XCIsXCJ4aW5nLXNxdWFyZVwiOlwiJiN4ZjE2OTtcIixcInktY29tYmluYXRvclwiOlwiJiN4ZjIzYjtcIixcInktY29tYmluYXRvci1zcXVhcmUgKGFsaWFzKVwiOlwiJiN4ZjFkNDtcIixcInlhaG9vXCI6XCImI3hmMTllO1wiLFwieWMgKGFsaWFzKVwiOlwiJiN4ZjIzYjtcIixcInljLXNxdWFyZSAoYWxpYXMpXCI6XCImI3hmMWQ0O1wiLFwieWVscFwiOlwiJiN4ZjFlOTtcIixcInllbiAoYWxpYXMpXCI6XCImI3hmMTU3O1wiLFwieW91dHViZVwiOlwiJiN4ZjE2NztcIixcInlvdXR1YmUtcGxheVwiOlwiJiN4ZjE2YTtcIixcInlvdXR1YmUtc3F1YXJlXCI6XCImI3hmMTY2O1wifTtcbmZvbnRBd2Vzb21lQ1NTID0gXG5cdFwiXCJcIlxuXHRcdC8qIVxuXHQgKiAgRm9udCBBd2Vzb21lIDQuNC4wIGJ5IEBkYXZlZ2FuZHkgLSBodHRwOi8vZm9udGF3ZXNvbWUuaW8gLSBAZm9udGF3ZXNvbWVcblx0ICogIExpY2Vuc2UgLSBodHRwOi8vZm9udGF3ZXNvbWUuaW8vbGljZW5zZSAoRm9udDogU0lMIE9GTCAxLjEsIENTUzogTUlUIExpY2Vuc2UpXG5cdCAqL1xuXHQvKiBGT05UIFBBVEhcblx0ICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblx0QGZvbnQtZmFjZSB7XG5cdCAgZm9udC1mYW1pbHk6ICdGb250QXdlc29tZSc7XG5cdCAgc3JjOiB1cmwoJ21vZHVsZXMvZm9udHMvZm9udGF3ZXNvbWUtd2ViZm9udC5lb3Q/dj00LjQuMCcpO1xuXHQgIHNyYzogdXJsKCdtb2R1bGVzL2ZvbnRzL2ZvbnRhd2Vzb21lLXdlYmZvbnQuZW90PyNpZWZpeCZ2PTQuNC4wJykgZm9ybWF0KCdlbWJlZGRlZC1vcGVudHlwZScpLCB1cmwoJ21vZHVsZXMvZm9udHMvZm9udGF3ZXNvbWUtd2ViZm9udC53b2ZmMj92PTQuNC4wJykgZm9ybWF0KCd3b2ZmMicpLCB1cmwoJ21vZHVsZXMvZm9udHMvZm9udGF3ZXNvbWUtd2ViZm9udC53b2ZmP3Y9NC40LjAnKSBmb3JtYXQoJ3dvZmYnKSwgdXJsKCdtb2R1bGVzL2ZvbnRzL2ZvbnRhd2Vzb21lLXdlYmZvbnQudHRmP3Y9NC40LjAnKSBmb3JtYXQoJ3RydWV0eXBlJyksIHVybCgnbW9kdWxlcy9mb250cy9mb250YXdlc29tZS13ZWJmb250LnN2Zz92PTQuNC4wI2ZvbnRhd2Vzb21lcmVndWxhcicpIGZvcm1hdCgnc3ZnJyk7XG5cdCAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcblx0ICBmb250LXN0eWxlOiBub3JtYWw7XG5cdH1cblx0LmZhe2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQ6bm9ybWFsIG5vcm1hbCBub3JtYWwgMTRweC8xIEZvbnRBd2Vzb21lO2ZvbnQtc2l6ZTppbmhlcml0O3RleHQtcmVuZGVyaW5nOmF1dG87LXdlYmtpdC1mb250LXNtb290aGluZzphbnRpYWxpYXNlZDstbW96LW9zeC1mb250LXNtb290aGluZzpncmF5c2NhbGV9LmZhLWxne2ZvbnQtc2l6ZToxLjMzMzMzMzMzZW07bGluZS1oZWlnaHQ6Ljc1ZW07dmVydGljYWwtYWxpZ246LTE1JX0uZmEtMnh7Zm9udC1zaXplOjJlbX0uZmEtM3h7Zm9udC1zaXplOjNlbX0uZmEtNHh7Zm9udC1zaXplOjRlbX0uZmEtNXh7Zm9udC1zaXplOjVlbX0uZmEtZnd7d2lkdGg6MS4yODU3MTQyOWVtO3RleHQtYWxpZ246Y2VudGVyfS5mYS11bHtwYWRkaW5nLWxlZnQ6MDttYXJnaW4tbGVmdDoyLjE0Mjg1NzE0ZW07bGlzdC1zdHlsZS10eXBlOm5vbmV9LmZhLXVsID4gbGl7cG9zaXRpb246cmVsYXRpdmV9LmZhLWxpe3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6LTIuMTQyODU3MTRlbTt3aWR0aDoyLjE0Mjg1NzE0ZW07dG9wOi4xNDI4NTcxNGVtO3RleHQtYWxpZ246Y2VudGVyfS5mYS1saS5mYS1sZ3tsZWZ0Oi0xLjg1NzE0Mjg2ZW19LmZhLWJvcmRlcntwYWRkaW5nOi4yZW0gLjI1ZW0gLjE1ZW07Ym9yZGVyOnNvbGlkIC4wOGVtICNlZWU7Ym9yZGVyLXJhZGl1czouMWVtfS5mYS1wdWxsLWxlZnR7ZmxvYXQ6bGVmdH0uZmEtcHVsbC1yaWdodHtmbG9hdDpyaWdodH0uZmEuZmEtcHVsbC1sZWZ0e21hcmdpbi1yaWdodDouM2VtfS5mYS5mYS1wdWxsLXJpZ2h0e21hcmdpbi1sZWZ0Oi4zZW19LnB1bGwtcmlnaHR7ZmxvYXQ6cmlnaHR9LnB1bGwtbGVmdHtmbG9hdDpsZWZ0fS5mYS5wdWxsLWxlZnR7bWFyZ2luLXJpZ2h0Oi4zZW19LmZhLnB1bGwtcmlnaHR7bWFyZ2luLWxlZnQ6LjNlbX0uZmEtc3Bpbnstd2Via2l0LWFuaW1hdGlvbjpmYS1zcGluIDJzIGluZmluaXRlIGxpbmVhcjthbmltYXRpb246ZmEtc3BpbiAycyBpbmZpbml0ZSBsaW5lYXJ9LmZhLXB1bHNley13ZWJraXQtYW5pbWF0aW9uOmZhLXNwaW4gMXMgaW5maW5pdGUgc3RlcHMoOCk7YW5pbWF0aW9uOmZhLXNwaW4gMXMgaW5maW5pdGUgc3RlcHMoOCl9QC13ZWJraXQta2V5ZnJhbWVzIGZhLXNwaW57MCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMGRlZyl9MTAwJXstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMzU5ZGVnKTt0cmFuc2Zvcm06cm90YXRlKDM1OWRlZyl9fUBrZXlmcmFtZXMgZmEtc3BpbnswJXstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgwZGVnKX0xMDAley13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgzNTlkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMzU5ZGVnKX19LmZhLXJvdGF0ZS05MHtmaWx0ZXI6cHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkJhc2ljSW1hZ2Uocm90YXRpb249MSk7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDkwZGVnKTstbXMtdHJhbnNmb3JtOnJvdGF0ZSg5MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSg5MGRlZyl9LmZhLXJvdGF0ZS0xODB7ZmlsdGVyOnByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5CYXNpY0ltYWdlKHJvdGF0aW9uPTIpOy13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgxODBkZWcpOy1tcy10cmFuc2Zvcm06cm90YXRlKDE4MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgxODBkZWcpfS5mYS1yb3RhdGUtMjcwe2ZpbHRlcjpwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQmFzaWNJbWFnZShyb3RhdGlvbj0zKTstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMjcwZGVnKTstbXMtdHJhbnNmb3JtOnJvdGF0ZSgyNzBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMjcwZGVnKX0uZmEtZmxpcC1ob3Jpem9udGFse2ZpbHRlcjpwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQmFzaWNJbWFnZShyb3RhdGlvbj0wLG1pcnJvcj0xKTstd2Via2l0LXRyYW5zZm9ybTpzY2FsZSgtMSwxKTstbXMtdHJhbnNmb3JtOnNjYWxlKC0xLDEpO3RyYW5zZm9ybTpzY2FsZSgtMSwxKX0uZmEtZmxpcC12ZXJ0aWNhbHtmaWx0ZXI6cHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkJhc2ljSW1hZ2Uocm90YXRpb249MixtaXJyb3I9MSk7LXdlYmtpdC10cmFuc2Zvcm06c2NhbGUoMSwtMSk7LW1zLXRyYW5zZm9ybTpzY2FsZSgxLC0xKTt0cmFuc2Zvcm06c2NhbGUoMSwtMSl9OnJvb3QgLmZhLXJvdGF0ZS05MCw6cm9vdCAuZmEtcm90YXRlLTE4MCw6cm9vdCAuZmEtcm90YXRlLTI3MCw6cm9vdCAuZmEtZmxpcC1ob3Jpem9udGFsLDpyb290IC5mYS1mbGlwLXZlcnRpY2Fse2ZpbHRlcjpub25lfS5mYS1zdGFja3twb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmlubGluZS1ibG9jazt3aWR0aDoyZW07aGVpZ2h0OjJlbTtsaW5lLWhlaWdodDoyZW07dmVydGljYWwtYWxpZ246bWlkZGxlfS5mYS1zdGFjay0xeCwuZmEtc3RhY2stMnh7cG9zaXRpb246YWJzb2x1dGU7bGVmdDowO3dpZHRoOjEwMCU7dGV4dC1hbGlnbjpjZW50ZXJ9LmZhLXN0YWNrLTF4e2xpbmUtaGVpZ2h0OmluaGVyaXR9LmZhLXN0YWNrLTJ4e2ZvbnQtc2l6ZToyZW19LmZhLWludmVyc2V7Y29sb3I6I2ZmZn0uZmEtZ2xhc3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMDBcIn0uZmEtbXVzaWM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMDFcIn0uZmEtc2VhcmNoOmJlZm9yZXtjb250ZW50OlwiXFxmMDAyXCJ9LmZhLWVudmVsb3BlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMDNcIn0uZmEtaGVhcnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMDRcIn0uZmEtc3RhcjpiZWZvcmV7Y29udGVudDpcIlxcZjAwNVwifS5mYS1zdGFyLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMDZcIn0uZmEtdXNlcjpiZWZvcmV7Y29udGVudDpcIlxcZjAwN1wifS5mYS1maWxtOmJlZm9yZXtjb250ZW50OlwiXFxmMDA4XCJ9LmZhLXRoLWxhcmdlOmJlZm9yZXtjb250ZW50OlwiXFxmMDA5XCJ9LmZhLXRoOmJlZm9yZXtjb250ZW50OlwiXFxmMDBhXCJ9LmZhLXRoLWxpc3Q6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMGJcIn0uZmEtY2hlY2s6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMGNcIn0uZmEtcmVtb3ZlOmJlZm9yZSwuZmEtY2xvc2U6YmVmb3JlLC5mYS10aW1lczpiZWZvcmV7Y29udGVudDpcIlxcZjAwZFwifS5mYS1zZWFyY2gtcGx1czpiZWZvcmV7Y29udGVudDpcIlxcZjAwZVwifS5mYS1zZWFyY2gtbWludXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMTBcIn0uZmEtcG93ZXItb2ZmOmJlZm9yZXtjb250ZW50OlwiXFxmMDExXCJ9LmZhLXNpZ25hbDpiZWZvcmV7Y29udGVudDpcIlxcZjAxMlwifS5mYS1nZWFyOmJlZm9yZSwuZmEtY29nOmJlZm9yZXtjb250ZW50OlwiXFxmMDEzXCJ9LmZhLXRyYXNoLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMTRcIn0uZmEtaG9tZTpiZWZvcmV7Y29udGVudDpcIlxcZjAxNVwifS5mYS1maWxlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMTZcIn0uZmEtY2xvY2stbzpiZWZvcmV7Y29udGVudDpcIlxcZjAxN1wifS5mYS1yb2FkOmJlZm9yZXtjb250ZW50OlwiXFxmMDE4XCJ9LmZhLWRvd25sb2FkOmJlZm9yZXtjb250ZW50OlwiXFxmMDE5XCJ9LmZhLWFycm93LWNpcmNsZS1vLWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMWFcIn0uZmEtYXJyb3ctY2lyY2xlLW8tdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMWJcIn0uZmEtaW5ib3g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMWNcIn0uZmEtcGxheS1jaXJjbGUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjAxZFwifS5mYS1yb3RhdGUtcmlnaHQ6YmVmb3JlLC5mYS1yZXBlYXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMWVcIn0uZmEtcmVmcmVzaDpiZWZvcmV7Y29udGVudDpcIlxcZjAyMVwifS5mYS1saXN0LWFsdDpiZWZvcmV7Y29udGVudDpcIlxcZjAyMlwifS5mYS1sb2NrOmJlZm9yZXtjb250ZW50OlwiXFxmMDIzXCJ9LmZhLWZsYWc6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMjRcIn0uZmEtaGVhZHBob25lczpiZWZvcmV7Y29udGVudDpcIlxcZjAyNVwifS5mYS12b2x1bWUtb2ZmOmJlZm9yZXtjb250ZW50OlwiXFxmMDI2XCJ9LmZhLXZvbHVtZS1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMDI3XCJ9LmZhLXZvbHVtZS11cDpiZWZvcmV7Y29udGVudDpcIlxcZjAyOFwifS5mYS1xcmNvZGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMjlcIn0uZmEtYmFyY29kZTpiZWZvcmV7Y29udGVudDpcIlxcZjAyYVwifS5mYS10YWc6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMmJcIn0uZmEtdGFnczpiZWZvcmV7Y29udGVudDpcIlxcZjAyY1wifS5mYS1ib29rOmJlZm9yZXtjb250ZW50OlwiXFxmMDJkXCJ9LmZhLWJvb2ttYXJrOmJlZm9yZXtjb250ZW50OlwiXFxmMDJlXCJ9LmZhLXByaW50OmJlZm9yZXtjb250ZW50OlwiXFxmMDJmXCJ9LmZhLWNhbWVyYTpiZWZvcmV7Y29udGVudDpcIlxcZjAzMFwifS5mYS1mb250OmJlZm9yZXtjb250ZW50OlwiXFxmMDMxXCJ9LmZhLWJvbGQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMzJcIn0uZmEtaXRhbGljOmJlZm9yZXtjb250ZW50OlwiXFxmMDMzXCJ9LmZhLXRleHQtaGVpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMDM0XCJ9LmZhLXRleHQtd2lkdGg6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMzVcIn0uZmEtYWxpZ24tbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjAzNlwifS5mYS1hbGlnbi1jZW50ZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMzdcIn0uZmEtYWxpZ24tcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMzhcIn0uZmEtYWxpZ24tanVzdGlmeTpiZWZvcmV7Y29udGVudDpcIlxcZjAzOVwifS5mYS1saXN0OmJlZm9yZXtjb250ZW50OlwiXFxmMDNhXCJ9LmZhLWRlZGVudDpiZWZvcmUsLmZhLW91dGRlbnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwM2JcIn0uZmEtaW5kZW50OmJlZm9yZXtjb250ZW50OlwiXFxmMDNjXCJ9LmZhLXZpZGVvLWNhbWVyYTpiZWZvcmV7Y29udGVudDpcIlxcZjAzZFwifS5mYS1waG90bzpiZWZvcmUsLmZhLWltYWdlOmJlZm9yZSwuZmEtcGljdHVyZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDNlXCJ9LmZhLXBlbmNpbDpiZWZvcmV7Y29udGVudDpcIlxcZjA0MFwifS5mYS1tYXAtbWFya2VyOmJlZm9yZXtjb250ZW50OlwiXFxmMDQxXCJ9LmZhLWFkanVzdDpiZWZvcmV7Y29udGVudDpcIlxcZjA0MlwifS5mYS10aW50OmJlZm9yZXtjb250ZW50OlwiXFxmMDQzXCJ9LmZhLWVkaXQ6YmVmb3JlLC5mYS1wZW5jaWwtc3F1YXJlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNDRcIn0uZmEtc2hhcmUtc3F1YXJlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNDVcIn0uZmEtY2hlY2stc3F1YXJlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNDZcIn0uZmEtYXJyb3dzOmJlZm9yZXtjb250ZW50OlwiXFxmMDQ3XCJ9LmZhLXN0ZXAtYmFja3dhcmQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNDhcIn0uZmEtZmFzdC1iYWNrd2FyZDpiZWZvcmV7Y29udGVudDpcIlxcZjA0OVwifS5mYS1iYWNrd2FyZDpiZWZvcmV7Y29udGVudDpcIlxcZjA0YVwifS5mYS1wbGF5OmJlZm9yZXtjb250ZW50OlwiXFxmMDRiXCJ9LmZhLXBhdXNlOmJlZm9yZXtjb250ZW50OlwiXFxmMDRjXCJ9LmZhLXN0b3A6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNGRcIn0uZmEtZm9yd2FyZDpiZWZvcmV7Y29udGVudDpcIlxcZjA0ZVwifS5mYS1mYXN0LWZvcndhcmQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNTBcIn0uZmEtc3RlcC1mb3J3YXJkOmJlZm9yZXtjb250ZW50OlwiXFxmMDUxXCJ9LmZhLWVqZWN0OmJlZm9yZXtjb250ZW50OlwiXFxmMDUyXCJ9LmZhLWNoZXZyb24tbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjA1M1wifS5mYS1jaGV2cm9uLXJpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMDU0XCJ9LmZhLXBsdXMtY2lyY2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMDU1XCJ9LmZhLW1pbnVzLWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjA1NlwifS5mYS10aW1lcy1jaXJjbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNTdcIn0uZmEtY2hlY2stY2lyY2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMDU4XCJ9LmZhLXF1ZXN0aW9uLWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjA1OVwifS5mYS1pbmZvLWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjA1YVwifS5mYS1jcm9zc2hhaXJzOmJlZm9yZXtjb250ZW50OlwiXFxmMDViXCJ9LmZhLXRpbWVzLWNpcmNsZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDVjXCJ9LmZhLWNoZWNrLWNpcmNsZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDVkXCJ9LmZhLWJhbjpiZWZvcmV7Y29udGVudDpcIlxcZjA1ZVwifS5mYS1hcnJvdy1sZWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMDYwXCJ9LmZhLWFycm93LXJpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMDYxXCJ9LmZhLWFycm93LXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMDYyXCJ9LmZhLWFycm93LWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNjNcIn0uZmEtbWFpbC1mb3J3YXJkOmJlZm9yZSwuZmEtc2hhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNjRcIn0uZmEtZXhwYW5kOmJlZm9yZXtjb250ZW50OlwiXFxmMDY1XCJ9LmZhLWNvbXByZXNzOmJlZm9yZXtjb250ZW50OlwiXFxmMDY2XCJ9LmZhLXBsdXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNjdcIn0uZmEtbWludXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNjhcIn0uZmEtYXN0ZXJpc2s6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNjlcIn0uZmEtZXhjbGFtYXRpb24tY2lyY2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMDZhXCJ9LmZhLWdpZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNmJcIn0uZmEtbGVhZjpiZWZvcmV7Y29udGVudDpcIlxcZjA2Y1wifS5mYS1maXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMDZkXCJ9LmZhLWV5ZTpiZWZvcmV7Y29udGVudDpcIlxcZjA2ZVwifS5mYS1leWUtc2xhc2g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNzBcIn0uZmEtd2FybmluZzpiZWZvcmUsLmZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMDcxXCJ9LmZhLXBsYW5lOmJlZm9yZXtjb250ZW50OlwiXFxmMDcyXCJ9LmZhLWNhbGVuZGFyOmJlZm9yZXtjb250ZW50OlwiXFxmMDczXCJ9LmZhLXJhbmRvbTpiZWZvcmV7Y29udGVudDpcIlxcZjA3NFwifS5mYS1jb21tZW50OmJlZm9yZXtjb250ZW50OlwiXFxmMDc1XCJ9LmZhLW1hZ25ldDpiZWZvcmV7Y29udGVudDpcIlxcZjA3NlwifS5mYS1jaGV2cm9uLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMDc3XCJ9LmZhLWNoZXZyb24tZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjA3OFwifS5mYS1yZXR3ZWV0OmJlZm9yZXtjb250ZW50OlwiXFxmMDc5XCJ9LmZhLXNob3BwaW5nLWNhcnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwN2FcIn0uZmEtZm9sZGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMDdiXCJ9LmZhLWZvbGRlci1vcGVuOmJlZm9yZXtjb250ZW50OlwiXFxmMDdjXCJ9LmZhLWFycm93cy12OmJlZm9yZXtjb250ZW50OlwiXFxmMDdkXCJ9LmZhLWFycm93cy1oOmJlZm9yZXtjb250ZW50OlwiXFxmMDdlXCJ9LmZhLWJhci1jaGFydC1vOmJlZm9yZSwuZmEtYmFyLWNoYXJ0OmJlZm9yZXtjb250ZW50OlwiXFxmMDgwXCJ9LmZhLXR3aXR0ZXItc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMDgxXCJ9LmZhLWZhY2Vib29rLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjA4MlwifS5mYS1jYW1lcmEtcmV0cm86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwODNcIn0uZmEta2V5OmJlZm9yZXtjb250ZW50OlwiXFxmMDg0XCJ9LmZhLWdlYXJzOmJlZm9yZSwuZmEtY29nczpiZWZvcmV7Y29udGVudDpcIlxcZjA4NVwifS5mYS1jb21tZW50czpiZWZvcmV7Y29udGVudDpcIlxcZjA4NlwifS5mYS10aHVtYnMtby11cDpiZWZvcmV7Y29udGVudDpcIlxcZjA4N1wifS5mYS10aHVtYnMtby1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMDg4XCJ9LmZhLXN0YXItaGFsZjpiZWZvcmV7Y29udGVudDpcIlxcZjA4OVwifS5mYS1oZWFydC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDhhXCJ9LmZhLXNpZ24tb3V0OmJlZm9yZXtjb250ZW50OlwiXFxmMDhiXCJ9LmZhLWxpbmtlZGluLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjA4Y1wifS5mYS10aHVtYi10YWNrOmJlZm9yZXtjb250ZW50OlwiXFxmMDhkXCJ9LmZhLWV4dGVybmFsLWxpbms6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOGVcIn0uZmEtc2lnbi1pbjpiZWZvcmV7Y29udGVudDpcIlxcZjA5MFwifS5mYS10cm9waHk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOTFcIn0uZmEtZ2l0aHViLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjA5MlwifS5mYS11cGxvYWQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOTNcIn0uZmEtbGVtb24tbzpiZWZvcmV7Y29udGVudDpcIlxcZjA5NFwifS5mYS1waG9uZTpiZWZvcmV7Y29udGVudDpcIlxcZjA5NVwifS5mYS1zcXVhcmUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjA5NlwifS5mYS1ib29rbWFyay1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDk3XCJ9LmZhLXBob25lLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjA5OFwifS5mYS10d2l0dGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMDk5XCJ9LmZhLWZhY2Vib29rLWY6YmVmb3JlLC5mYS1mYWNlYm9vazpiZWZvcmV7Y29udGVudDpcIlxcZjA5YVwifS5mYS1naXRodWI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOWJcIn0uZmEtdW5sb2NrOmJlZm9yZXtjb250ZW50OlwiXFxmMDljXCJ9LmZhLWNyZWRpdC1jYXJkOmJlZm9yZXtjb250ZW50OlwiXFxmMDlkXCJ9LmZhLWZlZWQ6YmVmb3JlLC5mYS1yc3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOWVcIn0uZmEtaGRkLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYTBcIn0uZmEtYnVsbGhvcm46YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYTFcIn0uZmEtYmVsbDpiZWZvcmV7Y29udGVudDpcIlxcZjBmM1wifS5mYS1jZXJ0aWZpY2F0ZTpiZWZvcmV7Y29udGVudDpcIlxcZjBhM1wifS5mYS1oYW5kLW8tcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYTRcIn0uZmEtaGFuZC1vLWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYTVcIn0uZmEtaGFuZC1vLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMGE2XCJ9LmZhLWhhbmQtby1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMGE3XCJ9LmZhLWFycm93LWNpcmNsZS1sZWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMGE4XCJ9LmZhLWFycm93LWNpcmNsZS1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjBhOVwifS5mYS1hcnJvdy1jaXJjbGUtdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYWFcIn0uZmEtYXJyb3ctY2lyY2xlLWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYWJcIn0uZmEtZ2xvYmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYWNcIn0uZmEtd3JlbmNoOmJlZm9yZXtjb250ZW50OlwiXFxmMGFkXCJ9LmZhLXRhc2tzOmJlZm9yZXtjb250ZW50OlwiXFxmMGFlXCJ9LmZhLWZpbHRlcjpiZWZvcmV7Y29udGVudDpcIlxcZjBiMFwifS5mYS1icmllZmNhc2U6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYjFcIn0uZmEtYXJyb3dzLWFsdDpiZWZvcmV7Y29udGVudDpcIlxcZjBiMlwifS5mYS1ncm91cDpiZWZvcmUsLmZhLXVzZXJzOmJlZm9yZXtjb250ZW50OlwiXFxmMGMwXCJ9LmZhLWNoYWluOmJlZm9yZSwuZmEtbGluazpiZWZvcmV7Y29udGVudDpcIlxcZjBjMVwifS5mYS1jbG91ZDpiZWZvcmV7Y29udGVudDpcIlxcZjBjMlwifS5mYS1mbGFzazpiZWZvcmV7Y29udGVudDpcIlxcZjBjM1wifS5mYS1jdXQ6YmVmb3JlLC5mYS1zY2lzc29yczpiZWZvcmV7Y29udGVudDpcIlxcZjBjNFwifS5mYS1jb3B5OmJlZm9yZSwuZmEtZmlsZXMtbzpiZWZvcmV7Y29udGVudDpcIlxcZjBjNVwifS5mYS1wYXBlcmNsaXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYzZcIn0uZmEtc2F2ZTpiZWZvcmUsLmZhLWZsb3BweS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMGM3XCJ9LmZhLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjBjOFwifS5mYS1uYXZpY29uOmJlZm9yZSwuZmEtcmVvcmRlcjpiZWZvcmUsLmZhLWJhcnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYzlcIn0uZmEtbGlzdC11bDpiZWZvcmV7Y29udGVudDpcIlxcZjBjYVwifS5mYS1saXN0LW9sOmJlZm9yZXtjb250ZW50OlwiXFxmMGNiXCJ9LmZhLXN0cmlrZXRocm91Z2g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwY2NcIn0uZmEtdW5kZXJsaW5lOmJlZm9yZXtjb250ZW50OlwiXFxmMGNkXCJ9LmZhLXRhYmxlOmJlZm9yZXtjb250ZW50OlwiXFxmMGNlXCJ9LmZhLW1hZ2ljOmJlZm9yZXtjb250ZW50OlwiXFxmMGQwXCJ9LmZhLXRydWNrOmJlZm9yZXtjb250ZW50OlwiXFxmMGQxXCJ9LmZhLXBpbnRlcmVzdDpiZWZvcmV7Y29udGVudDpcIlxcZjBkMlwifS5mYS1waW50ZXJlc3Qtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMGQzXCJ9LmZhLWdvb2dsZS1wbHVzLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjBkNFwifS5mYS1nb29nbGUtcGx1czpiZWZvcmV7Y29udGVudDpcIlxcZjBkNVwifS5mYS1tb25leTpiZWZvcmV7Y29udGVudDpcIlxcZjBkNlwifS5mYS1jYXJldC1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMGQ3XCJ9LmZhLWNhcmV0LXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMGQ4XCJ9LmZhLWNhcmV0LWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZDlcIn0uZmEtY2FyZXQtcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZGFcIn0uZmEtY29sdW1uczpiZWZvcmV7Y29udGVudDpcIlxcZjBkYlwifS5mYS11bnNvcnRlZDpiZWZvcmUsLmZhLXNvcnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZGNcIn0uZmEtc29ydC1kb3duOmJlZm9yZSwuZmEtc29ydC1kZXNjOmJlZm9yZXtjb250ZW50OlwiXFxmMGRkXCJ9LmZhLXNvcnQtdXA6YmVmb3JlLC5mYS1zb3J0LWFzYzpiZWZvcmV7Y29udGVudDpcIlxcZjBkZVwifS5mYS1lbnZlbG9wZTpiZWZvcmV7Y29udGVudDpcIlxcZjBlMFwifS5mYS1saW5rZWRpbjpiZWZvcmV7Y29udGVudDpcIlxcZjBlMVwifS5mYS1yb3RhdGUtbGVmdDpiZWZvcmUsLmZhLXVuZG86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZTJcIn0uZmEtbGVnYWw6YmVmb3JlLC5mYS1nYXZlbDpiZWZvcmV7Y29udGVudDpcIlxcZjBlM1wifS5mYS1kYXNoYm9hcmQ6YmVmb3JlLC5mYS10YWNob21ldGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMGU0XCJ9LmZhLWNvbW1lbnQtbzpiZWZvcmV7Y29udGVudDpcIlxcZjBlNVwifS5mYS1jb21tZW50cy1vOmJlZm9yZXtjb250ZW50OlwiXFxmMGU2XCJ9LmZhLWZsYXNoOmJlZm9yZSwuZmEtYm9sdDpiZWZvcmV7Y29udGVudDpcIlxcZjBlN1wifS5mYS1zaXRlbWFwOmJlZm9yZXtjb250ZW50OlwiXFxmMGU4XCJ9LmZhLXVtYnJlbGxhOmJlZm9yZXtjb250ZW50OlwiXFxmMGU5XCJ9LmZhLXBhc3RlOmJlZm9yZSwuZmEtY2xpcGJvYXJkOmJlZm9yZXtjb250ZW50OlwiXFxmMGVhXCJ9LmZhLWxpZ2h0YnVsYi1vOmJlZm9yZXtjb250ZW50OlwiXFxmMGViXCJ9LmZhLWV4Y2hhbmdlOmJlZm9yZXtjb250ZW50OlwiXFxmMGVjXCJ9LmZhLWNsb3VkLWRvd25sb2FkOmJlZm9yZXtjb250ZW50OlwiXFxmMGVkXCJ9LmZhLWNsb3VkLXVwbG9hZDpiZWZvcmV7Y29udGVudDpcIlxcZjBlZVwifS5mYS11c2VyLW1kOmJlZm9yZXtjb250ZW50OlwiXFxmMGYwXCJ9LmZhLXN0ZXRob3Njb3BlOmJlZm9yZXtjb250ZW50OlwiXFxmMGYxXCJ9LmZhLXN1aXRjYXNlOmJlZm9yZXtjb250ZW50OlwiXFxmMGYyXCJ9LmZhLWJlbGwtbzpiZWZvcmV7Y29udGVudDpcIlxcZjBhMlwifS5mYS1jb2ZmZWU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZjRcIn0uZmEtY3V0bGVyeTpiZWZvcmV7Y29udGVudDpcIlxcZjBmNVwifS5mYS1maWxlLXRleHQtbzpiZWZvcmV7Y29udGVudDpcIlxcZjBmNlwifS5mYS1idWlsZGluZy1vOmJlZm9yZXtjb250ZW50OlwiXFxmMGY3XCJ9LmZhLWhvc3BpdGFsLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZjhcIn0uZmEtYW1idWxhbmNlOmJlZm9yZXtjb250ZW50OlwiXFxmMGY5XCJ9LmZhLW1lZGtpdDpiZWZvcmV7Y29udGVudDpcIlxcZjBmYVwifS5mYS1maWdodGVyLWpldDpiZWZvcmV7Y29udGVudDpcIlxcZjBmYlwifS5mYS1iZWVyOmJlZm9yZXtjb250ZW50OlwiXFxmMGZjXCJ9LmZhLWgtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMGZkXCJ9LmZhLXBsdXMtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMGZlXCJ9LmZhLWFuZ2xlLWRvdWJsZS1sZWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMTAwXCJ9LmZhLWFuZ2xlLWRvdWJsZS1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjEwMVwifS5mYS1hbmdsZS1kb3VibGUtdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMDJcIn0uZmEtYW5nbGUtZG91YmxlLWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMDNcIn0uZmEtYW5nbGUtbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjEwNFwifS5mYS1hbmdsZS1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjEwNVwifS5mYS1hbmdsZS11cDpiZWZvcmV7Y29udGVudDpcIlxcZjEwNlwifS5mYS1hbmdsZS1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMTA3XCJ9LmZhLWRlc2t0b3A6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMDhcIn0uZmEtbGFwdG9wOmJlZm9yZXtjb250ZW50OlwiXFxmMTA5XCJ9LmZhLXRhYmxldDpiZWZvcmV7Y29udGVudDpcIlxcZjEwYVwifS5mYS1tb2JpbGUtcGhvbmU6YmVmb3JlLC5mYS1tb2JpbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMGJcIn0uZmEtY2lyY2xlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMGNcIn0uZmEtcXVvdGUtbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjEwZFwifS5mYS1xdW90ZS1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjEwZVwifS5mYS1zcGlubmVyOmJlZm9yZXtjb250ZW50OlwiXFxmMTEwXCJ9LmZhLWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjExMVwifS5mYS1tYWlsLXJlcGx5OmJlZm9yZSwuZmEtcmVwbHk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMTJcIn0uZmEtZ2l0aHViLWFsdDpiZWZvcmV7Y29udGVudDpcIlxcZjExM1wifS5mYS1mb2xkZXItbzpiZWZvcmV7Y29udGVudDpcIlxcZjExNFwifS5mYS1mb2xkZXItb3Blbi1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTE1XCJ9LmZhLXNtaWxlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMThcIn0uZmEtZnJvd24tbzpiZWZvcmV7Y29udGVudDpcIlxcZjExOVwifS5mYS1tZWgtbzpiZWZvcmV7Y29udGVudDpcIlxcZjExYVwifS5mYS1nYW1lcGFkOmJlZm9yZXtjb250ZW50OlwiXFxmMTFiXCJ9LmZhLWtleWJvYXJkLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMWNcIn0uZmEtZmxhZy1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTFkXCJ9LmZhLWZsYWctY2hlY2tlcmVkOmJlZm9yZXtjb250ZW50OlwiXFxmMTFlXCJ9LmZhLXRlcm1pbmFsOmJlZm9yZXtjb250ZW50OlwiXFxmMTIwXCJ9LmZhLWNvZGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMjFcIn0uZmEtbWFpbC1yZXBseS1hbGw6YmVmb3JlLC5mYS1yZXBseS1hbGw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMjJcIn0uZmEtc3Rhci1oYWxmLWVtcHR5OmJlZm9yZSwuZmEtc3Rhci1oYWxmLWZ1bGw6YmVmb3JlLC5mYS1zdGFyLWhhbGYtbzpiZWZvcmV7Y29udGVudDpcIlxcZjEyM1wifS5mYS1sb2NhdGlvbi1hcnJvdzpiZWZvcmV7Y29udGVudDpcIlxcZjEyNFwifS5mYS1jcm9wOmJlZm9yZXtjb250ZW50OlwiXFxmMTI1XCJ9LmZhLWNvZGUtZm9yazpiZWZvcmV7Y29udGVudDpcIlxcZjEyNlwifS5mYS11bmxpbms6YmVmb3JlLC5mYS1jaGFpbi1icm9rZW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMjdcIn0uZmEtcXVlc3Rpb246YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMjhcIn0uZmEtaW5mbzpiZWZvcmV7Y29udGVudDpcIlxcZjEyOVwifS5mYS1leGNsYW1hdGlvbjpiZWZvcmV7Y29udGVudDpcIlxcZjEyYVwifS5mYS1zdXBlcnNjcmlwdDpiZWZvcmV7Y29udGVudDpcIlxcZjEyYlwifS5mYS1zdWJzY3JpcHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMmNcIn0uZmEtZXJhc2VyOmJlZm9yZXtjb250ZW50OlwiXFxmMTJkXCJ9LmZhLXB1enpsZS1waWVjZTpiZWZvcmV7Y29udGVudDpcIlxcZjEyZVwifS5mYS1taWNyb3Bob25lOmJlZm9yZXtjb250ZW50OlwiXFxmMTMwXCJ9LmZhLW1pY3JvcGhvbmUtc2xhc2g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMzFcIn0uZmEtc2hpZWxkOmJlZm9yZXtjb250ZW50OlwiXFxmMTMyXCJ9LmZhLWNhbGVuZGFyLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMzNcIn0uZmEtZmlyZS1leHRpbmd1aXNoZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMzRcIn0uZmEtcm9ja2V0OmJlZm9yZXtjb250ZW50OlwiXFxmMTM1XCJ9LmZhLW1heGNkbjpiZWZvcmV7Y29udGVudDpcIlxcZjEzNlwifS5mYS1jaGV2cm9uLWNpcmNsZS1sZWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMTM3XCJ9LmZhLWNoZXZyb24tY2lyY2xlLXJpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMTM4XCJ9LmZhLWNoZXZyb24tY2lyY2xlLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMTM5XCJ9LmZhLWNoZXZyb24tY2lyY2xlLWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYxM2FcIn0uZmEtaHRtbDU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxM2JcIn0uZmEtY3NzMzpiZWZvcmV7Y29udGVudDpcIlxcZjEzY1wifS5mYS1hbmNob3I6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxM2RcIn0uZmEtdW5sb2NrLWFsdDpiZWZvcmV7Y29udGVudDpcIlxcZjEzZVwifS5mYS1idWxsc2V5ZTpiZWZvcmV7Y29udGVudDpcIlxcZjE0MFwifS5mYS1lbGxpcHNpcy1oOmJlZm9yZXtjb250ZW50OlwiXFxmMTQxXCJ9LmZhLWVsbGlwc2lzLXY6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNDJcIn0uZmEtcnNzLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE0M1wifS5mYS1wbGF5LWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjE0NFwifS5mYS10aWNrZXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNDVcIn0uZmEtbWludXMtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTQ2XCJ9LmZhLW1pbnVzLXNxdWFyZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTQ3XCJ9LmZhLWxldmVsLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMTQ4XCJ9LmZhLWxldmVsLWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNDlcIn0uZmEtY2hlY2stc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTRhXCJ9LmZhLXBlbmNpbC1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNGJcIn0uZmEtZXh0ZXJuYWwtbGluay1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNGNcIn0uZmEtc2hhcmUtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTRkXCJ9LmZhLWNvbXBhc3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNGVcIn0uZmEtdG9nZ2xlLWRvd246YmVmb3JlLC5mYS1jYXJldC1zcXVhcmUtby1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMTUwXCJ9LmZhLXRvZ2dsZS11cDpiZWZvcmUsLmZhLWNhcmV0LXNxdWFyZS1vLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMTUxXCJ9LmZhLXRvZ2dsZS1yaWdodDpiZWZvcmUsLmZhLWNhcmV0LXNxdWFyZS1vLXJpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMTUyXCJ9LmZhLWV1cm86YmVmb3JlLC5mYS1ldXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNTNcIn0uZmEtZ2JwOmJlZm9yZXtjb250ZW50OlwiXFxmMTU0XCJ9LmZhLWRvbGxhcjpiZWZvcmUsLmZhLXVzZDpiZWZvcmV7Y29udGVudDpcIlxcZjE1NVwifS5mYS1ydXBlZTpiZWZvcmUsLmZhLWlucjpiZWZvcmV7Y29udGVudDpcIlxcZjE1NlwifS5mYS1jbnk6YmVmb3JlLC5mYS1ybWI6YmVmb3JlLC5mYS15ZW46YmVmb3JlLC5mYS1qcHk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNTdcIn0uZmEtcnVibGU6YmVmb3JlLC5mYS1yb3VibGU6YmVmb3JlLC5mYS1ydWI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNThcIn0uZmEtd29uOmJlZm9yZSwuZmEta3J3OmJlZm9yZXtjb250ZW50OlwiXFxmMTU5XCJ9LmZhLWJpdGNvaW46YmVmb3JlLC5mYS1idGM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNWFcIn0uZmEtZmlsZTpiZWZvcmV7Y29udGVudDpcIlxcZjE1YlwifS5mYS1maWxlLXRleHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNWNcIn0uZmEtc29ydC1hbHBoYS1hc2M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNWRcIn0uZmEtc29ydC1hbHBoYS1kZXNjOmJlZm9yZXtjb250ZW50OlwiXFxmMTVlXCJ9LmZhLXNvcnQtYW1vdW50LWFzYzpiZWZvcmV7Y29udGVudDpcIlxcZjE2MFwifS5mYS1zb3J0LWFtb3VudC1kZXNjOmJlZm9yZXtjb250ZW50OlwiXFxmMTYxXCJ9LmZhLXNvcnQtbnVtZXJpYy1hc2M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNjJcIn0uZmEtc29ydC1udW1lcmljLWRlc2M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNjNcIn0uZmEtdGh1bWJzLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMTY0XCJ9LmZhLXRodW1icy1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMTY1XCJ9LmZhLXlvdXR1YmUtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTY2XCJ9LmZhLXlvdXR1YmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNjdcIn0uZmEteGluZzpiZWZvcmV7Y29udGVudDpcIlxcZjE2OFwifS5mYS14aW5nLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE2OVwifS5mYS15b3V0dWJlLXBsYXk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNmFcIn0uZmEtZHJvcGJveDpiZWZvcmV7Y29udGVudDpcIlxcZjE2YlwifS5mYS1zdGFjay1vdmVyZmxvdzpiZWZvcmV7Y29udGVudDpcIlxcZjE2Y1wifS5mYS1pbnN0YWdyYW06YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNmRcIn0uZmEtZmxpY2tyOmJlZm9yZXtjb250ZW50OlwiXFxmMTZlXCJ9LmZhLWFkbjpiZWZvcmV7Y29udGVudDpcIlxcZjE3MFwifS5mYS1iaXRidWNrZXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzFcIn0uZmEtYml0YnVja2V0LXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE3MlwifS5mYS10dW1ibHI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzNcIn0uZmEtdHVtYmxyLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE3NFwifS5mYS1sb25nLWFycm93LWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzVcIn0uZmEtbG9uZy1hcnJvdy11cDpiZWZvcmV7Y29udGVudDpcIlxcZjE3NlwifS5mYS1sb25nLWFycm93LWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzdcIn0uZmEtbG9uZy1hcnJvdy1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjE3OFwifS5mYS1hcHBsZTpiZWZvcmV7Y29udGVudDpcIlxcZjE3OVwifS5mYS13aW5kb3dzOmJlZm9yZXtjb250ZW50OlwiXFxmMTdhXCJ9LmZhLWFuZHJvaWQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxN2JcIn0uZmEtbGludXg6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxN2NcIn0uZmEtZHJpYmJibGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxN2RcIn0uZmEtc2t5cGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxN2VcIn0uZmEtZm91cnNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE4MFwifS5mYS10cmVsbG86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxODFcIn0uZmEtZmVtYWxlOmJlZm9yZXtjb250ZW50OlwiXFxmMTgyXCJ9LmZhLW1hbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxODNcIn0uZmEtZ2l0dGlwOmJlZm9yZSwuZmEtZ3JhdGlwYXk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxODRcIn0uZmEtc3VuLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxODVcIn0uZmEtbW9vbi1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTg2XCJ9LmZhLWFyY2hpdmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxODdcIn0uZmEtYnVnOmJlZm9yZXtjb250ZW50OlwiXFxmMTg4XCJ9LmZhLXZrOmJlZm9yZXtjb250ZW50OlwiXFxmMTg5XCJ9LmZhLXdlaWJvOmJlZm9yZXtjb250ZW50OlwiXFxmMThhXCJ9LmZhLXJlbnJlbjpiZWZvcmV7Y29udGVudDpcIlxcZjE4YlwifS5mYS1wYWdlbGluZXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOGNcIn0uZmEtc3RhY2stZXhjaGFuZ2U6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOGRcIn0uZmEtYXJyb3ctY2lyY2xlLW8tcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOGVcIn0uZmEtYXJyb3ctY2lyY2xlLW8tbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjE5MFwifS5mYS10b2dnbGUtbGVmdDpiZWZvcmUsLmZhLWNhcmV0LXNxdWFyZS1vLWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOTFcIn0uZmEtZG90LWNpcmNsZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTkyXCJ9LmZhLXdoZWVsY2hhaXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOTNcIn0uZmEtdmltZW8tc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTk0XCJ9LmZhLXR1cmtpc2gtbGlyYTpiZWZvcmUsLmZhLXRyeTpiZWZvcmV7Y29udGVudDpcIlxcZjE5NVwifS5mYS1wbHVzLXNxdWFyZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTk2XCJ9LmZhLXNwYWNlLXNodXR0bGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOTdcIn0uZmEtc2xhY2s6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOThcIn0uZmEtZW52ZWxvcGUtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTk5XCJ9LmZhLXdvcmRwcmVzczpiZWZvcmV7Y29udGVudDpcIlxcZjE5YVwifS5mYS1vcGVuaWQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOWJcIn0uZmEtaW5zdGl0dXRpb246YmVmb3JlLC5mYS1iYW5rOmJlZm9yZSwuZmEtdW5pdmVyc2l0eTpiZWZvcmV7Y29udGVudDpcIlxcZjE5Y1wifS5mYS1tb3J0YXItYm9hcmQ6YmVmb3JlLC5mYS1ncmFkdWF0aW9uLWNhcDpiZWZvcmV7Y29udGVudDpcIlxcZjE5ZFwifS5mYS15YWhvbzpiZWZvcmV7Y29udGVudDpcIlxcZjE5ZVwifS5mYS1nb29nbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYTBcIn0uZmEtcmVkZGl0OmJlZm9yZXtjb250ZW50OlwiXFxmMWExXCJ9LmZhLXJlZGRpdC1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYTJcIn0uZmEtc3R1bWJsZXVwb24tY2lyY2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMWEzXCJ9LmZhLXN0dW1ibGV1cG9uOmJlZm9yZXtjb250ZW50OlwiXFxmMWE0XCJ9LmZhLWRlbGljaW91czpiZWZvcmV7Y29udGVudDpcIlxcZjFhNVwifS5mYS1kaWdnOmJlZm9yZXtjb250ZW50OlwiXFxmMWE2XCJ9LmZhLXBpZWQtcGlwZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYTdcIn0uZmEtcGllZC1waXBlci1hbHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYThcIn0uZmEtZHJ1cGFsOmJlZm9yZXtjb250ZW50OlwiXFxmMWE5XCJ9LmZhLWpvb21sYTpiZWZvcmV7Y29udGVudDpcIlxcZjFhYVwifS5mYS1sYW5ndWFnZTpiZWZvcmV7Y29udGVudDpcIlxcZjFhYlwifS5mYS1mYXg6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYWNcIn0uZmEtYnVpbGRpbmc6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYWRcIn0uZmEtY2hpbGQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYWVcIn0uZmEtcGF3OmJlZm9yZXtjb250ZW50OlwiXFxmMWIwXCJ9LmZhLXNwb29uOmJlZm9yZXtjb250ZW50OlwiXFxmMWIxXCJ9LmZhLWN1YmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYjJcIn0uZmEtY3ViZXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYjNcIn0uZmEtYmVoYW5jZTpiZWZvcmV7Y29udGVudDpcIlxcZjFiNFwifS5mYS1iZWhhbmNlLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjFiNVwifS5mYS1zdGVhbTpiZWZvcmV7Y29udGVudDpcIlxcZjFiNlwifS5mYS1zdGVhbS1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYjdcIn0uZmEtcmVjeWNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjFiOFwifS5mYS1hdXRvbW9iaWxlOmJlZm9yZSwuZmEtY2FyOmJlZm9yZXtjb250ZW50OlwiXFxmMWI5XCJ9LmZhLWNhYjpiZWZvcmUsLmZhLXRheGk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYmFcIn0uZmEtdHJlZTpiZWZvcmV7Y29udGVudDpcIlxcZjFiYlwifS5mYS1zcG90aWZ5OmJlZm9yZXtjb250ZW50OlwiXFxmMWJjXCJ9LmZhLWRldmlhbnRhcnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYmRcIn0uZmEtc291bmRjbG91ZDpiZWZvcmV7Y29udGVudDpcIlxcZjFiZVwifS5mYS1kYXRhYmFzZTpiZWZvcmV7Y29udGVudDpcIlxcZjFjMFwifS5mYS1maWxlLXBkZi1vOmJlZm9yZXtjb250ZW50OlwiXFxmMWMxXCJ9LmZhLWZpbGUtd29yZC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMWMyXCJ9LmZhLWZpbGUtZXhjZWwtbzpiZWZvcmV7Y29udGVudDpcIlxcZjFjM1wifS5mYS1maWxlLXBvd2VycG9pbnQtbzpiZWZvcmV7Y29udGVudDpcIlxcZjFjNFwifS5mYS1maWxlLXBob3RvLW86YmVmb3JlLC5mYS1maWxlLXBpY3R1cmUtbzpiZWZvcmUsLmZhLWZpbGUtaW1hZ2UtbzpiZWZvcmV7Y29udGVudDpcIlxcZjFjNVwifS5mYS1maWxlLXppcC1vOmJlZm9yZSwuZmEtZmlsZS1hcmNoaXZlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYzZcIn0uZmEtZmlsZS1zb3VuZC1vOmJlZm9yZSwuZmEtZmlsZS1hdWRpby1vOmJlZm9yZXtjb250ZW50OlwiXFxmMWM3XCJ9LmZhLWZpbGUtbW92aWUtbzpiZWZvcmUsLmZhLWZpbGUtdmlkZW8tbzpiZWZvcmV7Y29udGVudDpcIlxcZjFjOFwifS5mYS1maWxlLWNvZGUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjFjOVwifS5mYS12aW5lOmJlZm9yZXtjb250ZW50OlwiXFxmMWNhXCJ9LmZhLWNvZGVwZW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYxY2JcIn0uZmEtanNmaWRkbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxY2NcIn0uZmEtbGlmZS1ib3V5OmJlZm9yZSwuZmEtbGlmZS1idW95OmJlZm9yZSwuZmEtbGlmZS1zYXZlcjpiZWZvcmUsLmZhLXN1cHBvcnQ6YmVmb3JlLC5mYS1saWZlLXJpbmc6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxY2RcIn0uZmEtY2lyY2xlLW8tbm90Y2g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxY2VcIn0uZmEtcmE6YmVmb3JlLC5mYS1yZWJlbDpiZWZvcmV7Y29udGVudDpcIlxcZjFkMFwifS5mYS1nZTpiZWZvcmUsLmZhLWVtcGlyZTpiZWZvcmV7Y29udGVudDpcIlxcZjFkMVwifS5mYS1naXQtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMWQyXCJ9LmZhLWdpdDpiZWZvcmV7Y29udGVudDpcIlxcZjFkM1wifS5mYS15LWNvbWJpbmF0b3Itc3F1YXJlOmJlZm9yZSwuZmEteWMtc3F1YXJlOmJlZm9yZSwuZmEtaGFja2VyLW5ld3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZDRcIn0uZmEtdGVuY2VudC13ZWlibzpiZWZvcmV7Y29udGVudDpcIlxcZjFkNVwifS5mYS1xcTpiZWZvcmV7Y29udGVudDpcIlxcZjFkNlwifS5mYS13ZWNoYXQ6YmVmb3JlLC5mYS13ZWl4aW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZDdcIn0uZmEtc2VuZDpiZWZvcmUsLmZhLXBhcGVyLXBsYW5lOmJlZm9yZXtjb250ZW50OlwiXFxmMWQ4XCJ9LmZhLXNlbmQtbzpiZWZvcmUsLmZhLXBhcGVyLXBsYW5lLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZDlcIn0uZmEtaGlzdG9yeTpiZWZvcmV7Y29udGVudDpcIlxcZjFkYVwifS5mYS1jaXJjbGUtdGhpbjpiZWZvcmV7Y29udGVudDpcIlxcZjFkYlwifS5mYS1oZWFkZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZGNcIn0uZmEtcGFyYWdyYXBoOmJlZm9yZXtjb250ZW50OlwiXFxmMWRkXCJ9LmZhLXNsaWRlcnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZGVcIn0uZmEtc2hhcmUtYWx0OmJlZm9yZXtjb250ZW50OlwiXFxmMWUwXCJ9LmZhLXNoYXJlLWFsdC1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZTFcIn0uZmEtYm9tYjpiZWZvcmV7Y29udGVudDpcIlxcZjFlMlwifS5mYS1zb2NjZXItYmFsbC1vOmJlZm9yZSwuZmEtZnV0Ym9sLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZTNcIn0uZmEtdHR5OmJlZm9yZXtjb250ZW50OlwiXFxmMWU0XCJ9LmZhLWJpbm9jdWxhcnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZTVcIn0uZmEtcGx1ZzpiZWZvcmV7Y29udGVudDpcIlxcZjFlNlwifS5mYS1zbGlkZXNoYXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMWU3XCJ9LmZhLXR3aXRjaDpiZWZvcmV7Y29udGVudDpcIlxcZjFlOFwifS5mYS15ZWxwOmJlZm9yZXtjb250ZW50OlwiXFxmMWU5XCJ9LmZhLW5ld3NwYXBlci1vOmJlZm9yZXtjb250ZW50OlwiXFxmMWVhXCJ9LmZhLXdpZmk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZWJcIn0uZmEtY2FsY3VsYXRvcjpiZWZvcmV7Y29udGVudDpcIlxcZjFlY1wifS5mYS1wYXlwYWw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZWRcIn0uZmEtZ29vZ2xlLXdhbGxldDpiZWZvcmV7Y29udGVudDpcIlxcZjFlZVwifS5mYS1jYy12aXNhOmJlZm9yZXtjb250ZW50OlwiXFxmMWYwXCJ9LmZhLWNjLW1hc3RlcmNhcmQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZjFcIn0uZmEtY2MtZGlzY292ZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZjJcIn0uZmEtY2MtYW1leDpiZWZvcmV7Y29udGVudDpcIlxcZjFmM1wifS5mYS1jYy1wYXlwYWw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZjRcIn0uZmEtY2Mtc3RyaXBlOmJlZm9yZXtjb250ZW50OlwiXFxmMWY1XCJ9LmZhLWJlbGwtc2xhc2g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZjZcIn0uZmEtYmVsbC1zbGFzaC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMWY3XCJ9LmZhLXRyYXNoOmJlZm9yZXtjb250ZW50OlwiXFxmMWY4XCJ9LmZhLWNvcHlyaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjFmOVwifS5mYS1hdDpiZWZvcmV7Y29udGVudDpcIlxcZjFmYVwifS5mYS1leWVkcm9wcGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMWZiXCJ9LmZhLXBhaW50LWJydXNoOmJlZm9yZXtjb250ZW50OlwiXFxmMWZjXCJ9LmZhLWJpcnRoZGF5LWNha2U6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZmRcIn0uZmEtYXJlYS1jaGFydDpiZWZvcmV7Y29udGVudDpcIlxcZjFmZVwifS5mYS1waWUtY2hhcnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMDBcIn0uZmEtbGluZS1jaGFydDpiZWZvcmV7Y29udGVudDpcIlxcZjIwMVwifS5mYS1sYXN0Zm06YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMDJcIn0uZmEtbGFzdGZtLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjIwM1wifS5mYS10b2dnbGUtb2ZmOmJlZm9yZXtjb250ZW50OlwiXFxmMjA0XCJ9LmZhLXRvZ2dsZS1vbjpiZWZvcmV7Y29udGVudDpcIlxcZjIwNVwifS5mYS1iaWN5Y2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMjA2XCJ9LmZhLWJ1czpiZWZvcmV7Y29udGVudDpcIlxcZjIwN1wifS5mYS1pb3hob3N0OmJlZm9yZXtjb250ZW50OlwiXFxmMjA4XCJ9LmZhLWFuZ2VsbGlzdDpiZWZvcmV7Y29udGVudDpcIlxcZjIwOVwifS5mYS1jYzpiZWZvcmV7Y29udGVudDpcIlxcZjIwYVwifS5mYS1zaGVrZWw6YmVmb3JlLC5mYS1zaGVxZWw6YmVmb3JlLC5mYS1pbHM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMGJcIn0uZmEtbWVhbnBhdGg6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMGNcIn0uZmEtYnV5c2VsbGFkczpiZWZvcmV7Y29udGVudDpcIlxcZjIwZFwifS5mYS1jb25uZWN0ZGV2ZWxvcDpiZWZvcmV7Y29udGVudDpcIlxcZjIwZVwifS5mYS1kYXNoY3ViZTpiZWZvcmV7Y29udGVudDpcIlxcZjIxMFwifS5mYS1mb3J1bWJlZTpiZWZvcmV7Y29udGVudDpcIlxcZjIxMVwifS5mYS1sZWFucHViOmJlZm9yZXtjb250ZW50OlwiXFxmMjEyXCJ9LmZhLXNlbGxzeTpiZWZvcmV7Y29udGVudDpcIlxcZjIxM1wifS5mYS1zaGlydHNpbmJ1bGs6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMTRcIn0uZmEtc2ltcGx5YnVpbHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMTVcIn0uZmEtc2t5YXRsYXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMTZcIn0uZmEtY2FydC1wbHVzOmJlZm9yZXtjb250ZW50OlwiXFxmMjE3XCJ9LmZhLWNhcnQtYXJyb3ctZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjIxOFwifS5mYS1kaWFtb25kOmJlZm9yZXtjb250ZW50OlwiXFxmMjE5XCJ9LmZhLXNoaXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMWFcIn0uZmEtdXNlci1zZWNyZXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMWJcIn0uZmEtbW90b3JjeWNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjIxY1wifS5mYS1zdHJlZXQtdmlldzpiZWZvcmV7Y29udGVudDpcIlxcZjIxZFwifS5mYS1oZWFydGJlYXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMWVcIn0uZmEtdmVudXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMjFcIn0uZmEtbWFyczpiZWZvcmV7Y29udGVudDpcIlxcZjIyMlwifS5mYS1tZXJjdXJ5OmJlZm9yZXtjb250ZW50OlwiXFxmMjIzXCJ9LmZhLWludGVyc2V4OmJlZm9yZSwuZmEtdHJhbnNnZW5kZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMjRcIn0uZmEtdHJhbnNnZW5kZXItYWx0OmJlZm9yZXtjb250ZW50OlwiXFxmMjI1XCJ9LmZhLXZlbnVzLWRvdWJsZTpiZWZvcmV7Y29udGVudDpcIlxcZjIyNlwifS5mYS1tYXJzLWRvdWJsZTpiZWZvcmV7Y29udGVudDpcIlxcZjIyN1wifS5mYS12ZW51cy1tYXJzOmJlZm9yZXtjb250ZW50OlwiXFxmMjI4XCJ9LmZhLW1hcnMtc3Ryb2tlOmJlZm9yZXtjb250ZW50OlwiXFxmMjI5XCJ9LmZhLW1hcnMtc3Ryb2tlLXY6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMmFcIn0uZmEtbWFycy1zdHJva2UtaDpiZWZvcmV7Y29udGVudDpcIlxcZjIyYlwifS5mYS1uZXV0ZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMmNcIn0uZmEtZ2VuZGVybGVzczpiZWZvcmV7Y29udGVudDpcIlxcZjIyZFwifS5mYS1mYWNlYm9vay1vZmZpY2lhbDpiZWZvcmV7Y29udGVudDpcIlxcZjIzMFwifS5mYS1waW50ZXJlc3QtcDpiZWZvcmV7Y29udGVudDpcIlxcZjIzMVwifS5mYS13aGF0c2FwcDpiZWZvcmV7Y29udGVudDpcIlxcZjIzMlwifS5mYS1zZXJ2ZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzNcIn0uZmEtdXNlci1wbHVzOmJlZm9yZXtjb250ZW50OlwiXFxmMjM0XCJ9LmZhLXVzZXItdGltZXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzVcIn0uZmEtaG90ZWw6YmVmb3JlLC5mYS1iZWQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzZcIn0uZmEtdmlhY29pbjpiZWZvcmV7Y29udGVudDpcIlxcZjIzN1wifS5mYS10cmFpbjpiZWZvcmV7Y29udGVudDpcIlxcZjIzOFwifS5mYS1zdWJ3YXk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzlcIn0uZmEtbWVkaXVtOmJlZm9yZXtjb250ZW50OlwiXFxmMjNhXCJ9LmZhLXljOmJlZm9yZSwuZmEteS1jb21iaW5hdG9yOmJlZm9yZXtjb250ZW50OlwiXFxmMjNiXCJ9LmZhLW9wdGluLW1vbnN0ZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyM2NcIn0uZmEtb3BlbmNhcnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyM2RcIn0uZmEtZXhwZWRpdGVkc3NsOmJlZm9yZXtjb250ZW50OlwiXFxmMjNlXCJ9LmZhLWJhdHRlcnktNDpiZWZvcmUsLmZhLWJhdHRlcnktZnVsbDpiZWZvcmV7Y29udGVudDpcIlxcZjI0MFwifS5mYS1iYXR0ZXJ5LTM6YmVmb3JlLC5mYS1iYXR0ZXJ5LXRocmVlLXF1YXJ0ZXJzOmJlZm9yZXtjb250ZW50OlwiXFxmMjQxXCJ9LmZhLWJhdHRlcnktMjpiZWZvcmUsLmZhLWJhdHRlcnktaGFsZjpiZWZvcmV7Y29udGVudDpcIlxcZjI0MlwifS5mYS1iYXR0ZXJ5LTE6YmVmb3JlLC5mYS1iYXR0ZXJ5LXF1YXJ0ZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNDNcIn0uZmEtYmF0dGVyeS0wOmJlZm9yZSwuZmEtYmF0dGVyeS1lbXB0eTpiZWZvcmV7Y29udGVudDpcIlxcZjI0NFwifS5mYS1tb3VzZS1wb2ludGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMjQ1XCJ9LmZhLWktY3Vyc29yOmJlZm9yZXtjb250ZW50OlwiXFxmMjQ2XCJ9LmZhLW9iamVjdC1ncm91cDpiZWZvcmV7Y29udGVudDpcIlxcZjI0N1wifS5mYS1vYmplY3QtdW5ncm91cDpiZWZvcmV7Y29udGVudDpcIlxcZjI0OFwifS5mYS1zdGlja3ktbm90ZTpiZWZvcmV7Y29udGVudDpcIlxcZjI0OVwifS5mYS1zdGlja3ktbm90ZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjRhXCJ9LmZhLWNjLWpjYjpiZWZvcmV7Y29udGVudDpcIlxcZjI0YlwifS5mYS1jYy1kaW5lcnMtY2x1YjpiZWZvcmV7Y29udGVudDpcIlxcZjI0Y1wifS5mYS1jbG9uZTpiZWZvcmV7Y29udGVudDpcIlxcZjI0ZFwifS5mYS1iYWxhbmNlLXNjYWxlOmJlZm9yZXtjb250ZW50OlwiXFxmMjRlXCJ9LmZhLWhvdXJnbGFzcy1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjUwXCJ9LmZhLWhvdXJnbGFzcy0xOmJlZm9yZSwuZmEtaG91cmdsYXNzLXN0YXJ0OmJlZm9yZXtjb250ZW50OlwiXFxmMjUxXCJ9LmZhLWhvdXJnbGFzcy0yOmJlZm9yZSwuZmEtaG91cmdsYXNzLWhhbGY6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNTJcIn0uZmEtaG91cmdsYXNzLTM6YmVmb3JlLC5mYS1ob3VyZ2xhc3MtZW5kOmJlZm9yZXtjb250ZW50OlwiXFxmMjUzXCJ9LmZhLWhvdXJnbGFzczpiZWZvcmV7Y29udGVudDpcIlxcZjI1NFwifS5mYS1oYW5kLWdyYWItbzpiZWZvcmUsLmZhLWhhbmQtcm9jay1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjU1XCJ9LmZhLWhhbmQtc3RvcC1vOmJlZm9yZSwuZmEtaGFuZC1wYXBlci1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjU2XCJ9LmZhLWhhbmQtc2Npc3NvcnMtbzpiZWZvcmV7Y29udGVudDpcIlxcZjI1N1wifS5mYS1oYW5kLWxpemFyZC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjU4XCJ9LmZhLWhhbmQtc3BvY2stbzpiZWZvcmV7Y29udGVudDpcIlxcZjI1OVwifS5mYS1oYW5kLXBvaW50ZXItbzpiZWZvcmV7Y29udGVudDpcIlxcZjI1YVwifS5mYS1oYW5kLXBlYWNlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNWJcIn0uZmEtdHJhZGVtYXJrOmJlZm9yZXtjb250ZW50OlwiXFxmMjVjXCJ9LmZhLXJlZ2lzdGVyZWQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNWRcIn0uZmEtY3JlYXRpdmUtY29tbW9uczpiZWZvcmV7Y29udGVudDpcIlxcZjI1ZVwifS5mYS1nZzpiZWZvcmV7Y29udGVudDpcIlxcZjI2MFwifS5mYS1nZy1jaXJjbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNjFcIn0uZmEtdHJpcGFkdmlzb3I6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNjJcIn0uZmEtb2Rub2tsYXNzbmlraTpiZWZvcmV7Y29udGVudDpcIlxcZjI2M1wifS5mYS1vZG5va2xhc3NuaWtpLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjI2NFwifS5mYS1nZXQtcG9ja2V0OmJlZm9yZXtjb250ZW50OlwiXFxmMjY1XCJ9LmZhLXdpa2lwZWRpYS13OmJlZm9yZXtjb250ZW50OlwiXFxmMjY2XCJ9LmZhLXNhZmFyaTpiZWZvcmV7Y29udGVudDpcIlxcZjI2N1wifS5mYS1jaHJvbWU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNjhcIn0uZmEtZmlyZWZveDpiZWZvcmV7Y29udGVudDpcIlxcZjI2OVwifS5mYS1vcGVyYTpiZWZvcmV7Y29udGVudDpcIlxcZjI2YVwifS5mYS1pbnRlcm5ldC1leHBsb3JlcjpiZWZvcmV7Y29udGVudDpcIlxcZjI2YlwifS5mYS10djpiZWZvcmUsLmZhLXRlbGV2aXNpb246YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNmNcIn0uZmEtY29udGFvOmJlZm9yZXtjb250ZW50OlwiXFxmMjZkXCJ9LmZhLTUwMHB4OmJlZm9yZXtjb250ZW50OlwiXFxmMjZlXCJ9LmZhLWFtYXpvbjpiZWZvcmV7Y29udGVudDpcIlxcZjI3MFwifS5mYS1jYWxlbmRhci1wbHVzLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNzFcIn0uZmEtY2FsZW5kYXItbWludXMtbzpiZWZvcmV7Y29udGVudDpcIlxcZjI3MlwifS5mYS1jYWxlbmRhci10aW1lcy1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjczXCJ9LmZhLWNhbGVuZGFyLWNoZWNrLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNzRcIn0uZmEtaW5kdXN0cnk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNzVcIn0uZmEtbWFwLXBpbjpiZWZvcmV7Y29udGVudDpcIlxcZjI3NlwifS5mYS1tYXAtc2lnbnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNzdcIn0uZmEtbWFwLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNzhcIn0uZmEtbWFwOmJlZm9yZXtjb250ZW50OlwiXFxmMjc5XCJ9LmZhLWNvbW1lbnRpbmc6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyN2FcIn0uZmEtY29tbWVudGluZy1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjdiXCJ9LmZhLWhvdXp6OmJlZm9yZXtjb250ZW50OlwiXFxmMjdjXCJ9LmZhLXZpbWVvOmJlZm9yZXtjb250ZW50OlwiXFxmMjdkXCJ9LmZhLWJsYWNrLXRpZTpiZWZvcmV7Y29udGVudDpcIlxcZjI3ZVwifS5mYS1mb250aWNvbnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyODBcIn1cblx0XCJcIlwiXG5cbmNsYXNzIG1vZHVsZS5leHBvcnRzIGV4dGVuZHMgTGF5ZXJcblx0IyBodHRwczovL2ZvcnRhd2Vzb21lLmdpdGh1Yi5pby9Gb250LUF3ZXNvbWUvY2hlYXRzaGVldC9cblx0Y29uc3RydWN0b3I6IChvcHRpb25zPXt9KSAtPlxuXHRcdG9wdGlvbnMuYmFja2dyb3VuZENvbG9yID89ICcnXG5cdFx0b3B0aW9ucy5jb2xvciA/PSAnYmxhY2snXG5cdFx0b3B0aW9ucy5jbGlwID89IGZhbHNlXG5cdFx0b3B0aW9ucy5mb250U2l6ZSA/PSA0MFxuXHRcdGZhSW1wb3J0ZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdmYScpXG5cdFx0aWYgZmFJbXBvcnRlZC5sZW5ndGggaXMgMFxuXHRcdFx0VXRpbHMuaW5zZXJ0Q1NTIGZvbnRBd2Vzb21lQ1NTXG5cdFx0c3VwZXJcblx0XHRAc3R5bGUgPSBmb250RmFtaWx5OiAnRm9udEF3ZXNvbWUnXG5cdEBkZWZpbmUgXCJpY29uXCIsIFxuXHRcdGdldDogLT4gQGh0bWxcblx0XHRzZXQ6ICh2YWwpIC0+IFxuXHRcdFx0dmFsID0gdmFsLnJlcGxhY2UoJ2ZhLScsJycpXG5cdFx0XHRpZiBjbGFzc05hbWVzW3ZhbF0/XG5cdFx0XHRcdEBodG1sID0gY2xhc3NOYW1lc1t2YWxdXG5cdFx0XHRlbHNlXG5cdFx0XHRcdEBodG1sID0gdmFsIFxuXHRAZGVmaW5lIFwiZm9udFNpemVcIixcblx0XHRzZXQ6ICh2YWwpIC0+IFxuXHRcdFx0QHN0eWxlLmZvbnRTaXplID0gdmFsKydweCdcblx0XHRcdEBzdHlsZS5saW5lSGVpZ2h0ID0gdmFsKydweCdcblx0XHRcdHN0eWxlID0gXG5cdFx0XHRcdGZvbnRGYW1pbHk6ICdGb250QXdlc29tZSdcblx0XHRcdFx0Zm9udFNpemU6IHZhbCsncHgnXG5cdFx0XHRcdGxpbmVIZWlnaHQ6IHZhbCsncHgnXG5cdFx0XHRzaXplID0gVXRpbHMudGV4dFNpemUgQGljb24sIHN0eWxlXG5cdFx0XHRAd2lkdGggPSBzaXplLndpZHRoXG5cdFx0XHRAaGVpZ2h0ID0gc2l6ZS5oZWlnaHRcblx0QGRlZmluZSBcImNvbG9yXCIsXG5cdFx0c2V0OiAodmFsKSAtPiBAc3R5bGUuY29sb3IgPSB2YWwiLCJjbGFzcyBDYW1lcmFMYXllciBleHRlbmRzIFZpZGVvTGF5ZXJcbiAgY29uc3RydWN0b3I6IChvcHRpb25zID0ge30pIC0+XG4gICAgY3VzdG9tUHJvcHMgPVxuICAgICAgZmFjaW5nOiB0cnVlXG4gICAgICBmbGlwcGVkOiB0cnVlXG4gICAgICBhdXRvRmxpcDogdHJ1ZVxuICAgICAgcmVzb2x1dGlvbjogdHJ1ZVxuICAgICAgZml0OiB0cnVlXG5cbiAgICBiYXNlT3B0aW9ucyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpXG4gICAgICAuZmlsdGVyIChrZXkpIC0+ICFjdXN0b21Qcm9wc1trZXldXG4gICAgICAucmVkdWNlIChjbG9uZSwga2V5KSAtPlxuICAgICAgICBjbG9uZVtrZXldID0gb3B0aW9uc1trZXldXG4gICAgICAgIGNsb25lXG4gICAgICAsIHt9XG5cbiAgICBzdXBlcihiYXNlT3B0aW9ucylcblxuICAgIEBfZmFjaW5nID0gb3B0aW9ucy5mYWNpbmcgPyAnYmFjaydcbiAgICBAX2ZsaXBwZWQgPSBvcHRpb25zLmZsaXBwZWQgPyBmYWxzZVxuICAgIEBfYXV0b0ZsaXAgPSBvcHRpb25zLmF1dG9GbGlwID8gdHJ1ZVxuICAgIEBfcmVzb2x1dGlvbiA9IG9wdGlvbnMucmVzb2x1dGlvbiA/IDQ4MFxuXG4gICAgQF9zdGFydGVkID0gZmFsc2VcbiAgICBAX2RldmljZSA9IG51bGxcbiAgICBAX21hdGNoZWRGYWNpbmcgPSAndW5rbm93bidcbiAgICBAX3N0cmVhbSA9IG51bGxcbiAgICBAX3NjaGVkdWxlZFJlc3RhcnQgPSBudWxsXG4gICAgQF9yZWNvcmRpbmcgPSBudWxsXG5cbiAgICBAYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50J1xuICAgIEBjbGlwID0gdHJ1ZVxuXG4gICAgQHBsYXllci5zcmMgPSAnJ1xuICAgIEBwbGF5ZXIuYXV0b3BsYXkgPSB0cnVlXG4gICAgQHBsYXllci5tdXRlZCA9IHRydWVcbiAgICBAcGxheWVyLnBsYXlzaW5saW5lID0gdHJ1ZVxuICAgIEBwbGF5ZXIuc3R5bGUub2JqZWN0Rml0ID0gb3B0aW9ucy5maXQgPyAnY292ZXInXG5cbiAgQGRlZmluZSAnZmFjaW5nJyxcbiAgICBnZXQ6IC0+IEBfZmFjaW5nXG4gICAgc2V0OiAoZmFjaW5nKSAtPlxuICAgICAgQF9mYWNpbmcgPSBpZiBmYWNpbmcgPT0gJ2Zyb250JyB0aGVuIGZhY2luZyBlbHNlICdiYWNrJ1xuICAgICAgQF9zZXRSZXN0YXJ0KClcblxuICBAZGVmaW5lICdmbGlwcGVkJyxcbiAgICBnZXQ6IC0+IEBfZmxpcHBlZFxuICAgIHNldDogKGZsaXBwZWQpIC0+XG4gICAgICBAX2ZsaXBwZWQgPSBmbGlwcGVkXG4gICAgICBAX3NldFJlc3RhcnQoKVxuXG4gIEBkZWZpbmUgJ2F1dG9GbGlwJyxcbiAgICBnZXQ6IC0+IEBfYXV0b0ZsaXBcbiAgICBzZXQ6IChhdXRvRmxpcCkgLT5cbiAgICAgIEBfYXV0b0ZsaXAgPSBhdXRvRmxpcFxuICAgICAgQF9zZXRSZXN0YXJ0KClcblxuICBAZGVmaW5lICdyZXNvbHV0aW9uJyxcbiAgICBnZXQ6IC0+IEBfcmVzb2x1dGlvblxuICAgIHNldDogKHJlc29sdXRpb24pIC0+XG4gICAgICBAX3Jlc29sdXRpb24gPSByZXNvbHV0aW9uXG4gICAgICBAX3NldFJlc3RhcnQoKVxuXG4gIEBkZWZpbmUgJ2ZpdCcsXG4gICAgZ2V0OiAtPiBAcGxheWVyLnN0eWxlLm9iamVjdEZpdFxuICAgIHNldDogKGZpdCkgLT4gQHBsYXllci5zdHlsZS5vYmplY3RGaXQgPSBmaXRcblxuICBAZGVmaW5lICdpc1JlY29yZGluZycsXG4gICAgZ2V0OiAtPiBAX3JlY29yZGluZz8ucmVjb3JkZXIuc3RhdGUgPT0gJ3JlY29yZGluZydcblxuICB0b2dnbGVGYWNpbmc6IC0+XG4gICAgQF9mYWNpbmcgPSBpZiBAX2ZhY2luZyA9PSAnZnJvbnQnIHRoZW4gJ2JhY2snIGVsc2UgJ2Zyb250J1xuICAgIEBfc2V0UmVzdGFydCgpXG5cbiAgY2FwdHVyZTogKHdpZHRoID0gQHdpZHRoLCBoZWlnaHQgPSBAaGVpZ2h0LCByYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKSAtPlxuICAgIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIilcbiAgICBjYW52YXMud2lkdGggPSByYXRpbyAqIHdpZHRoXG4gICAgY2FudmFzLmhlaWdodCA9IHJhdGlvICogaGVpZ2h0XG5cbiAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKVxuICAgIEBkcmF3KGNvbnRleHQpXG5cbiAgICB1cmwgPSBjYW52YXMudG9EYXRhVVJMKClcbiAgICBAZW1pdCgnY2FwdHVyZScsIHVybClcblxuICAgIHVybFxuXG4gIGRyYXc6IChjb250ZXh0KSAtPlxuICAgIHJldHVybiB1bmxlc3MgY29udGV4dFxuXG4gICAgY292ZXIgPSAoc3JjVywgc3JjSCwgZHN0VywgZHN0SCkgLT5cbiAgICAgIHNjYWxlWCA9IGRzdFcgLyBzcmNXXG4gICAgICBzY2FsZVkgPSBkc3RIIC8gc3JjSFxuICAgICAgc2NhbGUgPSBpZiBzY2FsZVggPiBzY2FsZVkgdGhlbiBzY2FsZVggZWxzZSBzY2FsZVlcbiAgICAgIHdpZHRoOiBzcmNXICogc2NhbGUsIGhlaWdodDogc3JjSCAqIHNjYWxlXG5cbiAgICB7dmlkZW9XaWR0aCwgdmlkZW9IZWlnaHR9ID0gQHBsYXllclxuXG4gICAgY2xpcEJveCA9IHdpZHRoOiBjb250ZXh0LmNhbnZhcy53aWR0aCwgaGVpZ2h0OiBjb250ZXh0LmNhbnZhcy5oZWlnaHRcbiAgICBsYXllckJveCA9IGNvdmVyKEB3aWR0aCwgQGhlaWdodCwgY2xpcEJveC53aWR0aCwgY2xpcEJveC5oZWlnaHQpXG4gICAgdmlkZW9Cb3ggPSBjb3Zlcih2aWRlb1dpZHRoLCB2aWRlb0hlaWdodCwgbGF5ZXJCb3gud2lkdGgsIGxheWVyQm94LmhlaWdodClcblxuICAgIHggPSAoY2xpcEJveC53aWR0aCAtIHZpZGVvQm94LndpZHRoKSAvIDJcbiAgICB5ID0gKGNsaXBCb3guaGVpZ2h0IC0gdmlkZW9Cb3guaGVpZ2h0KSAvIDJcblxuICAgIGNvbnRleHQuZHJhd0ltYWdlKEBwbGF5ZXIsIHgsIHksIHZpZGVvQm94LndpZHRoLCB2aWRlb0JveC5oZWlnaHQpXG5cbiAgc3RhcnQ6IC0+XG4gICAgQF9lbnVtZXJhdGVEZXZpY2VzKClcbiAgICAudGhlbiAoZGV2aWNlcykgPT5cbiAgICAgIGRldmljZXMgPSBkZXZpY2VzLmZpbHRlciAoZGV2aWNlKSAtPiBkZXZpY2Uua2luZCA9PSAndmlkZW9pbnB1dCdcblxuICAgICAgZm9yIGRldmljZSBpbiBkZXZpY2VzXG4gICAgICAgIGlmIGRldmljZS5sYWJlbC5pbmRleE9mKEBfZmFjaW5nKSAhPSAtMVxuICAgICAgICAgIEBfbWF0Y2hlZEZhY2luZyA9IEBfZmFjaW5nXG4gICAgICAgICAgcmV0dXJuIGRldmljZVxuXG4gICAgICBAX21hdGNoZWRGYWNpbmcgPSAndW5rbm93bidcblxuICAgICAgaWYgZGV2aWNlcy5sZW5ndGggPiAwIHRoZW4gZGV2aWNlc1swXSBlbHNlIFByb21pc2UucmVqZWN0KClcblxuICAgIC50aGVuIChkZXZpY2UpID0+XG4gICAgICByZXR1cm4gaWYgIWRldmljZSB8fCBkZXZpY2UuZGV2aWNlSWQgPT0gQF9kZXZpY2U/LmRldmljZUlkXG5cbiAgICAgIEBzdG9wKClcbiAgICAgIEBfZGV2aWNlID0gZGV2aWNlXG5cbiAgICAgIGNvbnN0cmFpbnRzID1cbiAgICAgICAgdmlkZW86XG4gICAgICAgICAgbWFuZGF0b3J5OiB7bWluV2lkdGg6IEBfcmVzb2x1dGlvbiwgbWluSGVpZ2h0OiBAX3Jlc29sdXRpb259XG4gICAgICAgICAgb3B0aW9uYWw6IFt7c291cmNlSWQ6IEBfZGV2aWNlLmRldmljZUlkfV1cbiAgICAgICAgYXVkaW86XG4gICAgICAgICAgdHJ1ZVxuXG4gICAgICBAX2dldFVzZXJNZWRpYShjb25zdHJhaW50cylcblxuICAgIC50aGVuIChzdHJlYW0pID0+XG4gICAgICBAcGxheWVyLnNyY09iamVjdCA9IHN0cmVhbVxuICAgICAgQF9zdGFydGVkID0gdHJ1ZVxuICAgICAgQF9zdHJlYW0gPSBzdHJlYW1cbiAgICAgIEBfZmxpcCgpXG5cbiAgICAuY2F0Y2ggKGVycm9yKSAtPlxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcblxuICBzdG9wOiAtPlxuICAgIEBfc3RhcnRlZCA9IGZhbHNlXG5cbiAgICBAcGxheWVyLnBhdXNlKClcbiAgICBAcGxheWVyLnNyY09iamVjdCA9IG51bGxcblxuICAgIEBfc3RyZWFtPy5nZXRUcmFja3MoKS5mb3JFYWNoICh0cmFjaykgLT4gdHJhY2suc3RvcCgpXG4gICAgQF9zdHJlYW0gPSBudWxsXG4gICAgQF9kZXZpY2UgPSBudWxsXG5cbiAgICBpZiBAX3NjaGVkdWxlZFJlc3RhcnRcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKEBfc2NoZWR1bGVkUmVzdGFydClcbiAgICAgIEBfc2NoZWR1bGVkUmVzdGFydCA9IG51bGxcblxuICBzdGFydFJlY29yZGluZzogLT5cbiAgICBpZiBAX3JlY29yZGluZ1xuICAgICAgQF9yZWNvcmRpbmcucmVjb3JkZXIuc3RvcCgpXG4gICAgICBAX3JlY29yZGluZyA9IG51bGxcblxuICAgIGNodW5rcyA9IFtdXG5cbiAgICByZWNvcmRlciA9IG5ldyBNZWRpYVJlY29yZGVyKEBfc3RyZWFtLCB7bWltZVR5cGU6ICd2aWRlby93ZWJtJ30pXG4gICAgcmVjb3JkZXIuYWRkRXZlbnRMaXN0ZW5lciAnc3RhcnQnLCAoZXZlbnQpID0+IEBlbWl0KCdzdGFydHJlY29yZGluZycpXG4gICAgcmVjb3JkZXIuYWRkRXZlbnRMaXN0ZW5lciAnZGF0YWF2YWlsYWJsZScsIChldmVudCkgLT4gY2h1bmtzLnB1c2goZXZlbnQuZGF0YSlcbiAgICByZWNvcmRlci5hZGRFdmVudExpc3RlbmVyICdzdG9wJywgKGV2ZW50KSA9PlxuICAgICAgYmxvYiA9IG5ldyBCbG9iKGNodW5rcylcbiAgICAgIHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXG4gICAgICBAZW1pdCgnc3RvcHJlY29yZGluZycpXG4gICAgICBAZW1pdCgncmVjb3JkJywgdXJsKVxuXG4gICAgcmVjb3JkZXIuc3RhcnQoKVxuXG4gICAgQF9yZWNvcmRpbmcgPSB7cmVjb3JkZXIsIGNodW5rc31cblxuICBzdG9wUmVjb3JkaW5nOiAtPlxuICAgIHJldHVybiBpZiAhQF9yZWNvcmRpbmdcbiAgICBAX3JlY29yZGluZy5yZWNvcmRlci5zdG9wKClcbiAgICBAX3JlY29yZGluZyA9IG51bGxcblxuICBvbkNhcHR1cmU6IChjYWxsYmFjaykgLT4gQG9uKCdjYXB0dXJlJywgY2FsbGJhY2spXG4gIG9uU3RhcnRSZWNvcmRpbmc6IChjYWxsYmFjaykgLT4gQG9uKCdzdGFydHJlY29yZGluZycsIGNhbGxiYWNrKVxuICBvblN0b3BSZWNvcmRpbmc6IChjYWxsYmFjaykgLT4gQG9uKCdzdG9wcmVjb3JkaW5nJywgY2FsbGJhY2spXG4gIG9uUmVjb3JkOiAoY2FsbGJhY2spIC0+IEBvbigncmVjb3JkJywgY2FsbGJhY2spXG5cbiAgX3NldFJlc3RhcnQ6IC0+XG4gICAgcmV0dXJuIGlmICFAX3N0YXJ0ZWQgfHwgQF9zY2hlZHVsZWRSZXN0YXJ0XG5cbiAgICBAX3NjaGVkdWxlZFJlc3RhcnQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT5cbiAgICAgIEBfc2NoZWR1bGVkUmVzdGFydCA9IG51bGxcbiAgICAgIEBzdGFydCgpXG5cbiAgX2ZsaXA6IC0+XG4gICAgQF9mbGlwcGVkID0gQF9tYXRjaGVkRmFjaW5nID09ICdmcm9udCcgaWYgQF9hdXRvRmxpcFxuICAgIHggPSBpZiBAX2ZsaXBwZWQgdGhlbiAtMSBlbHNlIDFcbiAgICBAcGxheWVyLnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9IFwic2NhbGUoI3t4fSwgMSlcIlxuXG4gIF9lbnVtZXJhdGVEZXZpY2VzOiAtPlxuICAgIHRyeVxuICAgICAgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5lbnVtZXJhdGVEZXZpY2VzKClcbiAgICBjYXRjaFxuICAgICAgUHJvbWlzZS5yZWplY3QoKVxuXG4gIF9nZXRVc2VyTWVkaWE6IChjb25zdHJhaW50cykgLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgICAgdHJ5XG4gICAgICAgIGd1bSA9IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYVxuICAgICAgICBndW0uY2FsbChuYXZpZ2F0b3IsIGNvbnN0cmFpbnRzLCByZXNvbHZlLCByZWplY3QpXG4gICAgICBjYXRjaFxuICAgICAgICByZWplY3QoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYUxheWVyIGlmIG1vZHVsZT9cbkZyYW1lci5DYW1lcmFMYXllciA9IENhbWVyYUxheWVyXG4iLCIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2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
