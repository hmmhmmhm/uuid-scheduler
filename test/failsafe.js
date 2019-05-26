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