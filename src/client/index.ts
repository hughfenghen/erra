import './socket-client'
import './app';

const host = 'http://localhost:3344'

;(function() {
  document.getElementById('action')
    .addEventListener('click', () => {
      fetch(`${host}/v2/5185415ba171ea3a00704eed`)
    })
  
  document.getElementById('en-bp')
    .addEventListener('click', () => {
      fetch(`${host}/erra/enable-breakpoint?url=/v2/5185415ba171ea3a00704eed&type=request`)
    })
  document.getElementById('dis-bp')
    .addEventListener('click', () => {
      fetch(`${host}/erra/disable-breakpoint?url=/v2/5185415ba171ea3a00704eed&type=request`)
    })
})();

