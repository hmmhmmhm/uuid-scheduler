"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Util = require("./util");
var index_1 = require("./index");
var FailSafeScheduler = /** @class */ (function (_super) {
    __extends(FailSafeScheduler, _super);
    function FailSafeScheduler(common) {
        var _this = _super.call(this) || this;
        // 초기화
        _this.common = common;
        return _this;
    }
    FailSafeScheduler.prototype.getData = function () {
        /**
         * @description
         * - finished 이벤트 발생마다 DB 에 넣을 코드
         */
        return {
            scheduled: Util.tasksDataExtractor(this.getScheduledTasks()),
            pending: Util.tasksDataExtractor(this.getPendingTasks()),
            running: Util.tasksDataExtractor(this.getRunningTasks()),
            finished: this.getFinishedTasks()
        };
    };
    FailSafeScheduler.prototype.addData = function (option) {
        var task = this.addTask({
            task: this.common.task,
            callback: this.common.callback,
            timestamp: Date.now(),
            data: option.data,
            delay: option.delay,
            schedule: option.schedule,
            loop: option.loop
        });
        if (typeof (option.callback) == 'function') {
            this.event.on('finished', function (eventTask) {
                if (typeof (option.callback) == 'function')
                    if (task.uuid == eventTask.uuid)
                        option.callback(task);
            });
        }
        return task;
    };
    /**
     * @todo
     * - [ ] 차후 loop 의 uuid 별 입력 허용 구현필요
     */
    FailSafeScheduler.prototype.addDatas = function (option) {
        var tasks = [];
        for (var _i = 0, _a = option.datas; _i < _a.length; _i++) {
            var data = _a[_i];
            tasks.push(this.addData({ data: data, delay: option.delay }));
        }
        if (typeof (option['callback']) == 'function') {
            this.event.on('finished', function (eventTask) {
                if (typeof (option.callback) == 'function')
                    if (tasks[tasks.length - 1].uuid == eventTask.uuid)
                        option.callback(tasks);
            });
        }
        return tasks;
    };
    FailSafeScheduler.prototype.loadData = function (json, isNeedRunningLoad) {
        var _this = this;
        if (isNeedRunningLoad === void 0) { isNeedRunningLoad = false; }
        var taskDatasLoader = function (taskDatas, isFinished) {
            if (isFinished === void 0) { isFinished = false; }
            if (isFinished) {
                for (var _i = 0, taskDatas_1 = taskDatas; _i < taskDatas_1.length; _i++) {
                    var taskData = taskDatas_1[_i];
                    _this.tasks.finished.set(taskData.uuid, taskData);
                }
            }
            else {
                for (var _a = 0, taskDatas_2 = taskDatas; _a < taskDatas_2.length; _a++) {
                    var taskData = taskDatas_2[_a];
                    {
                        _this.addTask({
                            task: _this.common.task,
                            callback: _this.common.callback,
                            uuid: taskData.uuid,
                            data: taskData.data,
                            result: taskData.result,
                            delay: taskData.delay,
                            schedule: taskData.schedule,
                            isStarted: taskData.isStarted,
                            isStopped: taskData.isStopped,
                            timestamp: taskData.timestamp
                        });
                    }
                }
            }
        };
        /**
         * @exceptioon running 작업까지 다시 넣는 것이 요청된 경우에만
         */
        if (isNeedRunningLoad)
            taskDatasLoader(json.running);
        taskDatasLoader(json.pending);
        taskDatasLoader(json.scheduled);
        this.checkPending();
    };
    return FailSafeScheduler;
}(index_1.Scheduler));
exports.FailSafeScheduler = FailSafeScheduler;
//# sourceMappingURL=failsafe.js.map