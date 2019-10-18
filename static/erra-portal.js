// 通过snippet网html中注入该js，可以将Erra嵌入到某个网页中，方便使用Erra功能
;(() => {
  const entryEl = document.createElement('div');
  entryEl.innerHTML = 'E'
  Object.assign(entryEl.style, {
    position: 'fixed',
    zIndex: 100,
    right: '30px',
    bottom: '30px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    boxShadow: '0 0 4px 2px #ddd',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    cursor: 'pointer',
    userSelect: 'none',
  })

  let showIFrame = false
  const iframeEl = document.createElement('iframe')

  // js资源对应的顶级pat即 erra界面
  iframeEl.src = new URL(document.querySelector('script[src$="/erra-portal.js"]').getAttribute('src')).origin
  Object.assign(iframeEl.style, {
    position: 'fixed',
    zIndex: 100,
    right: '30px',
    bottom: '90px',
    width: '700px',
    height: '600px',
    boxShadow: '0 0 4px 2px #ddd',
    backgroundColor: '#fff',
    border: 'none',
    display: 'none',
  })

  entryEl.addEventListener('click', () => {
    showIFrame = !showIFrame
    iframeEl.style.display = showIFrame ? 'block' : 'none'
    entryEl.innerHTML = showIFrame ? 'X' : 'E'
  })

  document.body.appendChild(entryEl)
  document.body.appendChild(iframeEl)
})()