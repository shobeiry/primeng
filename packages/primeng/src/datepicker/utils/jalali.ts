/*
@param year Jalali year (1 to 3100)
@param month Jalali month (0 to 11)
@param day Jalali day (1 to 29/31)
*/
export class JDate {
    year: number;
    month: number;
    day: number;

    constructor(year: number, month: number, day: number);
    constructor(date: Date);
    constructor(dateOrYear: Date | number, month?: number, day?: number) {
        if (dateOrYear instanceof Date) {
            const jDate = JalaliUtils.fromGregorian(dateOrYear);
            this.year = jDate.getYear();
            this.month = jDate.getMonth();
            this.day = jDate.getDay();
        } else {
            this.year = dateOrYear;
            this.month = month as never;
            this.day = day as never;
        }
    }

    public getYear(): number {
        return this.year;
    }

    public getFullYear(): number {
        return this.year;
    }

    public getMonth(): number {
        return this.month;
    }

    public getDay(): number {
        return this.day;
    }

    public getDate(): number {
        return this.day;
    }

    public toDate(): Date {
        return JalaliUtils.toGregorian(this);
    }
}

export class JalaliUtils {
    /**
     * Returns the equivalent JS date value for a give input Jalali date.
     * `jalaliDate` is an Jalali date to be converted to Gregorian.
     */
    public static toGregorian(jalaliDate: JDate): Date {
        const jdn = this.jalaliToJulian(jalaliDate.getYear(), jalaliDate.getMonth() + 1, jalaliDate.getDay());
        const date = this.julianToGregorian(jdn);
        date.setHours(6, 30, 3, 200);
        return date;
    }

    /**
     * Returns the equivalent jalali date value for a give input Gregorian date.
     * `gdate` is a JS Date to be converted to jalali.
     * utc to local
     */
    public static fromGregorian(date: Date): JDate {
        const g2d = this.gregorianToJulian(date.getFullYear(), date.getMonth() + 1, date.getDate());
        return this.julianToJalali(g2d);
    }

    public static setJalaliYear(date: JDate, yearValue: number): JDate {
        return new JDate(+yearValue, date.getMonth(), date.getDay());
    }

    public static setJalaliMonth(date: JDate, month: number): JDate {
        month = +month;
        const year = date.getYear() + Math.floor((month - 1) / 12);
        month = Math.floor((((month - 1) % 12) + 12) % 12) + 1;
        return new JDate(year, month - 1, date.getDay());
    }

    public static setJalaliDay(date: JDate, day: number): JDate {
        let mDays = this.getDaysPerMonth(date.getMonth(), date.getYear());
        if (day <= 0) {
            while (day <= 0) {
                date = this.setJalaliMonth(date, date.getMonth() - 1);
                mDays = this.getDaysPerMonth(date.getMonth(), date.getYear());
                day += mDays;
            }
        } else if (day > mDays) {
            while (day > mDays) {
                day -= mDays;
                date = this.setJalaliMonth(date, date.getMonth() + 1);
                mDays = this.getDaysPerMonth(date.getMonth(), date.getYear());
            }
        }
        date = new JDate(date.getYear(), date.getMonth(), day);
        return date;
    }

    static mod(a: number, b: number): number {
        return a - b * Math.floor(a / b);
    }

    static div(a: number, b: number): number {
        return Math.trunc(a / b);
    }

    /*
     This function determines if the Jalali (Persian) year is
     leap (366-day long) or is the common year (365 days), and
     finds the day in March (Gregorian calendar) of the first
     day of the Jalali year (jalaliYear).
     @param jalaliYear Jalali calendar year (-61 to 3177)
     @return
     leap: number of years since the last leap year (0 to 4)
     gYear: Gregorian year of the beginning of Jalali year
     march: the March day of Farvardin the 1st (1st day of jalaliYear)
     @see: http://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm
     @see: http://www.fourmilab.ch/documents/calendar/
     */
    static jalCal(jalaliYear: number): any {
        // Jalali years starting the 33-year rule.
        const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
        const breaksLength = breaks.length;
        const gYear = jalaliYear + 621;
        let leapJ = -14;
        let jp = breaks[0];

        if (jalaliYear < jp || jalaliYear >= breaks[breaksLength - 1]) {
            throw new Error('Invalid Jalali year ' + jalaliYear);
        }

        // Find the limiting years for the Jalali year jalaliYear.
        let jump;
        for (let i = 1; i < breaksLength; i += 1) {
            const jm = breaks[i];
            jump = jm - jp;
            if (jalaliYear < jm) {
                break;
            }
            leapJ = leapJ + this.div(jump, 33) * 8 + this.div(this.mod(jump, 33), 4);
            jp = jm;
        }
        let n = jalaliYear - jp;

        // Find the number of leap years from AD 621 to the beginning
        // of the current Jalali year in the Persian calendar.
        leapJ = leapJ + this.div(n, 33) * 8 + this.div(this.mod(n, 33) + 3, 4);
        if (this.mod(jump, 33) === 4 && jump - n === 4) {
            leapJ += 1;
        }

        // And the same in the Gregorian calendar (until the year gYear).
        const leapG = this.div(gYear, 4) - this.div((this.div(gYear, 100) + 1) * 3, 4) - 150;

        // Determine the Gregorian date of Farvardin the 1st.
        const march = 20 + leapJ - leapG;

        // Find how many years have passed since the last leap year.
        if (jump - n < 6) {
            n = n - jump + this.div(jump + 4, 33) * 33;
        }
        let leap = this.mod(this.mod(n + 1, 33) - 1, 4);
        if (leap === -1) {
            leap = 4;
        }

        return { leap, gy: gYear, march };
    }

