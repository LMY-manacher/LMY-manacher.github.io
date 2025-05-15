export class MagnetometerMonitor {
    constructor() {
        this.sensor = null;
        this.output = document.getElementById('sensorOutput');
        this.currentData = document.getElementById('currentData');
        this.dataTable = document.getElementById('dataTable');
        this.dataBody = document.getElementById('dataBody');
        this.running = false;
        this.recording = false;  // 添加记录状态标志
        this.sensorData = [];    // 存储传感器数据
        this.startTime = 0;      // 记录开始时间
    }

    start() {
        if (this.running) return;
        
        if ('Magnetometer' in window) {
            try {
                this.sensor = new Magnetometer({ frequency: 50 });
                this.startTime = Date.now();
                this.sensorData = [];
                this.dataBody.innerHTML = '';
                this.dataTable.style.display = 'table';
                
                this.sensor.addEventListener('reading', () => {
                    const timestamp = Date.now() - this.startTime;
                    const data = {
                        timestamp: timestamp,
                        x: this.sensor.x.toFixed(2),
                        y: this.sensor.y.toFixed(2),
                        z: this.sensor.z.toFixed(2)
                    };
                    
                    // 只在记录状态下保存数据
                    if (this.recording) {
                        this.sensorData.push(data);
                    }
                    
                    // 更新当前数据显示
                    this.currentData.innerText = `当前数据 - X: ${data.x} µT, Y: ${data.y} µT, Z: ${data.z} µT`;
                });
                
                this.sensor.addEventListener('error', event => {
                    this.currentData.innerText = `传感器错误：${event.error.name}`;
                });
                
                this.sensor.start();
                this.running = true;
            } catch (e) {
                this.currentData.innerText = `初始化失败：${e}`;
            }
        } else {
            this.currentData.innerText = '当前浏览器不支持 Magnetometer API';
        }
    }

    startRecording() {
        this.recording = true;
        this.sensorData = [];  // 清空之前的数据
        this.startTime = Date.now();
    }

    stopRecording() {
        this.recording = false;
        // 显示记录的数据
        this.displayRecordedData();
    }

    displayRecordedData() {
        this.dataBody.innerHTML = '';  // 清空表格
        this.sensorData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.timestamp}</td>
                <td>${data.x}</td>
                <td>${data.y}</td>
                <td>${data.z}</td>
            `;
            this.dataBody.appendChild(row);
        });
    }

    stop() {
        if (!this.running) return;
        
        if (this.sensor) {
            this.sensor.stop();
            this.sensor = null;
        }
        this.running = false;
        this.recording = false;
        this.currentData.innerText = '传感器已停止';
    }

    getData() {
        return this.sensorData;
    }

    getCSVBlob() {
        const header = "timestamp,x,y,z\n";
        const rows = this.sensorData.map(d => 
            `${d.timestamp},${d.x},${d.y},${d.z}`
        ).join("\n");
        return new Blob([header + rows], { type: "text/csv" });
    }
} 
