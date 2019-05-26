const host = 'http://localhost:3344'

;(function() {
  document.getElementById('action')
    .addEventListener('click', () => {
      fetch(`${host}/mock/2059/dedup/api/bma/task/detail/taskDetail`)
    })
  
  document.getElementById('en-bp')
    .addEventListener('click', () => {
      fetch(`${host}/erra/enable-breakpoint`)
    })
  document.getElementById('dis-bp')
    .addEventListener('click', () => {
      fetch(`${host}/erra/disable-breakpoint`)
    })
})();