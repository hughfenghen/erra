import 'antd/dist/antd.css';
import s from './style.less';
import sc from './socket-client';

import { Tabs, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ApiRecords from './api-records';
import { SOCKET_MSG_TAG_API } from '../lib/interface';


function App() {
  return <div className={s.app}>
    <Button onClick={() => { sc.emit(SOCKET_MSG_TAG_API.CLEAR_RECORD)}}>Clear Record</Button>
    <Tabs defaultActiveKey="network">
      <Tabs.TabPane tab="Network" key="network">
        <ApiRecords></ApiRecords>
      </Tabs.TabPane>
      <Tabs.TabPane tab="Snippet" key="snippet">
        1111
      </Tabs.TabPane>
    </Tabs>
  </div>
}

ReactDOM.render(<App />, document.getElementById('app'))