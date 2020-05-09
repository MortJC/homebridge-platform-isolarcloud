const PlatformISolarCloud = require('./platform');

module.exports = (homebridge) => {
  PlatformAccessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  ISolarCloudPluginName = 'homebridge-platform-isolarcloud';
  ISolarCloudPlatformName = 'ISolarCloud';
  homebridge.registerPlatform(ISolarCloudPluginName, ISolarCloudPlatformName, PlatformISolarCloud, true);
};