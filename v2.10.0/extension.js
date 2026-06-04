// ============================================================================
// Android XML Layout Visual Editor - VS Code Extension
// Version: v2.10.0
// Description: Deep VS Code integration with CustomEditorProvider, XML validation,
//              attribute completion, resource drag-drop, layout bounds visualization,
//              device preview, and Layout Inspector.
// ============================================================================

const vscode = require('vscode');

// ============================================================================
// ANDROID_ATTRS - Complete Android XML attribute dictionary
// ============================================================================
const ANDROID_ATTRS = {
  // Layout Params
  layout_width: { type: 'enum', values: ['match_parent', 'wrap_content', '100dp', '200dp'], desc: '宽度' },
  layout_height: { type: 'enum', values: ['match_parent', 'wrap_content', '100dp', '200dp'], desc: '高度' },
  layout_margin: { type: 'dimension', desc: '外边距' },
  layout_marginTop: { type: 'dimension', desc: '顶部外边距' },
  layout_marginBottom: { type: 'dimension', desc: '底部外边距' },
  layout_marginLeft: { type: 'dimension', desc: '左侧外边距' },
  layout_marginRight: { type: 'dimension', desc: '右侧外边距' },
  layout_marginStart: { type: 'dimension', desc: '起始外边距' },
  layout_marginEnd: { type: 'dimension', desc: '结束外边距' },
  layout_padding: { type: 'dimension', desc: '内边距' },
  layout_weight: { type: 'float', desc: '权重' },
  layout_gravity: { type: 'enum', values: ['top', 'bottom', 'left', 'right', 'center', 'center_vertical', 'center_horizontal', 'start', 'end'], desc: '布局对齐' },
  // Common
  id: { type: 'id', desc: '组件ID' },
  background: { type: 'color|reference', desc: '背景' },
  padding: { type: 'dimension', desc: '内边距' },
  paddingTop: { type: 'dimension', desc: '顶部内边距' },
  paddingBottom: { type: 'dimension', desc: '底部内边距' },
  paddingLeft: { type: 'dimension', desc: '左侧内边距' },
  paddingRight: { type: 'dimension', desc: '右侧内边距' },
  visibility: { type: 'enum', values: ['visible', 'invisible', 'gone'], desc: '可见性' },
  alpha: { type: 'float', desc: '透明度' },
  elevation: { type: 'dimension', desc: '阴影高度' },
  rotation: { type: 'float', desc: '旋转角度' },
  scaleX: { type: 'float', desc: 'X轴缩放' },
  scaleY: { type: 'float', desc: 'Y轴缩放' },
  // TextView
  text: { type: 'string', desc: '文本内容' },
  textSize: { type: 'dimension', desc: '文字大小' },
  textColor: { type: 'color', desc: '文字颜色' },
  hint: { type: 'string', desc: '提示文本' },
  textColorHint: { type: 'color', desc: '提示颜色' },
  textAlignment: { type: 'enum', values: ['inherit', 'gravity', 'center', 'textStart', 'textEnd', 'viewStart', 'viewEnd'], desc: '文本对齐' },
  maxLines: { type: 'integer', desc: '最大行数' },
  singleLine: { type: 'boolean', desc: '单行模式' },
  ellipsize: { type: 'enum', values: ['start', 'middle', 'end', 'marquee'], desc: '省略方式' },
  textStyle: { type: 'enum', values: ['normal', 'bold', 'italic', 'bold|italic'], desc: '文字样式' },
  // Button
  clickable: { type: 'boolean', desc: '可点击' },
  enabled: { type: 'boolean', desc: '启用状态' },
  // EditText
  inputType: { type: 'enum', values: ['text', 'textPassword', 'number', 'phone', 'textEmailAddress', 'textUri', 'textMultiLine', 'numberPassword', 'numberSigned', 'numberDecimal'], desc: '输入类型' },
  imeOptions: { type: 'enum', values: ['actionDone', 'actionGo', 'actionNext', 'actionSearch', 'actionSend', 'actionNone', 'flagNoExtractUi'], desc: '输入法选项' },
  // ImageView
  src: { type: 'reference', desc: '图片资源' },
  scaleType: { type: 'enum', values: ['center', 'centerCrop', 'centerInside', 'fitCenter', 'fitXY', 'fitStart', 'fitEnd', 'matrix'], desc: '缩放类型' },
  contentDescription: { type: 'string', desc: '内容描述' },
  // CheckBox/RadioButton/Switch
  checked: { type: 'boolean', desc: '选中状态' },
  // LinearLayout
  orientation: { type: 'enum', values: ['vertical', 'horizontal'], desc: '方向' },
  gravity: { type: 'enum', values: ['top', 'bottom', 'left', 'right', 'center', 'center_vertical', 'center_horizontal', 'start', 'end', 'clip_vertical', 'clip_horizontal'], desc: '对齐方式' },
  // ConstraintLayout
  layout_constraintLeft_toLeftOf: { type: 'id', desc: '左侧约束到' },
  layout_constraintLeft_toRightOf: { type: 'id', desc: '左侧约束到右侧' },
  layout_constraintRight_toLeftOf: { type: 'id', desc: '右侧约束到左侧' },
  layout_constraintRight_toRightOf: { type: 'id', desc: '右侧约束到右侧' },
  layout_constraintTop_toTopOf: { type: 'id', desc: '顶部约束到' },
  layout_constraintTop_toBottomOf: { type: 'id', desc: '顶部约束到底部' },
  layout_constraintBottom_toTopOf: { type: 'id', desc: '底部约束到顶部' },
  layout_constraintBottom_toBottomOf: { type: 'id', desc: '底部约束到底部' },
  layout_constraintStart_toStartOf: { type: 'id', desc: '起始约束到' },
  layout_constraintStart_toEndOf: { type: 'id', desc: '起始约束到结束' },
  layout_constraintEnd_toStartOf: { type: 'id', desc: '结束约束到起始' },
  layout_constraintEnd_toEndOf: { type: 'id', desc: '结束约束到结束' },
  layout_constraintHorizontal_bias: { type: 'float', desc: '水平偏移' },
  layout_constraintVertical_bias: { type: 'float', desc: '垂直偏移' },
  // ProgressBar
  max: { type: 'integer', desc: '最大值' },
  progress: { type: 'integer', desc: '当前进度' },
  // ScrollView
  scrollX: { type: 'dimension', desc: '水平滚动偏移' },
  scrollY: { type: 'dimension', desc: '垂直滚动偏移' },
  fillViewport: { type: 'boolean', desc: '填充视口' },
};

// ============================================================================
// DEVICE_PRESETS - Device configuration dictionary
// ============================================================================
const DEVICE_PRESETS = {
  'pixel-7': { name: 'Pixel 7', width: 1080, height: 2400, density: 'xxhdpi', scale: 3 },
  'pixel-7a': { name: 'Pixel 7a', width: 1080, height: 2400, density: 'xxhdpi', scale: 3 },
  'galaxy-s23': { name: 'Galaxy S23', width: 1080, height: 2340, density: 'xxhdpi', scale: 3 },
  'galaxy-s23-ultra': { name: 'Galaxy S23 Ultra', width: 1440, height: 3088, density: 'xxxhdpi', scale: 4 },
  'iphone-15': { name: 'iPhone 15', width: 1179, height: 2556, density: 'xxxhdpi', scale: 3 },
  'ipad-air': { name: 'iPad Air', width: 1640, height: 2360, density: 'xhdpi', scale: 2 },
  'small-phone': { name: 'Small Phone', width: 720, height: 1280, density: 'hdpi', scale: 2 },
  'tablet-10': { name: '10" Tablet', width: 1280, height: 800, density: 'mdpi', scale: 1 },
};

// ============================================================================
// DENSITY_SCALE - Density to scale factor mapping
// ============================================================================
const DENSITY_SCALE = {
  'ldpi': 0.75,
  'mdpi': 1,
  'hdpi': 1.5,
  'xhdpi': 2,
  'xxhdpi': 3,
  'xxxhdpi': 4,
};

// ============================================================================
// ANDROID_WIDGETS - Widget type definitions for the component palette
// ============================================================================
const ANDROID_WIDGETS = {
  layouts: [
    { tag: 'LinearLayout', label: 'LinearLayout', icon: 'layout-linear', desc: '线性布局' },
    { tag: 'ConstraintLayout', label: 'ConstraintLayout', icon: 'layout-constraint', desc: '约束布局' },
    { tag: 'FrameLayout', label: 'FrameLayout', icon: 'layout-frame', desc: '帧布局' },
    { tag: 'RelativeLayout', label: 'RelativeLayout', icon: 'layout-relative', desc: '相对布局' },
    { tag: 'ScrollView', label: 'ScrollView', icon: 'scroll', desc: '滚动视图' },
    { tag: 'HorizontalScrollView', label: 'HorizontalScrollView', icon: 'scroll-h', desc: '水平滚动视图' },
  ],
  widgets: [
    { tag: 'TextView', label: 'TextView', icon: 'text', desc: '文本视图' },
    { tag: 'Button', label: 'Button', icon: 'button', desc: '按钮' },
    { tag: 'EditText', label: 'EditText', icon: 'edittext', desc: '编辑框' },
    { tag: 'ImageView', label: 'ImageView', icon: 'image', desc: '图片视图' },
    { tag: 'ImageButton', label: 'ImageButton', icon: 'image-btn', desc: '图片按钮' },
    { tag: 'CheckBox', label: 'CheckBox', icon: 'checkbox', desc: '复选框' },
    { tag: 'RadioButton', label: 'RadioButton', icon: 'radio', desc: '单选按钮' },
    { tag: 'Switch', label: 'Switch', icon: 'switch', desc: '开关' },
    { tag: 'ProgressBar', label: 'ProgressBar', icon: 'progress', desc: '进度条' },
    { tag: 'SeekBar', label: 'SeekBar', icon: 'seekbar', desc: '滑动条' },
    { tag: 'Spinner', label: 'Spinner', icon: 'spinner', desc: '下拉列表' },
    { tag: 'RecyclerView', label: 'RecyclerView', icon: 'recycler', desc: '列表视图' },
  ],
  containers: [
    { tag: 'CardView', label: 'CardView', icon: 'card', desc: '卡片视图' },
    { tag: 'include', label: 'include', icon: 'include', desc: '包含布局' },
    { tag: 'merge', label: 'merge', icon: 'merge', desc: '合并布局' },
    { tag: 'ViewStub', label: 'ViewStub', icon: 'stub', desc: '视图存根' },
  ],
};

