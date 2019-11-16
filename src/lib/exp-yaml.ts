import yaml from 'js-yaml';

export class Expression {
  fn: Function
  primitive: string

  constructor(data) {
    if (typeof data !== 'string' || !data) throw new Error('Expression 必须是string类型')

    this.primitive = data
    this.fn = new Function('V', 'return ' + data)
  }
}

export const ExpType = new yaml.Type('!expression', {
  kind: 'scalar',
  instanceOf: Expression,
  construct: function (data) {
    return new Expression(data);
  },
  represent(exp: Expression) {
    return exp.primitive
  }
})

export const ExpSchema = yaml.Schema.create([ExpType])