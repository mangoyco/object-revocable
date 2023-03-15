var o = Object.defineProperty;
var u = (a, t, e) => t in a ? o(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var n = (a, t, e) => (u(a, typeof t != "symbol" ? t + "" : t, e), e);
function g(a) {
  return Object.prototype.toString.call(a) === "[object Object]";
}
function k(a) {
  return typeof a == "object";
}
function b(a, t) {
  return Object.hasOwn ? Object.hasOwn(a, t) : Object.prototype.hasOwnProperty.call(a, t);
}
class h {
  constructor(t, e, s, l) {
    n(this, "op");
    n(this, "propName");
    n(this, "returnOp");
    n(this, "returnVal");
    n(this, "snapTag");
    this.op = t, this.propName = e, this.returnOp = this.getReturnOp(), this.snapTag = l, t !== "add" && (this.returnVal = s);
  }
  getReturnOp() {
    return {
      add: "deleteProperty",
      set: "set",
      deleteProperty: "add"
    }[this.op];
  }
}
const i = class {
  // 是否开启保存快照模式
  constructor(t, e) {
    n(this, "opStack", []);
    n(this, "stepBackup", []);
    n(this, "target");
    // 数据源
    n(this, "snapable");
    this.target = t, this.snapable = e.snapable;
    let s = this;
    s.opStack.push = function(...l) {
      return s.stepBackup = [], Array.prototype.push.call(this, ...l);
    };
  }
  static clearVisitPath() {
    i.currRootHelperInstance = null, this.visitingPath = [];
  }
  _getRootHelperInstance() {
    return i.currRootHelperInstance || this;
  }
  _deepGetValue(t) {
    let e = this.target, s = 0;
    for (; s < t.length; )
      e = e[t[s]], s++;
    return e;
  }
  _getFullPropPath(t) {
    return i.visitingPath.concat(t);
  }
  _backByPath(t) {
    let e = [...t.propName], s = e.pop(), l = t.returnOp === "add" ? "set" : t.returnOp, r = this._getRootHelperInstance().target, p = 0;
    for (; p < e.length; )
      r = r[e[p]], p++;
    Reflect[l](r, s, t.returnVal);
  }
  // ctrlz的栈，对对象有动作时记录当前动作，同时OpInfo会生成记录相反的操作
  _rememberStep(t) {
    this._getRootHelperInstance().opStack.push(t);
  }
  snap() {
    if (!this.opStack.length)
      return;
    let t = this.opStack.length;
    this.opStack[t - 1].snapTag = !0;
  }
  rollbackToSnapshot() {
    let t = this.opStack[this.opStack.length - 1];
    for (t && t.snapTag && (this.rollback(), t = this.opStack[this.opStack.length - 1]); t && !t.snapTag; )
      this.rollback(), t = this.opStack[this.opStack.length - 1];
  }
  cancelRollbackToSnapshot() {
    let t = this.stepBackup[this.stepBackup.length - 1];
    for (; t && (this.cancelRollback(), !t.snapTag); )
      t = this.stepBackup[this.stepBackup.length - 1];
  }
  rollback() {
    let t = this.opStack.pop();
    if (!t)
      return;
    let e = new h(
      t.returnOp,
      t.propName,
      this._deepGetValue(t.propName),
      t.snapTag
    );
    this.stepBackup.push(e), this._backByPath(t);
  }
  cancelRollback() {
    let t = this.stepBackup.pop();
    if (!t)
      return;
    let e = new h(
      t.returnOp,
      t.propName,
      this._deepGetValue(t.propName),
      t.snapTag
    );
    Array.prototype.push.call(this.opStack, e), this._backByPath(t);
  }
  get(t, e) {
    if (e === "_snapshot")
      return this.snap.bind(this);
    if (e === "_rollback")
      return this.snapable ? this.rollbackToSnapshot.bind(this) : this.rollback.bind(this);
    if (e === "_cancelRollback")
      return this.snapable ? this.cancelRollbackToSnapshot.bind(this) : this.cancelRollback.bind(this);
    i.visitingPath.length === 0 && (i.currRootHelperInstance = this), i.visitingPath.push(e);
    let s = Reflect.get(t, e);
    return k(s) ? P(s) : (i.clearVisitPath(), s);
  }
  set(t, e, s) {
    let l, r;
    if (b(t, e)) {
      let p = Reflect.get(t, e);
      l = Reflect.set(t, e, s), r = new h("set", this._getFullPropPath(e), p);
    } else
      l = Reflect.set(t, e, s), r = new h("add", this._getFullPropPath(e));
    return this._rememberStep(r), i.clearVisitPath(), l;
  }
  deleteProp(t, e) {
    if (Reflect.has(t, e)) {
      let s = Reflect.get(t, e), l = new h("deleteProperty", this._getFullPropPath(e), s);
      this._rememberStep(l);
    }
    return i.clearVisitPath(), Reflect.deleteProperty(t, e);
  }
};
let c = i;
n(c, "currRootHelperInstance"), n(c, "visitingPath", []);
function f(a) {
  return g(a) ? a : {
    snapable: !!a
  };
}
function P(a, t = !1) {
  let e = new c(a, f(t));
  return new Proxy(a, {
    get(l, r) {
      return e.get(l, r);
    },
    set(l, r, p) {
      return e.set(l, r, p);
    },
    deleteProperty(l, r) {
      return e.deleteProp(l, r);
    }
  });
}
export {
  P as Revocable
};
