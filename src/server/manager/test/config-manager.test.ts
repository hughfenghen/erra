import fs from 'fs';
import configManager from "../config-manager";

jest.mock('fs')

test('init config，emit afterConfigInit', () => {
  const spyExists = jest.spyOn(fs, 'existsSync')
  spyExists.mockReturnValueOnce(true)
  const spyReadFile = jest.spyOn(fs, 'readFile')
  
  // @ts-ignore
  spyReadFile.mockImplementationOnce((a: string, encoding: string, cb: Function) => {
    cb(null, '')
  })

  const onAfterConfigInit = jest.fn()
  configManager.on('afterConfigInit', onAfterConfigInit)
  
  configManager.init('/anypath')
  expect(onAfterConfigInit).toBeCalled()
})

test('init config，读取配置信息', (done) => {
  const spyExists = jest.spyOn(fs, 'existsSync')
  spyExists.mockReturnValueOnce(true)
  const spyReadFile = jest.spyOn(fs, 'readFile')

  // @ts-ignore
  spyReadFile.mockImplementationOnce((a: string, encoding: string, cb: Function) => {
    cb(null, 'a: A')
  })

  configManager.on('afterConfigInit', () => {
    expect(configManager.get('a')).toBe('A')
    done()
  })

  configManager.init('/anypath')
})

test('init config，path错误抛出异常', () => {
  expect(() => {
    configManager.init('/anypath')
  }).toThrow()
})

test('init config，文件读取错误', () => {
  const spyExists = jest.spyOn(fs, 'existsSync')
  spyExists.mockReturnValueOnce(true)
  const spyReadFile = jest.spyOn(fs, 'readFile')

  // @ts-ignore
  spyReadFile.mockImplementationOnce((a: string, encoding: string, cb: Function) => {
    cb(new Error('mock err'))
  })

  const onAfterConfigInit = jest.fn()
  configManager.on('afterConfigInit', onAfterConfigInit)

  configManager.init('/anypath')
  expect(onAfterConfigInit).not.toBeCalled()
})

test('更新配置', () => {
  configManager.emit('update', 'b', 'B')
  expect(configManager.get('b')).toBe('B')
})

test('写入配置', (done) => {
  const spyExists = jest.spyOn(fs, 'existsSync')
  spyExists.mockReturnValueOnce(true)
  const spyReadFile = jest.spyOn(fs, 'readFile')
  spyReadFile.mockImplementationOnce(() => {})
  
  const spyWriteFile = jest.spyOn(fs, 'writeFile')
  spyWriteFile.mockImplementationOnce((path, text, cb) => {
    expect(path).toBe('/anypath')
    expect(text.includes('c: C')).toBeTruthy()
    done()
  })

  configManager.init('/anypath')
  configManager.emit('update', 'c', 'C')
})
