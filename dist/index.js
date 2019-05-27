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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var uuidv4 = require("uuid/v4");
var LRU = require("lru-cache");
var Cancelable = require("cancelable-event");
/**
 * @description 디버깅 옵션
 */
var IS_DEBUG_MODE = false;
var Scheduler = /** @class */ (function () {
    function Scheduler(option) {
        if (option === void 0) { option = {
            LRU: {
                max: 50000
            }
        }; }
        this.option = option;
        this.clear();
    }
    /**
     * @caution
     * @description
     * 스케쥴러 내 모든 데이터를 초기화합니다.
     */
    Scheduler.prototype.clear = function () {
        this.uuids = {};
        this.tasks = {
            pending: {},
            running: {},
            finished: new LRU(this.option.LRU)
        };
        this.stats = {
            runningTaskUUID: null
        };
        this.event = new Cancelable();
    };
    /**
     * @description
     * Pending 목록이 비어있는지 여부를 확인후 조치합니다.
     */
    Scheduler.prototype.checkPending = function () {
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
        if (this.stats.runningTaskUUID !== null)
            return;
        /**
         * @exception 대기 중인 작업이 없을 때 제외
         */
        var pendingTaskUUIDs = Object.keys(this.tasks.pending);
        if (pendingTaskUUIDs.length == 0)
            return;
        if (IS_DEBUG_MODE)
            console.log('start checkPending');
        /**
         * @description 기존 작업 데이터 획득
         */
        var runningTaskUUID = pendingTaskUUIDs[0];
        var runningTask = this.tasks.pending[runningTaskUUID];
        /**
         * @description 가장 먼저 펜딩 작업목록에 추가
         */
        this.tasks.running[runningTaskUUID] = runningTask;
        this.uuids[runningTaskUUID] = 'pending';
        /**
         * @description 작업대기 목록에서 삭제
         */
        delete this.tasks.pending[runningTaskUUID];
        /**
         * @description 작업실행
         */
        this.checkRunning();
    };
    /**
     * @description
     * Running 목록에 있으나 실행이 아직 안 된
     * 작업이 있는지 여부를 확인 후 조치합니다.
     */
    Scheduler.prototype.checkRunning = function () {
        var _this = this;
        /**
         * @exception 펜딩 중인 작업이 없을 때 제외
         */
        var runningTaskUUIDs = Object.keys(this.tasks.running);
        if (runningTaskUUIDs.length == 0)
            return;
        if (IS_DEBUG_MODE)
            console.log('start checkRunning');
        var _loop_1 = function (runningTaskUUID) {
            var runningTask = this_1.tasks.running[runningTaskUUID];
            if (runningTask.isStarted)
                return "continue";
            (function () { return __awaiter(_this, void 0, void 0, function () {
                var eventResult, result, e_1, e_2, extractedData;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // 작업 실행
                            runningTask.isStarted = true;
                            this.stats.runningTaskUUID = runningTaskUUID;
                            return [4 /*yield*/, (new Promise(function (resolve) {
                                    _this.event.emit('running', runningTask, function (isCanceled, overridedParam, traceData) {
                                        resolve({ isCanceled: isCanceled, overridedParam: overridedParam, traceData: traceData });
                                    });
                                }))];
                        case 1:
                            eventResult = _a.sent();
                            result = undefined;
                            if (IS_DEBUG_MODE)
                                console.log("runningTask  isStopped: " + runningTask.isStopped + " isCanceled: " + eventResult.isCanceled);
                            if (!(!runningTask.isStopped && !eventResult.isCanceled)) return [3 /*break*/, 5];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            if (IS_DEBUG_MODE)
                                console.log("runningTask run");
                            return [4 /*yield*/, runningTask.task(runningTask)];
                        case 3:
                            result = _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _a.sent();
                            console.log(e_1);
                            return [3 /*break*/, 5];
                        case 5:
                            runningTask.result = result;
                            if (!runningTask.callback) return [3 /*break*/, 9];
                            _a.label = 6;
                        case 6:
                            _a.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, runningTask.callback(runningTask, result)];
                        case 7:
                            _a.sent();
                            return [3 /*break*/, 9];
                        case 8:
                            e_2 = _a.sent();
                            console.log(e_2);
                            return [3 /*break*/, 9];
                        case 9:
                            if (!(runningTask.delay && !isNaN(runningTask.delay) && runningTask.delay > 0)) return [3 /*break*/, 11];
                            return [4 /*yield*/, exports.timeout(runningTask.delay)
                                // uuid 를 running 에서 finished 로 이동
                            ];
                        case 10:
                            _a.sent();
                            _a.label = 11;
                        case 11:
                            // uuid 를 running 에서 finished 로 이동
                            this.uuids[runningTaskUUID] = 'finished';
                            /**
                             * @exception
                             * 만약 Running 중에 해당 Task 가 삭제되었을 경우
                             * 이 Task 는 Finished 로 옮기지 않고 즉시 삭제합니다.
                             */
                            if (typeof (this.tasks.running[runningTaskUUID]) != 'undefined') {
                                extractedData = exports.taskDataExtractor(runningTask);
                                // task 를 running 에서 finished 로 이동
                                if (extractedData)
                                    this.tasks.finished.set(runningTaskUUID, extractedData);
                                delete this.tasks.running[runningTaskUUID];
                            }
                            // this.stats.runningTaskUUID 클리어
                            if (this.stats.runningTaskUUID == runningTaskUUID)
                                this.stats.runningTaskUUID = null;
                            // finished 이벤트  실행
                            return [4 /*yield*/, (new Promise(function (resolve) {
                                    _this.event.emit('finished', runningTask, function (isCanceled, overridedParam, traceData) {
                                        resolve({ isCanceled: isCanceled, overridedParam: overridedParam, traceData: traceData });
                                    });
                                }))
                                // 이후 checkPending 재호출
                            ];
                        case 12:
                            // finished 이벤트  실행
                            _a.sent();
                            // 이후 checkPending 재호출
                            this.checkPending();
                            return [2 /*return*/];
                    }
                });
            }); })();
        };
        var this_1 = this;
        /**
         * @description 펜딩 중인 작업을 모두 확인합니다.
         */
        for (var _i = 0, runningTaskUUIDs_1 = runningTaskUUIDs; _i < runningTaskUUIDs_1.length; _i++) {
            var runningTaskUUID = runningTaskUUIDs_1[_i];
            _loop_1(runningTaskUUID);
        }
    };
    Scheduler.prototype.addTask = function (paramTask) {
        var _this = this;
        if (typeof paramTask.uuid != 'string')
            paramTask.uuid = this.generateTaskUUID();
        if (typeof paramTask.timestamp != 'number')
            paramTask.timestamp = Date.now();
        if (typeof paramTask.isStarted != 'boolean')
            paramTask.isStarted = false;
        if (typeof paramTask.isStopped != 'boolean')
            paramTask.isStopped = false;
        if (IS_DEBUG_MODE)
            console.log("addTask: " + paramTask.uuid + " start");
        // 이미 작업목록에 있으면 패스
        if (typeof (this.uuids[paramTask.uuid]) != 'undefined')
            return paramTask;
        // finished 이벤트  실행
        this.event.emit('pending', paramTask, function (isCanceled, overridedParam, traceData) {
            if (isCanceled) {
                if (IS_DEBUG_MODE)
                    console.log("addTask: " + paramTask.uuid + " cancelled.");
                return;
            }
            /**
             * @exception paramTask UUID 손상시 제외
             */
            if (!paramTask.uuid) {
                if (IS_DEBUG_MODE)
                    console.log("addTask: " + paramTask.uuid + " damaged.");
                return;
            }
            // 최초엔 무조건 pending 으로 추가
            _this.uuids[paramTask.uuid] = 'pending';
            _this.tasks.pending[paramTask.uuid] = paramTask;
            if (IS_DEBUG_MODE)
                console.log("addTask: " + paramTask.uuid + " added");
            if (IS_DEBUG_MODE)
                console.log("addTask: " + paramTask.uuid + " call checkRunning");
            _this.checkPending();
        });
        return paramTask;
    };
    Scheduler.prototype.addTasks = function (paramTasks) {
        var collectedTasks = [];
        for (var _i = 0, paramTasks_1 = paramTasks; _i < paramTasks_1.length; _i++) {
            var paramTask = paramTasks_1[_i];
            collectedTasks.push(this.addTask(paramTask));
        }
        return collectedTasks;
    };
    Scheduler.prototype.deleteTask = function (paramUUID) {
        if (typeof (this.uuids[paramUUID]) == 'undefined')
            return;
        var taskStat = this.uuids[paramUUID];
        /**
         * @description
         * finished는 Map 객체가 아니라
         * 별개 LRU Cache 인스턴스 이므로 별개 처리해줍니다.
         */
        if (String(taskStat) == 'finished') {
            // TASK 가 캐시에 남아있을 때만 삭제
            try {
                if (this.tasks['finished'].has(paramUUID))
                    this.tasks['finished'].del(paramUUID);
            }
            catch (e) { }
        }
        else {
            // 일반적인 Map 에서는 바로 TASK 삭제
            try {
                if (typeof this.tasks[taskStat][paramUUID] != 'undefined')
                    delete this.tasks[taskStat][paramUUID];
            }
            catch (e) { }
        }
        // UUID 삭제
        delete this.uuids[paramUUID];
    };
    Scheduler.prototype.deleteTasks = function (paramUUIDs) {
        for (var _i = 0, paramUUIDs_1 = paramUUIDs; _i < paramUUIDs_1.length; _i++) {
            var paramUUID = paramUUIDs_1[_i];
            this.deleteTask(paramUUID);
        }
    };
    Scheduler.prototype.generateTaskUUID = function () {
        var generatedUUID;
        // PREVENT UUID CONFLICT
        while (true) {
            generatedUUID = uuidv4();
            if (typeof (this.uuids[generatedUUID]) == 'undefined')
                break;
        }
        return generatedUUID;
    };
    Scheduler.prototype.getTask = function (paramUUID) {
        /**
         * @exception 해당 UUID의 작업이 메모리 상에 없는 경우
         */
        if (typeof (this.uuids[paramUUID]) == 'undefined')
            return undefined;
        // 검색된 Stat
        var uuidStat = this.uuids[paramUUID];
        /**
         * @exception finished 는 Task 형태로 보관하지 않습니다.
         */
        if (String(uuidStat) == 'finished')
            return undefined;
        return (typeof this.tasks[uuidStat][paramUUID] == 'undefined') ?
            undefined : this.tasks[paramUUID];
    };
    Scheduler.prototype.getTasks = function (paramUUIDs) {
        var collectedTasks = [];
        for (var _i = 0, paramUUIDs_2 = paramUUIDs; _i < paramUUIDs_2.length; _i++) {
            var paramUUID = paramUUIDs_2[_i];
            var task = this.getTask(paramUUID);
            if (task !== undefined)
                collectedTasks.push(task);
        }
        return collectedTasks;
    };
    Scheduler.prototype.getPendingTasks = function () {
        return Object.values(this.tasks['pending']);
    };
    Scheduler.prototype.getRunningTasks = function () {
        return Object.values(this.tasks['running']);
    };
    Scheduler.prototype.getFinishedTasks = function () {
        return this.tasks['finished'].values();
    };
    Scheduler.prototype.getAllTasks = function () {
        var collectedArray = [];
        collectedArray.concat(this.getPendingTasks(), this.getRunningTasks());
        return collectedArray;
    };
    return Scheduler;
}());
exports.Scheduler = Scheduler;
exports.timeout = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
exports.taskDataExtractor = function (task) {
    if (task.uuid == undefined)
        return undefined;
    var data = {
        uuid: task.uuid,
        data: task.data,
        result: task.result,
        delay: task.delay,
        timestamp: task.timestamp,
        isStarted: (!task.isStarted) ? false : task.isStarted,
        isStopped: (!task.isStopped) ? false : task.isStopped
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
var CommonScheduler = /** @class */ (function (_super) {
    __extends(CommonScheduler, _super);
    function CommonScheduler(common) {
        var _this = _super.call(this) || this;
        // 초기화
        _this.common = common;
        return _this;
    }
    CommonScheduler.prototype.getData = function () {
        /**
         * @description
         * - finished 이벤트 발생마다 DB 에 넣을 코드
         */
        return {
            pending: exports.tasksDataExtractor(this.getPendingTasks()),
            running: exports.tasksDataExtractor(this.getRunningTasks()),
            finished: this.getFinishedTasks()
        };
    };
    CommonScheduler.prototype.addData = function (option) {
        var task = this.addTask({
            task: this.common.task,
            callback: this.common.callback,
            delay: option.delay,
            data: option.data,
            timestamp: Date.now()
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
    CommonScheduler.prototype.addDatas = function (option) {
        var tasks = [];
        for (var _i = 0, _a = option.datas; _i < _a.length; _i++) {
            var data = _a[_i];
            tasks.push(this.addData({ data: data, delay: option.delay }));
        }
        if (typeof (option.callback) == 'function') {
            this.event.on('finished', function (eventTask) {
                if (typeof (option.callback) == 'function')
                    if (tasks[tasks.length - 1].uuid == eventTask.uuid)
                        option.callback(tasks);
            });
        }
        return tasks;
    };
    CommonScheduler.prototype.loadData = function (json, isNeedRunningLoad) {
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
        this.checkPending();
    };
    return CommonScheduler;
}(Scheduler));
exports.CommonScheduler = CommonScheduler;
/**
 * @todo
 * - 동시 실행량 조절 (running limit=1~n)
 * - pending running finished 이 아닌 커스텀 Stat
 * - LRU maxAge 에 근거한 archived 개념 정의
 */ 
//# sourceMappingURL=index.js.map