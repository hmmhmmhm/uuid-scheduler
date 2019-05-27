import * as uuidv4 from 'uuid/v4'
import * as LRU from 'lru-cache'
import * as Cancelable from 'cancelable-event'
import { EventEmitter } from 'events';

/**
 * @description 디버깅 옵션
 */
const IS_DEBUG_MODE = false
export interface IScheduleTask {
    /**
     * @description 실제 실행할 작업을 정의합니다.
     */
    task: (task: IScheduleTask) => Promise<any>

    /**
     * @description 
     * - 작업이 실행된 이후 실행될 콜백을 정의합니다.
     * - 콜백은 항상 delay 에  의한 지연이
     *   발생하기 전에 작업이 완료된 그 즉시 실행됩니다.
     * - 또한 콜백은 isStopped 로 task가 실행되지 않았어도 실행됩니다.
     */
    callback?: (task: IScheduleTask, result)=> Promise<any>

    /**
     * @description 작업시 참조할 수 있는 데이터가 여기 담깁니다.
     */
    data?

    /**
     * @description 작업 결과물이 여기에 담깁니다.
     */
    result?

    /**
     * @description 작업이 최초 삽입된 시간을 기록합니다.
     */
    timestamp?: number

    /**
     * @description 작업의 고유ID 를 반환합니다.
     */
    uuid?: string

    /**
     * @description 작업을 기다릴 시간을 정합니다.
     */
    delay?: number

    /**
     * @description 작업이 이미 시작되었는지를 확인합니다. 
     */
    isStarted?: boolean

    /**
     * @description
     * 작업이 중단 되었는지를 설정합니다.
     * 시작되기 전에 해당 값이 false 면 실행되지 않습니다.
     */
    isStopped?: boolean
}
export interface IScheduleTaskObject {
    [key: string]: IScheduleTask
}

export type IUUIDStat = 'pending' | 'running' | 'finished'
export interface IScheduleTasks {
    pending: IScheduleTaskObject
    running: IScheduleTaskObject
    finished: LRU<string, IExtractedData>
}
export interface IScheduler {
    addTask: (paramTasks: IScheduleTask) => IScheduleTask
    addTasks: (paramTasks: IScheduleTask[]) => IScheduleTask[]
    deleteTask: (paramUUID: string) => void
    deleteTasks: (paramUUIDs: string[]) => void
    generateTaskUUID: () => string

    getTask(paramUUID: string): IScheduleTask | undefined
    getTasks(paramUUIDs: string[]): IScheduleTask[]

    getPendingTasks(): IScheduleTask[]
    getRunningTasks(): IScheduleTask[]
    getFinishedTasks(): IExtractedData[]
    getAllTasks(): IScheduleTask[]
}

export interface ISchedulerStat {
    runningTaskUUID: string | null
}
export interface IUUIDStatObject {
    [key: string]: IUUIDStat
}

export class Scheduler implements IScheduler {
    protected uuids: IUUIDStatObject
    protected tasks: IScheduleTasks
    protected stats: ISchedulerStat
    public event: Cancelable
    public option

    constructor(option = {
        LRU: {
            max: 50000
        }
    }){

        this.option = option
        this.clear()
    }

    /**
     * @caution
     * @description
     * 스케쥴러 내 모든 데이터를 초기화합니다.
     */
    public clear(){
        this.uuids = {}
        this.tasks = {
            pending: {},
            running: {},
            finished: new LRU(this.option.LRU)
        }
        this.stats = {
            runningTaskUUID: null
        }
        this.event = new Cancelable()
    }

