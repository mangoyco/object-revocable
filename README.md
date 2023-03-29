## object-revocable

对象操作的撤回与反撤回 (`ctrl + z` 与 `ctrl + y`)

### example

**1. ES Module**
```javascript
import { Revocable } from "yourPath/object-revocable.js"
const target = Revocable({
    fir: "fir",
    sec: "sec"
})
target.third = "third"
target.sec = "changed sec"
delete target.fir
// target now is {
//     sec:"changed sec",
//     third:"third",
// }

// _rollback 为撤销方法，可理解为ctrl+z⚠️
// _cancelRollback 为反撤销方法，可理解为ctrl+y ⚠️

target._rollback()
// target now is {
//     sec:"changed sec",
//     third:"third",
//     fir: "fir",
// }

target._rollback()
// target now is {
//     sec:"sec",
//     third:"third",
//     fir: "fir",
// }

target._rollback()
// target now is {
//     sec:"sec",
//     fir: "fir",
// }

target._cancelRollback()
// target now is {
//     sec:"sec",
//     fir: "fir",
//     third:"third",
// }
```

**2. script**

```html
<script src="yourpath/object-revocable.umd.cjs"></script>
<script>
    const { Revocable } = RevocableModule
    let target = Revocable({
        ...
    })
    ...
</script>
```
**3. snapshot 模式**
```javascript
const target = Revocable({
    fir: "init value",
    sec: "init value"
},true)// 或者写为target = Revocable({...},{ snapable: true })

target.fir = "first change"
target.sec = "first change"
target.third = "first change"
// target now is {
//     fir: "first change",
//     sec: "first change",
//     third: "first change"
// }
target._snapshot() ⚠️// 将此时的对象看作一个快照，即将前面的三次操作视为一次操作

target.fir = "second change"
target.sec = "second change"
target.third = "second change"
target._snapshot()

target.fir = "third change"
target.sec = "third change"
target.third = "third change"
// target now is {
//     fir: "third change",
//     sec: "third change",
//     third: "third change"
// }

target._rollback()
// target now is {
//     fir: "second change",
//     sec: "second change",
//     third: "second change"
// }

target._rollback()
// target now is {
//     fir: "first change",
//     sec: "first change",
//     third: "first change"
// }

target._rollback()
// target now is {
//     fir: "init value",
//     sec: "init value"
// }
```





## Source code

####develop
```
npm install

npm run dev
```
#### Testing

```
npm run test
```


#### Package

```
npm run lib
```

或直接使用dist文件夹中的 js 文件



<!-- ## License

MIT -->