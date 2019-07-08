require('./../config.js');

const primaryUrl = 'https://theculturetrip.com';

(async () => {
    await common.setup();
    await page.goto(primaryUrl);
    await page.click('.givRCy');
    // //  Aruba, Bonaire & Curacao => aruba-bonaire-curacao Trinidad And Tobago => trinidad-and-tobago
    // console.log('Aruba, Bonaire & Curacao'.replace(/,|&|''/g,'').replace(/ /g,'-').toLowerCase());
    // return;
    await page.waitForSelector('.givRCy', { timeout: 10000, visible: true });

    await page.waitForSelector('.sections-menustyled__SectionsToggleMenu-s1g9zor0-1', { timeout: 10000, visible: true });
    await page.waitFor(2000);

    const locations = await page.evaluate(() => {
      const extractedElements = document.querySelectorAll('.gYIvyB');
      const items = [];
      for (let element of extractedElements) {
        items.push(element.innerText);
      }
      return items;
    });

    locations.shift();

    for (const location of locations) {
      storeDestination(location);
    }

    const destinations = await database.query('SELECT * FROM `destinations` WHERE `parent_id` = 0 ');

    for (const location of destinations) {
      await page.goto(`${primaryUrl}/${location.name.toLowerCase().replace(" ", "-")}`);
      await page.waitForSelector('#subLocationWrap > label', { timeout: 10000, visible: true })
      await page.click('#subLocationWrap > label');
      const childDestinations = await page.evaluate(() => {
        const extractedLocations = document.querySelectorAll('#subLocationWrap > div > ul > li > a');
        const childLocations = [];
        for (let location of extractedLocations) {
          childLocations.push(location.innerText);
        }
        return childLocations;
      });


      for (const childLocation of childDestinations) {
        childLocation.parent_id = location.id;
        storeChildDestination(childLocation,location);
      }
    }

    const continents = await database.query('SELECT * FROM `destinations` WHERE `parent_id` = 0 ');
    for (const destination of continents) {
      const countries = await database.query("SELECT * FROM `destinations` WHERE `parent_id` = '" + destination.id + "' ");
      for (const location of countries) {
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
          storeStateDestination(childLocation,location);
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
          storeCityDestination(childLocation,city);
        }

      }
    }
  }


})();

async function storeDestination(location) {
  const destinationExists = await database.findBy('destinations', {
                                              name: location
                                            });

  if (!destinationExists.length) {
    const insertDestination = "INSERT INTO destinations ( name ) values ( ? )";
    await database.insert(insertDestination, location);
    console.log('Destination inserted successfully : ' +location);
  }
}

async function storeChildDestination(childLocation,location) {
  const destinationExists = await database.findBy('destinations', {
                                              name: childLocation,
                                              parent_id: location.id
                                            });

  if (!destinationExists.length) {
    const insertDestination = "INSERT INTO destinations ( name , parent_id ) values ?";
    const childDestinationStored = [
      [childLocation, location.id]
    ];
    await database.insert(insertDestination, childDestinationStored);
    console.log('Destination inserted successfully : ' +childLocation);
  }
}

async function storeStateDestination(childLocation,location) {
  const destinationExists = await database.findBy('destinations', {
                                              name: childLocation,
                                              parent_id: location.id
                                            });

  if (!destinationExists.length) {
    const insertDestination = "INSERT INTO destinations ( name , parent_id ) values ?";
    const childDestinationStored = [
      [childLocation, location.id]
    ];
    await database.insert(insertDestination, childDestinationStored);
    console.log('Destination inserted successfully : ' +childLocation);
  }
}

async function storeCityDestination(childLocation,city) {
  const destinationExists = await database.findBy('destinations', {
                                              name: childLocation,
                                              parent_id: city.id
                                            });

  if (!destinationExists.length) {
    const insertDestination = "INSERT INTO destinations ( name , parent_id ) values ?";
    const childDestinationStored = [
      [childLocation, city.id]
    ];
    await database.insert(insertDestination, childDestinationStored);
    console.log('Destination inserted successfully : ' +childLocation);
  }
}
