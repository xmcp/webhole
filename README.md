# AsHole
React 版 P大树洞，[hole.xmcp.ml](http://hole.xmcp.ml)

与 PKU Helper 客户端比较，本项目……

**支持** PKU Helper 树洞**支持**的以下功能：

- 瀑布流
- 查看文字、图片、语音树洞
- 查看树洞的发送时间、回复数量、关注数量
- 查看回复
- 搜索树洞
- URL和树洞编号识别
- 用学号和密码登录
- 查看关注的树洞
- 发表文字、图片树洞
- 发表文字回复
- 关注树洞
- 举报树洞

**支持** PKU Helper 树洞**不支持**的以下功能：

- 在其他操作系统中使用
- 显示超过100条搜索结果
- 按编号搜索树洞
- 智能调整上传图片的质量
- 用颜色区分不同人的回复
- 突出显示未读树洞
- 精确显示发帖时间
- 复制树洞链接
- 3D Touch 支持（可通过修改 Flag `DISABLE_PRESSURE=on` 来关闭）
- 自定义背景图片（请修改 Flag `REPLACE_ERIRI_WITH_URL=http://...`）
- 检测被删除的树洞（请修改 Flag `DELETION_DETECT=on`）
- 刷树洞负关注数（请修改 Flag `STAR_BRUSH=on`）
- 用 Token 登录（请修改 Flag `TOKEN=...`）

**不支持** PKU Helper 树洞**支持**的以下功能：

- 搜索时筛选有图片、语音的树洞
- 发表语音树洞
- 关注的树洞有回复时推送提醒

*注：设置 Flag 请在搜索框输入 `//setflag KEY=value`*