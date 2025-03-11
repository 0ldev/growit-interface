/**
 * GrowIT Settings Interface
 * Simulation of settings management for ESP32-CAM based cannabis grow controller
 */

// Current config object that will be populated from the ESP32
let currentConfig = {};
// Flag to track if settings have been modified
let settingsModified = false;

// Add after the initialization of other variables
let systemStartTime = new Date();

// DOM loaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI
    initTabs();
    initFormEventListeners();
    
    // Load settings from ESP32 (simulated)
    loadSettings();
    
    // Initialize dynamic form elements
    initDynamicFormElements();
    
    // Update system time
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    
    // Update uptime display every second
    setInterval(updateSystemUptime, 1000);
});

// =============== TAB NAVIGATION ===============
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all tabs and buttons
            document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
            tabBtns.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// =============== FORM INITIALIZATION ===============
function initFormEventListeners() {
    // Save button
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Cancel button
    document.getElementById('cancelSettingsBtn').addEventListener('click', function() {
        if (settingsModified) {
            if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                loadSettings(); // Reload settings to discard changes
            }
        } else {
            window.location.href = 'index.html';
        }
    });
    
    // Export config button
    document.getElementById('exportConfigBtn').addEventListener('click', exportConfiguration);
    
    // Import config button
    document.getElementById('importConfigBtn').addEventListener('click', function() {
        document.getElementById('configFileInput').click();
    });
    
    // Config file input change
    document.getElementById('configFileInput').addEventListener('change', importConfiguration);
    
    // Reset config button
    document.getElementById('resetConfigBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all settings to default values? This cannot be undone.')) {
            resetToDefaults();
        }
    });
    
    // Add event listeners to all inputs to track modifications
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', function() {
            settingsModified = true;
        });
    });
    
    // Irrigation mode change
    document.getElementById('irrigation-mode').addEventListener('change', function() {
        toggleIrrigationMode(this.value);
    });
    
    // Lighting schedule mode change
    document.getElementById('lighting-schedule-mode').addEventListener('change', function() {
        toggleLightingMode(this.value);
    });
    
    // Range input value display
    document.getElementById('camera-brightness').addEventListener('input', function() {
        document.getElementById('brightness-value').textContent = this.value;
    });
    
    document.getElementById('camera-contrast').addEventListener('input', function() {
        document.getElementById('contrast-value').textContent = this.value;
    });
    
    // Add schedule entry button
    document.getElementById('addScheduleEntry').addEventListener('click', addWateringScheduleEntry);

    // Add event listener for pump calibration button
    document.getElementById('runPumpCalibrationBtn').addEventListener('click', function() {
        const duration = prompt('Enter the duration in seconds to run the pump for calibration:');
        if (duration && !isNaN(duration) && duration > 0) {
            calibratePump(duration);
        } else {
            alert('Invalid duration. Please enter a positive number.');
        }
    });
}

function initDynamicFormElements() {
    // Setup watering schedule based on config
    setupWateringSchedule();
}

// =============== SETTINGS LOADING/SAVING ===============
function loadSettings() {
    showLoading('Loading settings...');
    
    // Simulated API call to ESP32
    setTimeout(() => {
        // In a real implementation, this would be an actual fetch() to the ESP32
        fetch('/api/settings/get')
            .then(response => {
                // Simulate a response - in reality this would come from the ESP32
                return simulateConfigResponse();
            })
            .then(config => {
                currentConfig = config;
                populateFormFields(config);
                hideLoading();
                settingsModified = false;
                showNotification('Settings loaded successfully', 'success');
            })
            .catch(error => {
                console.error('Error loading settings:', error);
                hideLoading();
                showNotification('Failed to load settings', 'error');
            });
    }, 1000); // Simulate network delay
}

function saveSettings() {
    showLoading('Saving settings...');
    
    // Gather all form data
    const newConfig = gatherFormData();
    
    // Simulated API call to ESP32
    setTimeout(() => {
        // In a real implementation, this would be an actual fetch() to the ESP32
        fetch('/api/settings/save', {
            method: 'POST',
            body: JSON.stringify(newConfig),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                // Simulate a response
                if (Math.random() > 0.1) { // 90% success rate for simulation
                    return { success: true };
                } else {
                    throw new Error('Simulated save error');
                }
            })
            .then(result => {
                currentConfig = newConfig;
                settingsModified = false;
                hideLoading();
                showNotification('Settings saved successfully', 'success');
            })
            .catch(error => {
                console.error('Error saving settings:', error);
                hideLoading();
                showNotification('Failed to save settings', 'error');
            });
    }, 2000); // Simulate network delay
}

