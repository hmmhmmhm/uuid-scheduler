import * as LRU from 'lru-cache';
import * as Cancelable from 'cancelable-event';
export interface IScheduleTask {
    /**
     * @description 실제 실행할 작업을 정의합니다.
     */
    task: (task: IScheduleTask) => Promise<any>;
    /**
     * @description
     * - 작업이 실행된 이후 실행될 콜백을 정의합니다.
     * - 콜백은 항상 delay 에  의한 지연이
     *   발생하기 전에 작업이 완료된 그 즉시 실행됩니다.
     * - 또한 콜백은 isStopped 로 task가 실행되지 않았어도 실행됩니다.
     */
    callback?: (task: IScheduleTask, result: any) => Promise<any>;
    /**
     * @description 작업시 참조할 수 있는 데이터가 여기 담깁니다.
     */
    data?: any;
    /**
     * @description 작업 결과물이 여기에 담깁니다.
     */
    result?: any;
    /**
     * @description 작업이 최초 삽입된 시간을 기록합니다.
     */
    timestamp?: number;
    /**
     * @description 작업의 고유ID 를 반환합니다.
     */
    uuid?: string;
    /**
     * @description 작업을 기다릴 시간을 정합니다.
     */
    delay?: number;
    /**
     * @description 작업이 이미 시작되었는지를 확인합니다.
     */
    isStarted?: boolean;
    /**
     * @description
     * 작업이 중단 되었는지를 설정합니다.
     * 시작되기 전에 해당 값이 false 면 실행되지 않습니다.
     */
    isStopped?: boolean;
}
export interface IScheduleTaskObject {
    [key: string]: IScheduleTask;
}
export declare type IUUIDStat = 'pending' | 'running' | 'finished';
export interface IScheduleTasks {
    pending: IScheduleTaskObject;
    running: IScheduleTaskObject;
    finished: LRU<string, IExtractedData>;
}
export interface IScheduler {
    addTask: (paramTasks: IScheduleTask) => IScheduleTask;
    addTasks: (paramTasks: IScheduleTask[]) => IScheduleTask[];
    deleteTask: (paramUUID: string) => void;
    deleteTasks: (paramUUIDs: string[]) => void;
    generateTaskUUID: () => string;
    getTask(paramUUID: string): IScheduleTask | undefined;
    getTasks(paramUUIDs: string[]): IScheduleTask[];
    getPendingTasks(): IScheduleTask[];
    getRunningTasks(): IScheduleTask[];
    getFinishedTasks(): IExtractedData[];
    getAllTasks(): IScheduleTask[];
}
export interface ISchedulerStat {
    runningTaskUUID: string | null;
}
export interface IUUIDStatObject {
    [key: string]: IUUIDStat;
}
export declare class Scheduler implements IScheduler {
    protected uuids: IUUIDStatObject;
    protected tasks: IScheduleTasks;
    protected stats: ISchedulerStat;
    event: Cancelable;
    option: any;
    constructor(option?: {
        LRU: {
            max: number;
        };
    });
    /**
     * @caution
     * @description
     * 스케쥴러 내 모든 데이터를 초기화합니다.
     */
    clear(): void;
    /**
     * @description
     * Pending 목록이 비어있는지 여부를 확인후 조치합니다.
     */
    protected checkPending(): void;
    /**
     * @description
     * Running 목록에 있으나 실행이 아직 안 된
     * 작업이 있는지 여부를 확인 후 조치합니다.
     */
    protected checkRunning(): void;
    addTask(paramTask: IScheduleTask): IScheduleTask;
    addTasks(paramTasks: IScheduleTask[]): IScheduleTask[];
    deleteTask(paramUUID: string): void;
    deleteTasks(paramUUIDs: string[]): void;
    generateTaskUUID(): string;
    getTask(paramUUID: string): IScheduleTask | undefined;
    getTasks(paramUUIDs: string[]): IScheduleTask[];
    getPendingTasks(): IScheduleTask[];
    getRunningTasks(): IScheduleTask[];
    getFinishedTasks(): IExtractedData[];
    getAllTasks(): IScheduleTask[];
}
export interface IFailSafeCommon {
    task: (task: IScheduleTask) => Promise<any>;
    callback?: (task: IScheduleTask, result: any) => Promise<any>;
}
export interface IExtractedData {
    uuid: string;
    data: any;
    result: any;
    delay: any;
    isStarted: boolean;
    isStopped: boolean;
}
export interface IFailSafeExtractedTask {
    pending: IExtractedData[];
    running: IExtractedData[];
    finished: IExtractedData[];
}
export declare const taskDataExtractor: (task: IScheduleTask) => IExtractedData | undefined;
export declare const tasksDataExtractor: (tasks: IScheduleTask[]) => IExtractedData[];
export declare class CommonScheduler extends Scheduler {
    private common;
    constructor(common: IFailSafeCommon);
    getData(): IFailSafeExtractedTask;
    addData(option: {
        data: any;
        delay?: number;
        callback?: (task: IScheduleTask) => void;
    }): IScheduleTask;
    addDatas(option: {
        datas: any[];
        delay?: number;
        callback?: (tasks: IScheduleTask[]) => void;
    }): IScheduleTask[];
    loadData(json: IFailSafeExtractedTask, isNeedRunningLoad?: boolean): void;
}
/**
 * @todo
 * - 동시 실행량 조절 (running limit=1~n)
 * - pending running finished 이 아닌 커스텀 Stat
 * - LRU maxAge 에 근거한 archived 개념 정의
 */ 
