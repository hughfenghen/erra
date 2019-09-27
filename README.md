# Erra

接口调试工具，支持断点编辑请求的Request、Response，快速生成mock数据。

## 目标
- 提高接口开发调试效率
- 解决接口mock数据难以维护的问题

## 功能
- 接口断点，修改Request、Response内容（header、body...）
- 集成mockjs，快速生成mock数据
- 支持Snippet引用，mock数据可封装复用
- 支持切换接口对应的Snippet，快速覆盖业务场景

注：`Snippet`是由用户编写的可以生成mock数据的yaml语法配置，支持互相引用达到封装复用的目的。

## 计划

### Bug
[x] 超长的Response可能导致页面卡死  
[] websocket代理失败  
[-] 断点 中断后无法继续，导致后续所有断点在队列中无法处理  

### 一期基本功能
[x] http、https代理服务  
[x] 网络请求断点、编辑  
[x] Snippet解析、管理  
[x] 配置持久化  
[x] 列表页性能优化  
[x] UI设计、优化  
[] 使用文档、设计文档

### 二期功能强化
[] 更友好的接入方式，更便捷的入口  
  - [] Erra bin  
  - [] 注入Erra操作面板到业务页面  
  - [] 非代理接入：业务项目主动接入  
  - [] 断点、Snippet总开关  

[] 编辑器优化  
  - [] 更智能的自动补全、错误提示  
  - [] 更丰富的yaml语法高亮  
  - [] 图片文件支持预览  

[] 效率、体验优化  
  - [] include、exclude API记录模式  
  - [] API List 倒序  
  - [] 一键保存请求Response为Snippet  
  - [] API List快速过滤  
  - [] 激活断点 发送浏览器消息  
  - [] 断点队列管理  
  - [] API List最多展示200条数据  
  - [] 资源映射（charles中的mapping）  


*x: 已完成；-：进行中*