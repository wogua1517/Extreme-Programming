# Git 提交信息规范（Commit Message Standard）

## 1. 目的
统一提交信息格式，便于版本追溯、自动化发布、生成更新日志（Changelog），并清晰记录功能变更、作者与时间。

---

## 2. 提交信息格式

每条 `git commit` 的消息必须严格遵循以下结构：

```
V<主版本>.<次版本>-<变更类型>: <简要描述>-Version creation time: YYYY/MM/DD HH:mm <作者姓名>
```

### 示例：
```text
V1.6-Add new features: Import Contacts-Version creation time: 2025/12/11 00:59 Zhongbo LIU
```

---

## 3. 字段说明

| 字段 | 说明 | 要求 |
|------|------|------|
| `V<主版本>.<次版本>` | 当前代码版本号 | 如 `V1.0`, `V2.3`。建议与项目版本一致 |
| `<变更类型>` | 变更类别 | 必须使用以下之一：<br>• `Add new features`（新增功能）<br>• `Fix bugs`（修复缺陷）<br>• `Optimize performance`（性能优化）<br>• `Refactor code`（代码重构）<br>• `Update dependencies`（依赖更新）<br>• `Improve UI/UX`（界面优化）<br>• `Update documents`（文档更新） |
| `<简要描述>` | 用简洁英文短语说明变更内容 | 首字母大写，不加句号，如：`Import Contacts`、`Fix login timeout issue` |
| `Version creation time` | 版本创建时间 | 固定字段名，不可更改 |
| `YYYY/MM/DD HH:mm` | 精确到分钟的时间戳 | 使用 **24 小时制**，如 `2025/12/11 00:59` |
| `<作者姓名>` | 提交者真实姓名 | 姓在前、名在后，首字母大写，如 `Zhongbo LIU` |

---


## 4. 注意事项
- 所有团队成员必须遵守此规范；
- CI/CD 流程可校验 commit 格式，不符合者拒绝合并；
- 版本号应与产品发布计划同步更新；
- 时间以 **本地提交时间** 为准，建议使用系统当前时间。
