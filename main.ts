/**
 * NMEA GPS parsing extension
 */
//% color=#0fbc11 icon="\uf279" block="GPS NMEA"
namespace GPS {
    let lastSentence = ""
    let latitude = 0
    let longitude = 0
    let timeUTC = ""
    let dateUTC = ""
    let speedKnots = 0
    let courseDeg = 0
    let valid = false

    // GSA fields
    let fixType = 0 // 1 = no fix, 2 = 2D, 3 = 3D
    let pdop = 0
    let hdop = 0
    let vdop = 0

    // GSV fields
    let satsInView = 0

    /**
     * Takes one line of NMEA string such as $GPRMC, $GPGGA, $GPGSA, $GPGSV, $GPVTG
     */
    //% block="parse NMEA sentence %data"
    export function parseSentence(data: string): void {
        if (!data) return
        // basic trim (in case \r\n)
        lastSentence = data
        if (lastSentence.length > 0 && lastSentence.charAt(lastSentence.length - 1) == '\n') {
            lastSentence = lastSentence.substr(0, lastSentence.length - 1)
        }
        if (lastSentence.length > 0 && lastSentence.charAt(lastSentence.length - 1) == '\r') {
            lastSentence = lastSentence.substr(0, lastSentence.length - 1)
        }

        if (startsWith(lastSentence, "$GPRMC") || startsWith(lastSentence, "$GNRMC")) {
            parseRMC(lastSentence)
        } else if (startsWith(lastSentence, "$GPGGA") || startsWith(lastSentence, "$GNGGA")) {
            parseGGA(lastSentence)
        } else if (startsWith(lastSentence, "$GPGSA") || startsWith(lastSentence, "$GNGSA")) {
            parseGSA(lastSentence)
        } else if (startsWith(lastSentence, "$GPGSV") || startsWith(lastSentence, "$GNGSV")) {
            parseGSV(lastSentence)
        } else if (startsWith(lastSentence, "$GPVTG") || startsWith(lastSentence, "$GNVTG")) {
            parseVTG(lastSentence)
        }
    }

    function startsWith(text: string, prefix: string): boolean {
        if (text.length < prefix.length) return false
        return text.substr(0, prefix.length) == prefix
    }

    function parseRMC(sentence: string) {
        // $GPRMC,hhmmss.sss,A,llll.ll,a,yyyyy.yy,a,speed,course,date,...
        let p = sentence.split(",")
        if (p.length < 10) return

        timeUTC = p[1]
        valid = p[2] == "A"  // A = valid, V = void

        latitude = convertNMEACoordinate(p[3], p[4])
        longitude = convertNMEACoordinate(p[5], p[6])

        speedKnots = parseFloatSafe(p[7])
        courseDeg = parseFloatSafe(p[8])
        dateUTC = p[9]
    }

    function parseGGA(sentence: string) {
        // $GPGGA,hhmmss,lat,N,lon,E,quality,...
        let p = sentence.split(",")
        if (p.length < 7) return

        timeUTC = p[1]
        latitude = convertNMEACoordinate(p[2], p[3])
        longitude = convertNMEACoordinate(p[4], p[5])

        // quality: 0 = invalid, >0 = fix
        let quality = parseIntSafe(p[6])
        valid = quality > 0
    }

    function parseGSA(sentence: string) {
        // $GPGSA,mode,fixType,sv1,sv2,...,PDOP,HDOP,VDOP
        let p = sentence.split(",")
        if (p.length < 17) return

        fixType = parseIntSafe(p[2])

        // Most common layout: PDOP = p[15], HDOP = p[16], VDOP = p[17] (may include checksum)
        pdop = parseFloatSafe(p[15])
        hdop = parseFloatSafe(stripChecksum(p[16]))
        if (p.length > 17) {
            vdop = parseFloatSafe(stripChecksum(p[17]))
        }
    }

    function parseGSV(sentence: string) {
        // $GPGSV,totalMsgs,msgNum,satsInView,...
        let p = sentence.split(",")
        if (p.length < 4) return

        satsInView = parseIntSafe(p[3])
    }

    function parseVTG(sentence: string) {
        // $GPVTG,course,T,,M,speedKnots,N,speedKmh,K*CS
        let p = sentence.split(",")
        if (p.length < 9) return

        courseDeg = parseFloatSafe(p[1])
        speedKnots = parseFloatSafe(p[5])
    }

    // Convert "ddmm.mmmm" or "dddmm.mmmm" + direction → decimal degrees
    function convertNMEACoordinate(value: string, dir: string): number {
        if (!value || value.length < 3) return 0

        let dot = value.indexOf(".")
        if (dot < 0) return 0

        // latitude usually 2 deg digits, longitude 3
        let degLen = dot == 4 ? 2 : 3 // e.g. 4807.038 -> 48, 01131.000 -> 011
        if (value.length <= degLen) return 0

        let degStr = value.substr(0, degLen)
        let minStr = value.substr(degLen)

        let deg = parseFloatSafe(degStr)
        let min = parseFloatSafe(minStr)

        let decimal = deg + (min / 60)

        if (dir == "S" || dir == "W") decimal = -decimal
        return decimal
    }

    function stripChecksum(s: string): string {
        if (!s) return ""
        let star = s.indexOf("*")
        if (star >= 0) return s.substr(0, star)
        return s
    }

    function parseFloatSafe(s: string): number {
        if (!s) return 0
        let r = parseFloat(s)
        if (isNaN(r)) return 0
        return r
    }

    function parseIntSafe(s: string): number {
        if (!s) return 0
        let r = parseInt(s)
        if (isNaN(r)) return 0
        return r
    }

    // GETTERS

    /**
     * Returns latitude in decimal degrees
     */
    //% block="latitude (deg)"
    export function latitudeDec(): number {
        return latitude
    }

    /**
     * Returns longitude in decimal degrees
     */
    //% block="longitude (deg)"
    export function longitudeDec(): number {
        return longitude
    }

    /**
     * Returns UTC time (hhmmss.sss)
     */
    //% block="UTC time"
    export function utcTime(): string {
        return timeUTC
    }

    /**
     * Returns UTC date (ddmmyy)
     */
    //% block="UTC date"
    export function utcDate(): string {
        return dateUTC
    }

    /**
     * Returns speed in knots
     */
    //% block="speed (knots)"
    export function speedKn(): number {
        return speedKnots
    }

    /**
     * Returns course over ground in degrees
     */
    //% block="course (deg)"
    export function course(): number {
        return courseDeg
    }

    /**
     * Returns true if GPS fix is valid
     */
    //% block="GPS fix valid"
    export function isValid(): boolean {
        return valid
    }

    /**
     * Returns fix type from GSA (0/1 = no fix, 2 = 2D, 3 = 3D)
     */
    //% block="fix type (GSA)"
    export function gsaFixType(): number {
        return fixType
    }

    /**
     * PDOP from GSA sentence
     */
    //% block="PDOP"
    export function gsaPDOP(): number {
        return pdop
    }

    /**
     * HDOP from GSA sentence
     */
    //% block="HDOP"
    export function gsaHDOP(): number {
        return hdop
    }

    /**
     * VDOP from GSA sentence
     */
    //% block="VDOP"
    export function gsaVDOP(): number {
        return vdop
    }

    /**
     * Satellites in view from GSV sentence
     */
    //% block="satellites in view"
    export function satellitesInView(): number {
        return satsInView
    }

    /**
     * Returns the last raw NMEA sentence that was parsed
     */
    //% block="last NMEA sentence"
    export function lastRawSentence(): string {
        return lastSentence
    }
}
