import { Button } from 'antd';
import yaml from 'js-yaml';
import { noop } from 'lodash/fp';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Editor from '../common/editor';
import { SimpleReq, SimpleResp } from '../../lib/interface';

export default function HttpContentPanel({
  content,
  debug = false,
  onDone = noop
} : {
  content: SimpleReq | SimpleResp,
  debug: boolean,
  onDone: Function,
}) {
  const [value, setValue] = useState('')
  useEffect(() => {
    if (!content) {
      setValue('')
      return
    }

    if (
      /application\/json/.test(content.headers['content-type'])
      && content.body
    ) {
      setValue(yaml.safeDump({ ...content, body: JSON.parse(content.body) }))
      return
    }
    setValue(yaml.safeDump(content))
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
