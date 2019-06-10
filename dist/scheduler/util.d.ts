import * as Type from './type';
export declare const timeout: (ms: number) => Promise<{}>;
export declare const taskDataExtractor: (task: Type.IScheduleTask) => Type.IExtractedData | undefined;
export declare const tasksDataExtractor: (tasks: Type.IScheduleTask[]) => Type.IExtractedData[];