// ============================================================================
// LEAF_WIDGETS - Widgets that cannot contain child views
// ============================================================================
const LEAF_WIDGETS = new Set([
  'TextView', 'Button', 'EditText', 'ImageView', 'ImageButton',
  'CheckBox', 'RadioButton', 'Switch', 'ProgressBar', 'SeekBar',
  'Spinner', 'ViewStub', 'View',
]);

// ============================================================================
// XMLValidator - XML validation logic
// ============================================================================
class XMLValidator {
  constructor(diagnosticCollection) {
    this.diagnosticCollection = diagnosticCollection;
  }

  /**
   * Validate an Android layout XML document
   * @param {vscode.TextDocument} document
   */
  validate(document) {
    const diagnostics = [];
    const text = document.getText();
    const uri = document.uri;

    try {
      // Parse XML manually (no DOMParser in Node.js without extra deps)
      this._validateXmlStructure(text, document, diagnostics);
      this._validateRequiredAttributes(text, document, diagnostics);
      this._validateAttributeValues(text, document, diagnostics);
      this._validateNestingRules(text, document, diagnostics);
    } catch (e) {
      // Silently ignore parse errors for partial documents
    }

    this.diagnosticCollection.set(uri, diagnostics);
  }

  /**
   * Validate basic XML structure
   */
  _validateXmlStructure(text, document, diagnostics) {
    const lines = text.split('\n');
    let hasXmlDecl = false;
    let hasRootTag = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('<?xml')) {
        hasXmlDecl = true;
        if (!line.includes('encoding="utf-8"') && !line.includes("encoding='utf-8'")) {
          const col = line.indexOf('<?xml');
          diagnostics.push(this._createDiagnostic(
            document, i, col, col + 5,
            vscode.DiagnosticSeverity.Warning,
            '建议使用 encoding="utf-8" 编码声明'
          ));
        }
      }
      if (line.startsWith('<') && !line.startsWith('<?') && !line.startsWith('<!--')) {
        hasRootTag = true;
      }
    }

    if (!hasXmlDecl) {
      diagnostics.push(this._createDiagnostic(
        document, 0, 0, 0,
        vscode.DiagnosticSeverity.Warning,
        '缺少 XML 声明 <?xml version="1.0" encoding="utf-8"?>'
      ));
    }

    if (!hasRootTag) {
      diagnostics.push(this._createDiagnostic(
        document, 0, 0, 0,
        vscode.DiagnosticSeverity.Error,
        'XML 文档缺少根元素'
      ));
    }
  }

  /**
   * Validate required attributes (layout_width, layout_height) on all views
   */
  _validateRequiredAttributes(text, document, diagnostics) {
    const tagRegex = /<(LinearLayout|ConstraintLayout|FrameLayout|RelativeLayout|ScrollView|HorizontalScrollView|TextView|Button|EditText|ImageView|ImageButton|CheckBox|RadioButton|Switch|ProgressBar|SeekBar|Spinner|RecyclerView|CardView|View|ViewStub|include|merge)(\s|>)/g;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      const tagName = match[1];
      if (tagName === 'include' || tagName === 'merge') continue;

      const startPos = match.index;
      const line = document.positionAt(startPos).line;

      // Find the closing > of this tag
      const tagEnd = text.indexOf('>', startPos);
      if (tagEnd === -1) continue;
      const tagContent = text.substring(startPos, tagEnd);

      // Check for self-closing or proper close
      const isSelfClosing = text[tagEnd - 1] === '/';

      if (!tagContent.includes('layout_width')) {
        const col = document.positionAt(startPos).character;
        diagnostics.push(this._createDiagnostic(
          document, line, col, col + tagName.length,
          vscode.DiagnosticSeverity.Error,
          `<${tagName}> 缺少必需属性 android:layout_width`
        ));
      }

      if (!tagContent.includes('layout_height')) {
        const col = document.positionAt(startPos).character;
        diagnostics.push(this._createDiagnostic(
          document, line, col, col + tagName.length,
          vscode.DiagnosticSeverity.Error,
          `<${tagName}> 缺少必需属性 android:layout_height`
        ));
      }
    }
  }

  /**
   * Validate attribute values
   */
  _validateAttributeValues(text, document, diagnostics) {
    // Check layout_width and layout_height values
    const sizeAttrRegex = /android:(layout_width|layout_height)="([^"]+)"/g;
    let match;
    while ((match = sizeAttrRegex.exec(text)) !== null) {
      const attrName = match[1];
      const attrValue = match[2];
      const validValues = ['match_parent', 'wrap_content'];
      const isValidEnum = validValues.includes(attrValue);
      const isValidDimension = /^\d+(\.\d+)?dp$/.test(attrValue) || /^\d+(\.\d+)?px$/.test(attrValue) || /^\d+(\.\d+)?sp$/.test(attrValue) || /^\d+(\.\d+)?pt$/.test(attrValue) || /^\d+(\.\d+)?mm$/.test(attrValue) || /^\d+(\.\d+)?in$/.test(attrValue);

      if (!isValidEnum && !isValidDimension) {
        const pos = document.positionAt(match.index);
        diagnostics.push(this._createDiagnostic(
          document, pos.line, pos.character, pos.character + match[0].length,
          vscode.DiagnosticSeverity.Warning,
          `android:${attrName}="${attrValue}" 的值无效，应为 match_parent、wrap_content 或具体尺寸（如 100dp）`
        ));
      }
    }

    // Check visibility values
    const visibilityRegex = /android:visibility="([^"]+)"/g;
    while ((match = visibilityRegex.exec(text)) !== null) {
      const validVis = ['visible', 'invisible', 'gone'];
      if (!validVis.includes(match[1])) {
        const pos = document.positionAt(match.index);
        diagnostics.push(this._createDiagnostic(
          document, pos.line, pos.character, pos.character + match[0].length,
          vscode.DiagnosticSeverity.Warning,
          `android:visibility="${match[1]}" 的值无效，应为 visible、invisible 或 gone`
        ));
      }
    }

    // Check orientation values
    const orientRegex = /android:orientation="([^"]+)"/g;
    while ((match = orientRegex.exec(text)) !== null) {
      if (!['vertical', 'horizontal'].includes(match[1])) {
        const pos = document.positionAt(match.index);
        diagnostics.push(this._createDiagnostic(
          document, pos.line, pos.character, pos.character + match[0].length,
          vscode.DiagnosticSeverity.Warning,
          `android:orientation="${match[1]}" 的值无效，应为 vertical 或 horizontal`
        ));
      }
    }
  }

  /**
   * Validate nesting rules (leaf widgets cannot contain children)
   */
  _validateNestingRules(text, document, diagnostics) {
    // Simple check: find leaf widget tags that have children
    for (const leafTag of LEAF_WIDGETS) {
      const openRegex = new RegExp(`<${leafTag}(\\s[^>]*)?>[\\s\\S]*?<\\w+`, 'g');
      let match;
      while ((match = openRegex.exec(text)) !== null) {
        const pos = document.positionAt(match.index);
        diagnostics.push(this._createDiagnostic(
          document, pos.line, pos.character, pos.character + leafTag.length + 1,
          vscode.DiagnosticSeverity.Error,
          `<${leafTag}> 是叶子组件，不能包含子 View`
        ));
      }
    }
  }

  /**
   * Helper to create a Diagnostic object
   */
  _createDiagnostic(document, line, startCol, endCol, severity, message) {
    const range = new vscode.Range(line, startCol, line, endCol);
    return new vscode.Diagnostic(range, message, severity);
  }
}

// ============================================================================
// DeviceManager - Device configuration management
// ============================================================================
class DeviceManager {
  constructor() {
    this.currentDevice = 'pixel-7';
    this.currentDensity = 'xxhdpi';
    this.currentTheme = 'light';
  }

  /**
   * Get current device preset
   */
  getCurrentDevice() {
    return DEVICE_PRESETS[this.currentDevice] || DEVICE_PRESETS['pixel-7'];
  }

  /**
   * Set device by preset key
   */
  setDevice(presetKey) {
    if (DEVICE_PRESETS[presetKey]) {
      this.currentDevice = presetKey;
      this.currentDensity = DEVICE_PRESETS[presetKey].density;
      return true;
    }
    return false;
  }

  /**
   * Set density independently
   */
  setDensity(density) {
    if (DENSITY_SCALE[density]) {
      this.currentDensity = density;
      return true;
    }
    return false;
  }

  /**
   * Set theme
   */
  setTheme(theme) {
    if (['light', 'dark', 'material_you'].includes(theme)) {
      this.currentTheme = theme;
      return true;
    }
    return false;
  }

  /**
   * Get all available presets
   */
  getAllPresets() {
    return DEVICE_PRESETS;
  }

  /**
   * Get all available densities
   */
  getAllDensities() {
    return Object.keys(DENSITY_SCALE);
  }

  /**
   * Get all available themes
   */
  getAllThemes() {
    return [
      { key: 'light', label: 'Light' },
      { key: 'dark', label: 'Dark' },
      { key: 'material_you', label: 'Material You' },
    ];
  }

  /**
   * Get device config for Webview
   */
  getDeviceConfig() {
    const device = this.getCurrentDevice();
    return {
      preset: this.currentDevice,
      name: device.name,
      width: device.width,
      height: device.height,
      density: this.currentDensity,
      scale: DENSITY_SCALE[this.currentDensity] || device.scale,
      theme: this.currentTheme,
    };
  }
}

// ============================================================================
// LayoutEditorProvider - Custom Editor Provider (Phase 1)
// ============================================================================
class LayoutEditorProvider {
  constructor(context) {
    this.context = context;
    this.deviceManager = new DeviceManager();
    this.xmlValidator = null;
    this._editorUris = new Map(); // webviewPanel -> uri
  }

  /**
   * Set the XML validator (called from activate)
   */
  setValidator(validator) {
    this.xmlValidator = validator;
  }

