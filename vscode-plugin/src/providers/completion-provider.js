const vscode = require('vscode');
const vs = vscode;
const { Logger } = require('../logger');
const { ALE, AA, XAP } = require('../constants');

class CP {
    provideCompletionItems(doc) {
        const items = [];
        LT.forEach(t => {
            const it = new vs.CompletionItem(t.n, vs.CompletionItemKind.Snippet);
            it.label = t.n;
            it.detail = t.dt || t.ds;
            it.documentation = new vs.MarkdownString('**' + t.n + '**\n\n' + t.ds + '\n\n```xml\n' + t.x + '\n```');
            it.insertText = new vs.SnippetString(t.x);
            it.sortText = '0' + t.n;
            it.filterText = t.n + ' ' + t.l.toLowerCase();
            items.push(it);
        });
        return items;
    }
}

module.exports = { CP };