// =============== FORM DATA HANDLING ===============
function populateFormFields(config) {
    // System
    document.getElementById('system-name').value = config.system.name;
    document.getElementById('timezone').value = config.system.timezone;
    document.getElementById('data-logging-interval').value = config.system.data_logging_interval;
    document.getElementById('admin-username').value = config.security.web_interface.username;
    document.getElementById('admin-password').value = config.security.web_interface.password;
    document.getElementById('allow-internet-access').checked = config.security.allow_internet_access;
    document.getElementById('enable-ssl').checked = config.security.ssl.enabled;
    
    // Network
    document.getElementById('wifi-ssid').value = config.network.wifi.ssid;
    document.getElementById('wifi-password').value = config.network.wifi.password;
    document.getElementById('ap-fallback').checked = config.network.ap_fallback.enabled;
    document.getElementById('ap-ssid').value = config.network.ap_fallback.ssid;
    document.getElementById('ap-password').value = config.network.ap_fallback.password;
    document.getElementById('hostname').value = config.network.hostname;
    
    // Irrigation
    document.getElementById('irrigation-enabled').checked = config.irrigation.enabled;
    document.getElementById('pump-pin').value = config.irrigation.pump.pin;
    document.getElementById('pump-flow-rate').value = config.irrigation.pump.flow_rate_ml_per_second;
    document.getElementById('pump-calibration').checked = config.irrigation.pump.calibration.enabled;
    document.getElementById('tank-capacity').value = config.irrigation.water_storage.capacity_liters;
    document.getElementById('current-level').value = config.irrigation.water_storage.current_level_liters;
    document.getElementById('critical-level').value = config.irrigation.water_storage.critical_level_liters;
    document.getElementById('irrigation-mode').value = config.irrigation.mode;
    document.getElementById('soil-moisture-min').value = config.irrigation.threshold.soil_moisture_min;
    document.getElementById('soil-moisture-max').value = config.irrigation.threshold.soil_moisture_max;
    document.getElementById('watering-amount').value = config.irrigation.threshold.watering_amount_ml;
    document.getElementById('min-interval').value = config.irrigation.threshold.min_interval_seconds;
    
    // Update irrigation mode UI
    toggleIrrigationMode(config.irrigation.mode);
    
    // Lighting
    document.getElementById('lighting-enabled').checked = config.lighting.enabled;
    document.getElementById('light-relay-pin').value = config.lighting.relay_pin;
    document.getElementById('lighting-schedule-mode').value = config.lighting.schedule.mode;
    document.getElementById('light-on-time').value = config.lighting.schedule.daily.on_time;
    document.getElementById('light-off-time').value = config.lighting.schedule.daily.off_time;
    
    document.getElementById('veg-on-time').value = config.lighting.schedule.advanced.vegetative.on_time;
    document.getElementById('veg-off-time').value = config.lighting.schedule.advanced.vegetative.off_time;
    document.getElementById('flower-on-time').value = config.lighting.schedule.advanced.flowering.on_time;
    document.getElementById('flower-off-time').value = config.lighting.schedule.advanced.flowering.off_time;
    
    if (config.lighting.current_phase === 'vegetative') {
        document.getElementById('vegetative').checked = true;
    } else {
        document.getElementById('flowering').checked = true;
    }
    
    // Update lighting mode UI
    toggleLightingMode(config.lighting.schedule.mode);
    
    // Ventilation
    document.getElementById('ventilation-enabled').checked = config.ventilation.enabled;
    document.getElementById('fan-pin').value = config.ventilation.fan.pin;
    document.getElementById('fan-control-type').value = config.ventilation.fan.control_type;
    document.getElementById('min-rpm').value = config.ventilation.fan.min_rpm;
    document.getElementById('max-rpm').value = config.ventilation.fan.max_rpm;
    document.getElementById('default-rpm').value = config.ventilation.fan.default_rpm;
    document.getElementById('temp-control-enabled').checked = config.ventilation.temperature_control.enabled;
    document.getElementById('min-temp').value = config.ventilation.temperature_control.min_temp_c;
    document.getElementById('optimal-temp').value = config.ventilation.temperature_control.optimal_temp_c;
    document.getElementById('max-temp').value = config.ventilation.temperature_control.max_temp_c;
    
    // Sensors
    document.getElementById('dht22-enabled').checked = config.sensors.dht22.enabled;
    document.getElementById('dht22-pin').value = config.sensors.dht22.pin;
    document.getElementById('dht22-interval').value = config.sensors.dht22.read_interval_seconds;
    
    document.getElementById('soil-sensor-enabled').checked = config.sensors.soil_moisture.enabled;
    document.getElementById('soil-pin').value = config.sensors.soil_moisture.pin;
    document.getElementById('soil-interval').value = config.sensors.soil_moisture.read_interval_seconds;
    document.getElementById('soil-dry-value').value = config.sensors.soil_moisture.calibration.dry_value;
    document.getElementById('soil-wet-value').value = config.sensors.soil_moisture.calibration.wet_value;
    
    document.getElementById('ph-sensor-enabled').checked = config.sensors.ph_sensor.enabled;
    document.getElementById('ph-pin').value = config.sensors.ph_sensor.pin;
    document.getElementById('ph-interval').value = config.sensors.ph_sensor.read_interval_seconds;
    document.getElementById('ph-samples').value = config.sensors.ph_sensor.calibration.samples_per_reading;
    
    document.getElementById('light-sensor-enabled').checked = config.sensors.light_sensor.enabled;
    document.getElementById('light-pin').value = config.sensors.light_sensor.pin;
    
    // Camera
    document.getElementById('camera-enabled').checked = config.camera.enabled;
    document.getElementById('camera-framesize').value = config.camera.framesize;
    document.getElementById('camera-quality').value = config.camera.quality;
    document.getElementById('camera-brightness').value = config.camera.brightness;
    document.getElementById('brightness-value').textContent = config.camera.brightness;
    document.getElementById('camera-contrast').value = config.camera.contrast;
    document.getElementById('contrast-value').textContent = config.camera.contrast;
    
    document.getElementById('timelapse-enabled').checked = config.camera.timelapse.enabled;
    document.getElementById('timelapse-interval').value = config.camera.timelapse.interval_minutes;
    document.getElementById('timelapse-start').value = config.camera.timelapse.start_time;
    document.getElementById('timelapse-end').value = config.camera.timelapse.end_time;
    
    // Storage
    document.getElementById('sd-cs-pin').value = config.storage.sd_card.spi_cs_pin;
    document.getElementById('db-max-size').value = config.storage.database.max_size_mb;
    document.getElementById('vacuum-interval').value = config.storage.database.vacuum_interval_hours;
    document.getElementById('backup-interval').value = config.storage.database.backup_interval_days;
    document.getElementById('sensor-retention').value = config.storage.retention.sensor_data_days;
    document.getElementById('images-retention').value = config.storage.retention.images_days;
    document.getElementById('timelapse-retention').value = config.storage.retention.timelapse_days;
    
    // Alerts
    document.getElementById('temp-high').value = config.notifications.alerts.temperature_high;
    document.getElementById('temp-low').value = config.notifications.alerts.temperature_low;
    document.getElementById('humidity-high').value = config.notifications.alerts.humidity_high;
    document.getElementById('humidity-low').value = config.notifications.alerts.humidity_low;
    document.getElementById('soil-low').value = config.notifications.alerts.soil_moisture_low;
    document.getElementById('water-level-alert').checked = config.notifications.alerts.water_level_low;
    document.getElementById('water-critical').value = config.notifications.alerts.water_level_critical;
}

