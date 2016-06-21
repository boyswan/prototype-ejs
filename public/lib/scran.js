(function() {
  var w = window,
    d = document;

  /*
   *  _getFirstSupported [private] - Take an array of CSS properties and return a supported string.
   *  @param {arr} - An array of properties to check against.
   *
   *  @return {string} - A vendor specific CSS property string.
   */
  function _getFirstSupported(arr) {
      var div = document.createElement('div');
      var ven = null;
      arr.forEach(function(vendor) {
           if (typeof div.style[vendor] !== 'undefined') ven = vendor;
      });

      return ven;
  }

  /*
   *  prefixProperty [private] - Calculates the vendor specific string for the supplied CSS property.
   *  @param {prop} - The property string
   *
   *  @return {string} - The vendor specific string.
   */
  function prefixProperty(prop) {
      var propCap = prop.charAt(0).toUpperCase() + prop.substring(1);
      var arr = ' ms Moz Webkit O'.split(' ').map(function(prefix) {
          return prefix === '' ? prop : prefix + propCap;
      });
      return _getFirstSupported(arr);
  }

  var _ = {},
      _collections = {};

  var CSS_TRANSFORM = prefixProperty('transform'),
      CSS_PERSPECTIVE = prefixProperty('perspective');

  _.clear = function() {
      _collections = {};
  };

  _.updateRequired = true;

  _.select = function(target) {
      var arr = null;
      if (typeof target === 'string') {
          if (target.indexOf('#') !== -1) {
              arr = [d.getElementById(target.split('#')[1])];
          } else if (target.indexOf('.') !== -1) {
              arr = d.querySelectorAll(target);
          }
      } else if ('nodeType' in target && target.nodeType === 1) {
          arr = [target];
      }
      if (arr && arr.length > 0) {
          var str = '$scr-' + Math.floor(Math.random() * new Date().getTime());
          var c = new ElementCollection(arr, str);
          var sel = c.collected();
          if (sel) {
              return _collections[sel];
          } else {
              _collections[str] = c;
              return _collections[str];
          }
      }
  };

  _.rafLast = 0;

  _.requestAnimFrame = (function(){
      return  w.requestAnimationFrame     ||
              w.webkitRequestAnimationFrame   ||
              w.mozRequestAnimationFrame      ||
              function(callback, element) {
                  var currTime = new Date().getTime();
                  var timeToCall = Math.max(0, 16 - (currTime - _.rafLast));
                  var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
                  _.rafLast = currTime + timeToCall;
                  return id;
              };
  })();

  _.cancelAnimFrame = (function() {
      return  w.cancelAnimationFrame  ||
              w.cancelRequestAnimationFrame   ||
              w.webkitCancelAnimationFrame    ||
              w.webkitCancelRequestAnimationFrame ||
              w.mozCancelAnimationFrame   ||
              w.mozCancelRequestAnimationFrame    ||
              function(id) {
                  clearTimeout(id);
              };
  })();

  _.support = CSS_TRANSFORM !== null;
  _.support3d = CSS_PERSPECTIVE !== null;

  _.listen = (function() {
      if (w.addEventListener) {
          return function(el, ev, fn) {
              el.addEventListener(ev, fn, false);
          };
      } else if (w.attachEvent) {
          return function(el, ev, fn) {
              el.attachEvent('on' + ev, function() { fn.call(el); }, false);
          };
      }
  })();

  _.detach = (function() {
      if (w.removeEventListener) {
          return function(el, event, callback) {
              el.removeEventListener(event, callback);
          };
      } else if (w.detachEvent) {
          return function(el, event, callback) {
              el.detachEvent('on' + event, function() {
                  return callback.call(el);
              });
          };
      }
  })();

  _.st = (function() {
      if (typeof w.pageYOffset !== 'undefined') {
          return function(val) {
              if (!isNaN(val)) {
                  var b = ('clientHeight' in d.documentElement) ? d.documentElement : d.body;
                  b.scrollTop = val;
              }
              return w.pageYOffset;
          };
      } else {
          var b = ('clientHeight' in d.documentElement) ? d.documentElement : d.body;
          return function(val) {
              if (val && !isNaN(val)) b.scrollTop = val;
              return b.scrollTop;
          };
      }
  })();

  _.sl = (function() {
      if (typeof w.pageXOffset !== 'undefined') {
          return function() {
              return w.pageXOffset;
          };
      } else {
          var b = ('clientHeight' in d.documentElement) ? d.documentElement : d.body;
          return function() {
              return b.scrollLeft;
          };
      }
  })();

  _.wh = (function() {
      if (typeof w.innerHeight !== 'undefined') {
          return function() {
              return w.innerHeight;
          };
      } else {
          var b = ('clientHeight' in d.documentElement) ? d.documentElement : d.body;
          return function() {
              return b.clientHeight;
          };
      }
  })();

  _.ww = (function() {
      if (typeof w.innerWidth !== 'undefined') {
          return function() {
              return w.innerWidth;
          };
      } else {
          var b = ('clientWidth' in d.documentElement) ? d.documentElement : d.body;
          return function() {
              return b.clientWidth;
          };
      }
  })();

  _.dh = function() {
      return Math.max(
          Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
          Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
          Math.max(d.body.clientHeight, d.documentElement.clientHeight)
      );
  };

  _.msƒ = function() {
      _.ms = _.dh() - _.wh();
      return _.ms;
  };

  _.msƒ();

  _.customST = function(fn) {
      _.st = fn;
  };

  _.cst = -1;

  _.scroll = function(val,d,e,c,t) {
      _.tween().queue()
          .from(_.st())
          .to(val)
          .duration(d || 400)
          .ease(e || _.easing.easeNone)
          .step(function(val) {
              w.scrollTo(0, val);
          })
          .complete(c || _.noop)
          .start();
  };

  _.tween = function() {
      return new TweenController();
  };

  _.matrix = function() {
      return Matrix3D.create();
  };

  _.render = function(forcedScrollTop) {
      var st = _.st();
      if (!isNaN(forcedScrollTop)) {
          st = forcedScrollTop;
          _.updateRequired = true;
      }
      var wh = _.wh();

      Object.keys(_collections).forEach(function(key) {
          var _c = _collections[key];
          if (!_c.forceRender) {
              var _r = _c.elems[0].getBoundingClientRect();
              var height = _r.bottom - _r.top;
              if (_r.top > -30 - height && _r.top < wh) {
                  _c.calculate(st);
              }
          } else {
              _c.calculate(st);
          }
      });

      _.cst = st;

      _.updateRequired = false;
  };

  _.noop = function() {};

  /*
   *
   *  TERMS OF USE - EASING EQUATIONS
   *
   *  Open source under the BSD License.
   *
   *  Copyright © 2001 Robert Penner
   *  All rights reserved.
   *
   *  Redistribution and use in source and binary forms, with or without modification,
   *  are permitted provided that the following conditions are met:
   *
   *  Redistributions of source code must retain the above copyright notice, this list of
   *  conditions and the following disclaimer.
   *  Redistributions in binary form must reproduce the above copyright notice, this list
   *  of conditions and the following disclaimer in the documentation and/or other materials
   *  provided with the distribution.
   *
   *  Neither the name of the author nor the names of contributors may be used to endorse
   *  or promote products derived from this software without specific prior written permission.
   *
   *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
   *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
   *  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
   *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
   *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
   *  AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
   *  OF THE POSSIBILITY OF SUCH DAMAGE.
   *
   */

  _.easing = {
      easeNone: function(t, b, c, d) {
          return c * t / d + b;
      },
      easeInQuad: function(t, b, c, d) {
          return c*(t/=d)*t + b;
      },
      easeOutQuad: function(t, b, c, d) {
          return -c *(t/=d)*(t-2) + b;
      },
      easeInOutQuad: function(t, b, c, d) {
          if ((t/=d/2) < 1) return c/2*t*t + b;
          return -c/2 * ((--t)*(t-2) - 1) + b;
      },
      easeInCubic: function(t, b, c, d) {
          return c*(t/=d)*t*t + b;
      },
      easeOutCubic: function(t, b, c, d) {
          return c*((t=t/d-1)*t*t + 1) + b;
      },
      easeInOutCubic: function(t, b, c, d) {
          if ((t/=d/2) < 1) return c/2*t*t*t + b;
          return c/2*((t-=2)*t*t + 2) + b;
      },
      easeInQuart: function(t, b, c, d) {
          return c*(t/=d)*t*t*t + b;
      },
      easeOutQuart: function(t, b, c, d) {
          return -c * ((t=t/d-1)*t*t*t - 1) + b;
      },
      easeInOutQuart: function(t, b, c, d) {
          if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
          return -c/2 * ((t-=2)*t*t*t - 2) + b;
      },
      easeInQuint: function(t, b, c, d) {
          return c*(t/=d)*t*t*t*t + b;
      },
      easeOutQuint: function(t, b, c, d) {
          return c*((t=t/d-1)*t*t*t*t + 1) + b;
      },
      easeInOutQuint: function(t, b, c, d) {
          if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
          return c/2*((t-=2)*t*t*t*t + 2) + b;
      },
      easeInSine: function(t, b, c, d) {
          return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
      },
      easeOutSine: function(t, b, c, d) {
          return c * Math.sin(t/d * (Math.PI/2)) + b;
      },
      easeInOutSine: function(t, b, c, d) {
          return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
      },
      easeInExpo: function(t, b, c, d) {
          return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
      },
      easeOutExpo: function(t, b, c, d) {
          return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
      },
      easeInOutExpo: function(t, b, c, d) {
          if (t==0) return b;
          if (t==d) return b+c;
          if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
          return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
      },
      easeInCirc: function(t, b, c, d) {
          return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
      },
      easeOutCirc: function(t, b, c, d) {
          return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
      },
      easeInOutCirc: function(t, b, c, d) {
          if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
          return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
      },
      easeInElastic: function(t, b, c, d) {
          var s=1.70158;var p=0;var a=c;
          if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
          if (a < Math.abs(c)) { a=c; var s=p/4; }
          else var s = p/(2*Math.PI) * Math.asin (c/a);
          return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
      },
      easeOutElastic: function(t, b, c, d) {
          var s=1.70158;var p=0;var a=c;
          if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
          if (a < Math.abs(c)) { a=c; var s=p/4; }
          else var s = p/(2*Math.PI) * Math.asin (c/a);
          return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
      },
      easeInOutElastic: function(t, b, c, d) {
          var s=1.70158;var p=0;var a=c;
          if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
          if (a < Math.abs(c)) { a=c; var s=p/4; }
          else var s = p/(2*Math.PI) * Math.asin (c/a);
          if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
          return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
      },
      easeInBack: function(t, b, c, d, s) {
          if (s == undefined) s = 1.70158;
          return c*(t/=d)*t*((s+1)*t - s) + b;
      },
      easeOutBack: function(t, b, c, d, s) {
          if (s == undefined) s = 1.70158;
          return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
      },
      easeInOutBack: function(t, b, c, d, s) {
          if (s == undefined) s = 1.70158;
          if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
          return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
      },
      easeInBounce: function(t, b, c, d) {
          return c - _.easing.easeOutBounce (d-t, 0, c, d) + b;
      },
      easeOutBounce: function(t, b, c, d) {
          if ((t/=d) < (1/2.75)) {
              return c*(7.5625*t*t) + b;
          } else if (t < (2/2.75)) {
              return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
          } else if (t < (2.5/2.75)) {
              return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
          } else {
              return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
          }
      },
      easeInOutBounce: function (t, b, c, d) {
          if (t < d/2) return _.easing.easeInBounce (t*2, 0, c, d) * .5 + b;
          return _.easing.easeOutBounce (t*2-d, 0, c, d) * .5 + c*.5 + b;
      }
  }

  var Transformer = function(parent) {
      this.parent = parent;
      this.startAtTop = 0;
      this.endAtTop = _.ms;
      this.startAtTopCache = this.endAtTopCache = undefined;
      this.easing = _.easing.easeNone;
      this.methods = [];
      this.parent.transforms.push(this);
      this._push = function(m,o,e) {
          var cache = {};
          Object.keys(o).forEach(function(key) {
              cache[key] = [];
          });
          this.methods.push({ method: m, values: o, cache: cache, easing: e || this.easing });
      }
  };

  Transformer.prototype = {
      also: function() {
          return new Transformer(this.parent);
      },
      start: function(s) {
          this.startAtTop = s;
          return this;
      },
      at: function(s) {
          return this.start.call(this, s);
      },
      end: function(e) {
          this.endAtTop = e;
          return this;
      },
      until: function(e) {
          return this.end.call(this, s);
      },
      select: function(el) {
          return _.select(el);
      },
      ease: function(fn) {
          this.easing = fn;
          return this;
      },
      translate: function(o,e) {
          this._push('translate',o,e);
          return this;
      },
      translateX: function(o,e) {
          this._push('translateX',o,e);
          return this;
      },
      translateY: function(o,e) {
          this._push('translateY',o,e);
          return this;
      },
      translateZ: function(o,e) {
          this._push('translateZ',o,e);
          return this;
      },
      rotate: function(o,e) {
          this._push('rotate',o,e);
          return this;
      },
      rotateX: function(o,e) {
          this._push('rotateX',o,e);
          return this;
      },
      rotateY: function(o,e) {
          this._push('rotateY',o,e);
          return this;
      },
      rotateZ: function(o,e) {
          this._push('rotateZ',o,e);
          return this;
      },
      scale: function(o,e) {
          this._push('scale',o,e);
          return this;
      },
      scaleX: function(o,e) {
          this._push('scaleX',o,e);
          return this;
      },
      scaleY: function(o,e) {
          this._push('scaleY',o,e);
          return this;
      },
      scaleZ: function(o,e) {
          this._push('scaleZ',o,e);
          return this;
      },
      skew: function(o,e) {
          this._push('skew',o,e);
          return this;
      },
      skewX: function(o,e) {
          this._push('skewX',o,e);
          return this;
      },
      skewY: function(o,e) {
          this._push('skewY',o,e);
          return this;
      },
      stick: function() {
          this._push('stick',{});
          return this;
      },
      hold: function() {
          return this.stick.apply(this);
      },
      opacity: function(o,e) {
          this._push('opacity',o,e);
          return this;
      },
      content: function(o,e) {
          this._push('content',o,e);
          return this;
      },
      format: function(fn) {
          this.frmt = fn;
          return this;
      },
      values: function(o,e) {
          this._push('values',o,e);
          return this;
      },
      step: function(fn) {
          this.step = fn;
          return this;
      }
  }

  var ElementCollection = function(elems,name) {
      this.name = name;
      this.elems = elems;
      this.matrix = (function() {
          if (_.support) {
              return Matrix3D.fromTransform(w.getComputedStyle(this.elems[0]).getPropertyValue(CSS_TRANSFORM));
          } else {
              return Matrix3D.create();
          }
      }).call(this);
      this.prevMatrix = this.matrix;
      this.transforms = [];
      this.opacity = 1;
      this.prevOpacity = 1;
      this.content = '';
      this.prevContent = '';
      this.value = 0;
      this.prevValue = 0;
      this.forceRender = false;
      this.u3d = true;
  };

  ElementCollection.prototype = {
      each: function(fn) {
          for (var i = 0; i < this.elems.length; i++) {
              fn.apply(this.elems[i], [i, this.elems.length]);
          }
          return this;
      },
      collected: function() {
          if (this.elems[0].hasAttribute('data-scran')) {
              return this.elems[0].getAttribute('data-scran');
          } else {
              return;
          }
      },
      use3d: function(boo) {
          this.u3d = boo;
          return this;
      },
      force: function(boo) {
          this.forceRender = boo;
          return this;
      },
      width: function(w) {
          var val;
          this.each(function() {
              if (typeof w === 'undefined') {
                  val = parseInt(this.style.width);
                  if (isNaN(val)) {
                      var rect = this.getBoundingClientRect();
                      val = rect.right - rect.left;
                  }
              } else {
                  this.style.width = w + 'px';
              }
          });
          return val || this;
      },
      height: function(h) {
          var val;
          this.each(function() {
              if (typeof h === 'undefined') {
                  val = parseInt(this.style.height);
                  if (isNaN(val)) {
                      var rect = this.getBoundingClientRect();
                      val = rect.bottom - rect.top;
                  }
              } else {
                  this.style.height = h + 'px';
              }
          });
          return val || this;
      },
      style: function(o) {
          Object.keys(o).forEach(function(style) {
              this.each(function() {
                  this.style[style] = o[style];
              });
          });
          return this;
      },
      attr: function(name, val) {
          if (val) {
              this.each(function() {
                  this.setAttribute(name, val);
              });
              return this;
          } else {
              var ret;
              this.each(function() {
                  ret = this.getAttribute(name);
              });
              return ret;
          }
      },
      offset: function() {
          return this.elems[0].getBoundingClientRect();
      },
      scroll: function(d,e,c) {
          var target = this.elems[0],
              rect = target.getBoundingClientRect();
          _.scroll(rect.top,d,e,c,this);
      },
      render: function() {
          var mtx = this.matrix;
          var _t = this;

          if (this.forceRender || !Matrix3D.isEqual(mtx, this.prevMatrix)) {
              var mtxMethod = _.support3d && _t.u3d ? 'toTransform3D' : 'toTransform';
              this.each(function() {
                  this.style[CSS_TRANSFORM] = Matrix3D[mtxMethod](mtx);
              });
          }
      },
      select: function(el) {
          return _.select(el);
      },
      calculate: (function() {
          var cache = {};

          return function(sT) {
              this.prevMatrix = this.matrix;
              Matrix3D.identity(this.matrix);
              // if (!_.updateRequired && cache[sT] !== void 0 && cache[sT].matrix !== void 0) {
              //     console.log(this.transforms.length);
              //     this.matrix = cache[sT].matrix;
              // } else {
                  for (var i = 0; i < this.transforms.length; i++) {
                      var tfm = this.transforms[i];
                      var eAT = typeof tfm.endAtTop === 'function' ?
                                      (typeof tfm.endAtTopCache === 'undefined' || _.updateRequired ?
                                          (tfm.endAtTopCache = tfm.endAtTop.apply(this, [this.elems.length])) :
                                          tfm.endAtTopCache) :
                                      tfm.endAtTop,
                          sAT = typeof tfm.startAtTop === 'function' ?
                                      (typeof tfm.startAtTopCache === 'undefined' || _.updateRequired ?
                                          (tfm.startAtTopCache = tfm.startAtTop.apply(this, [this.elems.length])) :
                                          tfm.startAtTopCache) :
                                      tfm.startAtTop,

                          eAT = typeof eAT === 'string' && eAT.indexOf('%') !== -1 ?
                                      (_.ms / 100) * parseFloat(eAT) :
                                      eAT,

                          sAT = typeof sAT === 'string' && sAT.indexOf('%') !== -1 ?
                                      (_.ms / 100) * parseFloat(sAT) :
                                      sAT;

                      var aL = eAT - sAT,
                          cP = sT - sAT;

                      for (var j = 0; j < tfm.methods.length; j++) {
                          var method = tfm.methods[j],
                              mname = method.method,
                              mvals = method.values,
                              mcache = method.cache,
                              easing = method.easing,
                              vals = [],
                              dV;

                          if (mname === 'hold' || mname === 'stick') {
                              mname = 'translateY';
                              dV = (sT <= sAT) ? 0 : sAT - sT;
                              vals.push(dV);
                          } else {
                              Object.keys(mvals).forEach(function(o) {
                                  var sV = typeof mvals[o][0] === 'function' ?
                                                  (typeof mcache[o][0] === 'undefined' || _.updateRequired ?
                                                      (mcache[o][0] = mvals[o][0].apply(this)) :
                                                      mcache[o][0]) :
                                                  mvals[o][0],
                                      eV = typeof mvals[o][1] === 'function' ?
                                                  (typeof mcache[o][1] === 'undefined' || _.updateRequired ?
                                                      (mcache[o][1] = mvals[o][1].apply(this)) :
                                                      mcache[o][1]) :
                                                  mvals[o][1],
                                      fn = mname === 'translateY' || mname === 'translate' ?
                                                  _.wh :
                                                  _.ww;

                                  sV = typeof sV === 'string' && sV.indexOf('%') !== -1 ?
                                              (fn() / 100) * parseFloat(sV) : sV;
                                  eV = typeof eV === 'string' && eV.indexOf('%') !== -1 ?
                                              (fn() / 100) * parseFloat(eV) : eV;

                                  dV = easing.call(_.easing, cP, sV, eV - sV, aL);
                                  var drV = sV > eV ? '>' : '<';

                                  dV = (dV < sV && drV !== '>') ?
                                          sV : (dV > sV && drV === '>') ?
                                              sV : (dV < eV && drV === '>') ?
                                                  eV : (dV > eV && drV === '<') ?
                                                      eV : dV;
                                  dV = (sT <= sAT) ?
                                          sV : (sT >= eAT) ?
                                              eV : dV;

                                  vals.push(dV);
                              });
                          }

                          if (mname === 'opacity') {
                              this.prevOpacity = this.opacity;
                              this.opacity = Math.round(vals[0] * 100) / 100;
                              if (this.opacity !== this.prevOpacity) {
                                  var op = this.opacity;
                                  this.each(function() {
                                      this.style.opacity = op;
                                  });
                              }
                          } else if (mname === 'content') {
                              this.prevContent = this.content;
                              this.content = tfm.hasOwnProperty('frmt') ? tfm.frmt(vals[0]) : vals[0];
                              var content = this.content;
                              if (this.content !== this.prevContent || this.forceRender) {
                                  this.each(function() {
                                      if (this.innerHTML === content) return;
                                      this.innerHTML = content;
                                  });
                              }
                          } else if (mname === 'values') {
                              this.prevValue = this.value;
                              this.value = vals[0];
                              if (tfm.hasOwnProperty('step') && this.value !== this.prevValue || tfm.hasOwnProperty('step') && this.forceRender) {
                                  this.each(function() {
                                      tfm.step.call(this, vals[0]);
                                  });
                              }
                          } else {
                              var mtx = Matrix3D.create();
                              Matrix3D[mname].apply(undefined, [mtx].concat(vals));

                              if (Matrix3D.isEqual(this.matrix, Matrix3D.create())) {
                                  this.matrix = mtx;
                              } else {
                                  Matrix3D.multiply(this.matrix, mtx, this.matrix);
                              }
                          }
                      }
                  }
              //}
              this.render();
          }
      })(),
      matrix3d: function(mtx) {
          if (typeof mtx !== 'undefined') {
              this.prevMatrix = this.matrix;
              this.matrix = mtx;
              this.render();
              return;
          }
          return this.matrix;
      },
      transform: function() {
          (function() {
              var _t = this;
              _t.each(function() {
                  this.setAttribute('data-scran', _t.name);
              });
          }).call(this);
          return new Transformer(this);
      }
  };

  var Matrix3D = {};

  Matrix3D._deg2rad = function(deg) {
      return deg * (Math.PI / 180);
  };

  Matrix3D.create = function() {
      var out, args = [];
      for (var i = 0, len = arguments.length; i < len; i++) {
          args.push(arguments[i]);
      }
      if (args.length > 0 && args.length < 16) throw 'Invalid arguments supplied!';
      if (args.length === 0) {
          out = new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
      } else {
          out = new Float32Array(args);
      }
      return out;
  };

  Matrix3D.fromTransform = function(str) {
      if (str === null) return Matrix3D.create()
      var r = str.match(/([\d.-]+(?!\w))+/g);
      if (r) {
          return new Float32Array([
              r[0],   r[1],   r[2],   r[3],
              r[4],   r[5],   r[6],   r[7],
              r[8],   r[9],   r[10],  r[11],
              r[12],  r[13],  r[14],  r[15]
          ]);
      } else {
          return Matrix3D.create();
      }
  };

  Matrix3D.identity = function(out) {
      out[0] = out[5] = out[10] = out[15] = 1;
      out[1] = out[2] = out[3] = out[4] = out[6] = out[7] = out[8] = out[9] = out[11] = out[12] = out[13] = out[14] = 0;
  };

  Matrix3D.multiply = function(mx1, mx2, out) {
      var a1 = mx1[0], b1 = mx1[1], c1 = mx1[2], d1 = mx1[3],
          e1 = mx1[4], f1 = mx1[5], g1 = mx1[6], h1 = mx1[7],
          i1 = mx1[8], j1 = mx1[9], k1 = mx1[10], l1 = mx1[11],
          m1 = mx1[12], n1 = mx1[13], o1 = mx1[14], p1 = mx1[15];

      var a2 = mx2[0], b2 = mx2[1], c2 = mx2[2], d2 = mx2[3],
          e2 = mx2[4], f2 = mx2[5], g2 = mx2[6], h2 = mx2[7],
          i2 = mx2[8], j2 = mx2[9], k2 = mx2[10], l2 = mx2[11],
          m2 = mx2[12], n2 = mx2[13], o2 = mx2[14], p2 = mx2[15];

      out[0] = a1 * a2 + b1 * e2 + c1 * i2 + d1 * m2;
      out[1] = a1 * b2 + b1 * f2 + c1 * j2 + d1 * n2;
      out[2] = a1 * c2 + b1 * g2 + c1 * k2 + d1 * o2;
      out[3] = 0;
      out[4] = e1 * a2 + f1 * e2 + g1 * i2 + h1 * m2;
      out[5] = e1 * b2 + f1 * f2 + g1 * f2 + h1 * n2;
      out[6] = e1 * c2 + f1 * g2 + g1 * k2 + h1 * o2;
      out[7] = 0;
      out[8] = i1 * a2 + j1 * e2 + k1 * i2 + l1 * m2;
      out[9] = i1 * b2 + j1 * f2 + k1 * f2 + l1 * n2;
      out[10] = i1 * c2 + j1 * g2 + k1 * k2 + l1 * o2;
      out[11] = 0;
      out[12] = m1 * a2 + n1 * e2 + o1 * i2 + p1 * m2;
      out[13] = m1 * b2 + n1 * f2 + o1 * f2 + p1 * n2;
      out[14] = m1 * c2 + n1 * g2 + o1 * k2 + p1 * o2;
      out[15] = 1;
  };

  Matrix3D.isEqual = function(mx1, mx2) {
      var a1 = mx1[0], b1 = mx1[1], c1 = mx1[2], d1 = mx1[3],
          e1 = mx1[4], f1 = mx1[5], g1 = mx1[6], h1 = mx1[7],
          i1 = mx1[8], j1 = mx1[9], k1 = mx1[10], l1 = mx1[11],
          m1 = mx1[12], n1 = mx1[13], o1 = mx1[14], p1 = mx1[15];

      var a2 = mx2[0], b2 = mx2[1], c2 = mx2[2], d2 = mx2[3],
          e2 = mx2[4], f2 = mx2[5], g2 = mx2[6], h2 = mx2[7],
          i2 = mx2[8], j2 = mx2[9], k2 = mx2[10], l2 = mx2[11],
          m2 = mx2[12], n2 = mx2[13], o2 = mx2[14], p2 = mx2[15];

      if (a1 === a2 && b1 === b2 && c1 === c2 && d1 === d2 &&
          e1 === e2 && f1 === f2 && g1 === g2 && h1 === h2 &&
          i1 === i2 && j1 === j2 && k1 === k2 && l1 === l2 &&
          m1 === m2 && n1 === n2 && o1 === o2 && p1 === p2) {
          return true;
      } else {
          return false;
      }
  };

  Matrix3D.translate = function(out, tx, ty, tz) {
      out[12] = tx;
      out[13] = ty || out[13];
      out[14] = tz || out[14];
  };

  Matrix3D.translateX = function(out, tx) {
      out[12] = tx;
  };

  Matrix3D.translateY = function(out, ty) {
      out[13] = ty;
  };

  Matrix3D.translateZ = function(out, tz) {
      out[14] = tz;
  };

  Matrix3D.scale = function(out, sx, sy, sz) {
      out[0] = sx;
      out[5] = sy || out[5];
      out[10] = sz || out[10];
  };

  Matrix3D.scaleX = function(out, sx) {
      out[0] = sx;
  };

  Matrix3D.scaleY = function(out, sy) {
      out[5] = sy;
  };

  Matrix3D.scaleZ = function(out, sz) {
      out[10] = sz;
  };

  Matrix3D.rotate = function(out, deg) {
      var rad = Matrix3D._deg2rad(deg),
          cos = Math.cos(rad),
          sin = Math.sin(rad);

      out[0] = cos;
      out[1] = sin;
      out[4] = -sin;
      out[5] = cos;
  };

  Matrix3D.rotateX = function(out, deg) {
      var rad = Matrix3D._deg2rad(deg),
          cos = Math.cos(rad),
          sin = Math.sin(rad);

      out[5] = cos;
      out[6] = sin;
      out[9] = -sin;
      out[10] = cos;
  };

  Matrix3D.rotateY = function(out, deg) {
      var rad = Matrix3D._deg2rad(deg),
          cos = Math.cos(rad),
          sin = Math.sin(rad);

      out[0] = cos;
      out[2] = sin;
      out[8] = -sin;
      out[10] = cos;
  };

  Matrix3D.rotateZ = function(out, deg) {
      Matrix3D.rotate(out, deg);
  };

  Matrix3D.skew = function(out, xdeg, ydeg) {
      var xrad = Matrix3D._deg2rad(xdeg),
          yrad = ydeg ? Matrix3D._deg2rad(ydeg) : 0,
          xtan = Math.tan(xrad),
          ytan = Math.tan(yrad);

      out[4] = xtan;
      out[1] = ytan;
  };

  Matrix3D.skewX = function(out, xdeg) {
      var rad = Matrix3D._deg2rad(xdeg),
          tan = Math.tan(rad);

      out[4] = tan;
  };

  Matrix3D.skewY = function(out, ydeg) {
      var rad = Matrix3D._deg2rad(ydeg),
          tan = Math.tan(rad);

      out[1] = tan;
  };

  Matrix3D.toTransform = function(mx) {
      return 'matrix(' +  mx[0] + ',' + mx[1] + ',' +
                          mx[4] + ',' + mx[5] + ',' +
                          mx[12] + ',' + mx[13] + ')';
  };

  Matrix3D.toTransform3D = function(mx) {
      return 'matrix3d(' +    mx[0] + ',' + mx[1] + ',' + mx[2] + ',' + mx[3] + ',' +
                              mx[4] + ',' + mx[5] + ',' + mx[6] + ',' + mx[7] + ',' +
                              mx[8] + ',' + mx[9] + ',' + mx[10] + ',' + mx[11] + ',' +
                              mx[12] + ',' + mx[13] + ',' + mx[14] + ',' + mx[15] + ')';
  };

  var TweenController = function() {
      this.q = [];
      return this;
  }

  TweenController.prototype = {
      queue : function() {
          var nt = new Tween(this);
          var pt = this.q[this.q.length - 1];
          if (!pt || pt && pt.completed) {
              nt.canStart = true;
          } else {
              nt.canStart = false;
              pt.then(function() {
                  nt.canStart = true;
                  nt.start();
              });
          }
          this.q.push(nt);
          return nt;
      }
  }

  var Tween = function(ctlr) {
      this.name = (function() {
          return '$scr-tween-' + (Math.random() * new Date().getTime()).toFixed(0);
      })();
      this.begin = 0;
      this.end = 0;
      this.differences = {};
      this.canStart = true;
      this.started = false;
      this.completed = false;
      this.tweenDuration = 400;
      this.delayTime = 0;
      this.delayed = false;
      this.easing = _.easing.easeNone;
      this.stp = _.noop;
      this.cmplt = _.noop;
      this.thn = _.noop;
      this.stppd = _.noop;
      this.controller = ctlr;
  };

  Tween.prototype = {
      from : function(val) {
          this.begin = val;
          return this;
      },
      to : function(val) {
          this.end = val;
          return this;
      },
      duration : function(val) {
          this.tweenDuration = val;
          return this;
      },
      delay : function(val) {
          this.delayTime = val;
          return this;
      },
      ease : function(fn) {
          this.easing = fn;
          return this;
      },
      step : function(fn) {
          this.stp = fn;
          return this;
      },
      complete : function(fn) {
          this.cmplt = fn;
          return this;
      },
      stopped : function(fn) {
          this.stppd = fn;
          return this;
      },
      then : function(fn) {
          this.thn = fn;
          return this;
      },
      start : function() {
          if (!this.canStart) {
              return this;
          }
          if (this.delayTime > 0 && !this.delayed) {
              var _t = this;
              setTimeout(function() {
                  _t.start();
              }, this.delayTime);
              this.delayed = true;
              return this;
          }
          var stepDuration = 1000 / 60,
              steps = this.tweenDuration / stepDuration,
              diff = this.end - this.begin;

          if (typeof this.end === 'object') {
              if (typeof this.begin !== 'object') {
                  this.begin = {};
              }
              Object.keys(this.end).forEach(function(val) {
                  if (!this.begin.hasOwnProperty(val)) {
                      this.begin[val] = 0;
                  }
                  this.differences[val] = this.end[val] - this.begin[val];
              });
          } else {
              this.differences.sctmain = this.end - this.begin;
          }

          var _t = this;

          _t.started = true;

          _t.stpFn = function() {
              if (steps >= 0 && _t.started) {
                  var s = _t.tweenDuration;
                  s = s - (steps * stepDuration);
                  steps--;
                  var vals = _t.differences.hasOwnProperty('sctmain') ? _t.easing(s, _t.begin, _t.differences.sctmain, _t.tweenDuration) : {};
                  if (typeof vals === 'object') {
                      Object.keys(_t.differences).forEach(function(v) {
                          vals[v] = _t.easing(s, _t.begin[v], _t.differences[v], _t.tweenDuration);
                      });
                  }
                  _t.stp.call(_t, vals);
              } else if (!_t.started) {
                  pipeline.remove(_t.name);
                  _t.stppd.call(_t);
              } else {
                  pipeline.remove(_t.name);
                  _t.started = false;
                  _t.completed = true;
                  _t.cmplt.call(_t, _t.end);
                  _t.thn.call(_t);
                  _t.controller.q.shift();
              }
          };
          pipeline.add(this.name, _t.stpFn);
          return this;
      },
      stop : function() {
          this.started = false;
          return this;
      },
      queue : function() {
          return this.controller.queue();
      }
  }

  var Pipeline = function() {
      this.pipeline = {};
      this.raf;
  }

  Pipeline.prototype = {
      add : function(name, fn, check) {
          this.pipeline[name] = { fn: fn, check: check };
      },
      remove : function(name) {
          delete this.pipeline[name];
      },
      tick : function tick() {
          var t = this;
          return function() {
              t.raf = _.requestAnimFrame.call(w, t.tick.apply(t));
              Object.keys(t.pipeline).forEach(function(n) {
                  if (typeof t.pipeline[n].check !== 'undefined') {
                      if (t.pipeline[n].check()) {
                          t.pipeline[n].fn();
                      }
                  } else {
                      t.pipeline[n].fn();
                  }
              });
          }

      },
      start : function() {
          if (this.raf) return;
          this.tick.apply(this)();
      },
      pause : function() {
          _.cancelAnimFrame.call(w, this.raf);
          this.raf = null;
      }
  }

  var pipeline = new Pipeline();
  pipeline.add('render', _.render, function() {
      return _.cst !== _.st();
  });
  pipeline.start();

  function handleFocus() {
    _.detach(w, 'scroll', handleFocus);
    pipeline.start();
  }

  _.listen(w, 'focus', handleFocus);
  _.listen(w, 'blur', function() {
      _.listen(w, 'scroll', handleFocus);
      pipeline.pause();
  });

  _.listen(w, 'resize', function() {
      _.msƒ();
      _.updateRequired = true;
  });

  if (w.addEventListener) {
      d.addEventListener('DOMContentLoaded', _.msƒ, false);
  } else if (w.attachEvent) {
      w.attachEvent('onload', _.msƒ);
  }

  var $s = function(el) {
      return _.select(el);
  };

  $s.tween = _.tween;
  $s.matrix = _.matrix;
  $s.CSS_TRANSFORM = CSS_TRANSFORM;

  $s.clear = _.clear;
  $s.easing = _.easing;
  $s.scrollTo = _.scroll;
  $s.scrollTop = _.st;
  $s.scrollLeft = _.sl;
  $s.windowHeight = _.wh;
  $s.windowWidth = _.ww;
  $s.documentHeight = _.dh;
  $s.forceDocumentHeightReset = _.msƒ;
  $s.maxScroll = _.msƒ;
  $s.transformSupport = _.support;
  $s.render = _.render;
  $s.pipeline = pipeline;
  $s.defineCustomScrollTopFunction = _.customST;

  w.$s = $s;
})();
