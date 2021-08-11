"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.ISolarCloudPowerStationsAPI = exports.ISolarCloudAPI = void 0;
var bent_1 = __importDefault(require("bent"));
var endpoint = 'https://gateway.isolarcloud.com.hk/v1';
var ISolarCloudAPI = /** @class */ (function () {
    function ISolarCloudAPI(log, email, password) {
        this.log = log;
        this.email = email;
        this.password = password;
        this.userid = "";
        this.token = "";
    }
    ISolarCloudAPI.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var postJSON, login, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        postJSON = bent_1["default"]('POST', 'json');
                        return [4 /*yield*/, postJSON(endpoint + "/userService/login", {
                                "user_account": this.email,
                                "user_password": this.password,
                                "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                                "sys_code": "900"
                            })];
                    case 1:
                        login = _a.sent();
                        this.log.debug(login);
                        this.token = login['result_data']['token'];
                        this.userid = login['result_data']['user_id'];
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.log.error(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ISolarCloudAPI.prototype.getPowerStations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var powerStations, postJSON, getPsList, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        powerStations = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        postJSON = bent_1["default"]('POST', 'json');
                        return [4 /*yield*/, postJSON(endpoint + "/powerStationService/getPsList", {
                                "user_id": this.userid,
                                "valid_flag": "1,3",
                                "lang": "_en_US",
                                "token": this.token,
                                "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                                "sys_code": "900"
                            })];
                    case 2:
                        getPsList = _a.sent();
                        this.log.debug(getPsList);
                        // Loop through list of Power Stations
                        getPsList['result_data']['pageList'].forEach(function (pageList) {
                            // Create the device
                            var powerStation = new ISolarCloudPowerStationsAPI(_this.log, _this.token, pageList['ps_id'].toString(), pageList['ps_name'], "", "", pageList['ps_status']);
                            powerStations.push(powerStation);
                        });
                        return [2 /*return*/, powerStations];
                    case 3:
                        error_2 = _a.sent();
                        this.log.error(error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return ISolarCloudAPI;
}());
exports.ISolarCloudAPI = ISolarCloudAPI;
var ISolarCloudPowerStationsAPI = /** @class */ (function () {
    function ISolarCloudPowerStationsAPI(log, token, id, name, hardware_version, firmware_version, is_connected) {
        this.log = log;
        this.token = token;
        this.id = id;
        this.name = name;
        this.hardware_version = hardware_version;
        this.firmware_version = firmware_version;
        this.is_connected = is_connected;
    }
    ISolarCloudPowerStationsAPI.prototype.getCurrentPower = function () {
        return __awaiter(this, void 0, void 0, function () {
            var getJSON, response, currentPowerValue, currentPowerUnit, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        getJSON = bent_1["default"]('POST', 'json');
                        return [4 /*yield*/, getJSON(endpoint + "/powerStationService/getPsDetail", {
                                "ps_id": this.id,
                                "lang": "_en_US",
                                "token": this.token,
                                "appkey": "93D72E60331ABDCDC7B39ADC2D1F32B3",
                                "sys_code": "900"
                            })];
                    case 1:
                        response = _a.sent();
                        currentPowerValue = parseFloat(response['result_data']['curr_power']['value']);
                        if (isNaN(currentPowerValue))
                            currentPowerValue = 0;
                        currentPowerUnit = response['result_data']['curr_power']['unit'];
                        // let designCapacityValue = parseFloat(response['result_data']['design_capacity']['value']);
                        // let designCapacityUnit = response['result_data']['design_capacity']['unit'];
                        if (currentPowerUnit == 'kW')
                            currentPowerValue = currentPowerValue * 1000;
                        // if (designCapacityUnit == 'kWp') designCapacityValue = designCapacityValue * 1000;
                        //let currentPowerLevel = Math.round(currentPowerValue / designCapacityValue * 100);
                        return [2 /*return*/, currentPowerValue];
                    case 2:
                        error_3 = _a.sent();
                        this.log.error(error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ISolarCloudPowerStationsAPI;
}());
exports.ISolarCloudPowerStationsAPI = ISolarCloudPowerStationsAPI;
//# sourceMappingURL=isolarcloudapi.js.map