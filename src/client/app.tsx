import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom'
import { socketListen, emit } from './socket-client';

function App () {
  const [code, setCode] = useState('')
  const [url, setUrl] = useState('')
  useEffect(() => {
    socketListen('api-response', (url, body) => {
      console.log('------ app', url, body);
      setCode(JSON.stringify(body))
      setUrl(url)
    })
  }, [])
  return <div>
    <textarea value={code} name="code" cols={30} rows={10} onChange={(evt) => {
      console.log('======= ta chnage', evt.target.value);
      setCode(evt.target.value)
    }}></textarea>
    <button onClick={() => {
      console.log('-------- submit', code);
      emit('breakpoint-tamper-reponse', { url, code })
    }}>submit</button>
  </div>
}

ReactDOM.render(<App />, document.getElementById('app'))