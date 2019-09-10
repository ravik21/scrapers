require('./../config.js');

const primaryUrl3 = 'https://www.lonelyplanet.com/india/articles';

(async () => {
  try {
      await common.setup();
      await page.goto(primaryUrl3);
      await page.waitFor(15000);
      await page.evaluate(() => {
          document.getElementById("footer").scrollIntoView({behavior: "smooth" });
      });
      await page.waitFor(20000);

      let rand = 5000;

      for (var j = 1; j < 1000; j++) {
        rand = Math.round(Math.random() * (3000)) + 100;

        const articles = await page.evaluate(() => {
          const category = document.querySelectorAll("#main .CategoryLabel");

          const articleDetails = [];
          for (let i = 0; i < category.length; i++) {

            const categoryName = category[i].innerText;
            const heading = document.querySelectorAll("#main section .ListItemHeadingMedium a")[i].innerText;
            const image = document.querySelectorAll("#main section .ListItemThumbnail a img")[i].src;
            const blogUrl = document.querySelectorAll("#main section .ListItemThumbnail a")[i].href;
            const siteId = "lonelyplanet";

            let info = {
              category: categoryName,
              site_id: siteId,
              heading,
              image,
              blog_url: blogUrl
            };

            articleDetails.push(info);
          }
          return articleDetails;
        });

        for (let articleInfo of articles) {
          rand = Math.round(Math.random() * (3000)) + 100;

          await database.insert('scrapped_articles_meta', articleInfo);
          console.log(`Sending request in next ${rand}`);
          await common.sleep(rand);

          console.log('Article details scrapped');
        }
        process.exit();
      }


  } catch (e) {
    console.log('An errored', e);
    await browser.close();
  }

})();
