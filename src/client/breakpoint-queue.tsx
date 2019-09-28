import React from 'react';
import { List } from 'antd';
import s from './style.less'

export default function BreakpointQueue() {

  return <section className={s.bpPage}>
    <div className={s.opBar}></div>
    <List></List>
  </section>
}