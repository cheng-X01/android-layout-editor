const vscode = require('vscode');
const vs = vscode;
const { Logger } = require('../logger');
const { ALE, AA, XAP } = require('../constants');

class CLP {
    provideCodeLenses(doc) {
        const lenses = [];
        if (!doc.uri.path.includes('/res/layout/')) return lenses;
        const layoutName = path.basename(doc.uri.fsPath, '.xml');
        const wf = vs.workspace.workspaceFolders;
        if (!wf) return lenses;
        const src = vs.Uri.joinPath(wf[0].uri, 'src');
        let actName = '';
        const searchFile = (dirUri) => {
            try {
                const entries = fs.readdirSync(dirUri.fsPath, { withFileTypes: true });
                for (const ent of entries) {
                    if (ent.isDirectory()) searchFile(vs.Uri.joinPath(dirUri, ent.name));
                    else if (ent.name.endsWith('.kt') || ent.name.endsWith('.java')) {
                        const p = path.join(dirUri.fsPath, ent.name);
                        const c = fs.readFileSync(p, 'utf-8');
                        if (new RegExp('R\\.layout\\.' + layoutName + '\\b').test(c)) {
                            actName = ent.name.replace(/\.(kt|java)$/, '');
                            return;
                        }
                    }
                }
            } catch (e) {}
        };
        searchFile(src);
        if (!actName) actName = toPascalCase(layoutName) + 'Activity';
        const lens = new vs.CodeLens(new vs.Range(0, 0, 0, 0), {
            title: 'Go to Activity: ' + actName + '.kt',
            command: 'androidLayoutEditor.openCodeLensTarget',
            arguments: [doc.uri, layoutName, actName]
        });
        lenses.push(lens);
        return lenses;
    }
}

module.exports = { CLP };
