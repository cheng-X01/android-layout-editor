/**
 * H5 (HTML/CSS) to Android XML Layout Converter
 * 生产可用级别实现，零外部依赖
 * @version 1.1.0
 */

// ============================================================
// 常量定义
// ============================================================

/**
 * HTML 标签到 Android 组件的默认映射表
 * @type {Object<string, TagMapping>}
 */
const DEFAULT_TAG_MAP = {
  // 布局容器
  'div':       { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'section':   { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'article':   { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'header':    { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'footer':    { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'nav':       { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'main':      { type: 'FrameLayout',  layout: true,  defaultOrient: null },
  'aside':     { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'form':      { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'ul':        { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'ol':        { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'li':        { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'table':     { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },
  'tr':        { type: 'LinearLayout', layout: true,  defaultOrient: 'horizontal' },
  'td':        { type: 'LinearLayout', layout: true,  defaultOrient: 'vertical' },

  // 文本
  'span':      { type: 'TextView',     layout: false, defaultOrient: null },
  'p':         { type: 'TextView',     layout: false, defaultOrient: null },
  'h1':        { type: 'TextView',     layout: false, defaultOrient: null },
  'h2':        { type: 'TextView',     layout: false, defaultOrient: null },
  'h3':        { type: 'TextView',     layout: false, defaultOrient: null },
  'h4':        { type: 'TextView',     layout: false, defaultOrient: null },
  'h5':        { type: 'TextView',     layout: false, defaultOrient: null },
  'h6':        { type: 'TextView',     layout: false, defaultOrient: null },
  'label':     { type: 'TextView',     layout: false, defaultOrient: null },
  'strong':    { type: 'TextView',     layout: false, defaultOrient: null },
  'em':        { type: 'TextView',     layout: false, defaultOrient: null },
  'a':         { type: 'TextView',     layout: false, defaultOrient: null },

  // 表单
  'input':     { type: 'EditText',     layout: false, defaultOrient: null },
  'textarea':  { type: 'EditText',     layout: false, defaultOrient: null },
  'button':    { type: 'Button',       layout: false, defaultOrient: null },
  'select':    { type: 'Spinner',      layout: false, defaultOrient: null },

  // 媒体
  'img':       { type: 'ImageView',    layout: false, defaultOrient: null },
  'video':     { type: 'VideoView',    layout: false, defaultOrient: null },
  'audio':     { type: null,           layout: false, defaultOrient: null }, // 跳过
  'iframe':    { type: 'WebView',      layout: false, defaultOrient: null },
  'canvas':    { type: 'SurfaceView',  layout: false, defaultOrient: null },

  // 其他
  'hr':        { type: 'View',         layout: false, defaultOrient: null, selfClosing: true },
  'br':        { type: null,           layout: false, defaultOrient: null }, // 跳过
  'progress':  { type: 'ProgressBar',  layout: false, defaultOrient: null, selfClosing: true },

  // 带类型的 input
  'input[type="checkbox"]': { type: 'CheckBox',     layout: false, defaultOrient: null, selfClosing: true },
  'input[type="radio"]':    { type: 'RadioButton',  layout: false, defaultOrient: null, selfClosing: true },
};

/**
 * CSS 属性到 Android 属性的默认映射表
 * @type {Object<string, CssPropMapping>}
 */
const DEFAULT_CSS_PROP_MAP = {
  // 尺寸
  'width':            { attr: 'android:layout_width',  transform: v => _toDimen(v, 'match_parent') },
  'height':           { attr: 'android:layout_height', transform: v => _toDimen(v, 'wrap_content') },
  'min-width':        { attr: 'android:minWidth',      transform: v => _toDimen(v) },
  'min-height':       { attr: 'android:minHeight',     transform: v => _toDimen(v) },

  // 边距
  'margin':           { attr: 'android:layout_margin',       transform: v => _toDimen(v) },
  'margin-top':       { attr: 'android:layout_marginTop',    transform: v => _toDimen(v) },
  'margin-bottom':    { attr: 'android:layout_marginBottom', transform: v => _toDimen(v) },
  'margin-left':      { attr: 'android:layout_marginLeft',   transform: v => _toDimen(v) },
  'margin-right':     { attr: 'android:layout_marginRight',  transform: v => _toDimen(v) },

  // 内边距
  'padding':          { attr: 'android:padding',       transform: v => _toDimen(v) },
  'padding-top':      { attr: 'android:paddingTop',    transform: v => _toDimen(v) },
  'padding-bottom':   { attr: 'android:paddingBottom', transform: v => _toDimen(v) },
  'padding-left':     { attr: 'android:paddingLeft',   transform: v => _toDimen(v) },
  'padding-right':    { attr: 'android:paddingRight',  transform: v => _toDimen(v) },

  // 文本
  'color':            { attr: 'android:textColor',     transform: v => _toColor(v) },
  'font-size':        { attr: 'android:textSize',      transform: v => _toSp(v) },
  'font-weight':      { attr: 'android:textStyle',     transform: v => v === 'bold' || v >= 600 ? 'bold' : 'normal' },
  'text-align':       { attr: 'android:textAlignment', transform: v => _textAlignToTextAlignment(v) },
  // line-height 无直接对应，跳过
  // font-family 无直接对应，跳过
  // text-decoration: underline 需 Spannable，跳过

  // 背景
  'background':       { attr: 'android:background',    transform: v => _toColor(v) },
  'background-color': { attr: 'android:background',    transform: v => _toColor(v) },
  // border-radius 无法直接映射到 background，跳过
  // box-shadow Android 无直接对应，跳过

  // 可见性
  'display':          { attr: 'android:visibility',    transform: v => v === 'none' ? 'gone' : 'visible' },
  'opacity':          { attr: 'android:alpha',         transform: v => parseFloat(v) },

  // 其他
  'elevation':        { attr: 'android:elevation',     transform: v => _toDimen(v) },
  'rotation':         { attr: 'android:rotation',      transform: v => parseFloat(v) },
  // z-index Android 靠层级顺序，跳过
};

// ============================================================
// 辅助转换函数
// ============================================================

/**
 * 将 CSS 尺寸值转换为 Android 尺寸
 * @param {string} v - CSS 尺寸值
 * @param {string} [defaultVal='wrap_content'] - 默认值
 * @returns {string} Android 尺寸值
 */
function _toDimen(v, defaultVal) {
  try {
    if (!v || v === 'auto') return defaultVal || 'wrap_content';
    v = String(v).trim();
    if (v === '100%' || v === '100vw' || v === '100vh') return 'match_parent';
    const num = parseFloat(v);
    if (isNaN(num)) return defaultVal || 'wrap_content';
    if (v.includes('px')) return Math.round(num) + 'dp';
    if (v.includes('rem')) return Math.round(num * 16) + 'dp';
    if (v.includes('em')) return Math.round(num * 16) + 'dp';
    if (v.includes('%')) return num >= 95 ? 'match_parent' : '0dp';
    if (v.includes('vh')) return num >= 95 ? 'match_parent' : Math.round(num * 6.4) + 'dp';
    if (v.includes('vw')) return num >= 95 ? 'match_parent' : Math.round(num * 3.6) + 'dp';
    return Math.round(num) + 'dp';
  } catch (e) {
    return defaultVal || 'wrap_content';
  }
}

/**
 * 将 CSS 字体大小转换为 Android sp
 * @param {string} v - CSS 字体大小值
 * @returns {string} Android sp 值
 */
function _toSp(v) {
  try {
    const num = parseFloat(v);
    if (isNaN(num)) return '14sp';
    if (v.includes('px')) return Math.round(num * 0.75) + 'sp';
    if (v.includes('rem')) return Math.round(num * 16) + 'sp';
    return Math.round(num) + 'sp';
  } catch (e) {
    return '14sp';
  }
}

/**
 * 将 CSS 颜色值转换为 Android 颜色
 * @param {string} v - CSS 颜色值
 * @returns {string} Android 颜色值
 */
function _toColor(v) {
  try {
    v = String(v).trim();
    if (v.startsWith('#')) return v;
    if (v.startsWith('rgb')) {
      const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }
    const colors = {
      'black': '#000000', 'white': '#ffffff', 'red': '#ff0000', 'green': '#008000',
      'blue': '#0000ff', 'yellow': '#ffff00', 'orange': '#ffa500', 'purple': '#800080',
      'gray': '#808080', 'grey': '#808080', 'transparent': '#00000000'
    };
    return colors[v.toLowerCase()] || v;
  } catch (e) {
    return '#000000';
  }
}

/**
 * 将 CSS text-align 转换为 Android textAlignment
 * @param {string} v - CSS text-align 值
 * @returns {string} Android textAlignment 值
 */
function _textAlignToTextAlignment(v) {
  const map = { 'left': 'textStart', 'right': 'textEnd', 'center': 'center', 'justify': 'center' };
  return map[v] || 'textStart';
}

/**
 * 将 CSS flex-direction 转换为 Android orientation
 * @param {string} v - CSS flex-direction 值
 * @returns {string|null} Android orientation 值或 null
 */
function _flexDirectionToOrientation(v) {
  const map = { 'row': 'horizontal', 'column': 'vertical', 'row-reverse': 'horizontal', 'column-reverse': 'vertical' };
  return map[v] || null;
}

/**
 * 将 CSS justify-content 和 align-items 组合为 Android gravity
 * @param {string} justify - CSS justify-content 值
 * @param {string} align - CSS align-items 值
 * @param {boolean} isHorizontal - 是否为水平方向
 * @returns {string|null} Android gravity 值或 null
 */
function _flexToGravity(justify, align, isHorizontal) {
  const hMap = {
    'center': 'center_horizontal',
    'flex-start': 'left',
    'flex-end': 'right',
    'space-between': 'center_horizontal',
    'space-around': 'center_horizontal',
    'space-evenly': 'center_horizontal'
  };
  const vMap = {
    'center': 'center_vertical',
    'flex-start': 'top',
    'flex-end': 'bottom',
    'space-between': 'center_vertical',
    'space-around': 'center_vertical',
    'space-evenly': 'center_vertical'
  };

  let gravity = [];
  if (justify) {
    gravity.push(isHorizontal ? hMap[justify] || 'left' : vMap[justify] || 'top');
  }
  if (align) {
    gravity.push(isHorizontal ? vMap[align] || 'top' : hMap[align] || 'left');
  }
  if (gravity.length === 0) return null;

  // 去重并组合
  const unique = [...new Set(gravity)];
  if (unique.includes('center_horizontal') && unique.includes('center_vertical')) return 'center';
  return unique.join('|');
}

/**
 * 将 CSS position: absolute 的方位值转换为 layout_gravity
 * @param {Object} props - CSS 属性对象
 * @returns {string|null} Android layout_gravity 值或 null
 */
function _absoluteToLayoutGravity(props) {
  const top = props['top'] !== undefined;
  const bottom = props['bottom'] !== undefined;
  const left = props['left'] !== undefined;
  const right = props['right'] !== undefined;

  let h = null, v = null;
  if (left && !right) h = 'left';
  else if (right && !left) h = 'right';
  else if (left && right) h = 'fill_horizontal';
  else h = 'left';

  if (top && !bottom) v = 'top';
  else if (bottom && !top) v = 'bottom';
  else if (top && bottom) v = 'fill_vertical';
  else v = 'top';

  if (h === 'left' && v === 'top') return null;
  if (h === v) return h; // 如 center_horizontal == center_vertical 不可能
  return `${v}|${h}`;
}

/**
 * XML 特殊字符转义
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function _escapeXml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 生成唯一 ID
 * @param {string} tag - 标签名
 * @returns {string} 唯一 ID
 */
let _idCounter = 0;
function _genId(tag) {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '') + (_idCounter++);
}

// ============================================================
// HTML 解析器（轻量级）
// ============================================================

/**
 * 解析 HTML 字符串为节点树
 * @param {string} html - HTML 字符串
 * @returns {Array<Object>} 节点数组
 */
function parseHtml(html) {
  try {
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

      // 自闭合标签（显式自闭合 <tag/> 或 HTML5 void tags）
      const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
      const selfClosing = html[i] === '/' || voidTags.has(name);
      if (html[i] === '/') i++;
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
  } catch (e) {
    // 无效 HTML 时返回空数组
    return [];
  }
}

// ============================================================
// CSS 解析器
// ============================================================

/**
 * 解析 CSS 文本为规则对象
 * @param {string} cssText - CSS 文本
 * @returns {Object} CSS 规则对象
 */
function parseCss(cssText) {
  try {
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
  } catch (e) {
    return {};
  }
}

/**
 * 从 HTML 中提取 <style> 标签中的 CSS
 * @param {string} html - HTML 字符串
 * @returns {Object} 合并后的 CSS 规则对象
 */
function extractStyles(html) {
  try {
    const styles = {};
    const rx = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    while ((m = rx.exec(html)) !== null) {
      const css = parseCss(m[1]);
      Object.assign(styles, css);
    }
    return styles;
  } catch (e) {
    return {};
  }
}

/**
 * 匹配 CSS 选择器到节点
 * @param {Object} node - HTML 节点
 * @param {Object} cssRules - CSS 规则对象
 * @returns {Object} 匹配的 CSS 属性
 */
function matchSelector(node, cssRules) {
  try {
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
  } catch (e) {
    return {};
  }
}

// ============================================================
// 样式处理
// ============================================================

/**
 * 提取节点的所有样式（CSS + 行内）
 * @param {Object} node - HTML 节点
 * @param {Object} cssRules - CSS 规则对象
 * @returns {Object} 合并后的样式属性
 */
function _extractAllStyles(node, cssRules) {
  try {
    // 1. 从 CSS 规则匹配样式
    const cssProps = matchSelector(node, cssRules);

    // 2. 从行内 style 解析样式
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
    return { ...cssProps, ...inlineProps };
  } catch (e) {
    return {};
  }
}

/**
 * 将 CSS 属性转换为 Android 属性
 * @param {Object} allProps - 所有 CSS 属性
 * @param {Object} cssPropMap - CSS 属性映射表
 * @returns {Object} Android 属性对象
 */
function _convertCssProps(allProps, cssPropMap) {
  const attrs = {};
  try {
    for (const [prop, val] of Object.entries(allProps)) {
      const mapping = cssPropMap[prop];
      if (mapping) {
        try {
          const transformed = mapping.transform(val);
          if (transformed !== undefined && transformed !== null) {
            attrs[mapping.attr] = transformed;
          }
        } catch (transformErr) {
          // CSS 值解析失败时跳过该属性
        }
      }
    }
  } catch (e) {
    // 忽略整体转换错误
  }
  return attrs;
}

/**
 * 处理 Flexbox 相关样式
 * @param {Object} allProps - 所有 CSS 属性
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 * @returns {boolean} 是否为水平方向
 */
function _processFlexStyles(allProps, attrs) {
  let isHorizontal = false;
  try {
    // flex-direction → orientation
    if (allProps['flex-direction']) {
      const orient = _flexDirectionToOrientation(allProps['flex-direction']);
      if (orient) {
        attrs['android:orientation'] = orient;
        isHorizontal = orient === 'horizontal';
      }
    }

    // justify-content + align-items → gravity
    const justify = allProps['justify-content'];
    const align = allProps['align-items'];
    if (justify || align) {
      const gravity = _flexToGravity(justify, align, isHorizontal);
      if (gravity) {
        attrs['android:gravity'] = gravity;
      }
    }
  } catch (e) {
    // 忽略 flex 处理错误
  }
  return isHorizontal;
}

/**
 * 处理 position: absolute 样式
 * @param {Object} allProps - 所有 CSS 属性
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 * @returns {boolean} 是否需要 FrameLayout 包装
 */
function _processAbsolutePosition(allProps, attrs) {
  try {
    if (allProps['position'] === 'absolute') {
      // 设置 layout_gravity
      const layoutGravity = _absoluteToLayoutGravity(allProps);
      if (layoutGravity) {
        attrs['android:layout_gravity'] = layoutGravity;
      }
      // 设置具体位置偏移（转换为 margin）
      if (allProps['top'] && allProps['top'] !== 'auto') {
        attrs['android:layout_marginTop'] = _toDimen(allProps['top']);
      }
      if (allProps['bottom'] && allProps['bottom'] !== 'auto') {
        attrs['android:layout_marginBottom'] = _toDimen(allProps['bottom']);
      }
      if (allProps['left'] && allProps['left'] !== 'auto') {
        attrs['android:layout_marginLeft'] = _toDimen(allProps['left']);
      }
      if (allProps['right'] && allProps['right'] !== 'auto') {
        attrs['android:layout_marginRight'] = _toDimen(allProps['right']);
      }
      return true;
    }
  } catch (e) {
    // 忽略绝对定位处理错误
  }
  return false;
}

/**
 * 处理 overflow 样式
 * @param {Object} allProps - 所有 CSS 属性
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processOverflow(allProps, attrs) {
  try {
    if (allProps['overflow'] === 'hidden') {
      attrs['android:clipChildren'] = 'true';
    } else if (allProps['overflow'] === 'visible') {
      attrs['android:clipChildren'] = 'false';
    }
  } catch (e) {
    // 忽略
  }
}

// ============================================================
// 节点转换
// ============================================================

/**
 * 处理文本内容
 * @param {Object} node - HTML 节点
 * @param {string} androidTag - Android 标签名
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 * @returns {Array<Object>} 过滤后的子节点
 */
function _processTextContent(node, androidTag, attrs) {
  try {
    if (androidTag === 'TextView' || androidTag === 'Button' || androidTag === 'EditText') {
      const textContent = node.children.filter(c => c.tag === '#text').map(c => c.text).join('').trim();
      if (textContent && !attrs['android:text']) {
        attrs['android:text'] = _escapeXml(textContent);
      }
      return node.children.filter(c => c.tag !== '#text');
    }
  } catch (e) {
    // 忽略
  }
  return node.children;
}

/**
 * 处理 input 标签特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processInputTag(node, attrs) {
  try {
    const type = node.attrs.type || 'text';
    if (type === 'password') attrs['android:inputType'] = 'textPassword';
    else if (type === 'email') attrs['android:inputType'] = 'textEmailAddress';
    else if (type === 'number') attrs['android:inputType'] = 'number';
    else if (type === 'tel') attrs['android:inputType'] = 'phone';
    else if (type === 'url') attrs['android:inputType'] = 'textUri';
    else if (type === 'checkbox') {
      // 已在标签映射中处理，但这里确保属性正确
    } else if (type === 'radio') {
      // 已在标签映射中处理
    } else attrs['android:inputType'] = 'text';

    if (node.attrs.placeholder) {
      attrs['android:hint'] = _escapeXml(node.attrs.placeholder);
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 处理 img 标签特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processImgTag(node, attrs) {
  try {
    if (node.attrs.src) {
      const srcName = node.attrs.src.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
      attrs['android:src'] = '@drawable/' + srcName;
      attrs['android:contentDescription'] = node.attrs.alt || 'Image';
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 处理 a 标签特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processATag(node, attrs) {
  try {
    attrs['android:clickable'] = 'true';
    if (node.attrs.href) {
      attrs['android:tag'] = _escapeXml(node.attrs.href);
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 处理通用 HTML 属性映射
 * @param {Object} node - HTML 节点
 * @param {string} androidTag - Android 标签名
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processHtmlAttributes(node, androidTag, attrs) {
  try {
    // disabled → enabled="false"
    if (node.attrs.disabled !== undefined) {
      attrs['android:enabled'] = 'false';
    }

    // readonly → focusable="false"
    if (node.attrs.readonly !== undefined) {
      attrs['android:focusable'] = 'false';
      attrs['android:focusableInTouchMode'] = 'false';
    }

    // maxlength → maxLength
    if (node.attrs.maxlength !== undefined) {
      attrs['android:maxLength'] = node.attrs.maxlength;
    }

    // rows → minLines (textarea)
    if (node.attrs.rows !== undefined) {
      attrs['android:minLines'] = node.attrs.rows;
    }

    // cols → ems
    if (node.attrs.cols !== undefined) {
      attrs['android:ems'] = node.attrs.cols;
    }

    // autofocus → requestFocus
    if (node.attrs.autofocus !== undefined) {
      attrs['android:focusable'] = 'true';
      attrs['android:focusableInTouchMode'] = 'true';
    }

    // selected → checked="true" (RadioButton/CheckBox)
    if (node.attrs.selected !== undefined && (androidTag === 'RadioButton' || androidTag === 'CheckBox')) {
      attrs['android:checked'] = 'true';
    }

    // value → text (input/button)
    if (node.attrs.value !== undefined && (androidTag === 'EditText' || androidTag === 'Button')) {
      if (!attrs['android:text']) {
        attrs['android:text'] = _escapeXml(node.attrs.value);
      }
    }

    // for → labelFor (label 标签)
    if (node.attrs.for !== undefined && node.tag === 'label') {
      attrs['android:labelFor'] = '@+id/' + node.attrs.for;
    }

    // id
    if (node.attrs.id) {
      attrs['android:id'] = '@+id/' + node.attrs.id;
    }
  } catch (e) {
    // 忽略属性处理错误
  }
}

/**
 * 处理 textarea 特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processTextareaTag(node, attrs) {
  try {
    attrs['android:inputType'] = 'textMultiLine';
    if (node.attrs.placeholder) {
      attrs['android:hint'] = _escapeXml(node.attrs.placeholder);
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 处理 progress 标签特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processProgressTag(node, attrs) {
  try {
    // ProgressBar 的 style 使用无前缀的 style 属性（Android XML 标准写法）
    attrs['style'] = '?android:attr/progressBarStyleHorizontal';
    if (node.attrs.value !== undefined) {
      attrs['android:progress'] = node.attrs.value;
    }
    if (node.attrs.max !== undefined) {
      attrs['android:max'] = node.attrs.max;
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 处理 hr 标签特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processHrTag(node, attrs) {
  try {
    attrs['android:layout_height'] = '1dp';
    // 移除不适用于 View 的文本相关属性
    delete attrs['android:textColor'];
    delete attrs['android:textSize'];
    delete attrs['android:textStyle'];
    delete attrs['android:textAlignment'];
    // 尝试从行内 style 直接解析背景色，避免触发 CSS 映射产生 textColor
    let color = '#e0e0e0';
    if (node.attrs.style) {
      const styles = node.attrs.style.split(';');
      for (const decl of styles) {
        const idx = decl.indexOf(':');
        if (idx > 0) {
          const prop = decl.substring(0, idx).trim().toLowerCase();
          const val = decl.substring(idx + 1).trim();
          if (prop === 'background-color' || prop === 'background') {
            color = _toColor(val);
            break;
          } else if (prop === 'color' && color === '#e0e0e0') {
            // 如果只有 color 没有 background-color，用 color 作为分割线颜色
            color = _toColor(val);
          }
        }
      }
    }
    attrs['android:background'] = color;
  } catch (e) {
    // 忽略
  }
}

/**
 * 处理 video 标签特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processVideoTag(node, attrs) {
  try {
    if (node.attrs.src) {
      attrs['android:videoURI'] = _escapeXml(node.attrs.src);
    }
    if (node.attrs.poster) {
      // VideoView 不支持 poster，跳过
    }
    if (node.attrs.controls !== undefined) {
      // VideoView 默认有 MediaController，跳过
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 处理 iframe 标签特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processIframeTag(node, attrs) {
  try {
    if (node.attrs.src) {
      attrs['android:url'] = _escapeXml(node.attrs.src);
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 处理 canvas 标签特殊属性
 * @param {Object} node - HTML 节点
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processCanvasTag(node, attrs) {
  try {
    if (node.attrs.width) {
      attrs['android:layout_width'] = _toDimen(node.attrs.width, 'match_parent');
    }
    if (node.attrs.height) {
      attrs['android:layout_height'] = _toDimen(node.attrs.height, 'wrap_content');
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 构建 XML 字符串
 * @param {string} androidTag - Android 标签名
 * @param {Object} attrs - 属性对象
 * @param {string} childrenXml - 子节点 XML
 * @param {number} depth - 缩进深度
 * @returns {string} XML 字符串
 */
function _buildXml(androidTag, attrs, childrenXml, depth) {
  try {
    const indent = '    '.repeat(depth + 1);
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => `${k}="${_escapeXml(v)}"`)
      .join('\n' + indent + '    ');

    const hasChildren = childrenXml && childrenXml.trim().length > 0;

    if (!hasChildren) {
      return `${indent}<${androidTag}\n${indent}    ${attrStr} />\n`;
    } else {
      return `${indent}<${androidTag}\n${indent}    ${attrStr}>\n${childrenXml}${indent}</${androidTag}>\n`;
    }
  } catch (e) {
    return '';
  }
}

/**
 * 处理 input[type="checkbox"] 和 input[type="radio"] 的特殊属性
 * @param {Object} node - HTML 节点
 * @param {string} androidTag - Android 标签名
 * @param {Object} attrs - 当前 Android 属性对象（会被修改）
 */
function _processCheckboxRadioTag(node, androidTag, attrs) {
  try {
    if (node.attrs.value !== undefined) {
      attrs['android:text'] = _escapeXml(node.attrs.value);
    }
    if (node.attrs.checked !== undefined || node.attrs.selected !== undefined) {
      attrs['android:checked'] = 'true';
    }
    if (node.attrs.disabled !== undefined) {
      attrs['android:enabled'] = 'false';
    }
  } catch (e) {
    // 忽略
  }
}

/**
 * 获取节点对应的标签映射，支持 input[type] 特殊匹配
 * @param {Object} node - HTML 节点
 * @param {Object} tagMap - 标签映射表
 * @returns {Object|null} 标签映射或 null
 */
function _getTagMapping(node, tagMap) {
  try {
    // 先尝试带类型的 input 匹配
    if (node.tag === 'input' && node.attrs.type) {
      const typeKey = 'input[type="' + node.attrs.type + '"]';
      if (tagMap[typeKey]) return tagMap[typeKey];
    }
    return tagMap[node.tag] || null;
  } catch (e) {
    return null;
  }
}

/**
 * 转换单个 HTML 节点为 Android XML
 * @param {Object} node - HTML 节点
 * @param {Object} cssRules - CSS 规则对象
 * @param {Object} options - 转换选项
 * @param {number} depth - 缩进深度
 * @returns {string} Android XML 字符串
 */
function convertNode(node, cssRules, options, depth = 0) {
  try {
    if (node.tag === '#text') {
      return node.text ? _escapeXml(node.text) : '';
    }

    const tagMap = options.tagMap || DEFAULT_TAG_MAP;
    const cssPropMap = options.cssPropMap || DEFAULT_CSS_PROP_MAP;

    const mapping = _getTagMapping(node, tagMap);
    if (!mapping) {
      // 未知标签，递归处理子元素
      return node.children.map(c => convertNode(c, cssRules, options, depth)).join('');
    }

    // 跳过的标签（audio, br）
    if (mapping.type === null) {
      return '';
    }

    const androidTag = mapping.type;
    const isLayout = mapping.layout;
    const isSelfClosing = mapping.selfClosing;

    // 收集属性
    const attrs = {};

    // 1. 默认尺寸
    attrs['android:layout_width'] = 'match_parent';
    attrs['android:layout_height'] = isLayout ? 'wrap_content' : 'wrap_content';

    // 2. 提取所有样式
    const allProps = _extractAllStyles(node, cssRules);

    // 3. 处理 Flexbox 样式
    const isHorizontal = _processFlexStyles(allProps, attrs);

    // 4. 处理 position: absolute
    const needsFrameLayout = _processAbsolutePosition(allProps, attrs);

    // 5. 处理 overflow
    _processOverflow(allProps, attrs);

    // 6. 转换常规 CSS 属性为 Android 属性
    const cssAttrs = _convertCssProps(allProps, cssPropMap);
    Object.assign(attrs, cssAttrs);

    // 7. 处理 HTML 通用属性
    _processHtmlAttributes(node, androidTag, attrs);

    // 8. 处理文本内容
    let remainingChildren = _processTextContent(node, androidTag, attrs);

    // 9. 特殊标签处理
    if (node.tag === 'input') {
      const type = node.attrs.type || 'text';
      if (type === 'checkbox' || type === 'radio') {
        _processCheckboxRadioTag(node, androidTag, attrs);
      } else {
        _processInputTag(node, attrs);
      }
    } else if (node.tag === 'textarea') {
      _processTextareaTag(node, attrs);
    } else if (node.tag === 'img') {
      _processImgTag(node, attrs);
    } else if (node.tag === 'a') {
      _processATag(node, attrs);
    } else if (node.tag === 'progress') {
      _processProgressTag(node, attrs);
    } else if (node.tag === 'hr') {
      _processHrTag(node, attrs);
    } else if (node.tag === 'video') {
      _processVideoTag(node, attrs);
    } else if (node.tag === 'iframe') {
      _processIframeTag(node, attrs);
    } else if (node.tag === 'canvas') {
      _processCanvasTag(node, attrs);
    }

    // 10. orientation for LinearLayout
    if (androidTag === 'LinearLayout' && !attrs['android:orientation']) {
      attrs['android:orientation'] = mapping.defaultOrient || 'vertical';
    }

    // 11. 递归处理子元素（selfClosing 标签忽略子节点）
    let childrenXml = '';
    if (!isSelfClosing) {
      for (const child of remainingChildren) {
        childrenXml += convertNode(child, cssRules, options, depth + 1);
      }
    }

    // 12. 构建 XML
    let nodeXml = _buildXml(androidTag, attrs, childrenXml, depth);

    // 13. 如果需要 FrameLayout 包装（position: absolute）
    if (needsFrameLayout && depth >= 0) {
      const frameAttrs = {
        'android:layout_width': attrs['android:layout_width'] || 'match_parent',
        'android:layout_height': attrs['android:layout_height'] || 'wrap_content',
      };
      // 保留 layout_gravity 在 FrameLayout 上（用于子View定位）
      if (attrs['android:layout_gravity']) {
        frameAttrs['android:layout_gravity'] = attrs['android:layout_gravity'];
      }
      // 移除子节点自身的 margin，因为它们现在是相对于 FrameLayout 的
      delete attrs['android:layout_marginTop'];
      delete attrs['android:layout_marginBottom'];
      delete attrs['android:layout_marginLeft'];
      delete attrs['android:layout_marginRight'];
      delete attrs['android:layout_gravity'];

      // 重新构建子节点 XML（无 margin 版本）
      nodeXml = _buildXml(androidTag, attrs, childrenXml, depth + 1);

      const frameIndent = '    '.repeat(depth + 1);
      const frameAttrStr = Object.entries(frameAttrs)
        .map(([k, v]) => `${k}="${_escapeXml(v)}"`)
        .join('\n' + frameIndent + '    ');

      return `${frameIndent}<FrameLayout\n${frameIndent}    ${frameAttrStr}>\n${nodeXml}${frameIndent}</FrameLayout>\n`;
    }

    return nodeXml;
  } catch (e) {
    // 节点转换失败时返回空字符串
    return '';
  }
}

// ============================================================
// 主入口
// ============================================================

/**
 * 转换 HTML 为 Android XML Layout
 * @param {string} html - HTML 字符串
 * @param {Object} [options={}] - 转换选项
 * @param {Object} [options.tagMap] - 自定义标签映射表
 * @param {Object} [options.cssPropMap] - 自定义 CSS 属性映射表
 * @returns {string} Android XML Layout 字符串
 */
function convert(html, options = {}) {
  try {
    _idCounter = 0;

    if (!html || typeof html !== 'string') {
      return _buildDefaultXml('');
    }

    // 提取 CSS
    const cssRules = extractStyles(html);

    // 解析 HTML
    const nodes = parseHtml(html);

    if (!nodes || nodes.length === 0) {
      return _buildDefaultXml('');
    }

    // 生成 XML
    let childrenXml = '';
    for (const node of nodes) {
      childrenXml += convertNode(node, cssRules, options, 0);
    }

    return _buildDefaultXml(childrenXml);
  } catch (e) {
    // 整体转换失败时返回默认 XML
    return _buildDefaultXml('');
  }
}

/**
 * 构建默认的根布局 XML
 * @param {string} childrenXml - 子节点 XML
 * @returns {string} 完整的 Android XML Layout
 */
function _buildDefaultXml(childrenXml) {
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += '<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n';
  xml += '    android:layout_width="match_parent"\n';
  xml += '    android:layout_height="match_parent"\n';
  xml += '    android:orientation="vertical">\n';
  xml += childrenXml;
  xml += '</LinearLayout>\n';
  return xml;
}

// ============================================================
// 模块导出
// ============================================================

module.exports = {
  convert,
  parseHtml,
  parseCss,
  // 导出内部工具函数以便测试和扩展
  _toDimen,
  _toSp,
  _toColor,
  _escapeXml,
  _flexDirectionToOrientation,
  _flexToGravity,
  _textAlignToTextAlignment,
  DEFAULT_TAG_MAP,
  DEFAULT_CSS_PROP_MAP
};

