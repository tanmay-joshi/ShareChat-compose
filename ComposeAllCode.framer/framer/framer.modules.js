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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3Rhbm1heWpvc2hpL0Rlc2t0b3AvU2hhcmVDaGF0X0ZyYW1lci9Db21wb3NlQWxsQ29kZS5mcmFtZXIvbW9kdWxlcy9teU1vZHVsZS5jb2ZmZWUiLCIuLi8uLi8uLi8uLi8uLi9Vc2Vycy90YW5tYXlqb3NoaS9EZXNrdG9wL1NoYXJlQ2hhdF9GcmFtZXIvQ29tcG9zZUFsbENvZGUuZnJhbWVyL21vZHVsZXMvaW5wdXQtZnJhbWVyL2lucHV0LmNvZmZlZSIsIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3Rhbm1heWpvc2hpL0Rlc2t0b3AvU2hhcmVDaGF0X0ZyYW1lci9Db21wb3NlQWxsQ29kZS5mcmFtZXIvbW9kdWxlcy9mcmFtZXItY2FtZXJhLWlucHV0L0NhbWVyYUlucHV0LmNvZmZlZSIsIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3Rhbm1heWpvc2hpL0Rlc2t0b3AvU2hhcmVDaGF0X0ZyYW1lci9Db21wb3NlQWxsQ29kZS5mcmFtZXIvbW9kdWxlcy9DYW1lcmFMYXllci5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiMgQWRkIHRoZSBmb2xsb3dpbmcgbGluZSB0byB5b3VyIHByb2plY3QgaW4gRnJhbWVyIFN0dWRpby4gXG4jIG15TW9kdWxlID0gcmVxdWlyZSBcIm15TW9kdWxlXCJcbiMgUmVmZXJlbmNlIHRoZSBjb250ZW50cyBieSBuYW1lLCBsaWtlIG15TW9kdWxlLm15RnVuY3Rpb24oKSBvciBteU1vZHVsZS5teVZhclxuXG5leHBvcnRzLm15VmFyID0gXCJteVZhcmlhYmxlXCJcblxuZXhwb3J0cy5teUZ1bmN0aW9uID0gLT5cblx0cHJpbnQgXCJteUZ1bmN0aW9uIGlzIHJ1bm5pbmdcIlxuXG5leHBvcnRzLm15QXJyYXkgPSBbMSwgMiwgM10iLCJleHBvcnRzLmtleWJvYXJkTGF5ZXIgPSBuZXcgTGF5ZXJcblx0eDowLCB5OlNjcmVlbi5oZWlnaHQsIHdpZHRoOlNjcmVlbi53aWR0aCwgaGVpZ2h0OjQzMlxuXHRodG1sOlwiPGltZyBzdHlsZT0nd2lkdGg6IDEwMCU7JyBzcmM9J21vZHVsZXMva2V5Ym9hcmQucG5nJy8+XCJcblxuI3NjcmVlbiB3aWR0aCB2cy4gc2l6ZSBvZiBpbWFnZSB3aWR0aFxuZ3Jvd3RoUmF0aW8gPSBTY3JlZW4ud2lkdGggLyA3MzJcbmltYWdlSGVpZ2h0ID0gZ3Jvd3RoUmF0aW8gKiA0MzJcblxuIyBFeHRlbmRzIHRoZSBMYXllclN0eWxlIGNsYXNzIHdoaWNoIGRvZXMgdGhlIHBpeGVsIHJhdGlvIGNhbGN1bGF0aW9ucyBpbiBmcmFtZXJcbl9pbnB1dFN0eWxlID1cblx0T2JqZWN0LmFzc2lnbih7fSwgRnJhbWVyLkxheWVyU3R5bGUsXG5cdFx0Y2FsY3VsYXRlUGl4ZWxSYXRpbyA9IChsYXllciwgdmFsdWUpIC0+XG5cdFx0XHQodmFsdWUgKiBsYXllci5jb250ZXh0LnBpeGVsTXVsdGlwbGllcikgKyBcInB4XCJcblxuXHRcdGZvbnRTaXplOiAobGF5ZXIpIC0+XG5cdFx0XHRjYWxjdWxhdGVQaXhlbFJhdGlvKGxheWVyLCBsYXllci5fcHJvcGVydGllcy5mb250U2l6ZSlcblxuXHRcdGxpbmVIZWlnaHQ6IChsYXllcikgLT5cblx0XHRcdChsYXllci5fcHJvcGVydGllcy5saW5lSGVpZ2h0KSArIFwiZW1cIlxuXG5cdFx0cGFkZGluZzogKGxheWVyKSAtPlxuXHRcdFx0eyBwaXhlbE11bHRpcGxpZXIgfSA9IGxheWVyLmNvbnRleHRcblx0XHRcdHBhZGRpbmcgPSBbXVxuXHRcdFx0cGFkZGluZ1ZhbHVlID0gbGF5ZXIuX3Byb3BlcnRpZXMucGFkZGluZ1xuXG5cdFx0XHQjIENoZWNrIGlmIHdlIGhhdmUgYSBzaW5nbGUgbnVtYmVyIGFzIGludGVnZXJcblx0XHRcdGlmIE51bWJlci5pc0ludGVnZXIocGFkZGluZ1ZhbHVlKVxuXHRcdFx0XHRyZXR1cm4gY2FsY3VsYXRlUGl4ZWxSYXRpbyhsYXllciwgcGFkZGluZ1ZhbHVlKVxuXG5cdFx0XHQjIElmIHdlIGhhdmUgbXVsdGlwbGUgdmFsdWVzIHRoZXkgY29tZSBhcyBzdHJpbmcgKGUuZy4gXCIxIDIgMyA0XCIpXG5cdFx0XHRwYWRkaW5nVmFsdWVzID0gbGF5ZXIuX3Byb3BlcnRpZXMucGFkZGluZy5zcGxpdChcIiBcIilcblxuXHRcdFx0c3dpdGNoIHBhZGRpbmdWYWx1ZXMubGVuZ3RoXG5cdFx0XHRcdHdoZW4gNFxuXHRcdFx0XHRcdHBhZGRpbmcudG9wID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcucmlnaHQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMV0pXG5cdFx0XHRcdFx0cGFkZGluZy5ib3R0b20gPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMl0pXG5cdFx0XHRcdFx0cGFkZGluZy5sZWZ0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzNdKVxuXG5cdFx0XHRcdHdoZW4gM1xuXHRcdFx0XHRcdHBhZGRpbmcudG9wID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcucmlnaHQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMV0pXG5cdFx0XHRcdFx0cGFkZGluZy5ib3R0b20gPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMl0pXG5cdFx0XHRcdFx0cGFkZGluZy5sZWZ0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzFdKVxuXG5cdFx0XHRcdHdoZW4gMlxuXHRcdFx0XHRcdHBhZGRpbmcudG9wID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcucmlnaHQgPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMV0pXG5cdFx0XHRcdFx0cGFkZGluZy5ib3R0b20gPSBwYXJzZUZsb2F0KHBhZGRpbmdWYWx1ZXNbMF0pXG5cdFx0XHRcdFx0cGFkZGluZy5sZWZ0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzFdKVxuXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRwYWRkaW5nLnRvcCA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1swXSlcblx0XHRcdFx0XHRwYWRkaW5nLnJpZ2h0ID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcuYm90dG9tID0gcGFyc2VGbG9hdChwYWRkaW5nVmFsdWVzWzBdKVxuXHRcdFx0XHRcdHBhZGRpbmcubGVmdCA9IHBhcnNlRmxvYXQocGFkZGluZ1ZhbHVlc1swXSlcblxuXHRcdFx0IyBSZXR1cm4gYXMgNC12YWx1ZSBzdHJpbmcgKGUuZyBcIjFweCAycHggM3B4IDRweFwiKVxuXHRcdFx0XCIje3BhZGRpbmcudG9wICogcGl4ZWxNdWx0aXBsaWVyfXB4ICN7cGFkZGluZy5yaWdodCAqIHBpeGVsTXVsdGlwbGllcn1weCAje3BhZGRpbmcuYm90dG9tICogcGl4ZWxNdWx0aXBsaWVyfXB4ICN7cGFkZGluZy5sZWZ0ICogcGl4ZWxNdWx0aXBsaWVyfXB4XCJcblx0KVxuXG5leHBvcnRzLmtleWJvYXJkTGF5ZXIuc3RhdGVzID1cblx0c2hvd246XG5cdFx0eTogU2NyZWVuLmhlaWdodCAtIGltYWdlSGVpZ2h0XG5cbmV4cG9ydHMua2V5Ym9hcmRMYXllci5zdGF0ZXMuYW5pbWF0aW9uT3B0aW9ucyA9XG5cdGN1cnZlOiBcInNwcmluZyg1MDAsNTAsMTUpXCJcblxuY2xhc3MgZXhwb3J0cy5JbnB1dCBleHRlbmRzIExheWVyXG5cdEBkZWZpbmUgXCJzdHlsZVwiLFxuXHRcdGdldDogLT4gQGlucHV0LnN0eWxlXG5cdFx0c2V0OiAodmFsdWUpIC0+XG5cdFx0XHRfLmV4dGVuZCBAaW5wdXQuc3R5bGUsIHZhbHVlXG5cblx0QGRlZmluZSBcInZhbHVlXCIsXG5cdFx0Z2V0OiAtPiBAaW5wdXQudmFsdWVcblx0XHRzZXQ6ICh2YWx1ZSkgLT5cblx0XHRcdEBpbnB1dC52YWx1ZSA9IHZhbHVlXG5cblx0Y29uc3RydWN0b3I6IChvcHRpb25zID0ge30pIC0+XG5cdFx0b3B0aW9ucy5zZXR1cCA/PSBmYWxzZVxuXHRcdG9wdGlvbnMud2lkdGggPz0gU2NyZWVuLndpZHRoXG5cdFx0b3B0aW9ucy5jbGlwID89IGZhbHNlXG5cdFx0b3B0aW9ucy5oZWlnaHQgPz0gNjBcblx0XHRvcHRpb25zLmJhY2tncm91bmRDb2xvciA/PSBpZiBvcHRpb25zLnNldHVwIHRoZW4gXCJyZ2JhKDI1NSwgNjAsIDQ3LCAuNSlcIiBlbHNlIFwicmdiYSgyNTUsIDI1NSwgMjU1LCAuMDEpXCIgIyBcInRyYW5zcGFyZW50XCIgc2VlbXMgdG8gY2F1c2UgYSBidWcgaW4gbGF0ZXN0IHNhZmFyaSB2ZXJzaW9uXG5cdFx0b3B0aW9ucy5mb250U2l6ZSA/PSAzMFxuXHRcdG9wdGlvbnMubGluZUhlaWdodCA/PSAxXG5cdFx0b3B0aW9ucy5wYWRkaW5nID89IDEwXG5cdFx0b3B0aW9ucy50ZXh0ID89IFwiXCJcblx0XHRvcHRpb25zLnBsYWNlaG9sZGVyID89IFwiXCJcblx0XHRvcHRpb25zLnZpcnR1YWxLZXlib2FyZCA/PSBpZiBVdGlscy5pc01vYmlsZSgpIHRoZW4gZmFsc2UgZWxzZSB0cnVlXG5cdFx0b3B0aW9ucy50eXBlID89IFwidGV4dFwiXG5cdFx0b3B0aW9ucy5nb0J1dHRvbiA/PSBmYWxzZVxuXHRcdG9wdGlvbnMuYXV0b0NvcnJlY3QgPz0gXCJvblwiXG5cdFx0b3B0aW9ucy5hdXRvQ29tcGxldGUgPz0gXCJvblwiXG5cdFx0b3B0aW9ucy5hdXRvQ2FwaXRhbGl6ZSA/PSBcIm9uXCJcblx0XHRvcHRpb25zLnNwZWxsQ2hlY2sgPz0gXCJvblwiXG5cdFx0b3B0aW9ucy5hdXRvZm9jdXMgPz0gZmFsc2Vcblx0XHRvcHRpb25zLnRleHRDb2xvciA/PSBcIiMwMDBcIlxuXHRcdG9wdGlvbnMuZm9udEZhbWlseSA/PSBcIi1hcHBsZS1zeXN0ZW1cIlxuXHRcdG9wdGlvbnMuZm9udFdlaWdodCA/PSBcIjUwMFwiXG5cdFx0b3B0aW9ucy5zdWJtaXQgPz0gZmFsc2Vcblx0XHRvcHRpb25zLnRhYkluZGV4ID89IDBcblx0XHRvcHRpb25zLnRleHRhcmVhID89IGZhbHNlXG5cdFx0b3B0aW9ucy5kaXNhYmxlZCA/PSBmYWxzZVxuXG5cdFx0c3VwZXIgb3B0aW9uc1xuXG5cdFx0IyBBZGQgYWRkaXRpb25hbCBwcm9wZXJ0aWVzXG5cdFx0QF9wcm9wZXJ0aWVzLmZvbnRTaXplID0gb3B0aW9ucy5mb250U2l6ZVxuXHRcdEBfcHJvcGVydGllcy5saW5lSGVpZ2h0ID0gb3B0aW9ucy5saW5lSGVpZ2h0XG5cdFx0QF9wcm9wZXJ0aWVzLnBhZGRpbmcgPSBvcHRpb25zLnBhZGRpbmdcblxuXHRcdEBwbGFjZWhvbGRlckNvbG9yID0gb3B0aW9ucy5wbGFjZWhvbGRlckNvbG9yIGlmIG9wdGlvbnMucGxhY2Vob2xkZXJDb2xvcj9cblx0XHRAaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50IGlmIG9wdGlvbnMudGV4dGFyZWEgdGhlbiAndGV4dGFyZWEnIGVsc2UgJ2lucHV0J1xuXHRcdEBpbnB1dC5pZCA9IFwiaW5wdXQtI3tfLm5vdygpfVwiXG5cblx0XHQjIEFkZCBzdHlsaW5nIHRvIHRoZSBpbnB1dCBlbGVtZW50XG5cdFx0QGlucHV0LnN0eWxlLndpZHRoID0gX2lucHV0U3R5bGVbXCJ3aWR0aFwiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5oZWlnaHQgPSBfaW5wdXRTdHlsZVtcImhlaWdodFwiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5mb250U2l6ZSA9IF9pbnB1dFN0eWxlW1wiZm9udFNpemVcIl0oQClcblx0XHRAaW5wdXQuc3R5bGUubGluZUhlaWdodCA9IF9pbnB1dFN0eWxlW1wibGluZUhlaWdodFwiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5vdXRsaW5lID0gXCJub25lXCJcblx0XHRAaW5wdXQuc3R5bGUuYm9yZGVyID0gXCJub25lXCJcblx0XHRAaW5wdXQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gb3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3Jcblx0XHRAaW5wdXQuc3R5bGUucGFkZGluZyA9IF9pbnB1dFN0eWxlW1wicGFkZGluZ1wiXShAKVxuXHRcdEBpbnB1dC5zdHlsZS5mb250RmFtaWx5ID0gb3B0aW9ucy5mb250RmFtaWx5XG5cdFx0QGlucHV0LnN0eWxlLmNvbG9yID0gb3B0aW9ucy50ZXh0Q29sb3Jcblx0XHRAaW5wdXQuc3R5bGUuZm9udFdlaWdodCA9IG9wdGlvbnMuZm9udFdlaWdodFxuXG5cdFx0QGlucHV0LnZhbHVlID0gb3B0aW9ucy50ZXh0XG5cdFx0QGlucHV0LnR5cGUgPSBvcHRpb25zLnR5cGVcblx0XHRAaW5wdXQucGxhY2Vob2xkZXIgPSBvcHRpb25zLnBsYWNlaG9sZGVyXG5cdFx0QGlucHV0LnNldEF0dHJpYnV0ZSBcInRhYmluZGV4XCIsIG9wdGlvbnMudGFiaW5kZXhcblx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwiYXV0b2NvcnJlY3RcIiwgb3B0aW9ucy5hdXRvQ29ycmVjdFxuXHRcdEBpbnB1dC5zZXRBdHRyaWJ1dGUgXCJhdXRvY29tcGxldGVcIiwgb3B0aW9ucy5hdXRvQ29tcGxldGVcblx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwiYXV0b2NhcGl0YWxpemVcIiwgb3B0aW9ucy5hdXRvQ2FwaXRhbGl6ZVxuXHRcdGlmIG9wdGlvbnMuZGlzYWJsZWQgPT0gdHJ1ZVxuXHRcdFx0QGlucHV0LnNldEF0dHJpYnV0ZSBcImRpc2FibGVkXCIsIHRydWVcblx0XHRpZiBvcHRpb25zLmF1dG9mb2N1cyA9PSB0cnVlXG5cdFx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwiYXV0b2ZvY3VzXCIsIHRydWVcblx0XHRAaW5wdXQuc2V0QXR0cmlidXRlIFwic3BlbGxjaGVja1wiLCBvcHRpb25zLnNwZWxsQ2hlY2tcblx0XHRAZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgXCJmb3JtXCJcblxuXHRcdGlmIChvcHRpb25zLmdvQnV0dG9uICYmICFvcHRpb25zLnN1Ym1pdCkgfHwgIW9wdGlvbnMuc3VibWl0XG5cdFx0XHRAZm9ybS5hY3Rpb24gPSBcIiNcIlxuXHRcdFx0QGZvcm0uYWRkRXZlbnRMaXN0ZW5lciBcInN1Ym1pdFwiLCAoZXZlbnQpIC0+XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXHRcdEBmb3JtLmFwcGVuZENoaWxkIEBpbnB1dFxuXHRcdEBfZWxlbWVudC5hcHBlbmRDaGlsZCBAZm9ybVxuXG5cdFx0QGJhY2tncm91bmRDb2xvciA9IFwidHJhbnNwYXJlbnRcIlxuXHRcdEB1cGRhdGVQbGFjZWhvbGRlckNvbG9yIG9wdGlvbnMucGxhY2Vob2xkZXJDb2xvciBpZiBAcGxhY2Vob2xkZXJDb2xvclxuXG5cdFx0I29ubHkgc2hvdyBob25vciB2aXJ0dWFsIGtleWJvYXJkIG9wdGlvbiB3aGVuIG5vdCBvbiBtb2JpbGUsXG5cdFx0I290aGVyd2lzZSBpZ25vcmVcblx0XHRpZiAhVXRpbHMuaXNNb2JpbGUoKSAmJiBvcHRpb25zLnZpcnR1YWxLZXlib2FyZCBpcyB0cnVlXG5cdFx0XHRAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciBcImZvY3VzXCIsIC0+XG5cdFx0XHRcdGV4cG9ydHMua2V5Ym9hcmRMYXllci5icmluZ1RvRnJvbnQoKVxuXHRcdFx0XHRleHBvcnRzLmtleWJvYXJkTGF5ZXIuc3RhdGVDeWNsZSgpXG5cdFx0XHRAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciBcImJsdXJcIiwgLT5cblx0XHRcdFx0ZXhwb3J0cy5rZXlib2FyZExheWVyLmFuaW1hdGUoXCJkZWZhdWx0XCIpXG5cblx0dXBkYXRlUGxhY2Vob2xkZXJDb2xvcjogKGNvbG9yKSAtPlxuXHRcdEBwbGFjZWhvbGRlckNvbG9yID0gY29sb3Jcblx0XHRpZiBAcGFnZVN0eWxlP1xuXHRcdFx0ZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZCBAcGFnZVN0eWxlXG5cdFx0QHBhZ2VTdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgXCJzdHlsZVwiXG5cdFx0QHBhZ2VTdHlsZS50eXBlID0gXCJ0ZXh0L2Nzc1wiXG5cdFx0Y3NzID0gXCIjI3tAaW5wdXQuaWR9Ojotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyIHsgY29sb3I6ICN7QHBsYWNlaG9sZGVyQ29sb3J9OyB9XCJcblx0XHRAcGFnZVN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlIGNzcylcblx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkIEBwYWdlU3R5bGVcblxuXHRmb2N1czogKCkgLT5cblx0XHRAaW5wdXQuZm9jdXMoKVxuXG5cdHVuZm9jdXM6ICgpIC0+XG5cdFx0QGlucHV0LmJsdXIoKVxuXG5cdG9uRm9jdXM6IChjYikgLT5cblx0XHRAaW5wdXQuYWRkRXZlbnRMaXN0ZW5lciBcImZvY3VzXCIsIC0+XG5cdFx0XHRjYi5hcHBseShAKVxuXG5cdG9uQmx1cjogKGNiKSAtPlxuXHRcdEBpbnB1dC5hZGRFdmVudExpc3RlbmVyIFwiYmx1clwiLCAtPlxuXHRcdFx0Y2IuYXBwbHkoQClcblxuXHRvblVuZm9jdXM6IHRoaXMub25CbHVyXG5cdFxuXHRkaXNhYmxlOiAoKSAtPlxuXHRcdEBpbnB1dC5zZXRBdHRyaWJ1dGUgXCJkaXNhYmxlZFwiLCB0cnVlXG5cblx0ZW5hYmxlOiAoKSA9PlxuXHRcdEBpbnB1dC5yZW1vdmVBdHRyaWJ1dGUgXCJkaXNhYmxlZFwiLCB0cnVlXG5cdFxuIiwiY2xhc3MgZXhwb3J0cy5DYW1lcmFJbnB1dCBleHRlbmRzIFRleHRMYXllclxuXHRjb25zdHJ1Y3RvcjogKEBvcHRpb25zPXt9KSAtPlxuXHRcdF8uZGVmYXVsdHMgQG9wdGlvbnMsXG5cdFx0XHRpZ25vcmVFdmVudHM6IGZhbHNlXG5cdFx0c3VwZXIgQG9wdGlvbnNcblxuXHRcdEBjaGFuZ2VIYW5kbGVyID0gKGV2ZW50KSAtPlxuXHRcdFx0aWYoQG9wdGlvbnMuY2FsbGJhY2spXG5cdFx0XHRcdGZpbGUgPSBAX2VsZW1lbnQuZmlsZXNbMF1cblx0XHRcdFx0dXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKVxuXHRcdFx0XHRAb3B0aW9ucy5jYWxsYmFjayh1cmwsIGZpbGUudHlwZSlcblxuXHRcdEBjaGFuZ2VIYW5kbGVyID0gQGNoYW5nZUhhbmRsZXIuYmluZCBAXG5cdFx0RXZlbnRzLndyYXAoQF9lbGVtZW50KS5hZGRFdmVudExpc3RlbmVyIFwiY2hhbmdlXCIsIEBjaGFuZ2VIYW5kbGVyXG5cblx0X2NyZWF0ZUVsZW1lbnQ6IC0+XG5cdFx0cmV0dXJuIGlmIEBfZWxlbWVudD9cblx0XHRAX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50IFwiaW5wdXRcIlxuXHRcdEBfZWxlbWVudC50eXBlID0gXCJmaWxlXCJcblx0XHRAX2VsZW1lbnQuY2FwdHVyZSA9IHRydWVcblx0XHRAX2VsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZyYW1lckxheWVyXCIpXG5cdFx0QF9lbGVtZW50LnN0eWxlW1wiLXdlYmtpdC1hcHBlYXJhbmNlXCJdID0gXCJub25lXCJcblx0XHRAX2VsZW1lbnQuc3R5bGVbXCItd2Via2l0LXRleHQtc2l6ZS1hZGp1c3RcIl0gPSBcIm5vbmVcIlxuXHRcdEBfZWxlbWVudC5zdHlsZVtcIm91dGxpbmVcIl0gPSBcIm5vbmVcIlxuXHRcdHN3aXRjaCBAb3B0aW9ucy5hY2NlcHRcblx0XHRcdHdoZW4gXCJpbWFnZVwiIHRoZW4gQF9lbGVtZW50LmFjY2VwdCA9IFwiaW1hZ2UvKlwiXG5cdFx0XHR3aGVuIFwidmlkZW9cIiB0aGVuIEBfZWxlbWVudC5hY2NlcHQgPSBcInZpZGVvLypcIlxuXHRcdFx0ZWxzZSBAX2VsZW1lbnQuYWNjZXB0ID0gXCJpbWFnZS8qLHZpZGVvLypcIlxuXG5cdEBkZWZpbmUgXCJhY2NlcHRcIixcblx0XHRnZXQ6IC0+XG5cdFx0XHRAX2VsZW1lbnQuYWNjZXB0XG5cdFx0c2V0OiAodmFsdWUpIC0+XG5cdFx0XHRzd2l0Y2ggdmFsdWVcblx0XHRcdFx0d2hlbiBcImltYWdlXCIgdGhlbiBAX2VsZW1lbnQuYWNjZXB0ID0gXCJpbWFnZS8qXCJcblx0XHRcdFx0d2hlbiBcInZpZGVvXCIgdGhlbiBAX2VsZW1lbnQuYWNjZXB0ID0gXCJ2aWRlby8qXCJcblx0XHRcdFx0ZWxzZSBAX2VsZW1lbnQuYWNjZXB0ID0gXCJpbWFnZS8qLHZpZGVvLypcIiIsImNsYXNzIENhbWVyYUxheWVyIGV4dGVuZHMgVmlkZW9MYXllclxuICBjb25zdHJ1Y3RvcjogKG9wdGlvbnMgPSB7fSkgLT5cbiAgICBjdXN0b21Qcm9wcyA9XG4gICAgICBmYWNpbmc6IHRydWVcbiAgICAgIGZsaXBwZWQ6IHRydWVcbiAgICAgIGF1dG9GbGlwOiB0cnVlXG4gICAgICByZXNvbHV0aW9uOiB0cnVlXG4gICAgICBmaXQ6IHRydWVcblxuICAgIGJhc2VPcHRpb25zID0gT2JqZWN0LmtleXMob3B0aW9ucylcbiAgICAgIC5maWx0ZXIgKGtleSkgLT4gIWN1c3RvbVByb3BzW2tleV1cbiAgICAgIC5yZWR1Y2UgKGNsb25lLCBrZXkpIC0+XG4gICAgICAgIGNsb25lW2tleV0gPSBvcHRpb25zW2tleV1cbiAgICAgICAgY2xvbmVcbiAgICAgICwge31cblxuICAgIHN1cGVyKGJhc2VPcHRpb25zKVxuXG4gICAgQF9mYWNpbmcgPSBvcHRpb25zLmZhY2luZyA/ICdiYWNrJ1xuICAgIEBfZmxpcHBlZCA9IG9wdGlvbnMuZmxpcHBlZCA/IGZhbHNlXG4gICAgQF9hdXRvRmxpcCA9IG9wdGlvbnMuYXV0b0ZsaXAgPyB0cnVlXG4gICAgQF9yZXNvbHV0aW9uID0gb3B0aW9ucy5yZXNvbHV0aW9uID8gNDgwXG5cbiAgICBAX3N0YXJ0ZWQgPSBmYWxzZVxuICAgIEBfZGV2aWNlID0gbnVsbFxuICAgIEBfbWF0Y2hlZEZhY2luZyA9ICd1bmtub3duJ1xuICAgIEBfc3RyZWFtID0gbnVsbFxuICAgIEBfc2NoZWR1bGVkUmVzdGFydCA9IG51bGxcbiAgICBAX3JlY29yZGluZyA9IG51bGxcblxuICAgIEBiYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnXG4gICAgQGNsaXAgPSB0cnVlXG5cbiAgICBAcGxheWVyLnNyYyA9ICcnXG4gICAgQHBsYXllci5hdXRvcGxheSA9IHRydWVcbiAgICBAcGxheWVyLm11dGVkID0gdHJ1ZVxuICAgIEBwbGF5ZXIucGxheXNpbmxpbmUgPSB0cnVlXG4gICAgQHBsYXllci5zdHlsZS5vYmplY3RGaXQgPSBvcHRpb25zLmZpdCA/ICdjb3ZlcidcblxuICBAZGVmaW5lICdmYWNpbmcnLFxuICAgIGdldDogLT4gQF9mYWNpbmdcbiAgICBzZXQ6IChmYWNpbmcpIC0+XG4gICAgICBAX2ZhY2luZyA9IGlmIGZhY2luZyA9PSAnZnJvbnQnIHRoZW4gZmFjaW5nIGVsc2UgJ2JhY2snXG4gICAgICBAX3NldFJlc3RhcnQoKVxuXG4gIEBkZWZpbmUgJ2ZsaXBwZWQnLFxuICAgIGdldDogLT4gQF9mbGlwcGVkXG4gICAgc2V0OiAoZmxpcHBlZCkgLT5cbiAgICAgIEBfZmxpcHBlZCA9IGZsaXBwZWRcbiAgICAgIEBfc2V0UmVzdGFydCgpXG5cbiAgQGRlZmluZSAnYXV0b0ZsaXAnLFxuICAgIGdldDogLT4gQF9hdXRvRmxpcFxuICAgIHNldDogKGF1dG9GbGlwKSAtPlxuICAgICAgQF9hdXRvRmxpcCA9IGF1dG9GbGlwXG4gICAgICBAX3NldFJlc3RhcnQoKVxuXG4gIEBkZWZpbmUgJ3Jlc29sdXRpb24nLFxuICAgIGdldDogLT4gQF9yZXNvbHV0aW9uXG4gICAgc2V0OiAocmVzb2x1dGlvbikgLT5cbiAgICAgIEBfcmVzb2x1dGlvbiA9IHJlc29sdXRpb25cbiAgICAgIEBfc2V0UmVzdGFydCgpXG5cbiAgQGRlZmluZSAnZml0JyxcbiAgICBnZXQ6IC0+IEBwbGF5ZXIuc3R5bGUub2JqZWN0Rml0XG4gICAgc2V0OiAoZml0KSAtPiBAcGxheWVyLnN0eWxlLm9iamVjdEZpdCA9IGZpdFxuXG4gIEBkZWZpbmUgJ2lzUmVjb3JkaW5nJyxcbiAgICBnZXQ6IC0+IEBfcmVjb3JkaW5nPy5yZWNvcmRlci5zdGF0ZSA9PSAncmVjb3JkaW5nJ1xuXG4gIHRvZ2dsZUZhY2luZzogLT5cbiAgICBAX2ZhY2luZyA9IGlmIEBfZmFjaW5nID09ICdmcm9udCcgdGhlbiAnYmFjaycgZWxzZSAnZnJvbnQnXG4gICAgQF9zZXRSZXN0YXJ0KClcblxuICBjYXB0dXJlOiAod2lkdGggPSBAd2lkdGgsIGhlaWdodCA9IEBoZWlnaHQsIHJhdGlvID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8pIC0+XG4gICAgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKVxuICAgIGNhbnZhcy53aWR0aCA9IHJhdGlvICogd2lkdGhcbiAgICBjYW52YXMuaGVpZ2h0ID0gcmF0aW8gKiBoZWlnaHRcblxuICAgIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpXG4gICAgQGRyYXcoY29udGV4dClcblxuICAgIHVybCA9IGNhbnZhcy50b0RhdGFVUkwoKVxuICAgIEBlbWl0KCdjYXB0dXJlJywgdXJsKVxuXG4gICAgdXJsXG5cbiAgZHJhdzogKGNvbnRleHQpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBjb250ZXh0XG5cbiAgICBjb3ZlciA9IChzcmNXLCBzcmNILCBkc3RXLCBkc3RIKSAtPlxuICAgICAgc2NhbGVYID0gZHN0VyAvIHNyY1dcbiAgICAgIHNjYWxlWSA9IGRzdEggLyBzcmNIXG4gICAgICBzY2FsZSA9IGlmIHNjYWxlWCA+IHNjYWxlWSB0aGVuIHNjYWxlWCBlbHNlIHNjYWxlWVxuICAgICAgd2lkdGg6IHNyY1cgKiBzY2FsZSwgaGVpZ2h0OiBzcmNIICogc2NhbGVcblxuICAgIHt2aWRlb1dpZHRoLCB2aWRlb0hlaWdodH0gPSBAcGxheWVyXG5cbiAgICBjbGlwQm94ID0gd2lkdGg6IGNvbnRleHQuY2FudmFzLndpZHRoLCBoZWlnaHQ6IGNvbnRleHQuY2FudmFzLmhlaWdodFxuICAgIGxheWVyQm94ID0gY292ZXIoQHdpZHRoLCBAaGVpZ2h0LCBjbGlwQm94LndpZHRoLCBjbGlwQm94LmhlaWdodClcbiAgICB2aWRlb0JveCA9IGNvdmVyKHZpZGVvV2lkdGgsIHZpZGVvSGVpZ2h0LCBsYXllckJveC53aWR0aCwgbGF5ZXJCb3guaGVpZ2h0KVxuXG4gICAgeCA9IChjbGlwQm94LndpZHRoIC0gdmlkZW9Cb3gud2lkdGgpIC8gMlxuICAgIHkgPSAoY2xpcEJveC5oZWlnaHQgLSB2aWRlb0JveC5oZWlnaHQpIC8gMlxuXG4gICAgY29udGV4dC5kcmF3SW1hZ2UoQHBsYXllciwgeCwgeSwgdmlkZW9Cb3gud2lkdGgsIHZpZGVvQm94LmhlaWdodClcblxuICBzdGFydDogLT5cbiAgICBAX2VudW1lcmF0ZURldmljZXMoKVxuICAgIC50aGVuIChkZXZpY2VzKSA9PlxuICAgICAgZGV2aWNlcyA9IGRldmljZXMuZmlsdGVyIChkZXZpY2UpIC0+IGRldmljZS5raW5kID09ICd2aWRlb2lucHV0J1xuXG4gICAgICBmb3IgZGV2aWNlIGluIGRldmljZXNcbiAgICAgICAgaWYgZGV2aWNlLmxhYmVsLmluZGV4T2YoQF9mYWNpbmcpICE9IC0xXG4gICAgICAgICAgQF9tYXRjaGVkRmFjaW5nID0gQF9mYWNpbmdcbiAgICAgICAgICByZXR1cm4gZGV2aWNlXG5cbiAgICAgIEBfbWF0Y2hlZEZhY2luZyA9ICd1bmtub3duJ1xuXG4gICAgICBpZiBkZXZpY2VzLmxlbmd0aCA+IDAgdGhlbiBkZXZpY2VzWzBdIGVsc2UgUHJvbWlzZS5yZWplY3QoKVxuXG4gICAgLnRoZW4gKGRldmljZSkgPT5cbiAgICAgIHJldHVybiBpZiAhZGV2aWNlIHx8IGRldmljZS5kZXZpY2VJZCA9PSBAX2RldmljZT8uZGV2aWNlSWRcblxuICAgICAgQHN0b3AoKVxuICAgICAgQF9kZXZpY2UgPSBkZXZpY2VcblxuICAgICAgY29uc3RyYWludHMgPVxuICAgICAgICB2aWRlbzpcbiAgICAgICAgICBtYW5kYXRvcnk6IHttaW5XaWR0aDogQF9yZXNvbHV0aW9uLCBtaW5IZWlnaHQ6IEBfcmVzb2x1dGlvbn1cbiAgICAgICAgICBvcHRpb25hbDogW3tzb3VyY2VJZDogQF9kZXZpY2UuZGV2aWNlSWR9XVxuICAgICAgICBhdWRpbzpcbiAgICAgICAgICB0cnVlXG5cbiAgICAgIEBfZ2V0VXNlck1lZGlhKGNvbnN0cmFpbnRzKVxuXG4gICAgLnRoZW4gKHN0cmVhbSkgPT5cbiAgICAgIEBwbGF5ZXIuc3JjT2JqZWN0ID0gc3RyZWFtXG4gICAgICBAX3N0YXJ0ZWQgPSB0cnVlXG4gICAgICBAX3N0cmVhbSA9IHN0cmVhbVxuICAgICAgQF9mbGlwKClcblxuICAgIC5jYXRjaCAoZXJyb3IpIC0+XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuXG4gIHN0b3A6IC0+XG4gICAgQF9zdGFydGVkID0gZmFsc2VcblxuICAgIEBwbGF5ZXIucGF1c2UoKVxuICAgIEBwbGF5ZXIuc3JjT2JqZWN0ID0gbnVsbFxuXG4gICAgQF9zdHJlYW0/LmdldFRyYWNrcygpLmZvckVhY2ggKHRyYWNrKSAtPiB0cmFjay5zdG9wKClcbiAgICBAX3N0cmVhbSA9IG51bGxcbiAgICBAX2RldmljZSA9IG51bGxcblxuICAgIGlmIEBfc2NoZWR1bGVkUmVzdGFydFxuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoQF9zY2hlZHVsZWRSZXN0YXJ0KVxuICAgICAgQF9zY2hlZHVsZWRSZXN0YXJ0ID0gbnVsbFxuXG4gIHN0YXJ0UmVjb3JkaW5nOiAtPlxuICAgIGlmIEBfcmVjb3JkaW5nXG4gICAgICBAX3JlY29yZGluZy5yZWNvcmRlci5zdG9wKClcbiAgICAgIEBfcmVjb3JkaW5nID0gbnVsbFxuXG4gICAgY2h1bmtzID0gW11cblxuICAgIHJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIoQF9zdHJlYW0sIHttaW1lVHlwZTogJ3ZpZGVvL3dlYm0nfSlcbiAgICByZWNvcmRlci5hZGRFdmVudExpc3RlbmVyICdzdGFydCcsIChldmVudCkgPT4gQGVtaXQoJ3N0YXJ0cmVjb3JkaW5nJylcbiAgICByZWNvcmRlci5hZGRFdmVudExpc3RlbmVyICdkYXRhYXZhaWxhYmxlJywgKGV2ZW50KSAtPiBjaHVua3MucHVzaChldmVudC5kYXRhKVxuICAgIHJlY29yZGVyLmFkZEV2ZW50TGlzdGVuZXIgJ3N0b3AnLCAoZXZlbnQpID0+XG4gICAgICBibG9iID0gbmV3IEJsb2IoY2h1bmtzKVxuICAgICAgdXJsID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYilcbiAgICAgIEBlbWl0KCdzdG9wcmVjb3JkaW5nJylcbiAgICAgIEBlbWl0KCdyZWNvcmQnLCB1cmwpXG5cbiAgICByZWNvcmRlci5zdGFydCgpXG5cbiAgICBAX3JlY29yZGluZyA9IHtyZWNvcmRlciwgY2h1bmtzfVxuXG4gIHN0b3BSZWNvcmRpbmc6IC0+XG4gICAgcmV0dXJuIGlmICFAX3JlY29yZGluZ1xuICAgIEBfcmVjb3JkaW5nLnJlY29yZGVyLnN0b3AoKVxuICAgIEBfcmVjb3JkaW5nID0gbnVsbFxuXG4gIG9uQ2FwdHVyZTogKGNhbGxiYWNrKSAtPiBAb24oJ2NhcHR1cmUnLCBjYWxsYmFjaylcbiAgb25TdGFydFJlY29yZGluZzogKGNhbGxiYWNrKSAtPiBAb24oJ3N0YXJ0cmVjb3JkaW5nJywgY2FsbGJhY2spXG4gIG9uU3RvcFJlY29yZGluZzogKGNhbGxiYWNrKSAtPiBAb24oJ3N0b3ByZWNvcmRpbmcnLCBjYWxsYmFjaylcbiAgb25SZWNvcmQ6IChjYWxsYmFjaykgLT4gQG9uKCdyZWNvcmQnLCBjYWxsYmFjaylcblxuICBfc2V0UmVzdGFydDogLT5cbiAgICByZXR1cm4gaWYgIUBfc3RhcnRlZCB8fCBAX3NjaGVkdWxlZFJlc3RhcnRcblxuICAgIEBfc2NoZWR1bGVkUmVzdGFydCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PlxuICAgICAgQF9zY2hlZHVsZWRSZXN0YXJ0ID0gbnVsbFxuICAgICAgQHN0YXJ0KClcblxuICBfZmxpcDogLT5cbiAgICBAX2ZsaXBwZWQgPSBAX21hdGNoZWRGYWNpbmcgPT0gJ2Zyb250JyBpZiBAX2F1dG9GbGlwXG4gICAgeCA9IGlmIEBfZmxpcHBlZCB0aGVuIC0xIGVsc2UgMVxuICAgIEBwbGF5ZXIuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gXCJzY2FsZSgje3h9LCAxKVwiXG5cbiAgX2VudW1lcmF0ZURldmljZXM6IC0+XG4gICAgdHJ5XG4gICAgICBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmVudW1lcmF0ZURldmljZXMoKVxuICAgIGNhdGNoXG4gICAgICBQcm9taXNlLnJlamVjdCgpXG5cbiAgX2dldFVzZXJNZWRpYTogKGNvbnN0cmFpbnRzKSAtPlxuICAgIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgICB0cnlcbiAgICAgICAgZ3VtID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhXG4gICAgICAgIGd1bS5jYWxsKG5hdmlnYXRvciwgY29uc3RyYWludHMsIHJlc29sdmUsIHJlamVjdClcbiAgICAgIGNhdGNoXG4gICAgICAgIHJlamVjdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhTGF5ZXIgaWYgbW9kdWxlP1xuRnJhbWVyLkNhbWVyYUxheWVyID0gQ2FtZXJhTGF5ZXJcbiIsIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtv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
