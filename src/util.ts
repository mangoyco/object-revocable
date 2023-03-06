export function isObj(target: any) {
  return Object.prototype.toString.call(target) === "[object Object]"
}

export function isObjType(target: any) {
  return typeof target === "object"
}
