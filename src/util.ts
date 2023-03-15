export function isObj(target: any) {
  return Object.prototype.toString.call(target) === "[object Object]"
}

export function isObjType(target: any) {
  return typeof target === "object"
}

export function hasOwn(obj: any, prop:string) {
  return Object.hasOwn ? Object.hasOwn(obj, prop) : Object.prototype.hasOwnProperty.call(obj, prop)
}