  /**
   * resolveCustomEditor - Required by CustomEditorProvider
   */
  async resolveCustomEditor(document, webviewPanel, _token) {
    const uri = document.uri;
    this._editorUris.set(webviewPanel, uri);

    webviewPanel.webview.options = {
      enableScripts: true,
      enableForms: false,
      localResourceRoots: [], // No external media files - all inline
    };

    const xmlContent = document.getText();
    webviewPanel.webview.html = this.getWebviewHTML(xmlContent);

    // Setup message handling
    this._setupWebviewMessageHandling(webviewPanel, document);

    // Listen for document changes from VS Code text editors -> push to webview
    const changeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === uri.toString() && e.document !== document) {
        webviewPanel.webview.postMessage({
          command: 'documentChanged',
          xml: e.document.getText(),
        });
      }
    });

    // Run initial validation
    if (this.xmlValidator) {
      this.xmlValidator.validate(document);
    }

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose();
      this._editorUris.delete(webviewPanel);
    });
  }

  /**
   * saveCustomDocument - Save via WorkspaceEdit
   */
  async saveCustomDocument(document, cancellation) {
    // The document is already up to date via WorkspaceEdit operations
    return { success: true };
  }

  /**
   * revertCustomDocument - Revert to disk content
   */
  async revertCustomDocument(document, cancellation) {
    // Read from disk using vscode.workspace.fs
    const content = await vscode.workspace.fs.readFile(document.uri);
    const text = new TextDecoder().decode(content);
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(document.uri, fullRange, text);
    await vscode.workspace.applyEdit(edit);
  }

  /**
   * backupCustomDocument - Backup using vscode.workspace.fs
   */
  async backupCustomDocument(document, context, cancellation) {
    const content = await vscode.workspace.fs.readFile(document.uri);
    // Return the backup ID (content as buffer)
    return { id: content, delete: () => { /* no-op */ } };
  }

  /**
   * Setup webview message handling - unified dispatcher
   */
  _setupWebviewMessageHandling(webviewPanel, document) {
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      await this.handleWebviewMessage(message, webviewPanel, document);
    });
  }

  /**
   * Unified Webview message handler
   */
  async handleWebviewMessage(message, webviewPanel, document) {
    const uri = document.uri;

    switch (message.command) {
      // ---- Document sync: Webview -> VS Code ----
      case 'updateXml': {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );
        edit.replace(uri, fullRange, message.xml);
        await vscode.workspace.applyEdit(edit);
        await document.save();

        // Re-validate
        if (this.xmlValidator) {
          this.xmlValidator.validate(document);
        }
        break;
      }

      // ---- Open in VS Code native editor ----
      case 'openCode': {
        await vscode.commands.executeCommand('vscode.open', uri);
        break;
      }

      // ---- Toggle layout bounds ----
      case 'toggleBounds': {
        const config = vscode.workspace.getConfiguration('androidLayoutEditor');
        const current = config.get('showBounds', false);
        await config.update('showBounds', !current, true);
        webviewPanel.webview.postMessage({
          command: 'boundsToggled',
          showBounds: !current,
        });
        break;
      }

      // ---- Show Inspector ----
      case 'showInspector': {
        webviewPanel.webview.postMessage({
          command: 'toggleInspector',
          show: true,
        });
        break;
      }

      // ---- Set device config ----
      case 'setDevice': {
        if (message.preset) {
          this.deviceManager.setDevice(message.preset);
        }
        if (message.density) {
          this.deviceManager.setDensity(message.density);
        }
        if (message.theme) {
          this.deviceManager.setTheme(message.theme);
        }
        webviewPanel.webview.postMessage({
          command: 'deviceConfigChanged',
          config: this.deviceManager.getDeviceConfig(),
        });
        break;
      }

      // ---- Request initial device config ----
      case 'getDeviceConfig': {
        webviewPanel.webview.postMessage({
          command: 'deviceConfigChanged',
          config: this.deviceManager.getDeviceConfig(),
        });
        break;
      }

      // ---- Resource drop handling ----
      case 'handleDrop': {
        await this._handleResourceDrop(message, webviewPanel, document);
        break;
      }

      // ---- Request attribute dictionary ----
      case 'getAttrs': {
        webviewPanel.webview.postMessage({
          command: 'attrsData',
          attrs: ANDROID_ATTRS,
        });
        break;
      }

      // ---- Request widgets ----
      case 'getWidgets': {
        webviewPanel.webview.postMessage({
          command: 'widgetsData',
          widgets: ANDROID_WIDGETS,
        });
        break;
      }

      // ---- Alert / Error ----
      case 'alert': {
        vscode.window.showInformationMessage(message.text);
        break;
      }
      case 'error': {
        vscode.window.showErrorMessage(message.text);
        break;
      }

      default:
        console.warn(`Unknown webview message: ${message.command}`);
    }
  }

  /**
   * Handle resource drop from VS Code explorer
   */
  async _handleResourceDrop(message, webviewPanel, document) {
    const droppedUri = message.uri; // URI string from the drop
    if (!droppedUri) return;

    const uri = vscode.Uri.parse(droppedUri);
    const ext = uri.path.split('.').pop().toLowerCase();

    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      // Image file -> set as ImageView src
      const fileName = uri.path.split('/').pop();
      const resourceName = `@drawable/${fileName.replace(/\.[^.]+$/, '')}`;
      webviewPanel.webview.postMessage({
        command: 'insertImageResource',
        resourceName: resourceName,
        fileName: fileName,
      });
    } else if (ext === 'xml') {
      // XML layout -> insert as include
      const fileName = uri.path.split('/').pop();
      const layoutName = fileName.replace('.xml', '');
      webviewPanel.webview.postMessage({
        command: 'insertInclude',
        layout: `@layout/${layoutName}`,
        fileName: fileName,
      });
    }
  }

  /**
   * Generate Webview HTML (fully inline, no external files)
   */
  getWebviewHTML(xmlContent) {
    const escapedXml = this._escapeHtml(xmlContent);
    const config = vscode.workspace.getConfiguration('androidLayoutEditor');
    const theme = config.get('theme', 'dark');
    const showBounds = config.get('showBounds', false);
    const phoneRatio = config.get('phoneRatio', '9-16');
    const devicePreset = config.get('devicePreset', 'pixel-7');
    const density = config.get('density', 'xxhdpi');
    const appTheme = config.get('appTheme', 'light');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-eval'; img-src data:;">
<title>Android Layout Editor v2.10.0</title>
<style>
/* ===== CSS Variables ===== */
:root {
  --bg: ${theme === 'dark' ? '#1e1e2e' : '#f5f5f5'};
  --fg: ${theme === 'dark' ? '#cdd6f4' : '#1e1e2e'};
  --bg-secondary: ${theme === 'dark' ? '#313244' : '#ffffff'};
  --bg-tertiary: ${theme === 'dark' ? '#45475a' : '#e0e0e0'};
  --border: ${theme === 'dark' ? '#585b70' : '#cccccc'};
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  --text-muted: ${theme === 'dark' ? '#a6adc8' : '#666666'};
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  --margin-color: #f97316;
  --padding-color: #3b82f6;
  --constraint-color: #22c55e;
  --inspector-bg: rgba(0,0,0,0.75);
  --radius: 6px;
  --shadow: 0 2px 8px rgba(0,0,0,${theme === 'dark' ? '0.3' : '0.1'});
}

/* ===== Reset ===== */
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--fg);
  overflow: hidden;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  gap: 4px;
  flex-shrink: 0;
  height: 40px;
}
.toolbar-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}
.toolbar-brand svg { width:18px; height:18px; }
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
}
.toolbar-spacer { flex:1; }
.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--fg);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: background 0.15s;
}
.toolbar-btn:hover { background: var(--bg-tertiary); }
.toolbar-btn:active { background: var(--accent); color: #fff; }
.toolbar-btn svg { width:16px; height:16px; flex-shrink:0; }
.toolbar-btn.active { background: var(--accent); color: #fff; }
.toolbar-select {
  padding: 3px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--fg);
  font-size: 12px;
  cursor: pointer;
}

/* ===== Main Container ===== */
.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ===== Left Panel ===== */
.panel-left {
  width: 240px;
  min-width: 180px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  overflow: hidden;
  flex-shrink: 0;
}
.panel-left.collapsed { width: 0; min-width: 0; overflow: hidden; border-right: none; }
.panel-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--border);
}
.panel-header:hover { background: var(--bg-tertiary); }
.section-arrow { font-size: 10px; }
.tree-container, .component-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}
.component-search {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
}
.component-search input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--fg);
  font-size: 12px;
  outline: none;
}
.component-search input:focus { border-color: var(--accent); }
.component-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius);
  cursor: grab;
  font-size: 12px;
  transition: background 0.15s;
  user-select: none;
}
.component-item:hover { background: var(--bg-tertiary); }
.component-item:active { cursor: grabbing; }
.component-item .ci-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
.ci-layout { background: #3b82f6; color: #fff; }
.ci-widget { background: #22c55e; color: #fff; }
.ci-container { background: #f59e0b; color: #fff; }
.tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 12px;
  font-family: 'SF Mono', Consolas, monospace;
  transition: background 0.15s;
}
.tree-node:hover { background: var(--bg-tertiary); }
.tree-node.selected { background: var(--accent); color: #fff; }
.tree-node .tn-indent { display: inline-block; }
.tree-node .tn-toggle { width: 12px; text-align: center; font-size: 10px; color: var(--text-muted); }

/* ===== Center Panel ===== */
.panel-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.center-tabs {
  display: flex;
  align-items: center;
  padding: 0 4px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  height: 32px;
  flex-shrink: 0;
}
.center-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  transition: all 0.15s;
}
.center-tab:hover { color: var(--fg); }
.center-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.center-tab svg { width:14px; height:14px; }
.tab-spacer { flex:1; }
.tab-panel-toggle {
  padding: 4px;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: var(--radius);
}
.tab-panel-toggle:hover { background: var(--bg-tertiary); color: var(--fg); }
.tab-panel-toggle svg { width:16px; height:16px; }

/* ===== Canvas Area ===== */
.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  position: relative;
  background: var(--bg);
}
.phone-frame {
  position: relative;
  background: #fff;
  box-shadow: var(--shadow);
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.3s ease;
}
.phone-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  background: #000;
  color: #fff;
}
.phone-notch {
  width: 80px;
  height: 20px;
  background: #000;
  border-radius: 0 0 12px 12px;
}
.phone-content {
  position: relative;
  overflow: hidden;
  min-height: 400px;
  background: ${appTheme === 'dark' ? '#121212' : appTheme === 'material_you' ? '#fffbfe' : '#ffffff'};
}

