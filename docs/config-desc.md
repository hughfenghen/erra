# 配置说明
执行`erra create`会在当前目录生成一个`erra.config.yaml`文件，`erra start`优先读取当前目录下的`erra.config.yaml`文件，如果当前目录不存在则去`<Home dir>/.erra/`目录下寻找，若仍不存在，则在`<Home dir>/.erra/`目录下生成一个新文件。

`erra.config.yaml`文件中只有`SERVICE_CONFIG`字段有自定义的必要，其他字段由Erra程序维护。  
配置是可阅读的文本，你也可以手动编辑，**但必须符合yaml语法和原有数据结构**，否则将导致程序运行异常。

## SERVICE_CONFIG
#### SERVICE_CONFIG.httpPort
**默认值**：`3344`  
**说明**：Http代理服务器端口，更新后需同时修改Chrome插件SwitchOmega的配置，和移动端代理配置中的端口号。参考[代理配置](./start.md##代理配置)  

#### SERVICE_CONFIG.httpsPort
**默认值**：`4455`  
**说明**：Erra UI的访问地址，默认[https://localhost:4455](https://localhost:4455)。同时影响官方自带的Snippet：`Inject Erra`，参考[注入Erra](./guide.md#注入erra界面)  

## snippet
<文档编写中>

## breakpoint
<文档编写中>

## apiBindSnippet
<文档编写中>

