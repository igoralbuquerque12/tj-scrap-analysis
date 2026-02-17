/**
 * Verify if a date (in format dd/mm/yyyy) is within the last N days.
 * @param {string} dateStr - Date "dd/mm/yyyy"
 * @param {number} days - Number of days to check against
 * @returns {boolean}
 */
function isWithinLastDays(dateStr, days) {
    const [day, month, year] = dateStr.split('/');
    const articleDate = new Date(year, month - 1, day);

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);
    limitDate.setHours(0, 0, 0, 0);

    return articleDate >= limitDate;
}

module.exports = { isWithinLastDays };
