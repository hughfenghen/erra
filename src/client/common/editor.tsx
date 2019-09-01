import ace from 'brace';
import 'brace/ext/language_tools';
import 'brace/mode/yaml';
import 'brace/snippets/yaml';
import 'brace/theme/github';

import { noop } from 'lodash/fp';
import React, { useEffect, useRef } from 'react';
import AceEditor from 'react-ace';
import { useSnippets } from './custom-hooks';

let langTools = ace.acequire('ace/ext/language_tools');
const { snippetManager } = ace.acequire('ace/snippets');

const customSnippetText = [
  'snippet $snippet',
  '\t\\$snippet ${1:fieldName}: ${2:snippetId}',
  'snippet $mockjs',
  '\t\\$mockjs ${1:fieldName}: ${2:mockVal}'
].join('\n')

const customSnippet = snippetManager.parseSnippetFile(customSnippetText);

snippetManager.register(customSnippet, 'yaml');

export default function Editor({
  value = '',
  width = '100%',
  height = '100vh',
  onChange = noop,
  language,
  readOnly = false,
}) {
  const snippets = useSnippets()
  const snippetListRef = useRef(null)

  useEffect(() => {
    snippetListRef.current = snippets.map(s => ({
      caption: s.name,
      snippet: `${s.name}|${s.id}`,
      meta: 'custom snippet',
      score: 100,
    }))
  }, [snippets])

  useEffect(() => {
    langTools.addCompleter({
      getCompletions(editor, session, pos, prefix, cb) {
        const lineStr = session.getLine(pos.row);
        // 以$snippet开头 且光标在冒号后面
        if (
          /^\s*\$snippet\s+/.test(lineStr)
          && lineStr.includes(':')
          && lineStr.indexOf(':') < pos.column
        ) {
          cb(null, snippetListRef.current || [])
          return
        }
        cb(null, [])
      },
      insertMatch: function (editor, data) {
        editor.forEachSelection(function () {
          editor.insert(data.caption)
        })
      }
    })
  }, [])

  return <div>
    <div id="ace-el"></div>
    <AceEditor
      mode="yaml"
      theme="github"
      value={value}
      onChange={onChange}
      name="ace-el"
      editorProps={{ $blockScrolling: true }}
      width={width}
      height={height}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        tabSize: 2,
        readOnly,
        // enableBasicAutocompletion: [this.yourCustomCompleter]
      }}
    ></AceEditor>
  </div>
}