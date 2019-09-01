import { Button } from 'antd';
import yaml from 'js-yaml';
import { noop } from 'lodash/fp';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Editor from '../common/editor';

export default function SnippetPanel({
  snippet,
  onSave = noop,
}) {
  const [value, setValue] = useState('')
  useEffect(() => {
    setValue(snippet ? yaml.safeDump(snippet) : '')
  }, [snippet])

  return <section>
    {!snippet.id && <Button onClick={() => {
      onSave(value);
    }}>保存</Button>}
    <Editor
      value={value}
      onChange={(val) => { setValue(val) }}
      language="yaml"
    ></Editor>
  </section>
}
