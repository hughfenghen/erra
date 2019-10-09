import 'antd/dist/antd.css';

import { Tabs, Button } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom';
import ApiRecords from './api-record';
import { SOCKET_MSG_TAG_API } from '../lib/interface';
import Snippets from './snippet-list';
import BreakpointQueue from './breakpoint-queue';
import s from './style.less';
import sc from './common/socket-client';

// import '../../static/erra-portal.js'

function App() {
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
      <Tabs.TabPane tab="BP Queue" key="bp-queue">
        <BreakpointQueue></BreakpointQueue>
      </Tabs.TabPane>
    </Tabs>
  </div>
}

ReactDOM.render(<App />, document.getElementById('app'))