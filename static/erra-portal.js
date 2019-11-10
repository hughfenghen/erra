// 通过snippet网html中注入该js，可以将Erra嵌入到某个网页中，方便使用Erra功能
; (() => {
  // 创建erra元素
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
  // 创建动画style，断点消息时生效
  const keyFramesStyle = document.createElement('style');
  keyFramesStyle.type = 'text/css';
  keyFramesStyle.innerHTML = `
    @keyframes erra-bpmsg {
      0% { 
        background-color: #fff;
      }
      50% {
        background-color: rgb(179, 127, 235);
      }
      100% { 
        background-color: #fff;
      }
    }
  `
  
  // 创建iframe，向页面注入erra页面
  let showIFrame = false
  const iframeEl = document.createElement('iframe')

  // js资源对应的顶级pat即 erra界面
  iframeEl.src = new URL(document.querySelector('script[src$="/erra-portal.js"]').getAttribute('src')).origin + '/erra'
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

  // 有断点消息时添加动画
  const msgRegex = /^\[\[erra-msg:(.+)\]\]/
  window.addEventListener('message', (evt) => {
    if (!msgRegex.test(evt.data)) return
    const msgType = msgRegex.exec(evt.data)[1]
    const msgBody = evt.data.replace(msgRegex, '')
    if (msgType === 'onMsgCountChange') {
      entryEl.style.animation = msgBody === '0' ? '' : 'erra-bpmsg 2s infinite'
    }
  })

  document.getElementsByTagName('head')[0].appendChild(keyFramesStyle);
  document.body.appendChild(entryEl)
  document.body.appendChild(iframeEl)
})()