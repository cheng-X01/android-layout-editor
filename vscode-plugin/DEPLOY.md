# LayoutEditor VS Code 插件 - 部署说明

> 插件采用 Git commit 版本管理，所有版本迭代在同一目录下进行，无需每个版本一个文件夹。

## 文件清单

```
vscode-plugin/
├── package.json      (插件配置清单)
├── extension.js      (插件主入口)
├── CHANGELOG.md      (完整修改日志 v2.9.0+)
├── DEPLOY.md         (本文件)
└── media/
    ├── app.js        (Webview 前端运行时)
    └── style.css     (Webview 样式)
```

## 安装方式

### 方式一：打包 .vsix 安装（推荐）

```bash
cd vscode-plugin
npx vsce package
```

然后在 VS Code 中：`Ctrl+Shift+P` → `Extensions: Install from VSIX` → 选择生成的 `.vsix` 文件

### 方式二：开发模式

将 `vscode-plugin` 目录复制到 VS Code 扩展目录：
- Windows: `%USERPROFILE%\.vscode\extensions\android-layout-editor/`
- macOS/Linux: `~/.vscode/extensions/android-layout-editor/`

### 方式三：VS Code Marketplace 发布

```bash
cd vscode-plugin
npx vsce publish
```

需要先注册 VS Code Marketplace 发布者账号。

## 使用方法

### 打开 XML 布局文件
1. 在资源管理器中右键点击 `.xml` 文件
2. 选择 **"Open in Layout Editor"**
3. 或使用命令面板 `Ctrl+Shift+P` → **"Android Layout Editor: Open in Layout Editor"**

### 新建布局文件
`Ctrl+Shift+P` → **"Android Layout Editor: New Android Layout"**

### 切换到代码视图
点击工具栏 **"代码"** 按钮，或 `Ctrl+Shift+P` → **"Android Layout Editor: Open Code"**

### XML 格式化
`Shift+Alt+F` 或右键 → **"Format Document"**

### 提取字符串/尺寸资源
右键属性值 → **"Extract to @string/"** 或 **"Extract to @dimen/"**

### 包裹/解包布局
右键组件 → **"Wrap with Layout"** 或 **"Unwrap Layout"**

### 性能分析面板
`Ctrl+Shift+P` → **"Android Layout Editor: Show Performance Panel"**

## 功能特性

### 核心编辑
- ✅ Custom Editor API（双击 XML 打开）
- ✅ WorkspaceEdit 文档操作（VS Code 原生撤销/重做）
- ✅ 双向文档同步（设计 ↔ 代码）
- ✅ XML 格式化（DocumentFormattingEditProvider）
- ✅ XML 实时验证（DiagnosticCollection）

### 智能辅助
- ✅ 60+ 属性智能补全（CompletionItemProvider）
- ✅ 资源自动补全（@drawable/, @layout/, @string/, @dimen/）
- ✅ 资源 Hover 预览（显示 string/dimen 实际值）
- ✅ 定义跳转（DefinitionProvider）
- ✅ 文档链接（DocumentLinkProvider）
- ✅ CodeLens 导航

### 可视化工具
- ✅ 布局边界可视化（margin/padding/constraint）
- ✅ 8 种设备配置预览
- ✅ Layout Inspector 叠加层
- ✅ 健康评分系统（0-100）
- ✅ Overdraw 热力图
- ✅ 统计面板（组件分布、嵌套分析）
- ✅ Material 3 动态调色板

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+X` | 切换布局边界显示 |
| `Ctrl+Shift+I` | 切换 Layout Inspector |
| `Shift+Alt+F` | 格式化 XML |

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `androidLayoutEditor.theme` | string | dark | 编辑器主题 |
| `androidLayoutEditor.autoSave` | boolean | true | 自动保存 |
| `androidLayoutEditor.phoneRatio` | string | 9-16 | 手机比例 |
| `androidLayoutEditor.showBounds` | boolean | false | 显示布局边界 |
| `androidLayoutEditor.devicePreset` | string | pixel-7 | 设备预设 |
| `androidLayoutEditor.density` | string | xxhdpi | 屏幕密度 |
| `androidLayoutEditor.appTheme` | string | light | 应用主题 |

## 版本历史

详见 [CHANGELOG.md](CHANGELOG.md)

当前版本：v2.13.0（2026-06-05）
