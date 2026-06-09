const vscode = require('vscode');
const vs = vscode;
const { Logger } = require('./logger');

class XV {
    constructor(dc) {
        this.dc = dc;
    }
    validate(doc) {
        const diags = [], text = doc.getText(), uri = doc.uri;
        try {
            this._vStruct(text, doc, diags);
            this._vReq(text, doc, diags);
            this._vVals(text, doc, diags);
            this._vNest(text, doc, diags);
            this._vA11y(text, doc, diags);
            this._validateLint(text, doc, diags);
        } catch (e) { }
        this.dc.set(uri, diags);
    }
    _vStruct(text, doc, diags) {
        const lines = text.split('\n');
        let hasDecl = false, hasRoot = false;
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i].trim();
            if (l.startsWith('<?xml')) {
                hasDecl = true;
                if (!l.includes('encoding="utf-8"') && !l.includes("encoding='utf-8'")) {
                    const c = l.indexOf('<?xml');
                    diags.push(this._d(doc, i, c, c + 5, vs.DiagnosticSeverity.Warning, '建议使用utf-8编码'));
                }
            }
            if (l.startsWith('<') && !l.startsWith('<?') && !l.startsWith('<!--')) hasRoot = true;
        }
        if (!hasDecl) diags.push(this._d(doc, 0, 0, 0, vs.DiagnosticSeverity.Warning, '缺少XML声明 '));
        if (!hasRoot) diags.push(this._d(doc, 0, 0, 0, vs.DiagnosticSeverity.Error, 'XML缺少根元素'));
    }
    _vReq(text, doc, diags) {
        const rx = /<(LinearLayout|ConstraintLayout|FrameLayout|RelativeLayout|ScrollView|HorizontalScrollView|TextView|Button|EditText|ImageView|ImageButton|CheckBox|RadioButton|Switch|ProgressBar|SeekBar|Spinner|RecyclerView|CardView|View|ViewStub|include|merge)(\s|>)/g;
        let m;
        while ((m = rx.exec(text)) !== null) {
            const tg = m[1];
            if (tg === 'include' || tg === 'merge') continue;
            const sp = m.index, ln = doc.positionAt(sp).line, te = text.indexOf('>', sp);
            if (te === -1) continue;
            const tc = text.substring(sp, te);
            if (!tc.includes('layout_width')) {
                const c = doc.positionAt(sp).character;
                diags.push(this._d(doc, ln, c, c + tg.length, vs.DiagnosticSeverity.Error, `<${tg}> 缺少android:layout_width`));
            }
            if (!tc.includes('layout_height')) {
                const c = doc.positionAt(sp).character;
                diags.push(this._d(doc, ln, c, c + tg.length, vs.DiagnosticSeverity.Error, `<${tg}> 缺少android:layout_height`));
            }
        }
    }
    _vVals(text, doc, diags) {
        let m;
        const sr = /android:(layout_width|layout_height)="([^"]+)"/g;
        while ((m = sr.exec(text)) !== null) {
            const an = m[1], av = m[2], ve = ['match_parent', 'wrap_content'].includes(av);
            const vd = /^\d+(\.\d+)?dp$/.test(av) || /^\d+(\.\d+)?px$/.test(av) || /^\d+(\.\d+)?sp$/.test(av) || /^\d+(\.\d+)?pt$/.test(av) || /^\d+(\.\d+)?mm$/.test(av) || /^\d+(\.\d+)?in$/.test(av);
            if (!ve && !vd) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[0].length, vs.DiagnosticSeverity.Warning, `android:${an}="${av}" 值无效`));
            }
        }
        const vr = /android:visibility="([^"]+)"/g;
        while ((m = vr.exec(text)) !== null) {
            if (!['visible', 'invisible', 'gone'].includes(m[1])) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[0].length, vs.DiagnosticSeverity.Warning, `android:visibility="${m[1]}" 值无效`));
            }
        }
        const or = /android:orientation="([^"]+)"/g;
        while ((m = or.exec(text)) !== null) {
            if (!['vertical', 'horizontal'].includes(m[1])) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[0].length, vs.DiagnosticSeverity.Warning, `android:orientation="${m[1]}" 值无效`));
            }
        }
    }
    _vNest(text, doc, diags) {
        for (const lt of LW) {
            const rx = new RegExp(`<${lt}(\\s[^>]*)?>[\\s\\S]*?<\\w+`, 'g');
            let m;
            while ((m = rx.exec(text)) !== null) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + lt.length + 1, vs.DiagnosticSeverity.Error, `<${lt}> 不能包含子View`));
            }
        }
    }
    _vA11y(text, doc, diags) {
        let m;
        const ir = /<(ImageView|ImageButton)(\s[^>]*)?\/?>/g;
        while ((m = ir.exec(text)) !== null) {
            if (!m[0].includes('contentDescription')) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[1].length + 1, vs.DiagnosticSeverity.Error, `[无障碍] <${m[1]}> 缺少contentDescription`));
            }
        }
        const cr = /<(TextView|Button|EditText|CheckBox|RadioButton|Switch|ImageButton|ImageView|View)(\s[^>]*)?android:clickable="true"(\s[^>]*)?android:layout_height="(\d+)dp"(\s[^>]*)?\/?>/g;
        while ((m = cr.exec(text)) !== null) {
            const h = parseInt(m[4]);
            if (h < 48) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[1].length + 1, vs.DiagnosticSeverity.Warning, `[无障碍] <${m[1]}> 触摸目标${h}dp,建议>=48dp`));
            }
        }
        const wr = /<(Button|ImageButton)(\s[^>]*)?android:layout_height="wrap_content"(\s[^>]*)?\/?>/g;
        while ((m = wr.exec(text)) !== null) {
            const tc = m[0];
            if (!tc.includes('minHeight="48dp"') && !tc.includes('minHeight="48.0dp"')) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[1].length + 1, vs.DiagnosticSeverity.Warning, `[无障碍] <${m[1]}> 建议设minHeight=48dp`));
            }
        }
        const er = /<EditText(\s[^>]*)?\/?>/g;
        while ((m = er.exec(text)) !== null) {
            const tc = m[0];
            if (!tc.includes('hint') && !tc.includes('labelFor')) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + 8, vs.DiagnosticSeverity.Warning, '[无障碍] <EditText> 缺少hint或labelFor'));
            }
        }
        const tr = /<(ScrollView|HorizontalScrollView|RecyclerView|NestedScrollView)(\s[^>]*)?\/?>/g;
        while ((m = tr.exec(text)) !== null) {
            if (!m[0].includes('accessibilityLiveRegion')) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[1].length + 1, vs.DiagnosticSeverity.Information, `[无障碍] <${m[1]}> 建议设accessibilityLiveRegion`));
            }
        }
    }
    _validateLint(text, doc, diags) {
        let m;
        const deepLinear = /(<LinearLayout[\s\S]*?){6,}/g;
        while ((m = deepLinear.exec(text)) !== null) {
            const p = doc.positionAt(m.index);
            diags.push(this._d(doc, p.line, p.character, p.character + 12, vs.DiagnosticSeverity.Warning, '[Lint] LinearLayout嵌套超过5层，影响性能，建议使用ConstraintLayout'));
        }
        const rootRx = /<(LinearLayout|FrameLayout|RelativeLayout)(\s[^>]*)?>\s*<(\w+)(\s[^>]*)?>\s*<\/\1>/g;
        while ((m = rootRx.exec(text)) !== null) {
            const inner = m[0];
            const attrs = m[2] || '';
            const hasAttrs = /android:(id|background|padding|gravity|layout_margin)/.test(attrs);
            if (!hasAttrs) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[1].length + 1, vs.DiagnosticSeverity.Warning, '[Lint] 根布局仅包含一个子元素且无自身属性，建议移除不必要的根布局'));
            }
        }
        const weightRx = /<LinearLayout[\s\S]*?android:layout_weight=/g;
        let parentLinear = false, lastIdx = 0;
        while ((m = weightRx.exec(text)) !== null) {
            const before = text.substring(lastIdx, m.index);
            const open = (before.match(/<LinearLayout/g) || []).length;
            const close = (before.match(/<\/LinearLayout>/g) || []).length;
            if (open > close) {
                const p = doc.positionAt(m.index);
                diags.push(this._d(doc, p.line, p.character, p.character + m[0].length, vs.DiagnosticSeverity.Warning, '[Lint] 在嵌套的LinearLayout中使用layout_weight会导致多次测量，影响性能'));
            }
        }
        const allTags = text.match(/<\w+(\s|>)/g) || [];
        if (allTags.length > 80) {
            diags.push(this._d(doc, 0, 0, 0, vs.DiagnosticSeverity.Warning, '[Lint] 视图数量超过80个(' + allTags.length + ')，可能影响渲染性能'));
        }
        const hardStr = /android:text="([^@][^"]*)"/g;
        while ((m = hardStr.exec(text)) !== null) {
            const p = doc.positionAt(m.index);
            diags.push(this._d(doc, p.line, p.character, p.character + m[0].length, vs.DiagnosticSeverity.Warning, '[Lint] 硬编码文本 "' + m[1] + '"，建议使用@string资源'));
        }
        const hardDim = /android:(layout_width|layout_height|layout_margin|layout_marginTop|layout_marginBottom|layout_marginLeft|layout_marginRight|padding|paddingTop|paddingBottom|paddingLeft|paddingRight|textSize)="(\d+)dp"/g;
        while ((m = hardDim.exec(text)) !== null) {
            const p = doc.positionAt(m.index);
            diags.push(this._d(doc, p.line, p.character, p.character + m[0].length, vs.DiagnosticSeverity.Information, '[Lint] 硬编码尺寸 ' + m[2] + 'dp，建议使用@dimen资源'));
        }
        const depr = /android:singleLine="true"/g;
        while ((m = depr.exec(text)) !== null) {
            const p = doc.positionAt(m.index);
            diags.push(this._d(doc, p.line, p.character, p.character + m[0].length, vs.DiagnosticSeverity.Warning, '[Lint] singleLine已废弃，建议使用maxLines="1"配合ellipsize'));
        }
        const rtlRx = /android:layout_(margin|padding)(Left|Right)=/g;
        while ((m = rtlRx.exec(text)) !== null) {
            const p = doc.positionAt(m.index);
            diags.push(this._d(doc, p.line, p.character, p.character + m[0].length, vs.DiagnosticSeverity.Warning, '[Lint] 使用left/right方向属性，建议改用start/end以支持RTL'));
        }
        const svRv = /<ScrollView[\s\S]*?<RecyclerView[\s\S]*?<\/ScrollView>/g;
        while ((m = svRv.exec(text)) !== null) {
            const p = doc.positionAt(m.index);
            diags.push(this._d(doc, p.line, p.character, p.character + 10, vs.DiagnosticSeverity.Error, '[Lint] ScrollView内包含RecyclerView会导致滚动冲突，建议使用NestedScrollView'));
        }
        const overdrawRx = /<\w+(\s[^>]*)?android:background="#[0-9a-fA-F]{6,8}"[^>]*>[\s\S]*?<\w+(\s[^>]*)?android:background="#[0-9a-fA-F]{6,8}"[^>]*>/g;
        while ((m = overdrawRx.exec(text)) !== null) {
            const p = doc.positionAt(m.index);
            diags.push(this._d(doc, p.line, p.character, p.character + 10, vs.DiagnosticSeverity.Warning, '[Lint] 嵌套View均设置了背景色，可能导致过度绘制'));
        }
    }
    _d(doc, l, s, e, sev, msg) {
        return new vs.Diagnostic(new vs.Range(l, s, l, e), msg, sev);
    }
}

module.exports = { XV };
