const { Revocable } = require("./dist/object-revocable.umd.cjs")

function Data(){
    return {
        fir: "1",
        sec: "",
        deep: {
            a: 1
        }
    }
}
test('新增后撤回并反撤回', () => {
    let target = Revocable({})
    target.xxx = "sit"
    expect(target).toEqual({xxx:"sit"});
    target._rollback()
    expect(target).toEqual({});
    target._cancelRollback()
    expect(target).toEqual({ xxx: "sit" });
});
test('修改后撤回并反撤回', () => {
    let target = Revocable({x:1})
    target.x = 2
    expect(target).toEqual({ x: 2 });
    target._rollback()
    expect(target).toEqual({ x: 1 });
    target._cancelRollback()
    expect(target).toEqual({ x: 2 });
});
test('删除后撤回并反撤回', () => {
    let target = Revocable({ deep: 1 })
    delete target.deep
    expect(target).toEqual({});
    target._rollback()
    expect(target).toEqual({ deep: 1 });
    target._cancelRollback()
    expect(target).toEqual({});
});

// 深层级
test('深层级新增属性后撤回', () => {
    let t = { deep: {} }
    let target = Revocable(t)
    target.deep.a = 1
    target._rollback()
    expect(target).toEqual({ deep: {} });
    target._cancelRollback()
    expect(target).toEqual({ deep: {a:1} });
});

test('深层级修改属性后撤回并反撤回', () => {
    let t = { deep: { a: 1 } }
    let target = Revocable(t)
    target.deep.a = 2
    target._rollback()
    expect(target).toEqual({ deep: { a: 1 } });
    target._cancelRollback()
    expect(target).toEqual({ deep: { a: 2 } });
});

test('深层级删除属性后撤回并反撤回', () => {
    let t = { deep: { a: 1 } }
    let target = Revocable(t)
    delete target.deep.a
    target._rollback()
    expect(target).toEqual({ deep: { a: 1 } });
    target._cancelRollback()
    expect(target).toEqual({ deep: {  } });
});

test('深层级混合测试', () => {
    let t = { deep: { a: 1 } }
    let target = Revocable(t)
    target.deep.b = 2
    target._rollback()
    expect(target).toEqual({ deep: { a: 1 } });
    target.deep.a = 12
    target.deep.b = 2
    delete target.deep
    expect(target).toEqual({ });
    target._rollback()
    expect(target).toEqual({ deep: { a:12, b:2 } });
    target._rollback()
    expect(target).toEqual({ deep: { a: 12 } });
    target._rollback()
    expect(target).toEqual({ deep: { a: 1 } });
    target._cancelRollback()
    expect(target).toEqual({ deep: { a: 12 } });
    target._cancelRollback()
    expect(target).toEqual({ deep: { a: 12, b: 2 } });
    target._cancelRollback()
    expect(target).toEqual({});
});

test('深层级连续delete', () => {
    let t = { deep: { a: 1,b: 2 } }
    let target = Revocable(t)
    delete target.deep.a
    delete target.deep.b
    expect(target).toEqual({ deep :{} });
    target._rollback()
    expect(target).toEqual({ deep: { b: 2 } });
    target._rollback()
    expect(target).toEqual({ deep: { a: 1, b: 2 } });
});

// 快照模式下的测试
test('快照模式基础测试', () => {
    let t = {  }
    let target = Revocable(t,true)
    target.a = 1
    target.b = 2
    target.c = 3
    target._snapshot()
    expect(target).toEqual({ a: 1, b: 2, c: 3 });
    target.d = 4
    target.e = 5
    expect(target).toEqual({ a: 1, b: 2, c: 3,d:4,e:5 });
    target._rollback()
    expect(target).toEqual({ a: 1, b: 2, c: 3 });
    target._rollback()
    expect(target).toEqual({ });
    target._cancelRollback()
    expect(target).toEqual({ a: 1, b: 2, c: 3 });
    target._cancelRollback()
    expect(target).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 5 });
});

test('快照模式有子集', () => {
    let t = {
        deep:{
            a:1
        }
    }
    let target = Revocable(t, true)
    target.deep.a = 2
    target.deep.b = 3
    target._snapshot()
    expect(target).toEqual({
        deep: {
            a: 2,
            b:3
        }
    });
    delete target.deep.a
    target._rollback()
    expect(target).toEqual({
        deep: {
            a: 2,
            b: 3
        }
    });
    delete target.deep
    target._snapshot()
    target.n = 'new'
    target._rollback()
    expect(target).toEqual({});
});
