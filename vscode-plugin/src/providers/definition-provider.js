const vscode = require('vscode');
const vs = vscode;
const { Logger } = require('../logger');
const { ALE, AA, XAP } = require('../constants');

class DPv {
    provideDefinition(doc, position) {
        const text = doc.getText();
        const line = doc.lineAt(position).text;
        const layoutName = path.basename(doc.uri.fsPath, '.xml');
        const wf = vs.workspace.workspaceFolders;
        if (!wf) return;
        const src = vs.Uri.joinPath(wf[0].uri, 'src');
        const locs = [];
        const searchInDir = (dirUri, exts) => {
            try {
                const entries = fs.readdirSync(dirUri.fsPath, { withFileTypes: true });
                for (const ent of entries) {
                    if (ent.isDirectory()) searchInDir(vs.Uri.joinPath(dirUri, ent.name), exts);
                    else if (exts.some(e => ent.name.endsWith(e))) {
                        const p = path.join(dirUri.fsPath, ent.name);
                        const c = fs.readFileSync(p, 'utf-8');
                        const patterns = [
                            new RegExp('R\\.layout\\.' + layoutName + '\\b'),
                            new RegExp('setContentView\\(R\\.layout\\.' + layoutName + '\\)'),
                            new RegExp('LayoutInflater.*inflate\\(.*R\\.layout\\.' + layoutName)
                        ];
                        if (patterns.some(rx => rx.test(c))) {
                            const u = vs.Uri.file(p);
                            locs.push(new vs.Location(u, new vs.Position(0, 0)));
                        }
                    }
                }
            } catch (e) {}
        };
        searchInDir(src, ['.kt', '.java']);
        if (locs.length === 0) {
            const guessKt = vs.Uri.joinPath(wf[0].uri, 'src', 'main', 'java');
            searchInDir(guessKt, ['.kt', '.java']);
        }
        return locs;
    }
}

module.exports = { DPv };