function gatherFormData() {
    // Create a copy of the current config
    const newConfig = JSON.parse(JSON.stringify(currentConfig));
    
    // System
    newConfig.system.name = document.getElementById('system-name').value;
    newConfig.system.timezone = document.getElementById('timezone').value;
    newConfig.system.data_logging_interval = parseInt(document.getElementById('data-logging-interval').value);
    newConfig.security.web_interface.username = document.getElementById('admin-username').value;
    newConfig.security.web_interface.password = document.getElementById('admin-password').value;
    newConfig.security.allow_internet_access = document.getElementById('allow-internet-access').checked;
    newConfig.security.ssl.enabled = document.getElementById('enable-ssl').checked;
    
    // Network
    newConfig.network.wifi.ssid = document.getElementById('wifi-ssid').value;
    newConfig.network.wifi.password = document.getElementById('wifi-password').value;
    newConfig.network.ap_fallback.enabled = document.getElementById('ap-fallback').checked;
    newConfig.network.ap_fallback.ssid = document.getElementById('ap-ssid').value;
    newConfig.network.ap_fallback.password = document.getElementById('ap-password').value;
    newConfig.network.hostname = document.getElementById('hostname').value;
    
    // Irrigation
    newConfig.irrigation.enabled = document.getElementById('irrigation-enabled').checked;
    newConfig.irrigation.pump.pin = parseInt(document.getElementById('pump-pin').value);
    newConfig.irrigation.pump.flow_rate_ml_per_second = parseFloat(document.getElementById('pump-flow-rate').value);
    newConfig.irrigation.pump.calibration.enabled = document.getElementById('pump-calibration').checked;
    newConfig.irrigation.water_storage.capacity_liters = parseFloat(document.getElementById('tank-capacity').value);
    newConfig.irrigation.water_storage.current_level_liters = parseFloat(document.getElementById('current-level').value);
    newConfig.irrigation.water_storage.critical_level_liters = parseFloat(document.getElementById('critical-level').value);
    newConfig.irrigation.mode = document.getElementById('irrigation-mode').value;
    newConfig.irrigation.threshold.soil_moisture_min = parseInt(document.getElementById('soil-moisture-min').value);
    newConfig.irrigation.threshold.soil_moisture_max = parseInt(document.getElementById('soil-moisture-max').value);
    newConfig.irrigation.threshold.watering_amount_ml = parseInt(document.getElementById('watering-amount').value);
    newConfig.irrigation.threshold.min_interval_seconds = parseInt(document.getElementById('min-interval').value);
    
    // Gather watering schedule entries
    if (newConfig.irrigation.mode === 'schedule') {
        const scheduleEntries = document.querySelectorAll('.schedule-entry');
        const scheduleData = [];
        
        scheduleEntries.forEach((entry, index) => {
            if (index < 10) { // Max 10 entries
                const time = entry.querySelector('input[type="time"]').value;
                const amount = parseInt(entry.querySelector('input[type="number"]').value);
                const enabled = entry.querySelector('input[type="checkbox"]').checked;
                
                scheduleData.push({
                    time: time || "00:00",
                    amount_ml: amount || 0,
                    enabled: enabled
                });
            }
        });
        
        // Fill remaining entries with defaults if needed
        while (scheduleData.length < 10) {
            scheduleData.push({
                time: "00:00",
                amount_ml: 0,
                enabled: false
            });
        }
        
        newConfig.irrigation.schedule = scheduleData;
    }
    
    // Lighting
    newConfig.lighting.enabled = document.getElementById('lighting-enabled').checked;
    newConfig.lighting.relay_pin = parseInt(document.getElementById('light-relay-pin').value);
    newConfig.lighting.schedule.mode = document.getElementById('lighting-schedule-mode').value;
    newConfig.lighting.schedule.daily.on_time = document.getElementById('light-on-time').value;
    newConfig.lighting.schedule.daily.off_time = document.getElementById('light-off-time').value;
    
    newConfig.lighting.schedule.advanced.vegetative.on_time = document.getElementById('veg-on-time').value;
    newConfig.lighting.schedule.advanced.vegetative.off_time = document.getElementById('veg-off-time').value;
    newConfig.lighting.schedule.advanced.flowering.on_time = document.getElementById('flower-on-time').value;
    newConfig.lighting.schedule.advanced.flowering.off_time = document.getElementById('flower-off-time').value;
    
    newConfig.lighting.current_phase = document.getElementById('vegetative').checked ? 'vegetative' : 'flowering';
    
    // Ventilation
    newConfig.ventilation.enabled = document.getElementById('ventilation-enabled').checked;
    newConfig.ventilation.fan.pin = parseInt(document.getElementById('fan-pin').value);
    newConfig.ventilation.fan.control_type = document.getElementById('fan-control-type').value;
    newConfig.ventilation.fan.min_rpm = parseInt(document.getElementById('min-rpm').value);
    newConfig.ventilation.fan.max_rpm = parseInt(document.getElementById('max-rpm').value);
    newConfig.ventilation.fan.default_rpm = parseInt(document.getElementById('default-rpm').value);
    newConfig.ventilation.temperature_control.enabled = document.getElementById('temp-control-enabled').checked;
    newConfig.ventilation.temperature_control.min_temp_c = parseFloat(document.getElementById('min-temp').value);
    newConfig.ventilation.temperature_control.optimal_temp_c = parseFloat(document.getElementById('optimal-temp').value);
    newConfig.ventilation.temperature_control.max_temp_c = parseFloat(document.getElementById('max-temp').value);
    
    // Sensors
    newConfig.sensors.dht22.enabled = document.getElementById('dht22-enabled').checked;
    newConfig.sensors.dht22.pin = parseInt(document.getElementById('dht22-pin').value);
    newConfig.sensors.dht22.read_interval_seconds = parseInt(document.getElementById('dht22-interval').value);
    
    newConfig.sensors.soil_moisture.enabled = document.getElementById('soil-sensor-enabled').checked;
    newConfig.sensors.soil_moisture.pin = parseInt(document.getElementById('soil-pin').value);
    newConfig.sensors.soil_moisture.read_interval_seconds = parseInt(document.getElementById('soil-interval').value);
    newConfig.sensors.soil_moisture.calibration.dry_value = parseInt(document.getElementById('soil-dry-value').value);
    newConfig.sensors.soil_moisture.calibration.wet_value = parseInt(document.getElementById('soil-wet-value').value);
    
    newConfig.sensors.ph_sensor.enabled = document.getElementById('ph-sensor-enabled').checked;
    newConfig.sensors.ph_sensor.pin = parseInt(document.getElementById('ph-pin').value);
    newConfig.sensors.ph_sensor.read_interval_seconds = parseInt(document.getElementById('ph-interval').value);
    newConfig.sensors.ph_sensor.calibration.samples_per_reading = parseInt(document.getElementById('ph-samples').value);
    
    newConfig.sensors.light_sensor.enabled = document.getElementById('light-sensor-enabled').checked;
    newConfig.sensors.light_sensor.pin = parseInt(document.getElementById('light-pin').value);
    
    // Camera
    newConfig.camera.enabled = document.getElementById('camera-enabled').checked;
    newConfig.camera.framesize = document.getElementById('camera-framesize').value;
    newConfig.camera.quality = parseInt(document.getElementById('camera-quality').value);
    newConfig.camera.brightness = parseInt(document.getElementById('camera-brightness').value);
    newConfig.camera.contrast = parseInt(document.getElementById('camera-contrast').value);
    
    newConfig.camera.timelapse.enabled = document.getElementById('timelapse-enabled').checked;
    newConfig.camera.timelapse.interval_minutes = parseInt(document.getElementById('timelapse-interval').value);
    newConfig.camera.timelapse.start_time = document.getElementById('timelapse-start').value;
    newConfig.camera.timelapse.end_time = document.getElementById('timelapse-end').value;
    
    // Storage
    newConfig.storage.sd_card.spi_cs_pin = parseInt(document.getElementById('sd-cs-pin').value);
    newConfig.storage.database.max_size_mb = parseInt(document.getElementById('db-max-size').value);
    newConfig.storage.database.vacuum_interval_hours = parseInt(document.getElementById('vacuum-interval').value);
    newConfig.storage.database.backup_interval_days = parseInt(document.getElementById('backup-interval').value);
    newConfig.storage.retention.sensor_data_days = parseInt(document.getElementById('sensor-retention').value);
    newConfig.storage.retention.images_days = parseInt(document.getElementById('images-retention').value);
    newConfig.storage.retention.timelapse_days = parseInt(document.getElementById('timelapse-retention').value);
    
    // Alerts
    newConfig.notifications.alerts.temperature_high = parseFloat(document.getElementById('temp-high').value);
    newConfig.notifications.alerts.temperature_low = parseFloat(document.getElementById('temp-low').value);
    newConfig.notifications.alerts.humidity_high = parseFloat(document.getElementById('humidity-high').value);
    newConfig.notifications.alerts.humidity_low = parseFloat(document.getElementById('humidity-low').value);
    newConfig.notifications.alerts.soil_moisture_low = parseFloat(document.getElementById('soil-low').value);
    newConfig.notifications.alerts.water_level_low = document.getElementById('water-level-alert').checked;
    newConfig.notifications.alerts.water_level_critical = parseInt(document.getElementById('water-critical').value);
    
    return newConfig;
}

