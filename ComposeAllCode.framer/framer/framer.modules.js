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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uL21vZHVsZXMvbXlNb2R1bGUuY29mZmVlIiwiLi4vbW9kdWxlcy9pbnB1dC1mcmFtZXIvaW5wdXQuY29mZmVlIiwiLi4vbW9kdWxlcy9mcmFtZXItY2FtZXJhLWlucHV0L0NhbWVyYUlucHV0LmNvZmZlZSIsIi4uL21vZHVsZXMvRm9udEF3ZXNvbWUuY29mZmVlIiwiLi4vbW9kdWxlcy9DYW1lcmFMYXllci5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiMgQWRkIHRoZSBmb2xsb3dpbmcgbGluZSB0byB5b3VyIHByb2plY3QgaW4gRnJhbWVyIFN0dWRpby4gXG4jIG15TW9kdWxlID0gcmVxdWlyZSBcIm15TW9kdWxlXCJcbiMgUmVmZXJlbmNlIHRoZSBjb250ZW50cyBieSBuYW1lLCBsaWtlIG15TW9kdWxlLm15RnVuY3Rpb24oKSBvciBteU1vZHVsZS5teVZhclxuXG5leHBvcnRzLm15VmFyID0gXCJteVZhcmlhYmxlXCJcblxuZXhwb3J0cy5teUZ1bmN0aW9uID0gLT5cblx0cHJpbnQgXCJteUZ1bmN0aW9uIGlzIHJ1bm5pbmdcIlxuXG5leHBvcnRzLm15QXJyYXkgPSBbMSwgMiwgM10iLCJleHBvcnRzLmtleWJvYXJkTGF5ZXIgPSBuZXcgTGF5ZXJcblx0eDowLCB5OlNjcmVlbi5oZWlnaHQsIHdpZHRoOlNjcmVlbi53aWR0aCwgaGVpZ2h0OjQzMlxuXHRodG1sOlwiPGltZyBzdHlsZT0nd2lkdGg6IDEwMCU7JyBzcmM9J21vZHVsZXMva2V5Ym9hcmQucG5nJy8+XCJcblxuI3NjcmVlbiB3aWR0aCB2cy4gc2l6ZSBvZiBpbWFnZSB3aWR0aFxuZ3Jvd3RoUmF0aW8gPSBTY3JlZW4ud2lkdGggLyA3MzJcbmltYWdlSGVpZ2h0ID0gZ3Jvd3RoUmF0aW8gKiA0MzJcblxuIyBFeHRlbmRzIHRoZSBMYXllclN0eWxlIGNsYXNzIHdoaWNoIGRvZXMgdGhlIHBpeGVsIHJhdGlvIGNhbGN1bGF0aW9ucyBpbiBmcmFtZXJcbl9pbnB1dFN0eWxlID1cblx0T2JqZWN0LmFzc2lnbih7fSwgRnJhbWVyLkxheWVyU3R5bGUsXG5cdFx0Y2FsY3VsYXRlUGl4ZWxSYXRpbyA9IChsYXllciwgdmFsdWUpIC0+XG5cdFx0XHQodmFsdWUgKiBsYXllci5jb250ZXh0LnBpeGVsTXVsdGlwbGllcikgKyBcInB4XCJcblxuXHRcdGZvbnRTaXplOiAobGF5ZXIpIC0+XG5cdFx0XHRjYWxjdWxhdGVQaXhlbFJhdGlvKGxheWVyLCBsYXllci5fcHJvcGVydGllcy5mb250U2l6ZSlcblxuXHRcdGxpbmVIZWlnaHQ6IChsYXllcikgLT5cblx0XHRcdChsYXllci5fcHJvcGVydGllcy5saW5lSGVpZ2h0KSArIFwiZW1cIlxuXG5cdFx0cGFkZGluZzogKGxheWVyKSAtPlxuXHRcdFx0eyBwaXhlbE11bHRpcGxpZXIgfSA9IGxheWVyLmNvbnRleHRcblx0XHRcdHBhZGRpbmcgPSBbXVxuXHRcdFx0cGFkZGluZ1ZhbHVlID0gbGF5ZXIuX3Byb3BlcnRpZXMucGFkZGluZ1xuXG5cdFx0XHQjIENoZWNrIGlmIHdlIGhhdmUgYSBzaW5nbGUgbnVtYmVyIGFzIGludGVnZXJcblx0XHRcdGlmIE51bWJlci5pc0ludGVnZXIocGFkZGluZ1ZhbHVlKVxuXHRcdFx0XHRyZXR1cm4gY2FsY3VsYXRlUGl4ZWxSYXRpbyhsYXllciwgcGFkZGluZ1ZhbHVlKVxuXG5cdFx0XHQjIElmIHdlIGhhdmUgbXVsdGlwbGUgdmFsdWVzIHRoZXkgY29tZSBhcyBzdHJpbmcgKGUuZy4gXCIxIDIgMyA0XCIpXG5cdFx0XHRwYWRkaW5nVmFsdWVzID0gbGF5ZXIuX3Byb3BlcnRpZXMucGFkZGluZy5zcGxpdChcIiBcIilcblxuXHRcdFx0c3dpdGNoIHBhZGRpbmdWYWx1ZXMubGVuZ3RoXG5cdFx0XHRcdHdoZW4gNFxuXHRcdFx0XHRcdHBhZGRpbmcudG9wID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcucmlnaHQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMV0pXG5cdFx0XHRcdFx0cGFkZGluZy5ib3R0b20gPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMl0pXG5cdFx0XHRcdFx0cGFkZGluZy5sZWZ0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzNdKVxuXG5cdFx0XHRcdHdoZW4gM1xuXHRcdFx0XHRcdHBhZGRpbmcudG9wID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcucmlnaHQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMV0pXG5cdFx0XHRcdFx0cGFkZGluZy5ib3R0b20gPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMl0pXG5cdFx0XHRcdFx0cGFkZGluZy5sZWZ0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzFdKVxuXG5cdFx0XHRcdHdoZW4gMlxuXHRcdFx0XHRcdHBhZGRpbmcudG9wID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcucmlnaHQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMV0pXG5cdFx0XHRcdFx0cGFkZGluZy5ib3R0b20gPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMF0pXG5cdFx0XHRcdFx0cGFkZGluZy5sZWZ0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzFdKVxuXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRwYWRkaW5nLnRvcCA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1swXSlcblx0XHRcdFx0XHRwYWRkaW5nLnJpZ2h0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcuYm90dG9tID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcubGVmdCA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1swXSlcblxuXHRcdFx0IyBSZXR1cm4gYXMgNC12YWx1ZSBzdHJpbmcgKGUuZyBcIjFweCAycHggM3B4IDRweFwiKVxuXHRcdFx0XCIje3BhZGRpbmcudG9wICogcGl4ZWxNdWx0aXBsaWVyfXB4ICN7cGFkZGluZy5yaWdodCAqIHBpeGVsTXVsdGlwbGllcn1weCAje3BhZGRpbmcuYm90dG9tICogcGl4ZWxNdWx0aXBsaWVyfXB4ICN7cGFkZGluZy5sZWZ0ICogcGl4ZWxNdWx0aXBsaWVyfXB4XCJcblx0KVxuXG5leHBvcnRzLmtleWJvYXJkTGF5ZXIuc3RhdGVzID1cblx0c2hvd246XG5cdFx0eTogU2NyZWVuLmhlaWdodCAtIGltYWdlSGVpZ2h0XG5cbmV4cG9ydHMua2V5Ym9hcmRMYXllci5zdGF0ZXMuYW5pbWF0aW9uT3B0aW9ucyA9XG5cdGN1cnZlOiBcInNwcmluZyg1MDAsNTAsMTUpXCJcblxuY2xhc3MgZXhwb3J0cy5JbnB1dCBleHRlbmRzIExheWVyXG5cdEBkZWZpbmUgXCJzdHlsZVwiLFxuXHRcdGdldDogLT4gQGlucHV0LnN0eWxlXG5cdFx0c2V0OiAodmFsdWUpIC0+XG5cdFx0XHRfLmV4dGVuZCBAaW5wdXQuc3R5bGUsIHZhbHVlXG5cblx0QGRlZmluZSBcInZhbHVlXCIsXG5cdFx0Z2V0OiAtPiBAaW5wdXQudmFsdWVcblx0XHRzZXQ6ICh2YWx1ZSkgLT5cblx0XHRcdEBpbnB1dC52YWx1ZSA9IHZhbHVlXG5cblx0Y29uc3RydWN0b3I6IChvcHRpb25zID0ge30pIC0+XG5cdFx0b3B0aW9ucy5zZXR1cCA/PSBmYWxzZVxuXHRcdG9wdGlvbnMud2lkdGggPz0gU2NyZWVuLndpZHRoXG5cdFx0b3B0aW9ucy5jbGlwID89IGZhbHNlXG5cdFx0b3B0aW9ucy5oZWlnaHQgPz0gNjBcblx0XHRvcHRpb25zLmJhY2tncm91bmRDb2xvciA/PSBpZiBvcHRpb25zLnNldHVwIHRoZW4gXCJyZ2JhKDI1NSwgNjAsIDQ3LCAuNSlcIiBlbHNlIFwicmdiYSgyNTUsIDI1NSwgMjU1LCAuMDEpXCIgIyBcInRyYW5zcGFyZW50XCIgc2VlbXMgdG8gY2F1c2UgYSBidWcgaW4gbGF0ZXN0IHNhZmFyaSB2ZXJzaW9uXG5cdFx0b3B0aW9ucy5mb250U2l6ZSA/PSAzMFxuXHRcdG9wdGlvbnMubGluZUhlaWdodCA/PSAxXG5cdFx0b3B0aW9ucy5wYWRkaW5nID89IDEwXG5cdFx0b3B0aW9ucy50ZXh0ID89IFwiXCJcblx0XHRvcHRpb25zLnBsYWNlaG9sZGVyID89IFwiXCJcblx0XHRvcHRpb25zLnZpcnR1YWxLZXlib2FyZCA/PSBpZiBVdGlscy5pc01vYmlsZSgpIHRoZW4gZmFsc2UgZWxzZSB0cnVlXG5cdFx0b3B0aW9ucy50eXBlID89IFwidGV4dFwiXG5cdFx0b3B0aW9ucy5nb0J1dHRvbiA/PSBmYWxzZVxuXHRcdG9wdGlvbnMuYXV0b0NvcnJlY3QgPz0gXCJvblwiXG5cdFx0b3B0aW9ucy5hdXRvQ29tcGxldGUgPz0gXCJvblwiXG5cdFx0b3B0aW9ucy5hdXRvQ2FwaXRhbGl6ZSA/PSBcIm9uXCJcblx0XHRvcHRpb25zLnNwZWxsQ2hlY2sgPz0gXCJvblwiXG5cdFx0b3B0aW9ucy5hdXRvZm9jdXMgPz0gZmFsc2Vcblx0XHRvcHRpb25zLnRleHRDb2xvciA/PSBcIiMwMDBcIlxuXHRcdG9wdGlvbnMuZm9udEZhbWlseSA/PSBcIi1hcHBsZS1zeXN0ZW1cIlxuXHRcdG9wdGlvbnMuZm9udFdlaWdodCA/PSBcIjUwMFwiXG5cdFx0b3B0aW9ucy5zdWJtaXQgPz0gZmFsc2Vcblx0XHRvcHRpb25zLnRhYkluZGV4ID89IDBcblx0XHRvcHRpb25zLnRleHRhcmVhID89IGZhbHNlXG5cdFx0b3B0aW9ucy5kaXNhYmxlZCA/PSBmYWxzZVxuXG5cdFx0c3VwZXIgb3B0aW9uc1xuXG5cdFx0IyBBZGQgYWRkaXRpb25hbCBwcm9wZXJ0aWVzXG5cdFx0QF9wcm9wZXJ0aWVzLmZvbnRTaXplID0gb3B0aW9ucy5mb250U2l6ZVxuXHRcdEBfcHJvcGVydGllcy5saW5lSGVpZ2h0ID0gb3B0aW9ucy5saW5lSGVpZ2h0XG5cdFx0QF9wcm9wZXJ0aWVzLnBhZGRpbmcgPSBvcHRpb25zLnBhZGRpbmdcblxuXHRcdEBwbGFjZWhvbGRlckNvbG9yID0gb3B0aW9ucy5wbGFjZWhvbGRlckNvbG9yIGlmIG9wdGlvbnMucGxhY2Vob2xkZXJDb2xvcj9cblx0XHRAaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50IGlmIG9wdGlvbnMudGV4dGFyZWEgdGhlbiAndGV4dGFyZWEnIGVsc2UgJ2lucHV0J1xuXHRcdEBpbnB1dC5pZCA9IFwiaW5wdXQtI3tfLm5vdygpfVwiXG5cblx0XHQjIEFkZCBzdHlsaW5nIHRvIHRoZSBpbnB1dCBlbGVtZW50XG5cdFx0QGlucHV0LnN0eWxlLndpZHRoID0gX2lucHV0U3R5bGVbXCJ3aWR0aFwiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5oZWlnaHQgPSBfaW5wdXRTdHlsZVtcImhlaWdodFwiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5mb250U2l6ZSA9IF9pbnB1dFN0eWxlW1wiZm9udFNpemVcIl0oQClcblx0XHRAaW5wdXQuc3R5bGUubGluZUhlaWdodCA9IF9pbnB1dFN0eWxlW1wibGluZUhlaWdodFwiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5vdXRsaW5lID0gXCJub25lXCJcblx0XHRAaW5wdXQuc3R5bGUuYm9yZGVyID0gXCJub25lXCJcblx0XHRAaW5wdXQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gb3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3Jcblx0XHRAaW5wdXQuc3R5bGUucGFkZGluZyA9IF9pbnB1dFN0eWxlW1wicGFkZGluZ1wiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5mb250RmFtaWx5ID0gb3B0aW9ucy5mb250RmFtaWx5XG5cdFx0QGlucHV0LnN0eWxlLmNvbG9yID0gb3B0aW9ucy50ZXh0Q29sb3Jcblx0XHRAaW5wdXQuc3R5bGUuZm9udFdlaWdodCA9IG9wdGlvbnMuZm9udFdlaWdodFxuXG5cdFx0QGlucHV0LnZhbHVlID0gb3B0aW9ucy50ZXh0XG5cdFx0QGlucHV0LnR5cGUgPSBvcHRpb25zLnR5cGVcblx0XHRAaW5wdXQucGxhY2Vob2xkZXIgPSBvcHRpb25zLnBsYWNlaG9sZGVyXG5cdFx0QGlucHV0LnNldEF0dHJpYnV0ZSBcInRhYmluZGV4XCIsIG9wdGlvbnMudGFiaW5kZXhcblx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwiYXV0b2NvcnJlY3RcIiwgb3B0aW9ucy5hdXRvQ29ycmVjdFxuXHRcdEBpbnB1dC5zZXRBdHRyaWJ1dGUgXCJhdXRvY29tcGxldGVcIiwgb3B0aW9ucy5hdXRvQ29tcGxldGVcblx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwiYXV0b2NhcGl0YWxpemVcIiwgb3B0aW9ucy5hdXRvQ2FwaXRhbGl6ZVxuXHRcdGlmIG9wdGlvbnMuZGlzYWJsZWQgPT0gdHJ1ZVxuXHRcdFx0QGlucHV0LnNldEF0dHJpYnV0ZSBcImRpc2FibGVkXCIsIHRydWVcblx0XHRpZiBvcHRpb25zLmF1dG9mb2N1cyA9PSB0cnVlXG5cdFx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwiYXV0b2ZvY3VzXCIsIHRydWVcblx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwic3BlbGxjaGVja1wiLCBvcHRpb25zLnNwZWxsQ2hlY2tcblx0XHRAZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgXCJmb3JtXCJcblxuXHRcdGlmIChvcHRpb25zLmdvQnV0dG9uICYmICFvcHRpb25zLnN1Ym1pdCkgfHwgIW9wdGlvbnMuc3VibWl0XG5cdFx0XHRAZm9ybS5hY3Rpb24gPSBcIiNcIlxuXHRcdFx0QGZvcm0uYWRkRXZlbnRMaXN0ZW5lciBcInN1Ym1pdFwiLCAoZXZlbnQpIC0+XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXHRcdEBmb3JtLmFwcGVuZENoaWxkIEBpbnB1dFxuXHRcdEBfZWxlbWVudC5hcHBlbmRDaGlsZCBAZm9ybVxuXG5cdFx0QGJhY2tncm91bmRDb2xvciA9IFwidHJhbnNwYXJlbnRcIlxuXHRcdEB1cGRhdGVQbGFjZWhvbGRlckNvbG9yIG9wdGlvbnMucGxhY2Vob2xkZXJDb2xvciBpZiBAcGxhY2Vob2xkZXJDb2xvclxuXG5cdFx0I29ubHkgc2hvdyBob25vciB2aXJ0dWFsIGtleWJvYXJkIG9wdGlvbiB3aGVuIG5vdCBvbiBtb2JpbGUsXG5cdFx0I290aGVyd2lzZSBpZ25vcmVcblx0XHRpZiAhVXRpbHMuaXNNb2JpbGUoKSAmJiBvcHRpb25zLnZpcnR1YWxLZXlib2FyZCBpcyB0cnVlXG5cdFx0XHRAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciBcImZvY3VzXCIsIC0+XG5cdFx0XHRcdGV4cG9ydHMua2V5Ym9hcmRMYXllci5icmluZ1RvRnJvbnQoKVxuXHRcdFx0XHRleHBvcnRzLmtleWJvYXJkTGF5ZXIuc3RhdGVDeWNsZSgpXG5cdFx0XHRAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciBcImJsdXJcIiwgLT5cblx0XHRcdFx0ZXhwb3J0cy5rZXlib2FyZExheWVyLmFuaW1hdGUoXCJkZWZhdWx0XCIpXG5cblx0dXBkYXRlUGxhY2Vob2xkZXJDb2xvcjogKGNvbG9yKSAtPlxuXHRcdEBwbGFjZWhvbGRlckNvbG9yID0gY29sb3Jcblx0XHRpZiBAcGFnZVN0eWxlP1xuXHRcdFx0ZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZCBAcGFnZVN0eWxlXG5cdFx0QHBhZ2VTdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgXCJzdHlsZVwiXG5cdFx0QHBhZ2VTdHlsZS50eXBlID0gXCJ0ZXh0L2Nzc1wiXG5cdFx0Y3NzID0gXCIjI3tAaW5wdXQuaWR9Ojotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyIHsgY29sb3I6ICN7QHBsYWNlaG9sZGVyQ29sb3J9OyB9XCJcblx0XHRAcGFnZVN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlIGNzcylcblx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkIEBwYWdlU3R5bGVcblxuXHRmb2N1czogKCkgLT5cblx0XHRAaW5wdXQuZm9jdXMoKVxuXG5cdHVuZm9jdXM6ICgpIC0+XG5cdFx0QGlucHV0LmJsdXIoKVxuXG5cdG9uRm9jdXM6IChjYikgLT5cblx0XHRAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciBcImZvY3VzXCIsIC0+XG5cdFx0XHRjYi5hcHBseShAKVxuXG5cdG9uQmx1cjogKGNiKSAtPlxuXHRcdEBpbnB1dC5hZGRFdmVudExpc3RlbmVyIFwiYmx1clwiLCAtPlxuXHRcdFx0Y2IuYXBwbHkoQClcblxuXHRvblVuZm9jdXM6IHRoaXMub25CbHVyXG5cdFxuXHRkaXNhYmxlOiAoKSAtPlxuXHRcdEBpbnB1dC5zZXRBdHRyaWJ1dGUgXCJkaXNhYmxlZFwiLCB0cnVlXG5cblx0ZW5hYmxlOiAoKSA9PlxuXHRcdEBpbnB1dC5yZW1vdmVBdHRyaWJ1dGUgXCJkaXNhYmxlZFwiLCB0cnVlXG5cdFxuIiwiY2xhc3MgZXhwb3J0cy5DYW1lcmFJbnB1dCBleHRlbmRzIFRleHRMYXllclxuXHRjb25zdHJ1Y3RvcjogKEBvcHRpb25zPXt9KSAtPlxuXHRcdF8uZGVmYXVsdHMgQG9wdGlvbnMsXG5cdFx0XHRpZ25vcmVFdmVudHM6IGZhbHNlXG5cdFx0c3VwZXIgQG9wdGlvbnNcblxuXHRcdEBjaGFuZ2VIYW5kbGVyID0gKGV2ZW50KSAtPlxuXHRcdFx0aWYoQG9wdGlvbnMuY2FsbGJhY2spXG5cdFx0XHRcdGZpbGUgPSBAX2VsZW1lbnQuZmlsZXNbMF1cblx0XHRcdFx0dXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKVxuXHRcdFx0XHRAb3B0aW9ucy5jYWxsYmFjayh1cmwsIGZpbGUudHlwZSlcblxuXHRcdEBjaGFuZ2VIYW5kbGVyID0gQGNoYW5nZUhhbmRsZXIuYmluZCBAXG5cdFx0RXZlbnRzLndyYXAoQF9lbGVtZW50KS5hZGRFdmVudExpc3RlbmVyIFwiY2hhbmdlXCIsIEBjaGFuZ2VIYW5kbGVyXG5cblx0X2NyZWF0ZUVsZW1lbnQ6IC0+XG5cdFx0cmV0dXJuIGlmIEBfZWxlbWVudD9cblx0XHRAX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50IFwiaW5wdXRcIlxuXHRcdEBfZWxlbWVudC50eXBlID0gXCJmaWxlXCJcblx0XHRAX2VsZW1lbnQuY2FwdHVyZSA9IHRydWVcblx0XHRAX2VsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZyYW1lckxheWVyXCIpXG5cdFx0QF9lbGVtZW50LnN0eWxlW1wiLXdlYmtpdC1hcHBlYXJhbmNlXCJdID0gXCJub25lXCJcblx0XHRAX2VsZW1lbnQuc3R5bGVbXCItd2Via2l0LXRleHQtc2l6ZS1hZGp1c3RcIl0gPSBcIm5vbmVcIlxuXHRcdEBfZWxlbWVudC5zdHlsZVtcIm91dGxpbmVcIl0gPSBcIm5vbmVcIlxuXHRcdHN3aXRjaCBAb3B0aW9ucy5hY2NlcHRcblx0XHRcdHdoZW4gXCJpbWFnZVwiIHRoZW4gQF9lbGVtZW50LmFjY2VwdCA9IFwiaW1hZ2UvKlwiXG5cdFx0XHR3aGVuIFwidmlkZW9cIiB0aGVuIEBfZWxlbWVudC5hY2NlcHQgPSBcInZpZGVvLypcIlxuXHRcdFx0ZWxzZSBAX2VsZW1lbnQuYWNjZXB0ID0gXCJpbWFnZS8qLHZpZGVvLypcIlxuXG5cdEBkZWZpbmUgXCJhY2NlcHRcIixcblx0XHRnZXQ6IC0+XG5cdFx0XHRAX2VsZW1lbnQuYWNjZXB0XG5cdFx0c2V0OiAodmFsdWUpIC0+XG5cdFx0XHRzd2l0Y2ggdmFsdWVcblx0XHRcdFx0d2hlbiBcImltYWdlXCIgdGhlbiBAX2VsZW1lbnQuYWNjZXB0ID0gXCJpbWFnZS8qXCJcblx0XHRcdFx0d2hlbiBcInZpZGVvXCIgdGhlbiBAX2VsZW1lbnQuYWNjZXB0ID0gXCJ2aWRlby8qXCJcblx0XHRcdFx0ZWxzZSBAX2VsZW1lbnQuYWNjZXB0ID0gXCJpbWFnZS8qLHZpZGVvLypcIiIsImNsYXNzTmFtZXMgPSB7XCI1MDBweFwiOlwiJiN4ZjI2ZTtcIixcImFkanVzdFwiOlwiJiN4ZjA0MjtcIixcImFkblwiOlwiJiN4ZjE3MDtcIixcImFsaWduLWNlbnRlclwiOlwiJiN4ZjAzNztcIixcImFsaWduLWp1c3RpZnlcIjpcIiYjeGYwMzk7XCIsXCJhbGlnbi1sZWZ0XCI6XCImI3hmMDM2O1wiLFwiYWxpZ24tcmlnaHRcIjpcIiYjeGYwMzg7XCIsXCJhbWF6b25cIjpcIiYjeGYyNzA7XCIsXCJhbWJ1bGFuY2VcIjpcIiYjeGYwZjk7XCIsXCJhbmNob3JcIjpcIiYjeGYxM2Q7XCIsXCJhbmRyb2lkXCI6XCImI3hmMTdiO1wiLFwiYW5nZWxsaXN0XCI6XCImI3hmMjA5O1wiLFwiYW5nbGUtZG91YmxlLWRvd25cIjpcIiYjeGYxMDM7XCIsXCJhbmdsZS1kb3VibGUtbGVmdFwiOlwiJiN4ZjEwMDtcIixcImFuZ2xlLWRvdWJsZS1yaWdodFwiOlwiJiN4ZjEwMTtcIixcImFuZ2xlLWRvdWJsZS11cFwiOlwiJiN4ZjEwMjtcIixcImFuZ2xlLWRvd25cIjpcIiYjeGYxMDc7XCIsXCJhbmdsZS1sZWZ0XCI6XCImI3hmMTA0O1wiLFwiYW5nbGUtcmlnaHRcIjpcIiYjeGYxMDU7XCIsXCJhbmdsZS11cFwiOlwiJiN4ZjEwNjtcIixcImFwcGxlXCI6XCImI3hmMTc5O1wiLFwiYXJjaGl2ZVwiOlwiJiN4ZjE4NztcIixcImFyZWEtY2hhcnRcIjpcIiYjeGYxZmU7XCIsXCJhcnJvdy1jaXJjbGUtZG93blwiOlwiJiN4ZjBhYjtcIixcImFycm93LWNpcmNsZS1sZWZ0XCI6XCImI3hmMGE4O1wiLFwiYXJyb3ctY2lyY2xlLW8tZG93blwiOlwiJiN4ZjAxYTtcIixcImFycm93LWNpcmNsZS1vLWxlZnRcIjpcIiYjeGYxOTA7XCIsXCJhcnJvdy1jaXJjbGUtby1yaWdodFwiOlwiJiN4ZjE4ZTtcIixcImFycm93LWNpcmNsZS1vLXVwXCI6XCImI3hmMDFiO1wiLFwiYXJyb3ctY2lyY2xlLXJpZ2h0XCI6XCImI3hmMGE5O1wiLFwiYXJyb3ctY2lyY2xlLXVwXCI6XCImI3hmMGFhO1wiLFwiYXJyb3ctZG93blwiOlwiJiN4ZjA2MztcIixcImFycm93LWxlZnRcIjpcIiYjeGYwNjA7XCIsXCJhcnJvdy1yaWdodFwiOlwiJiN4ZjA2MTtcIixcImFycm93LXVwXCI6XCImI3hmMDYyO1wiLFwiYXJyb3dzXCI6XCImI3hmMDQ3O1wiLFwiYXJyb3dzLWFsdFwiOlwiJiN4ZjBiMjtcIixcImFycm93cy1oXCI6XCImI3hmMDdlO1wiLFwiYXJyb3dzLXZcIjpcIiYjeGYwN2Q7XCIsXCJhc3Rlcmlza1wiOlwiJiN4ZjA2OTtcIixcImF0XCI6XCImI3hmYTtcIixcImF1dG9tb2JpbGUgKGFsaWFzKVwiOlwiJiN4ZjFiOTtcIixcImJhY2t3YXJkXCI6XCImI3hmMDRhO1wiLFwiYmFsYW5jZS1zY2FsZVwiOlwiJiN4ZjI0ZTtcIixcImJhblwiOlwiJiN4ZjA1ZTtcIixcImJhbmsgKGFsaWFzKVwiOlwiJiN4ZjE5YztcIixcImJhci1jaGFydFwiOlwiJiN4ZjA4MDtcIixcImJhci1jaGFydC1vIChhbGlhcylcIjpcIiYjeGYwODA7XCIsXCJiYXJjb2RlXCI6XCImI3hmMDJhO1wiLFwiYmFyc1wiOlwiJiN4ZjBjOTtcIixcImJhdHRlcnktMCAoYWxpYXMpXCI6XCImI3hmMjQ0O1wiLFwiYmF0dGVyeS0xIChhbGlhcylcIjpcIiYjeGYyNDM7XCIsXCJiYXR0ZXJ5LTIgKGFsaWFzKVwiOlwiJiN4ZjI0MjtcIixcImJhdHRlcnktMyAoYWxpYXMpXCI6XCImI3hmMjQxO1wiLFwiYmF0dGVyeS00IChhbGlhcylcIjpcIiYjeGYyNDA7XCIsXCJiYXR0ZXJ5LWVtcHR5XCI6XCImI3hmMjQ0O1wiLFwiYmF0dGVyeS1mdWxsXCI6XCImI3hmMjQwO1wiLFwiYmF0dGVyeS1oYWxmXCI6XCImI3hmMjQyO1wiLFwiYmF0dGVyeS1xdWFydGVyXCI6XCImI3hmMjQzO1wiLFwiYmF0dGVyeS10aHJlZS1xdWFydGVyc1wiOlwiJiN4ZjI0MTtcIixcImJlZFwiOlwiJiN4ZjIzNjtcIixcImJlZXJcIjpcIiYjeGYwZmM7XCIsXCJiZWhhbmNlXCI6XCImI3hmMWI0O1wiLFwiYmVoYW5jZS1zcXVhcmVcIjpcIiYjeGYxYjU7XCIsXCJiZWxsXCI6XCImI3hmMGYzO1wiLFwiYmVsbC1vXCI6XCImI3hmMGEyO1wiLFwiYmVsbC1zbGFzaFwiOlwiJiN4ZjFmNjtcIixcImJlbGwtc2xhc2gtb1wiOlwiJiN4ZjFmNztcIixcImJpY3ljbGVcIjpcIiYjeGYyMDY7XCIsXCJiaW5vY3VsYXJzXCI6XCImI3hmMWU1O1wiLFwiYmlydGhkYXktY2FrZVwiOlwiJiN4ZjFmZDtcIixcImJpdGJ1Y2tldFwiOlwiJiN4ZjE3MTtcIixcImJpdGJ1Y2tldC1zcXVhcmVcIjpcIiYjeGYxNzI7XCIsXCJiaXRjb2luIChhbGlhcylcIjpcIiYjeGYxNWE7XCIsXCJibGFjay10aWVcIjpcIiYjeGYyN2U7XCIsXCJib2xkXCI6XCImI3hmMDMyO1wiLFwiYm9sdFwiOlwiJiN4ZjBlNztcIixcImJvbWJcIjpcIiYjeGYxZTI7XCIsXCJib29rXCI6XCImI3hmMDJkO1wiLFwiYm9va21hcmtcIjpcIiYjeGYwMmU7XCIsXCJib29rbWFyay1vXCI6XCImI3hmMDk3O1wiLFwiYnJpZWZjYXNlXCI6XCImI3hmMGIxO1wiLFwiYnRjXCI6XCImI3hmMTVhO1wiLFwiYnVnXCI6XCImI3hmMTg4O1wiLFwiYnVpbGRpbmdcIjpcIiYjeGYxYWQ7XCIsXCJidWlsZGluZy1vXCI6XCImI3hmMGY3O1wiLFwiYnVsbGhvcm5cIjpcIiYjeGYwYTE7XCIsXCJidWxsc2V5ZVwiOlwiJiN4ZjE0MDtcIixcImJ1c1wiOlwiJiN4ZjIwNztcIixcImJ1eXNlbGxhZHNcIjpcIiYjeGYyMGQ7XCIsXCJjYWIgKGFsaWFzKVwiOlwiJiN4ZjFiYTtcIixcImNhbGN1bGF0b3JcIjpcIiYjeGYxZWM7XCIsXCJjYWxlbmRhclwiOlwiJiN4ZjA3MztcIixcImNhbGVuZGFyLWNoZWNrLW9cIjpcIiYjeGYyNzQ7XCIsXCJjYWxlbmRhci1taW51cy1vXCI6XCImI3hmMjcyO1wiLFwiY2FsZW5kYXItb1wiOlwiJiN4ZjEzMztcIixcImNhbGVuZGFyLXBsdXMtb1wiOlwiJiN4ZjI3MTtcIixcImNhbGVuZGFyLXRpbWVzLW9cIjpcIiYjeGYyNzM7XCIsXCJjYW1lcmFcIjpcIiYjeGYwMzA7XCIsXCJjYW1lcmEtcmV0cm9cIjpcIiYjeGYwODM7XCIsXCJjYXJcIjpcIiYjeGYxYjk7XCIsXCJjYXJldC1kb3duXCI6XCImI3hmMGQ3O1wiLFwiY2FyZXQtbGVmdFwiOlwiJiN4ZjBkOTtcIixcImNhcmV0LXJpZ2h0XCI6XCImI3hmMGRhO1wiLFwiY2FyZXQtc3F1YXJlLW8tZG93blwiOlwiJiN4ZjE1MDtcIixcImNhcmV0LXNxdWFyZS1vLWxlZnRcIjpcIiYjeGYxOTE7XCIsXCJjYXJldC1zcXVhcmUtby1yaWdodFwiOlwiJiN4ZjE1MjtcIixcImNhcmV0LXNxdWFyZS1vLXVwXCI6XCImI3hmMTUxO1wiLFwiY2FyZXQtdXBcIjpcIiYjeGYwZDg7XCIsXCJjYXJ0LWFycm93LWRvd25cIjpcIiYjeGYyMTg7XCIsXCJjYXJ0LXBsdXNcIjpcIiYjeGYyMTc7XCIsXCJjY1wiOlwiJiN4ZjIwYTtcIixcImNjLWFtZXhcIjpcIiYjeGYxZjM7XCIsXCJjYy1kaW5lcnMtY2x1YlwiOlwiJiN4ZjI0YztcIixcImNjLWRpc2NvdmVyXCI6XCImI3hmMWYyO1wiLFwiY2MtamNiXCI6XCImI3hmMjRiO1wiLFwiY2MtbWFzdGVyY2FyZFwiOlwiJiN4ZjFmMTtcIixcImNjLXBheXBhbFwiOlwiJiN4ZjFmNDtcIixcImNjLXN0cmlwZVwiOlwiJiN4ZjFmNTtcIixcImNjLXZpc2FcIjpcIiYjeGYxZjA7XCIsXCJjZXJ0aWZpY2F0ZVwiOlwiJiN4ZjBhMztcIixcImNoYWluIChhbGlhcylcIjpcIiYjeGYwYzE7XCIsXCJjaGFpbi1icm9rZW5cIjpcIiYjeGYxMjc7XCIsXCJjaGVja1wiOlwiJiN4ZjAwYztcIixcImNoZWNrLWNpcmNsZVwiOlwiJiN4ZjA1ODtcIixcImNoZWNrLWNpcmNsZS1vXCI6XCImI3hmMDVkO1wiLFwiY2hlY2stc3F1YXJlXCI6XCImI3hmMTRhO1wiLFwiY2hlY2stc3F1YXJlLW9cIjpcIiYjeGYwNDY7XCIsXCJjaGV2cm9uLWNpcmNsZS1kb3duXCI6XCImI3hmMTNhO1wiLFwiY2hldnJvbi1jaXJjbGUtbGVmdFwiOlwiJiN4ZjEzNztcIixcImNoZXZyb24tY2lyY2xlLXJpZ2h0XCI6XCImI3hmMTM4O1wiLFwiY2hldnJvbi1jaXJjbGUtdXBcIjpcIiYjeGYxMzk7XCIsXCJjaGV2cm9uLWRvd25cIjpcIiYjeGYwNzg7XCIsXCJjaGV2cm9uLWxlZnRcIjpcIiYjeGYwNTM7XCIsXCJjaGV2cm9uLXJpZ2h0XCI6XCImI3hmMDU0O1wiLFwiY2hldnJvbi11cFwiOlwiJiN4ZjA3NztcIixcImNoaWxkXCI6XCImI3hmMWFlO1wiLFwiY2hyb21lXCI6XCImI3hmMjY4O1wiLFwiY2lyY2xlXCI6XCImI3hmMTExO1wiLFwiY2lyY2xlLW9cIjpcIiYjeGYxMGM7XCIsXCJjaXJjbGUtby1ub3RjaFwiOlwiJiN4ZjFjZTtcIixcImNpcmNsZS10aGluXCI6XCImI3hmMWRiO1wiLFwiY2xpcGJvYXJkXCI6XCImI3hmMGVhO1wiLFwiY2xvY2stb1wiOlwiJiN4ZjAxNztcIixcImNsb25lXCI6XCImI3hmMjRkO1wiLFwiY2xvc2UgKGFsaWFzKVwiOlwiJiN4ZjAwZDtcIixcImNsb3VkXCI6XCImI3hmMGMyO1wiLFwiY2xvdWQtZG93bmxvYWRcIjpcIiYjeGYwZWQ7XCIsXCJjbG91ZC11cGxvYWRcIjpcIiYjeGYwZWU7XCIsXCJjbnkgKGFsaWFzKVwiOlwiJiN4ZjE1NztcIixcImNvZGVcIjpcIiYjeGYxMjE7XCIsXCJjb2RlLWZvcmtcIjpcIiYjeGYxMjY7XCIsXCJjb2RlcGVuXCI6XCImI3hmMWNiO1wiLFwiY29mZmVlXCI6XCImI3hmMGY0O1wiLFwiY29nXCI6XCImI3hmMDEzO1wiLFwiY29nc1wiOlwiJiN4ZjA4NTtcIixcImNvbHVtbnNcIjpcIiYjeGYwZGI7XCIsXCJjb21tZW50XCI6XCImI3hmMDc1O1wiLFwiY29tbWVudC1vXCI6XCImI3hmMGU1O1wiLFwiY29tbWVudGluZ1wiOlwiJiN4ZjI3YTtcIixcImNvbW1lbnRpbmctb1wiOlwiJiN4ZjI3YjtcIixcImNvbW1lbnRzXCI6XCImI3hmMDg2O1wiLFwiY29tbWVudHMtb1wiOlwiJiN4ZjBlNjtcIixcImNvbXBhc3NcIjpcIiYjeGYxNGU7XCIsXCJjb21wcmVzc1wiOlwiJiN4ZjA2NjtcIixcImNvbm5lY3RkZXZlbG9wXCI6XCImI3hmMjBlO1wiLFwiY29udGFvXCI6XCImI3hmMjZkO1wiLFwiY29weSAoYWxpYXMpXCI6XCImI3hmMGM1O1wiLFwiY29weXJpZ2h0XCI6XCImI3hmMWY5O1wiLFwiY3JlYXRpdmUtY29tbW9uc1wiOlwiJiN4ZjI1ZTtcIixcImNyZWRpdC1jYXJkXCI6XCImI3hmMDlkO1wiLFwiY3JvcFwiOlwiJiN4ZjEyNTtcIixcImNyb3NzaGFpcnNcIjpcIiYjeGYwNWI7XCIsXCJjc3MzXCI6XCImI3hmMTNjO1wiLFwiY3ViZVwiOlwiJiN4ZjFiMjtcIixcImN1YmVzXCI6XCImI3hmMWIzO1wiLFwiY3V0IChhbGlhcylcIjpcIiYjeGYwYzQ7XCIsXCJjdXRsZXJ5XCI6XCImI3hmMGY1O1wiLFwiZGFzaGJvYXJkIChhbGlhcylcIjpcIiYjeGYwZTQ7XCIsXCJkYXNoY3ViZVwiOlwiJiN4ZjIxMDtcIixcImRhdGFiYXNlXCI6XCImI3hmMWMwO1wiLFwiZGVkZW50IChhbGlhcylcIjpcIiYjeGYwM2I7XCIsXCJkZWxpY2lvdXNcIjpcIiYjeGYxYTU7XCIsXCJkZXNrdG9wXCI6XCImI3hmMTA4O1wiLFwiZGV2aWFudGFydFwiOlwiJiN4ZjFiZDtcIixcImRpYW1vbmRcIjpcIiYjeGYyMTk7XCIsXCJkaWdnXCI6XCImI3hmMWE2O1wiLFwiZG9sbGFyIChhbGlhcylcIjpcIiYjeGYxNTU7XCIsXCJkb3QtY2lyY2xlLW9cIjpcIiYjeGYxOTI7XCIsXCJkb3dubG9hZFwiOlwiJiN4ZjAxOTtcIixcImRyaWJiYmxlXCI6XCImI3hmMTdkO1wiLFwiZHJvcGJveFwiOlwiJiN4ZjE2YjtcIixcImRydXBhbFwiOlwiJiN4ZjFhOTtcIixcImVkaXQgKGFsaWFzKVwiOlwiJiN4ZjA0NDtcIixcImVqZWN0XCI6XCImI3hmMDUyO1wiLFwiZWxsaXBzaXMtaFwiOlwiJiN4ZjE0MTtcIixcImVsbGlwc2lzLXZcIjpcIiYjeGYxNDI7XCIsXCJlbXBpcmVcIjpcIiYjeGYxZDE7XCIsXCJlbnZlbG9wZVwiOlwiJiN4ZjBlMDtcIixcImVudmVsb3BlLW9cIjpcIiYjeGYwMDM7XCIsXCJlbnZlbG9wZS1zcXVhcmVcIjpcIiYjeGYxOTk7XCIsXCJlcmFzZXJcIjpcIiYjeGYxMmQ7XCIsXCJldXJcIjpcIiYjeGYxNTM7XCIsXCJldXJvIChhbGlhcylcIjpcIiYjeGYxNTM7XCIsXCJleGNoYW5nZVwiOlwiJiN4ZjBlYztcIixcImV4Y2xhbWF0aW9uXCI6XCImI3hmMTJhO1wiLFwiZXhjbGFtYXRpb24tY2lyY2xlXCI6XCImI3hmMDZhO1wiLFwiZXhjbGFtYXRpb24tdHJpYW5nbGVcIjpcIiYjeGYwNzE7XCIsXCJleHBhbmRcIjpcIiYjeGYwNjU7XCIsXCJleHBlZGl0ZWRzc2xcIjpcIiYjeGYyM2U7XCIsXCJleHRlcm5hbC1saW5rXCI6XCImI3hmMDhlO1wiLFwiZXh0ZXJuYWwtbGluay1zcXVhcmVcIjpcIiYjeGYxNGM7XCIsXCJleWVcIjpcIiYjeGYwNmU7XCIsXCJleWUtc2xhc2hcIjpcIiYjeGYwNzA7XCIsXCJleWVkcm9wcGVyXCI6XCImI3hmMWZiO1wiLFwiZmZhY2Vib29rXCI6XCImI3hmMDlhO1wiLFwiZmZhY2Vib29rLWYgKGFsaWFzKVwiOlwiJiN4ZjA5YTtcIixcIjQuM2ZmYWNlYm9vay1vZmZpY2lhbFwiOlwiJiN4ZjIzMDtcIixcImZmYWNlYm9vay1zcXVhcmVcIjpcIiYjeGYwODI7XCIsXCJmZmFzdC1iYWNrd2FyZFwiOlwiJiN4ZjA0OTtcIixcImZmYXN0LWZvcndhcmRcIjpcIiYjeGYwNTA7XCIsXCI0LjFmZmF4XCI6XCImI3hmMWFjO1wiLFwiZmVlZCAoYWxpYXMpXCI6XCImI3hmMDllO1wiLFwiZmVtYWxlXCI6XCImI3hmMTgyO1wiLFwiZmlnaHRlci1qZXRcIjpcIiYjeGYwZmI7XCIsXCJmaWxlXCI6XCImI3hmMTViO1wiLFwiZmlsZS1hcmNoaXZlLW9cIjpcIiYjeGYxYzY7XCIsXCJmaWxlLWF1ZGlvLW9cIjpcIiYjeGYxYzc7XCIsXCJmaWxlLWNvZGUtb1wiOlwiJiN4ZjFjOTtcIixcImZpbGUtZXhjZWwtb1wiOlwiJiN4ZjFjMztcIixcImZpbGUtaW1hZ2Utb1wiOlwiJiN4ZjFjNTtcIixcImZpbGUtbW92aWUtbyAoYWxpYXMpXCI6XCImI3hmMWM4O1wiLFwiZmlsZS1vXCI6XCImI3hmMDE2O1wiLFwiZmlsZS1wZGYtb1wiOlwiJiN4ZjFjMTtcIixcImZpbGUtcGhvdG8tbyAoYWxpYXMpXCI6XCImI3hmMWM1O1wiLFwiZmlsZS1waWN0dXJlLW8gKGFsaWFzKVwiOlwiJiN4ZjFjNTtcIixcImZpbGUtcG93ZXJwb2ludC1vXCI6XCImI3hmMWM0O1wiLFwiZmlsZS1zb3VuZC1vIChhbGlhcylcIjpcIiYjeGYxYzc7XCIsXCJmaWxlLXRleHRcIjpcIiYjeGYxNWM7XCIsXCJmaWxlLXRleHQtb1wiOlwiJiN4ZjBmNjtcIixcImZpbGUtdmlkZW8tb1wiOlwiJiN4ZjFjODtcIixcImZpbGUtd29yZC1vXCI6XCImI3hmMWMyO1wiLFwiZmlsZS16aXAtbyAoYWxpYXMpXCI6XCImI3hmMWM2O1wiLFwiZmlsZXMtb1wiOlwiJiN4ZjBjNTtcIixcImZpbG1cIjpcIiYjeGYwMDg7XCIsXCJmaWx0ZXJcIjpcIiYjeGYwYjA7XCIsXCJmaXJlXCI6XCImI3hmMDZkO1wiLFwiZmlyZS1leHRpbmd1aXNoZXJcIjpcIiYjeGYxMzQ7XCIsXCJmaXJlZm94XCI6XCImI3hmMjY5O1wiLFwiZmxhZ1wiOlwiJiN4ZjAyNDtcIixcImZsYWctY2hlY2tlcmVkXCI6XCImI3hmMTFlO1wiLFwiZmxhZy1vXCI6XCImI3hmMTFkO1wiLFwiZmxhc2ggKGFsaWFzKVwiOlwiJiN4ZjBlNztcIixcImZsYXNrXCI6XCImI3hmMGMzO1wiLFwiZmxpY2tyXCI6XCImI3hmMTZlO1wiLFwiZmxvcHB5LW9cIjpcIiYjeGYwYzc7XCIsXCJmb2xkZXJcIjpcIiYjeGYwN2I7XCIsXCJmb2xkZXItb1wiOlwiJiN4ZjExNDtcIixcImZvbGRlci1vcGVuXCI6XCImI3hmMDdjO1wiLFwiZm9sZGVyLW9wZW4tb1wiOlwiJiN4ZjExNTtcIixcImZvbnRcIjpcIiYjeGYwMzE7XCIsXCJmb250aWNvbnNcIjpcIiYjeGYyODA7XCIsXCJmb3J1bWJlZVwiOlwiJiN4ZjIxMTtcIixcImZvcndhcmRcIjpcIiYjeGYwNGU7XCIsXCJmb3Vyc3F1YXJlXCI6XCImI3hmMTgwO1wiLFwiZnJvd24tb1wiOlwiJiN4ZjExOTtcIixcImZ1dGJvbC1vXCI6XCImI3hmMWUzO1wiLFwiZ2FtZXBhZFwiOlwiJiN4ZjExYjtcIixcImdhdmVsXCI6XCImI3hmMGUzO1wiLFwiZ2JwXCI6XCImI3hmMTU0O1wiLFwiZ2UgKGFsaWFzKVwiOlwiJiN4ZjFkMTtcIixcImdlYXIgKGFsaWFzKVwiOlwiJiN4ZjAxMztcIixcImdlYXJzIChhbGlhcylcIjpcIiYjeGYwODU7XCIsXCJnZW5kZXJsZXNzXCI6XCImI3hmMjJkO1wiLFwiZ2V0LXBvY2tldFwiOlwiJiN4ZjI2NTtcIixcImdnXCI6XCImI3hmMjYwO1wiLFwiZ2ctY2lyY2xlXCI6XCImI3hmMjYxO1wiLFwiZ2lmdFwiOlwiJiN4ZjA2YjtcIixcImdpdFwiOlwiJiN4ZjFkMztcIixcImdpdC1zcXVhcmVcIjpcIiYjeGYxZDI7XCIsXCJnaXRodWJcIjpcIiYjeGYwOWI7XCIsXCJnaXRodWItYWx0XCI6XCImI3hmMTEzO1wiLFwiZ2l0aHViLXNxdWFyZVwiOlwiJiN4ZjA5MjtcIixcImdpdHRpcCAoYWxpYXMpXCI6XCImI3hmMTg0O1wiLFwiZ2xhc3NcIjpcIiYjeGYwMDA7XCIsXCJnbG9iZVwiOlwiJiN4ZjBhYztcIixcImdvb2dsZVwiOlwiJiN4ZjFhMDtcIixcImdvb2dsZS1wbHVzXCI6XCImI3hmMGQ1O1wiLFwiZ29vZ2xlLXBsdXMtc3F1YXJlXCI6XCImI3hmMGQ0O1wiLFwiZ29vZ2xlLXdhbGxldFwiOlwiJiN4ZjFlZTtcIixcImdyYWR1YXRpb24tY2FwXCI6XCImI3hmMTlkO1wiLFwiZ3JhdGlwYXlcIjpcIiYjeGYxODQ7XCIsXCJncm91cCAoYWxpYXMpXCI6XCImI3hmMGMwO1wiLFwiaC1zcXVhcmVcIjpcIiYjeGYwZmQ7XCIsXCJoYWNrZXItbmV3c1wiOlwiJiN4ZjFkNDtcIixcImhhbmQtZ3JhYi1vIChhbGlhcylcIjpcIiYjeGYyNTU7XCIsXCJoYW5kLWxpemFyZC1vXCI6XCImI3hmMjU4O1wiLFwiaGFuZC1vLWRvd25cIjpcIiYjeGYwYTc7XCIsXCJoYW5kLW8tbGVmdFwiOlwiJiN4ZjBhNTtcIixcImhhbmQtby1yaWdodFwiOlwiJiN4ZjBhNDtcIixcImhhbmQtby11cFwiOlwiJiN4ZjBhNjtcIixcImhhbmQtcGFwZXItb1wiOlwiJiN4ZjI1NjtcIixcImhhbmQtcGVhY2Utb1wiOlwiJiN4ZjI1YjtcIixcImhhbmQtcG9pbnRlci1vXCI6XCImI3hmMjVhO1wiLFwiaGFuZC1yb2NrLW9cIjpcIiYjeGYyNTU7XCIsXCJoYW5kLXNjaXNzb3JzLW9cIjpcIiYjeGYyNTc7XCIsXCJoYW5kLXNwb2NrLW9cIjpcIiYjeGYyNTk7XCIsXCJoYW5kLXN0b3AtbyAoYWxpYXMpXCI6XCImI3hmMjU2O1wiLFwiaGRkLW9cIjpcIiYjeGYwYTA7XCIsXCJoZWFkZXJcIjpcIiYjeGYxZGM7XCIsXCJoZWFkcGhvbmVzXCI6XCImI3hmMDI1O1wiLFwiaGVhcnRcIjpcIiYjeGYwMDQ7XCIsXCJoZWFydC1vXCI6XCImI3hmMDhhO1wiLFwiaGVhcnRiZWF0XCI6XCImI3hmMjFlO1wiLFwiaGlzdG9yeVwiOlwiJiN4ZjFkYTtcIixcImhvbWVcIjpcIiYjeGYwMTU7XCIsXCJob3NwaXRhbC1vXCI6XCImI3hmMGY4O1wiLFwiaG90ZWwgKGFsaWFzKVwiOlwiJiN4ZjIzNjtcIixcImhvdXJnbGFzc1wiOlwiJiN4ZjI1NDtcIixcImhvdXJnbGFzcy0xIChhbGlhcylcIjpcIiYjeGYyNTE7XCIsXCJob3VyZ2xhc3MtMiAoYWxpYXMpXCI6XCImI3hmMjUyO1wiLFwiaG91cmdsYXNzLTMgKGFsaWFzKVwiOlwiJiN4ZjI1MztcIixcImhvdXJnbGFzcy1lbmRcIjpcIiYjeGYyNTM7XCIsXCJob3VyZ2xhc3MtaGFsZlwiOlwiJiN4ZjI1MjtcIixcImhvdXJnbGFzcy1vXCI6XCImI3hmMjUwO1wiLFwiaG91cmdsYXNzLXN0YXJ0XCI6XCImI3hmMjUxO1wiLFwiaG91enpcIjpcIiYjeGYyN2M7XCIsXCJodG1sNVwiOlwiJiN4ZjEzYjtcIixcImktY3Vyc29yXCI6XCImI3hmMjQ2O1wiLFwiaWxzXCI6XCImI3hmMjBiO1wiLFwiaW1hZ2UgKGFsaWFzKVwiOlwiJiN4ZjAzZTtcIixcImluYm94XCI6XCImI3hmMDFjO1wiLFwiaW5kZW50XCI6XCImI3hmMDNjO1wiLFwiaW5kdXN0cnlcIjpcIiYjeGYyNzU7XCIsXCJpbmZvXCI6XCImI3hmMTI5O1wiLFwiaW5mby1jaXJjbGVcIjpcIiYjeGYwNWE7XCIsXCJpbnJcIjpcIiYjeGYxNTY7XCIsXCJpbnN0YWdyYW1cIjpcIiYjeGYxNmQ7XCIsXCJpbnN0aXR1dGlvbiAoYWxpYXMpXCI6XCImI3hmMTljO1wiLFwiaW50ZXJuZXQtZXhwbG9yZXJcIjpcIiYjeGYyNmI7XCIsXCJpbnRlcnNleCAoYWxpYXMpXCI6XCImI3hmMjI0O1wiLFwiaW94aG9zdFwiOlwiJiN4ZjIwODtcIixcIml0YWxpY1wiOlwiJiN4ZjAzMztcIixcImpvb21sYVwiOlwiJiN4ZjFhYTtcIixcImpweVwiOlwiJiN4ZjE1NztcIixcImpzZmlkZGxlXCI6XCImI3hmMWNjO1wiLFwia2V5XCI6XCImI3hmMDg0O1wiLFwia2V5Ym9hcmQtb1wiOlwiJiN4ZjExYztcIixcImtyd1wiOlwiJiN4ZjE1OTtcIixcImxhbmd1YWdlXCI6XCImI3hmMWFiO1wiLFwibGFwdG9wXCI6XCImI3hmMTA5O1wiLFwibGFzdGZtXCI6XCImI3hmMjAyO1wiLFwibGFzdGZtLXNxdWFyZVwiOlwiJiN4ZjIwMztcIixcImxlYWZcIjpcIiYjeGYwNmM7XCIsXCJsZWFucHViXCI6XCImI3hmMjEyO1wiLFwibGVnYWwgKGFsaWFzKVwiOlwiJiN4ZjBlMztcIixcImxlbW9uLW9cIjpcIiYjeGYwOTQ7XCIsXCJsZXZlbC1kb3duXCI6XCImI3hmMTQ5O1wiLFwibGV2ZWwtdXBcIjpcIiYjeGYxNDg7XCIsXCJsaWZlLWJvdXkgKGFsaWFzKVwiOlwiJiN4ZjFjZDtcIixcImxpZmUtYnVveSAoYWxpYXMpXCI6XCImI3hmMWNkO1wiLFwibGlmZS1yaW5nXCI6XCImI3hmMWNkO1wiLFwibGlmZS1zYXZlciAoYWxpYXMpXCI6XCImI3hmMWNkO1wiLFwibGlnaHRidWxiLW9cIjpcIiYjeGYwZWI7XCIsXCJsaW5lLWNoYXJ0XCI6XCImI3hmMjAxO1wiLFwibGlua1wiOlwiJiN4ZjBjMTtcIixcImxpbmtlZGluXCI6XCImI3hmMGUxO1wiLFwibGlua2VkaW4tc3F1YXJlXCI6XCImI3hmMDhjO1wiLFwibGludXhcIjpcIiYjeGYxN2M7XCIsXCJsaXN0XCI6XCImI3hmMDNhO1wiLFwibGlzdC1hbHRcIjpcIiYjeGYwMjI7XCIsXCJsaXN0LW9sXCI6XCImI3hmMGNiO1wiLFwibGlzdC11bFwiOlwiJiN4ZjBjYTtcIixcImxvY2F0aW9uLWFycm93XCI6XCImI3hmMTI0O1wiLFwibG9ja1wiOlwiJiN4ZjAyMztcIixcImxvbmctYXJyb3ctZG93blwiOlwiJiN4ZjE3NTtcIixcImxvbmctYXJyb3ctbGVmdFwiOlwiJiN4ZjE3NztcIixcImxvbmctYXJyb3ctcmlnaHRcIjpcIiYjeGYxNzg7XCIsXCJsb25nLWFycm93LXVwXCI6XCImI3hmMTc2O1wiLFwibWFnaWNcIjpcIiYjeGYwZDA7XCIsXCJtYWduZXRcIjpcIiYjeGYwNzY7XCIsXCJtYWlsLWZvcndhcmQgKGFsaWFzKVwiOlwiJiN4ZjA2NDtcIixcIm1haWwtcmVwbHkgKGFsaWFzKVwiOlwiJiN4ZjExMjtcIixcIm1haWwtcmVwbHktYWxsIChhbGlhcylcIjpcIiYjeGYxMjI7XCIsXCJtYWxlXCI6XCImI3hmMTgzO1wiLFwibWFwXCI6XCImI3hmMjc5O1wiLFwibWFwLW1hcmtlclwiOlwiJiN4ZjA0MTtcIixcIm1hcC1vXCI6XCImI3hmMjc4O1wiLFwibWFwLXBpblwiOlwiJiN4ZjI3NjtcIixcIm1hcC1zaWduc1wiOlwiJiN4ZjI3NztcIixcIm1hcnNcIjpcIiYjeGYyMjI7XCIsXCJtYXJzLWRvdWJsZVwiOlwiJiN4ZjIyNztcIixcIm1hcnMtc3Ryb2tlXCI6XCImI3hmMjI5O1wiLFwibWFycy1zdHJva2UtaFwiOlwiJiN4ZjIyYjtcIixcIm1hcnMtc3Ryb2tlLXZcIjpcIiYjeGYyMmE7XCIsXCJtYXhjZG5cIjpcIiYjeGYxMzY7XCIsXCJtZWFucGF0aFwiOlwiJiN4ZjIwYztcIixcIm1lZGl1bVwiOlwiJiN4ZjIzYTtcIixcIm1lZGtpdFwiOlwiJiN4ZmE7XCIsXCJtZWgtb1wiOlwiJiN4ZjExYTtcIixcIm1lcmN1cnlcIjpcIiYjeGYyMjM7XCIsXCJtaWNyb3Bob25lXCI6XCImI3hmMTMwO1wiLFwibWljcm9waG9uZS1zbGFzaFwiOlwiJiN4ZjEzMTtcIixcIm1pbnVzXCI6XCImI3hmMDY4O1wiLFwibWludXMtY2lyY2xlXCI6XCImI3hmMDU2O1wiLFwibWludXMtc3F1YXJlXCI6XCImI3hmMTQ2O1wiLFwibWludXMtc3F1YXJlLW9cIjpcIiYjeGYxNDc7XCIsXCJtb2JpbGVcIjpcIiYjeGYxMGI7XCIsXCJtb2JpbGUtcGhvbmUgKGFsaWFzKVwiOlwiJiN4ZjEwYjtcIixcIm1vbmV5XCI6XCImI3hmMGQ2O1wiLFwibW9vbi1vXCI6XCImI3hmMTg2O1wiLFwibW9ydGFyLWJvYXJkIChhbGlhcylcIjpcIiYjeGYxOWQ7XCIsXCJtb3RvcmN5Y2xlXCI6XCImI3hmMjFjO1wiLFwibW91c2UtcG9pbnRlclwiOlwiJiN4ZjI0NTtcIixcIm11c2ljXCI6XCImI3hmMDAxO1wiLFwibmF2aWNvbiAoYWxpYXMpXCI6XCImI3hmMGM5O1wiLFwibmV1dGVyXCI6XCImI3hmMjJjO1wiLFwibmV3c3BhcGVyLW9cIjpcIiYjeGYxZWE7XCIsXCJvYmplY3QtZ3JvdXBcIjpcIiYjeGYyNDc7XCIsXCJvYmplY3QtdW5ncm91cFwiOlwiJiN4ZjI0ODtcIixcIm9kbm9rbGFzc25pa2lcIjpcIiYjeGYyNjM7XCIsXCJvZG5va2xhc3NuaWtpLXNxdWFyZVwiOlwiJiN4ZjI2NDtcIixcIm9wZW5jYXJ0XCI6XCImI3hmMjNkO1wiLFwib3BlbmlkXCI6XCImI3hmMTliO1wiLFwib3BlcmFcIjpcIiYjeGYyNmE7XCIsXCJvcHRpbi1tb25zdGVyXCI6XCImI3hmMjNjO1wiLFwib3V0ZGVudFwiOlwiJiN4ZjAzYjtcIixcInBhZ2VsaW5lc1wiOlwiJiN4ZjE4YztcIixcInBhaW50LWJydXNoXCI6XCImI3hmMWZjO1wiLFwicGFwZXItcGxhbmVcIjpcIiYjeGYxZDg7XCIsXCJwYXBlci1wbGFuZS1vXCI6XCImI3hmMWQ5O1wiLFwicGFwZXJjbGlwXCI6XCImI3hmMGM2O1wiLFwicGFyYWdyYXBoXCI6XCImI3hmMWRkO1wiLFwicGFzdGUgKGFsaWFzKVwiOlwiJiN4ZjBlYTtcIixcInBhdXNlXCI6XCImI3hmMDRjO1wiLFwicGF3XCI6XCImI3hmMWIwO1wiLFwicGF5cGFsXCI6XCImI3hmMWVkO1wiLFwicGVuY2lsXCI6XCImI3hmMDQwO1wiLFwicGVuY2lsLXNxdWFyZVwiOlwiJiN4ZjE0YjtcIixcInBlbmNpbC1zcXVhcmUtb1wiOlwiJiN4ZjA0NDtcIixcInBob25lXCI6XCImI3hmMDk1O1wiLFwicGhvbmUtc3F1YXJlXCI6XCImI3hmMDk4O1wiLFwicGhvdG8gKGFsaWFzKVwiOlwiJiN4ZjAzZTtcIixcInBpY3R1cmUtb1wiOlwiJiN4ZjAzZTtcIixcInBpZS1jaGFydFwiOlwiJiN4ZjIwMDtcIixcInBpZWQtcGlwZXJcIjpcIiYjeGYxYTc7XCIsXCJwaWVkLXBpcGVyLWFsdFwiOlwiJiN4ZjFhODtcIixcInBpbnRlcmVzdFwiOlwiJiN4ZjBkMjtcIixcInBpbnRlcmVzdC1wXCI6XCImI3hmMjMxO1wiLFwicGludGVyZXN0LXNxdWFyZVwiOlwiJiN4ZjBkMztcIixcInBsYW5lXCI6XCImI3hmMDcyO1wiLFwicGxheVwiOlwiJiN4ZjA0YjtcIixcInBsYXktY2lyY2xlXCI6XCImI3hmMTQ0O1wiLFwicGxheS1jaXJjbGUtb1wiOlwiJiN4ZjAxZDtcIixcInBsdWdcIjpcIiYjeGYxZTY7XCIsXCJwbHVzXCI6XCImI3hmMDY3O1wiLFwicGx1cy1jaXJjbGVcIjpcIiYjeGYwNTU7XCIsXCJwbHVzLXNxdWFyZVwiOlwiJiN4ZjBmZTtcIixcInBsdXMtc3F1YXJlLW9cIjpcIiYjeGYxOTY7XCIsXCJwb3dlci1vZmZcIjpcIiYjeGYwMTE7XCIsXCJwcmludFwiOlwiJiN4ZjAyZjtcIixcInB1enpsZS1waWVjZVwiOlwiJiN4ZjEyZTtcIixcInFxXCI6XCImI3hmMWQ2O1wiLFwicXJjb2RlXCI6XCImI3hmMDI5O1wiLFwicXVlc3Rpb25cIjpcIiYjeGYxMjg7XCIsXCJxdWVzdGlvbi1jaXJjbGVcIjpcIiYjeGYwNTk7XCIsXCJxdW90ZS1sZWZ0XCI6XCImI3hmMTBkO1wiLFwicXVvdGUtcmlnaHRcIjpcIiYjeGYxMGU7XCIsXCJyYSAoYWxpYXMpXCI6XCImI3hmMWQwO1wiLFwicmFuZG9tXCI6XCImI3hmMDc0O1wiLFwicmViZWxcIjpcIiYjeGYxZDA7XCIsXCJyZWN5Y2xlXCI6XCImI3hmMWI4O1wiLFwicmVkZGl0XCI6XCImI3hmMWExO1wiLFwicmVkZGl0LXNxdWFyZVwiOlwiJiN4ZjFhMjtcIixcInJlZnJlc2hcIjpcIiYjeGYwMjE7XCIsXCJyZWdpc3RlcmVkXCI6XCImI3hmMjVkO1wiLFwicmVtb3ZlIChhbGlhcylcIjpcIiYjeGYwMGQ7XCIsXCJyZW5yZW5cIjpcIiYjeGYxOGI7XCIsXCJyZW9yZGVyIChhbGlhcylcIjpcIiYjeGYwYzk7XCIsXCJyZXBlYXRcIjpcIiYjeGYwMWU7XCIsXCJyZXBseVwiOlwiJiN4ZjExMjtcIixcInJlcGx5LWFsbFwiOlwiJiN4ZjEyMjtcIixcInJldHdlZXRcIjpcIiYjeGYwNzk7XCIsXCJybWIgKGFsaWFzKVwiOlwiJiN4ZjE1NztcIixcInJvYWRcIjpcIiYjeGYwMTg7XCIsXCJyb2NrZXRcIjpcIiYjeGYxMzU7XCIsXCJyb3RhdGUtbGVmdCAoYWxpYXMpXCI6XCImI3hmMGUyO1wiLFwicm90YXRlLXJpZ2h0IChhbGlhcylcIjpcIiYjeGYwMWU7XCIsXCJyb3VibGUgKGFsaWFzKVwiOlwiJiN4ZjE1ODtcIixcInJzc1wiOlwiJiN4ZjA5ZTtcIixcInJzcy1zcXVhcmVcIjpcIiYjeGYxNDM7XCIsXCJydWJcIjpcIiYjeGYxNTg7XCIsXCJydWJsZSAoYWxpYXMpXCI6XCImI3hmMTU4O1wiLFwicnVwZWUgKGFsaWFzKVwiOlwiJiN4ZjE1NjtcIixcImZhcmlcIjpcIiYjeGYyNjc7XCIsXCJzYXZlIChhbGlhcylcIjpcIiYjeGYwYzc7XCIsXCJzY2lzc29yc1wiOlwiJiN4ZjBjNDtcIixcInNlYXJjaFwiOlwiJiN4ZjAwMjtcIixcInNlYXJjaC1taW51c1wiOlwiJiN4ZjAxMDtcIixcInNlYXJjaC1wbHVzXCI6XCImI3hmMDBlO1wiLFwic2VsbHN5XCI6XCImI3hmMjEzO1wiLFwic2VuZCAoYWxpYXMpXCI6XCImI3hmMWQ4O1wiLFwic2VuZC1vIChhbGlhcylcIjpcIiYjeGYxZDk7XCIsXCJzZXJ2ZXJcIjpcIiYjeGYyMzM7XCIsXCJzaGFyZVwiOlwiJiN4ZjA2NDtcIixcInNoYXJlLWFsdFwiOlwiJiN4ZjFlMDtcIixcInNoYXJlLWFsdC1zcXVhcmVcIjpcIiYjeGYxZTE7XCIsXCJzaGFyZS1zcXVhcmVcIjpcIiYjeGYxNGQ7XCIsXCJzaGFyZS1zcXVhcmUtb1wiOlwiJiN4ZjA0NTtcIixcInNoZWtlbCAoYWxpYXMpXCI6XCImI3hmMjBiO1wiLFwic2hlcWVsIChhbGlhcylcIjpcIiYjeGYyMGI7XCIsXCJzaGllbGRcIjpcIiYjeGYxMzI7XCIsXCJzaGlwXCI6XCImI3hmMjFhO1wiLFwic2hpcnRzaW5idWxrXCI6XCImI3hmMjE0O1wiLFwic2hvcHBpbmctY2FydFwiOlwiJiN4ZjA3YTtcIixcInNpZ24taW5cIjpcIiYjeGYwOTA7XCIsXCJzaWduLW91dFwiOlwiJiN4ZjA4YjtcIixcInNpZ25hbFwiOlwiJiN4ZjAxMjtcIixcInNpbXBseWJ1aWx0XCI6XCImI3hmMjE1O1wiLFwic2l0ZW1hcFwiOlwiJiN4ZjBlODtcIixcInNreWF0bGFzXCI6XCImI3hmMjE2O1wiLFwic2t5cGVcIjpcIiYjeGYxN2U7XCIsXCJzbGFja1wiOlwiJiN4ZjE5ODtcIixcInNsaWRlcnNcIjpcIiYjeGYxZGU7XCIsXCJzbGlkZXNoYXJlXCI6XCImI3hmMWU3O1wiLFwic21pbGUtb1wiOlwiJiN4ZjExODtcIixcInNvY2Nlci1iYWxsLW8gKGFsaWFzKVwiOlwiJiN4ZjFlMztcIixcInNvcnRcIjpcIiYjeGYwZGM7XCIsXCJzb3J0LWFscGhhLWFzY1wiOlwiJiN4ZjE1ZDtcIixcInNvcnQtYWxwaGEtZGVzY1wiOlwiJiN4ZjE1ZTtcIixcInNvcnQtYW1vdW50LWFzY1wiOlwiJiN4ZjE2MDtcIixcInNvcnQtYW1vdW50LWRlc2NcIjpcIiYjeGYxNjE7XCIsXCJzb3J0LWFzY1wiOlwiJiN4ZjBkZTtcIixcInNvcnQtZGVzY1wiOlwiJiN4ZjBkZDtcIixcInNvcnQtZG93biAoYWxpYXMpXCI6XCImI3hmMGRkO1wiLFwic29ydC1udW1lcmljLWFzY1wiOlwiJiN4ZjE2MjtcIixcInNvcnQtbnVtZXJpYy1kZXNjXCI6XCImI3hmMTYzO1wiLFwic29ydC11cCAoYWxpYXMpXCI6XCImI3hmMGRlO1wiLFwic291bmRjbG91ZFwiOlwiJiN4ZjFiZTtcIixcInNwYWNlLXNodXR0bGVcIjpcIiYjeGYxOTc7XCIsXCJzcGlubmVyXCI6XCImI3hmMTEwO1wiLFwic3Bvb25cIjpcIiYjeGYxYjE7XCIsXCJzcG90aWZ5XCI6XCImI3hmMWJjO1wiLFwic3F1YXJlXCI6XCImI3hmMGM4O1wiLFwic3F1YXJlLW9cIjpcIiYjeGYwOTY7XCIsXCJzdGFjay1leGNoYW5nZVwiOlwiJiN4ZjE4ZDtcIixcInN0YWNrLW92ZXJmbG93XCI6XCImI3hmMTZjO1wiLFwic3RhclwiOlwiJiN4ZjAwNTtcIixcInN0YXItaGFsZlwiOlwiJiN4ZjA4OTtcIixcInN0YXItaGFsZi1lbXB0eSAoYWxpYXMpXCI6XCImI3hmMTIzO1wiLFwic3Rhci1oYWxmLWZ1bGwgKGFsaWFzKVwiOlwiJiN4ZjEyMztcIixcInN0YXItaGFsZi1vXCI6XCImI3hmMTIzO1wiLFwic3Rhci1vXCI6XCImI3hmMDA2O1wiLFwic3RlYW1cIjpcIiYjeGYxYjY7XCIsXCJzdGVhbS1zcXVhcmVcIjpcIiYjeGYxYjc7XCIsXCJzdGVwLWJhY2t3YXJkXCI6XCImI3hmMDQ4O1wiLFwic3RlcC1mb3J3YXJkXCI6XCImI3hmMDUxO1wiLFwic3RldGhvc2NvcGVcIjpcIiYjeGYwZjE7XCIsXCJzdGlja3ktbm90ZVwiOlwiJiN4ZjI0OTtcIixcInN0aWNreS1ub3RlLW9cIjpcIiYjeGYyNGE7XCIsXCJzdG9wXCI6XCImI3hmMDRkO1wiLFwic3RyZWV0LXZpZXdcIjpcIiYjeGYyMWQ7XCIsXCJzdHJpa2V0aHJvdWdoXCI6XCImI3hmMGNjO1wiLFwic3R1bWJsZXVwb25cIjpcIiYjeGYxYTQ7XCIsXCJzdHVtYmxldXBvbi1jaXJjbGVcIjpcIiYjeGYxYTM7XCIsXCJzdWJzY3JpcHRcIjpcIiYjeGYxMmM7XCIsXCJzdWJ3YXlcIjpcIiYjeGYyMzk7XCIsXCJzdWl0Y2FzZVwiOlwiJiN4ZjBmMjtcIixcInN1bi1vXCI6XCImI3hmMTg1O1wiLFwic3VwZXJzY3JpcHRcIjpcIiYjeGYxMmI7XCIsXCJzdXBwb3J0IChhbGlhcylcIjpcIiYjeGYxY2Q7XCIsXCJ0YWJsZVwiOlwiJiN4ZjBjZTtcIixcInRhYmxldFwiOlwiJiN4ZjEwYTtcIixcInRhY2hvbWV0ZXJcIjpcIiYjeGYwZTQ7XCIsXCJ0YWdcIjpcIiYjeGYwMmI7XCIsXCJ0YWdzXCI6XCImI3hmMDJjO1wiLFwidGFza3NcIjpcIiYjeGYwYWU7XCIsXCJ0YXhpXCI6XCImI3hmMWJhO1wiLFwidGVsZXZpc2lvblwiOlwiJiN4ZjI2YztcIixcInRlbmNlbnQtd2VpYm9cIjpcIiYjeGYxZDU7XCIsXCJ0ZXJtaW5hbFwiOlwiJiN4ZjEyMDtcIixcInRleHQtaGVpZ2h0XCI6XCImI3hmMDM0O1wiLFwidGV4dC13aWR0aFwiOlwiJiN4ZjAzNTtcIixcInRoXCI6XCImI3hmMDBhO1wiLFwidGgtbGFyZ2VcIjpcIiYjeGYwMDk7XCIsXCJ0aC1saXN0XCI6XCImI3hmMDBiO1wiLFwidGh1bWItdGFja1wiOlwiJiN4ZjA4ZDtcIixcInRodW1icy1kb3duXCI6XCImI3hmMTY1O1wiLFwidGh1bWJzLW8tZG93blwiOlwiJiN4ZjA4ODtcIixcInRodW1icy1vLXVwXCI6XCImI3hmMDg3O1wiLFwidGh1bWJzLXVwXCI6XCImI3hmMTY0O1wiLFwidGlja2V0XCI6XCImI3hmMTQ1O1wiLFwidGltZXNcIjpcIiYjeGYwMGQ7XCIsXCJ0aW1lcy1jaXJjbGVcIjpcIiYjeGYwNTc7XCIsXCJ0aW1lcy1jaXJjbGUtb1wiOlwiJiN4ZjA1YztcIixcInRpbnRcIjpcIiYjeGYwNDM7XCIsXCJ0b2dnbGUtZG93biAoYWxpYXMpXCI6XCImI3hmMTUwO1wiLFwidG9nZ2xlLWxlZnQgKGFsaWFzKVwiOlwiJiN4ZjE5MTtcIixcInRvZ2dsZS1vZmZcIjpcIiYjeGYyMDQ7XCIsXCJ0b2dnbGUtb25cIjpcIiYjeGYyMDU7XCIsXCJ0b2dnbGUtcmlnaHQgKGFsaWFzKVwiOlwiJiN4ZjE1MjtcIixcInRvZ2dsZS11cCAoYWxpYXMpXCI6XCImI3hmMTUxO1wiLFwidHJhZGVtYXJrXCI6XCImI3hmMjVjO1wiLFwidHJhaW5cIjpcIiYjeGYyMzg7XCIsXCJ0cmFuc2dlbmRlclwiOlwiJiN4ZjIyNDtcIixcInRyYW5zZ2VuZGVyLWFsdFwiOlwiJiN4ZjIyNTtcIixcInRyYXNoXCI6XCImI3hmMWY4O1wiLFwidHJhc2gtb1wiOlwiJiN4ZjAxNDtcIixcInRyZWVcIjpcIiYjeGYxYmI7XCIsXCJ0cmVsbG9cIjpcIiYjeGYxODE7XCIsXCJ0cmlwYWR2aXNvclwiOlwiJiN4ZjI2MjtcIixcInRyb3BoeVwiOlwiJiN4ZjA5MTtcIixcInRydWNrXCI6XCImI3hmMGQxO1wiLFwidHJ5XCI6XCImI3hmMTk1O1wiLFwidHR5XCI6XCImI3hmMWU0O1wiLFwidHVtYmxyXCI6XCImI3hmMTczO1wiLFwidHVtYmxyLXNxdWFyZVwiOlwiJiN4ZjE3NDtcIixcInR1cmtpc2gtbGlyYSAoYWxpYXMpXCI6XCImI3hmMTk1O1wiLFwidHYgKGFsaWFzKVwiOlwiJiN4ZjI2YztcIixcInR3aXRjaFwiOlwiJiN4ZjFlODtcIixcInR3aXR0ZXJcIjpcIiYjeGYwOTk7XCIsXCJ0d2l0dGVyLXNxdWFyZVwiOlwiJiN4ZjA4MTtcIixcInVtYnJlbGxhXCI6XCImI3hmMGU5O1wiLFwidW5kZXJsaW5lXCI6XCImI3hmMGNkO1wiLFwidW5kb1wiOlwiJiN4ZjBlMjtcIixcInVuaXZlcnNpdHlcIjpcIiYjeGYxOWM7XCIsXCJ1bmxpbmsgKGFsaWFzKVwiOlwiJiN4ZjEyNztcIixcInVubG9ja1wiOlwiJiN4ZjA5YztcIixcInVubG9jay1hbHRcIjpcIiYjeGYxM2U7XCIsXCJ1bnNvcnRlZCAoYWxpYXMpXCI6XCImI3hmMGRjO1wiLFwidXBsb2FkXCI6XCImI3hmMDkzO1wiLFwidXNkXCI6XCImI3hmMTU1O1wiLFwidXNlclwiOlwiJiN4ZjAwNztcIixcInVzZXItbWRcIjpcIiYjeGYwZjA7XCIsXCJ1c2VyLXBsdXNcIjpcIiYjeGYyMzQ7XCIsXCJ1c2VyLXNlY3JldFwiOlwiJiN4ZjIxYjtcIixcInVzZXItdGltZXNcIjpcIiYjeGYyMzU7XCIsXCJ1c2Vyc1wiOlwiJiN4ZjBjMDtcIixcInZlbnVzXCI6XCImI3hmMjIxO1wiLFwidmVudXMtZG91YmxlXCI6XCImI3hmMjI2O1wiLFwidmVudXMtbWFyc1wiOlwiJiN4ZjIyODtcIixcInZpYWNvaW5cIjpcIiYjeGYyMzc7XCIsXCJ2aWRlby1jYW1lcmFcIjpcIiYjeGYwM2Q7XCIsXCJ2aW1lb1wiOlwiJiN4ZjI3ZDtcIixcInZpbWVvLXNxdWFyZVwiOlwiJiN4ZjE5NDtcIixcInZpbmVcIjpcIiYjeGYxY2E7XCIsXCJ2a1wiOlwiJiN4ZjE4OTtcIixcInZvbHVtZS1kb3duXCI6XCImI3hmMDI3O1wiLFwidm9sdW1lLW9mZlwiOlwiJiN4ZjAyNjtcIixcInZvbHVtZS11cFwiOlwiJiN4ZjAyODtcIixcIndhcm5pbmcgKGFsaWFzKVwiOlwiJiN4ZjA3MTtcIixcIndlY2hhdCAoYWxpYXMpXCI6XCImI3hmMWQ3O1wiLFwid2VpYm9cIjpcIiYjeGYxOGE7XCIsXCJ3ZWl4aW5cIjpcIiYjeGYxZDc7XCIsXCJ3aGF0c2FwcFwiOlwiJiN4ZjIzMjtcIixcIndoZWVsY2hhaXJcIjpcIiYjeGYxOTM7XCIsXCJ3aWZpXCI6XCImI3hmMWViO1wiLFwid2lraXBlZGlhLXdcIjpcIiYjeGYyNjY7XCIsXCJ3aW5kb3dzXCI6XCImI3hmMTdhO1wiLFwid29uIChhbGlhcylcIjpcIiYjeGYxNTk7XCIsXCJ3b3JkcHJlc3NcIjpcIiYjeGYxOWE7XCIsXCJ3cmVuY2hcIjpcIiYjeGYwYWQ7XCIsXCJ4aW5nXCI6XCImI3hmMTY4O1wiLFwieGluZy1zcXVhcmVcIjpcIiYjeGYxNjk7XCIsXCJ5LWNvbWJpbmF0b3JcIjpcIiYjeGYyM2I7XCIsXCJ5LWNvbWJpbmF0b3Itc3F1YXJlIChhbGlhcylcIjpcIiYjeGYxZDQ7XCIsXCJ5YWhvb1wiOlwiJiN4ZjE5ZTtcIixcInljIChhbGlhcylcIjpcIiYjeGYyM2I7XCIsXCJ5Yy1zcXVhcmUgKGFsaWFzKVwiOlwiJiN4ZjFkNDtcIixcInllbHBcIjpcIiYjeGYxZTk7XCIsXCJ5ZW4gKGFsaWFzKVwiOlwiJiN4ZjE1NztcIixcInlvdXR1YmVcIjpcIiYjeGYxNjc7XCIsXCJ5b3V0dWJlLXBsYXlcIjpcIiYjeGYxNmE7XCIsXCJ5b3V0dWJlLXNxdWFyZVwiOlwiJiN4ZjE2NjtcIn07XG5mb250QXdlc29tZUNTUyA9IFxuXHRcIlwiXCJcblx0XHQvKiFcblx0ICogIEZvbnQgQXdlc29tZSA0LjQuMCBieSBAZGF2ZWdhbmR5IC0gaHR0cDovL2ZvbnRhd2Vzb21lLmlvIC0gQGZvbnRhd2Vzb21lXG5cdCAqICBMaWNlbnNlIC0gaHR0cDovL2ZvbnRhd2Vzb21lLmlvL2xpY2Vuc2UgKEZvbnQ6IFNJTCBPRkwgMS4xLCBDU1M6IE1JVCBMaWNlbnNlKVxuXHQgKi9cblx0LyogRk9OVCBQQVRIXG5cdCAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cdEBmb250LWZhY2Uge1xuXHQgIGZvbnQtZmFtaWx5OiAnRm9udEF3ZXNvbWUnO1xuXHQgIHNyYzogdXJsKCdtb2R1bGVzL2ZvbnRzL2ZvbnRhd2Vzb21lLXdlYmZvbnQuZW90P3Y9NC40LjAnKTtcblx0ICBzcmM6IHVybCgnbW9kdWxlcy9mb250cy9mb250YXdlc29tZS13ZWJmb250LmVvdD8jaWVmaXgmdj00LjQuMCcpIGZvcm1hdCgnZW1iZWRkZWQtb3BlbnR5cGUnKSwgdXJsKCdtb2R1bGVzL2ZvbnRzL2ZvbnRhd2Vzb21lLXdlYmZvbnQud29mZjI/dj00LjQuMCcpIGZvcm1hdCgnd29mZjInKSwgdXJsKCdtb2R1bGVzL2ZvbnRzL2ZvbnRhd2Vzb21lLXdlYmZvbnQud29mZj92PTQuNC4wJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnbW9kdWxlcy9mb250cy9mb250YXdlc29tZS13ZWJmb250LnR0Zj92PTQuNC4wJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJ21vZHVsZXMvZm9udHMvZm9udGF3ZXNvbWUtd2ViZm9udC5zdmc/dj00LjQuMCNmb250YXdlc29tZXJlZ3VsYXInKSBmb3JtYXQoJ3N2ZycpO1xuXHQgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG5cdCAgZm9udC1zdHlsZTogbm9ybWFsO1xuXHR9XG5cdC5mYXtkaXNwbGF5OmlubGluZS1ibG9jaztmb250Om5vcm1hbCBub3JtYWwgbm9ybWFsIDE0cHgvMSBGb250QXdlc29tZTtmb250LXNpemU6aW5oZXJpdDt0ZXh0LXJlbmRlcmluZzphdXRvOy13ZWJraXQtZm9udC1zbW9vdGhpbmc6YW50aWFsaWFzZWQ7LW1vei1vc3gtZm9udC1zbW9vdGhpbmc6Z3JheXNjYWxlfS5mYS1sZ3tmb250LXNpemU6MS4zMzMzMzMzM2VtO2xpbmUtaGVpZ2h0Oi43NWVtO3ZlcnRpY2FsLWFsaWduOi0xNSV9LmZhLTJ4e2ZvbnQtc2l6ZToyZW19LmZhLTN4e2ZvbnQtc2l6ZTozZW19LmZhLTR4e2ZvbnQtc2l6ZTo0ZW19LmZhLTV4e2ZvbnQtc2l6ZTo1ZW19LmZhLWZ3e3dpZHRoOjEuMjg1NzE0MjllbTt0ZXh0LWFsaWduOmNlbnRlcn0uZmEtdWx7cGFkZGluZy1sZWZ0OjA7bWFyZ2luLWxlZnQ6Mi4xNDI4NTcxNGVtO2xpc3Qtc3R5bGUtdHlwZTpub25lfS5mYS11bCA+IGxpe3Bvc2l0aW9uOnJlbGF0aXZlfS5mYS1saXtwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi0yLjE0Mjg1NzE0ZW07d2lkdGg6Mi4xNDI4NTcxNGVtO3RvcDouMTQyODU3MTRlbTt0ZXh0LWFsaWduOmNlbnRlcn0uZmEtbGkuZmEtbGd7bGVmdDotMS44NTcxNDI4NmVtfS5mYS1ib3JkZXJ7cGFkZGluZzouMmVtIC4yNWVtIC4xNWVtO2JvcmRlcjpzb2xpZCAuMDhlbSAjZWVlO2JvcmRlci1yYWRpdXM6LjFlbX0uZmEtcHVsbC1sZWZ0e2Zsb2F0OmxlZnR9LmZhLXB1bGwtcmlnaHR7ZmxvYXQ6cmlnaHR9LmZhLmZhLXB1bGwtbGVmdHttYXJnaW4tcmlnaHQ6LjNlbX0uZmEuZmEtcHVsbC1yaWdodHttYXJnaW4tbGVmdDouM2VtfS5wdWxsLXJpZ2h0e2Zsb2F0OnJpZ2h0fS5wdWxsLWxlZnR7ZmxvYXQ6bGVmdH0uZmEucHVsbC1sZWZ0e21hcmdpbi1yaWdodDouM2VtfS5mYS5wdWxsLXJpZ2h0e21hcmdpbi1sZWZ0Oi4zZW19LmZhLXNwaW57LXdlYmtpdC1hbmltYXRpb246ZmEtc3BpbiAycyBpbmZpbml0ZSBsaW5lYXI7YW5pbWF0aW9uOmZhLXNwaW4gMnMgaW5maW5pdGUgbGluZWFyfS5mYS1wdWxzZXstd2Via2l0LWFuaW1hdGlvbjpmYS1zcGluIDFzIGluZmluaXRlIHN0ZXBzKDgpO2FuaW1hdGlvbjpmYS1zcGluIDFzIGluZmluaXRlIHN0ZXBzKDgpfUAtd2Via2l0LWtleWZyYW1lcyBmYS1zcGluezAley13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgwZGVnKTt0cmFuc2Zvcm06cm90YXRlKDBkZWcpfTEwMCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM1OWRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgzNTlkZWcpfX1Aa2V5ZnJhbWVzIGZhLXNwaW57MCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMGRlZyl9MTAwJXstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMzU5ZGVnKTt0cmFuc2Zvcm06cm90YXRlKDM1OWRlZyl9fS5mYS1yb3RhdGUtOTB7ZmlsdGVyOnByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5CYXNpY0ltYWdlKHJvdGF0aW9uPTEpOy13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSg5MGRlZyk7LW1zLXRyYW5zZm9ybTpyb3RhdGUoOTBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoOTBkZWcpfS5mYS1yb3RhdGUtMTgwe2ZpbHRlcjpwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQmFzaWNJbWFnZShyb3RhdGlvbj0yKTstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMTgwZGVnKTstbXMtdHJhbnNmb3JtOnJvdGF0ZSgxODBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMTgwZGVnKX0uZmEtcm90YXRlLTI3MHtmaWx0ZXI6cHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkJhc2ljSW1hZ2Uocm90YXRpb249Myk7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDI3MGRlZyk7LW1zLXRyYW5zZm9ybTpyb3RhdGUoMjcwZGVnKTt0cmFuc2Zvcm06cm90YXRlKDI3MGRlZyl9LmZhLWZsaXAtaG9yaXpvbnRhbHtmaWx0ZXI6cHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkJhc2ljSW1hZ2Uocm90YXRpb249MCxtaXJyb3I9MSk7LXdlYmtpdC10cmFuc2Zvcm06c2NhbGUoLTEsMSk7LW1zLXRyYW5zZm9ybTpzY2FsZSgtMSwxKTt0cmFuc2Zvcm06c2NhbGUoLTEsMSl9LmZhLWZsaXAtdmVydGljYWx7ZmlsdGVyOnByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5CYXNpY0ltYWdlKHJvdGF0aW9uPTIsbWlycm9yPTEpOy13ZWJraXQtdHJhbnNmb3JtOnNjYWxlKDEsLTEpOy1tcy10cmFuc2Zvcm06c2NhbGUoMSwtMSk7dHJhbnNmb3JtOnNjYWxlKDEsLTEpfTpyb290IC5mYS1yb3RhdGUtOTAsOnJvb3QgLmZhLXJvdGF0ZS0xODAsOnJvb3QgLmZhLXJvdGF0ZS0yNzAsOnJvb3QgLmZhLWZsaXAtaG9yaXpvbnRhbCw6cm9vdCAuZmEtZmxpcC12ZXJ0aWNhbHtmaWx0ZXI6bm9uZX0uZmEtc3RhY2t7cG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTppbmxpbmUtYmxvY2s7d2lkdGg6MmVtO2hlaWdodDoyZW07bGluZS1oZWlnaHQ6MmVtO3ZlcnRpY2FsLWFsaWduOm1pZGRsZX0uZmEtc3RhY2stMXgsLmZhLXN0YWNrLTJ4e3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MDt3aWR0aDoxMDAlO3RleHQtYWxpZ246Y2VudGVyfS5mYS1zdGFjay0xeHtsaW5lLWhlaWdodDppbmhlcml0fS5mYS1zdGFjay0yeHtmb250LXNpemU6MmVtfS5mYS1pbnZlcnNle2NvbG9yOiNmZmZ9LmZhLWdsYXNzOmJlZm9yZXtjb250ZW50OlwiXFxmMDAwXCJ9LmZhLW11c2ljOmJlZm9yZXtjb250ZW50OlwiXFxmMDAxXCJ9LmZhLXNlYXJjaDpiZWZvcmV7Y29udGVudDpcIlxcZjAwMlwifS5mYS1lbnZlbG9wZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDAzXCJ9LmZhLWhlYXJ0OmJlZm9yZXtjb250ZW50OlwiXFxmMDA0XCJ9LmZhLXN0YXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMDVcIn0uZmEtc3Rhci1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDA2XCJ9LmZhLXVzZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMDdcIn0uZmEtZmlsbTpiZWZvcmV7Y29udGVudDpcIlxcZjAwOFwifS5mYS10aC1sYXJnZTpiZWZvcmV7Y29udGVudDpcIlxcZjAwOVwifS5mYS10aDpiZWZvcmV7Y29udGVudDpcIlxcZjAwYVwifS5mYS10aC1saXN0OmJlZm9yZXtjb250ZW50OlwiXFxmMDBiXCJ9LmZhLWNoZWNrOmJlZm9yZXtjb250ZW50OlwiXFxmMDBjXCJ9LmZhLXJlbW92ZTpiZWZvcmUsLmZhLWNsb3NlOmJlZm9yZSwuZmEtdGltZXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMGRcIn0uZmEtc2VhcmNoLXBsdXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMGVcIn0uZmEtc2VhcmNoLW1pbnVzOmJlZm9yZXtjb250ZW50OlwiXFxmMDEwXCJ9LmZhLXBvd2VyLW9mZjpiZWZvcmV7Y29udGVudDpcIlxcZjAxMVwifS5mYS1zaWduYWw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMTJcIn0uZmEtZ2VhcjpiZWZvcmUsLmZhLWNvZzpiZWZvcmV7Y29udGVudDpcIlxcZjAxM1wifS5mYS10cmFzaC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDE0XCJ9LmZhLWhvbWU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMTVcIn0uZmEtZmlsZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDE2XCJ9LmZhLWNsb2NrLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMTdcIn0uZmEtcm9hZDpiZWZvcmV7Y29udGVudDpcIlxcZjAxOFwifS5mYS1kb3dubG9hZDpiZWZvcmV7Y29udGVudDpcIlxcZjAxOVwifS5mYS1hcnJvdy1jaXJjbGUtby1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMDFhXCJ9LmZhLWFycm93LWNpcmNsZS1vLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMDFiXCJ9LmZhLWluYm94OmJlZm9yZXtjb250ZW50OlwiXFxmMDFjXCJ9LmZhLXBsYXktY2lyY2xlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMWRcIn0uZmEtcm90YXRlLXJpZ2h0OmJlZm9yZSwuZmEtcmVwZWF0OmJlZm9yZXtjb250ZW50OlwiXFxmMDFlXCJ9LmZhLXJlZnJlc2g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMjFcIn0uZmEtbGlzdC1hbHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMjJcIn0uZmEtbG9jazpiZWZvcmV7Y29udGVudDpcIlxcZjAyM1wifS5mYS1mbGFnOmJlZm9yZXtjb250ZW50OlwiXFxmMDI0XCJ9LmZhLWhlYWRwaG9uZXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMjVcIn0uZmEtdm9sdW1lLW9mZjpiZWZvcmV7Y29udGVudDpcIlxcZjAyNlwifS5mYS12b2x1bWUtZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjAyN1wifS5mYS12b2x1bWUtdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMjhcIn0uZmEtcXJjb2RlOmJlZm9yZXtjb250ZW50OlwiXFxmMDI5XCJ9LmZhLWJhcmNvZGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMmFcIn0uZmEtdGFnOmJlZm9yZXtjb250ZW50OlwiXFxmMDJiXCJ9LmZhLXRhZ3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMmNcIn0uZmEtYm9vazpiZWZvcmV7Y29udGVudDpcIlxcZjAyZFwifS5mYS1ib29rbWFyazpiZWZvcmV7Y29udGVudDpcIlxcZjAyZVwifS5mYS1wcmludDpiZWZvcmV7Y29udGVudDpcIlxcZjAyZlwifS5mYS1jYW1lcmE6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMzBcIn0uZmEtZm9udDpiZWZvcmV7Y29udGVudDpcIlxcZjAzMVwifS5mYS1ib2xkOmJlZm9yZXtjb250ZW50OlwiXFxmMDMyXCJ9LmZhLWl0YWxpYzpiZWZvcmV7Y29udGVudDpcIlxcZjAzM1wifS5mYS10ZXh0LWhlaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjAzNFwifS5mYS10ZXh0LXdpZHRoOmJlZm9yZXtjb250ZW50OlwiXFxmMDM1XCJ9LmZhLWFsaWduLWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMzZcIn0uZmEtYWxpZ24tY2VudGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMDM3XCJ9LmZhLWFsaWduLXJpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMDM4XCJ9LmZhLWFsaWduLWp1c3RpZnk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwMzlcIn0uZmEtbGlzdDpiZWZvcmV7Y29udGVudDpcIlxcZjAzYVwifS5mYS1kZWRlbnQ6YmVmb3JlLC5mYS1vdXRkZW50OmJlZm9yZXtjb250ZW50OlwiXFxmMDNiXCJ9LmZhLWluZGVudDpiZWZvcmV7Y29udGVudDpcIlxcZjAzY1wifS5mYS12aWRlby1jYW1lcmE6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwM2RcIn0uZmEtcGhvdG86YmVmb3JlLC5mYS1pbWFnZTpiZWZvcmUsLmZhLXBpY3R1cmUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjAzZVwifS5mYS1wZW5jaWw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNDBcIn0uZmEtbWFwLW1hcmtlcjpiZWZvcmV7Y29udGVudDpcIlxcZjA0MVwifS5mYS1hZGp1c3Q6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNDJcIn0uZmEtdGludDpiZWZvcmV7Y29udGVudDpcIlxcZjA0M1wifS5mYS1lZGl0OmJlZm9yZSwuZmEtcGVuY2lsLXNxdWFyZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDQ0XCJ9LmZhLXNoYXJlLXNxdWFyZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDQ1XCJ9LmZhLWNoZWNrLXNxdWFyZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMDQ2XCJ9LmZhLWFycm93czpiZWZvcmV7Y29udGVudDpcIlxcZjA0N1wifS5mYS1zdGVwLWJhY2t3YXJkOmJlZm9yZXtjb250ZW50OlwiXFxmMDQ4XCJ9LmZhLWZhc3QtYmFja3dhcmQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNDlcIn0uZmEtYmFja3dhcmQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNGFcIn0uZmEtcGxheTpiZWZvcmV7Y29udGVudDpcIlxcZjA0YlwifS5mYS1wYXVzZTpiZWZvcmV7Y29udGVudDpcIlxcZjA0Y1wifS5mYS1zdG9wOmJlZm9yZXtjb250ZW50OlwiXFxmMDRkXCJ9LmZhLWZvcndhcmQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNGVcIn0uZmEtZmFzdC1mb3J3YXJkOmJlZm9yZXtjb250ZW50OlwiXFxmMDUwXCJ9LmZhLXN0ZXAtZm9yd2FyZDpiZWZvcmV7Y29udGVudDpcIlxcZjA1MVwifS5mYS1lamVjdDpiZWZvcmV7Y29udGVudDpcIlxcZjA1MlwifS5mYS1jaGV2cm9uLWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNTNcIn0uZmEtY2hldnJvbi1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjA1NFwifS5mYS1wbHVzLWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjA1NVwifS5mYS1taW51cy1jaXJjbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNTZcIn0uZmEtdGltZXMtY2lyY2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMDU3XCJ9LmZhLWNoZWNrLWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjA1OFwifS5mYS1xdWVzdGlvbi1jaXJjbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNTlcIn0uZmEtaW5mby1jaXJjbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNWFcIn0uZmEtY3Jvc3NoYWlyczpiZWZvcmV7Y29udGVudDpcIlxcZjA1YlwifS5mYS10aW1lcy1jaXJjbGUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjA1Y1wifS5mYS1jaGVjay1jaXJjbGUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjA1ZFwifS5mYS1iYW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNWVcIn0uZmEtYXJyb3ctbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjA2MFwifS5mYS1hcnJvdy1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjA2MVwifS5mYS1hcnJvdy11cDpiZWZvcmV7Y29udGVudDpcIlxcZjA2MlwifS5mYS1hcnJvdy1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMDYzXCJ9LmZhLW1haWwtZm9yd2FyZDpiZWZvcmUsLmZhLXNoYXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMDY0XCJ9LmZhLWV4cGFuZDpiZWZvcmV7Y29udGVudDpcIlxcZjA2NVwifS5mYS1jb21wcmVzczpiZWZvcmV7Y29udGVudDpcIlxcZjA2NlwifS5mYS1wbHVzOmJlZm9yZXtjb250ZW50OlwiXFxmMDY3XCJ9LmZhLW1pbnVzOmJlZm9yZXtjb250ZW50OlwiXFxmMDY4XCJ9LmZhLWFzdGVyaXNrOmJlZm9yZXtjb250ZW50OlwiXFxmMDY5XCJ9LmZhLWV4Y2xhbWF0aW9uLWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjA2YVwifS5mYS1naWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMDZiXCJ9LmZhLWxlYWY6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNmNcIn0uZmEtZmlyZTpiZWZvcmV7Y29udGVudDpcIlxcZjA2ZFwifS5mYS1leWU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNmVcIn0uZmEtZXllLXNsYXNoOmJlZm9yZXtjb250ZW50OlwiXFxmMDcwXCJ9LmZhLXdhcm5pbmc6YmVmb3JlLC5mYS1leGNsYW1hdGlvbi10cmlhbmdsZTpiZWZvcmV7Y29udGVudDpcIlxcZjA3MVwifS5mYS1wbGFuZTpiZWZvcmV7Y29udGVudDpcIlxcZjA3MlwifS5mYS1jYWxlbmRhcjpiZWZvcmV7Y29udGVudDpcIlxcZjA3M1wifS5mYS1yYW5kb206YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNzRcIn0uZmEtY29tbWVudDpiZWZvcmV7Y29udGVudDpcIlxcZjA3NVwifS5mYS1tYWduZXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNzZcIn0uZmEtY2hldnJvbi11cDpiZWZvcmV7Y29udGVudDpcIlxcZjA3N1wifS5mYS1jaGV2cm9uLWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYwNzhcIn0uZmEtcmV0d2VldDpiZWZvcmV7Y29udGVudDpcIlxcZjA3OVwifS5mYS1zaG9wcGluZy1jYXJ0OmJlZm9yZXtjb250ZW50OlwiXFxmMDdhXCJ9LmZhLWZvbGRlcjpiZWZvcmV7Y29udGVudDpcIlxcZjA3YlwifS5mYS1mb2xkZXItb3BlbjpiZWZvcmV7Y29udGVudDpcIlxcZjA3Y1wifS5mYS1hcnJvd3MtdjpiZWZvcmV7Y29udGVudDpcIlxcZjA3ZFwifS5mYS1hcnJvd3MtaDpiZWZvcmV7Y29udGVudDpcIlxcZjA3ZVwifS5mYS1iYXItY2hhcnQtbzpiZWZvcmUsLmZhLWJhci1jaGFydDpiZWZvcmV7Y29udGVudDpcIlxcZjA4MFwifS5mYS10d2l0dGVyLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjA4MVwifS5mYS1mYWNlYm9vay1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwODJcIn0uZmEtY2FtZXJhLXJldHJvOmJlZm9yZXtjb250ZW50OlwiXFxmMDgzXCJ9LmZhLWtleTpiZWZvcmV7Y29udGVudDpcIlxcZjA4NFwifS5mYS1nZWFyczpiZWZvcmUsLmZhLWNvZ3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwODVcIn0uZmEtY29tbWVudHM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwODZcIn0uZmEtdGh1bWJzLW8tdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwODdcIn0uZmEtdGh1bWJzLW8tZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjA4OFwifS5mYS1zdGFyLWhhbGY6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwODlcIn0uZmEtaGVhcnQtbzpiZWZvcmV7Y29udGVudDpcIlxcZjA4YVwifS5mYS1zaWduLW91dDpiZWZvcmV7Y29udGVudDpcIlxcZjA4YlwifS5mYS1saW5rZWRpbi1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOGNcIn0uZmEtdGh1bWItdGFjazpiZWZvcmV7Y29udGVudDpcIlxcZjA4ZFwifS5mYS1leHRlcm5hbC1saW5rOmJlZm9yZXtjb250ZW50OlwiXFxmMDhlXCJ9LmZhLXNpZ24taW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOTBcIn0uZmEtdHJvcGh5OmJlZm9yZXtjb250ZW50OlwiXFxmMDkxXCJ9LmZhLWdpdGh1Yi1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOTJcIn0uZmEtdXBsb2FkOmJlZm9yZXtjb250ZW50OlwiXFxmMDkzXCJ9LmZhLWxlbW9uLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOTRcIn0uZmEtcGhvbmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOTVcIn0uZmEtc3F1YXJlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOTZcIn0uZmEtYm9va21hcmstbzpiZWZvcmV7Y29udGVudDpcIlxcZjA5N1wifS5mYS1waG9uZS1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOThcIn0uZmEtdHdpdHRlcjpiZWZvcmV7Y29udGVudDpcIlxcZjA5OVwifS5mYS1mYWNlYm9vay1mOmJlZm9yZSwuZmEtZmFjZWJvb2s6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwOWFcIn0uZmEtZ2l0aHViOmJlZm9yZXtjb250ZW50OlwiXFxmMDliXCJ9LmZhLXVubG9jazpiZWZvcmV7Y29udGVudDpcIlxcZjA5Y1wifS5mYS1jcmVkaXQtY2FyZDpiZWZvcmV7Y29udGVudDpcIlxcZjA5ZFwifS5mYS1mZWVkOmJlZm9yZSwuZmEtcnNzOmJlZm9yZXtjb250ZW50OlwiXFxmMDllXCJ9LmZhLWhkZC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMGEwXCJ9LmZhLWJ1bGxob3JuOmJlZm9yZXtjb250ZW50OlwiXFxmMGExXCJ9LmZhLWJlbGw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZjNcIn0uZmEtY2VydGlmaWNhdGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYTNcIn0uZmEtaGFuZC1vLXJpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMGE0XCJ9LmZhLWhhbmQtby1sZWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMGE1XCJ9LmZhLWhhbmQtby11cDpiZWZvcmV7Y29udGVudDpcIlxcZjBhNlwifS5mYS1oYW5kLW8tZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjBhN1wifS5mYS1hcnJvdy1jaXJjbGUtbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjBhOFwifS5mYS1hcnJvdy1jaXJjbGUtcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYTlcIn0uZmEtYXJyb3ctY2lyY2xlLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMGFhXCJ9LmZhLWFycm93LWNpcmNsZS1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMGFiXCJ9LmZhLWdsb2JlOmJlZm9yZXtjb250ZW50OlwiXFxmMGFjXCJ9LmZhLXdyZW5jaDpiZWZvcmV7Y29udGVudDpcIlxcZjBhZFwifS5mYS10YXNrczpiZWZvcmV7Y29udGVudDpcIlxcZjBhZVwifS5mYS1maWx0ZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYjBcIn0uZmEtYnJpZWZjYXNlOmJlZm9yZXtjb250ZW50OlwiXFxmMGIxXCJ9LmZhLWFycm93cy1hbHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYjJcIn0uZmEtZ3JvdXA6YmVmb3JlLC5mYS11c2VyczpiZWZvcmV7Y29udGVudDpcIlxcZjBjMFwifS5mYS1jaGFpbjpiZWZvcmUsLmZhLWxpbms6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYzFcIn0uZmEtY2xvdWQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYzJcIn0uZmEtZmxhc2s6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYzNcIn0uZmEtY3V0OmJlZm9yZSwuZmEtc2Npc3NvcnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYzRcIn0uZmEtY29weTpiZWZvcmUsLmZhLWZpbGVzLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYzVcIn0uZmEtcGFwZXJjbGlwOmJlZm9yZXtjb250ZW50OlwiXFxmMGM2XCJ9LmZhLXNhdmU6YmVmb3JlLC5mYS1mbG9wcHktbzpiZWZvcmV7Y29udGVudDpcIlxcZjBjN1wifS5mYS1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYzhcIn0uZmEtbmF2aWNvbjpiZWZvcmUsLmZhLXJlb3JkZXI6YmVmb3JlLC5mYS1iYXJzOmJlZm9yZXtjb250ZW50OlwiXFxmMGM5XCJ9LmZhLWxpc3QtdWw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwY2FcIn0uZmEtbGlzdC1vbDpiZWZvcmV7Y29udGVudDpcIlxcZjBjYlwifS5mYS1zdHJpa2V0aHJvdWdoOmJlZm9yZXtjb250ZW50OlwiXFxmMGNjXCJ9LmZhLXVuZGVybGluZTpiZWZvcmV7Y29udGVudDpcIlxcZjBjZFwifS5mYS10YWJsZTpiZWZvcmV7Y29udGVudDpcIlxcZjBjZVwifS5mYS1tYWdpYzpiZWZvcmV7Y29udGVudDpcIlxcZjBkMFwifS5mYS10cnVjazpiZWZvcmV7Y29udGVudDpcIlxcZjBkMVwifS5mYS1waW50ZXJlc3Q6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZDJcIn0uZmEtcGludGVyZXN0LXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjBkM1wifS5mYS1nb29nbGUtcGx1cy1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZDRcIn0uZmEtZ29vZ2xlLXBsdXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZDVcIn0uZmEtbW9uZXk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZDZcIn0uZmEtY2FyZXQtZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjBkN1wifS5mYS1jYXJldC11cDpiZWZvcmV7Y29udGVudDpcIlxcZjBkOFwifS5mYS1jYXJldC1sZWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMGQ5XCJ9LmZhLWNhcmV0LXJpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMGRhXCJ9LmZhLWNvbHVtbnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZGJcIn0uZmEtdW5zb3J0ZWQ6YmVmb3JlLC5mYS1zb3J0OmJlZm9yZXtjb250ZW50OlwiXFxmMGRjXCJ9LmZhLXNvcnQtZG93bjpiZWZvcmUsLmZhLXNvcnQtZGVzYzpiZWZvcmV7Y29udGVudDpcIlxcZjBkZFwifS5mYS1zb3J0LXVwOmJlZm9yZSwuZmEtc29ydC1hc2M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZGVcIn0uZmEtZW52ZWxvcGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZTBcIn0uZmEtbGlua2VkaW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZTFcIn0uZmEtcm90YXRlLWxlZnQ6YmVmb3JlLC5mYS11bmRvOmJlZm9yZXtjb250ZW50OlwiXFxmMGUyXCJ9LmZhLWxlZ2FsOmJlZm9yZSwuZmEtZ2F2ZWw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZTNcIn0uZmEtZGFzaGJvYXJkOmJlZm9yZSwuZmEtdGFjaG9tZXRlcjpiZWZvcmV7Y29udGVudDpcIlxcZjBlNFwifS5mYS1jb21tZW50LW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZTVcIn0uZmEtY29tbWVudHMtbzpiZWZvcmV7Y29udGVudDpcIlxcZjBlNlwifS5mYS1mbGFzaDpiZWZvcmUsLmZhLWJvbHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZTdcIn0uZmEtc2l0ZW1hcDpiZWZvcmV7Y29udGVudDpcIlxcZjBlOFwifS5mYS11bWJyZWxsYTpiZWZvcmV7Y29udGVudDpcIlxcZjBlOVwifS5mYS1wYXN0ZTpiZWZvcmUsLmZhLWNsaXBib2FyZDpiZWZvcmV7Y29udGVudDpcIlxcZjBlYVwifS5mYS1saWdodGJ1bGItbzpiZWZvcmV7Y29udGVudDpcIlxcZjBlYlwifS5mYS1leGNoYW5nZTpiZWZvcmV7Y29udGVudDpcIlxcZjBlY1wifS5mYS1jbG91ZC1kb3dubG9hZDpiZWZvcmV7Y29udGVudDpcIlxcZjBlZFwifS5mYS1jbG91ZC11cGxvYWQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZWVcIn0uZmEtdXNlci1tZDpiZWZvcmV7Y29udGVudDpcIlxcZjBmMFwifS5mYS1zdGV0aG9zY29wZTpiZWZvcmV7Y29udGVudDpcIlxcZjBmMVwifS5mYS1zdWl0Y2FzZTpiZWZvcmV7Y29udGVudDpcIlxcZjBmMlwifS5mYS1iZWxsLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwYTJcIn0uZmEtY29mZmVlOmJlZm9yZXtjb250ZW50OlwiXFxmMGY0XCJ9LmZhLWN1dGxlcnk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZjVcIn0uZmEtZmlsZS10ZXh0LW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZjZcIn0uZmEtYnVpbGRpbmctbzpiZWZvcmV7Y29udGVudDpcIlxcZjBmN1wifS5mYS1ob3NwaXRhbC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMGY4XCJ9LmZhLWFtYnVsYW5jZTpiZWZvcmV7Y29udGVudDpcIlxcZjBmOVwifS5mYS1tZWRraXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZmFcIn0uZmEtZmlnaHRlci1qZXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYwZmJcIn0uZmEtYmVlcjpiZWZvcmV7Y29udGVudDpcIlxcZjBmY1wifS5mYS1oLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjBmZFwifS5mYS1wbHVzLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjBmZVwifS5mYS1hbmdsZS1kb3VibGUtbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjEwMFwifS5mYS1hbmdsZS1kb3VibGUtcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMDFcIn0uZmEtYW5nbGUtZG91YmxlLXVwOmJlZm9yZXtjb250ZW50OlwiXFxmMTAyXCJ9LmZhLWFuZ2xlLWRvdWJsZS1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMTAzXCJ9LmZhLWFuZ2xlLWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMDRcIn0uZmEtYW5nbGUtcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMDVcIn0uZmEtYW5nbGUtdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMDZcIn0uZmEtYW5nbGUtZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjEwN1wifS5mYS1kZXNrdG9wOmJlZm9yZXtjb250ZW50OlwiXFxmMTA4XCJ9LmZhLWxhcHRvcDpiZWZvcmV7Y29udGVudDpcIlxcZjEwOVwifS5mYS10YWJsZXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMGFcIn0uZmEtbW9iaWxlLXBob25lOmJlZm9yZSwuZmEtbW9iaWxlOmJlZm9yZXtjb250ZW50OlwiXFxmMTBiXCJ9LmZhLWNpcmNsZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTBjXCJ9LmZhLXF1b3RlLWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMGRcIn0uZmEtcXVvdGUtcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMGVcIn0uZmEtc3Bpbm5lcjpiZWZvcmV7Y29udGVudDpcIlxcZjExMFwifS5mYS1jaXJjbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMTFcIn0uZmEtbWFpbC1yZXBseTpiZWZvcmUsLmZhLXJlcGx5OmJlZm9yZXtjb250ZW50OlwiXFxmMTEyXCJ9LmZhLWdpdGh1Yi1hbHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMTNcIn0uZmEtZm9sZGVyLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMTRcIn0uZmEtZm9sZGVyLW9wZW4tbzpiZWZvcmV7Y29udGVudDpcIlxcZjExNVwifS5mYS1zbWlsZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTE4XCJ9LmZhLWZyb3duLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMTlcIn0uZmEtbWVoLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMWFcIn0uZmEtZ2FtZXBhZDpiZWZvcmV7Y29udGVudDpcIlxcZjExYlwifS5mYS1rZXlib2FyZC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTFjXCJ9LmZhLWZsYWctbzpiZWZvcmV7Y29udGVudDpcIlxcZjExZFwifS5mYS1mbGFnLWNoZWNrZXJlZDpiZWZvcmV7Y29udGVudDpcIlxcZjExZVwifS5mYS10ZXJtaW5hbDpiZWZvcmV7Y29udGVudDpcIlxcZjEyMFwifS5mYS1jb2RlOmJlZm9yZXtjb250ZW50OlwiXFxmMTIxXCJ9LmZhLW1haWwtcmVwbHktYWxsOmJlZm9yZSwuZmEtcmVwbHktYWxsOmJlZm9yZXtjb250ZW50OlwiXFxmMTIyXCJ9LmZhLXN0YXItaGFsZi1lbXB0eTpiZWZvcmUsLmZhLXN0YXItaGFsZi1mdWxsOmJlZm9yZSwuZmEtc3Rhci1oYWxmLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMjNcIn0uZmEtbG9jYXRpb24tYXJyb3c6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMjRcIn0uZmEtY3JvcDpiZWZvcmV7Y29udGVudDpcIlxcZjEyNVwifS5mYS1jb2RlLWZvcms6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMjZcIn0uZmEtdW5saW5rOmJlZm9yZSwuZmEtY2hhaW4tYnJva2VuOmJlZm9yZXtjb250ZW50OlwiXFxmMTI3XCJ9LmZhLXF1ZXN0aW9uOmJlZm9yZXtjb250ZW50OlwiXFxmMTI4XCJ9LmZhLWluZm86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMjlcIn0uZmEtZXhjbGFtYXRpb246YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMmFcIn0uZmEtc3VwZXJzY3JpcHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMmJcIn0uZmEtc3Vic2NyaXB0OmJlZm9yZXtjb250ZW50OlwiXFxmMTJjXCJ9LmZhLWVyYXNlcjpiZWZvcmV7Y29udGVudDpcIlxcZjEyZFwifS5mYS1wdXp6bGUtcGllY2U6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMmVcIn0uZmEtbWljcm9waG9uZTpiZWZvcmV7Y29udGVudDpcIlxcZjEzMFwifS5mYS1taWNyb3Bob25lLXNsYXNoOmJlZm9yZXtjb250ZW50OlwiXFxmMTMxXCJ9LmZhLXNoaWVsZDpiZWZvcmV7Y29udGVudDpcIlxcZjEzMlwifS5mYS1jYWxlbmRhci1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTMzXCJ9LmZhLWZpcmUtZXh0aW5ndWlzaGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMTM0XCJ9LmZhLXJvY2tldDpiZWZvcmV7Y29udGVudDpcIlxcZjEzNVwifS5mYS1tYXhjZG46YmVmb3Jle2NvbnRlbnQ6XCJcXGYxMzZcIn0uZmEtY2hldnJvbi1jaXJjbGUtbGVmdDpiZWZvcmV7Y29udGVudDpcIlxcZjEzN1wifS5mYS1jaGV2cm9uLWNpcmNsZS1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjEzOFwifS5mYS1jaGV2cm9uLWNpcmNsZS11cDpiZWZvcmV7Y29udGVudDpcIlxcZjEzOVwifS5mYS1jaGV2cm9uLWNpcmNsZS1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMTNhXCJ9LmZhLWh0bWw1OmJlZm9yZXtjb250ZW50OlwiXFxmMTNiXCJ9LmZhLWNzczM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxM2NcIn0uZmEtYW5jaG9yOmJlZm9yZXtjb250ZW50OlwiXFxmMTNkXCJ9LmZhLXVubG9jay1hbHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxM2VcIn0uZmEtYnVsbHNleWU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNDBcIn0uZmEtZWxsaXBzaXMtaDpiZWZvcmV7Y29udGVudDpcIlxcZjE0MVwifS5mYS1lbGxpcHNpcy12OmJlZm9yZXtjb250ZW50OlwiXFxmMTQyXCJ9LmZhLXJzcy1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNDNcIn0uZmEtcGxheS1jaXJjbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNDRcIn0uZmEtdGlja2V0OmJlZm9yZXtjb250ZW50OlwiXFxmMTQ1XCJ9LmZhLW1pbnVzLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE0NlwifS5mYS1taW51cy1zcXVhcmUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjE0N1wifS5mYS1sZXZlbC11cDpiZWZvcmV7Y29udGVudDpcIlxcZjE0OFwifS5mYS1sZXZlbC1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMTQ5XCJ9LmZhLWNoZWNrLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE0YVwifS5mYS1wZW5jaWwtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTRiXCJ9LmZhLWV4dGVybmFsLWxpbmstc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTRjXCJ9LmZhLXNoYXJlLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE0ZFwifS5mYS1jb21wYXNzOmJlZm9yZXtjb250ZW50OlwiXFxmMTRlXCJ9LmZhLXRvZ2dsZS1kb3duOmJlZm9yZSwuZmEtY2FyZXQtc3F1YXJlLW8tZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjE1MFwifS5mYS10b2dnbGUtdXA6YmVmb3JlLC5mYS1jYXJldC1zcXVhcmUtby11cDpiZWZvcmV7Y29udGVudDpcIlxcZjE1MVwifS5mYS10b2dnbGUtcmlnaHQ6YmVmb3JlLC5mYS1jYXJldC1zcXVhcmUtby1yaWdodDpiZWZvcmV7Y29udGVudDpcIlxcZjE1MlwifS5mYS1ldXJvOmJlZm9yZSwuZmEtZXVyOmJlZm9yZXtjb250ZW50OlwiXFxmMTUzXCJ9LmZhLWdicDpiZWZvcmV7Y29udGVudDpcIlxcZjE1NFwifS5mYS1kb2xsYXI6YmVmb3JlLC5mYS11c2Q6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNTVcIn0uZmEtcnVwZWU6YmVmb3JlLC5mYS1pbnI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNTZcIn0uZmEtY255OmJlZm9yZSwuZmEtcm1iOmJlZm9yZSwuZmEteWVuOmJlZm9yZSwuZmEtanB5OmJlZm9yZXtjb250ZW50OlwiXFxmMTU3XCJ9LmZhLXJ1YmxlOmJlZm9yZSwuZmEtcm91YmxlOmJlZm9yZSwuZmEtcnViOmJlZm9yZXtjb250ZW50OlwiXFxmMTU4XCJ9LmZhLXdvbjpiZWZvcmUsLmZhLWtydzpiZWZvcmV7Y29udGVudDpcIlxcZjE1OVwifS5mYS1iaXRjb2luOmJlZm9yZSwuZmEtYnRjOmJlZm9yZXtjb250ZW50OlwiXFxmMTVhXCJ9LmZhLWZpbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNWJcIn0uZmEtZmlsZS10ZXh0OmJlZm9yZXtjb250ZW50OlwiXFxmMTVjXCJ9LmZhLXNvcnQtYWxwaGEtYXNjOmJlZm9yZXtjb250ZW50OlwiXFxmMTVkXCJ9LmZhLXNvcnQtYWxwaGEtZGVzYzpiZWZvcmV7Y29udGVudDpcIlxcZjE1ZVwifS5mYS1zb3J0LWFtb3VudC1hc2M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNjBcIn0uZmEtc29ydC1hbW91bnQtZGVzYzpiZWZvcmV7Y29udGVudDpcIlxcZjE2MVwifS5mYS1zb3J0LW51bWVyaWMtYXNjOmJlZm9yZXtjb250ZW50OlwiXFxmMTYyXCJ9LmZhLXNvcnQtbnVtZXJpYy1kZXNjOmJlZm9yZXtjb250ZW50OlwiXFxmMTYzXCJ9LmZhLXRodW1icy11cDpiZWZvcmV7Y29udGVudDpcIlxcZjE2NFwifS5mYS10aHVtYnMtZG93bjpiZWZvcmV7Y29udGVudDpcIlxcZjE2NVwifS5mYS15b3V0dWJlLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE2NlwifS5mYS15b3V0dWJlOmJlZm9yZXtjb250ZW50OlwiXFxmMTY3XCJ9LmZhLXhpbmc6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNjhcIn0uZmEteGluZy1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNjlcIn0uZmEteW91dHViZS1wbGF5OmJlZm9yZXtjb250ZW50OlwiXFxmMTZhXCJ9LmZhLWRyb3Bib3g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNmJcIn0uZmEtc3RhY2stb3ZlcmZsb3c6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNmNcIn0uZmEtaW5zdGFncmFtOmJlZm9yZXtjb250ZW50OlwiXFxmMTZkXCJ9LmZhLWZsaWNrcjpiZWZvcmV7Y29udGVudDpcIlxcZjE2ZVwifS5mYS1hZG46YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzBcIn0uZmEtYml0YnVja2V0OmJlZm9yZXtjb250ZW50OlwiXFxmMTcxXCJ9LmZhLWJpdGJ1Y2tldC1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzJcIn0uZmEtdHVtYmxyOmJlZm9yZXtjb250ZW50OlwiXFxmMTczXCJ9LmZhLXR1bWJsci1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzRcIn0uZmEtbG9uZy1hcnJvdy1kb3duOmJlZm9yZXtjb250ZW50OlwiXFxmMTc1XCJ9LmZhLWxvbmctYXJyb3ctdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzZcIn0uZmEtbG9uZy1hcnJvdy1sZWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMTc3XCJ9LmZhLWxvbmctYXJyb3ctcmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzhcIn0uZmEtYXBwbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxNzlcIn0uZmEtd2luZG93czpiZWZvcmV7Y29udGVudDpcIlxcZjE3YVwifS5mYS1hbmRyb2lkOmJlZm9yZXtjb250ZW50OlwiXFxmMTdiXCJ9LmZhLWxpbnV4OmJlZm9yZXtjb250ZW50OlwiXFxmMTdjXCJ9LmZhLWRyaWJiYmxlOmJlZm9yZXtjb250ZW50OlwiXFxmMTdkXCJ9LmZhLXNreXBlOmJlZm9yZXtjb250ZW50OlwiXFxmMTdlXCJ9LmZhLWZvdXJzcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxODBcIn0uZmEtdHJlbGxvOmJlZm9yZXtjb250ZW50OlwiXFxmMTgxXCJ9LmZhLWZlbWFsZTpiZWZvcmV7Y29udGVudDpcIlxcZjE4MlwifS5mYS1tYWxlOmJlZm9yZXtjb250ZW50OlwiXFxmMTgzXCJ9LmZhLWdpdHRpcDpiZWZvcmUsLmZhLWdyYXRpcGF5OmJlZm9yZXtjb250ZW50OlwiXFxmMTg0XCJ9LmZhLXN1bi1vOmJlZm9yZXtjb250ZW50OlwiXFxmMTg1XCJ9LmZhLW1vb24tbzpiZWZvcmV7Y29udGVudDpcIlxcZjE4NlwifS5mYS1hcmNoaXZlOmJlZm9yZXtjb250ZW50OlwiXFxmMTg3XCJ9LmZhLWJ1ZzpiZWZvcmV7Y29udGVudDpcIlxcZjE4OFwifS5mYS12azpiZWZvcmV7Y29udGVudDpcIlxcZjE4OVwifS5mYS13ZWlibzpiZWZvcmV7Y29udGVudDpcIlxcZjE4YVwifS5mYS1yZW5yZW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOGJcIn0uZmEtcGFnZWxpbmVzOmJlZm9yZXtjb250ZW50OlwiXFxmMThjXCJ9LmZhLXN0YWNrLWV4Y2hhbmdlOmJlZm9yZXtjb250ZW50OlwiXFxmMThkXCJ9LmZhLWFycm93LWNpcmNsZS1vLXJpZ2h0OmJlZm9yZXtjb250ZW50OlwiXFxmMThlXCJ9LmZhLWFycm93LWNpcmNsZS1vLWxlZnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOTBcIn0uZmEtdG9nZ2xlLWxlZnQ6YmVmb3JlLC5mYS1jYXJldC1zcXVhcmUtby1sZWZ0OmJlZm9yZXtjb250ZW50OlwiXFxmMTkxXCJ9LmZhLWRvdC1jaXJjbGUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjE5MlwifS5mYS13aGVlbGNoYWlyOmJlZm9yZXtjb250ZW50OlwiXFxmMTkzXCJ9LmZhLXZpbWVvLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE5NFwifS5mYS10dXJraXNoLWxpcmE6YmVmb3JlLC5mYS10cnk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOTVcIn0uZmEtcGx1cy1zcXVhcmUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjE5NlwifS5mYS1zcGFjZS1zaHV0dGxlOmJlZm9yZXtjb250ZW50OlwiXFxmMTk3XCJ9LmZhLXNsYWNrOmJlZm9yZXtjb250ZW50OlwiXFxmMTk4XCJ9LmZhLWVudmVsb3BlLXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjE5OVwifS5mYS13b3JkcHJlc3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOWFcIn0uZmEtb3BlbmlkOmJlZm9yZXtjb250ZW50OlwiXFxmMTliXCJ9LmZhLWluc3RpdHV0aW9uOmJlZm9yZSwuZmEtYmFuazpiZWZvcmUsLmZhLXVuaXZlcnNpdHk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOWNcIn0uZmEtbW9ydGFyLWJvYXJkOmJlZm9yZSwuZmEtZ3JhZHVhdGlvbi1jYXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOWRcIn0uZmEteWFob286YmVmb3Jle2NvbnRlbnQ6XCJcXGYxOWVcIn0uZmEtZ29vZ2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMWEwXCJ9LmZhLXJlZGRpdDpiZWZvcmV7Y29udGVudDpcIlxcZjFhMVwifS5mYS1yZWRkaXQtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMWEyXCJ9LmZhLXN0dW1ibGV1cG9uLWNpcmNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjFhM1wifS5mYS1zdHVtYmxldXBvbjpiZWZvcmV7Y29udGVudDpcIlxcZjFhNFwifS5mYS1kZWxpY2lvdXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYTVcIn0uZmEtZGlnZzpiZWZvcmV7Y29udGVudDpcIlxcZjFhNlwifS5mYS1waWVkLXBpcGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMWE3XCJ9LmZhLXBpZWQtcGlwZXItYWx0OmJlZm9yZXtjb250ZW50OlwiXFxmMWE4XCJ9LmZhLWRydXBhbDpiZWZvcmV7Y29udGVudDpcIlxcZjFhOVwifS5mYS1qb29tbGE6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYWFcIn0uZmEtbGFuZ3VhZ2U6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYWJcIn0uZmEtZmF4OmJlZm9yZXtjb250ZW50OlwiXFxmMWFjXCJ9LmZhLWJ1aWxkaW5nOmJlZm9yZXtjb250ZW50OlwiXFxmMWFkXCJ9LmZhLWNoaWxkOmJlZm9yZXtjb250ZW50OlwiXFxmMWFlXCJ9LmZhLXBhdzpiZWZvcmV7Y29udGVudDpcIlxcZjFiMFwifS5mYS1zcG9vbjpiZWZvcmV7Y29udGVudDpcIlxcZjFiMVwifS5mYS1jdWJlOmJlZm9yZXtjb250ZW50OlwiXFxmMWIyXCJ9LmZhLWN1YmVzOmJlZm9yZXtjb250ZW50OlwiXFxmMWIzXCJ9LmZhLWJlaGFuY2U6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYjRcIn0uZmEtYmVoYW5jZS1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYjVcIn0uZmEtc3RlYW06YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYjZcIn0uZmEtc3RlYW0tc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMWI3XCJ9LmZhLXJlY3ljbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYjhcIn0uZmEtYXV0b21vYmlsZTpiZWZvcmUsLmZhLWNhcjpiZWZvcmV7Y29udGVudDpcIlxcZjFiOVwifS5mYS1jYWI6YmVmb3JlLC5mYS10YXhpOmJlZm9yZXtjb250ZW50OlwiXFxmMWJhXCJ9LmZhLXRyZWU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYmJcIn0uZmEtc3BvdGlmeTpiZWZvcmV7Y29udGVudDpcIlxcZjFiY1wifS5mYS1kZXZpYW50YXJ0OmJlZm9yZXtjb250ZW50OlwiXFxmMWJkXCJ9LmZhLXNvdW5kY2xvdWQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYmVcIn0uZmEtZGF0YWJhc2U6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYzBcIn0uZmEtZmlsZS1wZGYtbzpiZWZvcmV7Y29udGVudDpcIlxcZjFjMVwifS5mYS1maWxlLXdvcmQtbzpiZWZvcmV7Y29udGVudDpcIlxcZjFjMlwifS5mYS1maWxlLWV4Y2VsLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYzNcIn0uZmEtZmlsZS1wb3dlcnBvaW50LW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYzRcIn0uZmEtZmlsZS1waG90by1vOmJlZm9yZSwuZmEtZmlsZS1waWN0dXJlLW86YmVmb3JlLC5mYS1maWxlLWltYWdlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYzVcIn0uZmEtZmlsZS16aXAtbzpiZWZvcmUsLmZhLWZpbGUtYXJjaGl2ZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMWM2XCJ9LmZhLWZpbGUtc291bmQtbzpiZWZvcmUsLmZhLWZpbGUtYXVkaW8tbzpiZWZvcmV7Y29udGVudDpcIlxcZjFjN1wifS5mYS1maWxlLW1vdmllLW86YmVmb3JlLC5mYS1maWxlLXZpZGVvLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYzhcIn0uZmEtZmlsZS1jb2RlLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxYzlcIn0uZmEtdmluZTpiZWZvcmV7Y29udGVudDpcIlxcZjFjYVwifS5mYS1jb2RlcGVuOmJlZm9yZXtjb250ZW50OlwiXFxmMWNiXCJ9LmZhLWpzZmlkZGxlOmJlZm9yZXtjb250ZW50OlwiXFxmMWNjXCJ9LmZhLWxpZmUtYm91eTpiZWZvcmUsLmZhLWxpZmUtYnVveTpiZWZvcmUsLmZhLWxpZmUtc2F2ZXI6YmVmb3JlLC5mYS1zdXBwb3J0OmJlZm9yZSwuZmEtbGlmZS1yaW5nOmJlZm9yZXtjb250ZW50OlwiXFxmMWNkXCJ9LmZhLWNpcmNsZS1vLW5vdGNoOmJlZm9yZXtjb250ZW50OlwiXFxmMWNlXCJ9LmZhLXJhOmJlZm9yZSwuZmEtcmViZWw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZDBcIn0uZmEtZ2U6YmVmb3JlLC5mYS1lbXBpcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZDFcIn0uZmEtZ2l0LXNxdWFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjFkMlwifS5mYS1naXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZDNcIn0uZmEteS1jb21iaW5hdG9yLXNxdWFyZTpiZWZvcmUsLmZhLXljLXNxdWFyZTpiZWZvcmUsLmZhLWhhY2tlci1uZXdzOmJlZm9yZXtjb250ZW50OlwiXFxmMWQ0XCJ9LmZhLXRlbmNlbnQtd2VpYm86YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZDVcIn0uZmEtcXE6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZDZcIn0uZmEtd2VjaGF0OmJlZm9yZSwuZmEtd2VpeGluOmJlZm9yZXtjb250ZW50OlwiXFxmMWQ3XCJ9LmZhLXNlbmQ6YmVmb3JlLC5mYS1wYXBlci1wbGFuZTpiZWZvcmV7Y29udGVudDpcIlxcZjFkOFwifS5mYS1zZW5kLW86YmVmb3JlLC5mYS1wYXBlci1wbGFuZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMWQ5XCJ9LmZhLWhpc3Rvcnk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZGFcIn0uZmEtY2lyY2xlLXRoaW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZGJcIn0uZmEtaGVhZGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMWRjXCJ9LmZhLXBhcmFncmFwaDpiZWZvcmV7Y29udGVudDpcIlxcZjFkZFwifS5mYS1zbGlkZXJzOmJlZm9yZXtjb250ZW50OlwiXFxmMWRlXCJ9LmZhLXNoYXJlLWFsdDpiZWZvcmV7Y29udGVudDpcIlxcZjFlMFwifS5mYS1zaGFyZS1hbHQtc3F1YXJlOmJlZm9yZXtjb250ZW50OlwiXFxmMWUxXCJ9LmZhLWJvbWI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZTJcIn0uZmEtc29jY2VyLWJhbGwtbzpiZWZvcmUsLmZhLWZ1dGJvbC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMWUzXCJ9LmZhLXR0eTpiZWZvcmV7Y29udGVudDpcIlxcZjFlNFwifS5mYS1iaW5vY3VsYXJzOmJlZm9yZXtjb250ZW50OlwiXFxmMWU1XCJ9LmZhLXBsdWc6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZTZcIn0uZmEtc2xpZGVzaGFyZTpiZWZvcmV7Y29udGVudDpcIlxcZjFlN1wifS5mYS10d2l0Y2g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZThcIn0uZmEteWVscDpiZWZvcmV7Y29udGVudDpcIlxcZjFlOVwifS5mYS1uZXdzcGFwZXItbzpiZWZvcmV7Y29udGVudDpcIlxcZjFlYVwifS5mYS13aWZpOmJlZm9yZXtjb250ZW50OlwiXFxmMWViXCJ9LmZhLWNhbGN1bGF0b3I6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZWNcIn0uZmEtcGF5cGFsOmJlZm9yZXtjb250ZW50OlwiXFxmMWVkXCJ9LmZhLWdvb2dsZS13YWxsZXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZWVcIn0uZmEtY2MtdmlzYTpiZWZvcmV7Y29udGVudDpcIlxcZjFmMFwifS5mYS1jYy1tYXN0ZXJjYXJkOmJlZm9yZXtjb250ZW50OlwiXFxmMWYxXCJ9LmZhLWNjLWRpc2NvdmVyOmJlZm9yZXtjb250ZW50OlwiXFxmMWYyXCJ9LmZhLWNjLWFtZXg6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZjNcIn0uZmEtY2MtcGF5cGFsOmJlZm9yZXtjb250ZW50OlwiXFxmMWY0XCJ9LmZhLWNjLXN0cmlwZTpiZWZvcmV7Y29udGVudDpcIlxcZjFmNVwifS5mYS1iZWxsLXNsYXNoOmJlZm9yZXtjb250ZW50OlwiXFxmMWY2XCJ9LmZhLWJlbGwtc2xhc2gtbzpiZWZvcmV7Y29udGVudDpcIlxcZjFmN1wifS5mYS10cmFzaDpiZWZvcmV7Y29udGVudDpcIlxcZjFmOFwifS5mYS1jb3B5cmlnaHQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZjlcIn0uZmEtYXQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZmFcIn0uZmEtZXllZHJvcHBlcjpiZWZvcmV7Y29udGVudDpcIlxcZjFmYlwifS5mYS1wYWludC1icnVzaDpiZWZvcmV7Y29udGVudDpcIlxcZjFmY1wifS5mYS1iaXJ0aGRheS1jYWtlOmJlZm9yZXtjb250ZW50OlwiXFxmMWZkXCJ9LmZhLWFyZWEtY2hhcnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYxZmVcIn0uZmEtcGllLWNoYXJ0OmJlZm9yZXtjb250ZW50OlwiXFxmMjAwXCJ9LmZhLWxpbmUtY2hhcnQ6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMDFcIn0uZmEtbGFzdGZtOmJlZm9yZXtjb250ZW50OlwiXFxmMjAyXCJ9LmZhLWxhc3RmbS1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMDNcIn0uZmEtdG9nZ2xlLW9mZjpiZWZvcmV7Y29udGVudDpcIlxcZjIwNFwifS5mYS10b2dnbGUtb246YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMDVcIn0uZmEtYmljeWNsZTpiZWZvcmV7Y29udGVudDpcIlxcZjIwNlwifS5mYS1idXM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMDdcIn0uZmEtaW94aG9zdDpiZWZvcmV7Y29udGVudDpcIlxcZjIwOFwifS5mYS1hbmdlbGxpc3Q6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMDlcIn0uZmEtY2M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMGFcIn0uZmEtc2hla2VsOmJlZm9yZSwuZmEtc2hlcWVsOmJlZm9yZSwuZmEtaWxzOmJlZm9yZXtjb250ZW50OlwiXFxmMjBiXCJ9LmZhLW1lYW5wYXRoOmJlZm9yZXtjb250ZW50OlwiXFxmMjBjXCJ9LmZhLWJ1eXNlbGxhZHM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMGRcIn0uZmEtY29ubmVjdGRldmVsb3A6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMGVcIn0uZmEtZGFzaGN1YmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMTBcIn0uZmEtZm9ydW1iZWU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMTFcIn0uZmEtbGVhbnB1YjpiZWZvcmV7Y29udGVudDpcIlxcZjIxMlwifS5mYS1zZWxsc3k6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMTNcIn0uZmEtc2hpcnRzaW5idWxrOmJlZm9yZXtjb250ZW50OlwiXFxmMjE0XCJ9LmZhLXNpbXBseWJ1aWx0OmJlZm9yZXtjb250ZW50OlwiXFxmMjE1XCJ9LmZhLXNreWF0bGFzOmJlZm9yZXtjb250ZW50OlwiXFxmMjE2XCJ9LmZhLWNhcnQtcGx1czpiZWZvcmV7Y29udGVudDpcIlxcZjIxN1wifS5mYS1jYXJ0LWFycm93LWRvd246YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMThcIn0uZmEtZGlhbW9uZDpiZWZvcmV7Y29udGVudDpcIlxcZjIxOVwifS5mYS1zaGlwOmJlZm9yZXtjb250ZW50OlwiXFxmMjFhXCJ9LmZhLXVzZXItc2VjcmV0OmJlZm9yZXtjb250ZW50OlwiXFxmMjFiXCJ9LmZhLW1vdG9yY3ljbGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMWNcIn0uZmEtc3RyZWV0LXZpZXc6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMWRcIn0uZmEtaGVhcnRiZWF0OmJlZm9yZXtjb250ZW50OlwiXFxmMjFlXCJ9LmZhLXZlbnVzOmJlZm9yZXtjb250ZW50OlwiXFxmMjIxXCJ9LmZhLW1hcnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMjJcIn0uZmEtbWVyY3VyeTpiZWZvcmV7Y29udGVudDpcIlxcZjIyM1wifS5mYS1pbnRlcnNleDpiZWZvcmUsLmZhLXRyYW5zZ2VuZGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMjI0XCJ9LmZhLXRyYW5zZ2VuZGVyLWFsdDpiZWZvcmV7Y29udGVudDpcIlxcZjIyNVwifS5mYS12ZW51cy1kb3VibGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMjZcIn0uZmEtbWFycy1kb3VibGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMjdcIn0uZmEtdmVudXMtbWFyczpiZWZvcmV7Y29udGVudDpcIlxcZjIyOFwifS5mYS1tYXJzLXN0cm9rZTpiZWZvcmV7Y29udGVudDpcIlxcZjIyOVwifS5mYS1tYXJzLXN0cm9rZS12OmJlZm9yZXtjb250ZW50OlwiXFxmMjJhXCJ9LmZhLW1hcnMtc3Ryb2tlLWg6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMmJcIn0uZmEtbmV1dGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMjJjXCJ9LmZhLWdlbmRlcmxlc3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMmRcIn0uZmEtZmFjZWJvb2stb2ZmaWNpYWw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzBcIn0uZmEtcGludGVyZXN0LXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzFcIn0uZmEtd2hhdHNhcHA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzJcIn0uZmEtc2VydmVyOmJlZm9yZXtjb250ZW50OlwiXFxmMjMzXCJ9LmZhLXVzZXItcGx1czpiZWZvcmV7Y29udGVudDpcIlxcZjIzNFwifS5mYS11c2VyLXRpbWVzOmJlZm9yZXtjb250ZW50OlwiXFxmMjM1XCJ9LmZhLWhvdGVsOmJlZm9yZSwuZmEtYmVkOmJlZm9yZXtjb250ZW50OlwiXFxmMjM2XCJ9LmZhLXZpYWNvaW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzdcIn0uZmEtdHJhaW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYyMzhcIn0uZmEtc3Vid2F5OmJlZm9yZXtjb250ZW50OlwiXFxmMjM5XCJ9LmZhLW1lZGl1bTpiZWZvcmV7Y29udGVudDpcIlxcZjIzYVwifS5mYS15YzpiZWZvcmUsLmZhLXktY29tYmluYXRvcjpiZWZvcmV7Y29udGVudDpcIlxcZjIzYlwifS5mYS1vcHRpbi1tb25zdGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMjNjXCJ9LmZhLW9wZW5jYXJ0OmJlZm9yZXtjb250ZW50OlwiXFxmMjNkXCJ9LmZhLWV4cGVkaXRlZHNzbDpiZWZvcmV7Y29udGVudDpcIlxcZjIzZVwifS5mYS1iYXR0ZXJ5LTQ6YmVmb3JlLC5mYS1iYXR0ZXJ5LWZ1bGw6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNDBcIn0uZmEtYmF0dGVyeS0zOmJlZm9yZSwuZmEtYmF0dGVyeS10aHJlZS1xdWFydGVyczpiZWZvcmV7Y29udGVudDpcIlxcZjI0MVwifS5mYS1iYXR0ZXJ5LTI6YmVmb3JlLC5mYS1iYXR0ZXJ5LWhhbGY6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNDJcIn0uZmEtYmF0dGVyeS0xOmJlZm9yZSwuZmEtYmF0dGVyeS1xdWFydGVyOmJlZm9yZXtjb250ZW50OlwiXFxmMjQzXCJ9LmZhLWJhdHRlcnktMDpiZWZvcmUsLmZhLWJhdHRlcnktZW1wdHk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNDRcIn0uZmEtbW91c2UtcG9pbnRlcjpiZWZvcmV7Y29udGVudDpcIlxcZjI0NVwifS5mYS1pLWN1cnNvcjpiZWZvcmV7Y29udGVudDpcIlxcZjI0NlwifS5mYS1vYmplY3QtZ3JvdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNDdcIn0uZmEtb2JqZWN0LXVuZ3JvdXA6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNDhcIn0uZmEtc3RpY2t5LW5vdGU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNDlcIn0uZmEtc3RpY2t5LW5vdGUtbzpiZWZvcmV7Y29udGVudDpcIlxcZjI0YVwifS5mYS1jYy1qY2I6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNGJcIn0uZmEtY2MtZGluZXJzLWNsdWI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNGNcIn0uZmEtY2xvbmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNGRcIn0uZmEtYmFsYW5jZS1zY2FsZTpiZWZvcmV7Y29udGVudDpcIlxcZjI0ZVwifS5mYS1ob3VyZ2xhc3MtbzpiZWZvcmV7Y29udGVudDpcIlxcZjI1MFwifS5mYS1ob3VyZ2xhc3MtMTpiZWZvcmUsLmZhLWhvdXJnbGFzcy1zdGFydDpiZWZvcmV7Y29udGVudDpcIlxcZjI1MVwifS5mYS1ob3VyZ2xhc3MtMjpiZWZvcmUsLmZhLWhvdXJnbGFzcy1oYWxmOmJlZm9yZXtjb250ZW50OlwiXFxmMjUyXCJ9LmZhLWhvdXJnbGFzcy0zOmJlZm9yZSwuZmEtaG91cmdsYXNzLWVuZDpiZWZvcmV7Y29udGVudDpcIlxcZjI1M1wifS5mYS1ob3VyZ2xhc3M6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNTRcIn0uZmEtaGFuZC1ncmFiLW86YmVmb3JlLC5mYS1oYW5kLXJvY2stbzpiZWZvcmV7Y29udGVudDpcIlxcZjI1NVwifS5mYS1oYW5kLXN0b3AtbzpiZWZvcmUsLmZhLWhhbmQtcGFwZXItbzpiZWZvcmV7Y29udGVudDpcIlxcZjI1NlwifS5mYS1oYW5kLXNjaXNzb3JzLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNTdcIn0uZmEtaGFuZC1saXphcmQtbzpiZWZvcmV7Y29udGVudDpcIlxcZjI1OFwifS5mYS1oYW5kLXNwb2NrLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNTlcIn0uZmEtaGFuZC1wb2ludGVyLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNWFcIn0uZmEtaGFuZC1wZWFjZS1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjViXCJ9LmZhLXRyYWRlbWFyazpiZWZvcmV7Y29udGVudDpcIlxcZjI1Y1wifS5mYS1yZWdpc3RlcmVkOmJlZm9yZXtjb250ZW50OlwiXFxmMjVkXCJ9LmZhLWNyZWF0aXZlLWNvbW1vbnM6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNWVcIn0uZmEtZ2c6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNjBcIn0uZmEtZ2ctY2lyY2xlOmJlZm9yZXtjb250ZW50OlwiXFxmMjYxXCJ9LmZhLXRyaXBhZHZpc29yOmJlZm9yZXtjb250ZW50OlwiXFxmMjYyXCJ9LmZhLW9kbm9rbGFzc25pa2k6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNjNcIn0uZmEtb2Rub2tsYXNzbmlraS1zcXVhcmU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNjRcIn0uZmEtZ2V0LXBvY2tldDpiZWZvcmV7Y29udGVudDpcIlxcZjI2NVwifS5mYS13aWtpcGVkaWEtdzpiZWZvcmV7Y29udGVudDpcIlxcZjI2NlwifS5mYS1zYWZhcmk6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNjdcIn0uZmEtY2hyb21lOmJlZm9yZXtjb250ZW50OlwiXFxmMjY4XCJ9LmZhLWZpcmVmb3g6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNjlcIn0uZmEtb3BlcmE6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNmFcIn0uZmEtaW50ZXJuZXQtZXhwbG9yZXI6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNmJcIn0uZmEtdHY6YmVmb3JlLC5mYS10ZWxldmlzaW9uOmJlZm9yZXtjb250ZW50OlwiXFxmMjZjXCJ9LmZhLWNvbnRhbzpiZWZvcmV7Y29udGVudDpcIlxcZjI2ZFwifS5mYS01MDBweDpiZWZvcmV7Y29udGVudDpcIlxcZjI2ZVwifS5mYS1hbWF6b246YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNzBcIn0uZmEtY2FsZW5kYXItcGx1cy1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjcxXCJ9LmZhLWNhbGVuZGFyLW1pbnVzLW86YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNzJcIn0uZmEtY2FsZW5kYXItdGltZXMtbzpiZWZvcmV7Y29udGVudDpcIlxcZjI3M1wifS5mYS1jYWxlbmRhci1jaGVjay1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjc0XCJ9LmZhLWluZHVzdHJ5OmJlZm9yZXtjb250ZW50OlwiXFxmMjc1XCJ9LmZhLW1hcC1waW46YmVmb3Jle2NvbnRlbnQ6XCJcXGYyNzZcIn0uZmEtbWFwLXNpZ25zOmJlZm9yZXtjb250ZW50OlwiXFxmMjc3XCJ9LmZhLW1hcC1vOmJlZm9yZXtjb250ZW50OlwiXFxmMjc4XCJ9LmZhLW1hcDpiZWZvcmV7Y29udGVudDpcIlxcZjI3OVwifS5mYS1jb21tZW50aW5nOmJlZm9yZXtjb250ZW50OlwiXFxmMjdhXCJ9LmZhLWNvbW1lbnRpbmctbzpiZWZvcmV7Y29udGVudDpcIlxcZjI3YlwifS5mYS1ob3V6ejpiZWZvcmV7Y29udGVudDpcIlxcZjI3Y1wifS5mYS12aW1lbzpiZWZvcmV7Y29udGVudDpcIlxcZjI3ZFwifS5mYS1ibGFjay10aWU6YmVmb3Jle2NvbnRlbnQ6XCJcXGYyN2VcIn0uZmEtZm9udGljb25zOmJlZm9yZXtjb250ZW50OlwiXFxmMjgwXCJ9XG5cdFwiXCJcIlxuXG5jbGFzcyBtb2R1bGUuZXhwb3J0cyBleHRlbmRzIExheWVyXG5cdCMgaHR0cHM6Ly9mb3J0YXdlc29tZS5naXRodWIuaW8vRm9udC1Bd2Vzb21lL2NoZWF0c2hlZXQvXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucz17fSkgLT5cblx0XHRvcHRpb25zLmJhY2tncm91bmRDb2xvciA/PSAnJ1xuXHRcdG9wdGlvbnMuY29sb3IgPz0gJ2JsYWNrJ1xuXHRcdG9wdGlvbnMuY2xpcCA/PSBmYWxzZVxuXHRcdG9wdGlvbnMuZm9udFNpemUgPz0gNDBcblx0XHRmYUltcG9ydGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZmEnKVxuXHRcdGlmIGZhSW1wb3J0ZWQubGVuZ3RoIGlzIDBcblx0XHRcdFV0aWxzLmluc2VydENTUyBmb250QXdlc29tZUNTU1xuXHRcdHN1cGVyXG5cdFx0QHN0eWxlID0gZm9udEZhbWlseTogJ0ZvbnRBd2Vzb21lJ1xuXHRAZGVmaW5lIFwiaWNvblwiLCBcblx0XHRnZXQ6IC0+IEBodG1sXG5cdFx0c2V0OiAodmFsKSAtPiBcblx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKCdmYS0nLCcnKVxuXHRcdFx0aWYgY2xhc3NOYW1lc1t2YWxdP1xuXHRcdFx0XHRAaHRtbCA9IGNsYXNzTmFtZXNbdmFsXVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRAaHRtbCA9IHZhbCBcblx0QGRlZmluZSBcImZvbnRTaXplXCIsXG5cdFx0c2V0OiAodmFsKSAtPiBcblx0XHRcdEBzdHlsZS5mb250U2l6ZSA9IHZhbCsncHgnXG5cdFx0XHRAc3R5bGUubGluZUhlaWdodCA9IHZhbCsncHgnXG5cdFx0XHRzdHlsZSA9IFxuXHRcdFx0XHRmb250RmFtaWx5OiAnRm9udEF3ZXNvbWUnXG5cdFx0XHRcdGZvbnRTaXplOiB2YWwrJ3B4J1xuXHRcdFx0XHRsaW5lSGVpZ2h0OiB2YWwrJ3B4J1xuXHRcdFx0c2l6ZSA9IFV0aWxzLnRleHRTaXplIEBpY29uLCBzdHlsZVxuXHRcdFx0QHdpZHRoID0gc2l6ZS53aWR0aFxuXHRcdFx0QGhlaWdodCA9IHNpemUuaGVpZ2h0XG5cdEBkZWZpbmUgXCJjb2xvclwiLFxuXHRcdHNldDogKHZhbCkgLT4gQHN0eWxlLmNvbG9yID0gdmFsIiwiY2xhc3MgQ2FtZXJhTGF5ZXIgZXh0ZW5kcyBWaWRlb0xheWVyXG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucyA9IHt9KSAtPlxuICAgIGN1c3RvbVByb3BzID1cbiAgICAgIGZhY2luZzogdHJ1ZVxuICAgICAgZmxpcHBlZDogdHJ1ZVxuICAgICAgYXV0b0ZsaXA6IHRydWVcbiAgICAgIHJlc29sdXRpb246IHRydWVcbiAgICAgIGZpdDogdHJ1ZVxuXG4gICAgYmFzZU9wdGlvbnMgPSBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgLmZpbHRlciAoa2V5KSAtPiAhY3VzdG9tUHJvcHNba2V5XVxuICAgICAgLnJlZHVjZSAoY2xvbmUsIGtleSkgLT5cbiAgICAgICAgY2xvbmVba2V5XSA9IG9wdGlvbnNba2V5XVxuICAgICAgICBjbG9uZVxuICAgICAgLCB7fVxuXG4gICAgc3VwZXIoYmFzZU9wdGlvbnMpXG5cbiAgICBAX2ZhY2luZyA9IG9wdGlvbnMuZmFjaW5nID8gJ2JhY2snXG4gICAgQF9mbGlwcGVkID0gb3B0aW9ucy5mbGlwcGVkID8gZmFsc2VcbiAgICBAX2F1dG9GbGlwID0gb3B0aW9ucy5hdXRvRmxpcCA/IHRydWVcbiAgICBAX3Jlc29sdXRpb24gPSBvcHRpb25zLnJlc29sdXRpb24gPyA0ODBcblxuICAgIEBfc3RhcnRlZCA9IGZhbHNlXG4gICAgQF9kZXZpY2UgPSBudWxsXG4gICAgQF9tYXRjaGVkRmFjaW5nID0gJ3Vua25vd24nXG4gICAgQF9zdHJlYW0gPSBudWxsXG4gICAgQF9zY2hlZHVsZWRSZXN0YXJ0ID0gbnVsbFxuICAgIEBfcmVjb3JkaW5nID0gbnVsbFxuXG4gICAgQGJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCdcbiAgICBAY2xpcCA9IHRydWVcblxuICAgIEBwbGF5ZXIuc3JjID0gJydcbiAgICBAcGxheWVyLmF1dG9wbGF5ID0gdHJ1ZVxuICAgIEBwbGF5ZXIubXV0ZWQgPSB0cnVlXG4gICAgQHBsYXllci5wbGF5c2lubGluZSA9IHRydWVcbiAgICBAcGxheWVyLnN0eWxlLm9iamVjdEZpdCA9IG9wdGlvbnMuZml0ID8gJ2NvdmVyJ1xuXG4gIEBkZWZpbmUgJ2ZhY2luZycsXG4gICAgZ2V0OiAtPiBAX2ZhY2luZ1xuICAgIHNldDogKGZhY2luZykgLT5cbiAgICAgIEBfZmFjaW5nID0gaWYgZmFjaW5nID09ICdmcm9udCcgdGhlbiBmYWNpbmcgZWxzZSAnYmFjaydcbiAgICAgIEBfc2V0UmVzdGFydCgpXG5cbiAgQGRlZmluZSAnZmxpcHBlZCcsXG4gICAgZ2V0OiAtPiBAX2ZsaXBwZWRcbiAgICBzZXQ6IChmbGlwcGVkKSAtPlxuICAgICAgQF9mbGlwcGVkID0gZmxpcHBlZFxuICAgICAgQF9zZXRSZXN0YXJ0KClcblxuICBAZGVmaW5lICdhdXRvRmxpcCcsXG4gICAgZ2V0OiAtPiBAX2F1dG9GbGlwXG4gICAgc2V0OiAoYXV0b0ZsaXApIC0+XG4gICAgICBAX2F1dG9GbGlwID0gYXV0b0ZsaXBcbiAgICAgIEBfc2V0UmVzdGFydCgpXG5cbiAgQGRlZmluZSAncmVzb2x1dGlvbicsXG4gICAgZ2V0OiAtPiBAX3Jlc29sdXRpb25cbiAgICBzZXQ6IChyZXNvbHV0aW9uKSAtPlxuICAgICAgQF9yZXNvbHV0aW9uID0gcmVzb2x1dGlvblxuICAgICAgQF9zZXRSZXN0YXJ0KClcblxuICBAZGVmaW5lICdmaXQnLFxuICAgIGdldDogLT4gQHBsYXllci5zdHlsZS5vYmplY3RGaXRcbiAgICBzZXQ6IChmaXQpIC0+IEBwbGF5ZXIuc3R5bGUub2JqZWN0Rml0ID0gZml0XG5cbiAgQGRlZmluZSAnaXNSZWNvcmRpbmcnLFxuICAgIGdldDogLT4gQF9yZWNvcmRpbmc/LnJlY29yZGVyLnN0YXRlID09ICdyZWNvcmRpbmcnXG5cbiAgdG9nZ2xlRmFjaW5nOiAtPlxuICAgIEBfZmFjaW5nID0gaWYgQF9mYWNpbmcgPT0gJ2Zyb250JyB0aGVuICdiYWNrJyBlbHNlICdmcm9udCdcbiAgICBAX3NldFJlc3RhcnQoKVxuXG4gIGNhcHR1cmU6ICh3aWR0aCA9IEB3aWR0aCwgaGVpZ2h0ID0gQGhlaWdodCwgcmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbykgLT5cbiAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpXG4gICAgY2FudmFzLndpZHRoID0gcmF0aW8gKiB3aWR0aFxuICAgIGNhbnZhcy5oZWlnaHQgPSByYXRpbyAqIGhlaWdodFxuXG4gICAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIilcbiAgICBAZHJhdyhjb250ZXh0KVxuXG4gICAgdXJsID0gY2FudmFzLnRvRGF0YVVSTCgpXG4gICAgQGVtaXQoJ2NhcHR1cmUnLCB1cmwpXG5cbiAgICB1cmxcblxuICBkcmF3OiAoY29udGV4dCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbnRleHRcblxuICAgIGNvdmVyID0gKHNyY1csIHNyY0gsIGRzdFcsIGRzdEgpIC0+XG4gICAgICBzY2FsZVggPSBkc3RXIC8gc3JjV1xuICAgICAgc2NhbGVZID0gZHN0SCAvIHNyY0hcbiAgICAgIHNjYWxlID0gaWYgc2NhbGVYID4gc2NhbGVZIHRoZW4gc2NhbGVYIGVsc2Ugc2NhbGVZXG4gICAgICB3aWR0aDogc3JjVyAqIHNjYWxlLCBoZWlnaHQ6IHNyY0ggKiBzY2FsZVxuXG4gICAge3ZpZGVvV2lkdGgsIHZpZGVvSGVpZ2h0fSA9IEBwbGF5ZXJcblxuICAgIGNsaXBCb3ggPSB3aWR0aDogY29udGV4dC5jYW52YXMud2lkdGgsIGhlaWdodDogY29udGV4dC5jYW52YXMuaGVpZ2h0XG4gICAgbGF5ZXJCb3ggPSBjb3ZlcihAd2lkdGgsIEBoZWlnaHQsIGNsaXBCb3gud2lkdGgsIGNsaXBCb3guaGVpZ2h0KVxuICAgIHZpZGVvQm94ID0gY292ZXIodmlkZW9XaWR0aCwgdmlkZW9IZWlnaHQsIGxheWVyQm94LndpZHRoLCBsYXllckJveC5oZWlnaHQpXG5cbiAgICB4ID0gKGNsaXBCb3gud2lkdGggLSB2aWRlb0JveC53aWR0aCkgLyAyXG4gICAgeSA9IChjbGlwQm94LmhlaWdodCAtIHZpZGVvQm94LmhlaWdodCkgLyAyXG5cbiAgICBjb250ZXh0LmRyYXdJbWFnZShAcGxheWVyLCB4LCB5LCB2aWRlb0JveC53aWR0aCwgdmlkZW9Cb3guaGVpZ2h0KVxuXG4gIHN0YXJ0OiAtPlxuICAgIEBfZW51bWVyYXRlRGV2aWNlcygpXG4gICAgLnRoZW4gKGRldmljZXMpID0+XG4gICAgICBkZXZpY2VzID0gZGV2aWNlcy5maWx0ZXIgKGRldmljZSkgLT4gZGV2aWNlLmtpbmQgPT0gJ3ZpZGVvaW5wdXQnXG5cbiAgICAgIGZvciBkZXZpY2UgaW4gZGV2aWNlc1xuICAgICAgICBpZiBkZXZpY2UubGFiZWwuaW5kZXhPZihAX2ZhY2luZykgIT0gLTFcbiAgICAgICAgICBAX21hdGNoZWRGYWNpbmcgPSBAX2ZhY2luZ1xuICAgICAgICAgIHJldHVybiBkZXZpY2VcblxuICAgICAgQF9tYXRjaGVkRmFjaW5nID0gJ3Vua25vd24nXG5cbiAgICAgIGlmIGRldmljZXMubGVuZ3RoID4gMCB0aGVuIGRldmljZXNbMF0gZWxzZSBQcm9taXNlLnJlamVjdCgpXG5cbiAgICAudGhlbiAoZGV2aWNlKSA9PlxuICAgICAgcmV0dXJuIGlmICFkZXZpY2UgfHwgZGV2aWNlLmRldmljZUlkID09IEBfZGV2aWNlPy5kZXZpY2VJZFxuXG4gICAgICBAc3RvcCgpXG4gICAgICBAX2RldmljZSA9IGRldmljZVxuXG4gICAgICBjb25zdHJhaW50cyA9XG4gICAgICAgIHZpZGVvOlxuICAgICAgICAgIG1hbmRhdG9yeToge21pbldpZHRoOiBAX3Jlc29sdXRpb24sIG1pbkhlaWdodDogQF9yZXNvbHV0aW9ufVxuICAgICAgICAgIG9wdGlvbmFsOiBbe3NvdXJjZUlkOiBAX2RldmljZS5kZXZpY2VJZH1dXG4gICAgICAgIGF1ZGlvOlxuICAgICAgICAgIHRydWVcblxuICAgICAgQF9nZXRVc2VyTWVkaWEoY29uc3RyYWludHMpXG5cbiAgICAudGhlbiAoc3RyZWFtKSA9PlxuICAgICAgQHBsYXllci5zcmNPYmplY3QgPSBzdHJlYW1cbiAgICAgIEBfc3RhcnRlZCA9IHRydWVcbiAgICAgIEBfc3RyZWFtID0gc3RyZWFtXG4gICAgICBAX2ZsaXAoKVxuXG4gICAgLmNhdGNoIChlcnJvcikgLT5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG5cbiAgc3RvcDogLT5cbiAgICBAX3N0YXJ0ZWQgPSBmYWxzZVxuXG4gICAgQHBsYXllci5wYXVzZSgpXG4gICAgQHBsYXllci5zcmNPYmplY3QgPSBudWxsXG5cbiAgICBAX3N0cmVhbT8uZ2V0VHJhY2tzKCkuZm9yRWFjaCAodHJhY2spIC0+IHRyYWNrLnN0b3AoKVxuICAgIEBfc3RyZWFtID0gbnVsbFxuICAgIEBfZGV2aWNlID0gbnVsbFxuXG4gICAgaWYgQF9zY2hlZHVsZWRSZXN0YXJ0XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShAX3NjaGVkdWxlZFJlc3RhcnQpXG4gICAgICBAX3NjaGVkdWxlZFJlc3RhcnQgPSBudWxsXG5cbiAgc3RhcnRSZWNvcmRpbmc6IC0+XG4gICAgaWYgQF9yZWNvcmRpbmdcbiAgICAgIEBfcmVjb3JkaW5nLnJlY29yZGVyLnN0b3AoKVxuICAgICAgQF9yZWNvcmRpbmcgPSBudWxsXG5cbiAgICBjaHVua3MgPSBbXVxuXG4gICAgcmVjb3JkZXIgPSBuZXcgTWVkaWFSZWNvcmRlcihAX3N0cmVhbSwge21pbWVUeXBlOiAndmlkZW8vd2VibSd9KVxuICAgIHJlY29yZGVyLmFkZEV2ZW50TGlzdGVuZXIgJ3N0YXJ0JywgKGV2ZW50KSA9PiBAZW1pdCgnc3RhcnRyZWNvcmRpbmcnKVxuICAgIHJlY29yZGVyLmFkZEV2ZW50TGlzdGVuZXIgJ2RhdGFhdmFpbGFibGUnLCAoZXZlbnQpIC0+IGNodW5rcy5wdXNoKGV2ZW50LmRhdGEpXG4gICAgcmVjb3JkZXIuYWRkRXZlbnRMaXN0ZW5lciAnc3RvcCcsIChldmVudCkgPT5cbiAgICAgIGJsb2IgPSBuZXcgQmxvYihjaHVua3MpXG4gICAgICB1cmwgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKVxuICAgICAgQGVtaXQoJ3N0b3ByZWNvcmRpbmcnKVxuICAgICAgQGVtaXQoJ3JlY29yZCcsIHVybClcblxuICAgIHJlY29yZGVyLnN0YXJ0KClcblxuICAgIEBfcmVjb3JkaW5nID0ge3JlY29yZGVyLCBjaHVua3N9XG5cbiAgc3RvcFJlY29yZGluZzogLT5cbiAgICByZXR1cm4gaWYgIUBfcmVjb3JkaW5nXG4gICAgQF9yZWNvcmRpbmcucmVjb3JkZXIuc3RvcCgpXG4gICAgQF9yZWNvcmRpbmcgPSBudWxsXG5cbiAgb25DYXB0dXJlOiAoY2FsbGJhY2spIC0+IEBvbignY2FwdHVyZScsIGNhbGxiYWNrKVxuICBvblN0YXJ0UmVjb3JkaW5nOiAoY2FsbGJhY2spIC0+IEBvbignc3RhcnRyZWNvcmRpbmcnLCBjYWxsYmFjaylcbiAgb25TdG9wUmVjb3JkaW5nOiAoY2FsbGJhY2spIC0+IEBvbignc3RvcHJlY29yZGluZycsIGNhbGxiYWNrKVxuICBvblJlY29yZDogKGNhbGxiYWNrKSAtPiBAb24oJ3JlY29yZCcsIGNhbGxiYWNrKVxuXG4gIF9zZXRSZXN0YXJ0OiAtPlxuICAgIHJldHVybiBpZiAhQF9zdGFydGVkIHx8IEBfc2NoZWR1bGVkUmVzdGFydFxuXG4gICAgQF9zY2hlZHVsZWRSZXN0YXJ0ID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0+XG4gICAgICBAX3NjaGVkdWxlZFJlc3RhcnQgPSBudWxsXG4gICAgICBAc3RhcnQoKVxuXG4gIF9mbGlwOiAtPlxuICAgIEBfZmxpcHBlZCA9IEBfbWF0Y2hlZEZhY2luZyA9PSAnZnJvbnQnIGlmIEBfYXV0b0ZsaXBcbiAgICB4ID0gaWYgQF9mbGlwcGVkIHRoZW4gLTEgZWxzZSAxXG4gICAgQHBsYXllci5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSBcInNjYWxlKCN7eH0sIDEpXCJcblxuICBfZW51bWVyYXRlRGV2aWNlczogLT5cbiAgICB0cnlcbiAgICAgIG5hdmlnYXRvci5tZWRpYURldmljZXMuZW51bWVyYXRlRGV2aWNlcygpXG4gICAgY2F0Y2hcbiAgICAgIFByb21pc2UucmVqZWN0KClcblxuICBfZ2V0VXNlck1lZGlhOiAoY29uc3RyYWludHMpIC0+XG4gICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgIHRyeVxuICAgICAgICBndW0gPSBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWFcbiAgICAgICAgZ3VtLmNhbGwobmF2aWdhdG9yLCBjb25zdHJhaW50cywgcmVzb2x2ZSwgcmVqZWN0KVxuICAgICAgY2F0Y2hcbiAgICAgICAgcmVqZWN0KClcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmFMYXllciBpZiBtb2R1bGU/XG5GcmFtZXIuQ2FtZXJhTGF5ZXIgPSBDYW1lcmFMYXllclxuIiwiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFLQUE7QURBQSxJQUFBLFdBQUE7RUFBQTs7O0FBQU07OztFQUNTLHFCQUFDLE9BQUQ7QUFDWCxRQUFBOztNQURZLFVBQVU7O0lBQ3RCLFdBQUEsR0FDRTtNQUFBLE1BQUEsRUFBUSxJQUFSO01BQ0EsT0FBQSxFQUFTLElBRFQ7TUFFQSxRQUFBLEVBQVUsSUFGVjtNQUdBLFVBQUEsRUFBWSxJQUhaO01BSUEsR0FBQSxFQUFLLElBSkw7O0lBTUYsV0FBQSxHQUFjLE1BQU0sQ0FBQyxJQUFQLENBQVksT0FBWixDQUNaLENBQUMsTUFEVyxDQUNKLFNBQUMsR0FBRDthQUFTLENBQUMsV0FBWSxDQUFBLEdBQUE7SUFBdEIsQ0FESSxDQUVaLENBQUMsTUFGVyxDQUVKLFNBQUMsS0FBRCxFQUFR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
