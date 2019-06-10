const {Scheduler} = require('../dist/')
const moment = require('moment')

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
        console.log(`task2 uuid:${my.uuid} callback run!`),

    delay: 5000
})

scheduler.addTask({
    task: async  (my) => 
        console.log(`task4 uuid:${my.uuid} run!`),

    callback: async  (my, result)=> {
        console.log(`task4 uuid:${my.uuid} callback run!`)
        
        scheduler.addTask({
            task: async  (my) => 
                console.log(`task5 uuid:${my.uuid} run!`),

            callback: async  (my, result)=> 
                console.log(`task5 uuid:${my.uuid} callback run!`),

            schedule: moment().add(5, 'second').valueOf()
        })

    },
    schedule: moment().add(5, 'second').valueOf()
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

