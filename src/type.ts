export type opTypeContraryMap = {
    add:"deleteProperty",
    set: "set",
    deleteProperty: "add"
}
export type opType = keyof opTypeContraryMap

export interface HelperConfig{
    snapable: boolean
}
