"use strict";
var PluginName = 'homebridge-platform-isolarcloud';
var PlatformName = 'ISolarCloud';
var hap;
var isolarcloudapi_1 = require("./isolarcloudapi");
var PlatformISolarCloud = /** @class */ (function () {
    function PlatformISolarCloud(log, config, api) {
        var _this = this;
        this.log = log;
        this.config = config;
        this.api = api;
        this.email = "";
        this.password = "";
        this.accessories = {};
        if (!config || !config["email"] || !config["password"]) {
            this.log.error("Platform config incorrect or missing. Check the config.json file.");
        }
        else {
            this.email = config["email"];
            this.password = config["password"];
            this.log.info('Starting PlatformISolarCloud using homebridge API', api.version);
            if (api) {
                // save the api for use later
                this.api = api;
                // if finished loading cache accessories
                this.api.on("didFinishLaunching", function () {
                    // Load the Power Stations
                    _this.loadPowerStations();
                });
            }
        }
    }
    PlatformISolarCloud.prototype.loadPowerStations = function () {
        var _this = this;
        this.log.debug("Fetch the Power Stations");
        // login to the API and get the token
        var iSolarCloudAPI = new isolarcloudapi_1.ISolarCloudAPI(this.log, this.email, this.password);
        iSolarCloudAPI.login()
            .then(function () {
            // get an array of the Power Stations
            iSolarCloudAPI.getPowerStations()
                .then(function (powerStations) {
                // loop through each Power Station
                powerStations.forEach((function (powerStation) {
                    // Generate service uuid
                    var uuid = hap.uuid.generate(powerStation.id);
                    // Check if Power Station is already loaded from cache
                    if (_this.accessories[uuid]) {
                        _this.log.debug('Configuring cached Power Station');
                        // Setup Irrigation Accessory and Irrigation Service
                        var powerStationAccessory = _this.accessories[uuid];
                        //powerStationAccessory.context.powerStation = powerStation;
                        //this.api.updatePlatformAccessories([powerStationAccessory]);
                        _this.configureLightSensor(powerStationAccessory.getService(hap.Service.LightSensor), powerStation);
                    }
                    else {
                        _this.log.info('Creating and configuring new Power Station', powerStation.name);
                        // Create Power Station Accessory and Irrigation Service
                        var powerStationAccessory = new _this.api.platformAccessory(powerStation.name, uuid);
                        //powerStationAccessory.context.powerStation = powerStation;
                        var lightSensorService = _this.createPowerStationAccessory(powerStationAccessory);
                        _this.configureLightSensor(lightSensorService, powerStation);
                        // Register platform accessory
                        _this.log.debug('Registering platform accessory');
                        _this.api.registerPlatformAccessories(PluginName, PlatformName, [powerStationAccessory]);
                        _this.accessories[uuid] = powerStationAccessory;
                    }
                }));
            });
        });
    };
    PlatformISolarCloud.prototype.configureAccessory = function (accessory) {
        // Added cached devices to the accessories arrary
        this.log.info('Remembered accessory, configuring handlers', accessory.displayName);
        this.accessories[accessory.UUID] = accessory;
    };
    PlatformISolarCloud.prototype.createPowerStationAccessory = function (powerStationAccessory) {
        this.log.debug('Create Power Station Accessory', powerStationAccessory.context.powerstation.id);
        // Create AccessoryInformation Service
        powerStationAccessory.getService(hap.Service.AccessoryInformation)
            .setCharacteristic(hap.Characteristic.Name, powerStationAccessory.context.powerStation.name)
            .setCharacteristic(hap.Characteristic.Manufacturer, "iSolarCloud")
            .setCharacteristic(hap.Characteristic.SerialNumber, powerStationAccessory.context.powerStation.id)
            .setCharacteristic(hap.Characteristic.Model, powerStationAccessory.context.powerStation.hardware_version)
            .setCharacteristic(hap.Characteristic.FirmwareRevision, powerStationAccessory.context.powerStation.firmware_version);
        // Create new Power Station Accessory
        var lightSensorService = powerStationAccessory.addService(hap.Service.LightSensor, powerStationAccessory.context.powerStation.name)
            .setCharacteristic(hap.Characteristic.CurrentAmbientLightLevel, 1);
        return lightSensorService;
    };
    PlatformISolarCloud.prototype.configureLightSensor = function (lightSensor, powerStation) {
        var _this = this;
        this.log.debug('Configure Power Station', lightSensor.getCharacteristic(hap.Characteristic.Name).value);
        // Configure powerStationAccessory
        lightSensor
            .getCharacteristic(hap.Characteristic.CurrentAmbientLightLevel)
            .onGet(function () {
            return powerStation.getCurrentPower()
                .then(function (currentPower) {
                currentPower = Math.max(currentPower, 1);
                lightSensor.getCharacteristic(hap.Characteristic.CurrentAmbientLightLevel).updateValue(currentPower);
                _this.log.info("Current Power =", currentPower);
                return currentPower;
            });
        });
    };
    ;
    return PlatformISolarCloud;
}());
module.exports = function (api) {
    hap = api.hap;
    api.registerPlatform(PluginName, PlatformName, PlatformISolarCloud);
};
//# sourceMappingURL=platform.js.map