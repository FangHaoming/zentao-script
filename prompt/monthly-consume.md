api baseURL：http://www.zentao.rayvision.com/zentao/api.php/v1 

1. 获取用户列表：/users

参考文档：@https://www.zentao.net/book/api/666.html 

2. 获取项目列表： /projects

参考文档：@https://www.zentao.net/book/api/699.html 

3. 获取项目的执行列表：/projects/id/executions，其中id取项目列表中的id

参考文档：@https://www.zentao.net/book/api/710.html 

4. 获取执行任务列表：/executions/id/tasks，其中id取项目的执行列表中的id

参考文档：@https://www.zentao.net/book/api/715.html 

注意：以上接口有做分页，根据接口返回结果的page、total、limit判断，在尾部添加page=xx&limit=xx来继续请求，直到请求完所有数据，这部分做一个Promise队列，以防触发浏览器最大请求并发限制。

生成一个react油猴项目，做一个表格统计每个用户当月所有完成任务的消耗工时（consumed），表格列为：用户名称（realname）、消耗工时（小时）、消耗工时（天，按8小时一天计算）、。在表格的顶部可以筛选包含的项目（多选）、包含的执行（多选）、月份（单选）、用户（多选）。

这个表格通过悬浮在页面的按钮唤出，支持刷新。在请求数据时，对应表格的数字可以做滚动更新。