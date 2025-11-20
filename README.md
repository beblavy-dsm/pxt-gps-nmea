
# GPS NMEA MakeCode Extension (micro:bit v2, Python-compatible)

A MakeCode / PXT extension for parsing common NMEA GPS sentences on BBC micro:bit:

- `$GPRMC` / `$GNRMC` – time, date, position, speed, course
- `$GPGGA` / `$GNGGA` – fix info (position, quality)
- `$GPGSA` / `$GNGSA` – DOP and fix type
- `$GPGSV` / `$GNGSV` – satellites in view (count only)
- `$GPVTG` / `$GNVTG` – course and speed over ground

Tested with **MakeCode for micro:bit v2**, including **Python mode**.

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/beblavy-dsm/pxt-gps-nmea** and import

## Usage (Blocks / JavaScript)

Feed one full NMEA line (ending in `\r\n`) from your GPS via serial:

```ts
serial.redirect(SerialPin.P0, SerialPin.P1, BaudRate.BaudRate9600)

basic.forever(function () {
    let line = serial.readLine()
    GPS.parseSentence(line)

    if (GPS.isValid()) {
        serial.writeLine("Lat: " + GPS.latitudeDec())
        serial.writeLine("Lon: " + GPS.longitudeDec())
        serial.writeLine("Speed (kn): " + GPS.speedKn())
        serial.writeLine("Course: " + GPS.course())
        serial.writeLine("Sats: " + GPS.satellitesInView())
    }
})
```

## Usage (Python in MakeCode)

After adding the extension, you can use the same API from Python:

```python
serial.redirect(SerialPin.P0, SerialPin.P1, BaudRate.BAUD_RATE9600)

def loop():
    line = serial.read_line()
    GPS.parseSentence(line)
    if GPS.isValid():
        serial.write_line("Lat: " + str(GPS.latitudeDec()))
        serial.write_line("Lon: " + str(GPS.longitudeDec()))
        serial.write_line("Speed(kn): " + str(GPS.speedKn()))
        serial.write_line("Course: " + str(GPS.course()))

basic.forever(loop)
```

Function names and case are the same as in JavaScript.

## Exported API

- `GPS.parseSentence(text: string)` – parse a single NMEA line
- `GPS.latitudeDec()` – latitude (decimal degrees)
- `GPS.longitudeDec()` – longitude (decimal degrees)
- `GPS.utcTime()` – UTC time (`hhmmss.sss`)
- `GPS.utcDate()` – UTC date (`ddmmyy`)
- `GPS.speedKn()` – speed in knots
- `GPS.course()` – course over ground (degrees)
- `GPS.isValid()` – `true` if a valid fix
- `GPS.gsaFixType()` – 0/1 = no fix, 2 = 2D, 3 = 3D
- `GPS.gsaPDOP()`, `GPS.gsaHDOP()`, `GPS.gsaVDOP()`
- `GPS.satellitesInView()` – number of satellites in view
- `GPS.lastRawSentence()` – last parsed NMEA sentence

#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