/* ===== Bounds Visualization ===== */
.bounds-margin {
  outline: 2px dashed var(--margin-color) !important;
  outline-offset: 0px;
}
.bounds-padding {
  outline: 2px solid var(--padding-color) !important;
  outline-offset: 0px;
}
.constraint-line {
  position: absolute;
  pointer-events: none;
  z-index: 100;
}
.constraint-line svg {
  width: 100%;
  height: 100%;
}

/* ===== Inspector Overlay ===== */
.inspector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 200;
  display: none;
}
.inspector-overlay.active { display: block; }
.inspector-badge {
  position: absolute;
  background: var(--inspector-bg);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'SF Mono', Consolas, monospace;
  white-space: nowrap;
  pointer-events: none;
}
.inspector-depth-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  pointer-events: none;
}
.inspector-warning {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--warning);
  color: #000;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: var(--radius);
  font-weight: 600;
  pointer-events: auto;
}

/* ===== Right Panel ===== */
.panel-right {
  width: 280px;
  min-width: 200px;
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  overflow: hidden;
  flex-shrink: 0;
}
.panel-right.collapsed { width: 0; min-width: 0; overflow: hidden; border-left: none; }
.props-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}
.props-empty svg { width: 32px; height: 32px; opacity: 0.5; }
.props-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.prop-group {
  margin-bottom: 12px;
}
.prop-group-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 6px;
}
.prop-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.prop-label {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 80px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prop-input {
  flex: 1;
  padding: 3px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--fg);
  font-size: 12px;
  outline: none;
  min-width: 0;
}
.prop-input:focus { border-color: var(--accent); }
.prop-select {
  flex: 1;
  padding: 3px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--fg);
  font-size: 12px;
  cursor: pointer;
  outline: none;
}
.prop-suggestions {
  position: absolute;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  max-height: 150px;
  overflow-y: auto;
  z-index: 1000;
}
.prop-suggestion-item {
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.1s;
}
.prop-suggestion-item:hover { background: var(--accent); color: #fff; }
.prop-suggestion-item .suggestion-desc {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 8px;
}

/* ===== Code Editor ===== */
.code-area {
  flex: 1;
  display: none;
  overflow: auto;
  background: var(--bg);
}
.code-area.active { display: flex; }
.code-textarea {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  color: var(--fg);
  font-family: 'SF Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  tab-size: 4;
}

/* ===== Status Bar ===== */
.statusbar {
  display: flex;
  align-items: center;
  padding: 2px 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
  gap: 8px;
  height: 24px;
  flex-shrink: 0;
}
.statusbar .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}
.status-sep { color: var(--border); }

/* ===== Toast ===== */
.toast-container {
  position: fixed;
  bottom: 40px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  padding: 8px 16px;
  border-radius: var(--radius);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--fg);
  font-size: 12px;
  box-shadow: var(--shadow);
  animation: toastIn 0.3s ease;
}
.toast.success { border-left: 3px solid var(--success); }
.toast.error { border-left: 3px solid var(--error); }
.toast.warning { border-left: 3px solid var(--warning); }
@keyframes toastIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

/* ===== Drop Zone ===== */
.drop-zone {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(124, 58, 237, 0.15);
  border: 3px dashed var(--accent);
  border-radius: var(--radius);
  z-index: 500;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent);
}
.drop-zone.active { display: flex; }

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg-tertiary); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--border); }

/* ===== Device Preview Bar ===== */
.device-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.device-bar label {
  font-size: 11px;
  color: var(--text-muted);
}
.device-bar select, .device-bar button {
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--fg);
  font-size: 11px;
  cursor: pointer;
}
.device-bar button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
</style>
</head>
<body>

<!-- ===== Toolbar ===== -->
<div class="toolbar">
  <div class="toolbar-brand">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
    Layout Editor <span style="font-size:10px;color:var(--text-muted);font-weight:400;margin-left:4px;">v2.10.0</span>
  </div>
  <div class="toolbar-divider"></div>
  <button class="toolbar-btn" onclick="postMsg({command:'openCode'})" title="在 VS Code 中打开 XML 代码">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>打开代码
  </button>
  <div class="toolbar-divider"></div>
  <button class="toolbar-btn" id="btnBounds" onclick="postMsg({command:'toggleBounds'})" title="切换布局边界 (Ctrl+Shift+X)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/></svg>边界
  </button>
  <button class="toolbar-btn" id="btnInspector" onclick="postMsg({command:'showInspector'})" title="Layout Inspector (Ctrl+Shift+I)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>Inspector
  </button>
  <div class="toolbar-spacer"></div>
  <span style="font-size:11px;color:var(--text-muted);" id="deviceLabel">Pixel 7</span>
</div>

<!-- ===== Device Preview Bar ===== -->
<div class="device-bar">
  <label>设备:</label>
  <select id="deviceSelect" onchange="postMsg({command:'setDevice',preset:this.value})">
    <option value="pixel-7">Pixel 7</option>
    <option value="pixel-7a">Pixel 7a</option>
    <option value="galaxy-s23">Galaxy S23</option>
    <option value="galaxy-s23-ultra">Galaxy S23 Ultra</option>
    <option value="iphone-15">iPhone 15</option>
    <option value="ipad-air">iPad Air</option>
    <option value="small-phone">Small Phone</option>
    <option value="tablet-10">10" Tablet</option>
  </select>
  <label>密度:</label>
  <select id="densitySelect" onchange="postMsg({command:'setDevice',density:this.value})">
    <option value="ldpi">ldpi (0.75x)</option>
    <option value="mdpi">mdpi (1x)</option>
    <option value="hdpi">hdpi (1.5x)</option>
    <option value="xhdpi">xhdpi (2x)</option>
    <option value="xxhdpi" selected>xxhdpi (3x)</option>
    <option value="xxxhdpi">xxxhdpi (4x)</option>
  </select>
  <label>主题:</label>
  <select id="themeSelect" onchange="postMsg({command:'setDevice',theme:this.value})">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
    <option value="material_you">Material You</option>
  </select>
</div>

<!-- ===== Main Container ===== -->
<div class="main-container">
  <!-- Left Panel: Component Tree + Palette -->
  <div class="panel-left" id="panelLeft">
    <div class="panel-section">
      <div class="panel-header"><span>组件树</span><span class="section-arrow">&#9660;</span></div>
      <div class="tree-container" id="componentTree"></div>
    </div>
    <div class="panel-section" style="border-top:1px solid var(--border);">
      <div class="panel-header"><span>组件库</span><span class="section-arrow">&#9660;</span></div>
      <div class="component-search"><input type="text" placeholder="搜索组件..." id="compSearch" oninput="filterComponents(this.value)"/></div>
      <div class="component-list" id="componentList"></div>
    </div>
  </div>

  <!-- Center Panel: Design / Code -->
  <div class="panel-center">
    <div class="center-tabs">
      <div class="tab-panel-toggle" onclick="togglePanel('left')" title="折叠/展开左侧">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
      </div>
      <div class="tab-spacer"></div>
      <div class="center-tab active" data-tab="design" onclick="switchTab('design')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>设计
      </div>
      <div class="center-tab" data-tab="code" onclick="switchTab('code')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>代码
      </div>
      <div class="tab-spacer"></div>
      <div class="tab-panel-toggle" onclick="togglePanel('right')" title="折叠/展开右侧">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
      </div>
    </div>

    <!-- Design View -->
    <div class="canvas-area" id="canvasArea"
         ondragover="event.preventDefault();document.getElementById('dropZone').classList.add('active')"
         ondragleave="document.getElementById('dropZone').classList.remove('active')"
         ondrop="handleDrop(event)">
      <div class="phone-frame" id="phoneFrame">
        <div class="phone-statusbar">
          <span>9:41</span>
          <div class="phone-notch"></div>
          <span style="font-size:11px;">&#x1F4F1; &#x1F50B;</span>
        </div>
        <div class="phone-content" id="phoneContent"></div>
      </div>
      <div class="drop-zone" id="dropZone">拖放资源文件到此处</div>
      <!-- Inspector Overlay -->
      <div class="inspector-overlay" id="inspectorOverlay"></div>
    </div>

    <!-- Code View -->
    <div class="code-area" id="codeArea">
      <textarea class="code-textarea" id="codeEditor" spellcheck="false" oninput="onCodeInput()"></textarea>
    </div>
  </div>

  <!-- Right Panel: Properties -->
  <div class="panel-right" id="panelRight">
    <div class="panel-section">
      <div class="panel-header"><span>属性</span><span class="section-arrow">&#9660;</span></div>
      <div class="props-empty" id="propsEmpty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>
        <span>选择组件以编辑属性</span>
      </div>
      <div class="props-content" id="propsContent" style="display:none;"></div>
    </div>
  </div>
</div>

<!-- ===== Status Bar ===== -->
<div class="statusbar">
  <div class="dot"></div>
  <span id="statusText">就绪</span>
  <span class="status-sep">|</span>
  <span id="statusComponents">组件: 0</span>
  <span class="status-sep">|</span>
  <span id="statusDevice">Pixel 7 (xxhdpi)</span>
  <span class="status-sep">|</span>
  <span id="statusTheme">Light</span>
  <span style="flex:1"></span>
  <span>Android Layout Editor v2.10.0</span>
</div>

<!-- ===== Toast Container ===== -->
<div class="toast-container" id="toastContainer"></div>

<script>
// ============================================================================
// Webview Runtime - Android Layout Editor v2.10.0
// ============================================================================

// ---- State ----
let currentXml = '';
let selectedElement = null;
let showBounds = ${showBounds};
let showInspector = false;
let deviceConfig = {
  preset: '${devicePreset}',
  name: 'Pixel 7',
  width: 1080,
  height: 2400,
  density: '${density}',
  scale: 3,
  theme: '${appTheme}',
};
let attrsDict = {};
let widgetsData = { layouts: [], widgets: [], containers: [] };
let currentTab = 'design';

// ---- Initial XML ----
window.INITIAL_XML = "${escapedXml}";
currentXml = window.INITIAL_XML;

