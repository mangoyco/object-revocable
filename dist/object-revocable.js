var u = Object.defineProperty;
var g = (s, t, e) => t in s ? u(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var n = (s, t, e) => (g(s, typeof t != "symbol" ? t + "" : t, e), e);
function k(s) {
  return Object.prototype.toString.call(s) === "[object Object]";
}
function b(s) {
  return typeof s == "object";
}
var o = o || {};
class h {
  constructor(t, e, a, l) {
    n(this, "op");
    n(this, "propName");
    n(this, "returnOp");
    n(this, "returnVal");
    n(this, "snapTag");
    this.op = t, this.propName = e, this.returnOp = this.getReturnOp(), this.snapTag = l, t !== "add" && (this.returnVal = a);
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
    o.dd = () => {
      o.ss1 = this.opStack, o.ss2 = this.stepBackup, console.log(this.opStack, this.stepBackup);
    }, this.target = t, this.snapable = e.snapable;
    let a = this;
    a.opStack.push = function(...l) {
      return a.stepBackup = [], Array.prototype.push.call(this, ...l);
    };
  }
  static clearVisitPath() {
    i.currRootHelperInstance = null, this.visitingPath = [];
  }
  _getRootHelperInstance() {
    return i.currRootHelperInstance || this;
  }
  _deepGetValue(t) {
    let e = this.target, a = 0;
    for (; a < t.length; )
      e = e[t[a]], a++;
    return e;
  }
  _getFullPropPath(t) {
    return i.visitingPath.concat(t);
  }
  _backByPath(t) {
    let e = [...t.propName], a = e.pop(), l = t.returnOp === "add" ? "set" : t.returnOp, r = this._getRootHelperInstance().target, c = 0;
    for (; c < e.length; )
      console.log(r[e[c]]), r = r[e[c]], c++;
    Reflect[l](r, a, t.returnVal);
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
  rollbackToSnapshot(t = !0) {
    let e = this.opStack[this.opStack.length - 1];
    for (e && e.snapTag && (this.rollback(), e = this.opStack[this.opStack.length - 1]); e && !e.snapTag; )
      this.rollback(), e = this.opStack[this.opStack.length - 1];
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
    if (console.log("get", e), e === "_snapshot")
      return this.snap.bind(this);
    if (e === "_rollback")
      return this.snapable ? this.rollbackToSnapshot.bind(this) : this.rollback.bind(this);
    if (e === "_cancelRollback")
      return this.snapable ? this.cancelRollbackToSnapshot.bind(this) : this.cancelRollback.bind(this);
    i.visitingPath.length === 0 && (i.currRootHelperInstance = this), i.visitingPath.push(e);
    let a = Reflect.get(t, e);
    return b(a) ? d(a) : (i.clearVisitPath(), a);
  }
  set(t, e, a) {
    let l, r;
    if (Reflect.has(t, e)) {
      let c = Reflect.get(t, e);
      l = Reflect.set(t, e, a), r = new h("set", this._getFullPropPath(e), c);
    } else
      l = Reflect.set(t, e, a), r = new h("add", this._getFullPropPath(e));
    return this._rememberStep(r), i.clearVisitPath(), l;
  }
  deleteProp(t, e) {
    if (console.log("deleteProp", Reflect.has(t, e)), Reflect.has(t, e)) {
      let a = Reflect.get(t, e), l = new h("deleteProperty", this._getFullPropPath(e), a);
      this._rememberStep(l);
    }
    return i.clearVisitPath(), Reflect.deleteProperty(t, e);
  }
};
let p = i;
n(p, "currRootHelperInstance"), n(p, "visitingPath", []);
o.RevocableHelper = p;
function f(s) {
  return k(s) ? s : {
    snapable: !!s
  };
}
function d(s, t = !1) {
  let e = new p(s, f(t));
  return console.log(e), new Proxy(s, {
    get(l, r) {
      return e.get(l, r);
    },
    set(l, r, c) {
      return e.set(l, r, c);
    },
    deleteProperty(l, r) {
      return e.deleteProp(l, r);
    }
  });
}
export {
  h as OpInfo,
  d as Revocable
};
