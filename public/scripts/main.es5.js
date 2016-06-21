'use strict';

var $ = function $(el) {
  return document.getElementById(el);
};
var getPath = function getPath(name) {
  return 'assets/json/' + name + '.json';
};

function setupScroll(anim) {

  var totalFrames = anim.totalFrames * anim.frameRate / 1.5;

  $s('#container').force(true).transform().values({ values: [0, totalFrames] }).step(function (value) {
    anim.goToAndStop(Math.round(value));
  });

  $s('.aside').force(true).use3d(true).transform().end('25%').translate({ tx: [0, 100], ty: [0, 4000] }).rotateY({ ydeg: [0, 270] }).also().start('26%').end('50%').translateY({ ty: [0, -4000] });
}

var anim = bodymovin.loadAnimation({
  container: $('container'),
  renderer: 'svg',
  loop: true,
  autoplay: false,
  path: getPath('andy'),
  currentFrame: 0
});

anim.addEventListener("data_ready", function () {
  setupScroll(anim);
  document.querySelector('.aside').addEventListener('click', function () {
    return $s.scrollTo(1000);
  });
  // attachScroll(anim, $('container'), 50);
});