// ---- VS Code API communication ----
function postMsg(msg) {
  if (typeof vscode !== 'undefined' && vscode.postMessage) {
    vscode.postMessage(msg);
  }
}

// ---- Receive messages from extension ----
window.addEventListener('message', event => {
  const msg = event.data;
  switch (msg.command) {
    case 'documentChanged':
      currentXml = msg.xml;
      renderDesign();
      updateCodeEditor();
      break;
    case 'boundsToggled':
      showBounds = msg.showBounds;
      document.getElementById('btnBounds').classList.toggle('active', showBounds);
      renderDesign();
      break;
    case 'toggleInspector':
      showInspector = msg.show;
      document.getElementById('btnInspector').classList.toggle('active', showInspector);
      document.getElementById('inspectorOverlay').classList.toggle('active', showInspector);
      renderInspector();
      break;
    case 'deviceConfigChanged':
      deviceConfig = msg.config;
      updateDeviceUI();
      renderDesign();
      break;
    case 'attrsData':
      attrsDict = msg.attrs;
      break;
    case 'widgetsData':
      widgetsData = msg.widgets;
      renderComponentPalette();
      break;
    case 'insertImageResource':
      insertImageToXml(msg.resourceName, msg.fileName);
      break;
    case 'insertInclude':
      insertIncludeToXml(msg.layout, msg.fileName);
      break;
    case 'saved':
      showToast('已保存', 'success');
      break;
  }
});

// ---- Request initial data ----
postMsg({ command: 'getDeviceConfig' });
postMsg({ command: 'getAttrs' });
postMsg({ command: 'getWidgets' });

// ---- Initialize ----
renderDesign();
updateCodeEditor();
updateDeviceUI();

// ============================================================================
// Design Rendering
// ============================================================================
function renderDesign() {
  const container = document.getElementById('phoneContent');
  container.innerHTML = '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentXml, 'text/xml');
    const root = doc.documentElement;

    if (root && root.nodeType === 1) {
      const el = renderXmlNode(root, 0);
      if (el) container.appendChild(el);
    }
  } catch (e) {
    container.innerHTML = '<div style="padding:20px;color:#ef4444;font-size:12px;">XML 解析错误: ' + e.message + '</div>';
  }

  updateComponentTree();
  updateStatus();
}

function renderXmlNode(node, depth) {
  if (node.nodeType !== 1) return null;

  const tagName = node.tagName;
  const wrapper = document.createElement('div');
  wrapper.className = 'design-node';
  wrapper.dataset.tag = tagName;
  wrapper.dataset.depth = depth;

  // Get attributes
  const attrs = {};
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    attrs[attr.name.replace('android:', '')] = attr.value;
  }

  // Layout params
  const w = attrs.layout_width || 'match_parent';
  const h = attrs.layout_height || 'wrap_content';
  const id = attrs.id || '';
  const bg = attrs.background || '';
  const pad = attrs.padding || '0';
  const margin = attrs.layout_margin || '0';
  const marginTop = attrs.layout_marginTop || margin;
  const marginBottom = attrs.layout_marginBottom || margin;
  const marginLeft = attrs.layout_marginLeft || margin;
  const marginRight = attrs.layout_marginRight || margin;
  const visibility = attrs.visibility || 'visible';
  const alpha = parseFloat(attrs.alpha) || 1;

  // Style the wrapper
  wrapper.style.position = 'relative';
  wrapper.style.width = w === 'match_parent' ? '100%' : w;
  wrapper.style.minHeight = h === 'match_parent' ? '100%' : (h === 'wrap_content' ? 'auto' : h);
  wrapper.style.marginTop = parseDim(marginTop);
  wrapper.style.marginBottom = parseDim(marginBottom);
  wrapper.style.marginLeft = parseDim(marginLeft);
  wrapper.style.marginRight = parseDim(marginRight);
  wrapper.style.padding = parseDim(pad);
  wrapper.style.opacity = alpha;
  wrapper.style.display = visibility === 'gone' ? 'none' : (visibility === 'invisible' ? 'visibility:hidden' : '');

  // Background color
  if (bg.startsWith('#') || bg.startsWith('rgb')) {
    wrapper.style.background = bg;
  } else if (bg.startsWith('@color/')) {
    wrapper.style.background = getColorFromName(bg.replace('@color/', ''));
  }

  // Bounds visualization
  if (showBounds) {
    if (margin !== '0' || marginTop !== '0' || marginBottom !== '0' || marginLeft !== '0' || marginRight !== '0') {
      wrapper.classList.add('bounds-margin');
    }
    if (pad !== '0' || attrs.paddingTop || attrs.paddingBottom || attrs.paddingLeft || attrs.paddingRight) {
      wrapper.classList.add('bounds-padding');
    }
  }

  // Render tag-specific content
  const inner = renderTagContent(tagName, attrs, wrapper);
  if (inner) wrapper.appendChild(inner);

  // Render children
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = renderXmlNode(node.childNodes[i], depth + 1);
    if (child) wrapper.appendChild(child);
  }

  // Click handler for selection
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    selectElement(wrapper, tagName, attrs, node);
  });

  return wrapper;
}

function renderTagContent(tag, attrs, wrapper) {
  const text = attrs.text || attrs.hint || '';
  const textSize = attrs.textSize || '14sp';
  const textColor = attrs.textColor || '';
  const src = attrs.src || '';
  const orientation = attrs.orientation || 'vertical';
  const checked = attrs.checked === 'true';
  const progress = parseInt(attrs.progress) || 0;
  const max = parseInt(attrs.max) || 100;

  switch (tag) {
    case 'TextView': {
      const el = document.createElement('div');
      el.textContent = text || 'TextView';
      el.style.fontSize = parseDim(textSize);
      el.style.color = textColor || 'inherit';
      el.style.padding = '8dp';
      el.style.minHeight = '24dp';
      el.style.wordBreak = 'break-word';
      return el;
    }
    case 'Button': {
      const el = document.createElement('div');
      el.textContent = text || 'Button';
      el.style.padding = '8dp 16dp';
      el.style.background = '#7c3aed';
      el.style.color = '#fff';
      el.style.borderRadius = '4dp';
      el.style.textAlign = 'center';
      el.style.fontSize = parseDim(textSize);
      el.style.minHeight = '36dp';
      return el;
    }
    case 'EditText': {
      const el = document.createElement('div');
      el.textContent = text || attrs.hint || 'EditText';
      el.style.padding = '8dp';
      el.style.borderBottom = '1px solid #666';
      el.style.fontSize = parseDim(textSize);
      el.style.color = text ? 'inherit' : '#999';
      el.style.minHeight = '36dp';
      return el;
    }
    case 'ImageView':
    case 'ImageButton': {
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.minHeight = '48dp';
      el.style.background = '#e5e7eb';
      el.style.borderRadius = '4dp';
      el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.5" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
      if (src) {
        el.title = src;
        el.innerHTML += '<div style="font-size:10px;color:#999;margin-top:4px;">' + src + '</div>';
      }
      return el;
    }
    case 'CheckBox':
    case 'RadioButton':
    case 'Switch': {
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '8dp';
      el.style.padding = '8dp';
      el.style.minHeight = '36dp';
      const box = document.createElement('div');
      box.style.width = '18dp';
      box.style.height = '18dp';
      box.style.border = '2px solid #666';
      box.style.borderRadius = tag === 'Switch' ? '9dp' : (tag === 'RadioButton' ? '50%' : '2dp');
      if (checked) {
        box.style.background = '#7c3aed';
        box.style.borderColor = '#7c3aed';
      }
      el.appendChild(box);
      const label = document.createElement('span');
      label.textContent = text || tag;
      label.style.fontSize = parseDim(textSize);
      el.appendChild(label);
      return el;
    }
    case 'ProgressBar': {
      const el = document.createElement('div');
      el.style.minHeight = '24dp';
      el.style.background = '#e5e7eb';
      el.style.borderRadius = '12dp';
      el.style.overflow = 'hidden';
      el.style.position = 'relative';
      const fill = document.createElement('div');
      fill.style.height = '100%';
      fill.style.width = (max > 0 ? (progress / max * 100) : 0) + '%';
      fill.style.background = '#7c3aed';
      fill.style.borderRadius = '12dp';
      el.appendChild(fill);
      return el;
    }
    case 'SeekBar': {
      const el = document.createElement('div');
      el.style.minHeight = '24dp';
      el.style.background = '#e5e7eb';
      el.style.borderRadius = '12dp';
      el.style.position = 'relative';
      const thumb = document.createElement('div');
      thumb.style.width = '20dp';
      thumb.style.height = '20dp';
      thumb.style.background = '#7c3aed';
      thumb.style.borderRadius = '50%';
      thumb.style.position = 'absolute';
      thumb.style.top = '2dp';
      thumb.style.left = '50%';
      thumb.style.transform = 'translateX(-50%)';
      el.appendChild(thumb);
      return el;
    }
    case 'Spinner': {
      const el = document.createElement('div');
      el.style.padding = '8dp';
      el.style.minHeight = '36dp';
      el.style.borderBottom = '1px solid #666';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'space-between';
      el.textContent = text || 'Spinner';
      el.innerHTML += '<span style="font-size:10px;color:#999;">&#9660;</span>';
      return el;
    }
    case 'include': {
      const layout = attrs.layout || '';
      const el = document.createElement('div');
      el.style.padding = '12dp';
      el.style.border = '1px dashed #999';
      el.style.borderRadius = '4dp';
      el.style.color = '#999';
      el.style.fontSize = '11px';
      el.textContent = 'include: ' + layout;
      return el;
    }
    case 'merge':
    case 'ViewStub': {
      const el = document.createElement('div');
      el.style.padding = '12dp';
      el.style.border = '1px dashed #999';
      el.style.borderRadius = '4dp';
      el.style.color = '#999';
      el.style.fontSize = '11px';
      el.textContent = tag;
      return el;
    }
    case 'RecyclerView': {
      const el = document.createElement('div');
      el.style.minHeight = '100dp';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.gap = '1px';
      for (let i = 0; i < 5; i++) {
        const item = document.createElement('div');
        item.style.padding = '12dp';
        item.style.background = i % 2 === 0 ? '#f3f4f6' : '#fff';
        item.style.fontSize = '12px';
        item.textContent = 'Item ' + (i + 1);
        el.appendChild(item);
      }
      return el;
    }
    default: {
      // Layout containers - render children directly
      return null;
    }
  }
}

