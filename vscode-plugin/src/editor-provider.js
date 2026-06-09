const vscode = require('vscode');
const vs = vscode;
const path = require('path');
const { Logger } = require('./logger');
const { ALE, AA, AW, LT, XAP } = require('./constants');
const { DM } = require('./device-manager');

class EP {
  constructor(ctx) {
    this.ctx = ctx;
    this.dm = new DM();
    this.xv = null;
    this._eu = new Map();
    this._mp = path.join(ctx.extensionPath, 'media');
  }
  setV(v) {
    this.xv = v;
  }
  async resolveCustomEditor(doc, wv, _t) {
    try {
      const uri = doc.uri;
      this._eu.set(wv, uri);
      wv.webview.options = { enableScripts: true, enableForms: false, localResourceRoots: [vs.Uri.file(this._mp)] };
      wv.webview.html = this._html(doc.getText(), wv.webview);
      this._msg(wv, doc);
      const cs = vs.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === uri.toString() && e.document !== doc) {
          wv.webview.postMessage({ command: 'documentChanged', xml: e.document.getText() });
        }
      });
      if (this.xv) this.xv.validate(doc);
      wv.onDidDispose(() => {
        cs.dispose();
        this._eu.delete(wv);
      });
    } catch (e) {
      Logger.error('resolveCustomEditor failed', e);
      vs.window.showErrorMessage('LayoutEditor: 无法打开编辑器 - ' + e.message);
    }
  }
  async saveCustomDocument() {
    return { success: true };
  }
  async revertCustomDocument(doc) {
    try {
      const c = await vs.workspace.fs.readFile(doc.uri);
      const t = new TextDecoder().decode(c);
      const ed = new vs.WorkspaceEdit();
      ed.replace(doc.uri, new vs.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), t);
      await vs.workspace.applyEdit(ed);
    } catch (e) {
      Logger.error('revertCustomDocument failed', e);
      vs.window.showErrorMessage('LayoutEditor: 恢复文档失败 - ' + e.message);
    }
  }
  async backupCustomDocument(doc) {
    try {
      const c = await vs.workspace.fs.readFile(doc.uri);
      return { id: c, delete: () => { } };
    } catch (e) {
      Logger.error('backupCustomDocument failed', e);
      vs.window.showErrorMessage('LayoutEditor: 备份文档失败 - ' + e.message);
      return { id: null, delete: () => { } };
    }
  }
  _msg(wv, doc) {
    wv.webview.onDidReceiveMessage(async m => {
      try {
        if (!m || typeof m !== 'object' || !m.command) {
          Logger.warn('invalid message received', m);
          return;
        }
        await this._handle(m, wv, doc);
      } catch (e) {
        Logger.error('_msg handler failed', e);
        vs.window.showErrorMessage('LayoutEditor: 消息处理失败 - ' + e.message);
      }
    });
  }
  async _handle(m, wv, doc) {
    const uri = doc.uri;
    switch (m.command) {
      case 'updateXml': {
        try {
          const ed = new vs.WorkspaceEdit();
          ed.replace(uri, new vs.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), m.xml);
          await vs.workspace.applyEdit(ed);
          await doc.save();
          if (this.xv) this.xv.validate(doc);
        } catch (e) {
          Logger.error('handle updateXml failed', e);
          vs.window.showErrorMessage('更新XML失败: ' + e.message);
        }
        break;
      }
      case 'openCode': {
        try {
          await vs.commands.executeCommand('vscode.open', uri);
        } catch (e) {
          Logger.error('handle openCode failed', e);
          vs.window.showErrorMessage('打开代码失败: ' + e.message);
        }
        break;
      }
      case 'toggleBounds': {
        try {
          const cfg = vs.workspace.getConfiguration(ALE);
          const cur = cfg.get('showBounds', false);
          await cfg.update('showBounds', !cur, true);
          wv.webview.postMessage({ command: 'boundsToggled', showBounds: !cur });
        } catch (e) {
          Logger.error('handle toggleBounds failed', e);
        }
        break;
      }
      case 'showInspector': {
        try {
          wv.webview.postMessage({ command: 'toggleInspector', show: true });
        } catch (e) {
          Logger.error('handle showInspector failed', e);
        }
        break;
      }
      case 'setDevice': {
        try {
          if (m.preset) this.dm.setDev(m.preset);
          if (m.density) this.dm.setDn(m.density);
          if (m.theme) this.dm.setTh(m.theme);
          wv.webview.postMessage({ command: 'deviceConfigChanged', config: this.dm.getCfg() });
        } catch (e) {
          Logger.error('handle setDevice failed', e);
        }
        break;
      }
      case 'getDeviceConfig': {
        try {
          wv.webview.postMessage({ command: 'deviceConfigChanged', config: this.dm.getCfg() });
        } catch (e) {
          Logger.error('handle getDeviceConfig failed', e);
        }
        break;
      }
      case 'handleDrop': {
        try {
          await this._drop(m, wv, doc);
        } catch (e) {
          Logger.error('handle handleDrop failed', e);
          vs.window.showErrorMessage('处理拖放失败: ' + e.message);
        }
        break;
      }
      case 'getAttrs': {
        try {
          wv.webview.postMessage({ command: 'attrsData', attrs: AA });
        } catch (e) {
          Logger.error('handle getAttrs failed', e);
        }
        break;
      }
      case 'getWidgets': {
        try {
          wv.webview.postMessage({ command: 'widgetsData', widgets: AW });
        } catch (e) {
          Logger.error('handle getWidgets failed', e);
        }
        break;
      }
      case 'exportImage': {
        try {
          await this._export(m, wv, doc);
        } catch (e) {
          Logger.error('handle exportImage failed', e);
          vs.window.showErrorMessage('导出失败: ' + e.message);
        }
        break;
      }
      case 'alert': {
        try {
          vs.window.showInformationMessage(m.text);
        } catch (e) {
          Logger.error('handle alert failed', e);
        }
        break;
      }
      case 'error': {
        try {
          vs.window.showErrorMessage(m.text);
        } catch (e) {
          Logger.error('handle error failed', e);
        }
        break;
      }
      default: {
        Logger.warn('unknown command', m.command);
        break;
      }
    }
  }
  async _drop(m, wv, doc) {
    const du = m.uri;
    if (!du) return;
    const u = vs.Uri.parse(du);
    const ext = u.path.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      const fn = u.path.split('/').pop();
      const rn = '@drawable/' + fn.replace(/\.[^.]+$/, '');
      wv.webview.postMessage({ command: 'insertImageResource', resourceName: rn, fileName: fn });
    } else if (ext === 'xml') {
      const fn = u.path.split('/').pop();
      const ln = fn.replace('.xml', '');
      wv.webview.postMessage({ command: 'insertInclude', layout: '@layout/' + ln, fileName: fn });
    }
  }
  async _export(m, wv, doc) {
    const b64 = m.imageData;
    if (!b64) {
      vs.window.showErrorMessage('导出失败:无数据');
      return;
    }
    try {
      const wf = vs.workspace.workspaceFolders;
      if (!wf) {
        vs.window.showErrorMessage('导出失败：请先打开工作区');
        return;
      }
      const ed = vs.Uri.joinPath(wf[0].uri, 'layout-exports');
      try {
        await vs.workspace.fs.createDirectory(ed);
      } catch (e) { }
      const dn = path.basename(doc.uri.fsPath, '.xml') || 'layout';
      const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const fn = dn + '_' + ts + '.png';
      const fu = vs.Uri.joinPath(ed, fn);
      const buf = Buffer.from(b64, 'base64');
      await vs.workspace.fs.writeFile(fu, buf);
      vs.window.showInformationMessage('已导出:layout-exports/' + fn, '打开文件').then(s => {
        if (s === '打开文件') vs.commands.executeCommand('vscode.open', fu);
      });
    } catch (e) {
      vs.window.showErrorMessage('导出失败:' + e.message);
    }
  }
  _html(xml, wv) {
    const su = wv.asWebviewUri(vs.Uri.file(path.join(this._mp, 'style.css')));
    const sc = wv.asWebviewUri(vs.Uri.file(path.join(this._mp, 'app.js')));
    const cfg = vs.workspace.getConfiguration(ALE);
    const dc = this.dm.getCfg();
    const m3c = cfg.get('m3SeedColor', '#6750A4');
    const mp = cfg.get('multiPreview', false);
    const ij = JSON.stringify({ xmlContent: xml, showBounds: cfg.get('showBounds', false), deviceConfig: dc, attrsDict: AA, widgetsData: AW, templatesData: LT, m3SeedColor: m3c, multiPreview: mp });
    const csp = "default-src 'none'; style-src " + wv.cspSource + "; script-src " + wv.cspSource + "; img-src data: blob:;";
    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>Android Layout Editor v2.14.0</title><link rel="stylesheet" href="${su}"></head><body><div class="toolbar"><div class="toolbar-brand"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>Layout Editor<span style="font-size:10px;color:var(--text-muted);font-weight:400;margin-left:4px;">v2.14.0</span></div><div class="toolbar-divider"></div><button class="toolbar-btn" onclick="postMsg({command:'openCode'})" title="打开代码"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>打开代码</button><div class="toolbar-divider"></div><button class="toolbar-btn" id="btnBounds" onclick="postMsg({command:'toggleBounds'})" title="边界"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/></svg>边界</button><button class="toolbar-btn" id="btnInspector" onclick="postMsg({command:'showInspector'})" title="Layout Inspector"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>Inspector</button><div class="toolbar-divider"></div><button class="toolbar-btn" id="btnExport" onclick="exportToImage()" title="导出为图片"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>导出</button><div class="toolbar-spacer"></div><span style="font-size:11px;color:var(--text-muted);" id="deviceLabel">Pixel 7</span></div><div class="device-bar"><label>设备:</label><select id="deviceSelect" onchange="postMsg({command:'setDevice',preset:this.value})"><option value="pixel-7">Pixel 7</option><option value="pixel-7a">Pixel 7a</option><option value="galaxy-s23">Galaxy S23</option><option value="galaxy-s23-ultra">Galaxy S23 Ultra</option><option value="iphone-15">iPhone 15</option><option value="ipad-air">iPad Air</option><option value="small-phone">Small Phone</option><option value="tablet-10">10" Tablet</option></select><label>密度:</label><select id="densitySelect" onchange="postMsg({command:'setDevice',density:this.value})"><option value="ldpi">ldpi (0.75x)</option><option value="mdpi">mdpi (1x)</option><option value="hdpi">hdpi (1.5x)</option><option value="xhdpi">xhdpi (2x)</option><option value="xxhdpi" selected>xxhdpi (3x)</option><option value="xxxhdpi">xxxhdpi (4x)</option></select><label>主题:</label><select id="themeSelect" onchange="postMsg({command:'setDevice',theme:this.value})"><option value="light">Light</option><option value="dark">Dark</option><option value="material_you">Material You</option></select><label>M3:</label><input type="color" id="m3ColorPicker" value="${m3c}" onchange="postMsg({command:'setDevice',m3Seed:this.value});updateM3Color(this.value)" title="Material 3 Seed Color"><button id="btnMultiPreview" class="toolbar-btn" onclick="toggleMultiPreview()" title="多屏预览">多屏</button></div><div class="main-container"><div class="panel-left" id="panelLeft"><div class="panel-section"><div class="panel-header"><span>组件树</span><span class="section-arrow">&#9660;</span></div><div class="tree-container" id="componentTree"></div></div><div class="panel-section" style="border-top:1px solid var(--border);"><div class="panel-header"><span>组件库</span><span class="section-arrow">&#9660;</span></div><div class="component-search"><input type="text" placeholder="搜索..." id="compSearch" oninput="filterComponents(this.value)"/></div><div class="component-list" id="componentList"></div></div><div class="panel-section" style="border-top:1px solid var(--border);"><div class="panel-header"><span>模板</span><span class="section-arrow">&#9660;</span></div><div class="template-list" id="templateList"></div></div></div><div class="panel-center"><div class="center-tabs"><div class="tab-panel-toggle" onclick="togglePanel('left')" title="折叠/展开左侧"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></div><div class="tab-spacer"></div><div class="center-tab active" data-tab="design" onclick="switchTab('design')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>设计</div><div class="center-tab" data-tab="code" onclick="switchTab('code')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>代码</div><div class="tab-spacer"></div><div class="tab-panel-toggle" onclick="togglePanel('right')" title="折叠/展开右侧"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg></div></div><div class="canvas-area" id="canvasArea" ondragover="event.preventDefault();document.getElementById('dropZone').classList.add('active')" ondragleave="document.getElementById('dropZone').classList.remove('active')" ondrop="handleDrop(event)"><div id="singlePreview"><div class="phone-frame" id="phoneFrame"><div class="phone-statusbar"><span>9:41</span><div class="phone-notch"></div><span style="font-size:11px;">&#x1F4F1;&#x1F50B;</span></div><div class="phone-content" id="phoneContent"></div></div></div><div id="multiPreview" style="display:none;"></div><div class="drop-zone" id="dropZone">拖放资源</div><div class="inspector-overlay" id="inspectorOverlay"></div></div><div class="code-area" id="codeArea"><textarea class="code-textarea" id="codeEditor" spellcheck="false" oninput="onCodeInput()"></textarea></div></div><div class="panel-right" id="panelRight"><div class="panel-section"><div class="panel-header"><span>属性</span><span class="section-arrow">&#9660;</span></div><div class="props-empty" id="propsEmpty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg><span>选择组件编辑属性</span></div><div class="props-content" id="propsContent" style="display:none;"></div></div></div></div><div class="statusbar"><div class="dot"></div><span id="statusText">就绪</span><span class="status-sep">|</span><span id="statusComponents">组件:0</span><span class="status-sep">|</span><span id="statusDevice">Pixel 7 (xxhdpi)</span><span class="status-sep">|</span><span id="statusTheme">Light</span><span style="flex:1"></span><span>Android Layout Editor v2.14.0</span></div><div class="toast-container" id="toastContainer"></div><script>window.INITIAL_DATA=${ij};</script><script src="${sc}"></script></body></html>`;
  }
}

module.exports = { EP };
