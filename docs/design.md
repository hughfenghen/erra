# 设计文档
Erra由一个http(s)代理服务加UI界面组成，用户通过界面控制代理服务器的行为来实现各种功能。  

《图》

## Snippet解释
Snippet是为了实现快捷修改Http请求内容的所做的抽象，它的功能类似把**Http请求作为入参**进行数据处理的函数，输出即为修改后的Http请求。用户通过Snippet来描述数据处理逻辑。  
Snippet使用yaml语法编写（[js-yaml](https://github.com/nodeca/js-yaml)解析），为了达到“快捷”的目的，集成了mockjs，同时支持Snippet互相引用。  

