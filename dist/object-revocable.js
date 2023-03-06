var h = Object.defineProperty;
var u = (s, t, e) => t in s ? h(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var n = (s, t, e) => (u(s, typeof t != "symbol" ? t + "" : t, e), e);
function g(s) {
  return typeof s == "object";
}
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
const i = class {
  // 数据源
  constructor(t) {
    n(this, "opStack", []);
    n(this, "stepBackup", []);
    n(this, "target");
    window.dd = () => {
      window.ss1 = this.opStack, window.ss2 = this.stepBackup, console.log(this.opStack, this.stepBackup);
    }, this.target = t;
    let e = this;
    e.opStack.push = function(...r) {
      return e.stepBackup = [], Array.prototype.push.call(this, ...r);
    };
  }
  static clearVisitPath() {
    i.currRootHelperInstance = null, this.visitingPath = [];
  }
  _getRootHelperInstance() {
    return i.currRootHelperInstance || this;
  }
  _deepGetValue(t) {
    let e = this.target, r = 0;
    for (; r < t.length; )
      console.log(e[t[r]]), e = e[t[r]], r++;
    return e;
  }
  _getFullPropPath(t) {
    return i.visitingPath.concat(t);
  }
  _backByPath(t) {
    let e = [...t.propName], r = e.pop(), l = t.returnOp === "add" ? "set" : t.returnOp, a = this._getRootHelperInstance().target, c = 0;
    for (; c < e.length; )
      console.log(a[e[c]]), a = a[e[c]], c++;
    Reflect[l](a, r, t.returnVal);
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
    if (i.visitingPath.length === 0 && (i.currRootHelperInstance = this), i.visitingPath.push(e), e === "_rollback")
      return this.rollback.bind(this);
    if (e === "_cancelRollback")
      return this.cancelRollback.bind(this);
    let r = Reflect.get(t, e);
    return g(r) ? d(r) : (i.clearVisitPath(), r);
  }
  set(t, e, r) {
    console.log("set"), console.log(i.visitingPath, "in set");
    let l, a;
    if (Reflect.has(t, e)) {
      let c = Reflect.get(t, e);
      l = Reflect.set(t, e, r), a = new p("set", this._getFullPropPath(e), c);
    } else
      l = Reflect.set(t, e, r), a = new p("add", this._getFullPropPath(e));
    return this._rememberStep(a), l;
  }
  deleteProp(t, e) {
    if (console.log("deleteProp", Reflect.has(t, e)), Reflect.has(t, e)) {
      let r = Reflect.get(t, e), l = new p("deleteProperty", this._getFullPropPath(e), r);
      this._rememberStep(l);
    }
    return Reflect.deleteProperty(t, e);
  }
};
let o = i;
n(o, "currRootHelperInstance"), n(o, "visitingPath", []);
window.RevocableHelper = o;
function d(s) {
  let t = new o(s);
  return console.log(t), new Proxy(s, {
    get(r, l) {
      return t.get(r, l);
    },
    set(r, l, a) {
      return t.set(r, l, a);
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