// =============== DYNAMIC UI ELEMENTS ===============
function toggleIrrigationMode(mode) {
    if (mode === 'threshold') {
        document.getElementById('threshold-settings').style.display = 'block';
        document.getElementById('schedule-settings').style.display = 'none';
    } else {
        document.getElementById('threshold-settings').style.display = 'none';
        document.getElementById('schedule-settings').style.display = 'block';
    }
}

function toggleLightingMode(mode) {
    if (mode === 'daily') {
        document.getElementById('daily-light-settings').style.display = 'block';
        document.getElementById('advanced-light-settings').style.display = 'none';
    } else {
        document.getElementById('daily-light-settings').style.display = 'none';
        document.getElementById('advanced-light-settings').style.display = 'block';
    }
}

function setupWateringSchedule() {
    const container = document.getElementById('watering-schedule');
    container.innerHTML = ''; // Clear existing entries
    
    // Add entries from config
    if (currentConfig.irrigation && currentConfig.irrigation.schedule) {
        currentConfig.irrigation.schedule.forEach(entry => {
            if (entry.time !== "00:00" || entry.amount_ml > 0 || entry.enabled) {
                addWateringScheduleEntryWithValues(entry.time, entry.amount_ml, entry.enabled);
            }
        });
    }
    
    // Add at least one empty entry if none exist
    if (container.children.length === 0) {
        addWateringScheduleEntryWithValues("08:00", 100, true);
    }
}

