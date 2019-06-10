import * as Type from './scheduler/type';
import { Scheduler } from './scheduler';
import { FailSafeScheduler } from './scheduler/failsafe';
export { Type };
export { Scheduler };
export { FailSafeScheduler };
declare const CommonScheduler: typeof FailSafeScheduler;
export { CommonScheduler };
/**
 * @architect 스케쥴러 설계 목표
 *
 * - [o] <delay> :number
 *    작업완료 후 n 초 동안 딜레이 시키는 옵션
 *
 * - [o] <schedule> :number
 *    특정 시간 대에 작업이 작동되게 하는 옵션
 *
 * - [o] <loop> callback: ({clear}) => boolean
 *    동일 작업을 원하는 조건 일때 발생시키는 옵션
 *    반환값이 참이면 해당 작업을 다시 pending 시킵니다.
 *    - [clear] 를 호출해서 더이상 함수가 검사되지 않도록 할 수 있음
 *
 * - [tasks] Event 를 통해서 마지막 작업이 종료되었을때 작업을 진행합니다.
 * - [ ] <tasks.delay>
 * - [ ] <tasks.schedule>
 * - [ ] <tasks.loop>
 *    참이면 모든작업이 끝나면 해당 작업들을 다시 반복
 *
 * ITickProcessor
 * - <schedule> 매 틱마다 schedule 타임스탬프 비교,
 * - <loop> 매번 loop 함수 실행시켜서 일치 여부 확인
 *
 * IScheduleTasks
 * - <scheduled>
 * - <pending>
 * - <running>
 * - <finished>
 *
 */
/**
 * @todo
 * - 동시 실행량 조절 (running limit=1~n)
 * - pending running finished 이 아닌 커스텀 Stat
 * - LRU maxAge 에 근거한 archived 개념 정의
 */ 
