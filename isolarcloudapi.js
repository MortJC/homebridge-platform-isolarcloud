const bent = require('bent');

const endpoint = 'https://gateway.isolarcloud.com.hk/v1';

class ISolarCloudAPI {
    constructor(log, email, password) {
        this.log = log;
        this._email = email;
        this._password = password;
        this._token = null;
        this._userid = null
    }

    async getToken() {
        // log us in
        try {
            const postJSON = bent('POST', 'json');
            let login = await postJSON(endpoint + "/userService/login",
                {
                    "user_account": this._email,
                    "user_password": this._password
                },
                {
                    "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                    "sys_code": "900"
                });
            this.log.debug(login);
            this._token = login['result_data']['token'];
            this._userid = login['result_data']['user_id'];
        } catch (error) {
            this.log.error(error);
        }
    }

    async getPowerStations() {
        let powerStations = [];

        // Get the device details
        try {
            const postJSON = bent('POST', 'json');
            let getPsList = await postJSON(endpoint + "/powerStationService/getPsList",
                {
                    "user_id": this._userid,
                    "valid_flag": "1,3",
                    "lang": "_en_US"
                },
                {
                    "token": this._token,
                    "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                    "sys_code": "900"
                });

            // Loop through list of Power Stations
            getPsList['result_data']['pageList'].forEach(function (pageList) {
                this.log.debug(pageList);

                // Create the device
                let powerStation = new ISolarCloudPowerStationsAPI(this.log, this._token, pageList['ps_id'].toString(), pageList['ps_name'], "", "", pageList['ps_status']);
                powerStations.push(powerStation);
            }.bind(this));
            return powerStations;
        } catch (error) {
            this.log.error(error);
        }
    }

}


class ISolarCloudPowerStationsAPI {
    constructor(log, token, id, name, hardware_version, firmware_version, is_connected) {
        this.log = log;
        this._token = token;
        this._id = id;
        this._name = name;
        this._hardware_version = hardware_version;
        this._firmware_version = firmware_version;
        this._is_connected = is_connected;
    }

    async getCurrentPower() {

        // Get the Power Station details
        try {
            const getJSON = bent('POST', 'json');
            let response = await getJSON(endpoint + "/powerStationService/getPsDetail",
                {
                    "ps_id": this._id,
                    "lang": "_en_US"
                },
                {
                    "token": this._token,
                    "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                    "sys_code": "900"
                });

            let currentPowerValue = parseFloat(response['result_data']['curr_power']['value']);
            let currentPowerUnit = response['result_data']['curr_power']['unit'];
            // let designCapacityValue = parseFloat(response['result_data']['design_capacity']['value']);
            // let designCapacityUnit = response['result_data']['design_capacity']['unit'];
            if (currentPowerUnit == 'kW') currentPowerValue = currentPowerValue * 1000;
            // if (designCapacityUnit == 'kWp') designCapacityValue = designCapacityValue * 1000;

            //let currentPowerLevel = Math.round(currentPowerValue / designCapacityValue * 100);
            return currentPowerValue;
        } catch (error) {
            this.log.error(error);
        }
    }

}


module.exports = ISolarCloudAPI;