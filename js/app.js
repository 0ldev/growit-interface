/**
 * GrowIT Cannabis Controller - Interface JavaScript
 * ESP32-S3 based growing environment controller
 */

// Global variables
let environmentChart = null;
let timelapseInterval = null;
let updateInterval = null;
let systemOfflineTimeout = null;
let lastUpdate = new Date();
let systemStartTime = new Date();

// Current sensor data
let sensorData = {};

// DOM Ready event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the UI
    initUI();
    
    // Start periodic updates
    startPeriodicUpdates();
    
    // Add event listeners to UI elements
    setupEventListeners();
});

// Add event listener for settings button
document.addEventListener('DOMContentLoaded', function() {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            window.location.href = 'settings.html';
        });
    }
});

// Initialize user interface elements
function initUI() {
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    
    // Add uptime update interval
    setInterval(updateSystemUptime, 1000);
    
    // Initialize charts
    initCharts();
    
    // Set default state for UI elements
    document.getElementById('waterAmount').value = 100;
    
    // Load initial data
    loadAllData();
    
    // Initialize camera feed
    initCameraFeed();
    
    // Show initial status
    updateSystemStatus(true);
}

// Set up event listeners for interactive elements
function setupEventListeners() {
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', function() {
        // This will be implemented later to show settings overlay
        console.log('Settings button clicked');
    });
    
    // Irrigation controls
    document.getElementById('manualWaterBtn').addEventListener('click', function() {
        const amount = document.getElementById('waterAmount').value;
        manualWatering(amount);
    });
    
    // Lighting controls
    document.getElementById('lightOnBtn').addEventListener('click', function() {
        setLighting(true);
    });
    
    document.getElementById('lightOffBtn').addEventListener('click', function() {
        setLighting(false);
    });
    
    // Ventilation controls
    document.getElementById('applyFanSpeedBtn').addEventListener('click', function() {
        const speed = document.getElementById('fanSpeedSlider').value;
        setFanSpeed(speed);
    });

    document.getElementById('ventilationOnBtn').addEventListener('click', function() {
        setVentilation(true);
    });

    document.getElementById('ventilationOffBtn').addEventListener('click', function() {
        setVentilation(false);
    });
    
    // Camera controls
    document.getElementById('refreshCameraBtn').addEventListener('click', function() {
        refreshCamera();
    });
    
    document.getElementById('fullscreenCameraBtn').addEventListener('click', function() {
        toggleFullscreen('cameraFeed');
    });
    
    // Timelapse controls
    document.getElementById('previousDayBtn').addEventListener('click', function() {
        changeTimelapseDay(-1);
    });
    
    document.getElementById('nextDayBtn').addEventListener('click', function() {
        changeTimelapseDay(1);
    });
    
    document.getElementById('playTimelapseBtn').addEventListener('click', function() {
        toggleTimelapsePlayback();
    });
    
    document.getElementById('timelapseSlider').addEventListener('input', function() {
        jumpToTimelapseFrame(this.value);
    });
    
    // Chart controls
    document.getElementById('timeRangeSelect').addEventListener('change', function() {
        updateChartTimeRange(this.value);
    });
}

// Start periodic updates of sensor data and system status
function startPeriodicUpdates() {
    // Update all data every 5 seconds
    updateInterval = setInterval(function() {
        loadAllData();
    }, 5000);
    
    // Check system status every 30 seconds
    setInterval(function() {
        checkSystemStatus();
    }, 30000);
}

// Load all data from the ESP32
function loadAllData() {
    // In a real implementation, this would make API calls to the ESP32
    // For now, we'll simulate data loading
    loadEnvironmentalData();
    loadIrrigationStatus();
    loadLightingStatus();
    loadVentilationStatus();
    
    // Update the last update timestamp
    lastUpdate = new Date();
    
    // Clear any system offline timeout
    if (systemOfflineTimeout) {
        clearTimeout(systemOfflineTimeout);
    }
    
    // Update system status to online
    updateSystemStatus(true);
}

// Update the system time display
function updateSystemTime() {
    const now = new Date();
    document.getElementById('systemTime').textContent = now.toLocaleTimeString();
}

