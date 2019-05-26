# uuid-scheduler

> 🌳 Task scheduler with uuid and delay options based on async task

## Install

```bash
npm install uuid-scheduler --save
```

## Usage

test1.js **(Scheduler)**

```js
const { Scheduler } = require('uuid-scheduler')
let scheduler = new Scheduler()

scheduler.addTask({
    task: async  (my) => 
        console.log(`task1 uuid:${my.uuid} run!`),

    callback: async  (my, result)=> 
        console.log(`task1 uuid:${my.uuid} callback run!`)
})

scheduler.addTask({
    task: async  (my) => 
        console.log(`task2 uuid:${my.uuid} run!`),

    callback: async  (my, result)=> 
        console.log(`task2 uuid:${my.uuid} ca llback run!`),

    delay: 5000
})

let taskHandler = 
    scheduler.addTask({
        task: async  (my) =>
            console.log(`task3 uuid:${my.uuid} run!`),

        callback: async  (my, result)=> {
            console.log(`task3 uuid:${my.uuid} callback run!`)
            console.log(`task3 uuid:${my.uuid} callback isStopped: ${my.isStopped}`)
        }
    })
taskHandler.isStopped = true

```

test1.js result

```bash
task1 uuid:947d4a89-684a-4f12-b35d-5e0edba3937d run!
task1 uuid:947d4a89-684a-4f12-b35d-5e0edba3937d callback run!
task2 uuid:026400ba-da8a-4c57-8789-ef1bfa11db29 run!
task2 uuid:026400ba-da8a-4c57-8789-ef1bfa11db29 callback run!
task3 uuid:59553cb4-0672-44e1-bad0-c51cca5b2087 callback run!
task3 uuid:59553cb4-0672-44e1-bad0-c51cca5b2087 callback isStopped: true
```



test2.js **(CommonScheduler)**

```js
const { CommonScheduler } = require('../dist')

let scheduler = new CommonScheduler({
    task: async  (my) => {
        console.log(`task uuid:${my.uuid} start!`)
        console.log(`task uuid:${my.uuid} data: ${my.data}`)
        return `result-data-${my.data}`
    },
    callback: async (my, result) => {
        console.log(`task uuid:${my.uuid} callback result: ${result}`)
    }
})

scheduler.addData({
    data: 0, 
    delay: 1000,
    callback: ()=>{
        console.log('one finished.')
    }
})

scheduler.addDatas({
    datas: [1,2,3,4,5], 
    delay: 500,
    callback: ()=>{
        console.log('all finished.')

        // If you enter the code below,
        // everything will be re-entered.
        // console.log('one more time!!')
        // scheduler.clear()
        scheduler.loadData(initData, true)
    }
})
let initData = scheduler.getData()
```

test2.js result

```bash
task uuid:10ff0138-9b18-40c5-8805-6a485e62b046 start!
task uuid:10ff0138-9b18-40c5-8805-6a485e62b046 data: 0
task uuid:10ff0138-9b18-40c5-8805-6a485e62b046 callback result: result-data-0
one finished.
task uuid:581aa4c7-eeb3-448b-9535-a7f75d8e7677 start!
task uuid:581aa4c7-eeb3-448b-9535-a7f75d8e7677 data: 1
task uuid:581aa4c7-eeb3-448b-9535-a7f75d8e7677 callback result: result-data-1
task uuid:0d0234f1-1299-48a7-a88e-454bed7f25c1 start!
task uuid:0d0234f1-1299-48a7-a88e-454bed7f25c1 data: 2
task uuid:0d0234f1-1299-48a7-a88e-454bed7f25c1 callback result: result-data-2
task uuid:480a4f3a-6803-40e0-9e5e-3a348a85454d start!
task uuid:480a4f3a-6803-40e0-9e5e-3a348a85454d data: 3
task uuid:480a4f3a-6803-40e0-9e5e-3a348a85454d callback result: result-data-3
task uuid:2411832b-e3f5-435d-99ac-7ef81677b1c2 start!
task uuid:2411832b-e3f5-435d-99ac-7ef81677b1c2 data: 4
task uuid:2411832b-e3f5-435d-99ac-7ef81677b1c2 callback result: result-data-4
task uuid:84cb2ea8-d70b-4343-affd-13f931f2d87f start!
task uuid:84cb2ea8-d70b-4343-affd-13f931f2d87f data: 5
task uuid:84cb2ea8-d70b-4343-affd-13f931f2d87f callback result: result-data-5
all finished
```



## License

MIT Licensed.