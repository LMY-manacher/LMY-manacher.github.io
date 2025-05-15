export class CPUBench {
    constructor() {
        this.running = false;
        this.workers = [];
        this.workerStates = [];
        this.startTime = 0;
        this.testDuration = 0;
        this.magnetometer = null;
        this.atomTaskTime = 20;
        this.taskTotalTime = 200;
        this.task1 = [];
        this.task2 = [];
        this.taskSeq = [];
    }

    /**
     * 启动CPU测试
     * @param {Array} task1 任务1的原子任务序列
     * @param {Array} task2 任务2的原子任务序列
     * @param {Array} taskSeq 任务序列（如[1,2,1]）
     * @param {number} atomTaskTime 每个原子任务耗时
     * @param {number} taskTotalTime 每个任务补足到的总时间
     * @param {number} totalDuration 总测试时长
     */
    startTest(task1, task2, taskSeq, atomTaskTime, taskTotalTime, totalDuration) {
        this.running = true;
        this.task1 = task1;
        this.task2 = task2;
        this.taskSeq = taskSeq;
        this.atomTaskTime = atomTaskTime;
        this.taskTotalTime = taskTotalTime;
        this.startTime = Date.now();
        this.testDuration = totalDuration;
        this.workerStates = [];
        this.updateUI('测试进行中...');

        // 启动磁传感器同步记录
        if (this.magnetometer) {
            this.magnetometer.startRecording();
        }

        // 检查Web Worker支持
        if (typeof Worker === 'undefined') {
            this.updateUI('错误：您的浏览器不支持Web Worker，无法进行测试');
            this.running = false;
            return;
        }

        // 创建与CPU核心数相同的worker线程
        const coreCount = navigator.hardwareConcurrency || 4;
        const threadCount = coreCount;
        let createdThreads = 0;
        for (let i = 0; i < threadCount; i++) {
            try {
                const worker = new Worker('cpu_worker.js');
                this.workers.push(worker);
                this.workerStates.push({
                    taskIndex: 0
                });
                createdThreads++;
                this.updateUI(`成功创建线程 ${createdThreads}/${threadCount}`);
            } catch (error) {
                this.updateUI(`创建线程 ${i + 1} 失败: ${error.message}`);
            }
        }

        if (createdThreads === 0) {
            this.updateUI('错误：未能创建任何线程，测试无法继续');
            this.running = false;
            return;
        }

        // 每个worker循环执行任务序列直到总时长
        //here
        this.workers.forEach((worker, idx) => {
            const state = this.workerStates[idx];
            // 递归函数：循环执行任务序列
            const runTaskSeq = () => {
                if (!this.running) return;
                if (Date.now() - this.startTime >= this.testDuration) return;
                state.taskIndex = 0;
                // 执行一轮任务序列
                const runOneSeq = () => {
                    if (!this.running) return;
                    if (Date.now() - this.startTime >= this.testDuration) return;
                    if (state.taskIndex >= this.taskSeq.length) {
                        // 一轮任务序列完成，循环下一轮
                        state.taskIndex = 0;
                        runOneSeq();
                        return;
                    }
                    // 获取当前要执行的任务（1或2）
                    const taskNum = this.taskSeq[state.taskIndex];
                    const atomList = (taskNum === 1 ? this.task1 : this.task2);
                    let atomIdx = 0;
                    const taskStart = Date.now();
                    // 递归执行当前任务的每个原子任务
                    const runAtom = () => {
                        if (!this.running) return;
                        if (Date.now() - this.startTime >= this.testDuration) return;
                        if (atomIdx >= atomList.length) {
                            // 任务内所有原子任务完成，判断是否需要补足时间
                            const elapsed = Date.now() - taskStart;
                            if (elapsed < this.taskTotalTime) {
                                setTimeout(() => {
                                    state.taskIndex++;
                                    runOneSeq();
                                }, this.taskTotalTime - elapsed);
                            } else {
                                state.taskIndex++;
                                runOneSeq();
                            }
                            return;
                        }
                        // 执行当前原子任务（通过worker）
                        const operation = atomList[atomIdx];
                        worker.postMessage({
                            operation,
                            duration: this.atomTaskTime
                        });
                        // 等待worker完成后进入下一个原子任务
                        worker.onmessage = () => {
                            atomIdx++;
                            runAtom();
                        };
                    };
                    runAtom();
                };
                runOneSeq();
            };
            runTaskSeq();
        });

        // 进度条定时刷新
        this.progressTimer = setInterval(() => {
            this.updateProgress();
        }, 50);

        // 设置测试结束定时器
        setTimeout(() => this.stopTest(), this.testDuration);
    }

    // 停止测试，释放资源
    stopTest() {
        this.running = false;
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
        }
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.workerStates = [];
        this.updateUI('测试已完成');
        if (this.magnetometer) {
            this.magnetometer.stopRecording(); // 新增停止记录
        }
    }

    // 更新UI状态
    updateUI(message) {
        document.getElementById('status').textContent = message;
    }

    // 刷新进度条
    updateProgress() {
        const elapsed = Date.now() - this.startTime;
        const progress = (elapsed / this.testDuration) * 100;
        document.getElementById('progressBar').style.width = `${Math.min(progress, 100)}%`;
    }

    // 设置磁传感器监测模块
    setMagnetometer(magnetometer) {
        this.magnetometer = magnetometer;
    }
} 