    /**
     * @description
     * Pending 목록이 비어있는지 여부를 확인후 조치합니다.
     */
    protected checkPending(){
        /**
         * @TODO
         * 현재는 Pending 작업이 아예 없을때 작동하는데,
         * 
         * 나중엔 동시작업을 위해서,
         * 설정된 Pending 량이 부족할때도
         * 아래 작업이 진행되도록 향후 구성
         */

        /**
         * @exception 작업 중인 테스트가 이미 존재할 때 제외
         */
        if(this.stats.runningTaskUUID !== null) return

        /**
         * @exception 대기 중인 작업이 없을 때 제외
         */
        let pendingTaskUUIDs = Object.keys(this.tasks.pending)
        if(pendingTaskUUIDs.length == 0) return

        if(IS_DEBUG_MODE) console.log('start checkPending')

        /**
         * @description 기존 작업 데이터 획득
         */
        let runningTaskUUID = pendingTaskUUIDs[0]
        let runningTask = this.tasks.pending[runningTaskUUID]

        /**
         * @description 가장 먼저 펜딩 작업목록에 추가
         */
        this.tasks.running[runningTaskUUID] = runningTask
        this.uuids[runningTaskUUID] = 'pending'

        /**
         * @description 작업대기 목록에서 삭제
         */
        delete this.tasks.pending[runningTaskUUID]

        /**
         * @description 작업실행
         */
        this.checkRunning()
    }

    /**
     * @description
     * Running 목록에 있으나 실행이 아직 안 된
     * 작업이 있는지 여부를 확인 후 조치합니다.
     */
    protected checkRunning(){

        /**
         * @exception 펜딩 중인 작업이 없을 때 제외
         */
        let runningTaskUUIDs = Object.keys(this.tasks.running)
        if(runningTaskUUIDs.length == 0) return

        if(IS_DEBUG_MODE) console.log('start checkRunning')

        /**
         * @description 펜딩 중인 작업을 모두 확인합니다.
         */
        for(let runningTaskUUID of runningTaskUUIDs){
            let runningTask = this.tasks.running[runningTaskUUID]
            if(runningTask.isStarted) continue

            /**
             * @description 실행되지 않은 작업이 있다면 실행시킵니다.
             */
            ;(async ()=>{

                // 작업 실행
                runningTask.isStarted = true
                this.stats.runningTaskUUID = runningTaskUUID

                // running 이벤트  실행
                let eventResult: {isCanceled, overridedParam, traceData} 
                    = await (new Promise((resolve)=>{
                        this.event.emit('running', runningTask,
                            (isCanceled, overridedParam, traceData)=>{
                                resolve({isCanceled, overridedParam, traceData})
                            })
                    }
                ))

                let result = undefined
                if(IS_DEBUG_MODE) console.log(`runningTask  isStopped: ${runningTask.isStopped} isCanceled: ${eventResult.isCanceled}`)
                if(!runningTask.isStopped && !eventResult.isCanceled){
                    try{
                        if(IS_DEBUG_MODE) console.log(`runningTask run`)
                        result = await runningTask.task(runningTask)
                    }catch(e){ console.log(e) }
                }
                runningTask.result = result

                // 콜백 실행
                if(runningTask.callback) {
                    try{
                        await runningTask.callback(runningTask, result)
                    }catch(e){ console.log(e) }
                }

                // delay 가 0보다 크다면 setTimeout 실행 후 대기
                if(runningTask.delay && !isNaN(runningTask.delay) && runningTask.delay > 0)
                    await timeout(runningTask.delay)

                // uuid 를 running 에서 finished 로 이동
                this.uuids[runningTaskUUID] = 'finished'

                /**
                 * @exception
                 * 만약 Running 중에 해당 Task 가 삭제되었을 경우 
                 * 이 Task 는 Finished 로 옮기지 않고 즉시 삭제합니다.
                 */
                if(typeof(this.tasks.running[runningTaskUUID]) != 'undefined'){

                    // task 의 주요 정보 만을 추출합니다.
                    let extractedData = taskDataExtractor(runningTask)
                    // task 를 running 에서 finished 로 이동
                    if(extractedData) this.tasks.finished.set(runningTaskUUID, extractedData)

                    delete this.tasks.running[runningTaskUUID]
                }

                // this.stats.runningTaskUUID 클리어
                if(this.stats.runningTaskUUID == runningTaskUUID)
                    this.stats.runningTaskUUID = null

                // finished 이벤트  실행
                await (new Promise((resolve)=>{
                    this.event.emit('finished', runningTask,
                        (isCanceled, overridedParam, traceData)=>{
                            resolve({isCanceled, overridedParam, traceData})
                        })
                    }
                ))

                // 이후 checkPending 재호출
                this.checkPending()
            })()
        }
    }

