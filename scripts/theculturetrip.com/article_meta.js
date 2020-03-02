require('./../../config.js');

const {
  dynamic: { setIntervalAsync: setIntervalAsyncD },
  fixed: { setIntervalAsync: setIntervalAsyncF },
  legacy: { setIntervalAsync: setIntervalAsyncL },
  clearIntervalAsync
} = require('set-interval-async')

const primaryUrl = 'https://theculturetrip.com';

(async () => {
    await common.setup();
    await page.goto(primaryUrl);
    await page.waitForSelector('#sections-menu-id', { timeout: 10000, visible: true });

    // const destinations = await database.query('SELECT * FROM `destinations` WHERE `parent_id` = 0 ');
    let _url = 'https://theculturetrip.com/north-america/';
    // for (const location of destinations) {
      // _url = `${primaryUrl}/${location.name.toLowerCase().replace(" ", "-")}`;
      console.log(`Extracting: ${_url}`);
      await page.goto(_url);

      const articles = await page.evaluate(() => {
          let _spotLights = document.querySelectorAll('[data-pin-nopin="true"]');

          let imgInterval = setInterval(function () {
            for (var i = 0; i < _spotLights.length; i++) {
              _spotLights[i].scrollIntoView();

              if (_spotLights.length == i) {
                clearInterval(imgInterval);
              }
            }
          }, 1000);

          const articlesMeta = [];
          let _article = {};

          let _extractionInterval = setInterval(function () {
              const extractedArticles = document.querySelectorAll('#genre_article [data-automation-id="tile"]');

              for (var i = articlesMeta.length; i < extractedArticles.length; i++) {
                _article = {
                  'title': extractedArticles[i].querySelector('h3').innerText,
                  'category': extractedArticles[i].querySelector('h4').innerText,
                  'thumbnail': extractedArticles[i].querySelector('[data-pin-nopin="true"]').src,
                  'link': extractedArticles[i].querySelector('a').href,
                  'site_id': 'culturetrip.com'
                };

                articlesMeta.push(_article);
              }

              if (document.querySelector('#genre_article') && document.querySelector('#genre_article').nextElementSibling.querySelector('button') && document.querySelector('#genre_article').nextElementSibling.querySelector('button').textContent == 'Show More') {
                document.querySelector('#genre_article').nextElementSibling.querySelector('button').click();
              }
              if (extractedArticles.length) {
                extractedArticles[i-1].scrollIntoView();
              }
          }, 5000);

          return articlesMeta;
      });

      console.log(articles);

      // for (const meta of articles) {
      //     await storeArticleMeta(meta);
      // }
})();

async function storeArticleMeta(meta) {
  const destinationExists = await database.findBy('scrapped_articles_meta', { link: meta.link });

  if (!destinationExists.length) {
    console.log(`Destination inserted successfully : ${meta.name}`);
    return await database.insert('scrapped_articles_meta', meta);
  }
}
