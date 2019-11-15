import yaml from 'js-yaml';
import { ExpSchema } from '../exp-yaml';

test('yaml load 自定义`Expression`类型', () => {
  const body = '[req, resp]'
  const str = `!expression '${body}'`
  const exp = yaml.load(
    str,
    { schema: ExpSchema }
  )

  expect(exp.fn).toBeInstanceOf(Function)
  expect(exp.fn(1, 2)).toEqual([1, 2])
  expect(exp.body).toEqual(body)
})

test('yaml dump 自定义`Expression`类型', () => {
  const exp = yaml.load(
    `!expression '[req, resp]'`,
    { schema: ExpSchema }
  )
  const dumpify = yaml.dump(exp, { schema: ExpSchema })

  expect(dumpify.includes('!expression')).toBeTruthy();
  expect(dumpify.includes('[req, resp]')).toBeTruthy();
})