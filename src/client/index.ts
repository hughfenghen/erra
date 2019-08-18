import './app';

const host = 'http://localhost:3344'

;(function() {
  document.getElementById('action')
    .addEventListener('click', () => {
      fetch(`${host}/v2/5185415ba171ea3a00704eed`)
    })
})();

