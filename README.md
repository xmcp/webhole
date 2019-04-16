React 版 P大树洞，[pkuhelper.pku.edu.cn/hole](http://pkuhelper.pku.edu.cn/hole/)

与 PKU Helper 客户端的树洞模块比较，本项目……

**支持** PKU Helper 树洞**支持**的以下功能：

- 瀑布流
- 查看文字、图片、语音树洞
- 查看树洞的发送时间、回复数量、关注数量
- 查看回复
- 按关键词搜索树洞
- 按编号搜索树洞
- URL和树洞编号识别
- 登录账号
- 查看关注的树洞
- 发表文字、图片树洞
- 发表文字回复
- 关注树洞
- 举报树洞

**支持** PKU Helper 树洞**不支持**的以下功能：

- 在各种操作系统中使用
- 显示无限条搜索结果
- 智能调整上传图片的质量
- 用颜色区分不同人的回复
- 突出显示未读树洞
- 精确显示发帖时间
- 复制树洞链接和全文
- 3D Touch 支持
- 自定义背景图片
- 检测树洞和回复被删除（默认不开启）
- 用 Token 登录

**不支持** PKU Helper 树洞**支持**的以下功能：

- 搜索时筛选有图片、语音的树洞
- 发表语音树洞
- 关注的树洞有回复时推送提醒

**附：进行自定义的方法**

在搜索框中输入类似 `//setflag KEY=value` 的内容（注意大小写、全半角和空格），然后重新打开页面即可生效。

目前可以自定义的功能包括：

- 检测瀑布流中被删除的树洞和树洞被删除的评论（`//setflag DELETION_DETECT=on`）
- 自定义背景图片（`//setflag REPLACE_ERIRI_WITH_URL=http://...`）
- 禁用 3D Touch 功能（`//setflag DISABLE_PRESSURE=on`）
- 禁用自动显示引用树洞功能（`//setflag DISABLE_QUOTE=on`）