// Initialize environmental charts
function initCharts() {
    const ctx = document.getElementById('environmentChart');
    if (!ctx) return;

    environmentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(24),
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: generateDummyData(24, 20, 30),
                    borderColor: '#FF5722',
                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Humidity (%)',
                    data: generateDummyData(24, 40, 70),
                    borderColor: '#03A9F4',
                    backgroundColor: 'rgba(3, 169, 244, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Soil Moisture (%)',
                    data: generateDummyData(24, 30, 60),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Update chart with different time ranges
function updateChartTimeRange(range) {
    let dataPoints;
    let labels;
    
    switch (range) {
        case '24h':
            dataPoints = 24;
            labels = generateTimeLabels(24);
            break;
        case '7d':
            dataPoints = 7;
            labels = generateDayLabels(7);
            break;
        case '30d':
            dataPoints = 30;
            labels = generateDayLabels(30);
            break;
        default:
            dataPoints = 24;
            labels = generateTimeLabels(24);
    }
    
    environmentChart.data.labels = labels;
    environmentChart.data.datasets.forEach(dataset => {
        dataset.data = generateDummyData(dataPoints, 
            dataset.label.includes('Temperature') ? 20 : 30,
            dataset.label.includes('Temperature') ? 30 : 70);
    });
    environmentChart.update();
}

// Generate time labels for chart (hours)
function generateTimeLabels(count) {
    const labels = [];
    const now = new Date();
    
    for (let i = count-1; i >= 0; i--) {
        const time = new Date(now);
        time.setHours(now.getHours() - i);
        labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    
    return labels;
}

// Generate day labels for chart
function generateDayLabels(count) {
    const labels = [];
    const now = new Date();
    
    for (let i = count-1; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        labels.push(day.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    }
    
    return labels;
}

// Generate dummy data for chart demo
function generateDummyData(count, min, max) {
    return Array.from({ length: count }, () => 
        Math.floor(Math.random() * (max - min + 1)) + min
    );
}

// Load environmental sensor data
function loadEnvironmentalData() {
    // In a real app, this would fetch from the ESP32 API
    // For now, generate random values within realistic ranges

    // Temperature: 18-32°C with some consistency
    const lastTemp = parseFloat(document.getElementById('temperature').textContent) || 24;
    const newTemp = Math.max(18, Math.min(32, lastTemp + (Math.random() - 0.5) * 2)).toFixed(1);
    document.getElementById('temperature').textContent = newTemp;
    
    // Humidity: 35-75% with some consistency
    const lastHumidity = parseFloat(document.getElementById('humidity').textContent) || 50;
    const newHumidity = Math.max(35, Math.min(75, lastHumidity + (Math.random() - 0.5) * 5)).toFixed(1);
    document.getElementById('humidity').textContent = newHumidity;
    
    // Ventilation speed percentage
    const fanSpeed = parseFloat(document.getElementById('fanSpeed').textContent) || 1500;
    const ventPercent = Math.round(((fanSpeed - 500) / 2500) * 100);
    document.getElementById('ventSpeed').textContent = ventPercent;
    
    // Soil moisture: 20-80% with slow changes
    const lastMoisture = parseFloat(document.getElementById('soilMoisture').textContent) || 50;
    const newMoisture = Math.max(20, Math.min(80, lastMoisture + (Math.random() - 0.5) * 3)).toFixed(1);
    document.getElementById('soilMoisture').textContent = newMoisture;
    
    // pH level: 5.5-7.0 with small variations
    const lastPh = parseFloat(document.getElementById('phValue').textContent) || 6.2;
    const newPh = Math.max(5.5, Math.min(7.0, lastPh + (Math.random() - 0.5) * 0.1)).toFixed(1);
    document.getElementById('phValue').textContent = newPh;
    
    // Light intensity (if light sensor is enabled)
    if (document.getElementById('lightSensorBox')) {
        const isLightOn = document.getElementById('lightStatus').textContent === 'ON';
        const baseLight = isLightOn ? 80 : 10;
        const lightValue = (baseLight + Math.random() * 20).toFixed(1);
        document.getElementById('lightIntensity').textContent = lightValue;
    }
    
    // Water level from irrigation status
    const waterLevel = document.getElementById('waterLevel').textContent = 
        document.getElementById('waterLevel').textContent || '10.0';
    
    // Future sensor placeholder (commented out for future implementation)
    // const futureSensorValue = /* future implementation */;
    // document.getElementById('futureSensor').textContent = futureSensorValue;
    
    // Update the last update time
    const now = new Date();
    document.getElementById('envUpdateTime').textContent = now.toLocaleTimeString();
    
    // Update chart with new values (in a real app, you'd add the new values to the chart datasets)
    if (environmentChart) {
        // Add new data points to chart
        environmentChart.data.datasets[0].data.push(parseFloat(newTemp));
        environmentChart.data.datasets[0].data.shift();
        
        environmentChart.data.datasets[1].data.push(parseFloat(newHumidity));
        environmentChart.data.datasets[1].data.shift();
        
        environmentChart.data.datasets[2].data.push(parseFloat(newMoisture));
        environmentChart.data.datasets[2].data.shift();
        
        // Update labels
        environmentChart.data.labels.push(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        environmentChart.data.labels.shift();
        
        environmentChart.update();
    }
}

// Load irrigation system status
function loadIrrigationStatus() {
    // Simulate irrigation system status
    // In a real app, this would fetch from the ESP32 API
    
    // Irrigation mode (threshold or schedule)
    document.getElementById('irrigationMode').textContent = 'Threshold';
    
    // Water level
    const waterLevel = (Math.random() * 3 + 7).toFixed(1);
    document.getElementById('waterLevel').textContent = waterLevel;
    
    // Water level bar
    const waterLevelPercent = (parseFloat(waterLevel) / 10) * 100;
    document.getElementById('waterLevelBar').style.width = `${waterLevelPercent}%`;
    
    // Last watering (random time in the past 24 hours)
    const lastWateringHours = Math.floor(Math.random() * 12) + 1;
    document.getElementById('lastWatering').textContent = `${lastWateringHours} hours ago`;
    
    // Next watering (estimate based on soil moisture)
    const soilMoisture = parseFloat(document.getElementById('soilMoisture').textContent);
    const nextWateringHours = Math.max(1, Math.floor((60 - soilMoisture) / 5));
    document.getElementById('nextWatering').textContent = `Estimated in ${nextWateringHours} hours`;
}

// Load lighting system status
function loadLightingStatus() {
    // Simulate lighting system status
    // In a real app, this would fetch from the ESP32 API
    
    // Growth phase
    document.getElementById('growthPhase').textContent = 'Vegetative';
    
    // Light schedule
    document.getElementById('lightOnTime').textContent = '07:00';
    document.getElementById('lightOffTime').textContent = '19:00';
}

// Load ventilation system status
function loadVentilationStatus() {
    // Simulate ventilation system status
    // In a real app, this would fetch from the ESP32 API
    
    // Fan speed based on temperature
    const temp = parseFloat(document.getElementById('temperature').textContent);
    let fanSpeed;
    
    // Calculate fan speed based on temperature (higher temp = higher speed)
    if (temp < 22) {
        fanSpeed = 800;
    } else if (temp > 28) {
        fanSpeed = 2800;
    } else {
        // Scale between 800-2800 RPM based on temp 22-28°C
        fanSpeed = 800 + ((temp - 22) / 6) * 2000;
    }
    
    fanSpeed = Math.round(fanSpeed);
    document.getElementById('fanSpeed').textContent = fanSpeed;
    
    // Fan speed bar
    const fanSpeedPercent = ((fanSpeed - 500) / 2500) * 100;
    document.getElementById('fanSpeedBar').style.width = `${fanSpeedPercent}%`;
    
    // Control mode
    document.getElementById('fanControlMode').textContent = 'Temperature';
}

// Initialize camera feed
function initCameraFeed() {
    // In a real app, this would connect to the ESP32 camera stream
    const cameraFeed = document.getElementById('cameraFeed');
    const cameraOffline = document.querySelector('.camera-offline');
    
    // Show/hide offline message based on camera status
    // For demonstration, we'll just simulate a working camera
    if (cameraOffline) {
        cameraOffline.style.display = 'none';
    }
    
    // Set initial camera feed (in real app, this would be a streaming URL)
    if (cameraFeed) {
        // Here we'd set the actual stream URL from the ESP32
        // cameraFeed.src = '/camera/stream';
        
        // For demo, use a placeholder or keep the existing placeholder
    }
}

// Refresh the camera feed
function refreshCamera() {
    const cameraFeed = document.getElementById('cameraFeed');
    if (cameraFeed) {
        // Add a timestamp to force reload without cache
        const timestamp = new Date().getTime();
        
        // In a real app, this would append a timestamp to the camera URL
        // cameraFeed.src = `/camera/stream?t=${timestamp}`;
        
        // For demo, simulate refresh with an animation
        cameraFeed.style.opacity = '0.5';
        setTimeout(() => {
            cameraFeed.style.opacity = '1';
        }, 500);
    }
}

// Toggle fullscreen for an element
function toggleFullscreen(elementId) {
    const element = document.getElementById(elementId);
    
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Change timelapse day (previous/next)
function changeTimelapseDay(direction) {
    // In a real app, this would load different timelapse frames
    const dateEl = document.getElementById('timelapseDate');
    
    if (dateEl.textContent === 'Today' && direction < 0) {
        dateEl.textContent = 'Yesterday';
    } else if (dateEl.textContent === 'Yesterday' && direction > 0) {
        dateEl.textContent = 'Today';
    } else {
        // For other dates, generate an actual date
        let date;
        if (dateEl.textContent === 'Today') {
            date = new Date();
        } else if (dateEl.textContent === 'Yesterday') {
            date = new Date();
            date.setDate(date.getDate() - 1);
        } else {
            date = new Date(dateEl.textContent);
        }
        
        // Adjust the date
        date.setDate(date.getDate() + direction);
        
        // Format the date
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            dateEl.textContent = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateEl.textContent = 'Yesterday';
        } else {
            dateEl.textContent = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }
    
    // Reset the timelapse slider
    document.getElementById('timelapseSlider').value = 0;
    document.getElementById('timelapseTimestamp').textContent = '00:00';
    
    // In a real app, you would load the first frame of the selected day here
}

// Toggle timelapse playback
function toggleTimelapsePlayback() {
    const playButton = document.getElementById('playTimelapseBtn');
    const isPlaying = playButton.querySelector('i').classList.contains('fa-pause');
    
    if (isPlaying) {
        // Stop playback
        if (timelapseInterval) {
            clearInterval(timelapseInterval);
            timelapseInterval = null;
        }
        playButton.querySelector('i').classList.replace('fa-pause', 'fa-play');
    } else {
        // Start playback
        playButton.querySelector('i').classList.replace('fa-play', 'fa-pause');
        
        // In a real app, this would advance through actual frames
        timelapseInterval = setInterval(() => {
            const slider = document.getElementById('timelapseSlider');
            let value = parseInt(slider.value);
            
            if (value < 100) {
                value += 1;
                slider.value = value;
                updateTimelapseTimestamp(value);
            } else {
                // End of timelapse, stop playback
                clearInterval(timelapseInterval);
                timelapseInterval = null;
                playButton.querySelector('i').classList.replace('fa-pause', 'fa-play');
            }
        }, 250); // Advance every 250ms
    }
}

// Jump to specific timelapse frame
function jumpToTimelapseFrame(value) {
    // In a real app, this would display the specific frame
    updateTimelapseTimestamp(value);
    
    // Update the timelapse image (in real app, would load the specific frame)
    // For demo, we'll just change the opacity briefly to simulate loading
    const image = document.getElementById('timelapseImage');
    if (image) {
        image.style.opacity = '0.7';
        setTimeout(() => {
            image.style.opacity = '1';
        }, 200);
    }
}

// Update timelapse timestamp based on slider value
function updateTimelapseTimestamp(value) {
    // Convert value (0-100) to time of day (e.g., 08:00 - 20:00)
    const percent = value / 100;
    const startHour = 8; // 8am
    const endHour = 20; // 8pm
    const totalMinutes = (endHour - startHour) * 60;
    const minutesFromStart = Math.floor(percent * totalMinutes);
    
    const hour = Math.floor(minutesFromStart / 60) + startHour;
    const minute = minutesFromStart % 60;
    
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    document.getElementById('timelapseTimestamp').textContent = timeString;
}

// Toggle a system on/off via API call
function toggleSystem(system, enabled) {
    // In a real app, this would make an API call to the ESP32
    console.log(`Setting ${system} system to ${enabled ? 'enabled' : 'disabled'}`);
    
    // Simulated API endpoint
    // POST /api/control/{system}
    // { "enabled": true/false }
    
    // For demo, we'll just update the UI to reflect the change
    switch (system) {
        case 'irrigation':
            // Nothing to update here since the toggle itself is the UI element
            break;
        case 'lighting':
            // Update light status based on time of day if enabled
            if (enabled) {
                loadLightingStatus();
            } else {
                document.getElementById('lightStatus').textContent = 'OFF';
            }
            break;
        case 'ventilation':
            // Nothing to update here since the toggle itself is the UI element
            break;
    }
}

// Trigger manual watering
function manualWatering(amount) {
    // In a real app, this would make an API call to the ESP32
    console.log(`Manual watering triggered: ${amount} ml`);
    
    // Simulated API endpoint
    // POST /api/irrigation/manual
    // { "amount_ml": 100 }
    
    // Simulate watering in progress feedback
    const btn = document.getElementById('manualWaterBtn');
    const originalText = btn.textContent;
    
    btn.textContent = 'Watering...';
    btn.disabled = true;
    
    // After a simulated delay, restore the button
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        
        // Update last watering time
        document.getElementById('lastWatering').textContent = 'Just now';
        
        // Update water level
        const currentLevel = parseFloat(document.getElementById('waterLevel').textContent);
        const newLevel = Math.max(0, currentLevel - (amount / 1000)).toFixed(1);
        document.getElementById('waterLevel').textContent = newLevel;
        
        // Update water level bar
        const waterLevelPercent = (parseFloat(newLevel) / 10) * 100;
        document.getElementById('waterLevelBar').style.width = `${waterLevelPercent}%`;
        
        // Update soil moisture (simulate increase due to watering)
        const currentMoisture = parseFloat(document.getElementById('soilMoisture').textContent);
        const newMoisture = Math.min(90, currentMoisture + (amount / 20)).toFixed(1);
        document.getElementById('soilMoisture').textContent = newMoisture;
    }, 2000);
}

// Set lighting on/off
function setLighting(on) {
    // In a real app, this would make an API call to the ESP32
    console.log(`Setting lighting to ${on ? 'ON' : 'OFF'}`);
    
    // Simulated API endpoint
    // POST /api/lighting/set
    // { "state": true/false }
    
    // Update UI to reflect the change
    document.getElementById('lightStatus').textContent = on ? 'ON' : 'OFF';
    
    // Update light sensor reading if enabled
    if (document.getElementById('lightSensorBox')) {
        const baseLight = on ? 80 : 10;
        const lightValue = (baseLight + Math.random() * 20).toFixed(1);
        document.getElementById('lightIntensity').textContent = lightValue;
    }
}

// Set fan speed manually
function setFanSpeed(speed) {
    // In a real app, this would make an API call to the ESP32
    console.log(`Setting fan speed to ${speed} RPM`);
    
    // Simulated API endpoint
    // POST /api/ventilation/speed
    // { "rpm": 1500 }
    
    // Update UI to reflect speed change
    document.getElementById('fanSpeed').textContent = speed;
    document.getElementById('fanControlMode').textContent = 'Manual';
    
    // Update fan speed bar
    const fanSpeedPercent = ((parseInt(speed) - 500) / 2500) * 100;
    document.getElementById('fanSpeedBar').style.width = `${fanSpeedPercent}%`;
}

// Set ventilation on/off
function setVentilation(on) {
    // In a real app, this would make an API call to the ESP32
    console.log(`Setting ventilation to ${on ? 'ON' : 'OFF'}`);
    
    // Simulated API endpoint
    // POST /api/ventilation/set
    // { "state": true/false }
    
    // Update UI to reflect the change
    document.getElementById('fanControlMode').textContent = on ? 'Manual' : 'Off';
    document.getElementById('fanSpeed').textContent = on ? '1500' : '0';
    
    // Update fan speed bar
    const fanSpeedPercent = on ? 60 : 0;
    document.getElementById('fanSpeedBar').style.width = `${fanSpeedPercent}%`;
}

// Check if system is still online and responding
function checkSystemStatus() {
    // In a real app, this would ping the ESP32 to check connectivity
    
    // Calculate time since last successful data update
    const now = new Date();
    const timeSinceUpdate = now - lastUpdate;
    
    // If more than 30 seconds without update, consider system offline
    if (timeSinceUpdate > 30000) {
        updateSystemStatus(false);
    } else {
        updateSystemStatus(true);
    }
}

// Update system status indicator
function updateSystemStatus(online) {
    const statusEl = document.getElementById('systemStatus');
    
    if (online) {
        statusEl.textContent = 'System Online';
        statusEl.className = 'status-online';
    } else {
        statusEl.textContent = 'System Offline';
        statusEl.className = 'status-offline';
        statusEl.style.color = 'var(--error)';
    }
}

// Load dashboard data (simulated in this version)
function loadDashboardData() {
    // Simulate an API call to the ESP32
    setTimeout(() => {
        // Generate random sensor data for simulation
        sensorData = {
            temperature: (20 + Math.random() * 8).toFixed(1),
            humidity: (40 + Math.random() * 30).toFixed(0),
            soil_moisture: (30 + Math.random() * 40).toFixed(0),
            water_level: (3 + Math.random() * 7).toFixed(1),
            ph_level: (5.5 + Math.random() * 2).toFixed(1),
            light_intensity: (Math.random() * 100).toFixed(0),
            fan_speed: (500 + Math.random() * 2500).toFixed(0),
            fan_percentage: (20 + Math.random() * 80).toFixed(0),
            irrigation: {
                mode: Math.random() > 0.5 ? "threshold" : "schedule",
                last_watering: "2 hours ago",
                next_watering: "30 minutes",
                water_remaining: (30 + Math.random() * 70).toFixed(0)
            },
            lighting: {
                status: Math.random() > 0.3 ? "ON" : "OFF",
                phase: Math.random() > 0.5 ? "Vegetative" : "Flowering",
                on_time: "07:00",
                off_time: "19:00"
            }
        };
        
        // Update the dashboard with new data
        updateDashboard(sensorData);
        
    }, 500);
}

// Update dashboard UI with sensor data
function updateDashboard(data) {
    // Environment card
    document.getElementById('temperature').textContent = data.temperature;
    document.getElementById('humidity').textContent = data.humidity;
    document.getElementById('soilMoisture').textContent = data.soil_moisture;
    document.getElementById('waterLevel').textContent = data.water_level;
    document.getElementById('phValue').textContent = data.ph_level;
    document.getElementById('lightIntensity').textContent = data.light_intensity;
    document.getElementById('ventSpeed').textContent = data.fan_percentage;
    
    // Update last environment update time
    const now = new Date();
    document.getElementById('envUpdateTime').textContent = now.toLocaleTimeString();
    
    // Irrigation card
    document.getElementById('irrigationMode').textContent = data.irrigation.mode.charAt(0).toUpperCase() + data.irrigation.mode.slice(1);
    document.getElementById('lastWatering').textContent = data.irrigation.last_watering;
    document.getElementById('nextWatering').textContent = data.irrigation.next_watering;
    document.getElementById('waterLevelBar').style.width = data.irrigation.water_remaining + '%';
    
    // Lighting card
    document.getElementById('lightStatus').textContent = data.lighting.status;
    document.getElementById('growthPhase').textContent = data.lighting.phase;
    document.getElementById('lightOnTime').textContent = data.lighting.on_time;
    document.getElementById('lightOffTime').textContent = data.lighting.off_time;
    
    // Ventilation card
    document.getElementById('fanSpeed').textContent = data.fan_speed;
    document.getElementById('fanSpeedBar').style.width = data.fan_percentage + '%';
    document.getElementById('fanControlMode').textContent = data.temperature > 28 ? "Temperature" : "Schedule";
}

// Initialize control buttons and inputs
function initControls() {
    // Manual water button
    document.getElementById('manualWaterBtn').addEventListener('click', function() {
        const amount = document.getElementById('waterAmount').value;
        showNotification(`Watering with ${amount} ml`, 'info');
        
        // Simulate watering operation
        setTimeout(() => {
            showNotification('Watering complete', 'success');
            loadDashboardData(); // Refresh data after operation
        }, 2000);
    });
    
    // Light controls
    document.getElementById('lightOnBtn').addEventListener('click', function() {
        showNotification('Turning lights on...', 'info');
        setTimeout(() => {
            sensorData.lighting.status = "ON";
            updateDashboard(sensorData);
            document.getElementById('lightingToggle').checked = true;
            showNotification('Lights turned on', 'success');
        }, 1000);
    });
    
    document.getElementById('lightOffBtn').addEventListener('click', function() {
        showNotification('Turning lights off...', 'info');
        setTimeout(() => {
            sensorData.lighting.status = "OFF";
            updateDashboard(sensorData);
            document.getElementById('lightingToggle').checked = false;
            showNotification('Lights turned off', 'success');
        }, 1000);
    });
    
    // Toggle switches
    document.getElementById('irrigationToggle').addEventListener('change', function() {
        const status = this.checked ? 'enabled' : 'disabled';
        showNotification(`Irrigation system ${status}`, 'info');
    });
    
    document.getElementById('lightingToggle').addEventListener('change', function() {
        const status = this.checked ? 'on' : 'off';
        showNotification(`Lights turning ${status}...`, 'info');
        setTimeout(() => {
            sensorData.lighting.status = this.checked ? "ON" : "OFF";
            updateDashboard(sensorData);
            showNotification(`Lights turned ${status}`, 'success');
        }, 1000);
    });
    
    document.getElementById('ventilationToggle').addEventListener('change', function() {
        const status = this.checked ? 'enabled' : 'disabled';
        showNotification(`Ventilation system ${status}`, 'info');
        setTimeout(() => {
            if (!this.checked) {
                sensorData.fan_speed = "0";
                sensorData.fan_percentage = "0";
            } else {
                sensorData.fan_speed = "1500";
                sensorData.fan_percentage = "50";
            }
            updateDashboard(sensorData);
        }, 1000);
    });
    
    // Camera controls
    document.getElementById('refreshCameraBtn').addEventListener('click', function() {
        showNotification('Refreshing camera feed...', 'info');
        const cameraImg = document.getElementById('cameraFeed');
        cameraImg.classList.add('loading');
        
        setTimeout(() => {
            // Add a timestamp to force reload
            const timestamp = new Date().getTime();
            cameraImg.src = `placeholder-camera.jpg?t=${timestamp}`;
            cameraImg.classList.remove('loading');
            showNotification('Camera feed refreshed', 'success');
        }, 1500);
    });
    
    document.getElementById('fullscreenCameraBtn').addEventListener('click', function() {
        const cameraImg = document.getElementById('cameraFeed');
        if (cameraImg.requestFullscreen) {
            cameraImg.requestFullscreen();
        } else if (cameraImg.webkitRequestFullscreen) {
            cameraImg.webkitRequestFullscreen();
        } else if (cameraImg.msRequestFullscreen) {
            cameraImg.msRequestFullscreen();
        }
    });
}

// Show notification popup
function showNotification(message, type = 'info') {
    // Remove any existing notification
    const existingNotification = document.getElementById('notification');
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = '500';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
            notification.style.color = 'white';
    }
    
    document.body.appendChild(notification);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add this new function
function updateSystemUptime() {
    const now = new Date();
    const uptimeMs = now - systemStartTime;
    const days = Math.floor(uptimeMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptimeMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((uptimeMs % (60 * 1000)) / 1000);
    
    const uptimeText = `Uptime: ${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('systemUptime').textContent = uptimeText;
}
