import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import ApiRecords from './api-records';
import HttpContentPanel from './http-content-panel';

function App () {

  return <div>
    <ApiRecords></ApiRecords>
    <HttpContentPanel></HttpContentPanel>
  </div>
}

ReactDOM.render(<App />, document.getElementById('app'))