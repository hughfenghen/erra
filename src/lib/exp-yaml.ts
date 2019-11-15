import yaml from 'js-yaml';

class Expression {
  fn: Function
  body: string

  constructor(data) {
    if (typeof data !== 'string' || !data) throw new Error('Expression 必须是string类型')

    this.body = data
    this.fn = new Function('req', 'resp', 'return ' + data)
    Object.assign(this.fn, { body: data })
  }
}

export const ExpType = new yaml.Type('!expression', {
  kind: 'scalar',
  instanceOf: Expression,
  construct: function (data) {
    return new Expression(data);
  },
  represent(exp) {
    return exp.body
  }
})

export const ExpSchema = yaml.Schema.create([ExpType])