import { Button } from 'antd';
import yaml from 'js-yaml';
import { noop } from 'lodash/fp';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Editor from '../common/editor';

export default function HttpContentPanel({
  content,
  debug = false,
  onDone = noop
}) {
  const [value, setValue] = useState('')
  useEffect(() => {
    setValue(content ? yaml.safeDump(content) : '')
  }, [content])

  return <section>
    {debug && <div><Button onClick={() => {
      onDone(yaml.safeLoad(value));
    }}>完成</Button></div>}
    <Editor
      value={value}
      onChange={(val) => { setValue(val) }}
      language="yaml"
      readOnly={!debug}
    ></Editor>
  </section>
}
