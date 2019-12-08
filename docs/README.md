# Erra

Erra是一个非常便捷的http接口调试工具。阅读下文可以对Erra有一个初步了解，阅读<a href="https://hughfenghen.github.io/erra/start">启动文档</a>可以快速体验Erra的功能。  

![preview](https://raw.githubusercontent.com/hughfenghen/erra/master/preview.gif)

## 目标
- 提高接口调试效率  
- 解决复杂项目，接口mock数据难以维护的问题（核心能力已经提供，交互易用性仍在探索中）  

## 核心功能
- 断点编辑http请求（类似Charles的断点功能）  
- 对http请求编辑提供“编程能力”（拦截并篡改请求内容，比脚本更简易）  
- 集成mockjs，快速生成mock数据  
- 完美融合运用以上三个基本能力，才是Erra的魅力所在  

## 应用场景
- 抓包分析请求，并支持断点编辑请求内容  
- 本地开发时，代理/转发请求到远程服务器  
- 针对接口编写多个场景的mock数据，快速切换覆盖业务场景  
- 向移动端页面注入（无需项目接入）[Eruda](https://github.com/liriliri/eruda)，调试移动端页面  

详情请参阅<a href="https://hughfenghen.github.io/erra/guide">使用指南</a>

## 贡献
1. 克隆代码到本地
2. 安装依赖 `yarn`
3. 启动本地代理服务 `yarn server:dev`
4. 启动本地UI服务 `yarn client:dev`
5. <a href="https://hughfenghen.github.io/erra/trust-ca.html">信任证书</a>`static`目录下的证书
6. <a href="https://hughfenghen.github.io/erra/start.html#%E4%BB%A3%E7%90%86%E9%85%8D%E7%BD%AE">配置代理</a>

## 计划

功能  
- [] 支持场景，即一次操作使多个【接口-Snippet】绑定同时生效/失效，快速覆盖某个需要多次调用接口才能触发的场景  

编辑器优化  
- [] 更智能的自动补全、错误提示  
- [] 更丰富的yaml语法高亮  
- [] 图片文件支持预览  

效率、体验优化  
- [] 界面美化  
- [] 一键保存请求Response为Snippet  
- [] 资源映射（charles中的mapping）  

## 名称含义
`Erra`并没有什么特殊含义，项目开始的时候想了很久都没有想到好名字，（有点生气）就双手往键盘上一拍。  
突然灵光一闪，取了前几个字母，就是——`Erra`了。