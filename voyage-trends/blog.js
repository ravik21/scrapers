require('./../config.js');

const primaryUrl2 = 'https://theculturetrip.com/asia/india/mumbai/colaba/';

(async () => {
    await common.setup();
    await page.goto(primaryUrl2);
    await page.waitFor(15000);
    await page.waitForSelector('section > .jmxGFU > div > button', { timeout: 30000, visible: true });
    await page.click('section > .jmxGFU > div > button');

    const blogs = await page.evaluate(() => {
      const extractedElements = document.querySelectorAll('.huNVWz');
      const childLocations = [];
      for (let location of extractedElements) {
        childLocations.push(location.innerText);
      }
      return childLocations;
    });

    const titles = await page.evaluate(() => {
      const extractedElements = document.querySelectorAll('.cqpUYa > .eivdMo');
      const childLocations = [];
      for (let location of extractedElements) {
        childLocations.push(location.innerText);
      }
      return childLocations;
    });

    const places = await page.evaluate(() => {
      const extractedElements = document.querySelectorAll('.kBDWmf');
      const childLocations = [];
      for (let location of extractedElements) {
        childLocations.push(location.innerText);
      }
      return childLocations;
    });

    console.log(places);
    return false;

})();
