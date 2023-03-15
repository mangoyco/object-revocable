import { HelperConfig, opType, opTypeContraryMap } from "./type"
import { isObj, isObjType, hasOwn } from "./util"

class OpInfo {
  op: opType
  propName: string | Array<string>
  returnOp: opType
  returnVal?: any
  snapTag?: boolean

  constructor(op: opType, propName: string | Array<string>, oldVal?: any, snapTag?: boolean) {
    this.op = op
    this.propName = propName
    this.returnOp = this.getReturnOp()
    this.snapTag = snapTag // 是不是snapshot标记
    if (op !== "add") {
      this.returnVal = oldVal
    }
  }
  getReturnOp(): opType {
    let map: opTypeContraryMap = {
      add: "deleteProperty",
      set: "set",
      deleteProperty: "add"
    }
    return map[this.op]
  }
}
class RevocableHelper {
  static currRootHelperInstance: RevocableHelper | null
  static visitingPath: Array<string> = []
  static clearVisitPath() {
    RevocableHelper.currRootHelperInstance = null
    this.visitingPath = [];
  }
  opStack: Array<OpInfo> = []
  stepBackup: Array<OpInfo> = []
  target: any // 数据源
  snapable: boolean // 是否开启保存快照模式

  constructor(target: any, config: HelperConfig) {
    this.target = target
    this.snapable = config.snapable
    let self = this
    self.opStack.push = function (...args: OpInfo[]) {
      self.stepBackup = []
      return Array.prototype.push.call(this, ...args)
    }
  }
  _getRootHelperInstance() {
    return RevocableHelper.currRootHelperInstance || this
  }
  _deepGetValue(props: Array<string> | string): any {
    let result: any = this.target, i = 0
    while (i < props.length) {
      result = result[props[i]]
      i++
    }
    return result
  }
  _getFullPropPath(prop: string): Array<string> {
    return RevocableHelper.visitingPath.concat(prop)
  }
  _backByPath(opInfo: OpInfo) {
    let path = [...opInfo.propName]
    let finalPropName = path.pop()!
    let finalOp = opInfo.returnOp === "add" ? "set" : opInfo.returnOp
    let parent = this._getRootHelperInstance().target, i = 0
    while (i < path.length) {
      parent = parent[path[i]]
      i++
    }
    Reflect[finalOp](parent, finalPropName, opInfo.returnVal)
  }
  // ctrlz的栈，对对象有动作时记录当前动作，同时OpInfo会生成记录相反的操作
  _rememberStep(opInfo: OpInfo) {
    let instance = this._getRootHelperInstance()
    instance.opStack.push(opInfo)
  }
  snap(){
    if (!this.opStack.length){ return }
    let len = this.opStack.length
    this.opStack[len - 1].snapTag = true
  }
  rollbackToSnapshot(){
    let lastOp = this.opStack[this.opStack.length - 1]
    if (lastOp && lastOp.snapTag){// 如果当前就是一个snapshot，先rollback一次
      this.rollback()
      lastOp = this.opStack[this.opStack.length - 1]
    }
    while (lastOp && !lastOp.snapTag) {
      this.rollback()
      lastOp = this.opStack[this.opStack.length - 1]
    }
  }
  cancelRollbackToSnapshot(){
    let lastOp = this.stepBackup[this.stepBackup.length - 1]
    while (lastOp) {
      this.cancelRollback()
      if (lastOp.snapTag) { break; }
      lastOp = this.stepBackup[this.stepBackup.length - 1]
    }
  }
  rollback() {// 该方法只会在根节点调用 因此this就是rootHelper
    let opInfo = this.opStack.pop()
    if (!opInfo) { return }
    let contraryOp = new OpInfo(
      opInfo.returnOp,
      opInfo.propName,
      this._deepGetValue(opInfo.propName),
      opInfo.snapTag
    )
    this.stepBackup.push(contraryOp)
    this._backByPath(opInfo)
  }
  cancelRollback() {// 该方法只会在根节点调用 因此this就是rootHelper
    let op = this.stepBackup.pop()!
    if (!op) { return }
    let contraryOp = new OpInfo(
      op.returnOp,
      op.propName,
      this._deepGetValue(op.propName),
      op.snapTag
    )
    Array.prototype.push.call(this.opStack, contraryOp)// 这里在推入ctrlz使用的栈时不清空ctrlY的栈
    this._backByPath(op)
  }
  get(obj: any, prop: string): any {
    if (prop === "_snapshot"){
      return this.snap.bind(this)
    }
    if (prop === "_rollback") {
      return this.snapable ? this.rollbackToSnapshot.bind(this) : this.rollback.bind(this)
    }
    if (prop === "_cancelRollback") {
      return this.snapable ? this.cancelRollbackToSnapshot.bind(this) : this.cancelRollback.bind(this)
    }
    if (RevocableHelper.visitingPath.length === 0) {
      RevocableHelper.currRootHelperInstance = this
    }
    RevocableHelper.visitingPath.push(prop)
    let value = Reflect.get(obj, prop)
    if (isObjType(value)) {
      return Revocable(value)
    } else {
      RevocableHelper.clearVisitPath()
      return value
    }
  }
  set(obj: any, prop: string, newval: any) {
    let setRes: boolean
    let opObj: OpInfo
    if (hasOwn(obj, prop)) {// 修改属性
      let oldVal = Reflect.get(obj, prop)
      setRes = Reflect.set(obj, prop, newval)
      opObj = new OpInfo("set", this._getFullPropPath(prop), oldVal)
    } else {// 新增属性
      setRes = Reflect.set(obj, prop, newval)
      opObj = new OpInfo("add", this._getFullPropPath(prop))
    }
    this._rememberStep(opObj)
    RevocableHelper.clearVisitPath()
    return setRes
  }
  deleteProp(obj: any, prop: string) {
    if (Reflect.has(obj, prop)) {
      let oldVal = Reflect.get(obj, prop)
      let opObj = new OpInfo("deleteProperty", this._getFullPropPath(prop), oldVal)
      this._rememberStep(opObj)
    }
    RevocableHelper.clearVisitPath()
    return Reflect.deleteProperty(obj, prop)
  }
}

function genConfig(config:any):HelperConfig{
  if(isObj(config)){
    return config
  }else{
    return {
      snapable:!!config
    }
  }
}

function Revocable(target: any, config: any = false) {
  let helper = new RevocableHelper(target, genConfig(config))
  let proxy = new Proxy(target, {
    get(obj, prop: string) {
      return helper.get(obj, prop)
    },
    set(obj, prop: string, newval) {
      return helper.set(obj, prop, newval)
    },
    deleteProperty(obj, prop: string) {
      return helper.deleteProp(obj, prop)
    }
  })
  return proxy
}

export {
  Revocable,
}
