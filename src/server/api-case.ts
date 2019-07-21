import { find } from 'lodash/fp';

const caseManager = {
  '/mock/2059/dedup/api/bma/task/detail/taskDetail': {
    root: [{
      name: '1',
      description: '',
      fieldPath: 'root',
      value: { code: 200, msg: 'xxx'},
      type: 'fixed',
    }]
  }
}

class Case {
  name
  description
  fieldPath
  value
  // 原始值: origin、 :mockjs、 固定值: fixed、case集合: collect
  type
  active: boolean
  childrens: Array<Case>
}

function findActiveCase (apiPath, fieldPath): Case | undefined {
  return find<Case>({ active: true })(caseManager[apiPath][fieldPath])
}

export function parse(apiPath, body) {
  const rootCase = findActiveCase(apiPath, 'root')
  // if (!rootCase) return body
  switch(rootCase.type) {
  }
}