function addWateringScheduleEntry() {
    addWateringScheduleEntryWithValues("08:00", 100, true);
}

function addWateringScheduleEntryWithValues(time, amount, enabled) {
    const container = document.getElementById('watering-schedule');
    
    // Check if we've reached the maximum number of entries
    if (container.children.length >= 10) {
        showNotification('Maximum number of schedule entries reached (10)', 'warning');
        return;
    }
    
    const entry = document.createElement('div');
    entry.className = 'schedule-entry';
    
    entry.innerHTML = `
        <input type="time" value="${time}" class="schedule-time">
        <input type="number" value="${amount}" min="0" max="1000" placeholder="Amount (ml)" class="schedule-amount">
        <span class="ml-label">ml</span>
        <div class="checkbox">
            <input type="checkbox" ${enabled ? 'checked' : ''} class="schedule-enabled">
            <label class="enabled-label">Enabled</label>
        </div>
        <span class="remove-entry"><i class="fas fa-trash"></i></span>
    `;
    
    // Add remove handler
    const removeBtn = entry.querySelector('.remove-entry');
    removeBtn.addEventListener('click', function() {
        container.removeChild(entry);
        settingsModified = true;
    });
    
    // Add change handlers for inputs
    entry.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', function() {
            settingsModified = true;
        });
    });
    
    container.appendChild(entry);
    settingsModified = true;
}

// =============== CONFIGURATION MANAGEMENT ===============
function exportConfiguration() {
    // Get the current configuration (including any unsaved changes)
    const configToExport = gatherFormData();
    
    // Convert to YAML format (simulated, would use actual YAML library)
    const yamlString = JSON.stringify(configToExport, null, 2);
    
    // Create a download link
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'growit_config.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importConfiguration(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // In a real implementation, this would parse YAML
            // For simulation purposes, we'll assume it's valid JSON
            const importedConfig = JSON.parse(e.target.result);
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to import this configuration? Current settings will be replaced.')) {
                currentConfig = importedConfig;
                populateFormFields(currentConfig);
                showNotification('Configuration imported successfully', 'success');
                settingsModified = true;
            }
        } catch (error) {
            console.error('Error importing configuration:', error);
            showNotification('Invalid configuration file', 'error');
        }
        
        // Reset the file input
        document.getElementById('configFileInput').value = '';
    };
    reader.readAsText(file);
}

function resetToDefaults() {
    // Simulate an API call to reset settings
    showLoading('Resetting to defaults...');
    
    setTimeout(() => {
        fetch('/api/settings/reset')
            .then(response => {
                // Simulate a response
                return simulateDefaultConfigResponse();
            })
            .then(config => {
                currentConfig = config;
                populateFormFields(config);
                hideLoading();
                showNotification('Settings reset to defaults', 'success');
                settingsModified = false;
            })
            .catch(error => {
                console.error('Error resetting settings:', error);
                hideLoading();
                showNotification('Failed to reset settings', 'error');
            });
    }, 1500);
}

