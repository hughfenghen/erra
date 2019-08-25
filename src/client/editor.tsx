import { isEmpty, noop } from 'lodash/fp';
import { editor } from 'monaco-editor';
import React, { useEffect, useRef } from 'react';

export default function Editor({
  value = {},
  width = '100%',
  height = '100vh',
  onChange = noop,
  language,
  readOnly = false,
}) {
  const editorRef = useRef(null)
  const eInstanceRef = useRef(null)

  useEffect(() => {
    eInstanceRef.current = editor.create(editorRef.current, {
      language,
      readOnly,
    })

    eInstanceRef.current.getModel().updateOptions({
      tabSize: 2,
    })

    const { dispose } = eInstanceRef.current.onDidChangeModelContent(() => {
      onChange(eInstanceRef.current.getValue())
    })
    return () => { dispose() }
  }, [])

  useEffect(() => {
    eInstanceRef.current.updateOptions({ readOnly })
  }, [readOnly])

  useEffect(() => {
    if (isEmpty(value) || !eInstanceRef.current) return

    eInstanceRef.current.setValue(value)
  }, [value])

  return <div ref={editorRef} style={{ width, height }}></div>
}