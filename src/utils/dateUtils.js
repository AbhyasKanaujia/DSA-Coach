class DateUtils {
  static normalizeToUTCMidnight(date) {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  static nowUTC() {
    return new Date();
  }

  static nowUTCMidnight() {
    return this.normalizeToUTCMidnight(new Date());
  }

  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static diffDays(date1, date2) {
    const normalized1 = this.normalizeToUTCMidnight(date1);
    const normalized2 = this.normalizeToUTCMidnight(date2);
    return Math.floor((normalized1 - normalized2) / (1000 * 60 * 60 * 24));
  }

  static isSameDay(date1, date2) {
    return this.diffDays(date1, date2) === 0;
  }

  static isToday(date) {
    return this.isSameDay(date, this.nowUTC());
  }
}

module.exports = DateUtils;