// ============================================================================
// Component Tree
// ============================================================================
function updateComponentTree() {
  const tree = document.getElementById('componentTree');
  tree.innerHTML = '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentXml, 'text/xml');
    const root = doc.documentElement;
    if (root && root.nodeType === 1) {
      const node = createTreeNode(root, 0);
      if (node) tree.appendChild(node);
    }
  } catch (e) {
    tree.innerHTML = '<div style="padding:8px;color:var(--error);font-size:11px;">解析错误</div>';
  }
}

function createTreeNode(xmlNode, depth) {
  if (xmlNode.nodeType !== 1) return null;

  const tagName = xmlNode.tagName;
  const div = document.createElement('div');

  const row = document.createElement('div');
  row.className = 'tree-node';
  row.style.paddingLeft = (depth * 16 + 4) + 'px';

  const hasChildren = Array.from(xmlNode.childNodes).some(c => c.nodeType === 1);

  const toggle = document.createElement('span');
  toggle.className = 'tn-toggle';
  toggle.textContent = hasChildren ? '\u25BC' : ' ';
  row.appendChild(toggle);

  const label = document.createElement('span');
  let id = '';
  for (let i = 0; i < xmlNode.attributes.length; i++) {
    if (xmlNode.attributes[i].name === 'android:id') {
      id = xmlNode.attributes[i].value.replace('@+id/', '');
    }
  }
  label.textContent = tagName + (id ? ' #' + id : '');
  row.appendChild(label);

  div.appendChild(row);

  // Children container
  if (hasChildren) {
    const childContainer = document.createElement('div');
    for (let i = 0; i < xmlNode.childNodes.length; i++) {
      const child = createTreeNode(xmlNode.childNodes[i], depth + 1);
      if (child) childContainer.appendChild(child);
    }
    div.appendChild(childContainer);

    toggle.style.cursor = 'pointer';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const collapsed = childContainer.style.display === 'none';
      childContainer.style.display = collapsed ? '' : 'none';
      toggle.textContent = collapsed ? '\u25BC' : '\u25B6';
    });
  }

  // Click to select
  row.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
    row.classList.add('selected');
  });

  return div;
}

// ============================================================================
// Component Palette
// ============================================================================
function renderComponentPalette() {
  const list = document.getElementById('componentList');
  list.innerHTML = '';

  const sections = [
    { key: 'layouts', label: '布局', cls: 'ci-layout' },
    { key: 'widgets', label: '控件', cls: 'ci-widget' },
    { key: 'containers', label: '容器', cls: 'ci-container' },
  ];

  sections.forEach(section => {
    const items = widgetsData[section.key] || [];
    items.forEach(widget => {
      const item = document.createElement('div');
      item.className = 'component-item';
      item.draggable = true;
      item.dataset.tag = widget.tag;
      item.innerHTML = '<div class="ci-icon ' + section.cls + '">' + widget.tag.charAt(0) + '</div>' +
        '<div><div style="font-weight:500;">' + widget.label + '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);">' + widget.desc + '</div></div>';

      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', widget.tag);
        e.dataTransfer.effectAllowed = 'copy';
      });

      list.appendChild(item);
    });
  });
}

function filterComponents(query) {
  const items = document.querySelectorAll('.component-item');
  const q = query.toLowerCase();
  items.forEach(item => {
    const tag = item.dataset.tag.toLowerCase();
    item.style.display = tag.includes(q) ? '' : 'none';
  });
}

// ============================================================================
// Element Selection & Properties
// ============================================================================
function selectElement(wrapper, tagName, attrs, xmlNode) {
  // Deselect previous
  document.querySelectorAll('.design-node').forEach(n => n.style.outline = '');
  wrapper.style.outline = '2px solid #7c3aed';

  selectedElement = { wrapper, tagName, attrs, xmlNode };
  renderProperties(tagName, attrs);
}

function renderProperties(tagName, attrs) {
  const empty = document.getElementById('propsEmpty');
  const content = document.getElementById('propsContent');

  empty.style.display = 'none';
  content.style.display = 'block';
  content.innerHTML = '';

  // ID section
  const idGroup = createPropGroup('标识', [
    { name: 'id', value: attrs.id || '', type: 'id' }
  ]);
  content.appendChild(idGroup);

  // Layout section
  const layoutGroup = createPropGroup('布局参数', [
    { name: 'layout_width', value: attrs.layout_width || '', type: 'enum', values: ['match_parent', 'wrap_content', '100dp', '200dp'] },
    { name: 'layout_height', value: attrs.layout_height || '', type: 'enum', values: ['match_parent', 'wrap_content', '100dp', '200dp'] },
    { name: 'layout_margin', value: attrs.layout_margin || '', type: 'dimension' },
    { name: 'layout_marginTop', value: attrs.layout_marginTop || '', type: 'dimension' },
    { name: 'layout_marginBottom', value: attrs.layout_marginBottom || '', type: 'dimension' },
    { name: 'layout_marginLeft', value: attrs.layout_marginLeft || '', type: 'dimension' },
    { name: 'layout_marginRight', value: attrs.layout_marginRight || '', type: 'dimension' },
    { name: 'layout_weight', value: attrs.layout_weight || '', type: 'float' },
    { name: 'layout_gravity', value: attrs.layout_gravity || '', type: 'enum', values: ['top','bottom','left','right','center','center_vertical','center_horizontal','start','end'] },
  ]);
  content.appendChild(layoutGroup);

  // Common section
  const commonGroup = createPropGroup('通用', [
    { name: 'background', value: attrs.background || '', type: 'color|reference' },
    { name: 'padding', value: attrs.padding || '', type: 'dimension' },
    { name: 'paddingTop', value: attrs.paddingTop || '', type: 'dimension' },
    { name: 'paddingBottom', value: attrs.paddingBottom || '', type: 'dimension' },
    { name: 'paddingLeft', value: attrs.paddingLeft || '', type: 'dimension' },
    { name: 'paddingRight', value: attrs.paddingRight || '', type: 'dimension' },
    { name: 'visibility', value: attrs.visibility || '', type: 'enum', values: ['visible','invisible','gone'] },
    { name: 'alpha', value: attrs.alpha || '', type: 'float' },
    { name: 'elevation', value: attrs.elevation || '', type: 'dimension' },
  ]);
  content.appendChild(commonGroup);

  // Tag-specific attributes
  const tagAttrs = getTagSpecificAttrs(tagName, attrs);
  if (tagAttrs.length > 0) {
    const tagGroup = createPropGroup(tagName + ' 属性', tagAttrs);
    content.appendChild(tagGroup);
  }

  // ConstraintLayout specific
  if (tagName === 'ConstraintLayout' || currentXml.includes('ConstraintLayout')) {
    const constraintGroup = createPropGroup('约束', [
      { name: 'layout_constraintLeft_toLeftOf', value: attrs.layout_constraintLeft_toLeftOf || '', type: 'id' },
      { name: 'layout_constraintLeft_toRightOf', value: attrs.layout_constraintLeft_toRightOf || '', type: 'id' },
      { name: 'layout_constraintRight_toLeftOf', value: attrs.layout_constraintRight_toLeftOf || '', type: 'id' },
      { name: 'layout_constraintRight_toRightOf', value: attrs.layout_constraintRight_toRightOf || '', type: 'id' },
      { name: 'layout_constraintTop_toTopOf', value: attrs.layout_constraintTop_toTopOf || '', type: 'id' },
      { name: 'layout_constraintTop_toBottomOf', value: attrs.layout_constraintTop_toBottomOf || '', type: 'id' },
      { name: 'layout_constraintBottom_toTopOf', value: attrs.layout_constraintBottom_toTopOf || '', type: 'id' },
      { name: 'layout_constraintBottom_toBottomOf', value: attrs.layout_constraintBottom_toBottomOf || '', type: 'id' },
      { name: 'layout_constraintStart_toStartOf', value: attrs.layout_constraintStart_toStartOf || '', type: 'id' },
      { name: 'layout_constraintStart_toEndOf', value: attrs.layout_constraintStart_toEndOf || '', type: 'id' },
      { name: 'layout_constraintEnd_toStartOf', value: attrs.layout_constraintEnd_toStartOf || '', type: 'id' },
      { name: 'layout_constraintEnd_toEndOf', value: attrs.layout_constraintEnd_toEndOf || '', type: 'id' },
      { name: 'layout_constraintHorizontal_bias', value: attrs.layout_constraintHorizontal_bias || '', type: 'float' },
      { name: 'layout_constraintVertical_bias', value: attrs.layout_constraintVertical_bias || '', type: 'float' },
    ]);
    content.appendChild(constraintGroup);
  }
}