    /*
     Calculates Gregorian and Julian calendar dates from the Julian Day number
     (jdn) for the period since jdn=-34839655 (i.e. the year -100100 of both
     calendars) to some millions years ahead of the present.
     @param jdn Julian Day number
     @return
     gYear: Calendar year (years BC numbered 0, -1, -2, ...)
     gMonth: Calendar month (1 to 12)
     gDay: Calendar day of the month M (1 to 28/29/30/31)
     */
    static julianToGregorian(julianDayNumber: number): Date {
        let j = 4 * julianDayNumber + 139361631;
        j = j + this.div(this.div(4 * julianDayNumber + 183187720, 146097) * 3, 4) * 4 - 3908;
        const i = this.div(this.mod(j, 1461), 4) * 5 + 308;
        const gDay = this.div(this.mod(i, 153), 5) + 1;
        const gMonth = this.mod(this.div(i, 153), 12) + 1;
        const gYear = this.div(j, 1461) - 100100 + this.div(8 - gMonth, 6);

        return new Date(gYear, gMonth - 1, gDay);
    }

    /*
     Converts a date of the Jalali calendar to the Julian Day number.
     @param jy Jalali year (1 to 3100)
     @param jm Jalali month (1 to 12)
     @param jd Jalali day (1 to 29/31)
     @return Julian Day number
     */
    static gregorianToJulian(gy: number, gm: number, gd: number): number {
        let d = this.div((gy + this.div(gm - 8, 6) + 100100) * 1461, 4) + this.div(153 * this.mod(gm + 9, 12) + 2, 5) + gd - 34840408;
        d = d - this.div(this.div(gy + 100100 + this.div(gm - 8, 6), 100) * 3, 4) + 752;
        return d;
    }

    /*
     Converts the Julian Day number to a date in the Jalali calendar.
     @param julianDayNumber Julian Day number
     @return
     jalaliYear: Jalali year (1 to 3100)
     jalaliMonth: Jalali month (1 to 12)
     jalaliDay: Jalali day (1 to 29/31)
     */
    static julianToJalali(julianDayNumber: number): JDate {
        const gy = this.julianToGregorian(julianDayNumber).getFullYear(); // Calculate Gregorian year (gy).
        let jalaliYear = gy - 621;
        const r = this.jalCal(jalaliYear);
        const gregorianDay = this.gregorianToJulian(gy, 3, r.march);
        let jalaliDay;
        let jalaliMonth;
        let numberOfDays;

        // Find number of days that passed since 1 Farvardin.
        numberOfDays = julianDayNumber - gregorianDay;
        if (numberOfDays >= 0) {
            if (numberOfDays <= 185) {
                // The first 6 months.
                jalaliMonth = 1 + this.div(numberOfDays, 31);
                jalaliDay = this.mod(numberOfDays, 31) + 1;
                return new JDate(jalaliYear, jalaliMonth - 1, jalaliDay);
            } else {
                // The remaining months.
                numberOfDays -= 186;
            }
        } else {
            // Previous Jalali year.
            jalaliYear -= 1;
            numberOfDays += 179;
            if (r.leap === 1) {
                numberOfDays += 1;
            }
        }
        jalaliMonth = 7 + this.div(numberOfDays, 30);
        jalaliDay = this.mod(numberOfDays, 30) + 1;

        return new JDate(jalaliYear, jalaliMonth - 1, jalaliDay);
    }

    /*
     Converts a date of the Jalali calendar to the Julian Day number.
     @param jYear Jalali year (1 to 3100)
     @param jMonth Jalali month (1 to 12)
     @param jDay Jalali day (1 to 29/31)
     @return Julian Day number
     */
    static jalaliToJulian(jYear: number, jMonth: number, jDay: number): number {
        const r = this.jalCal(jYear);
        return this.gregorianToJulian(r.gy, 3, r.march) + (jMonth - 1) * 31 - this.div(jMonth, 7) * (jMonth - 7) + jDay - 1;
    }

    /**
     * Returns the number of days in a specific jalali month.
     */
    static getDaysPerMonth(month: number, year: number): number {
        if (month <= 6) {
            return 31;
        }
        if (month <= 11) {
            return 30;
        }
        if (this.jalCal(year).leap === 0) {
            return 30;
        }
        return 29;
    }
}