    addTask (paramTask: IScheduleTask): IScheduleTask {

        if(typeof paramTask.uuid != 'string') paramTask.uuid = this.generateTaskUUID()
        if(typeof paramTask.timestamp != 'number') paramTask.timestamp = Date.now()
        if(typeof paramTask.isStarted != 'boolean') paramTask.isStarted = false
        if(typeof paramTask.isStopped != 'boolean') paramTask.isStopped = false
        
        if(IS_DEBUG_MODE) console.log(`addTask: ${paramTask.uuid} start`)

        // 이미 작업목록에 있으면 패스
        if(typeof(this.uuids[paramTask.uuid]) != 'undefined') return paramTask

        // finished 이벤트  실행
        this.event.emit('pending', paramTask,
            (isCanceled, overridedParam, traceData)=>{

            if(isCanceled){
                if(IS_DEBUG_MODE) console.log(`addTask: ${paramTask.uuid} cancelled.`)
                return
            }

            /**
             * @exception paramTask UUID 손상시 제외
             */
            if(!paramTask.uuid) {
                if(IS_DEBUG_MODE) console.log(`addTask: ${paramTask.uuid} damaged.`)
                return
            }

            // 최초엔 무조건 pending 으로 추가
            this.uuids[paramTask.uuid] = 'pending'
            this.tasks.pending[paramTask.uuid] = paramTask

            if(IS_DEBUG_MODE) console.log(`addTask: ${paramTask.uuid} added`)
            if(IS_DEBUG_MODE) console.log(`addTask: ${paramTask.uuid} call checkRunning`)
            this.checkPending()
        })

        return paramTask
    }

    addTasks (paramTasks: IScheduleTask[]): IScheduleTask[] {
        let collectedTasks: IScheduleTask[] = []
        for(let paramTask of paramTasks)
            collectedTasks.push(this.addTask(paramTask))
        return collectedTasks
    }

    deleteTask (paramUUID: string) {
        if(typeof(this.uuids[paramUUID]) == 'undefined') return
        const taskStat = this.uuids[paramUUID]

        /**
         * @description 
         * finished는 Map 객체가 아니라
         * 별개 LRU Cache 인스턴스 이므로 별개 처리해줍니다.
         */
        if(String(taskStat) == 'finished'){

            // TASK 가 캐시에 남아있을 때만 삭제
            try{
                if(this.tasks['finished'].has(paramUUID))
                    this.tasks['finished'].del(paramUUID)
            }catch(e){}
            
        }else{
            
            // 일반적인 Map 에서는 바로 TASK 삭제
            try{
                if(typeof this.tasks[taskStat][paramUUID] != 'undefined')
                    delete this.tasks[taskStat][paramUUID]
            }catch(e){}
        }

        // UUID 삭제
        delete this.uuids[paramUUID]
    }

    deleteTasks (paramUUIDs: string[]) {
        for(let paramUUID of paramUUIDs)
            this.deleteTask(paramUUID)
    }

    generateTaskUUID(): string {
        let generatedUUID

        // PREVENT UUID CONFLICT
        while(true){
            generatedUUID = uuidv4()
            if(typeof(this.uuids[generatedUUID]) == 'undefined') break
        }
        return generatedUUID
    }

    getTask(paramUUID: string): IScheduleTask | undefined {
        /**
         * @exception 해당 UUID의 작업이 메모리 상에 없는 경우
         */
        if(typeof(this.uuids[paramUUID]) == 'undefined') return undefined
        
        // 검색된 Stat
        let uuidStat = this.uuids[paramUUID]

        /**
         * @exception finished 는 Task 형태로 보관하지 않습니다.
         */
        if(String(uuidStat) == 'finished') return undefined

        return (typeof this.tasks[uuidStat][paramUUID] == 'undefined') ? 
            undefined : this.tasks[paramUUID]
    }

    getTasks(paramUUIDs: string[]): IScheduleTask[] {
        let collectedTasks: IScheduleTask[] = []
        for(let paramUUID of paramUUIDs){

            let task = this.getTask(paramUUID)
            if(task !== undefined) collectedTasks.push(task)
        }
        return collectedTasks
    }

