require('./../../config.js');

const primaryUrl = 'https://theculturetrip.com';

(async () => {
    await common.setup();
    await page.goto(primaryUrl);
    await page.waitForSelector('#sections-menu-id', { timeout: 10000, visible: true });
    // //  Aruba, Bonaire & Curacao => aruba-bonaire-curacao Trinidad And Tobago => trinidad-and-tobago
    // console.log('Aruba, Bonaire & Curacao'.replace(/,|&|''/g,'').replace(/ /g,'-').toLowerCase());
    // return;
    await page.click('#sections-menu-id > button');

    await page.waitForSelector('[data-tct-testid="sections-menu"]', { timeout: 10000, visible: true });
    await page.waitFor(2000);

    const locations = await page.evaluate(() => {
      const extractedElements = document.querySelectorAll('[data-tct-testid="sections-menu"] a');
      const items = [];
      for (let element of extractedElements) {
        items.push(element.innerText);
      }
      return items;
    });

    locations.shift();

    for (const location of locations) {
      await storeDestination(location);
    }

    const destinations = await database.query('SELECT * FROM `destinations` WHERE `parent_id` = 0 ');

    console.log(destinations);

    for (const location of destinations) {
      console.log(`Extracting child location for ${location.name.toLowerCase().replace(" ", "-")}`);

      await page.goto(`${primaryUrl}/${location.name.toLowerCase().replace(" ", "-")}`);
      const childDestinations = await page.evaluate(() => {
        const extractedLocations = document.querySelectorAll('#subLocationWrap > div > ul > li > a');
        const childLocations = [];
        for (let location of extractedLocations) {
          childLocations.push(location.innerText);
        }
        return childLocations;
      });

      console.log(childDestinations);

      for (const childLocation of childDestinations) {
        childLocation.parent_id = location.id;
        storeChildDestination(childLocation,location);
      }
    }

    const continents = await database.query('SELECT * FROM `destinations` WHERE `parent_id` = 0 ');
    for (const destination of continents) {
      const countries = await database.query("SELECT * FROM `destinations` WHERE `parent_id` = '" + destination.id + "' ");
      for (const location of countries) {
        console.log(`scrapers running for : ${primaryUrl}/${destination.name.toLowerCase().replace(" ", "-")}/${location.name.replace(/,|&|''/g,'').replace(" ","-").toLowerCase()}`);
        await page.goto(`${primaryUrl}/${destination.name.toLowerCase().replace(" ", "-")}/${location.name.replace(/,|&|''/g,'').replace(" ","-").toLowerCase()}`);
        const states = await page.evaluate(() => {
          const extractedLocations = document.querySelectorAll('#subLocationWrap > div > ul > li > a');
          const childLocations = [];
          for (let location of extractedLocations) {
            childLocations.push(location.innerText);
          }
          return childLocations;
        });

        for (const childLocation of states) {
          childLocation.parent_id = location.id;
          storeChildDestination(childLocation, location);
        }

      }
    }

    const continents1 = await database.query('SELECT * FROM `destinations` WHERE `parent_id` = 0 ');
    for (const destination of continents1) {
      const countries1 = await database.query("SELECT * FROM `destinations` WHERE `parent_id` = '" + destination.id + "' ");
      for (const location of countries1) {
        const cities = await database.query("SELECT * FROM `destinations` WHERE `parent_id` = '" + location.id + "' ");
        for (const city of cities) {
        await page.goto(`${primaryUrl}/${destination.name.toLowerCase().replace(" ", "-")}/${location.name.replace(/,|&|''/g,'').replace(" ","-").toLowerCase()}/${city.name.replace(" ","-").toLowerCase()}`);
        const states = await page.evaluate(() => {
          const extractedLocations = document.querySelectorAll('#subLocationWrap > div > ul > li > a');
          const childLocations = [];
          for (let location of extractedLocations) {
            childLocations.push(location.innerText);
          }
          return childLocations;
        });

        for (const childLocation of states) {
          childLocation.parent_id = city.id;
          storeChildDestination(childLocation, city);
        }
      }
    }
  }
})();

async function storeDestination(location) {
  const destinationExists = await database.findBy('destinations', { name: location });

  if (!destinationExists.length) {
    console.log(`Destination inserted successfully : ${location}`);
    return await database.insert('destinations', { name: location });
  }
}

async function storeChildDestination(childLocation, location) {
  const destinationExists = await database.findBy('destinations', { name: childLocation, parent_id: location.id });

  if (!destinationExists.length) {
    const childDestinationStored = { name: childLocation, parent_id: location.id };
    await database.insert('destinations', childDestinationStored);
    console.log(`Destination inserted successfully : ${childLocation}`);
  }
}
