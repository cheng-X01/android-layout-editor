#!/bin/bash
# ============================================
# LayoutEditor VS Code 插件 .vsix 打包脚本
# ============================================
# 用法: ./build-vsix.sh
# 产物: vscode-plugin/releases/android-layout-editor-{version}.vsix
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR"
RELEASE_DIR="$PLUGIN_DIR/releases"

# 从 package.json 读取版本号
VERSION=$(node -p "require('$PLUGIN_DIR/package.json').version")
NAME=$(node -p "require('$PLUGIN_DIR/package.json').name")
VSIX_NAME="${NAME}-${VERSION}.vsix"

echo "========================================"
echo "  LayoutEditor VSIX Builder"
echo "========================================"
echo "  版本: $VERSION"
echo "  插件: $NAME"
echo "========================================"

# 检查 vsce 是否可用
if ! npx vsce --version &>/dev/null; then
    echo "❌ vsce 未安装，正在安装..."
    npm install @vscode/vsce --no-save --break-system-packages
fi

# 清理旧的 .vsix 文件
echo ""
echo "📦 清理旧产物..."
find "$PLUGIN_DIR" -maxdepth 1 -name "*.vsix" -delete 2>/dev/null || true

# 打包
echo "🔨 打包 $VSIX_NAME ..."
cd "$PLUGIN_DIR"
npx vsce package --no-dependencies --allow-missing-repository 2>&1

# 移动到 releases 目录
mkdir -p "$RELEASE_DIR"
if [ -f "$PLUGIN_DIR/$VSIX_NAME" ]; then
    mv "$PLUGIN_DIR/$VSIX_NAME" "$RELEASE_DIR/"
    echo ""
    echo "✅ 打包成功!"
    echo "   产物: releases/$VSIX_NAME"
    echo "   大小: $(du -h "$RELEASE_DIR/$VSIX_NAME" | cut -f1)"
    echo ""
    echo "📥 安装方式:"
    echo "   VS Code → Ctrl+Shift+P → Extensions: Install from VSIX"
    echo "   选择: releases/$VSIX_NAME"
else
    # vsce 可能用了不同的命名
    VSIX_FILE=$(find "$PLUGIN_DIR" -maxdepth 1 -name "*.vsix" -print -quit 2>/dev/null)
    if [ -n "$VSIX_FILE" ]; then
        mv "$VSIX_FILE" "$RELEASE_DIR/"
        echo ""
        echo "✅ 打包成功!"
        echo "   产物: releases/$(basename "$VSIX_FILE")"
    else
        echo "❌ 打包失败，未找到 .vsix 文件"
        exit 1
    fi
fi

echo ""
echo "========================================"
