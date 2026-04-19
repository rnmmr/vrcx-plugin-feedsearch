# VRCX 好友动态公式搜索插件
一个增强 VRCX 好友动态搜索功能的自定义插件，支持高级公式筛选语法。

## 功能特点
- 公式搜索语法 ：使用 name=Alice & type=GPS 等表达式搜索动态
- 多字段支持 ：支持按用户名(name)、世界(world)、位置(wrld)、用户ID(usr)、状态(status)、头像(avatar)、简介(bio)、类型(type)、时间(time)搜索
- 逻辑操作符 ：使用 & (与)、 | (或)、 != (非) 组合条件
- 分组功能 ：使用括号 () 创建复杂查询，如 (name=Alice | name=Bob) & type=GPS
- 精准时间筛选 ：使用 time=2025-04-19 按特定日期筛选
- 中英文界面 ：支持在英文和中文界面之间切换
- 适配暗色模式 ：完全支持 VRCX 的亮色/暗色主题
## 支持的字段
字段 说明 示例 name 用户名 name=Alice world 世界名称 world=VRChat wrld 世界实例ID wrld=wrld_xxx usr 用户ID usr=usr_xxx status 状态消息 status=在线 avatar 头像名称 avatar=机器人 bio 个人简介 bio=开发者 type 动态类型 type=GPS time 创建日期 time=2025-04-19

## 使用示例
```
name=Alice & type=GPS        # 搜索 
Alice 的 GPS 动态
name=Alice | name=Bob       # 搜索 
Alice 或 Bob 的动态
type=GPS & world=咖啡厅      # 搜索在咖啡
厅的 GPS 动态
type!=Offline               # 排除离线动
态
(name=Alice | name=Bob) & type=GPS # 组
合条件搜索
```
## 安装方法
1. 将 custom.js 复制到 %AppData%\VRCX\ 目录
2. 重启 VRCX
3. 在 "扩展JS" 分类中找到 "好友动态公式搜索" 卡片

## 参考

[VRCX-theme-plugin](https://github.com/xiaoBingge114514/VRCX-theme-plugin) 从这个库的脚本里借鉴了多脚本管理方法，感谢捏
