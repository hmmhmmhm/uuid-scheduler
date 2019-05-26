const { Scheduler } = require('../dist/')
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

