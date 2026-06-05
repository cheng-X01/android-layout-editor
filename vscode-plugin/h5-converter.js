/**
 * H5 (HTML/CSS) to Android XML Layout Converter
 * 轻量级实现，零外部依赖
 */

// ========== HTML 标签 → Android 组件映射 ==========
const TAG_MAP = {
  // 布局容器
  'div':     { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'section': { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'article': { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'header':  { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'footer':  { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'nav':     { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'main':    { type: 'FrameLayout',  layout: true,  defaultOrient: null },
  'aside':   { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'form':    { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'ul':      { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'ol':      { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'li':      { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'table':   { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'tr':      { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'td':      { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },

  // 文本
  'span':    { type: 'TextView',     layout: false, defaultOrient: null },
  'p':       { type: 'TextView',     layout: false, defaultOrient: null },
  'h1':      { type: 'TextView',     layout: false, defaultOrient: null },
  'h2':      { type: 'TextView',     layout: false, defaultOrient: null },
  'h3':      { type: 'TextView',     layout: false, defaultOrient: null },
  'h4':      { type: 'TextView',     layout: false, defaultOrient: null },
  'h5':      { type: 'TextView',     layout: false, defaultOrient: null },
  'h6':      { type: 'TextView',     layout: false, defaultOrient: null },
  'label':   { type: 'TextView',     layout: false, defaultOrient: null },
  'strong':  { type: 'TextView',     layout: false, defaultOrient: null },
  'em':      { type: 'TextView',     layout: false, defaultOrient: null },
  'a':       { type: 'TextView',     layout: false, defaultOrient: null },

  // 表单
  'input':   { type: 'EditText',     layout: false, defaultOrient: null },
  'textarea':{ type: 'EditText',     layout: false, defaultOrient: null },
  'button':  { type: 'Button',       layout: false, defaultOrient: null },
  'select':  { type: 'Spinner',      layout: false, defaultOrient: null },

  // 媒体
  'img':     { type: 'ImageView',    layout: false, defaultOrient: null },
  'video':   { type: 'VideoView',    layout: false, defaultOrient: null },
  'audio':   { type: 'View',         layout: false, defaultOrient: null },

  // 其他
  'hr':      { type: 'View',         layout: false, defaultOrient: null },
  'br':      { type: 'View',         layout: false, defaultOrient: null },
  'progress':{ type: 'ProgressBar',  layout: false, defaultOrient: null },
  'input[type="checkbox"]': { type: 'CheckBox',  layout: false, defaultOrient: null },
  'input[type="radio"]':    { type: 'RadioButton',layout: false, defaultOrient: null },
};

// ========== CSS 属性 → Android 属性映射 ==========
const CSS_PROP_MAP = {
  // 尺寸
  'width':           { attr: 'android:layout_width',  transform: v => _toDimen(v, 'match_parent') },
  'height':          { attr: 'android:layout_height', transform: v => _toDimen(v, 'wrap_content') },
  'min-width':       { attr: 'android:minWidth',      transform: v => _toDimen(v) },
  'min-height':      { attr: 'android:minHeight',     transform: v => _toDimen(v) },

  // 边距
  'margin':          { attr: 'android:layout_margin', transform: v => _toDimen(v) },
  'margin-top':      { attr: 'android:layout_marginTop',    transform: v => _toDimen(v) },
  'margin-bottom':   { attr: 'android:layout_marginBottom', transform: v => _toDimen(v) },
  'margin-left':     { attr: 'android:layout_marginLeft',   transform: v => _toDimen(v) },
  'margin-right':    { attr: 'android:layout_marginRight',  transform: v => _toDimen(v) },

  // 内边距
  'padding':         { attr: 'android:padding',       transform: v => _toDimen(v) },
  'padding-top':     { attr: 'android:paddingTop',    transform: v => _toDimen(v) },
  'padding-bottom':  { attr: 'android:paddingBottom', transform: v => _toDimen(v) },
  'padding-left':    { attr: 'android:paddingLeft',   transform: v => _toDimen(v) },
  'padding-right':   { attr: 'android:paddingRight',  transform: v => _toDimen(v) },

  // 文本
  'color':           { attr: 'android:textColor',     transform: v => _toColor(v) },
  'font-size':       { attr: 'android:textSize',      transform: v => _toSp(v) },
  'font-weight':     { attr: 'android:textStyle',     transform: v => v === 'bold' || v >= 600 ? 'bold' : 'normal' },
  'text-align':      { attr: 'android:gravity',       transform: v => _textAlignToGravity(v) },
  'line-height':     { attr: 'android:lineSpacingMultiplier', transform: v => parseFloat(v) || 1.2 },

  // 背景
  'background':      { attr: 'android:background',    transform: v => _toColor(v) },
  'background-color':{ attr: 'android:background',    transform: v => _toColor(v) },

  // 可见性
  'display':         { attr: 'android:visibility',    transform: v => v === 'none' ? 'gone' : 'visible' },
  'opacity':         { attr: 'android:alpha',         transform: v => parseFloat(v) },

  // 其他
  'border-radius':   { attr: 'android:radius',        transform: v => _toDimen(v) }, // 需 CardView
  'elevation':       { attr: 'android:elevation',     transform: v => _toDimen(v) },
  'rotation':        { attr: 'android:rotation',      transform: v => parseFloat(v) },
};

// ========== 辅助转换函数 ==========
function _toDimen(v, defaultVal) {
  if (!v || v === 'auto') return defaultVal || 'wrap_content';
  v = v.trim();
  if (v === '100%' || v === '100vw' || v === '100vh') return 'match_parent';
  // px → dp (假设 1dp = 1px 在 mdpi)
  const num = parseFloat(v);
  if (isNaN(num)) return defaultVal || 'wrap_content';
  if (v.includes('px')) return Math.round(num) + 'dp';
  if (v.includes('rem')) return Math.round(num * 16) + 'dp';
  if (v.includes('em')) return Math.round(num * 16) + 'dp';
  if (v.includes('%')) return num >= 95 ? 'match_parent' : '0dp'; // ConstraintLayout 用 0dp
  if (v.includes('vh')) return num >= 95 ? 'match_parent' : Math.round(num * 6.4) + 'dp'; // 假设 640dp 屏幕高
  if (v.includes('vw')) return num >= 95 ? 'match_parent' : Math.round(num * 3.6) + 'dp'; // 假设 360dp 屏幕宽
  return Math.round(num) + 'dp';
}

function _toSp(v) {
  const num = parseFloat(v);
  if (isNaN(num)) return '14sp';
  // Web px → Android sp: 按常见设计稿 375px 宽度对应 360dp
  // 近似 1px ≈ 0.9sp，再按 Material Design 规范微调
  if (v.includes('px')) return Math.round(num * 0.75) + 'sp';
  if (v.includes('rem')) return Math.round(num * 16) + 'sp';
  return Math.round(num) + 'sp';
}

function _toColor(v) {
  v = v.trim();
  if (v.startsWith('#')) return v;
  if (v.startsWith('rgb')) {
    const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
  }
  // 常见颜色名映射
  const colors = {
    'black': '#000000', 'white': '#ffffff', 'red': '#ff0000', 'green': '#008000',
    'blue': '#0000ff', 'yellow': '#ffff00', 'orange': '#ffa500', 'purple': '#800080',
    'gray': '#808080', 'grey': '#808080', 'transparent': '#00000000'
  };
  return colors[v.toLowerCase()] || v;
}

function _textAlignToGravity(v) {
  const map = { 'left': 'left', 'right': 'right', 'center': 'center', 'justify': 'center' };
  return map[v] || 'left';
}

// ========== HTML 解析器（轻量级） ==========
function parseHtml(html) {
  const nodes = [];
  let i = 0;

  function skipWhitespace() {
    while (i < html.length && /\s/.test(html[i])) i++;
  }

  function parseTag() {
    if (html[i] !== '<') return null;
    i++; // skip <

    // 注释
    if (html.substring(i, i + 3) === '!--') {
      const end = html.indexOf('-->', i + 3);
      i = end === -1 ? html.length : end + 3;
      return null;
    }

    // 结束标签
    if (html[i] === '/') {
      i++;
      let name = '';
      while (i < html.length && html[i] !== '>') name += html[i++];
      if (html[i] === '>') i++;
      return { type: 'close', name: name.toLowerCase().trim() };
    }

    // 开始标签
    let name = '';
    while (i < html.length && html[i] !== ' ' && html[i] !== '>' && html[i] !== '/') {
      name += html[i++];
    }
    name = name.toLowerCase().trim();

    // 解析属性
    const attrs = {};
    while (i < html.length && html[i] !== '>' && html[i] !== '/') {
      skipWhitespace();
      if (html[i] === '>' || html[i] === '/') break;

      let attrName = '';
      while (i < html.length && html[i] !== '=' && html[i] !== ' ' && html[i] !== '>' && html[i] !== '/') {
        attrName += html[i++];
      }
      attrName = attrName.toLowerCase().trim();
      skipWhitespace();

      let attrValue = '';
      if (html[i] === '=') {
        i++;
        skipWhitespace();
        const quote = html[i] === '"' || html[i] === "'" ? html[i++] : null;
        while (i < html.length && (quote ? html[i] !== quote : html[i] !== ' ' && html[i] !== '>' && html[i] !== '/')) {
          attrValue += html[i++];
        }
        if (quote && html[i] === quote) i++;
      }
      attrs[attrName] = attrValue;
    }

    // 自闭合标签
    const selfClosing = html[i] === '/';
    if (selfClosing) i++;
    if (html[i] === '>') i++;

    return { type: 'open', name, attrs, selfClosing };
  }

  function parseNode(parent) {
    skipWhitespace();
    if (i >= html.length) return null;

    if (html[i] === '<') {
      const tag = parseTag();
      if (!tag) return parseNode(parent);
      if (tag.type === 'close') return tag;

      const node = {
        tag: tag.name,
        attrs: tag.attrs,
        children: [],
        text: ''
      };

      if (!tag.selfClosing) {
        while (i < html.length) {
          skipWhitespace();
          if (html[i] === '<' && html[i + 1] === '/') {
            const closeTag = parseTag();
            if (closeTag && closeTag.name === tag.name) break;
            // 不匹配的关闭标签，回退
            continue;
          }
          const child = parseNode(node);
          if (!child) break;
          if (child.type === 'close') {
            if (child.name === tag.name) break;
            continue;
          }
          node.children.push(child);
        }
      }

      return node;
    } else {
      // 文本节点
      let text = '';
      while (i < html.length && html[i] !== '<') {
        text += html[i++];
      }
      return { tag: '#text', text: text.trim(), attrs: {}, children: [] };
    }
  }

  // 跳过 DOCTYPE 和 html/head/body 包装
  html = html.replace(/<!DOCTYPE[^>]*>/i, '');

  while (i < html.length) {
    const node = parseNode(null);
    if (node && node.tag !== '#text') nodes.push(node);
  }

  // 如果顶层是 html，取 body；如果是 body，直接取 children
  let body = nodes.find(n => n.tag === 'body') || nodes.find(n => n.tag === 'html');
  if (body) {
    const bodyNode = body.children.find(n => n.tag === 'body');
    return bodyNode ? bodyNode.children : body.children;
  }
  return nodes;
}

// ========== CSS 解析器 ==========
function parseCss(cssText) {
  const rules = {};
  if (!cssText) return rules;

  // 移除注释
  cssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

  const rx = /([^{]+)\{([^}]*)\}/g;
  let m;
  while ((m = rx.exec(cssText)) !== null) {
    const selectors = m[1].split(',').map(s => s.trim());
    const declarations = m[2].trim();
    const props = {};
    declarations.split(';').forEach(decl => {
      const idx = decl.indexOf(':');
      if (idx > 0) {
        const prop = decl.substring(0, idx).trim().toLowerCase();
        const val = decl.substring(idx + 1).trim();
        props[prop] = val;
      }
    });
    selectors.forEach(sel => {
      rules[sel] = { ...rules[sel], ...props };
    });
  }
  return rules;
}

// ========== 提取 <style> 标签中的 CSS ==========
function extractStyles(html) {
  const styles = {};
  const rx = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = rx.exec(html)) !== null) {
    const css = parseCss(m[1]);
    Object.assign(styles, css);
  }
  return styles;
}

// ========== 匹配 CSS 选择器到节点 ==========
function matchSelector(node, selector, cssRules) {
  const props = {};

  // 标签选择器
  if (cssRules[node.tag]) Object.assign(props, cssRules[node.tag]);

  // class 选择器
  if (node.attrs.class) {
    node.attrs.class.split(/\s+/).forEach(cls => {
      if (cssRules['.' + cls]) Object.assign(props, cssRules['.' + cls]);
    });
  }

  // id 选择器
  if (node.attrs.id && cssRules['#' + node.attrs.id]) {
    Object.assign(props, cssRules['#' + node.attrs.id]);
  }

  return props;
}

// ========== 转换引擎：DOM → Android XML ==========
let _idCounter = 0;
function _genId(tag) {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '') + (_idCounter++);
}

function convertNode(node, cssRules, depth = 0) {
  if (node.tag === '#text') {
    return node.text ? _escapeXml(node.text) : '';
  }

  const mapping = TAG_MAP[node.tag];
  if (!mapping) {
    // 未知标签，递归处理子元素
    return node.children.map(c => convertNode(c, cssRules, depth)).join('');
  }

  const androidTag = mapping.type;
  const isLayout = mapping.layout;
  const indent = '    '.repeat(depth + 1);

  // 收集属性
  const attrs = {};

  // 1. 默认尺寸
  attrs['android:layout_width'] = 'match_parent';
  attrs['android:layout_height'] = isLayout ? 'wrap_content' : 'wrap_content';

  // 2. 从 CSS 规则匹配样式
  const cssProps = matchSelector(node, '', cssRules);

  // 3. 从行内 style 解析样式
  let inlineProps = {};
  if (node.attrs.style) {
    node.attrs.style.split(';').forEach(decl => {
      const idx = decl.indexOf(':');
      if (idx > 0) {
        inlineProps[decl.substring(0, idx).trim().toLowerCase()] = decl.substring(idx + 1).trim();
      }
    });
  }

  // 合并样式：inline > css
  const allProps = { ...cssProps, ...inlineProps };

  // 4. 转换 CSS 属性为 Android 属性
  for (const [prop, val] of Object.entries(allProps)) {
    const mapping = CSS_PROP_MAP[prop];
    if (mapping) {
      attrs[mapping.attr] = mapping.transform(val);
    }
  }

  // 5. 特殊标签处理
  // id
  if (node.attrs.id) {
    attrs['android:id'] = '@+id/' + node.attrs.id;
  }

  // text content - 提取纯文本子节点，并从 children 中移除
  let textContent = '';
  if (androidTag === 'TextView' || androidTag === 'Button') {
    textContent = node.children.filter(c => c.tag === '#text').map(c => c.text).join('').trim();
    if (textContent && !attrs['android:text']) {
      attrs['android:text'] = _escapeXml(textContent);
    }
    // 过滤掉纯文本子节点，避免重复输出
    node.children = node.children.filter(c => c.tag !== '#text');
  }

  // input type
  if (node.tag === 'input') {
    const type = node.attrs.type || 'text';
    if (type === 'password') attrs['android:inputType'] = 'textPassword';
    else if (type === 'email') attrs['android:inputType'] = 'textEmailAddress';
    else if (type === 'number') attrs['android:inputType'] = 'number';
    else if (type === 'tel') attrs['android:inputType'] = 'phone';
    else if (type === 'url') attrs['android:inputType'] = 'textUri';
    else attrs['android:inputType'] = 'text';

    // hint from placeholder
    if (node.attrs.placeholder) {
      attrs['android:hint'] = _escapeXml(node.attrs.placeholder);
    }
  }

  // img src
  if (node.tag === 'img' && node.attrs.src) {
    const srcName = node.attrs.src.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
    attrs['android:src'] = '@drawable/' + srcName;
    attrs['android:contentDescription'] = node.attrs.alt || 'Image';
  }

  // a 链接
  if (node.tag === 'a') {
    attrs['android:clickable'] = 'true';
    if (node.attrs.href) {
      attrs['android:tag'] = node.attrs.href; // 用 tag 存链接
    }
  }

  // orientation for LinearLayout
  if (androidTag === 'LinearLayout' && !attrs['android:orientation']) {
    attrs['android:orientation'] = mapping.defaultOrient || 'vertical';
  }

  // 6. 构建 XML
  let xml = '';
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join('\n' + indent + '    ');

  if (node.children.length === 0 || (node.children.length === 1 && node.children[0].tag === '#text' && !node.children[0].text.trim())) {
    // 叶子节点
    xml += `${indent}<${androidTag}\n${indent}    ${attrStr} />\n`;
  } else {
    xml += `${indent}<${androidTag}\n${indent}    ${attrStr}>\n`;

    // 递归子元素
    for (const child of node.children) {
      xml += convertNode(child, cssRules, depth + 1);
    }

    xml += `${indent}</${androidTag}>\n`;
  }

  return xml;
}

function _escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ========== 主入口 ==========
function convert(html) {
  _idCounter = 0;

  // 提取 CSS
  const cssRules = extractStyles(html);

  // 解析 HTML
  const nodes = parseHtml(html);

  // 生成 XML
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += '<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n';
  xml += '    android:layout_width="match_parent"\n';
  xml += '    android:layout_height="match_parent"\n';
  xml += '    android:orientation="vertical">\n';

  for (const node of nodes) {
    xml += convertNode(node, cssRules, 0);
  }

  xml += '</LinearLayout>\n';

  return xml;
}

module.exports = { convert, parseHtml, parseCss };
