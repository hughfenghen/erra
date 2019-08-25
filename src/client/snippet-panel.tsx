import { Button } from 'antd';
import yaml from 'js-yaml';
import { noop } from 'lodash/fp';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Editor from './editor';

export default function SnippetPanel({
  snippet,
  onSave = noop,
}) {
  const [value, setValue] = useState(null)

  return <section>
    {!snippet.id && <Button onClick={() => {
      onSave(value);
    }}>保存</Button>}
    <Editor
      value={snippet ? yaml.safeDump(snippet) : ''}
      onChange={(val) => { setValue(val) }}
      language="yaml"
    ></Editor>
  </section>
}
