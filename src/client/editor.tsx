import yaml from 'js-yaml';
import { isEmpty } from 'lodash/fp';
import { editor } from 'monaco-editor';
import React, { useEffect, useRef } from 'react';

export default function Editor({
  value = {},
  width = '100%',
  height = '100vh',
}) {
  const editorRef = useRef(null)
  const eInstance = useRef(null)

  useEffect(() => {
    if (isEmpty(value) || !eInstance.current) return

    eInstance.current.setValue(yaml.safeDump(value))
  }, [value])

  useEffect(() => {
    eInstance.current = editor.create(editorRef.current, {
      language: "yaml",
    })
    // eInstance.current.updateOptions({ readOnly: true })
  }, [])

  return <div ref={editorRef} style={{ width, height }}></div>
}