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

let task5ActingTime = moment().add(10, 'second').valueOf()

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

            // schedule: moment().add(5, 'second').valueOf(),
            loop: ({clear})=>{
                if(Date.now() >= task5ActingTime){
                    clear()
                    return true
                }
                return false
            }
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