// =============== UTILITY FUNCTIONS ===============
function showLoading(message) {
    // Create loading overlay if it doesn't exist
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        
        const loadingBox = document.createElement('div');
        loadingBox.style.padding = '20px';
        loadingBox.style.backgroundColor = 'white';
        loadingBox.style.borderRadius = '5px';
        loadingBox.style.textAlign = 'center';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.border = '5px solid #f3f3f3';
        spinner.style.borderTop = '5px solid #3498db';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '30px';
        spinner.style.height = '30px';
        spinner.style.animation = 'spin 2s linear infinite';
        
        // Add keyframe animation for spinner
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.innerHTML = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        const messageElem = document.createElement('p');
        messageElem.id = 'loading-message';
        messageElem.style.margin = '10px 0 0 0';
        messageElem.textContent = message || 'Loading...';
        
        loadingBox.appendChild(spinner);
        loadingBox.appendChild(messageElem);
        overlay.appendChild(loadingBox);
        document.body.appendChild(overlay);
    } else {
        document.getElementById('loading-message').textContent = message || 'Loading...';
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

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

function updateSystemTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('systemTime').textContent = timeString;
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

// =============== SIMULATION FUNCTIONS ===============
function simulateConfigResponse() {
    // This function simulates getting the configuration from the ESP32
    // In a real implementation, this would parse the JSON from the ESP32's response
    return {
        system: {
            name: "GrowIT Cannabis Controller",
            version: 1.0,
            timezone: "UTC",
            first_boot: false,
            data_logging_interval: 300,
            time_settings: {
                manual_time_enabled: false,
                date: "2023-07-01",
                time: "12:00:00"
            },
            data_retention: {
                retain_all_data: false,
                auto_cleanup: true
            }
        },
        network: {
            wifi: {
                ssid: "YourWiFiName",
                password: "YourWiFiPassword"
            },
            ap_fallback: {
                enabled: true,
                ssid: "GrowIT_AP",
                password: "growit123"
            },
            hostname: "growit"
        },
        security: {
            web_interface: {
                enabled: true,
                username: "admin",
                password: "admin"
            },
            allow_internet_access: false,
            ssl: {
                enabled: false
            }
        },
        irrigation: {
            enabled: true,
            pump: {
                pin: 2,
                flow_rate_ml_per_second: 1.5,
                calibration: {
                    enabled: true,
                    duration_seconds: 10
                }
            },
            water_storage: {
                capacity_liters: 10.0,
                current_level_liters: 10.0,
                critical_level_liters: 1.0,
                level_estimation: {
                    enabled: true,
                    manual_refill_tracking: true,
                    last_refill_date: "",
                    total_water_pumped_ml: 0,
                    warn_at_percentage: 20
                }
            },
            mode: "threshold",
            threshold: {
                soil_moisture_min: 30,
                soil_moisture_max: 60,
                watering_amount_ml: 100,
                min_interval_seconds: 3600
            },
            schedule: [
                { time: "06:00", amount_ml: 50, enabled: true },
                { time: "12:00", amount_ml: 75, enabled: true },
                { time: "18:00", amount_ml: 100, enabled: true },
                { time: "00:00", amount_ml: 0, enabled: false },
                { time: "00:00", amount_ml: 0, enabled: false },
                { time: "00:00", amount_ml: 0, enabled: false },
                { time: "00:00", amount_ml: 0, enabled: false },
                { time: "00:00", amount_ml: 0, enabled: false },
                { time: "00:00", amount_ml: 0, enabled: false },
                { time: "00:00", amount_ml: 0, enabled: false }
            ]
        },
        lighting: {
            enabled: true,
            relay_pin: 16,
            schedule: {
                mode: "daily",
                daily: {
                    on_time: "07:00",
                    off_time: "19:00"
                },
                advanced: {
                    vegetative: {
                        on_time: "06:00",
                        off_time: "22:00"
                    },
                    flowering: {
                        on_time: "08:00",
                        off_time: "20:00"
                    }
                }
            },
            current_phase: "vegetative",
            dim_settings: {
                enabled: false,
                morning_dim_minutes: 30,
                evening_dim_minutes: 30
            }
        },
        ventilation: {
            enabled: true,
            fan: {
                pin: 3,
                control_type: "pwm",
                min_rpm: 500,
                max_rpm: 3000,
                default_rpm: 1500
            },
            temperature_control: {
                enabled: true,
                min_temp_c: 18.0,
                optimal_temp_c: 24.0,
                max_temp_c: 30.0
            },
            schedule_control: {
                enabled: false,
                schedule: [
                    { time: "08:00", rpm: 2000 },
                    { time: "20:00", rpm: 1000 }
                ]
            }
        },
        sensors: {
            dht22: {
                enabled: true,
                pin: 1,
                read_interval_seconds: 60
            },
            soil_moisture: {
                enabled: true,
                pin: 33,
                read_interval_seconds: 60,
                calibration: {
                    dry_value: 3200,
                    wet_value: 1200
                }
            },
            ph_sensor: {
                enabled: true,
                pin: 34,
                read_interval_seconds: 60,
                calibration: {
                    points: [
                        { ph: 4.0, voltage: 3.1 },
                        { ph: 7.0, voltage: 2.5 },
                        { ph: 10.0, voltage: 1.9 }
                    ],
                    samples_per_reading: 10,
                    temperature_compensation: true
                }
            },
            light_sensor: {
                enabled: false,
                pin: 17
            }
        },
        camera: {
            enabled: true,
            framesize: "VGA",
            quality: 12,
            brightness: 0,
            contrast: 0,
            saturation: 0,
            special_effect: 0,
            wb_mode: 0,
            timelapse: {
                enabled: true,
                interval_minutes: 60,
                start_time: "08:00",
                end_time: "20:00"
            },
            stream: {
                enabled: true,
                authentication_required: true
            }
        },
        storage: {
            sd_card: {
                spi_cs_pin: 5
            },
            database: {
                max_size_mb: 500,
                vacuum_interval_hours: 24,
                backup_interval_days: 7
            },
            directories: {
                images: "/images",
                timelapse: "/timelapse",
                backups: "/backups",
                old_configs: "/oldconfigs",
                new_configs: "/newconfigs",
                logs: "/logs"
            },
            retention: {
                sensor_data_days: 30,
                images_days: 15,
                timelapse_days: 90
            }
        },
        web_interface: {
            enabled: true,
            port: 80,
            refresh_interval_seconds: 5,
            features: {
                live_camera: true,
                charts: true,
                control_panel: true,
                timelapse_viewer: true,
                data_export: true,
                system_logs: true
            },
            api: {
                enabled: false,
                token_based_auth: true
            }
        },
        notifications: {
            alerts: {
                temperature_high: 32.0,
                temperature_low: 15.0,
                humidity_high: 85.0,
                humidity_low: 30.0,
                soil_moisture_low: 20.0,
                water_level_low: true,
                water_level_critical: 15,
                estimated_days_remaining: 3,
                estimated_water_remaining_percentage: 15,
                estimated_watering_sessions_remaining: 5
            }
        }
    };
}

function simulateDefaultConfigResponse() {
    // This function simulates getting the default configuration from the ESP32
    // Mostly the same as the current config but with factory default values
    const defaultConfig = simulateConfigResponse();
    
    // Reset some key values to defaults
    defaultConfig.system.name = "GrowIT Cannabis Controller";
    defaultConfig.system.timezone = "UTC";
    defaultConfig.system.data_logging_interval = 300;
    
    defaultConfig.security.web_interface.username = "admin";
    defaultConfig.security.web_interface.password = "admin";
    
    defaultConfig.network.wifi.ssid = "";
    defaultConfig.network.wifi.password = "";
    defaultConfig.network.ap_fallback.ssid = "GrowIT_AP";
    defaultConfig.network.ap_fallback.password = "growit123";
    
    defaultConfig.irrigation.water_storage.current_level_liters = defaultConfig.irrigation.water_storage.capacity_liters;
    
    defaultConfig.notifications.alerts.temperature_high = 32.0;
    defaultConfig.notifications.alerts.temperature_low = 15.0;
    defaultConfig.notifications.alerts.humidity_high = 85.0;
    defaultConfig.notifications.alerts.humidity_low = 30.0;
    
    return defaultConfig;
}

// =============== FORM VALIDATION ===============
function validateSettings() {
    let isValid = true;
    const errors = [];
    
    // System validation
    if (!document.getElementById('system-name').value) {
        errors.push('System name cannot be empty');
        isValid = false;
    }
    
    // Network validation
    if (document.getElementById('wifi-ssid').value && !document.getElementById('wifi-password').value) {
        errors.push('WiFi password is required when SSID is provided');
        isValid = false;
    }
    
    // AP validation
    if (document.getElementById('ap-fallback').checked) {
        if (!document.getElementById('ap-ssid').value) {
            errors.push('AP SSID is required when AP fallback is enabled');
            isValid = false;
        }
        if (!document.getElementById('ap-password').value || document.getElementById('ap-password').value.length < 8) {
            errors.push('AP Password must be at least 8 characters');
            isValid = false;
        }
    }
    
    // Irrigation validation
    if (document.getElementById('irrigation-enabled').checked) {
        const tankCapacity = parseFloat(document.getElementById('tank-capacity').value);
        const currentLevel = parseFloat(document.getElementById('current-level').value);
        const criticalLevel = parseFloat(document.getElementById('critical-level').value);
        
        if (currentLevel > tankCapacity) {
            errors.push('Current water level cannot exceed tank capacity');
            isValid = false;
        }
        
        if (criticalLevel > tankCapacity) {
            errors.push('Critical water level cannot exceed tank capacity');
            isValid = false;
        }
        
        // Threshold validation
        if (document.getElementById('irrigation-mode').value === 'threshold') {
            const minMoisture = parseInt(document.getElementById('soil-moisture-min').value);
            const maxMoisture = parseInt(document.getElementById('soil-moisture-max').value);
            
            if (minMoisture >= maxMoisture) {
                errors.push('Minimum soil moisture must be less than maximum');
                isValid = false;
            }
        }
    }
    
    // Camera validation
    if (document.getElementById('camera-enabled').checked) {
        if (document.getElementById('timelapse-enabled').checked) {
            const startTime = document.getElementById('timelapse-start').value;
            const endTime = document.getElementById('timelapse-end').value;
            
            if (!startTime || !endTime) {
                errors.push('Timelapse start and end times are required');
                isValid = false;
            }
        }
    }
    
    // Alert validation
    const tempHigh = parseFloat(document.getElementById('temp-high').value);
    const tempLow = parseFloat(document.getElementById('temp-low').value);
    
    if (tempLow >= tempHigh) {
        errors.push('Low temperature alert must be less than high temperature alert');
        isValid = false;
    }
    
    const humidityHigh = parseFloat(document.getElementById('humidity-high').value);
    const humidityLow = parseFloat(document.getElementById('humidity-low').value);
    
    if (humidityLow >= humidityHigh) {
        errors.push('Low humidity alert must be less than high humidity alert');
        isValid = false;
    }
    
    // If there are errors, show them
    if (!isValid) {
        const errorMessage = 'There are issues with your settings:\n• ' + errors.join('\n• ');
        showNotification(errorMessage, 'error');
    }
    
    return isValid;
}

// Add validation before saving
const originalSaveSettings = saveSettings;
saveSettings = function() {
    if (validateSettings()) {
        originalSaveSettings();
    }
};

// =============== CAMERA PREVIEW ===============
// Update the setupCameraPreview function to work with the new tab structure
function setupCameraPreview() {
    const previewContainer = document.createElement('div');
    previewContainer.id = 'camera-preview-container';
    previewContainer.style.display = 'none';
    previewContainer.style.position = 'fixed';
    previewContainer.style.top = '0';
    previewContainer.style.left = '0';
    previewContainer.style.width = '100%';
    previewContainer.style.height = '100%';
    previewContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
    previewContainer.style.zIndex = '9999';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.justifyContent = 'center';
    
    // Create placeholder image
    const previewImage = document.createElement('img');
    previewImage.id = 'camera-preview-image';
    previewImage.src = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgBLAEsAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+f8A4f8A/BPX4qfEG3juItIg0W3kAYNqMojYj2UKT+or2TS/+CQ104Bvvidbx+otdPZv/Qnr608JQi18N6XEAAsVnEoA7fIK1K/SMPlOFpJWgvvPynF55jK8m1Nq/ZHx7B/wSVgKgv8AFFiT3C6cQP8A0bVmD/gkvbBx5nxQJXPIXThn/wAi1980VssqwqVuRGP9r4u97/efB1v/AMEnPCokDXHjTVHUHlVhgXP5oa6PRv8AgmD8MtOlEt5qGtakR/BLcIgP1CLmvryis5ZZh5bwRcM6xsXdTf3nknh/9m/4beEbcQ6X4L0aIAY8yS3E0h+rOSa634a+CNF8G+JLq10fT7ewt2s1YxxA4LFyM5JPpXaVV1axTULJoXPB5B9D3rGeEppcsUaU8wrNc0pO3qf/2Q==';
    previewImage.style.maxWidth = '90%';
    previewImage.style.maxHeight = '90%';
    previewImage.style.border = '2px solid white';
    previewContainer.appendChild(previewImage);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close Preview';
    closeButton.style.position = 'absolute';
    closeButton.style.bottom = '20px';
    closeButton.style.left = '50%';
    closeButton.style.transform = 'translateX(-50%)';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#4CAF50';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        previewContainer.style.display = 'none';
    };
    previewContainer.appendChild(closeButton);
    
    document.body.appendChild(previewContainer);
    
    // Add preview button to sensors tab under camera section
    const sensorsTab = document.getElementById('sensors');
    const previewBtn = document.createElement('button');
    previewBtn.textContent = 'Preview Camera';
    previewBtn.className = 'btn';
    previewBtn.style.marginTop = '20px';
    previewBtn.onclick = function() {
        // Simulate loading the camera preview
        showLoading('Loading camera preview...');
        
        setTimeout(() => {
            hideLoading();
            previewContainer.style.display = 'flex'; // Show the preview container
            
            // In a real implementation, we would fetch the camera stream from the ESP32
            // and update the image source
        }, 1500);
        
        return false; // Prevent form submission
    };
    
    // Find the camera section of the sensors tab
    const cameraSection = Array.from(sensorsTab.querySelectorAll('h3')).find(h => h.textContent === 'Camera');
    if (cameraSection) {
        // Insert the button after the timelapse end time field
        const timelapseEndField = document.getElementById('timelapse-end');
        if (timelapseEndField) {
            const formGroup = timelapseEndField.closest('.form-group');
            if (formGroup && formGroup.nextElementSibling) {
                sensorsTab.querySelector('.settings-form').insertBefore(previewBtn, formGroup.nextElementSibling);
            } else {
                sensorsTab.querySelector('.settings-form').appendChild(previewBtn);
            }
        } else {
            // Fallback - just append to the settings form
            sensorsTab.querySelector('.settings-form').appendChild(previewBtn);
        }
    }
}

