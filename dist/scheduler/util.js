"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeout = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
exports.taskDataExtractor = function (task) {
    if (task.uuid == undefined)
        return undefined;
    var data = {
        uuid: task.uuid,
        data: task.data,
        result: task.result,
        delay: task.delay,
        timestamp: (!task.timestamp) ? Date.now() : task.timestamp,
        isStarted: (!task.isStarted) ? false : task.isStarted,
        isStopped: (!task.isStopped) ? false : task.isStopped,
        schedule: (!task.schedule) ? 0 : ((typeof task.schedule == 'number') ? task.schedule : task.schedule.valueOf()),
        loop: (typeof (task['loop']) === 'undefined') ? false : true
    };
    return data;
};
exports.tasksDataExtractor = function (tasks) {
    var json = [];
    for (var _i = 0, tasks_1 = tasks; _i < tasks_1.length; _i++) {
        var task = tasks_1[_i];
        var extracted = exports.taskDataExtractor(task);
        if (extracted !== undefined)
            json.push(extracted);
    }
    return json;
};
//# sourceMappingURL=util.js.map