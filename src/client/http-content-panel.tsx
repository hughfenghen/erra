import { Button } from 'antd';
import yaml from 'js-yaml';
import { noop } from 'lodash/fp';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Editor from './editor';

export default function HttpContentPanel({
  content,
  debug = false,
  onDone = noop
}) {
  const [value, setValue] = useState(null)

  return <section>
    {debug && <div><Button onClick={() => {
      onDone(yaml.safeLoad(value));
    }}>完成</Button></div>}
    <Editor
      value={content ? yaml.safeDump(content) : ''}
      onChange={(val) => { setValue(val) }}
      language="yaml"
      readOnly={!debug}
    ></Editor>
  </section>
}
