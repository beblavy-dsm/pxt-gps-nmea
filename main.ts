
/**
 * NMEA GPS parsing extension (Python-compatible)
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
     * Parse one NMEA sentence ($GPRMC, $GPGGA, $GPGSA, $GPGSV, $GPVTG...)
     */
    //% block="parse NMEA sentence %data"
    //% group="Parsing"
    export function parseSentence(data: string): void {
        if (!data) return

        // trim CR/LF manually (Python-friendly)
        let s = data
        let l = s.length
        while (l > 0 && (s.charAt(l - 1) == '\n' || s.charAt(l - 1) == '\r')) {
            s = s.substr(0, l - 1)
            l = s.length
        }
        lastSentence = s

        if (startsWith(s, "$GPRMC") || startsWith(s, "$GNRMC")) {
            parseRMC(s)
        } else if (startsWith(s, "$GPGGA") || startsWith(s, "$GNGGA")) {
            parseGGA(s)
        } else if (startsWith(s, "$GPGSA") || startsWith(s, "$GNGSA")) {
            parseGSA(s)
        } else if (startsWith(s, "$GPGSV") || startsWith(s, "$GNGSV")) {
            parseGSV(s)
        } else if (startsWith(s, "$GPVTG") || startsWith(s, "$GNVTG")) {
            parseVTG(s)
        }
    }

    function startsWith(text: string, prefix: string): boolean {
        if (!text) return false
        if (text.length < prefix.length) return false
        return text.substr(0, prefix.length) == prefix
    }

    function parseRMC(sentence: string): void {
        // $GPRMC,hhmmss.sss,A,llll.ll,a,yyyyy.yy,a,speed,course,date,...
        let p = sentence.split(",")
        if (p.length < 10) return

        timeUTC = p[1]
        valid = (p[2] == "A")  // A = valid, V = void

        latitude = convertNMEACoordinate(p[3], p[4])
        longitude = convertNMEACoordinate(p[5], p[6])

        speedKnots = parseFloatSafe(p[7])
        courseDeg = parseFloatSafe(p[8])
        dateUTC = p[9]
    }

    function parseGGA(sentence: string): void {
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

    function parseGSA(sentence: string): void {
        // $GPGSA,mode,fixType,sv1,sv2,...,PDOP,HDOP,VDOP
        let p = sentence.split(",")
        if (p.length < 17) return

        fixType = parseIntSafe(p[2])

        // PDOP = p[15], HDOP = p[16], VDOP = p[17] (VDOP may include checksum)
        pdop = parseFloatSafe(stripChecksum(p[15]))
        hdop = parseFloatSafe(stripChecksum(p[16]))
        if (p.length > 17) {
            vdop = parseFloatSafe(stripChecksum(p[17]))
        }
    }

    function parseGSV(sentence: string): void {
        // $GPGSV,totalMsgs,msgNum,satsInView,...
        let p = sentence.split(",")
        if (p.length < 4) return

        satsInView = parseIntSafe(p[3])
    }

    function parseVTG(sentence: string): void {
        // $GPVTG,course,T,,M,speedKnots,N,speedKmh,K*CS
        let p = sentence.split(",")
        if (p.length < 9) return

        courseDeg = parseFloatSafe(p[1])
        speedKnots = parseFloatSafe(p[5])
    }

    // Convert "ddmm.mmmm" or "dddmm.mmmm" + direction → decimal degrees
    function convertNMEACoordinate(value: string, dir: string): number {
        if (!value) return 0
        if (value.length < 3) return 0

        let dot = value.indexOf(".")
        if (dot < 0) return 0

        // latitude usually 2 deg digits, longitude 3
        let degLen = 2
        if (dot == 5) {
            // example: 12319.123
            degLen = 3
        }

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
        let r = +s
        // avoid isNaN (Python-unsafe); NaN is the only value not equal to itself
        if (r != r) return 0
        return r
    }

    function parseIntSafe(s: string): number {
        if (!s) return 0
        let r = parseInt(s)
        if (r != r) return 0
        return r
    }

    // GETTERS

    /**
     * Returns latitude in decimal degrees
     */
    //% block="latitude (deg)"
    //% group="Data"
    export function latitudeDec(): number {
        return latitude
    }

    /**
     * Returns longitude in decimal degrees
     */
    //% block="longitude (deg)"
    //% group="Data"
    export function longitudeDec(): number {
        return longitude
    }

    /**
     * Returns UTC time (hhmmss.sss)
     */
    //% block="UTC time"
    //% group="Data"
    export function utcTime(): string {
        return timeUTC
    }

    /**
     * Returns UTC date (ddmmyy)"
     */
    //% block="UTC date"
    //% group="Data"
    export function utcDate(): string {
        return dateUTC
    }

    /**
     * Returns speed in knots
     */
    //% block="speed (knots)"
    //% group="Data"
    export function speedKn(): number {
        return speedKnots
    }

    /**
     * Returns course over ground in degrees
     */
    //% block="course (deg)"
    //% group="Data"
    export function course(): number {
        return courseDeg
    }

    /**
     * Returns true if GPS fix is valid
     */
    //% block="GPS fix valid"
    //% group="Data"
    export function isValid(): boolean {
        return valid
    }

    /**
     * Returns fix type from GSA (0/1 = no fix, 2 = 2D, 3 = 3D)
     */
    //% block="fix type (GSA)"
    //% group="GSA"
    export function gsaFixType(): number {
        return fixType
    }

    /**
     * PDOP from GSA sentence
     */
    //% block="PDOP"
    //% group="GSA"
    export function gsaPDOP(): number {
        return pdop
    }

    /**
     * HDOP from GSA sentence
     */
    //% block="HDOP"
    //% group="GSA"
    export function gsaHDOP(): number {
        return hdop
    }

    /**
     * VDOP from GSA sentence
     */
    //% block="VDOP"
    //% group="GSA"
    export function gsaVDOP(): number {
        return vdop
    }

    /**
     * Satellites in view from GSV sentence
     */
    //% block="satellites in view"
    //% group="GSV"
    export function satellitesInView(): number {
        return satsInView
    }

    /**
     * Returns the last raw NMEA sentence that was parsed
     */
    //% block="last NMEA sentence"
    //% group="Parsing"
    export function lastRawSentence(): string {
        return lastSentence
    }
}
