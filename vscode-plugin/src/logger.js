const Logger = {
  _enabled: true,
  _prefix: '[LayoutEditor]',
  log(...args) { if(this._enabled) console.log(this._prefix, ...args); },
  error(...args) { if(this._enabled) console.error(this._prefix, ...args); },
  warn(...args) { if(this._enabled) console.warn(this._prefix, ...args); },
  setEnabled(v) { this._enabled = v; }
};

module.exports = { Logger };
