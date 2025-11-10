api baseURL：<http://www.zentao.rayvision.com/zentao/api.php/v1>

1. 创建任务： @post /executions/id/tasks，其中id为禅道执行的id

参考文档：<https://www.zentao.net/book/api/716.html>

2. 获取执行需求列表： @get /executions/id/stories, 其中id为禅道执行的id

参考文档： <https://www.zentao.net/book/api/693.html>

请求体：
module int 否 所属模块
story int 否 关联需求
fromBug int 否 来自于Bug
name string 是 任务名称
type string 是 任务类型(design 设计 | devel 开发 | request 需求 | test 测试 | study 研究 | discuss 讨论 | ui 界面 | affair 事务 | misc 其他)
assignedTo string 是 指派给
pri int 否 优先级
estimate float 否 预计工时
estStarted date 是 预计开始日期
deadline date 是 预计结束日期

要处理的步骤：

预先能获取到的值：执行需求列表stories、用户列表userList、选中的年月month（比如2025-11）

1. 在浏览器端解析用户选中的Excel表格，列表有编号、提测时间、前端、后端、脚本等表头（让用户填编号/提测时间在excel中对应的名称映射，前端/后端/脚本这些prefix让用户可以增填，做一个可以增加的输入框），
编号为id，提测时间为预计结束日期（deadline， 表里填的可能是日，比如11），前端/后端/脚本则是要指派的用户realname
解析成如下对象数组 excelInfo:
[
  {
    id: 1, // 编号
    users: [
      {
        prefix: '前端',
        realname: 'admin', // 读取prefix下对应的值
        account: 'admin', // 根据用户列表userList根据realname匹配获取对应的account
      }
    ],
    deadline: 某一天如12 或 某月日如12-10 或 某年月日如2025-12-10,
    estStarted: 选中月份的第一天,
    taskName: '', // 从执行需求列表stories中匹配编号（id）获取任务名称 name
    execution: '',
  }
]

1. 根据excelInfo做一个可编辑的表格，包括以下表头：编号（id，纯展示）、任务名称（taskName，纯展示） 预计开始日期（estStarted，可选年月日）、预计结束日期（deadline，可选年月日）、根据users数组里的prefix列出来表头展示对应的realname。

2. 在表格的下面做个确定按钮，点击确认遍历excelInfo和里面的users，组成创建任务的接口参数

接口：/executions/[execution]/tasks

参数：

```json
{
  "story": id,
  "name": 【prefix】taskName,
  "assignedTo": account,
  "type": "devel",
  "estStarted": estStarted,
  "deadline": deadline,
}
```
