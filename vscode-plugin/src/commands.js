const vscode = require('vscode');
const vs = vscode;
const path = require('path');
const fs = require('fs');
const { Logger } = require('./logger');
const { ALE } = require('./constants');
const { EP } = require('./editor-provider');
const { FmtProvider } = require('./providers/formatting-provider');

function _getSel(doc) {
  const ed = vs.window.activeTextEditor;
  if (!ed) return '';
  const sel = ed.selection;
  if (sel.isEmpty) return '';
  return doc.getText(sel);
}

function _replaceSel(doc, text) {
  const ed = vs.window.activeTextEditor;
  if (!ed) return;
  const sel = ed.selection;
  const edit = new vs.WorkspaceEdit();
  edit.replace(doc.uri, sel, text);
  vs.workspace.applyEdit(edit);
}

function registerCommands(ctx, val) {
  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.open', async u => {
    try {
      if (!u) {
        const ed = vs.window.activeTextEditor;
        if (ed) u = ed.document.uri;
        else {
          vs.window.showWarningMessage('请先打开XML文件');
          return;
        }
      }
      await vs.window.showTextDocument(u, { viewColumn: vs.ViewColumn.One, preview: false });
    } catch (e) {
      Logger.error('command open failed', e);
      vs.window.showErrorMessage('打开文件失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.openSidebar', async () => {
    try {
      const p = vs.window.createWebviewPanel('androidLayoutEditorSidebar', 'Android Layout Editor', { viewColumn: vs.ViewColumn.Beside, preserveFocus: true }, { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [vs.Uri.file(path.join(ctx.extensionPath, 'media'))] });
      const sp = new EP(ctx);
      sp.setV(val);
      p.webview.html = sp._html('\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n    android:layout_width="match_parent"\n    android:layout_height="match_parent"\n    android:orientation="vertical">\n\n</LinearLayout>', p.webview);
      p.webview.onDidReceiveMessage(async m => {
        try {
          await sp._handle(m, p, { uri: vs.Uri.parse('untitled:sidebar-layout.xml'), getText: () => p.webview.html, save: async () => { } });
        } catch (e) {
          Logger.error('sidebar message handler failed', e);
        }
      });
    } catch (e) {
      Logger.error('command openSidebar failed', e);
      vs.window.showErrorMessage('打开侧边栏失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.newLayout', async () => {
    try {
      const wf = vs.workspace.workspaceFolders;
      if (!wf) {
        vs.window.showErrorMessage('请先打开工作区');
        return;
      }
      const fn = await vs.window.showInputBox({
        prompt: '输入布局文件名',
        placeHolder: 'activity_main',
        validateInput: v => {
          if (!v || !/^[a-z][a-z0-9_]*$/.test(v)) return '文件名格式错误';
          return null;
        }
      });
      if (!fn) return;
      const ld = vs.Uri.joinPath(wf[0].uri, 'res', 'layout');
      const fu = vs.Uri.joinPath(ld, fn + '.xml');
      const dx = '\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n    android:layout_width="match_parent"\n    android:layout_height="match_parent"\n    android:orientation="vertical">\n\n</LinearLayout>';
      try {
        await vs.workspace.fs.createDirectory(ld);
      } catch (e) { }
      await vs.workspace.fs.writeFile(fu, new TextEncoder().encode(dx));
      await vs.commands.executeCommand('vscode.openWith', fu, ALE + '.layoutEditor');
    } catch (e) {
      Logger.error('command newLayout failed', e);
      vs.window.showErrorMessage('创建布局失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.toggleBounds', async () => {
    try {
      const cfg = vs.workspace.getConfiguration(ALE);
      const cur = cfg.get('showBounds', false);
      await cfg.update('showBounds', !cur, true);
      vs.window.showInformationMessage('布局边界显示: ' + (!cur ? '开启' : '关闭'));
    } catch (e) {
      Logger.error('command toggleBounds failed', e);
      vs.window.showErrorMessage('切换边界失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.showInspector', async () => {
    try {
      vs.window.showInformationMessage('Inspector已激活');
    } catch (e) {
      Logger.error('command showInspector failed', e);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.openCode', async () => {
    try {
      const ed = vs.window.activeTextEditor;
      if (ed && ed.document.uri.scheme === 'file')
        await vs.commands.executeCommand('vscode.open', ed.document.uri, { viewColumn: vs.ViewColumn.Beside });
      else
        vs.window.showWarningMessage('请先打开XML文件');
    } catch (e) {
      Logger.error('command openCode failed', e);
      vs.window.showErrorMessage('打开代码失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.exportImage', async () => {
    try {
      vs.window.showInformationMessage('请使用工具栏导出按钮');
    } catch (e) {
      Logger.error('command exportImage failed', e);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.openCodeLensTarget', async (uri, layoutName, actName) => {
    try {
      const wf = vs.workspace.workspaceFolders;
      if (!wf) return;
      const src = vs.Uri.joinPath(wf[0].uri, 'src');
      const findFile = (dirUri) => {
        try {
          const entries = fs.readdirSync(dirUri.fsPath, { withFileTypes: true });
          for (const ent of entries) {
            if (ent.isDirectory()) {
              const r = findFile(vs.Uri.joinPath(dirUri, ent.name));
              if (r) return r;
            } else if (ent.name === actName + '.kt' || ent.name === actName + '.java')
              return vs.Uri.file(path.join(dirUri.fsPath, ent.name));
          }
        } catch (e) { }
        return null;
      };
      let fu = findFile(src);
      if (!fu) {
        vs.window.showWarningMessage('未找到 ' + actName + '.kt，尝试打开代码');
        fu = uri;
      }
      await vs.window.showTextDocument(fu, { viewColumn: vs.ViewColumn.Beside, preview: false });
    } catch (e) {
      Logger.error('command openCodeLensTarget failed', e);
      vs.window.showErrorMessage('打开目标失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.formatDocument', async () => {
    try {
      const ed = vs.window.activeTextEditor;
      if (!ed) return;
      const doc = ed.document;
      if (!doc.uri.path.endsWith('.xml')) {
        vs.window.showWarningMessage('仅支持XML文件');
        return;
      }
      const fp = new FmtProvider();
      const edits = fp.provideDocumentFormattingEdits(doc);
      if (!edits || !edits.length) {
        vs.window.showInformationMessage('无需格式化');
        return;
      }
      const we = new vs.WorkspaceEdit();
      edits.forEach(e => we.replace(doc.uri, e.range, e.newText));
      await vs.workspace.applyEdit(we);
      vs.window.showInformationMessage('已格式化');
    } catch (e) {
      Logger.error('command formatDocument failed', e);
      vs.window.showErrorMessage('格式化失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.extractToString', async () => {
    try {
      const ed = vs.window.activeTextEditor;
      if (!ed) return;
      const sel = _getSel(ed.document);
      if (!sel) {
        vs.window.showWarningMessage('请先选中要提取的文本');
        return;
      }
      const name = await vs.window.showInputBox({ prompt: '输入字符串资源名', placeHolder: 'hint_username' });
      if (!name) return;
      const wf = vs.workspace.workspaceFolders;
      if (!wf) return;
      const sp = path.join(wf[0].uri.fsPath, 'res', 'values', 'strings.xml');
      let xml = '';
      try {
        xml = fs.readFileSync(sp, 'utf-8');
      } catch (e) {
        xml = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>';
      }
      const entry = `  <string name="${name}">${sel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</string>`;
      xml = xml.replace(/<\/resources>/, entry + '\n</resources>');
      fs.writeFileSync(sp, xml);
      _replaceSel(ed.document, `@string/${name}`);
      vs.window.showInformationMessage(`已提取到 strings.xml: @string/${name}`);
    } catch (e) {
      Logger.error('command extractToString failed', e);
      vs.window.showErrorMessage('提取字符串失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.extractToDimen', async () => {
    try {
      const ed = vs.window.activeTextEditor;
      if (!ed) return;
      const sel = _getSel(ed.document);
      if (!sel || !/\d+(\.\d+)?dp/.test(sel)) {
        vs.window.showWarningMessage('请先选中尺寸值（如 16dp）');
        return;
      }
      const name = await vs.window.showInputBox({ prompt: '输入dimen资源名', placeHolder: 'spacing_medium' });
      if (!name) return;
      const wf = vs.workspace.workspaceFolders;
      if (!wf) return;
      const dp = path.join(wf[0].uri.fsPath, 'res', 'values', 'dimens.xml');
      let xml = '';
      try {
        xml = fs.readFileSync(dp, 'utf-8');
      } catch (e) {
        xml = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>';
      }
      const entry = `  <dimen name="${name}">${sel}</dimen>`;
      xml = xml.replace(/<\/resources>/, entry + '\n</resources>');
      fs.writeFileSync(dp, xml);
      _replaceSel(ed.document, `@dimen/${name}`);
      vs.window.showInformationMessage(`已提取到 dimens.xml: @dimen/${name}`);
    } catch (e) {
      Logger.error('command extractToDimen failed', e);
      vs.window.showErrorMessage('提取尺寸失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.wrapWithLayout', async () => {
    try {
      const ed = vs.window.activeTextEditor;
      if (!ed) return;
      const sel = _getSel(ed.document);
      if (!sel) {
        vs.window.showWarningMessage('请先选中要包裹的内容');
        return;
      }
      const items = ['LinearLayout', 'ConstraintLayout', 'FrameLayout', 'ScrollView'];
      const pick = await vs.window.showQuickPick(items, { placeHolder: '选择包裹布局' });
      if (!pick) return;
      const attrs = pick === 'LinearLayout' ? ' android:orientation="vertical"' : '';
      const wrapped = `<${pick}\n    android:layout_width="match_parent"\n    android:layout_height="wrap_content"${attrs}>\n    ${sel.trim().split('\n').join('\n    ')}\n</${pick}>`;
      _replaceSel(ed.document, wrapped);
      vs.window.showInformationMessage(`已包裹为 ${pick}`);
    } catch (e) {
      Logger.error('command wrapWithLayout failed', e);
      vs.window.showErrorMessage('包裹布局失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.unwrapLayout', async () => {
    try {
      const ed = vs.window.activeTextEditor;
      if (!ed) return;
      const sel = _getSel(ed.document);
      if (!sel) {
        vs.window.showWarningMessage('请先选中要解包的布局');
        return;
      }
      const inner = sel.replace(/<\w+[^>]*>\s*/, '').replace(/\s*<\/\w+>\s*$/, '');
      _replaceSel(ed.document, inner);
      vs.window.showInformationMessage('已解包布局');
    } catch (e) {
      Logger.error('command unwrapLayout failed', e);
      vs.window.showErrorMessage('解包布局失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.showPerformancePanel', async () => {
    try {
      const ed = vs.window.activeTextEditor;
      if (!ed || !ed.document.uri.path.endsWith('.xml')) {
        vs.window.showWarningMessage('请先打开布局XML文件');
        return;
      }
      const xml = ed.document.getText();
      const p = vs.window.createWebviewPanel('androidPerfPanel', '性能分析', { viewColumn: vs.ViewColumn.Beside, preserveFocus: true }, { enableScripts: true });
      p.webview.html = _perfHtml(xml);
    } catch (e) {
      Logger.error('command showPerformancePanel failed', e);
      vs.window.showErrorMessage('显示性能面板失败: ' + e.message);
    }
  }));

  ctx.subscriptions.push(vs.commands.registerCommand('androidLayoutEditor.convertH5ToXml', async () => {
    const ed = vs.window.activeTextEditor;
    if (!ed) {
      vs.window.showWarningMessage('请先打开HTML文件');
      return;
    }
    const doc = ed.document;
    if (!doc.uri.path.endsWith('.html') && !doc.uri.path.endsWith('.htm')) {
      vs.window.showWarningMessage('仅支持HTML文件');
      return;
    }
    const html = doc.getText();
    vs.window.withProgress({ location: vs.ProgressLocation.Notification, title: '正在转换 H5 → Android XML...' }, async () => {
      try {
        const h5Converter = require('../h5-converter');
        const xml = h5Converter.convert(html);
        const wf = vs.workspace.workspaceFolders;
        if (!wf) {
          vs.window.showErrorMessage('请先打开工作区');
          return;
        }
        const baseName = path.basename(doc.uri.fsPath, path.extname(doc.uri.fsPath));
        const layoutName = baseName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        const ld = vs.Uri.joinPath(wf[0].uri, 'res', 'layout');
        const fu = vs.Uri.joinPath(ld, layoutName + '.xml');
        try {
          await vs.workspace.fs.createDirectory(ld);
        } catch (e) { }
        await vs.workspace.fs.writeFile(fu, new TextEncoder().encode(xml));
        await vs.commands.executeCommand('vscode.openWith', fu, ALE + '.layoutEditor');
        vs.window.showInformationMessage(`H5 转换完成: res/layout/${layoutName}.xml`);
      } catch (e) {
        vs.window.showErrorMessage('转换失败: ' + e.message);
      }
    });
  }));
}

module.exports = { registerCommands };
