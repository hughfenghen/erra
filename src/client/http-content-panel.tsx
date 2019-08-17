import React, { useCallback, useEffect, useRef, useState } from 'react';

import Editor from './editor';

export default function HttpContentPanel({ content }) {

  return <section>
    <Editor value={content}></Editor>
  </section>
}
