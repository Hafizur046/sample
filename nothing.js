const Country = require("../../models/country");
const Day = require("../../models/day");

function Subscribe(Site, admin) {
  return async (req, res) => {
    if (!req.body.token || !req.body.sitename) {
      res.json({ err: "token or sitename is missing" });
      return;
    }
    if (!req.body.country) {
      res.json({ err: "missing country" });
      return;
    }

    let site = await Site.findOne({ sitename: req.body.sitename });
    let currentCluster = site && site.clusters ? site.clusters : 1;

    if (!site) {
      //create a new site
      site = new Site();

      //assign all the values
      site.sitename = req.body.sitename;
      await site.save();
    }

    if (site) {
      //current cluster

      //shitty code though basically what I'm doin is checking if theres decimel yes there are far more better ways to do this
      let ss = site.tokens / 10000;
      ss = ss.toString();
      ss = ss.split(".");
      if (ss.length === 1) {
        currentCluster++;
        await Site.findByIdAndUpdate(site._id, { $inc: { clusters: 1 } });
      }

      //increase the number of tokens on that site
      await Site.findByIdAndUpdate(site._id, { $inc: { tokens: 1 } });
    }

    //things that need to be done regardless of what
    //
    const response = await admin
      .messaging()
      .subscribeToTopic(
        [req.body.token],
        `${req.body.sitename}_${currentCluster}`
      );

    res.json({});

    //handle some visual only stuffs that are not necessary for the server to wrok
    //increase token count of today
    let date_now = new Date();
    let calculatedIndexForToday = Number(
      `${date_now.getFullYear()}${date_now.getMonth()}${date_now.getDate()}`
    );
    let today = await Day.findOne({ index: calculatedIndexForToday });
    if (today) {
      await Day.findByIdAndUpdate(today._id, { $inc: { tokens: 1 } });
    } else {
      today = new Day();
      today.index = calculatedIndexForToday;
      today.tokens = 1;
      today.createdAt = new Date();
      await today.save();
    }

    //increase the entire sites token count

    //increase countrys token count
    let country = await Country.findOne({ name: req.body.country });
    if (!country) {
      country = new Country();
      country.name = req.body.country;
      country.tokens = 1;
      await country.save();
      return;
    }
    await Country.findOneAndUpdate(
      { name: req.body.country },
      { $inc: { tokens: 1 } }
    );
  };
}

module.exports = Subscribe;
