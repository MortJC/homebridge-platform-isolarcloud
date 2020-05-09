const ISolarCloudAPI = require('./isolarcloudapi.js');

class PlatformISolarCloud {


  constructor(log, config, api) {
    this.log = log;
    this.config = config;

    if (!config || !config["email"] || !config["password"]) {
      this.log.error("Platform config incorrect or missing. Check the config.json file.");
    }
    else {

      this.email = config["email"];
      this.password = config["password"];
      this.accessories = [];

      this.log('Starting PlatformISolarCloud using homebridge API', api.version);
      if (api) {

        // save the api for use later
        this.api = api;

        // if finished loading cache accessories
        this.api.on("didFinishLaunching", function () {

          // Fetch the Power Stations
          this._fetchPowerStations();

        }.bind(this));
      }
    }
  }


  _fetchPowerStations() {
    this.log.debug("Fetch the Power Stations");

    let iSolarCloudAPI = new ISolarCloudAPI(this.log, this.email, this.password);

    // login to the API and get the token
    iSolarCloudAPI.getToken()
      .then(function () {

        // get an array of the Power Stations
        iSolarCloudAPI.getPowerStations()
          .then(function (powerStations) {

            // loop through each Power Station
            powerStations.forEach(function (powerStation) {

              // Generate service uuid
              let uuid = UUIDGen.generate(powerStation._id);

              // Check if Power Station is already loaded from cache
              if (this.accessories[uuid]) {
                this.log.debug('Configuring cached Power Station');

                // Configure Power Station
                this._configurePowerStation(this.accessories[uuid].getService(Service.LightSensor), powerStation);
              }
              else {
                this.log.debug('Creating and configuring new Power Station');

                // Create and configure Power Station Accessory
                let powerStationAccessory = this._createPowerStationAccessory(uuid, powerStation);
                this._configurePowerStation(powerStationAccessory.getService(Service.LightSensor), powerStation);

                // Register platform accessory
                this.log.debug('Registering platform accessory');
                this.api.registerPlatformAccessories(ISolarCloudPluginName, ISolarCloudPlatformName, [powerStationAccessory]);
                this.accessories[uuid] = powerStationAccessory;
              }

            }.bind(this));
          }.bind(this));
      }.bind(this))
  }


  configureAccessory(accessory) {
    // Added cached devices to the accessories arrary
    this.log('Remembered accessory, configuring handlers', accessory.displayName);
    this.accessories[accessory.UUID] = accessory;
  }


  _createPowerStationAccessory(uuid, powerStation) {
    this.log.debug('Create Power Station Accessory', powerStation._id);

    // Create new Power Station Accessory
    let newPlatformAccessory = new PlatformAccessory(powerStation._name, uuid);
    newPlatformAccessory.addService(Service.LightSensor, powerStation._name);
    newPlatformAccessory.getService(Service.LightSensor)
      .setCharacteristic(Characteristic.CurrentAmbientLightLevel, 0);

    // Create AccessoryInformation Service
    newPlatformAccessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, powerStation._name)
      .setCharacteristic(Characteristic.Manufacturer, "iSolarCloud")
      .setCharacteristic(Characteristic.SerialNumber, powerStation._id)
      .setCharacteristic(Characteristic.Model, powerStation._hardware_version)
      .setCharacteristic(Characteristic.FirmwareRevision, powerStation._firmware_version);

    return newPlatformAccessory;
  }


  _configurePowerStation(powerStationAccessory, powerStation) {
    this.log.debug('Configure Power Station', powerStationAccessory.getCharacteristic(Characteristic.Name).value)

    // Configure powerStationAccessory
    powerStationAccessory
      .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
      .on('get', this._getLightSensorValue.bind(this, powerStationAccessory, powerStation, "CurrentAmbientLightLevel"));

  }


  _getLightSensorValue(powerStationAccessory, powerStation, characteristicName, callback) {

    this.log.debug("_getLightSensorValue", powerStationAccessory.getCharacteristic(Characteristic.Name).value, characteristicName);

    switch (characteristicName) {

      case "CurrentAmbientLightLevel":
        powerStation.getCurrentPower()
          .then(function (currentPower) {
            powerStationAccessory.getCharacteristic(Characteristic.CurrentAmbientLightLevel).updateValue(currentPower);
            this.log.info("Current Power =", currentPower);
            callback(null, currentPower);
          }.bind(this));
        break;
    }

  }

}

module.exports = PlatformISolarCloud;