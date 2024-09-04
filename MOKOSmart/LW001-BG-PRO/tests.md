# Real-world Example Test Data


## Port 3

### Payload Type

```
[P#20] Location Failure
```

### Payload Data
```
IRzRCQX/HBsZEg==
```

### MOKOsmart Generic Formatter

https://github.com/LoRaWAN-Product-Decoder/MOKOSMART-LoRaWAN-Product-Decoder/blob/main/LW001-BG%20PRO/LW001-BG%20PRO%20on%20chirpstack_v4.js

```
"object": {
    "tamper_alarm_code": 0,
    "positioning_type": "Normal",
    "port": 3,
    "motion_state_since_last_paylaod": "Yes",
    "pdop": "unknow",
    "operation_mode": "Periodic mode",
    "hex_format_payload": "211cd10905ff1c1b1912",
    "timestamp": 1724175796,
    "timezone": "UTC+00:00",
    "temperature": "28°C",
    "time": "2024-08-20 17:43:16",
    "battery_level": "Normal",
    "battery_voltage": "3.5V",
    "ack": 1,
    "gps_satellite_cn": "28-27-25-18",
    "mandown_status": "Not in idle",
    "payload_type": "Location Failure",
    "tamper_alarm": "Not triggered",
    "reasons_for_positioning_failure": "GPS positioning time is not enough (The location payload reporting interval is set too short, please increase the report interval of the current working mode via MKLoRa app)"
}
```