// Update the calibration functions to match the new tab structure
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code for initializing other event listeners and UI elements...
    
    // Add calibration buttons to the interface - updated for new tab structure
    // Add pump calibration button
    const irrigationTab = document.querySelector('#irrigation .settings-form');
    const pumpCalibrationBtn = document.createElement('button');
    pumpCalibrationBtn.textContent = 'Run Pump Calibration';
    pumpCalibrationBtn.className = 'btn';
    pumpCalibrationBtn.style.marginTop = '10px';
    pumpCalibrationBtn.onclick = function() {
        if (confirm('Start pump calibration? Make sure there is water available.')) {
            calibratePump();
        }
        return false;
    };
    
    // Find the pump calibration checkbox and add the button after it
    const pumpCalibrationCheckbox = document.getElementById('pump-calibration');
    if (pumpCalibrationCheckbox) {
        const pumpCalibrationGroup = pumpCalibrationCheckbox.closest('.form-group');
        pumpCalibrationGroup.appendChild(pumpCalibrationBtn);
    }
    
    // Add soil moisture calibration button
    const sensorsTab = document.querySelector('#sensors .settings-form');
    const soilCalibrationBtn = document.createElement('button');
    soilCalibrationBtn.textContent = 'Calibrate Soil Moisture Sensor';
    soilCalibrationBtn.className = 'btn';
    soilCalibrationBtn.style.marginTop = '10px';
    soilCalibrationBtn.onclick = function() {
        if (confirm('Start soil moisture sensor calibration?')) {
            calibrateSoilMoisture();
        }
        return false;
    };
    
    // Find the soil moisture wet value input and add the button after it
    const soilWetValue = document.getElementById('soil-wet-value');
    if (soilWetValue) {
        const soilCalibrationGroup = soilWetValue.closest('.form-group');
        const nextGroup = soilCalibrationGroup.nextElementSibling;
        
        if (nextGroup) {
            sensorsTab.insertBefore(soilCalibrationBtn, nextGroup);
        } else {
            // If there's no next element, append it to the soil moisture section
            const phSensorSection = Array.from(sensorsTab.querySelectorAll('h3')).find(h => h.textContent === 'pH Sensor');
            if (phSensorSection) {
                sensorsTab.insertBefore(soilCalibrationBtn, phSensorSection);
            } else {
                sensorsTab.appendChild(soilCalibrationBtn);
            }
        }
    }
});

