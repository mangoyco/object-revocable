var u = Object.defineProperty;
var g = (a, t, e) => t in a ? u(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var n = (a, t, e) => (g(a, typeof t != "symbol" ? t + "" : t, e), e);
function P(a) {
  return typeof a == "object";
}
var h = h || {};
class p {
  constructor(t, e, r) {
    n(this, "op");
    n(this, "propName");
    n(this, "returnOp");
    n(this, "returnVal");
    this.op = t, this.propName = e, this.returnOp = this.getReturnOp(), t !== "add" && (this.returnVal = r);
  }
  getReturnOp() {
    return {
      add: "deleteProperty",
      set: "set",
      deleteProperty: "add"
    }[this.op];
  }
}
const s = class {
  // 数据源
  constructor(t) {
    n(this, "opStack", []);
    n(this, "stepBackup", []);
    n(this, "target");
    h.dd = () => {
      h.ss1 = this.opStack, h.ss2 = this.stepBackup, console.log(this.opStack, this.stepBackup);
    }, this.target = t;
    let e = this;
    e.opStack.push = function(...r) {
      return e.stepBackup = [], Array.prototype.push.call(this, ...r);
    };
  }
  static clearVisitPath() {
    s.currRootHelperInstance = null, this.visitingPath = [];
  }
  _getRootHelperInstance() {
    return s.currRootHelperInstance || this;
  }
  _deepGetValue(t) {
    let e = this.target, r = 0;
    for (; r < t.length; )
      e = e[t[r]], r++;
    return e;
  }
  _getFullPropPath(t) {
    return s.visitingPath.concat(t);
  }
  _backByPath(t) {
    let e = [...t.propName], r = e.pop(), l = t.returnOp === "add" ? "set" : t.returnOp, i = this._getRootHelperInstance().target, c = 0;
    for (; c < e.length; )
      console.log(i[e[c]]), i = i[e[c]], c++;
    Reflect[l](i, r, t.returnVal);
  }
  // ctrlz的栈，对对象有动作时记录当前动作，同时OpInfo会生成记录相反的操作
  _rememberStep(t) {
    this._getRootHelperInstance().opStack.push(t);
  }
  rollback() {
    let t = this.opStack.pop();
    if (!t)
      return;
    let e = new p(t.returnOp, t.propName, this._deepGetValue(t.propName));
    this.stepBackup.push(e), this._backByPath(t);
  }
  cancelRollback() {
    let t = this.stepBackup.pop();
    if (!t)
      return;
    let e = new p(t.returnOp, t.propName, this._deepGetValue(t.propName));
    Array.prototype.push.call(this.opStack, e), this._backByPath(t);
  }
  get(t, e) {
    if (console.log("get"), e === "_rollback")
      return this.rollback.bind(this);
    if (e === "_cancelRollback")
      return this.cancelRollback.bind(this);
    s.visitingPath.length === 0 && (s.currRootHelperInstance = this), s.visitingPath.push(e);
    let r = Reflect.get(t, e);
    return P(r) ? d(r) : (s.clearVisitPath(), r);
  }
  set(t, e, r) {
    console.log("set"), console.log(s.visitingPath, "in set");
    let l, i;
    if (Reflect.has(t, e)) {
      let c = Reflect.get(t, e);
      l = Reflect.set(t, e, r), i = new p("set", this._getFullPropPath(e), c);
    } else
      l = Reflect.set(t, e, r), i = new p("add", this._getFullPropPath(e));
    return this._rememberStep(i), s.clearVisitPath(), l;
  }
  deleteProp(t, e) {
    if (console.log("deleteProp", Reflect.has(t, e)), Reflect.has(t, e)) {
      let r = Reflect.get(t, e), l = new p("deleteProperty", this._getFullPropPath(e), r);
      this._rememberStep(l);
    }
    return s.clearVisitPath(), Reflect.deleteProperty(t, e);
  }
};
let o = s;
n(o, "currRootHelperInstance"), n(o, "visitingPath", []);
h.RevocableHelper = o;
function d(a) {
  let t = new o(a);
  return console.log(t), new Proxy(a, {
    get(r, l) {
      return t.get(r, l);
    },
    set(r, l, i) {
      return t.set(r, l, i);
    },
    deleteProperty(r, l) {
      return t.deleteProp(r, l);
    }
  });
}
export {
  p as OpInfo,
  d as Revocable
};
