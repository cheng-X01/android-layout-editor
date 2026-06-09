const vscode = require('vscode');
const vs = vscode;
const { Logger } = require('../logger');
const { ALE, AA, XAP } = require('../constants');

class DLP {
    provideDocumentLinks(doc) {
        const text = doc.getText();
        const links = [];
        const lr = /@(layout|drawable)\/([a-zA-Z0-9_]+)/g;
        let m;
        while ((m = lr.exec(text)) !== null) {
            const wf = vs.workspace.workspaceFolders;
            if (!wf) continue;
            const type = m[1], name = m[2];
            const dir = type === 'layout' ? vs.Uri.joinPath(wf[0].uri, 'res', 'layout') : vs.Uri.joinPath(wf[0].uri, 'res', 'drawable');
            const fu = vs.Uri.joinPath(dir, name + '.xml');
            try {
                fs.accessSync(fu.fsPath);
                links.push(new vs.DocumentLink(new vs.Range(doc.positionAt(m.index), doc.positionAt(m.index + m[0].length)), fu));
            } catch (e) {}
        }
        return links;
    }
}

module.exports = { DLP };