function getTagSpecificAttrs(tag, attrs) {
  const map = {
    'TextView': [
      { name: 'text', value: attrs.text || '', type: 'string' },
      { name: 'textSize', value: attrs.textSize || '', type: 'dimension' },
      { name: 'textColor', value: attrs.textColor || '', type: 'color' },
      { name: 'hint', value: attrs.hint || '', type: 'string' },
      { name: 'textColorHint', value: attrs.textColorHint || '', type: 'color' },
      { name: 'textAlignment', value: attrs.textAlignment || '', type: 'enum', values: ['inherit','gravity','center','textStart','textEnd','viewStart','viewEnd'] },
      { name: 'maxLines', value: attrs.maxLines || '', type: 'integer' },
      { name: 'singleLine', value: attrs.singleLine || '', type: 'boolean' },
      { name: 'ellipsize', value: attrs.ellipsize || '', type: 'enum', values: ['start','middle','end','marquee'] },
      { name: 'textStyle', value: attrs.textStyle || '', type: 'enum', values: ['normal','bold','italic','bold|italic'] },
    ],
    'Button': [
      { name: 'text', value: attrs.text || '', type: 'string' },
      { name: 'textSize', value: attrs.textSize || '', type: 'dimension' },
      { name: 'textColor', value: attrs.textColor || '', type: 'color' },
      { name: 'clickable', value: attrs.clickable || '', type: 'boolean' },
      { name: 'enabled', value: attrs.enabled || '', type: 'boolean' },
    ],
    'EditText': [
      { name: 'text', value: attrs.text || '', type: 'string' },
      { name: 'hint', value: attrs.hint || '', type: 'string' },
      { name: 'inputType', value: attrs.inputType || '', type: 'enum', values: ['text','textPassword','number','phone','textEmailAddress','textUri','textMultiLine','numberPassword','numberSigned','numberDecimal'] },
      { name: 'imeOptions', value: attrs.imeOptions || '', type: 'enum', values: ['actionDone','actionGo','actionNext','actionSearch','actionSend','actionNone','flagNoExtractUi'] },
      { name: 'maxLines', value: attrs.maxLines || '', type: 'integer' },
      { name: 'singleLine', value: attrs.singleLine || '', type: 'boolean' },
    ],
    'ImageView': [
      { name: 'src', value: attrs.src || '', type: 'reference' },
      { name: 'scaleType', value: attrs.scaleType || '', type: 'enum', values: ['center','centerCrop','centerInside','fitCenter','fitXY','fitStart','fitEnd','matrix'] },
      { name: 'contentDescription', value: attrs.contentDescription || '', type: 'string' },
    ],
    'CheckBox': [{ name: 'checked', value: attrs.checked || '', type: 'boolean' }, { name: 'text', value: attrs.text || '', type: 'string' }],
    'RadioButton': [{ name: 'checked', value: attrs.checked || '', type: 'boolean' }, { name: 'text', value: attrs.text || '', type: 'string' }],
    'Switch': [{ name: 'checked', value: attrs.checked || '', type: 'boolean' }, { name: 'text', value: attrs.text || '', type: 'string' }],
    'LinearLayout': [
      { name: 'orientation', value: attrs.orientation || '', type: 'enum', values: ['vertical','horizontal'] },
      { name: 'gravity', value: attrs.gravity || '', type: 'enum', values: ['top','bottom','left','right','center','center_vertical','center_horizontal','start','end','clip_vertical','clip_horizontal'] },
    ],
    'ProgressBar': [{ name: 'max', value: attrs.max || '', type: 'integer' }, { name: 'progress', value: attrs.progress || '', type: 'integer' }],
    'ScrollView': [{ name: 'fillViewport', value: attrs.fillViewport || '', type: 'boolean' }],
  };
  return map[tag] || [];
}

function createPropGroup(title, props) {
  const group = document.createElement('div');
  group.className = 'prop-group';

  const titleEl = document.createElement('div');
  titleEl.className = 'prop-group-title';
  titleEl.textContent = title;
  group.appendChild(titleEl);

  props.forEach(prop => {
    const row = document.createElement('div');
    row.className = 'prop-row';

    const label = document.createElement('div');
    label.className = 'prop-label';
    label.textContent = prop.name.replace('layout_', '');
    label.title = prop.name + ': ' + (attrsDict[prop.name]?.desc || prop.type);
    row.appendChild(label);

    if (prop.values) {
      const select = document.createElement('select');
      select.className = 'prop-select';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '--';
      select.appendChild(emptyOpt);
      prop.values.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        if (prop.value === v) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => updateAttr(prop.name, select.value));
      row.appendChild(select);
    } else {
      const input = document.createElement('input');
      input.className = 'prop-input';
      input.type = 'text';
      input.value = prop.value;
      input.placeholder = prop.type;
      input.addEventListener('change', () => updateAttr(prop.name, input.value));
      input.addEventListener('focus', () => showAttrSuggestions(input, prop.name, prop.type));
      row.appendChild(input);
    }

    group.appendChild(row);
  });

  return group;
}

function showAttrSuggestions(input, attrName, attrType) {
  // Remove existing suggestions
  document.querySelectorAll('.prop-suggestions').forEach(s => s.remove());

  const attrDef = attrsDict[attrName];
  if (!attrDef || !attrDef.values) return;

  const suggestions = document.createElement('div');
  suggestions.className = 'prop-suggestions';
  suggestions.style.position = 'fixed';

  const rect = input.getBoundingClientRect();
  suggestions.style.top = (rect.bottom + 2) + 'px';
  suggestions.style.left = rect.left + 'px';
  suggestions.style.width = rect.width + 'px';

  attrDef.values.forEach(val => {
    const item = document.createElement('div');
    item.className = 'prop-suggestion-item';
    item.innerHTML = val + '<span class="suggestion-desc">' + (attrDef.desc || '') + '</span>';
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      input.value = val;
      updateAttr(attrName, val);
      suggestions.remove();
    });
    suggestions.appendChild(item);
  });

  document.body.appendChild(suggestions);

  // Close on click outside
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!suggestions.contains(e.target)) {
        suggestions.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 0);
}

function updateAttr(name, value) {
  if (!selectedElement) return;

  // Update XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentXml, 'text/xml');
  const root = doc.documentElement;

  // Find the element by tag and update attribute
  const elements = root.getElementsByTagName(selectedElement.tagName);
  // Simple approach: update the first matching element (could be improved with ID matching)
  if (elements.length > 0) {
    const el = elements[0];
    if (value) {
      el.setAttribute('android:' + name, value);
    } else {
      el.removeAttribute('android:' + name);
    }
  }

  // Serialize back to XML string
  const serializer = new XMLSerializer();
  currentXml = serializer.serializeToString(doc);
  // Fix missing XML declaration
  if (!currentXml.startsWith('<?xml')) {
    currentXml = '<?xml version="1.0" encoding="utf-8"?>\\n' + currentXml;
  }

  // Send to extension
  postMsg({ command: 'updateXml', xml: currentXml });
  renderDesign();
}

// ============================================================================
// Code Editor
// ============================================================================
function updateCodeEditor() {
  const editor = document.getElementById('codeEditor');
  if (editor && document.activeElement !== editor) {
    editor.value = currentXml;
  }
}

function onCodeInput() {
  const editor = document.getElementById('codeEditor');
  currentXml = editor.value;
  postMsg({ command: 'updateXml', xml: currentXml });
  renderDesign();
}

// ============================================================================
// Tab Switching
// ============================================================================
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.center-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('canvasArea').style.display = tab === 'code' ? 'none' : 'flex';
  document.getElementById('codeArea').classList.toggle('active', tab === 'code');
  if (tab === 'code') {
    updateCodeEditor();
  }
}

// ============================================================================
// Panel Toggle
// ============================================================================
function togglePanel(side) {
  if (side === 'left') {
    document.getElementById('panelLeft').classList.toggle('collapsed');
  } else {
    document.getElementById('panelRight').classList.toggle('collapsed');
  }
}

// ============================================================================
// Device UI
// ============================================================================
function updateDeviceUI() {
  document.getElementById('deviceLabel').textContent = deviceConfig.name;
  document.getElementById('deviceSelect').value = deviceConfig.preset;
  document.getElementById('densitySelect').value = deviceConfig.density;
  document.getElementById('themeSelect').value = deviceConfig.theme;
  document.getElementById('statusDevice').textContent = deviceConfig.name + ' (' + deviceConfig.density + ')';
  document.getElementById('statusTheme').textContent = deviceConfig.theme === 'material_you' ? 'Material You' : deviceConfig.theme.charAt(0).toUpperCase() + deviceConfig.theme.slice(1);

  // Resize phone frame
  const frame = document.getElementById('phoneFrame');
  const ratio = deviceConfig.width / deviceConfig.height;
  const maxH = 600;
  const maxW = 400;
  let h = maxH;
  let w = h * ratio;
  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }
  frame.style.width = w + 'px';
  frame.style.height = h + 'px';

  // Update phone content background based on theme
  const content = document.getElementById('phoneContent');
  const themeBg = deviceConfig.theme === 'dark' ? '#121212' : deviceConfig.theme === 'material_you' ? '#fffbfe' : '#ffffff';
  content.style.background = themeBg;
}

// ============================================================================
// Layout Inspector
// ============================================================================
function renderInspector() {
  const overlay = document.getElementById('inspectorOverlay');
  overlay.innerHTML = '';

  if (!showInspector) return;

  const nodes = document.querySelectorAll('.design-node');
  let maxDepth = 0;
  const depthColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  nodes.forEach(node => {
    const depth = parseInt(node.dataset.depth) || 0;
    if (depth > maxDepth) maxDepth = depth;

    // Depth indicator
    const indicator = document.createElement('div');
    indicator.className = 'inspector-depth-indicator';
    indicator.style.height = '100%';
    indicator.style.background = depthColors[depth % depthColors.length];
    indicator.style.opacity = '0.6';
    node.style.position = 'relative';
    node.appendChild(indicator);

    // Size badge
    const rect = node.getBoundingClientRect();
    const canvasRect = document.getElementById('canvasArea').getBoundingClientRect();
    const w = Math.round(rect.width / deviceConfig.scale);
    const h = Math.round(rect.height / deviceConfig.scale);

    if (w > 0 && h > 0 && depth > 0) {
      const badge = document.createElement('div');
      badge.className = 'inspector-badge';
      badge.style.top = '2px';
      badge.style.right = '2px';
      badge.textContent = w + 'dp x ' + h + 'dp';
      badge.style.borderLeft = '3px solid ' + depthColors[depth % depthColors.length];
      node.appendChild(badge);
    }
  });

  // Nesting warning
  if (maxDepth > 8) {
    const warning = document.createElement('div');
    warning.className = 'inspector-warning';
    warning.textContent = '警告: 布局嵌套过深 (' + maxDepth + ' 层)，建议不超过 8 层';
    overlay.appendChild(warning);
  }
}

// ============================================================================
// Resource Drop Handling
// ============================================================================
function handleDrop(event) {
  event.preventDefault();
  document.getElementById('dropZone').classList.remove('active');

  const text = event.dataTransfer.getData('text');
  if (text && text.startsWith('<')) {
    // Component drag from palette
    insertComponentAtCursor(text);
    return;
  }

  // File drop from VS Code explorer
  // The URI is passed via the vscode API; we handle it in the extension
  postMsg({ command: 'handleDrop', uri: text });
}

