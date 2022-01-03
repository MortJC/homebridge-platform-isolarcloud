import { Logger } from "homebridge";

import bent from 'bent';

export class ISolarCloudAPI {

    private readonly log: Logger;
    private readonly server: string;
    private readonly email: string;
    private readonly password: string;
    private endpoint: string;
    private token: string;
    private userid: string;

    constructor(log: Logger, server: string, email: string, password: string) {
        this.log = log;
        this.server = server;
        this.email = email;
        this.password = password;
        switch (server) {
            case 'Australian':
                this.endpoint = 'https://augateway.isolarcloud.com'
                break;
            case 'European':
                this.endpoint = 'https://gateway.isolarcloud.eu'
                break;
            case 'Chinese':
                this.endpoint = 'https://gateway.isolarcloud.com'
                break;
            default:
                this.endpoint = 'https:/gateway.isolarcloud.com.hk'
            } 
        this.userid = ""
        this.token = "";
    }

    
    async login() {
        // log us in
        try {
            const postJSON = bent('POST', 'json');
            let login = await postJSON(this.endpoint + "/v1/userService/login",
                {
                    "user_account": this.email,
                    "user_password": this.password,
                    "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                    "sys_code": "900"
                });
            this.log.debug(login);
            this.token = login['result_data']['token'];
            this.userid = login['result_data']['user_id'];
        } catch (error: any)
        {
            this.log.error(error);
        }
    }


    async getPowerStations(): Promise<ISolarCloudPowerStationsAPI[]> {
        let powerStations: ISolarCloudPowerStationsAPI[] = [];

        // Get the device details
        try {
            const postJSON = bent('POST', 'json');
            let getPsList = await postJSON(this.endpoint + "/v1/powerStationService/getPsList",
                {
                    "user_id": this.userid,
                    "valid_flag": "1,3",
                    "lang": "_en_US",
                    "token": this.token,
                    "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                    "sys_code": "900"
                });
            this.log.debug(getPsList);

            // Loop through list of Power Stations
            getPsList['result_data']['pageList'].forEach((pageList: any) => {
                // Create the device
                this.log.debug(pageList);
                let powerStation = new ISolarCloudPowerStationsAPI(this.log, this.endpoint, this.token, pageList['ps_id'].toString(), pageList['ps_name'], "Unknown", "Unknown", pageList['ps_status']);
                powerStations.push(powerStation);
            });
            return powerStations;
        } catch (error: any) {
            this.log.error(error);
            throw error;
        }
    }

}


export class ISolarCloudPowerStationsAPI {
    private readonly endpoint: string;
    private readonly log: Logger;
    private readonly token: string;
    public readonly id: string;
    public readonly name: string;
    public readonly hardware_version: string;
    public readonly firmware_version: string;
    public readonly is_connected: boolean;


    constructor(log: Logger, endpoint: string, token: string, id: string, name: string, hardware_version: string, firmware_version: string, is_connected: boolean) {
        this.log = log;
        this.endpoint = endpoint;
        this.token = token;
        this.id = id;
        this.name = name;
        this.hardware_version = hardware_version;
        this.firmware_version = firmware_version;
        this.is_connected = is_connected;
    }


    async getCurrentPower(): Promise<number> {

        // Get the Power Station details
        try {
            const getJSON = bent('POST', 'json');
            let response = await getJSON(this.endpoint + "/v1/powerStationService/getPsDetail",
                {
                    "ps_id": this.id,
                    "lang": "_en_US",
                    "token": this.token,
                    "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                    "sys_code": "900"
                });

            let currentPowerValue = parseFloat(response['result_data']['curr_power']['value']);
            if (isNaN(currentPowerValue)) currentPowerValue = 0;
            let currentPowerUnit = response['result_data']['curr_power']['unit'];
            // let designCapacityValue = parseFloat(response['result_data']['design_capacity']['value']);
            // let designCapacityUnit = response['result_data']['design_capacity']['unit'];
            if (currentPowerUnit == 'kW') currentPowerValue = currentPowerValue * 1000;
            // if (designCapacityUnit == 'kWp') designCapacityValue = designCapacityValue * 1000;
            //let currentPowerLevel = Math.round(currentPowerValue / designCapacityValue * 100);
            return currentPowerValue;
        } catch (error: any) {
            this.log.error(error);
            throw error;
        }
    }

}