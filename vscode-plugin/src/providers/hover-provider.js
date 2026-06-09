const vscode = require('vscode');
const vs = vscode;
const { Logger } = require('../logger');
const { ALE, AA, XAP } = require('../constants');

class HoverProvider {
    provideHover(doc, pos) {
        const range = doc.getWordRangeAtPosition(pos, /@(drawable|layout|string|dimen)\/[a-zA-Z0-9_]+/);
        if (!range) return;
        const word = doc.getText(range);
        const m = word.match(/@(drawable|layout|string|dimen)\/([a-zA-Z0-9_]+)/);
        if (!m) return;
        const type = m[1], name = m[2];
        const md = new vs.MarkdownString();
        md.appendMarkdown('**' + word + '**\n\n');
        if (type === 'drawable') md.appendMarkdown('资源类型: Drawable\n\n预览: `' + name + '`\n');
        else if (type === 'layout') md.appendMarkdown('资源类型: Layout\n\n文件名: `' + name + '.xml`\n');
        else if (type === 'string') {
            md.appendMarkdown('资源类型: String\n\n');
            const v = this._val(type, name);
            if (v) md.appendMarkdown('值: `' + v + '`\n');
        } else if (type === 'dimen') {
            md.appendMarkdown('资源类型: Dimension\n\n');
            const v = this._val(type, name);
            if (v) md.appendMarkdown('值: `' + v + '`\n');
        }
        return new vs.Hover(md, range);
    }
    _val(type, name) {
        const wf = vs.workspace.workspaceFolders;
        if (!wf) return null;
        const fp = path.join(wf[0].uri.fsPath, 'res', 'values', type === 'string' ? 'strings.xml' : 'dimens.xml');
        try {
            const c = fs.readFileSync(fp, 'utf-8');
            const rx = new RegExp('<' + (type === 'string' ? 'string' : 'dimen') + ' name="' + name + '">([^<]+)</');
            const m = c.match(rx);
            return m ? m[1] : null;
        } catch (e) { return null; }
    }
}

module.exports = { HoverProvider };
