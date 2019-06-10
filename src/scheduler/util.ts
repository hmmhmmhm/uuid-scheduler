import * as Type from './type'

export const timeout = (ms: number) => { return new Promise(resolve => setTimeout(resolve, ms)) }

export const taskDataExtractor = (task: Type.IScheduleTask): Type.IExtractedData | undefined => {
    if(task.uuid == undefined) return undefined

    let data: Type.IExtractedData = {
        uuid: task.uuid,
        data: task.data,
        result: task.result,
        delay: task.delay,
        timestamp: (!task.timestamp)? Date.now() : task.timestamp,
        isStarted: (!task.isStarted)? false : task.isStarted,
        isStopped: (!task.isStopped)? false : task.isStopped,
        schedule: (!task.schedule)? 0 : ((typeof task.schedule == 'number')? task.schedule : task.schedule.valueOf()),
        loop: (typeof(task['loop']) === 'undefined') ? false : true
    }
    return data
}

export const tasksDataExtractor = (tasks: Type.IScheduleTask[]): Type.IExtractedData[] => {
    let json: Type.IExtractedData[] = []

    for(let task of tasks){
        let extracted = taskDataExtractor(task)
        if(extracted !== undefined) json.push(extracted)
    }

    return json
}