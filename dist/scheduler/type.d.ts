import * as LRU from 'lru-cache';
import * as moment from 'moment';
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
     * @description 작업이 이미 시작되었는지를 확인합니다.
     */
    isStarted?: boolean;
    /**
     * @description
     * 작업이 중단 되었는지를 설정합니다.
     * 시작되기 전에 해당 값이 false 면 실행되지 않습니다.
     */
    isStopped?: boolean;
    /**
     * @description 작업을 기다릴 시간을 정합니다.
     */
    delay?: number;
    /**
     * @description
     * 주어진 시간에 해당 작업을 최우선으로 시작시킵니다.
     * 값으로는 timestamp 또는 moment 인스턴스를 사용가능합니다.
     */
    schedule?: number | moment.Moment;
    /**
     * @description
     * 동일 작업을 원하는 조건 일때 발생시키는 옵션입니다.
     * 1. 반환되는 [boolean] 값을 통해서 실행여부를 결정지을 수 있습니다.
     * 2. option 을 통해 주어지는 [clear] 함수를 통해
     *    해당 조건 검사를 중단시킬 수 있습니다.
     */
    loop?: (option: {
        clear: (bool: any) => void;
    }) => boolean;
}
export interface IScheduleTaskObject {
    [key: string]: IScheduleTask;
}
export declare type IUUIDStat = 'scheduled' | 'pending' | 'running' | 'finished';
export interface IScheduleTasks {
    scheduled: IScheduleTaskObject;
    pending: IScheduleTaskObject;
    running: IScheduleTaskObject;
    finished: LRU<string, IExtractedData>;
}
export interface IScheduler {
    addTask: (paramTasks: IScheduleTask) => IScheduleTask;
    addTasks: (paramTasks: IScheduleTask[], option: IAddTasksOption) => IScheduleTask[];
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
    timestamp: number;
    schedule: number;
    loop: boolean;
}
export interface IFailSafeExtractedTask {
    scheduled: IExtractedData[];
    pending: IExtractedData[];
    running: IExtractedData[];
    finished: IExtractedData[];
}
export interface IAddTasksOption {
    delay?: number;
    schedule?: number | moment.Moment;
    loop?: () => boolean;
}
