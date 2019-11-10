import 'antd/dist/antd.css';

import { Tabs, Button, Badge } from 'antd';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ApiRecords from './api-record';
import Snippets from './snippet-list';
import BreakpointQueue from './breakpoint-queue';
import s from './style.less';

function App() {
  const [bpMsgCount, setBPMsgCount] = useState(0)

  return <div className={s.app}>
    {/debug/.test(window.location.search) && <Button onClick={() => {
      fetch('https://www.mocky.io/v2/5185415ba171ea3a00704eed')
    }}>Send mocky request</Button>}
    <Tabs defaultActiveKey="network">
      <Tabs.TabPane tab="Network" key="network">
        <ApiRecords></ApiRecords>
      </Tabs.TabPane>
      <Tabs.TabPane tab="Snippet" key="snippet">
        <Snippets></Snippets>
      </Tabs.TabPane>
      <Tabs.TabPane forceRender tab={<>
        BP Queue {!!bpMsgCount && <Badge count={bpMsgCount} />}
      </>} key="bp-queue">
        <BreakpointQueue onMsgCountChange={setBPMsgCount}></BreakpointQueue>
      </Tabs.TabPane>
    </Tabs>
  </div>
}

ReactDOM.render(<App />, document.getElementById('app'))