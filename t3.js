// CPU密集型操作
function performOperation(operation) {
    switch (operation) {
        case 0:
            // 加法操作
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
                sum += Math.PI + Math.E;
            }
            return sum;
        case 1:
            // 减法操作
            let diff = 0;
            for (let i = 0; i < 1000000; i++) {
                diff += Math.PI - Math.E;
            }
            return diff;
        case 2:
            // 乘法操作
            let product = 0;
            for (let i = 0; i < 1000000; i++) {
                product += Math.PI * Math.E;
            }
            return product;
        case 3:
            // 除法操作
            let quotient = 0;
            for (let i = 0; i < 1000000; i++) {
                quotient += Math.PI / Math.E;
            }
            return quotient;
        case 4:
            // 开方操作
            let sqrt = 0;
            for (let i = 0; i < 1000000; i++) {
                sqrt += Math.sqrt(Math.PI);
            }
            return sqrt;
        case 5:
            // 空等操作
            return 0;
    }
}

// 监听主线程消息
self.addEventListener('message', function(e) {
    const { operation, duration } = e.data;
    const startTime = performance.now();
    const endTime = startTime + duration;
    
    // 在指定时间内持续执行操作
    while (performance.now() < endTime) {
        performOperation(operation);
    }
    
    const actualDuration = performance.now() - startTime;
    
    // 发送结果回主线程
    self.postMessage({
        operation,
        duration: actualDuration
    });
}); 