const { DP, DS } = require('./constants');

class DM {
    constructor() {
        this.cd = 'pixel-7';
        this.cdn = 'xxhdpi';
        this.ct = 'light';
    }
    getDev() {
        return DP[this.cd] || DP['pixel-7'];
    }
    setDev(k) {
        if (DP[k]) {
            this.cd = k;
            this.cdn = DP[k].dn;
            return true;
        }
        return false;
    }
    setDn(d) {
        if (DS[d]) {
            this.cdn = d;
            return true;
        }
        return false;
    }
    setTh(t) {
        if (['light', 'dark', 'material_you'].includes(t)) {
            this.ct = t;
            return true;
        }
        return false;
    }
    getCfg() {
        const d = this.getDev();
        return { preset: this.cd, name: d.n, w: d.w, h: d.h, density: this.cdn, scale: DS[this.cdn] || d.sc, theme: this.ct };
    }
}

module.exports = { DM };
