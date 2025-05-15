import { CPUBench } from './cpu_bench.js';
import { MagnetometerMonitor } from './magnetometer_monitor.js';

// 初始化
const cpuBench = new CPUBench();
const magnetometer = new MagnetometerMonitor();
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const startSensorBtn = document.getElementById('startSensorBtn');
const stopSensorBtn = document.getElementById('stopSensorBtn');

// CPU测试控制
startBtn.addEventListener('click', async () => {
    const serverAddress = document.getElementById('serverAddress').value.trim();
    if (!serverAddress) {
        alert('请输入服务器地址');
        return;
    }

    try {
        const response = await fetch(`${serverAddress}/get_tasks`, {
            headers: {'ngrok-skip-browser-warning': 'true'}
        });
        const data = await response.json();
        
        if (data.status !== 'success') throw new Error('获取任务失败');
        
        magnetometer.startRecording();
        cpuBench.startTest(
            data.task1,
            data.task2,
            data.task_seq,
            data.atom_time,
            data.task_total_time,
            data.total_duration
        );
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } catch (error) {
        alert(`测试启动失败：${error.message}`);
    }
});

// 磁传感器控制
startSensorBtn.addEventListener('click', () => {
    startSensorBtn.disabled = true;
    stopSensorBtn.disabled = false;
    magnetometer.start();
});

// 新增上传方法
async function uploadSensorData() {
    const serverAddress = document.getElementById('serverAddress').value.trim();
    const csvBlob = magnetometer.getCSVBlob();
    
    try {
        const formData = new FormData();
        formData.append('file', csvBlob, 'sensor_data.csv');
        
        await fetch(`${serverAddress}/upload`, {
            method: 'POST',
            body: formData,
            headers: {'ngrok-skip-browser-warning': 'true'}
        });
        console.log('传感器数据上传成功');
    } catch (error) {
        console.error('上传失败:', error);
    }
}

stopBtn.addEventListener('click', () => {
    cpuBench.stopTest();
    magnetometer.stopRecording();
    uploadSensorData();
    startBtn.disabled = false;
    stopBtn.disabled = true;
});
// 页面加载完成后自动启动磁传感器
window.addEventListener('load', () => {
    startSensorBtn.click();
});

cpuBench.setMagnetometer(magnetometer); 