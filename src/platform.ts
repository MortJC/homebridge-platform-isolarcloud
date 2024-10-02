import {
  API,
  HAP,
  PlatformAccessory,
  PlatformConfig,
  Logger,
  Service
} from "homebridge";

const PluginName = 'homebridge-platform-isolarcloud';
const PlatformName = 'ISolarCloud';

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerPlatform(PluginName, PlatformName, PlatformISolarCloud);
};

import { ISolarCloudAPI, ISolarCloudPowerStationsAPI } from './isolarcloudapi';

class PlatformISolarCloud {
  private readonly server: string = "";
  private readonly email: string = "";
  private readonly password: string = "";
  private accessories: { [uuid: string]: PlatformAccessory } = {};
  private currentPower: number = 1;

  constructor(public readonly log: Logger, public readonly config: PlatformConfig, public readonly api: API) {
    if (!config || !config["email"] || !config["password"]) {
      this.log.error("Platform config incorrect or missing. Check the config.json file.");
    }
    else {
      this.server = config["server"];
      this.email = config["email"];
      this.password = config["password"];

      this.log.info('Starting PlatformISolarCloud using homebridge API', api.version);
      if (api) {

        // save the api for use later
        this.api = api;

        // if finished loading cache accessories
        this.api.on("didFinishLaunching", () => {

          // Load the Power Stations
          this.loadPowerStations();
        });
      }
    }
  }


  loadPowerStations() {
    this.log.debug("Load the Power Stations");

    // login to the API and get the token
    let iSolarCloudAPI: ISolarCloudAPI = new ISolarCloudAPI(this.log, this.server, this.email, this.password);

    // get an array of the Power Stations
    iSolarCloudAPI.getPowerStations()
      .then((powerStations: ISolarCloudPowerStationsAPI[]) => {

        // loop through each Power Station
        powerStations.forEach(((powerStation: ISolarCloudPowerStationsAPI) => {

          // Generate service uuid
          const uuid = hap.uuid.generate(powerStation.id);

          // Check if Power Station is already loaded from cache
          if (this.accessories[uuid]) {
            this.log.info('Configuring cached Power Station');

            // Setup Irrigation Accessory and Irrigation Service
            let powerStationAccessory = this.accessories[uuid];
            this.configureLightSensor(powerStationAccessory.getService(hap.Service.LightSensor)!, powerStation);

          }
          else {
            this.log.info('Creating and configuring new Power Station', powerStation.name);

            // Create Power Station Accessory and Irrigation Service
            let powerStationAccessory = new this.api.platformAccessory(powerStation.name, uuid);
            let lightSensorService = this.createLightSensorService(powerStationAccessory, powerStation);
            this.configureLightSensor(lightSensorService, powerStation);

            // Register platform accessory
            this.log.debug('Registering platform accessory');
            this.api.registerPlatformAccessories(PluginName, PlatformName, [powerStationAccessory]);
            this.accessories[uuid] = powerStationAccessory;
          }
        }));
      })
      .catch(error => this.log.error('Powerstations error ' + error));

    }


  configureAccessory(accessory: PlatformAccessory) {
    // Added cached devices to the accessories arrary
    this.log.info('Remembered accessory, configuring handlers', accessory.displayName);
    this.accessories[accessory.UUID] = accessory;
  }


  createLightSensorService(powerStationAccessory: PlatformAccessory, powerStation: ISolarCloudPowerStationsAPI) {
    this.log.debug('Create Power Station Accessory, id = ', powerStation.id, ', name = ', powerStation.name);

    // Create AccessoryInformation Service
    powerStationAccessory.getService(hap.Service.AccessoryInformation)!
      .setCharacteristic(hap.Characteristic.Name, powerStation.id)
      .setCharacteristic(hap.Characteristic.Manufacturer, "iSolarCloud")
      .setCharacteristic(hap.Characteristic.SerialNumber, powerStation.id)
      .setCharacteristic(hap.Characteristic.Model, powerStation.hardware_version)
      .setCharacteristic(hap.Characteristic.FirmwareRevision, powerStation.firmware_version);

    // Create new Power Station Accessory
    let lightSensorService = powerStationAccessory.addService(hap.Service.LightSensor, powerStation.name)
      .setCharacteristic(hap.Characteristic.CurrentAmbientLightLevel, 1);

    return lightSensorService;
  }


  configureLightSensor(lightSensor: Service, powerStation: ISolarCloudPowerStationsAPI) {
    this.log.debug('Configure Power Station', lightSensor.getCharacteristic(hap.Characteristic.Name).value)

    // Configure powerStationAccessory
    lightSensor
      .getCharacteristic(hap.Characteristic.CurrentAmbientLightLevel)
      .onGet(() => {
        powerStation.getCurrentPower()
          .then((currentPower: number) => {
            this.currentPower = Math.max(currentPower, 1);
            this.log.info("Current Power =", this.currentPower);
            lightSensor.getCharacteristic(hap.Characteristic.CurrentAmbientLightLevel).updateValue(this.currentPower);
          })
          .catch(error => this.log.error('CurrentPower error ' + error));
        return this.currentPower;
      })
  };


}