import 'antd/dist/antd.css';

import { Tabs, Button } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom';
import ApiRecords from './api-record';
import { SOCKET_MSG_TAG_API } from '../lib/interface';
import Snippets from './snippet-list';
import s from './style.less';
import sc from './common/socket-client';


function App() {
  return <div className={s.app}>
    <Button onClick={() => {
      fetch('http://www.mocky.io/v2/5185415ba171ea3a00704eed')
    }}>Send mocky request</Button>
    <Button onClick={() => { sc.emit(SOCKET_MSG_TAG_API.API_CLEAR_RECORD)}}>Clear Record</Button>
    <Tabs defaultActiveKey="network">
      <Tabs.TabPane tab="Network" key="network">
        <ApiRecords></ApiRecords>
      </Tabs.TabPane>
      <Tabs.TabPane tab="Snippet" key="snippet">
        <Snippets></Snippets>
      </Tabs.TabPane>
    </Tabs>
  </div>
}

ReactDOM.render(<App />, document.getElementById('app'))