// =============== SYSTEM STATUS UPDATES ===============
// Periodically update system status indicators (simulated)
function updateSystemStatus() {
    const systemStatusElement = document.getElementById('systemStatus');
    
    // Simulate system status with 95% uptime
    if (Math.random() > 0.05) {
        systemStatusElement.textContent = "System Online";
        systemStatusElement.className = "status-online";
    } else {
        systemStatusElement.textContent = "System Warning";
        systemStatusElement.className = "status-warning";
    }
}

// Set up periodic status updates
setInterval(updateSystemStatus, 30000); // Every 30 seconds

// =============== CALIBRATION FUNCTIONS ===============
// These functions would handle device calibration in a real implementation
// For simulation, we'll just add the function definitions

function calibratePump(duration) {
    showLoading('Calibrating pump...');

    // Simulate pump calibration
    setTimeout(() => {
        hideLoading();
        const flowRate = (Math.random() * 2 + 1).toFixed(2); // Simulate a flow rate between 1 and 3 ml/second
        document.getElementById('pump-flow-rate').value = flowRate;
        showNotification(`Pump calibration complete. Flow rate: ${flowRate} ml/second`, 'success');
    }, duration * 1000);
}

function calibrateSoilMoisture() {
    showLoading('Calibrating soil moisture sensor...');
    
    setTimeout(() => {
        const dryValue = 3200;
        const wetValue = 1200;
        
        document.getElementById('soil-dry-value').value = dryValue;
        document.getElementById('soil-wet-value').value = wetValue;
        
        hideLoading();
        showNotification('Soil moisture sensor calibration complete', 'success');
    }, 3000);
}