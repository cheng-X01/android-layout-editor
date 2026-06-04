# LayoutEditor VS Code 插件 v2.10.0 部署说明

## 文件清单

```
v2.10.0/
├── package.json      (插件配置清单)
├── extension.js      (插件主入口，含内联 Webview HTML)
├── CHANGELOG.md      (修改日志)
└── DEPLOY.md         (本文件)
```

## 架构说明

### 单文件架构
v2.10.0 采用单文件架构，Webview HTML/CSS/JS 全部内联在 extension.js 中，无需外部 media 目录。

### 核心类

| 类 | 职责 |
|---|------|
| `LayoutEditorProvider` | Custom Editor Provider，Webview 生命周期管理，消息分发 |
| `XMLValidator` | XML 诊断验证（必需属性、无效值、嵌套规则） |
| `DeviceManager` | 设备配置管理（8 种预设、6 种密度、3 种主题） |
| `ComponentLibrary` | Android 组件定义库（13 种组件 + 60+ 属性字典） |

### VS Code API 集成

| 功能 | 使用的 API |
|------|-----------|
| 文档操作 | `vscode.workspace.fs` / `WorkspaceEdit` |
| 撤销/重做 | VS Code 原生（通过 WorkspaceEdit） |
| 代码编辑 | `vscode.commands.executeCommand('vscode.open')` |
| XML 验证 | `vscode.languages.createDiagnosticCollection` |
| 资源拖拽 | `vscode.languages.registerDocumentDropEditProvider` |
| 配置管理 | `vscode.workspace.getConfiguration` |
| 主题适配 | VS Code CSS 变量自动继承 |

## 安装方式

### 方式一：打包 .vsix 安装（推荐）

```bash
cd v2.10.0
npx vsce package
```

然后在 VS Code 中：`Ctrl+Shift+P` → `Extensions: Install from VSIX` → 选择生成的 `.vsix` 文件

### 方式二：开发模式

将 `v2.10.0` 目录复制到 VS Code 扩展目录：
- Windows: `%USERPROFILE%\.vscode\extensions\android-layout-editor-2.10.0\`
- macOS/Linux: `~/.vscode/extensions/android-layout-editor-2.10.0/`

### 方式三：VS Code Marketplace 发布

```bash
cd v2.10.0
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

### 布局边界可视化
`Ctrl+Shift+X` 或点击工具栏边界按钮

### Layout Inspector
`Ctrl+Shift+I` 或点击工具栏 Inspector 按钮

### 设备配置切换
使用工具栏设备选择器切换预设设备、密度和主题

## 功能特性

### 阶段一：深度 VS Code 集成
- ✅ Custom Editor API（双击 XML 打开）
- ✅ WorkspaceEdit 文档操作（VS Code 原生撤销/重做）
- ✅ 双向文档同步（设计 ↔ 代码）
- ✅ VS Code 原生代码编辑器
- ✅ 零独立文件系统（全部使用 vscode.workspace.fs）

### 阶段二：智能辅助
- ✅ XML 实时验证（DiagnosticCollection）
- ✅ 60+ 属性智能补全字典
- ✅ 资源拖拽（图片/XML 从资源管理器拖入）

### 阶段三：可视化工具
- ✅ 布局边界可视化（margin/padding/constraint）
- ✅ 8 种设备配置预览
- ✅ Layout Inspector 叠加层

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+X` | 切换布局边界显示 |
| `Ctrl+Shift+I` | 切换 Layout Inspector |

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

## 版本信息

- 版本：v2.10.0
- 更新日期：2026-06-04
- 最低 VS Code 版本：1.74.0
