import * as Type from './type';
import { Scheduler } from './index';
import * as moment from 'moment';
export declare class FailSafeScheduler extends Scheduler {
    private common;
    constructor(common: Type.IFailSafeCommon);
    getData(): Type.IFailSafeExtractedTask;
    addData(option: {
        data: any;
        delay?: number;
        schedule?: number | moment.Moment;
        callback?: (task: Type.IScheduleTask) => void;
        loop?: (option: {
            clear: (bool: any) => void;
        }) => boolean;
    }): Type.IScheduleTask;
    /**
     * @todo
     * - [ ] 차후 loop 의 uuid 별 입력 허용 구현필요
     */
    addDatas(option: {
        datas: any[];
        delay?: number;
        callback?: (tasks: Type.IScheduleTask[]) => void;
        loop?: (option: {
            clear: (bool: any) => void;
        }) => boolean;
    }): Type.IScheduleTask[];
    loadData(json: Type.IFailSafeExtractedTask, isNeedRunningLoad?: boolean): void;
}
