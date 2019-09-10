require('./../config.js');

(async () => {
  try {
    await common.setup();
    const articles = await database.query('SELECT * FROM `scrapped_articles_meta` WHERE `blog_url` IS NOT NULL');

    let rand = 5000;

    for (var j = 1; j < 1000; j++) {
      rand = Math.round(Math.random() * (3000)) + 100;

      for (let article of articles) {
        await page.goto(`${article.blog_url}`);
        await page.waitFor(15000);

        const blogDetail = await page.evaluate(() => {
          const data = document.querySelectorAll("#main article");
          return data[0].innerHTML;
        });

        let blogInfo = {
          article_meta_id: article.id,
          data: JSON.stringify(blogDetail)
        };

        rand = Math.round(Math.random() * (3000)) + 100;

        const blogInfoExists = await database.findBy('scrapped_articles_data', {
                                                          article_meta_id: article.id
                                                        });

        if (!blogInfoExists.length) {
          await database.insert('scrapped_articles_data', blogInfo);
          console.log(`Sending request in next ${rand}`);
          await common.sleep(rand);
          console.log('Blog details scrapped');
        }
      }
      process.exit();
    }
  } catch (e) {
    console.log('An errored', e);
    await browser.close();
  }

})();
