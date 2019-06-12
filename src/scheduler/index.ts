import * as uuidv4 from 'uuid/v4'
import * as LRU from 'lru-cache'
import * as Cancelable from 'cancelable-event'
import * as Type from './type'
import * as Util from './util'
import moment = require('moment');

/**
 * @description 디버깅 옵션
 */
const IS_DEBUG_MODE = false

export class Scheduler implements Type.IScheduler {
    protected uuids: Type.IUUIDStatObject
    protected tasks: Type.IScheduleTasks
    protected stats: Type.ISchedulerStat
    public event: Cancelable
    public option
    public processorHandle: NodeJS.Timeout | null = null

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
            scheduled: {},
            pending: {},
            running: {},
            finished: new LRU(this.option.LRU)
        }
        this.stats = { runningTaskUUID: null }
        this.event = new Cancelable()

        if(this.processorHandle)
            clearInterval(this.processorHandle)
    }

    protected checkProcessor(){
    
        if(!this.processorHandle){
            /**
             * @description 스케쥴러용 틱프로세서 코딩
             */
            this.processorHandle = setInterval(()=>{

                /**
                 * @description
                 * 틱 프로세서 코딩
                 *
                 * 1. tasks.scheduled 에 기한이 일치하거나
                 *    지난 작업 찾아서 pending으로 옮기기
                 */
                let isNeedCheckPending = false
                for(let scheduledTaskUUID of Object.keys(this.tasks.scheduled)){
                    let currentTime = new Date().getTime()
                    let scheduledTask = this.tasks.scheduled[scheduledTaskUUID]

                    let isNeedToMovePending = false

                    /**
                     * @description 
                     * [scheduledTask.schedule] 처리코드
                     * 
                     * @caution
                     * loop 옵션이 있는 경우
                     * schedule 처리코드로 처리하지 않습니다.
                     */
                    if(!scheduledTask.loop && scheduledTask.schedule) {

                        try{

                            // 혹시 잘못된 정보가 담겨올까봐 선검사
                            let scheduledTaskTime = moment(scheduledTask.schedule).valueOf()

                            // 기한이 일치하거나
                            // 지난 작업 찾아서 pending으로 옮기기
                            if(currentTime >= scheduledTaskTime)
                                isNeedToMovePending = true

                            // schedule 기한 파악하기 어려울때도 옮기기
                        }catch(e){ isNeedToMovePending = true }
                    }

                    /**
                     * @description
                     * [scheduledTask.loop] 처리코드
                     * 
                     * @caution
                     * loop 옵션과 함께
                     * schedule 옵션이 있는 경우
                     * schedule 옵션을 먼저 검사합니다.
                     */
                    if(scheduledTask.loop){

                        // loop 옵션과 함게
                        // schedule 옵션이 있는 경우
                        // schedule 옵션을 먼저 검사합니다.
                        if(scheduledTask.schedule){

                            try{

                                // 혹시 잘못된 정보가 담겨올까봐 선검사
                                let scheduledTaskTime = moment(scheduledTask.schedule).valueOf()
    
                                // 기한이 일치하거나
                                // 지난 작업 찾아서 pending으로 옮기기
                                if(currentTime < scheduledTaskTime) continue
    
                                // schedule 옵션에 문제가 있다면
                                // condition 검사 작업을 실행합니다.
                            }catch(e){ console.error(e) }
                        }
                        
                        try{
                            let needToRemoveLoopTask = false
                            let needMovePending = scheduledTask.loop({
                                clear: (bool = true) => {
                                    needToRemoveLoopTask = bool
                                }
                            })

                            /**
                             * @description
                             * loop task 객체를 pending 에 복사
                             */
                            if(needMovePending){

                                if(!scheduledTask.uuid) continue
                                isNeedCheckPending = true

                                /**
                                 * @description
                                 * - <schedule> 와 <loop> 은
                                 *   복제된 작업에 포함하지 않습니다.
                                 */
                                this.addTask({
                                    task: scheduledTask.task,
                                    callback: scheduledTask.callback,

                                    data: scheduledTask.data,
                                    result: scheduledTask.result,
                                    delay: scheduledTask.delay
                                })
                            }

                            /**
                             * @description task 객체를 삭제
                             */
                            if(needToRemoveLoopTask && scheduledTask.uuid){
                                delete this.uuids[scheduledTask.uuid]
                                delete this.tasks.scheduled[scheduledTaskUUID]
                            }

                        }catch(e){
                            console.error(e)
                            isNeedToMovePending = true
                        }
                    }

                    /**
                     * @exception [schedule] 과 [loop] 옵션이 없으면 pending 으로 옮기기
                     */
                    if(!scheduledTask.schedule && !scheduledTask.loop)
                        isNeedToMovePending = true

                    /**
                     * @description pending으로 옮기기
                     */
                    if(isNeedToMovePending){
                        if(!scheduledTask.uuid) continue
                        isNeedCheckPending = true

                        this.uuids[scheduledTask.uuid] = 'pending'
                        delete this.tasks.scheduled[scheduledTaskUUID]
                        this.tasks.pending[scheduledTaskUUID] = scheduledTask
                    }
                }

                /**
                 * @description
                 * 만약 틱프로세서 작업대상이 없으면
                 * 틱프로세서 검사 과정을 중단
                 */
                if(Object.keys(this.tasks.scheduled).length == 0){
                    if(this.processorHandle){
                        clearInterval(this.processorHandle)
                        this.processorHandle = null
                    }
                }

                if(isNeedCheckPending) this.checkPending()
            }, 0)
            return true
        }
        return false
    }

    /**
     * @description
     * Pending 목록이 비어있는지 여부를 확인후 조치합니다.
     */
    protected checkPending(){
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
                        runningTask.isEnded = true
                    }catch(e){ console.log(e) }
                }

                // 이벤트에 의해 중단된 경우에도
                // 작업이 중단 되었음을 상태값으로 저장합니다.
                if(eventResult.isCanceled && !runningTask.isStopped)
                    runningTask.isStopped = true
                
                runningTask.result = result

                // 콜백 실행
                if(runningTask.callback) {
                    try{
                        await runningTask.callback(runningTask, result)
                    }catch(e){ console.log(e) }
                }

                // delay 가 0보다 크다면 setTimeout 실행 후 대기
                if(runningTask.delay && !isNaN(runningTask.delay) && runningTask.delay > 0)
                    await Util.timeout(runningTask.delay)

                // uuid 를 running 에서 finished 로 이동
                this.uuids[runningTaskUUID] = 'finished'

                /**
                 * @exception
                 * 만약 Running 중에 해당 Task 가 삭제되었을 경우 
                 * 이 Task 는 Finished 로 옮기지 않고 즉시 삭제합니다.
                 */
                if(typeof(this.tasks.running[runningTaskUUID]) != 'undefined'){

                    // task 의 주요 정보 만을 추출합니다.
                    let extractedData = Util.taskDataExtractor(runningTask)
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

    addTask (paramTask: Type.IScheduleTask): Type.IScheduleTask {

        if(typeof paramTask.uuid != 'string') paramTask.uuid = this.generateTaskUUID()
        if(typeof paramTask.timestamp != 'number') paramTask.timestamp = Date.now()
        if(typeof paramTask.isStarted != 'boolean') paramTask.isStarted = false
        if(typeof paramTask.isStopped != 'boolean') paramTask.isStopped = false
        if(typeof paramTask.isEnded != 'boolean') paramTask.isEnded = false

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
            
            /**
             * @description
             * 미래에 예정된 작업인 경우
             * scheduled 에 별도 보관후 추가작업 중단
             */
            if(typeof paramTask['schedule'] != 'undefined'
                || typeof paramTask['loop'] != 'undefined'){

                try{
                    let currentTime = new Date().getTime()
                    let scheduleTime = moment(paramTask.schedule).valueOf()
                    let timeCondition = currentTime < scheduleTime

                    // 미래에  예정된 작업인 경우에만 프로세서에 작업담기
                    if(timeCondition || typeof paramTask['loop'] != 'undefined'){

                        // scheduled 에 별도 보관후 추가작업 중단
                        this.uuids[paramTask.uuid] = 'scheduled'
                        this.tasks.scheduled[paramTask.uuid] = paramTask
                        this.checkProcessor()
                        return
                    }
                
                // schedule 입력이 잘못된 경우 오류를 출력합니다.
                }catch(e){console.error(e)}
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

    addTasks (paramTasks: Type.IScheduleTask[], option?: Type.IAddTasksOption): Type.IScheduleTask[] {
        //console.log(`call addTasks()`)
        let collectedTasks: Type.IScheduleTask[] = []
        //console.log(paramTasks)
        for(let paramTask of paramTasks)
            collectedTasks.push(this.addTask(paramTask))

        /**
         * @description
         * tasks 작업에 콜백을 겁니다.
         */
        if(option != undefined){
            let isChecked = false
            this.event.on('finished', async (eventTask: Type.IScheduleTask)=>{
                if(isChecked) return

                /**
                 * @description
                 * 모든 작업의 종료 여부를 수집하고
                 * 모든 작업이 종료된 것으로 판단될 때
                 */
                for(let collectedTask of collectedTasks)
                    if(!collectedTask.isEnded && !collectedTask.isStopped) return

                isChecked = true

                /**
                 * @todo
                 * tasks 의 callback 개념추가
                 */

                try{
                    if(option){

                        // await delay
                        if(typeof(option['delay']) === 'number' && option['delay'] > 0)
                            await Util.timeout(option['delay'])

                        // callback 시작
                        if(typeof(option['callback']) === 'function')
                            await option.callback()

                        // loop: ()=> boolean
                        if(typeof(option['loop']) === 'function'){
                            let needToLoop = option.loop()

                            // loop 함수의 결과 값이 참이면 함수 재귀
                            if(typeof(needToLoop) === 'boolean' && needToLoop){
                                let newParamTasks: Type.IScheduleTask[] = []
                                for(let paramTask of paramTasks){

                                    // UUID, isStarted 등의 옵션을 배제한
                                    // 새로운 task 정보를 구성합니다..
                                    let newParamTask: any = { task: paramTask.task }
                                    if(typeof(paramTask['callback']) !== 'undefined')
                                        newParamTask.callback = paramTask.callback
                                    if(typeof(paramTask['data']) !== 'undefined')
                                        newParamTask.data = paramTask.data

                                    if(typeof(paramTask['delay']) !== 'undefined')
                                        newParamTask.delay = paramTask.delay
                                    if(typeof(paramTask['schedule']) !== 'undefined')
                                        newParamTask.schedule = paramTask.schedule
                                    if(typeof(paramTask['loop']) !== 'undefined')
                                        newParamTask.loop = paramTask.loop

                                    newParamTasks.push(newParamTask)
                                }

                                // 새롭게 구성된 작업을 등록합니다.
                                this.addTasks(newParamTasks, option)
                            }
                        }
                    }
                }catch(e){console.error(e)}
            })
        }
        
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

    getTask(paramUUID: string): Type.IScheduleTask | undefined {
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

    getTasks(paramUUIDs: string[]): Type.IScheduleTask[] {
        let collectedTasks: Type.IScheduleTask[] = []
        for(let paramUUID of paramUUIDs){

            let task = this.getTask(paramUUID)
            if(task !== undefined) collectedTasks.push(task)
        }
        return collectedTasks
    }

    getScheduledTasks(): Type.IScheduleTask[] {
        return Object.values(this.tasks['scheduled'])
    }
    getPendingTasks(): Type.IScheduleTask[] {
        return Object.values(this.tasks['pending'])
    }
    getRunningTasks(): Type.IScheduleTask[] {
        return Object.values(this.tasks['running'])
    }
    getFinishedTasks(): Type.IExtractedData[] {
        return this.tasks['finished'].values()
    }
    getAllTasks(): Type.IScheduleTask[] {
        let collectedArray: Type.IScheduleTask[] = []

        collectedArray.concat(
            this.getScheduledTasks(),
            this.getPendingTasks(),
            this.getRunningTasks()
        )

        return collectedArray
    }
}