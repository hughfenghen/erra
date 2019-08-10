import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import ApiRecords from './api-records';

function App () {

  return <div>

    <ApiRecords></ApiRecords>
  </div>
}

ReactDOM.render(<App />, document.getElementById('app'))