const puppeteer = require("puppeteer");
const npm = require('npm');
const moment = require('moment');
const momentTimezone = require('moment-timezone');
import axios from 'axios';
import URL from 'url';

// global.fileModule = fileModule;
global.momentTimezone = momentTimezone;

export default {
  async setup() {
    global.browser = await puppeteer.launch({ headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    global.page = await browser.newPage();
    await page.setViewport({ width: 1321, height: 668 });

    page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36"
    );
  },

  async getSelectorInnerValue(activePage, selector, type = null) {
      const header = await activePage.$(selector);

      if (!header) {
        return '';
      }

      if (type === 'href') {
        return await activePage.evaluate(
          header => header.href,
          header
        );
      } else if (type === 'src') {
        return await activePage.evaluate(
          header => header.src,
          header
        );
      }

      return await activePage.evaluate(
        header => header.innerText,
        header
      );
  },

  async cleanObject(obj) {
    const removeValue = [
      '',
      '-',
      'n/a',
      'not specified',
      'no category',
    ];

    for (var propName in obj) {
      if (obj[propName] === undefined || obj[propName] === null) {
        delete obj[propName];
      } else if (removeValue.includes(obj[propName].toString().toLowerCase())) {
        delete obj[propName];
      }
    }

    return obj;
  },

  async sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  },
}
