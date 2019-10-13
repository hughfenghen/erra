#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const os = require('os');
const program = require('commander');
const shelljs = require('shelljs');

const erraPrjPath = path.resolve(__dirname, '../')
const serverPath = path.resolve(erraPrjPath, 'dist/server/server/index.js')
const erraHomePath = `${os.homedir()}/.erra`
const defaultErraCfgPath = path.resolve(erraHomePath, 'erra.config.yaml')

function createCfgFile(cfgPath) {
  shelljs.mkdir('-p', path.dirname(cfgPath))
  shelljs.cp(path.resolve(erraPrjPath, 'assets/erra.config.yaml'), cfgPath)
}

function cpPemFile () {
  shelljs.mkdir('-p', erraHomePath);
  ['erra.crt.pem', 'erra.csr.pem', 'erra.key.pem'].forEach((name) => {
      const targetPath = path.resolve(erraHomePath, name)
      if (!fs.existsSync(targetPath)) {
        shelljs.cp(path.resolve(erraPrjPath, `assets/${name}`), targetPath)
      }
    })
}

program.command('create')
  .action(() => {
    const p = path.resolve(process.cwd(), 'erra.config.yaml')
    if (fs.existsSync(p)) {
      console.log(`文件已存在：${p}`);
      return
    }
    createCfgFile(p)
    console.log(`配置文件创建成功：${p}`);
  })

program.command('start')
  .arguments('[cfgPath]')
  .action((cfgPath = './erra.config.yaml') => {
    cpPemFile()
    let p = path.resolve(process.cwd(), cfgPath)
    if (!fs.existsSync(p)) {
      // log: path not exists
      p = defaultErraCfgPath
      if (!fs.existsSync(p)) {
        createCfgFile(p)
      }
    }

    shelljs.exec(`node ${serverPath} -c ${p}`)
  })

program.parse(process.argv);