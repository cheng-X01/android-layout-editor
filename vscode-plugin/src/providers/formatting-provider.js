const vscode = require('vscode');
const vs = vscode;
const { Logger } = require('../logger');
const { ALE, AA, XAP } = require('../constants');

class FmtProvider {
    provideDocumentFormattingEdits(doc) {
        const text = doc.getText();
        const out = this._fmt(text);
        if (out === text) return [];
        return [vs.TextEdit.replace(new vs.Range(0, 0, doc.lineCount, 0), out)];
    }
    _fmt(text) {
        let i = 0, out = '', ind = 0;
        const N = '\n', S = '    ';
        const skip = () => { while (i < text.length && /\s/.test(text[i])) i++; };
        const tag = () => { let t = ''; while (i < text.length && text[i] !== '>' && text[i] !== ' ' && text[i] !== '/' && !/\s/.test(text[i])) t += text[i++]; return t; };
        const attrs = () => { let a = '', inQ = false, qc = null; while (i < text.length) { const c = text[i++]; a += c; if (!inQ && (c === '"' || c === "'")) { inQ = true; qc = c; } else if (inQ && c === qc) inQ = false; if (!inQ && text[i] === '>') break; } return a; };
        while (i < text.length) {
            skip();
            if (text[i] === '<') {
                i++;
                if (text[i] === '!') { let c = ''; while (i < text.length && text[i] !== '>' && text[i] !== '\n') c += text[i++]; if (text[i] === '>') c += text[i++]; out += N + S.repeat(ind) + '<' + c.trim(); }
                else if (text[i] === '/') { i++; const t = tag(); if (text[i] === '>') i++; ind = Math.max(0, ind - 1); out += N + S.repeat(ind) + '</' + t + '>'; }
                else {
                    const t = tag(); let a = ''; if (text[i] !== '>' && text[i] !== '/') a = attrs(); const sc = text[i] === '/'; if (sc) i++; if (text[i] === '>') i++; const leaf = LW.has(t); if (a) { const s = this._sort(a); out += N + S.repeat(ind) + '<' + t + s + (sc ? ' />' : '>'); } else out += N + S.repeat(ind) + '<' + t + (sc ? ' />' : '>'); if (!sc && !leaf) ind++;
                }
            } else { let txt = ''; while (i < text.length && text[i] !== '<') txt += text[i++]; if (txt.trim()) out += txt.trim(); }
        }
        return out.trim() + N;
    }
    _sort(a) {
        const p = [];
        const rx = /([\w:]+)="([^"]*)"/g;
        let m;
        while ((m = rx.exec(a)) !== null) p.push([m[1], m[2]]);
        p.sort((x, y) => { const ax = x[0].startsWith('android:') ? 1 : 0, ay = y[0].startsWith('android:') ? 1 : 0; if (ax !== ay) return ax - ay; return x[0].localeCompare(y[0]); });
        let s = '';
        for (const [k, v] of p) s += ' ' + k + '="' + v + '"';
        return s;
    }
}

module.exports = { FmtProvider };