function insertComponentAtCursor(tagName) {
  const ns = 'xmlns:android="http://schemas.android.com/apk/res/android"';
  let snippet = '';
  switch (tagName) {
    case 'TextView':
      snippet = '    <TextView\\n        android:layout_width="wrap_content"\\n        android:layout_height="wrap_content"\\n        android:text="TextView"\\n        android:textSize="14sp"\\n    />';
      break;
    case 'Button':
      snippet = '    <Button\\n        android:layout_width="wrap_content"\\n        android:layout_height="wrap_content"\\n        android:text="Button"\\n    />';
      break;
    case 'EditText':
      snippet = '    <EditText\\n        android:layout_width="match_parent"\\n        android:layout_height="wrap_content"\\n        android:hint="Enter text"\\n        android:inputType="text"\\n    />';
      break;
    case 'ImageView':
      snippet = '    <ImageView\\n        android:layout_width="wrap_content"\\n        android:layout_height="wrap_content"\\n        android:src="@drawable/ic_launcher"\\n        android:scaleType="centerCrop"\\n    />';
      break;
    case 'LinearLayout':
      snippet = '    <LinearLayout\\n        android:layout_width="match_parent"\\n        android:layout_height="wrap_content"\\n        android:orientation="vertical"\\n    >\\n    </LinearLayout>';
      break;
    case 'ConstraintLayout':
      snippet = '    <androidx.constraintlayout.widget.ConstraintLayout\\n        android:layout_width="match_parent"\\n        android:layout_height="match_parent"\\n    >\\n    </androidx.constraintlayout.widget.ConstraintLayout>';
      break;
    default:
      snippet = '    <' + tagName + '\\n        android:layout_width="wrap_content"\\n        android:layout_height="wrap_content"\\n    />';
  }

  // Insert before closing tag of root
  const lastClose = currentXml.lastIndexOf('</');
  if (lastClose > 0) {
    currentXml = currentXml.substring(0, lastClose) + snippet + '\\n' + currentXml.substring(lastClose);
    postMsg({ command: 'updateXml', xml: currentXml });
    renderDesign();
    showToast('已添加 ' + tagName, 'success');
  }
}

function insertImageToXml(resourceName, fileName) {
  const snippet = '    <ImageView\\n        android:layout_width="wrap_content"\\n        android:layout_height="wrap_content"\\n        android:src="' + resourceName + '"\\n        android:contentDescription="' + fileName + '"\\n    />';
  const lastClose = currentXml.lastIndexOf('</');
  if (lastClose > 0) {
    currentXml = currentXml.substring(0, lastClose) + snippet + '\\n' + currentXml.substring(lastClose);
    postMsg({ command: 'updateXml', xml: currentXml });
    renderDesign();
    showToast('已插入图片: ' + fileName, 'success');
  }
}

function insertIncludeToXml(layout, fileName) {
  const snippet = '    <include layout="' + layout + '"\\n        android:layout_width="match_parent"\\n        android:layout_height="wrap_content"\\n    />';
  const lastClose = currentXml.lastIndexOf('</');
  if (lastClose > 0) {
    currentXml = currentXml.substring(0, lastClose) + snippet + '\\n' + currentXml.substring(lastClose);
    postMsg({ command: 'updateXml', xml: currentXml });
    renderDesign();
    showToast('已包含布局: ' + fileName, 'success');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================
function parseDim(val) {
  if (!val) return '0px';
  const num = parseFloat(val);
  if (isNaN(num)) return '0px';
  // Convert dp to px for display (assume 1dp = 2px for preview)
  if (val.includes('dp') || val.includes('sp')) return (num * 2) + 'px';
  if (val.includes('px')) return num + 'px';
  if (val.includes('mm')) return (num * 3.78) + 'px';
  if (val.includes('pt')) return (num * 1.33) + 'px';
  if (val.includes('in')) return (num * 96) + 'px';
  return num + 'px';
}

function getColorFromName(name) {
  const colors = {
    'white': '#ffffff', 'black': '#000000', 'red': '#ff0000', 'green': '#00ff00',
    'blue': '#0000ff', 'yellow': '#ffff00', 'cyan': '#00ffff', 'magenta': '#ff00ff',
    'gray': '#808080', 'grey': '#808080', 'light_gray': '#d3d3d3', 'dark_gray': '#a9a9a9',
    'transparent': 'transparent',
  };
  return colors[name] || '#cccccc';
}

function showToast(msg, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function updateStatus() {
  const count = document.querySelectorAll('.design-node').length;
  document.getElementById('statusComponents').textContent = '组件: ' + count;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
</script>
</body>
</html>`;
  }

  /**
   * Escape HTML for embedding in template literals
   */
  _escapeHtml(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ============================================================================
// Extension Activation
// ============================================================================
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Android Layout Editor v2.10.0 is now active');

  // ---- Create XML Validator with DiagnosticCollection ----
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('androidLayoutEditor');
  context.subscriptions.push(diagnosticCollection);

  const validator = new XMLValidator(diagnosticCollection);

  // ---- Register Custom Editor Provider ----
  const provider = new LayoutEditorProvider(context);
  provider.setValidator(validator);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'androidLayoutEditor.layoutEditor',
      provider,
      {
        supportsMultipleEditorsPerDocument: false,
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  // ---- Validate XML on document open/change ----
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      if (doc.uri.scheme === 'file' && doc.uri.path.endsWith('.xml')) {
        validator.validate(doc);
      }
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.scheme === 'file' && e.document.uri.path.endsWith('.xml')) {
        // Debounce validation
        clearTimeout(validateTimeout);
        validateTimeout = setTimeout(() => {
          validator.validate(e.document);
        }, 500);
      }
    })
  );
  let validateTimeout;

  // ---- Command: androidLayoutEditor.open ----
  context.subscriptions.push(
    vscode.commands.registerCommand('androidLayoutEditor.open', async (uri) => {
      if (!uri) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          uri = editor.document.uri;
        } else {
          vscode.window.showWarningMessage('请先打开一个 XML 文件');
          return;
        }
      }
      // Open with custom editor
      await vscode.window.showTextDocument(uri, {
        viewColumn: vscode.ViewColumn.One,
        preview: false,
      });
    })
  );

  // ---- Command: androidLayoutEditor.openSidebar ----
  context.subscriptions.push(
    vscode.commands.registerCommand('androidLayoutEditor.openSidebar', async () => {
      // Create a webview panel in the sidebar area
      const panel = vscode.window.createWebviewPanel(
        'androidLayoutEditorSidebar',
        'Android Layout Editor',
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [],
        }
      );

      // Create a temporary untitled document for the sidebar editor
      const sidebarProvider = new LayoutEditorProvider(context);
      sidebarProvider.setValidator(validator);
      panel.webview.html = sidebarProvider.getWebviewHTML(
        `<?xml version="1.0" encoding="utf-8"?>\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n    android:layout_width="match_parent"\n    android:layout_height="match_parent"\n    android:orientation="vertical">\n\n</LinearLayout>`
      );

      panel.webview.onDidReceiveMessage(async (message) => {
        await sidebarProvider.handleWebviewMessage(message, panel, {
          uri: vscode.Uri.parse('untitled:sidebar-layout.xml'),
          getText: () => panel.webview.html, // Not a real document
          save: async () => {},
        });
      });
    })
  );

  // ---- Command: androidLayoutEditor.newLayout ----
  context.subscriptions.push(
    vscode.commands.registerCommand('androidLayoutEditor.newLayout', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage('请先打开一个工作区');
        return;
      }

      const fileName = await vscode.window.showInputBox({
        prompt: '输入布局文件名（不含扩展名）',
        placeHolder: 'activity_main',
        validateInput: (value) => {
          if (!value || !/^[a-z][a-z0-9_]*$/.test(value)) {
            return '文件名必须以小写字母开头，只能包含小写字母、数字和下划线';
          }
          return null;
        },
      });

      if (!fileName) return;

      // Build path using vscode.Uri
      const layoutDir = vscode.Uri.joinPath(workspaceFolders[0].uri, 'res', 'layout');
      const fileUri = vscode.Uri.joinPath(layoutDir, `${fileName}.xml`);

      const defaultXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

</LinearLayout>`;

      // Create directory using vscode.workspace.fs
      try {
        await vscode.workspace.fs.createDirectory(layoutDir);
      } catch (e) {
        // Directory may already exist, ignore
      }

      // Write file using vscode.workspace.fs
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(fileUri, encoder.encode(defaultXml));

      // Open the new file in the layout editor
      await vscode.commands.executeCommand('vscode.openWith', fileUri, 'androidLayoutEditor.layoutEditor');
    })
  );

  // ---- Command: androidLayoutEditor.toggleBounds ----
  context.subscriptions.push(
    vscode.commands.registerCommand('androidLayoutEditor.toggleBounds', async () => {
      const config = vscode.workspace.getConfiguration('androidLayoutEditor');
      const current = config.get('showBounds', false);
      await config.update('showBounds', !current, true);
      vscode.window.showInformationMessage(`布局边界显示: ${!current ? '开启' : '关闭'}`);
    })
  );

  // ---- Command: androidLayoutEditor.showInspector ----
  context.subscriptions.push(
    vscode.commands.registerCommand('androidLayoutEditor.showInspector', async () => {
      vscode.window.showInformationMessage('Layout Inspector 已在编辑器中激活，点击 Inspector 按钮查看详情');
      // The inspector toggle is handled via webview message
      // This command serves as a discoverability entry point
    })
  );

  // ---- Command: androidLayoutEditor.openCode ----
  context.subscriptions.push(
    vscode.commands.registerCommand('androidLayoutEditor.openCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.uri.scheme === 'file') {
        await vscode.commands.executeCommand('vscode.open', editor.document.uri, {
          viewColumn: vscode.ViewColumn.Beside,
        });
      } else {
        vscode.window.showWarningMessage('请先在设计编辑器中打开一个 XML 文件');
      }
    })
  );

  // ---- Register Document Drop Edit Provider for XML files ----
  context.subscriptions.push(
    vscode.languages.registerDocumentDropEditProvider(
      { scheme: 'file', pattern: '**/*.xml' },
      {
        async provideDocumentDropEdits(document, _dataTransfer, _token) {
          // This enables drag-drop in the native XML editor as well
          return null; // Let the webview handle its own drops
        },
      },
      {
        dropMimeTypes: ['text/uri-list', 'application/vnd.code.tree.fileDragAndDrop'],
      }
    )
  );

  // ---- Watch configuration changes ----
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('androidLayoutEditor')) {
        // Config changes are picked up by the webview via getDeviceConfig
      }
    })
  );
}

function deactivate() {
  console.log('Android Layout Editor v2.10.0 deactivated');
}

module.exports = { activate, deactivate };
