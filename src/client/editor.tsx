import ace from 'brace';
import 'brace/ext/language_tools';
import 'brace/mode/yaml';
import 'brace/snippets/yaml';
import 'brace/theme/github';

import { noop } from 'lodash/fp';
import React, { useEffect, useRef } from 'react';
import AceEditor from 'react-ace';

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

langTools.addCompleter({
  getCompletions(editor, session, pos, prefix, cb) {
    const lineStr = session.getLine(pos.row);
    console.log(333, session, pos);
    console.log(444, lineStr.indexOf(':'), pos.column);
    if (
      /^\s*\$snippet\s+/.test(lineStr)
      && lineStr.includes(':')
      && lineStr.indexOf(':') < pos.column
    ) {
      console.log(5566);
      cb(null, [{
        name: 'snippetId', 
        value: 'xxxxx', 
        score: 0, 
        meta: "$snippet key: sid",
      }])
      editor.completer.openPopup(editor)
      return
    }
    cb(null, [])
  }
})

export default function Editor({
  value = '',
  width = '100%',
  height = '100vh',
  onChange = noop,
  language,
  readOnly = false,
}) {
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
        // enableBasicAutocompletion: [this.yourCustomCompleter]
      }}
    ></AceEditor>
  </div>
}