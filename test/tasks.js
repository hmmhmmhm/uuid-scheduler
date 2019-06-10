const {Scheduler} = require('../dist')
const moment = require('moment')

let scheduler = new Scheduler()

let isFinished = false
scheduler.addTasks([

    {
        task: async  (my) => 
            console.log(`task1 uuid:${my.uuid} run!`),

        callback: async  (my, result)=> 
            console.log(`task1 uuid:${my.uuid} callback run!`)
    },

    {
        task: async  (my) => 
            console.log(`task2 uuid:${my.uuid} run!`),
    
        callback: async  (my, result)=> 
            console.log(`task2 uuid:${my.uuid} callback run!`),

        delay: 5000
    },

    {
        task: async  (my) => 
            console.log(`task4 uuid:${my.uuid} run!`),
    
        callback: async  (my, result)=> {
            console.log(`task4 uuid:${my.uuid} callback run!`)
    
        },
        schedule: moment().add(5, 'second').valueOf()
    },

    {
        task: async  (my) =>
            console.log(`task3 uuid:${my.uuid} run!`),

        callback: async  (my, result)=> {
            console.log(`task3 uuid:${my.uuid} callback run!`)
            console.log(`task3 uuid:${my.uuid} callback isStopped: ${my.isStopped}`)
        }
    },

    {
        task: async  (my) => 
            console.log(`task5 uuid:${my.uuid} run!`),
    
        callback: async  (my, result)=> 
            console.log(`task5 uuid:${my.uuid} callback run!`),
    
        schedule: moment().add(5, 'second').valueOf()
    }

], {
    delay: 5000,
    loop: ()=>{
        if(!isFinished){
            console.log(`loop's not end?`)
            isFinished = true
            return true
        }
        return false
    }
})