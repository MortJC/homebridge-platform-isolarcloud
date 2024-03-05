import { Logger } from "homebridge";

import * as CryptoJS from 'crypto-js'
import NodeRSA from "node-rsa";

const PUBLIC_KEY = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCkecphb6vgsBx4LJknKKes-eyj7-RKQ3fikF5B67EObZ3t4moFZyMGuuJPiadYdaxvRqtxyblIlVM7omAasROtKRhtgKwwRxo2a6878qBhTgUVlsqugpI_7ZC9RmO2Rpmr8WzDeAapGANfHN5bVr7G7GYGwIrjvyxMrAVit_oM4wIDAQAB"
const APP_KEY = "B0455FBE7AA0328DB57B59AA729F05D8";
const ACCESS_KEY = "9grzgbmxdsp3arfmmgq347xjbza4ysps"


export function randomKey() {
  return "and" + 'q1w2e3r4t5y67'; //randomString(13);
}


export function encryptAES<T>(data: T, key: string): string {
  const d = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
  const k = CryptoJS.enc.Utf8.parse(key);
  return CryptoJS.AES.encrypt(d, k, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
    .ciphertext.toString()
    .toUpperCase();
}


export function decryptAES<T>(data: string, key: string): T {
  const d = CryptoJS.format.Hex.parse(data);
  const k = CryptoJS.enc.Utf8.parse(key);
  const dec = CryptoJS.AES.decrypt(d, k, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return JSON.parse(CryptoJS.enc.Utf8.stringify(dec)) as T;
}


export function encryptRSA(value: string, publicKey: string): string {
    const key = new NodeRSA();
    key.setOptions({ encryptionScheme: "pkcs1" });
    key.importKey(publicKey, "pkcs8-public-pem");
    return key.encrypt(value, "base64");
}


export function generateRandomWord(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


export async function api(url: string, body: any, userid: string): Promise<any> {

    let randomKey = 'web' + generateRandomWord(13);

    let headers = new Headers();
    headers.append("content-type", "application/json;charset=UTF-8");
    headers.append("sys_code", "200");
    headers.append("x-access-key", ACCESS_KEY);
    headers.append("x-random-secret-key", encryptRSA(randomKey, PUBLIC_KEY));    
    headers.append("x-limit-obj", encryptRSA(userid, PUBLIC_KEY));

    let encryptedBody = encryptAES(body, randomKey);

    let requestOptions = {
        method: "POST",
        headers: headers,
        body: encryptedBody
        };

    let response = await fetch(url, requestOptions);

    if (response.body) {
        let reader = response.body.getReader();
        let decoder = new TextDecoder('utf-8');
        let result = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, {stream: true});
        }

        return decryptAES(result, randomKey);
    }

}


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
        this.server = server;
        switch (this.server) {
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
                this.endpoint = 'https://gateway.isolarcloud.com.hk'
        }
        this.userid = "";
        this.token = "";
    }


    async login() {

        // Login
        try {
            let body =
                {
                    "appkey": APP_KEY,
                    "api_key_param": {'timestamp': Date.now(), 'nonce': generateRandomWord(32)},
                    "user_account": this.email,
                    "user_password": this.password
                };

            let response: any = await api(this.endpoint + "/v1/userService/login", body, this.userid);

            this.log.debug('login respose = ' + response);

            this.token = response['result_data']['token'];
            this.userid = response['result_data']['user_id'];
        } catch (error: any) {
            this.log.error(error);
        }        
    }


    async getPowerStations(): Promise<ISolarCloudPowerStationsAPI[]> {
        let powerStations: ISolarCloudPowerStationsAPI[] = [];

        // Get the device details
        try {

            let body =
                {
                    "appkey": APP_KEY,
                    "api_key_param": {'timestamp': Date.now(), 'nonce': generateRandomWord(32)},                    
                    "user_id": this.userid,
                    "valid_flag": "1,3",
                    "lang": "_en_US",
                    "token": this.token
                };

            let response: any = await api(this.endpoint + "/v1/powerStationService/getPsList", body, this.userid);

            this.log.debug('getPsList response = ' + response);

            // Loop through list of Power Stations
            response['result_data']['pageList'].forEach((pageList: any) => {
                // Create the device
                this.log.debug(pageList);
                let powerStation = new ISolarCloudPowerStationsAPI(this.log, this.endpoint, this.userid, this.token, pageList['ps_id'].toString(), pageList['ps_name'], "Unknown", "Unknown", pageList['ps_status']);
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
    private readonly userid: string;    
    private readonly token: string;
    public readonly id: string;
    public readonly name: string;
    public readonly hardware_version: string;
    public readonly firmware_version: string;
    public readonly is_connected: boolean;


    constructor(log: Logger, endpoint: string,  userid: string, token: string, id: string, name: string, hardware_version: string, firmware_version: string, is_connected: boolean) {
        this.log = log;
        this.endpoint = endpoint;
        this.userid = userid;
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

            let body =
                {
                    "appkey": APP_KEY,
                    "api_key_param": {'timestamp': Date.now(), 'nonce': generateRandomWord(32)},                    
                    "ps_id": this.id,
                    "valid_flag": "1,3",
                    "lang": "_en_US",
                    "token": this.token
                };

            let response: any = await api(this.endpoint + "/v1/powerStationService/getPsDetail", body, this.userid);

            this.log.debug('getPsDetail response = ' + response);      

            let currentPowerValue = parseFloat(response['result_data']['curr_power']['value']);
            if (isNaN(currentPowerValue)) currentPowerValue = 0;
            let currentPowerUnit = response['result_data']['curr_power']['unit'];
            if (currentPowerUnit == 'kW') currentPowerValue = currentPowerValue * 1000;
            return currentPowerValue;
        } catch (error: any) {
            this.log.error(error);
            throw error;
        }
    }


}