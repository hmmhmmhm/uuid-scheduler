import * as Type from './type'
import * as Util from './util'
import { Scheduler } from './index'
import * as moment from 'moment'

export class FailSafeScheduler extends Scheduler {
    private common: Type.IFailSafeCommon

    constructor(common: Type.IFailSafeCommon){
        super()

        // 초기화
        this.common = common
    }

    getData(): Type.IFailSafeExtractedTask {
        /**
         * @description
         * - finished 이벤트 발생마다 DB 에 넣을 코드
         */
        return {
            scheduled: Util.tasksDataExtractor(this.getScheduledTasks()),
            pending: Util.tasksDataExtractor(this.getPendingTasks()),
            running: Util.tasksDataExtractor(this.getRunningTasks()),
            finished: this.getFinishedTasks()
        }
    }

    addData(option: {
        data: any,
        delay?: number,
        schedule?: number | moment.Moment,
        callback?: (task: Type.IScheduleTask)=> void,
        loop?: (
            option: {
                clear: (bool)=>void
            }
        ) => boolean

    }): Type.IScheduleTask {

        let task = this.addTask({
            task: this.common.task,
            callback: this.common.callback,
            timestamp: Date.now(),
            data: option.data,
            delay: option.delay,
            schedule: option.schedule,
            loop: option.loop
        })

        if(typeof(option.callback) == 'function'){
            this.event.on('finished', (eventTask: Type.IScheduleTask)=>{

                if(typeof(option.callback) == 'function')
                    if(task.uuid == eventTask.uuid) option.callback(task)
            })
        }

        return task
    }

    /**
     * @todo
     * - [ ] 차후 loop 의 uuid 별 입력 허용 구현필요
     */
    addDatas(option: {
        datas: any[], 
        delay?: number,
        callback?: (tasks: Type.IScheduleTask[])=> void,
        loop?: (
            option: {
                clear: (bool)=>void
            }
        ) => boolean

    }): Type.IScheduleTask[] {

        let tasks: Type.IScheduleTask[] = [] 
        for(let data of option.datas)
            tasks.push(this.addData({data, delay: option.delay}) )

        if(typeof(option['callback']) == 'function'){
            this.event.on('finished', (eventTask: Type.IScheduleTask)=>{

                if(typeof(option.callback) == 'function')
                    if(tasks[tasks.length-1].uuid == eventTask.uuid) option.callback(tasks)
            })
        }

        return tasks
    }

    loadData(json: Type.IFailSafeExtractedTask, isNeedRunningLoad = false){

        const taskDatasLoader = (taskDatas: Type.IExtractedData[], isFinished = false)=>{
            if(isFinished){
                for(let taskData of taskDatas){
                    this.tasks.finished.set(taskData.uuid, taskData)
                }
            }else{
                for(let taskData of taskDatas){{
                    this.addTask({
                        task: this.common.task,
                        callback: this.common.callback,
        
                        uuid: taskData.uuid,
                        data: taskData.data,
                        result: taskData.result,
                        delay: taskData.delay,
                        schedule: taskData.schedule,

                        isStarted: taskData.isStarted,
                        isStopped: taskData.isStopped,

                        timestamp: taskData.timestamp
                    })
                }}
            }
        }

        /**
         * @exceptioon running 작업까지 다시 넣는 것이 요청된 경우에만
         */
        if(isNeedRunningLoad) taskDatasLoader(json.running)
        taskDatasLoader(json.pending)
        taskDatasLoader(json.scheduled)

        this.checkPending()
    }
}