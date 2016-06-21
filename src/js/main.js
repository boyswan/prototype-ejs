const $ = el => document.getElementById(el)
const getPath = name => `assets/json/${name}.json`


function setupScroll(anim) {

  const totalFrames = (anim.totalFrames * anim.frameRate) / 1.5;

  $s('#container')
    .force(true)
    .transform()
      .values({ values: [0, totalFrames] })
      .step(function(value) {
        anim.goToAndStop(Math.round(value))
      });

  $s('.aside')
    .force(true)
    .use3d(true)
    .transform()
      .end('25%')
      .translate({ tx: [0, 100], ty: [0, 4000] })
      .rotateY({ ydeg: [0, 270] })
    .also()
      .start('26%')
      .end('50%')
      .translateY({ ty: [0, -4000] })
}

const anim = bodymovin.loadAnimation({
  container: $('container'),
  renderer: 'svg',
  loop: true,
  autoplay: false,
  path: getPath('andy'),
  currentFrame: 0
});

anim.addEventListener("data_ready", () => {
  setupScroll(anim);
  document.querySelector('.aside').addEventListener('click', () => $s.scrollTo(1000))
  // attachScroll(anim, $('container'), 50);
})
