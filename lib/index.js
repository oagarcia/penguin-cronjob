'use strict';

//Set to new york time
process.env.TZ = 'America/New_York';

const fetch = require('node-fetch');
const schedule = require('node-schedule');
const debug = require('debug')('main');

const ruleToday = new schedule.RecurrenceRule();
const ruleYesterday = new schedule.RecurrenceRule();

//Sends notification every weekday by 5:45PM - notifying missing report from today
ruleToday.dayOfWeek = [new schedule.Range(1, 5)];
ruleToday.hour = 17;
ruleToday.minute = 45;

//Sends notification every weekday by 10:55AM - notifying missing report from yesterday
ruleYesterday.dayOfWeek = [new schedule.Range(1, 5)];
ruleYesterday.hour = 9;
ruleYesterday.minute = 55;

/**
 * Communicates with the API (Heroku) and sends the push
 * @param  {string} dateStr The formated string with the date
 * @return {void}
 */
const sendPushNotification = (dateStr) => {
    const url = 'https://uitraining.zemoga.com/penguin-report/notify/?date=';
    debug('sending push: ' + url + dateStr);

    fetch(url + dateStr)
    .then((response) => response.json())
    .then((data) => {
        debug('the data', data);

        if (data.nopinguins) {
            debug(new Date() + ' No people to notify!!!!');
            return;
        }

        if (data.failure) {
            debug(new Date() + ' Notifications sent but with problems > fails: ' + data.failure + ', success: ' + data.success);
        } else {
            debug(new Date() + ' ' + data.success + ' users notified!!!!');
        }
    })
    .catch((error) => {
        debug(new Date() + ' There has been a problem: ' + error.message);
    });
};

/**
 * Ads zero if less than 10 and returns the string
 * @param  {number} n A given number
 * @return {string}   The string putput
 */
const leadingZero = (n) => n < 10 ? `0${n}` : n;

/**
 * Takes a Date object and returns a date in the form yyyy-mm-dd
 * @param  {Object} theDate A given Date object
 * @return {string}         The string date format
 */
const getFormatDate = (theDate) => `${theDate.getFullYear()}-${leadingZero(theDate.getMonth() + 1)}-${leadingZero(theDate.getDate())}`;

//Init the cron for today notification
schedule.scheduleJob(ruleToday, () => {
    const today = new Date();
    const dateStr = getFormatDate(today);
    sendPushNotification(dateStr);
});

//Init the cron for yesterday notification
schedule.scheduleJob(ruleYesterday, () => {
    const today = new Date();
    const yesterday = new Date();

    const todayDayNumber = today.getDay();
    let daysBefore = 1;

    //If today is monday, check friday:
    if (todayDayNumber === 1) {
        daysBefore = 3;
    }

    yesterday.setDate(yesterday.getDate() - daysBefore);

    const dateStr = getFormatDate(yesterday);
    sendPushNotification(dateStr);
});

debug('Penguins cronjob started!!!!!! local time: ' + new Date());
