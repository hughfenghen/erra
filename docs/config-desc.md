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
snippet是一个对象类型，key为Snippet的唯一标识，其作用参阅[Snippet解释](./design.md#snippet解释)。  

Snippet结构如下：
```ts
interface Snippet {
  id: string,
  name: string,
  // SnippetContent为任意类型，遵守[js-yaml](https://github.com/nodeca/js-yaml)语法即可。
  content: SnippetContent,
  // 当请求满足when的条件时，使用当前Snippet修改请求
  when?: RegExp | ((data: SimpleReq | SimpleResp) => boolean),
  // 对于按时机触发的Snippet（含有when字段），加一个开关控制是否启用
  enabled?: boolean,
}
```
你还可以查看如何[编写Snippet](./guide.md#编写snippet)。  
::: warning
不需要人工维护
:::

## breakpoint
```yaml
breakpoint:
  # 激活的http请求断点，由域名+path组成
  'https://www.mocky.io/v2/5185415ba171ea3a00704eed':
    # 断点时机，数组类型，允许值：request、response
    - response
    - request
```
::: warning
不需要人工维护
:::

## apiBindSnippet
Key为请求的http请求的域名+path，value为SnippetId。请求与Snippet的绑定关系建立后，Snippet将自动修改http请求内容。  
```yaml
apiBindSnippet:
  'http://zoom.test.meituan.com/api/ifUserInMeeting': d0a5315e-494f-4760-8859-be42d3e26e8c
```
操作方式参阅[接口绑定Snippet](./guide.md#接口绑定snippet)。  
:::tip
绑定后，Snippet作用与http请求的Response。  
目前暂**不支持**请求绑定Snippet修改Request。  
:::
::: warning
不需要人工维护
:::

