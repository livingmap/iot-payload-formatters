let PayloadFormatter = {

    messaging: {

        manufacturer: "MOKOsmart",
        model: "LW001-BG PRO",

        payloadType: [ // index+1 relate to port numbers, hence the unused 9/10 indexed (port 10/11)
            "01~ Heartbeat",             // Port 1
            "02~ Location Fixed",        // Port 2
            "03~ Location Failure",      // Port 3
            "04~ Shutdown",              // Port 4
            "05~ Shock Detection",       // Port 5
            "06~ Man Down Detection",    // Port 6
            "07~ Tamper Detection",      // Port 7
            "08~ Action Event",        // Port 8
            "09~ Battery Consumption",   // Port 9
            "10~", // unused             // Port 10
            "11~", // unused             // Port 11
            "12~ GPS Limit"              // Port 12
        ],

        operationMode: [
            "1~ Standby Mode",
            "2~ Periodic Mode",
            "3~ Timing Mode",
            "4~ Motion Mode"
        ],

        rebootReason: [
            "0~ Power Failure",
            "1~ Bluetooth Request",
            "2~ LoRaWAN Request",
            "3~ Normal Power On"
        ],

        positioningRequestType: [
            "0~ By Operating Mode",
            "1~ Downlink For Position Command"
        ],

        positioningMethod: [
            "0~ Wi-Fi Positioning",
            "1~ Bluetooth Positioning",
            "2~ GPS Positioning"
        ],

        positioningFailedReason: [
            "10~ Wi-Fi Positioning Report Interval Too Short",
            "11~ Wi-Fi Positioning Timeout",
            "12~ Wi-Fi Positioning Module Fault",

            "20~ Bluetooth Positioning Report Interval Too Short",
            "21~ Bluetooth Positioning Timeout",
            "22~ Bluetooth Broadcasting in Progress",

            "30~ GPS Position Time Budget Exceeded",
            "31~ GPS Positioning Timeout (Coarse)",
            "32~ GPS Positioning Timeout (Fine)",
            "33~ GPS Positioning Report Interval Too Short",
            "34~ GPS Positioning Aiding Timeout",
            "35~ GPS Positioning Timeout (Poor Signal)",

            "40~ Interrupted by Downlink for Position",
            "41~ Interrupted by Movement (Ended Too Quickly)",
            "42~ Interrupted by Movement (Restarted Too Quickly)"
        ],

        shutdownType: [
            "0~ Bluetooth Command",
            "1~ LoRaWAN Command",
            "2~ Magnetic Switch"
        ],

        eventType: [
            "0~ Movement Started",
            "1~ Movement In Progress",
            "2~ Movement Ended",
            "3~ Downlink Command"
        ],

        batteryLevel: [
            "0~ Normal",
            "1~ Low Battery"
        ],

        manDownStatus: [
            "0~ Not Triggered",
            "1~ Man Down Detected"
        ],

        movementSinceLastPayload: [
            "0~ No Movement",
            "1~ Movement Detected"
        ],

        shockDetector: [
            "0~ Not Triggered",
            "1~ Shock Detected"
        ],

        tamperAlarm: [
            "0~ Not Triggered",
            "1~ Tamper Detected"
        ]
    },

    _bytesToHexString: function(bytes, start=0, length=null) {

        if (length === null)
            length = bytes.length - start;

        var char = [];
        for (let i = 0; i < length; i++) {
            let data = bytes[start + i].toString(16);
            let dataHexStr = ("0x" + data) < 0x10 ? ("0" + data) : data;
            char.push(dataHexStr);
        }
        return char.join("");
    },

    _bytesToInt: function(bytes, start, len) {
        let value = 0;
        for (let i = 0; i < len; i++) {
            let m = ((len - 1) - i) * 8;
            value = value | bytes[start + i] << m;
        }
        return value;
    },

    _hexToBytes: function(hex) {
        var length = hex.length;
        var bytes = [];
        for (var i = 0; i < length; i += 2) {
            var start = i;
            var end = i + 2;
            var data = parseInt("0x" + hex.substring(start, end));
            bytes.push(data);
        }
        return bytes;
    },

    _substringBytes: function(bytes, start, len) {
        let char = [];
        for (let i = 0; i < len; i++) {
            char.push("0x" + bytes[start + i].toString(16) < 0X10 ? ("0" + bytes[start + i].toString(16)) : bytes[start + i].toString(16));
        }
        return char.join("");
    },

    _signedHexToInt: function (hexStr) {

        let twoStr = parseInt(hexStr, 16).toString(2);
        let bitNum = hexStr.length * 4;
        if (twoStr.length < bitNum) {
            while (twoStr.length < bitNum) {
                twoStr = "0" + twoStr;
            }
        }
        if (twoStr.substring(0, 1) === "0") {
            twoStr = parseInt(twoStr, 2);
            return twoStr;
        }

        let twoStr_unsign = "";
        twoStr = parseInt(twoStr, 2) - 1;
        twoStr = twoStr.toString(2);
        twoStr_unsign = twoStr.substring(1, bitNum);

        twoStr_unsign = twoStr_unsign.replace(/0/g, "z");
        twoStr_unsign = twoStr_unsign.replace(/1/g, "0");
        twoStr_unsign = twoStr_unsign.replace(/z/g, "1");
        twoStr = parseInt(-twoStr_unsign, 2);

        return twoStr;
    },

    _timezoneDecode: function(tz) {
        let tz_str = "";
        tz = tz > 128 ? tz - 256 : tz;

        if (tz < 0) {
            tz_str += "-";
            tz = -tz;
        } else {
            tz_str += "+";
        }

        if (tz < 20)
            tz_str += "0";

        tz_str += String(parseInt(tz / 2));
        tz_str += ":";

        if (tz % 2)
            tz_str += "30";
        else
            tz_str += "00";

        return tz_str;
    },

    _parseTimeToDTString: function(timestamp, timezone) {

        timezone = timezone > 64 ? timezone - 128 : timezone;
        timestamp = timestamp + timezone * 3600;

        if (timestamp < 0)
            timestamp = 0;

        let d = new Date(timestamp * 1000);

        return d.getUTCFullYear()
            + "-" + this._doubleDigitNumber(d.getUTCMonth() + 1)
            + "-" + this._doubleDigitNumber(d.getUTCDate())
            + "T" + this._doubleDigitNumber(d.getUTCHours())
            + ":" + this._doubleDigitNumber(d.getUTCMinutes())
            + ":" + this._doubleDigitNumber(d.getUTCSeconds());
    },

    _convertToISO8601TimezoneOffset: function(offset) {
        // Convert the string to a number
        let num = parseFloat(offset);

        // Calculate the absolute hours and minutes
        let hours = Math.floor(Math.abs(num));
        let minutes = Math.round((Math.abs(num) - hours) * 60);

        // Format hours and minutes to be two digits
        let formattedHours = String(hours).padStart(2, '0');
        let formattedMinutes = String(minutes).padStart(2, '0');

        // Determine the sign (either "+" or "-")
        let sign = num >= 0 ? "+" : "-";

        // Return the formatted timezone offset
        return `${sign}${formattedHours}:${formattedMinutes}`;
    },

    _doubleDigitNumber: function(number) {
        return number < 10 ? "0" + number : number;
    },


    /**
     * Primary function to be used by the ChirpStack.
     *
     * @param {Object} input - The input object.
     * @param {string} input.bytes - Byte array containing the uplink payload, e.g. [255, 230, 255, 0].
     * @param {string} input.fPort - Uplink fPort.
     * @param {string} input.variables - Object containing the configured device variables.
     *
     * @returns {Object} output - The output object, containing a "data" parameter of the decoded payload.
     */
    formatPayload: function(input) {

        let output = {
            data: {
                payload: {},
                device: {},
                sensors: {}
            }
        };

        let dataPort = parseInt(input.fPort);

        // Invalid ports
        if (dataPort === 0 || dataPort === 100)
            return output;

        output.data.payload.port = dataPort;
        output.data.payload.hexadecimal = this._bytesToHexString(input.bytes);
        output.data.payload.type = this.messaging.payloadType[(dataPort - 1)];

        let date = new Date();
        let timestamp = Math.trunc(date.getTime() / 1000);
        let offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));

        output.data.payload.timestamp = this._parseTimeToDTString(timestamp, offsetHours) + this._timezoneDecode((offsetHours * 2));
        output.data.device.manufacturer = this.messaging.manufacturer;
        output.data.device.model = this.messaging.model;


        /*
         * Common Payload Header
         */
        if (dataPort <= 10 || dataPort === 12)
        {
            output.data.device.operatingMode = this.messaging.operationMode[input.bytes[0] & 0x03];

            output.data.device.battery = {};
            output.data.device.battery.level = this.messaging.batteryLevel[(input.bytes[0] & 0x04) ? 1 : 0];

            output.data.sensors.tamper = {};
            output.data.sensors.tamper.status = this.messaging.tamperAlarm[(input.bytes[0] & 0x08) ? 1 : 0];

            output.data.sensors.manDown = {};
            output.data.sensors.manDown.status = this.messaging.manDownStatus[(input.bytes[0] & 0x10) ? 1 : 0];

            output.data.sensors.movement = {};
            output.data.sensors.movement.status = this.messaging.movementSinceLastPayload[(input.bytes[0] & 0x20) ? 1 : 0]

            output.data.sensors.shock = {};
            output.data.sensors.shock.status = this.messaging.shockDetector[(dataPort === 5 ? 1 : 0)]; //

            if(dataPort === 2 || dataPort === 3) {
                output.data.location = {};
                output.data.location.requestType = this.messaging.positioningRequestType[(input.bytes[0] & 0x40) ? 1 : 0]
            }

            if(dataPort === 12) {
                output.data.payload.frameCount = input.bytes[1] & 0x0f;
                output.data.device.battery.voltage = (22 + ((input.bytes[1] >> 4) & 0x0f)) / 10;
                // No temperature for port 12?
            }
            else {
                output.data.payload.frameCount = input.bytes[2] & 0x0f;
                output.data.device.battery.voltage = (22 + ((input.bytes[2] >> 4) & 0x0f)) / 10;

                output.data.sensors.temperature = {
                    environment: {
                        celsius: this._signedHexToInt(this._bytesToHexString(input.bytes, 1, 1))
                    }
                }
            }
        }


        switch(dataPort)
        {
            // Heartbeat Payload
            case 1 :
                output.data.device.rebootReason = this.messaging.rebootReason[this._bytesToInt(input.bytes, 3, 1)];
                output.data.device.firmwareVersion = "v"
                    + ((input.bytes[4] >> 6) & 0x03)
                    + "." + ((input.bytes[4] >> 4) & 0x03)
                    + "." + (input.bytes[4] & 0x0f);
                break;


            // Location Payload (Success)
            case 2 : {

                /*
                 * TODO: Need to test GPS for timed mode,
                 * TODO: Need to test Bluetooth all modes.
                 * TODO: Need to test Wi-Fi for all modes (except downlink).
                 */

                output.data.location.status = "SUCCESS";

                let parseLength = 3;

                let positioningMethodCode = parseInt(input.bytes[parseLength++]);
                output.data.location.method = this.messaging.positioningMethod[positioningMethodCode];

                let dt = [];
                dt['year'] = this._bytesToInt(input.bytes, parseLength, 2);
                parseLength += 2;

                dt['month'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['day'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['hour'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['minute'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['second'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['timezone'] = input.bytes[parseLength++];

                let dtString = (dt['year'] + "-" + dt['month'] + "-" + dt['day'] + "T" + dt['hour'] + ":" + dt['minute'] + ":" + dt['second']);

                output.data.location.timestamp = (dt['timezone'] > 0x80)
                    ? dtString + this._convertToISO8601TimezoneOffset((dt['timezone'] - 0x100))
                    : dtString + this._convertToISO8601TimezoneOffset(dt['timezone'])


                let dataLength = input.bytes[parseLength++];

                switch(positioningMethodCode)
                {
                    case 0 : // Wi-Fi Positioning
                    case 1 : // Bluetooth Positioning
                    {
                        let beacons = [];

                        for (let i = 0; i < (dataLength / 7); i++)
                        {
                            let beacon = {};
                            beacon.macAddress = this._substringBytes(input.bytes, parseLength, 6);
                            parseLength += 6;
                            beacon.rssiDbm = input.bytes[parseLength++] - 256;
                            beacons.push(beacon);
                        }

                        output.data.location.beacons = beacons;
                        break;
                    }
                    default : // GPS Positioning
                    {
                        let lat = this._bytesToInt(input.bytes, parseLength, 4);
                        parseLength += 4;
                        let lon = this._bytesToInt(input.bytes, parseLength, 4);

                        output.data.location.coordinates = {
                            latitude: (((lat > 0x80000000) ? lat - 0x100000000 : lat) / 10000000),
                            longitude: (((lon > 0x80000000) ? lon - 0x100000000 : lon) / 10000000)
                        };
                        parseLength += 4;
                        output.data.location.pdop = (input.bytes[parseLength] / 10);
                    }
                }

                break;
            }

            // Location Payload (Failure)
            case 3 : {

                /*
                 * TODO: Need to test Wi-Fi failure.
                 * TODO: Need to test Bluetooth failure.
                 */

                output.data.location = {};
                output.data.location.status = "FAILURE";

                let parseLength = 3;

                let positioningFailedCode = this._bytesToInt(input.bytes, parseLength++, 1);
                output.data.location.reason = this.messaging.positioningFailedReason[positioningFailedCode];

                let dataLength = input.bytes[parseLength++];
                if (positioningFailedCode <= 5) // Wi-Fi Positioning or Bluetooth Positioning
                {
                    let beacons = [];

                    if (dataLength) {
                        for (let i = 0; i < (dataLength / 7); i++) {
                            let beacon = {};
                            beacon.macAddress = this._substringBytes(input.bytes, parseLength, 6);
                            parseLength += 6;
                            beacon.rssi = input.bytes[parseLength++] - 256 + "dBm";
                            beacons.push(beacon);
                        }
                    }

                    output.data.location.beacons = beacons;
                    break;
                }
                else // GPS Positioning
                {
                    pdop = input.bytes[parseLength++];

                    if (pdop !== 0xff)
                        output.data.location.pdop = (pdop / 10);

                        // TODO incorporate these from the docs?
                        // C/N 0: Carrier over noise (dBm) for the strongest signal satellite seen.
                        // C/N 1: Carrier over noise (dBm) for the 2nd strongest signal satellite seen.
                        // C/N 2: Carrier over noise (dBm) for the 3rd strongest signal satellite seen.
                        // C/N 3: Carrier over noise (dBm) for the 4th strongest signal satellite seen.
                    // C/N encoder: Convert to decimal, the unit is dBm.

                    else
                        output.data.location.pdop = "Unknown";

                    output.data.location.gpsSatelliteCn =
                        input.bytes[parseLength]
                        + "-" + input.bytes[parseLength + 1]
                        + "-" + input.bytes[parseLength + 2]
                        + "-" + input.bytes[parseLength + 3];
                }
                break;
            }

            // Shutdown Payload
            case 4 :
                output.data.device.shutdownType = this.messaging.shutdownType[this._bytesToInt(input.bytes, 3, 1)];
                break;

            // Shock Detector Payload
            case 5 :
                output.data.sensors.shock.count = this._bytesToInt(input.bytes, 3, 2);
                break;

            // Man-Down Detector Payload
            case 6 :
                output.data.sensors.manDown.idleTime = this._bytesToInt(input.bytes, 3, 2);
                break;

            // Tamper Detector Payload
            case 7 : {
                let parseLength = 3;

                let dt = [];
                dt['year'] = this._bytesToInt(input.bytes, parseLength, 2);
                parseLength += 2;

                dt['month'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['day'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['hour'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['minute'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['second'] = this._doubleDigitNumber(input.bytes[parseLength++]);
                dt['timezone'] = input.bytes[parseLength++];

                let dtString = (dt['year'] + "-" + dt['month'] + "-" + dt['day'] + "T" + dt['hour'] + ":" + dt['minute'] + ":" + dt['second']);

                output.data.sensors.tamper.timestamp = (dt['timezone'] > 0x80)
                    ? dtString + this._convertToISO8601TimezoneOffset((dt['timezone'] - 0x100))
                    : dtString + this._convertToISO8601TimezoneOffset(dt['timezone'])

                break;
            }

            // Event Payload
            case 8 :
                output.data.device.eventType = this.messaging.eventType[this._bytesToInt(input.bytes, 3, 1)];
                break;

            // Battery Consumption Payload
            case 9 : {

                /*
                 * TODO: Cannot generate test data from device, so still need to test.
                 */

                let parseLength = 3;

                output.data.device.workingTime = {};

                output.data.device.workingTime.gps = this._bytesToInt(input.bytes, parseLength, 4);
                parseLength += 4;
                output.data.device.workingTime.wifi = this._bytesToInt(input.bytes, parseLength, 4);
                parseLength += 4;

                output.data.device.workingTime.bluetooth = {};
                output.data.device.workingTime.bluetooth.scan = this._bytesToInt(input.bytes, parseLength, 4);
                parseLength += 4;
                output.data.device.workingTime.bluetooth.broadcast = this._bytesToInt(input.bytes, parseLength, 4);
                parseLength += 4;

                output.data.device.workingTime.lora = this._bytesToInt(input.bytes, parseLength, 4);
                break;
            }


            case 10 : // unused port
                break;
            case 11 : // unused port
                break;


            // GPS Limit Payload
            case 12 : {
                output.data.location = {};
                output.data.location.status = "SUCCESS";
                output.data.location.positioningMethod = this.messaging.positioningMethod[2]; // 2 == GPS Positioning
                output.data.location.positioningRequestType = this.messaging.positioningRequestType[(input.bytes[0] & 0x40)];

                let parseLength = 2

                let lat = this._bytesToInt(input.bytes, parseLength, 4);
                parseLength += 4;
                let lon = this._bytesToInt(input.bytes, parseLength, 4);

                output.data.location.coordinates = {
                    latitude: (((lat > 0x80000000) ? lat - 0x100000000 : lat) / 10000000),
                    longitude: (((lon > 0x80000000) ? lon - 0x100000000 : lon) / 10000000)
                };

                parseLength += 4;
                output.data.location.pdop = (input.bytes[parseLength] / 10);
                break;
            }
        }

        return output;
    }
};



/**
 * Main function that decodes the uplink messages.
 *
 * @param {Object} input - The input object.
 * @param {string} input.bytes - Byte array containing the uplink payload, e.g. [255, 230, 255, 0].
 * @param {string} input.fPort - Uplink fPort.
 * @param {string} input.variables - Object containing the configured device variables.
 *
 * @returns {Object} output - The output object, containing a "data" parameter of the decoded payload.
 */
function decodeUplink(input) {
    return PayloadFormatter.formatPayload(input);
}


/**
 * CLI arguments to run the script on the CLI.
 */
const args = process.argv.slice(2);
const port = args[0];
const bytes = PayloadFormatter._hexToBytes(args[1]);

console.dir(
    decodeUplink({
        fPort: port,
        bytes: bytes
    }),
    { depth: null }
);