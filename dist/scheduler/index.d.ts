import * as Cancelable from 'cancelable-event';
import * as Type from './type';
export declare class Scheduler implements Type.IScheduler {
    protected uuids: Type.IUUIDStatObject;
    protected tasks: Type.IScheduleTasks;
    protected stats: Type.ISchedulerStat;
    event: Cancelable;
    option: any;
    processorHandle: NodeJS.Timeout | null;
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
    protected checkProcessor(): boolean;
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
    addTask(paramTask: Type.IScheduleTask): Type.IScheduleTask;
    addTasks(paramTasks: Type.IScheduleTask[], option?: Type.IAddTasksOption): Type.IScheduleTask[];
    deleteTask(paramUUID: string): void;
    deleteTasks(paramUUIDs: string[]): void;
    generateTaskUUID(): string;
    getTask(paramUUID: string): Type.IScheduleTask | undefined;
    getTasks(paramUUIDs: string[]): Type.IScheduleTask[];
    getScheduledTasks(): Type.IScheduleTask[];
    getPendingTasks(): Type.IScheduleTask[];
    getRunningTasks(): Type.IScheduleTask[];
    getFinishedTasks(): Type.IExtractedData[];
    getAllTasks(): Type.IScheduleTask[];
}
