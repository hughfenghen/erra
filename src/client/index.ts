import './app';

const host = 'http://www.mocky.io'

;(function() {
  document.getElementById('action')
    .addEventListener('click', () => {
      fetch(`${host}/v2/5185415ba171ea3a00704eed`)
    })
})();

