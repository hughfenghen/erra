import 'antd/dist/antd.css';
import s from './style.less';

import { Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ApiRecords from './api-records';


function App() {
  return <div className={s.app}>
    <Tabs defaultActiveKey="snippet">
      <Tabs.TabPane tab="Network" key="network">
        <ApiRecords></ApiRecords>
      </Tabs.TabPane>
      <Tabs.TabPane tab="Snippet" key="snippet">
        <ApiRecords></ApiRecords>
      </Tabs.TabPane>
    </Tabs>
  </div>
}

ReactDOM.render(<App />, document.getElementById('app'))