    getPendingTasks(): IScheduleTask[] {
        return Object.values(this.tasks['pending'])
    }
    getRunningTasks(): IScheduleTask[] {
        return Object.values(this.tasks['running'])
    }
    getFinishedTasks(): IExtractedData[] {
        return this.tasks['finished'].values()
    }
    getAllTasks(): IScheduleTask[] {
        let collectedArray: IScheduleTask[] = []

        collectedArray.concat(
            this.getPendingTasks(),
            this.getRunningTasks()
        )

        return collectedArray
    }
}

export const timeout = (ms: number) => { return new Promise(resolve => setTimeout(resolve, ms)) }

export interface IFailSafeCommon {
    task: (task: IScheduleTask) => Promise<any>
    callback?: (task: IScheduleTask, result)=> Promise<any>
}
export interface IExtractedData {
    uuid: string
    data: any
    result: any
    delay: any
    isStarted: boolean
    isStopped: boolean
}

export interface IFailSafeExtractedTask {
    pending: IExtractedData[]
    running: IExtractedData[]
    finished: IExtractedData[]
}

export const taskDataExtractor = (task: IScheduleTask): IExtractedData | undefined => {
    if(task.uuid == undefined) return undefined

    let data: IExtractedData = {
        uuid: task.uuid,
        data: task.data,
        result: task.result,
        delay: task.delay,
        isStarted: (!task.isStarted)? false : task.isStarted,
        isStopped: (!task.isStopped)? false : task.isStopped
    }
    return data
}

export const tasksDataExtractor = (tasks: IScheduleTask[]): IExtractedData[] => {
    let json: IExtractedData[] = []

    for(let task of tasks){
        let extracted = taskDataExtractor(task)
        if(extracted !== undefined) json.push(extracted)
    }

    return json
}

export class CommonScheduler extends Scheduler {
    private common: IFailSafeCommon

    constructor(common: IFailSafeCommon){
        super()

        // 초기화
        this.common = common
    }

    getData(): IFailSafeExtractedTask {
        /**
         * @description
         * - finished 이벤트 발생마다 DB 에 넣을 코드
         */
        return {
            pending: tasksDataExtractor(this.getPendingTasks()),
            running: tasksDataExtractor(this.getRunningTasks()),
            finished: this.getFinishedTasks()
        }
    }

    addData(option: {
        data: any,
        delay?: number,
        callback?: (task: IScheduleTask)=> void
    }): IScheduleTask {

        let task = this.addTask({
            task: this.common.task,
            callback: this.common.callback,
            delay: option.delay,
            data: option.data
        })

        if(typeof(option.callback) == 'function'){
            this.event.on('finished', (eventTask: IScheduleTask)=>{

                if(typeof(option.callback) == 'function')
                    if(task.uuid == eventTask.uuid) option.callback(task)
            })
        }

        return task
    }

    addDatas(option: {
        datas: any[], 
        delay?: number,
        callback?: (tasks: IScheduleTask[])=> void
    }): IScheduleTask[] {

        let tasks: IScheduleTask[] = [] 
        for(let data of option.datas)
            tasks.push(this.addData({data, delay: option.delay}) )

        if(typeof(option.callback) == 'function'){
            this.event.on('finished', (eventTask: IScheduleTask)=>{

                if(typeof(option.callback) == 'function')
                    if(tasks[tasks.length-1].uuid == eventTask.uuid) option.callback(tasks)
            })
        }

        return tasks
    }

    loadData(json: IFailSafeExtractedTask, isNeedRunningLoad = false){

        const taskDatasLoader = (taskDatas: IExtractedData[], isFinished = false)=>{
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

                        isStarted: taskData.isStarted,
                        isStopped: taskData.isStopped
                    })
                }}
            }
        }

        /**
         * @exceptioon running 작업까지 다시 넣는 것이 요청된 경우에만
         */
        if(isNeedRunningLoad) taskDatasLoader(json.running)

        taskDatasLoader(json.pending)
        this.checkPending()
    }
}

 /**
  * @todo
  * - 동시 실행량 조절 (running limit=1~n)
  * - pending running finished 이 아닌 커스텀 Stat
  * - LRU maxAge 에 근거한 archived 개념 정의
  */