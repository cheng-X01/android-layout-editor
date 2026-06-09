const vscode = require('vscode');
const vs = vscode;
const { Logger } = require('../logger');
const { ALE, AA, XAP } = require('../constants');

class RsrcProvider {
    constructor() {
        this._c = new Map();
        this._t = 0;
    }
    provideCompletionItems(doc, pos) {
        const line = doc.lineAt(pos).text.substring(0, pos.character);
        const m = line.match(/@(drawable|layout|string|dimen)\/$/);
        if (!m) return [];
        const type = m[1], items = [];
        const res = this._scan(type);
        for (const r of res) {
            const it = new vs.CompletionItem(r, vs.CompletionItemKind.Value);
            it.insertText = r;
            it.detail = '@' + type + '/' + r;
            items.push(it);
        }
        return items;
    }
    _scan(type) {
        const now = Date.now();
        if (now - this._t < 5000) {
            const x = this._c.get(type);
            if (x) return x;
        }
        const wf = vs.workspace.workspaceFolders;
        if (!wf) return [];
        const dir = vs.Uri.joinPath(wf[0].uri, 'res', type === 'drawable' ? 'drawable' : type === 'layout' ? 'layout' : 'values');
        const out = [];
        try {
            const ents = fs.readdirSync(dir.fsPath, { withFileTypes: true });
            for (const e of ents) {
                if (e.isFile()) {
                    const n = e.name.replace(/\.(xml|png|jpg|webp)$/, '');
                    if (n && n !== 'strings' && n !== 'dimens' && n !== 'colors' && n !== 'styles') out.push(n);
                } else if (type === 'drawable' && e.isDirectory() && e.name.startsWith('drawable')) {
                    const sub = fs.readdirSync(path.join(dir.fsPath, e.name));
                    for (const s of sub) {
                        const n = s.replace(/\.[^.]+$/, '');
                        if (n) out.push(n);
                    }
                }
            }
        } catch (e) {}
        if (type === 'string' || type === 'dimen') {
            try {
                const fp = path.join(dir.fsPath, type === 'string' ? 'strings.xml' : 'dimens.xml');
                if (fs.existsSync(fp)) {
                    const c = fs.readFileSync(fp, 'utf-8');
                    const rx = type === 'string' ? /<string name="([^"]+)">/g : /<dimen name="([^"]+)">/g;
                    let m;
                    while ((m = rx.exec(c)) !== null) out.push(m[1]);
                }
            } catch (e) {}
        }
        this._c.set(type, out);
        this._t = now;
        return out;
    }
}

module.exports = { RsrcProvider };
