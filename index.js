
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns'); /* required to verify URL */
const urlSchema = require('./urlMod.js'); /* schema defines document in the collection */
const connectDB = require('./db.js'); /* connection to DB */
const bodyParser = require('body-parser'); /* parses POST body */

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

  dns.lookup(webAdd, (err, result) => {
    if (err) { 
      return res.status(201).json({ error: 'invalid url' }) /* returns invalid if URL is not valid */
     }
    else {
      import('nanoid').then(module => { /* creates unique key to associate with new URL */

        let webID = module.customAlphabet('1234567890', 5);

        urlSchema.
          findOne({actualWeb: result}). /* checks if URL is already on database */
          then((data) => {
             
            if (data) {
              console.log(data)
              return res.status(201).json({ original_url : 'https://'+data.address, short_url : parseInt(data.shorturlID)}) /* return URL is already on database */
            } else {
              
              let saveUrl = new urlSchema({  /* creates a new document if not already on database */
                shorturlID: webID(),
                actualWeb: result,
                address: webAdd
              })          
              
              saveUrl
                .save()  /* saves new document to database  */
                .then((data) => {
                  return res.status(201).json(data);
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
      })
    }
  })

})


app.get('/api/shorturl/:shortID', (req, res) => {
  urlSchema
    .findOne({ shorturlID: req.params.shortID }) /* get original URL associated with short URL from database */
    .then((doc) => {
     
      return res.status(201).redirect(301, 'https://' + doc.address); /* redirects to original URL address */
    }).catch((err) => { console.log(err) }) /* logs any errors associated with finding short URL on the database */
})

app.listen(3000, () => {
  console.log('App lsitening on 3k');
});


