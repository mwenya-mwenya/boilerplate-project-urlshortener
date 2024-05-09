
let env = require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns'); /* required to verify URL */
const urlSchema = require('./urlMod.js'); /* schema defines document in the collection */
const connectDB = require('./db.js'); /* connection to DB */
const bodyParser = require('body-parser'); /* parses POST body */
const { error } = require('console');

app.use(bodyParser.urlencoded({ extended: false }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  let webAdd = req.body.url; /* get URL from frontend */
  console.log('TEST1 -', webAdd)
  let validURL = () => { /* validates URL true | false */
    try {
      const newURL = new URL(webAdd);

      return newURL.protocol === 'http:' || newURL.protocol === 'https:';
    } catch (err) {
      return false;
    }
  }

  if (!validURL()) {

    return res.status(201).json({ error: 'invalid url' }) /* returns invalid if URL is not valid */

  } else {

    let urlValid = new URL(webAdd) /* create URL objects */


    import('nanoid').then(module => { /* creates unique key to associate with new URL */

      let webID = module.customAlphabet('1234567890', 5);

      if (urlValid.port === env.parsed.PORT) { /* checks if address if localhost by checking port */
        console.log(urlValid)

        urlSchema.
          findOne({ address: `http://localhost:${env.parsed.PORT}/` + urlValid.search }). /* checks DB for URL */
          then((data) => {

            if (data) {
              return res.status(201).json({ original_url: data.address, short_url: parseInt(data.shorturlID) }) /* returns if URL on DB */
            }

            else {

              let saveUrl = new urlSchema({  /* creates a new document if not already on database */
                shorturlID: webID(),
                address: `http://localhost:${env.parsed.PORT}/` + urlValid.search
              })

              saveUrl   /* saves to DB */
                .save()
                .then((data) => {
                  return res.status(201).json({ original_url: data.address, short_url: parseInt(data.shorturlID) })
                }).catch((error) => {
                  console.log(error)
                })
            }
          })
      } else {

        const dnsURL = urlValid.host.replace(/(w+).(.+)/, '$2');/* reformats URL e.g www.example.com to example.com - this is for compatablity with DNSlookup  */

        dns.lookup(dnsURL, (err, result) => {  /* check DNS if URL valid */


          if (err) {
            return res.status(201).json({ error: 'invalid url' }) /* if DNS invalid returns invalid */
          } else {



            urlSchema.
              findOne({ actualWeb: result }). /* checks if URL is already on database */
              then((data) => {

                if (data) {

                  return res.status(201).json({ original_url: data.address, short_url: parseInt(data.shorturlID) }) /* return URL is already on database */
                } else {

                  let saveUrl = new urlSchema({  /* creates a new document if not already on database */
                    shorturlID: webID(),
                    actualWeb: result,
                    address: urlValid.href
                  })

                  saveUrl
                    .save()  /* saves new document to database  */
                    .then((data) => {
                      return res.status(201).json({ original_url: data.address, short_url: parseInt(data.shorturlID) });
                    })
                    .catch((error) => {
                      console.log(error)
                      return res.status(500).json({ error: 'Could not post data' }); /* return any errors in association with saving to database */
                    })
                }
              }).
              catch((error) => {

                console.log(error); /* returns any errors with finding document on the database */

              })


          }
        })
      }

    })
  }
})

app.get('/api/shorturl/:shortID', (req, res) => {

  urlSchema
    .findOne({ shorturlID: req.params.shortID }) /* get original URL associated with short URL from database */
    .then((doc) => {

      return res.status(201).redirect(301, doc.address); /* redirects to original URL address */
    }).catch((err) => { console.log(err) }) /* logs any errors associated with finding short URL on the database */

})

app.listen(3000, () => {
  console.log('App lsitening on 3k');
});


