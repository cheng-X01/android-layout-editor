/**
 * Android Layout Editor - VS Code Extension
 * Entry point (modular version)
 * @version 2.14.2
 */

const vscode = require('vscode');
const vs = vscode;

const { Logger } = require('./logger');
const { ALE } = require('./constants');
const { XV } = require('./validator');
const { EP } = require('./editor-provider');
const { registerCommands } = require('./commands');

// Language Providers
const { CP } = require('./providers/completion-provider');
const { DPv } = require('./providers/definition-provider');
const { DLP } = require('./providers/document-link-provider');
const { CLP } = require('./providers/code-lens-provider');
const { FmtProvider } = require('./providers/formatting-provider');
const { RsrcProvider } = require('./providers/resource-provider');
const { HoverProvider } = require('./providers/hover-provider');

/**
 * Extension activation
 * @param {vscode.ExtensionContext} ctx
 */
function activate(ctx) {
  try {
    Logger.log('activate started');

    // Diagnostic collection
    const dc = vs.languages.createDiagnosticCollection(ALE);
    ctx.subscriptions.push(dc);

    // Validator
    const val = new XV(dc);

    // Custom Editor Provider
    try {
      const prov = new EP(ctx);
      prov.setV(val);
      ctx.subscriptions.push(
        vs.window.registerCustomEditorProvider(
          ALE + '.layoutEditor',
          prov,
          {
            supportsMultipleEditorsPerDocument: false,
            webviewOptions: { retainContextWhenHidden: true }
          }
        )
      );
      Logger.log('registered', 'CustomEditorProvider');
    } catch (e) {
      Logger.error('CustomEditorProvider registration failed', e);
    }

    // Document change listeners for validation
    ctx.subscriptions.push(
      vs.workspace.onDidOpenTextDocument(d => {
        if (d.uri.scheme === 'file' && d.uri.path.endsWith('.xml')) {
          val.validate(d);
        }
      })
    );

    let vt;
    ctx.subscriptions.push(
      vs.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.scheme === 'file' && e.document.uri.path.endsWith('.xml')) {
          clearTimeout(vt);
          vt = setTimeout(() => val.validate(e.document), 500);
        }
      })
    );

    // Language Providers
    try {
      const cp = new CP();
      ctx.subscriptions.push(
        vs.languages.registerCompletionItemProvider(
          { scheme: 'file', pattern: '**/res/layout/**/*.xml' },
          cp,
          '<', 'L', 'l'
        )
      );
      ctx.subscriptions.push(
        vs.languages.registerDefinitionProvider(
          { scheme: 'file', pattern: '**/res/layout/**/*.xml' },
          new DPv()
        )
      );
      ctx.subscriptions.push(
        vs.languages.registerDocumentLinkProvider(
          { scheme: 'file', pattern: '**/res/layout/**/*.xml' },
          new DLP()
        )
      );
      ctx.subscriptions.push(
        vs.languages.registerCodeLensProvider(
          { scheme: 'file', pattern: '**/res/layout/**/*.xml' },
          new CLP()
        )
      );
      ctx.subscriptions.push(
        vs.languages.registerDocumentFormattingEditProvider(
          { scheme: 'file', pattern: '**/res/layout/**/*.xml' },
          new FmtProvider()
        )
      );
      ctx.subscriptions.push(
        vs.languages.registerCompletionItemProvider(
          { scheme: 'file', pattern: '**/res/layout/**/*.xml' },
          new RsrcProvider(),
          '/'
        )
      );
      ctx.subscriptions.push(
        vs.languages.registerHoverProvider(
          { scheme: 'file', pattern: '**/res/layout/**/*.xml' },
          new HoverProvider()
        )
      );
      Logger.log('registered', 'LanguageProviders');
    } catch (e) {
      Logger.error('LanguageProvider registration failed', e);
    }

    // Commands
    registerCommands(ctx, val);
    Logger.log('registered', 'Commands');

    // Configuration change listener
    ctx.subscriptions.push(
      vs.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(ALE)) {
          Logger.log('configuration changed');
        }
      })
    );

    Logger.log('activate completed');
  } catch (e) {
    Logger.error('activate failed', e);
    vs.window.showErrorMessage('LayoutEditor 扩展激活失败: ' + e.message);
  }
}

function deactivate() {
  Logger.log('deactivate');
}

module.exports = { activate, deactivate };
