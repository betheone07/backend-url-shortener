const express = require('express');
const Url = require('./models/Url');
const fronturl = require('./models/front-endurl');
const validUrl = require('valid-url');
const shortid = require('shortid');
const config = require('config');
const User = require('./models/user');
const cors = require('cors');
const jwt = require('jsonwebtoken');


const connectDB = require('./config/db');
const app = express();


connectDB();
app.use(express.json())

app.use(cors());


//Middleware to verify token
function verifyToken(req, res, next) {
  if(!req.headers.authorization) {
    return res.status(401).send('Unauthorized request');
  }
  let token = req.headers.authorization.split(' ')[1]
  if(token === 'null') {
    return res.status(401).send('Unauthorized request');
  }

  let payload = jwt.verify(token, 'secretKey')
  if(!payload) {
    return res.status(401).send('Unauthorized request')
  }

  req.userId = payload.subject
  next()

}



//to get the main url from shortened one
app.get('/:code', async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });

    if (url) {
      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json('No url found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});




//posting a new url with short-urThat's more likelyl or finding a one if already in DB
app.post('/url/shorten', async (req, res) => {
  const mainUrl = req.body;
  const longUrl = mainUrl.url;/* 
  let myurl = new fronturl(geturl);
  const longUrl = myurl.longurl; */
  const baseUrl = config.get('baseUrl');
  // Check base url
  if (!validUrl.isUri(baseUrl)) {
    return res.status(401).json('Invalid base url');
  }

  // Create url code using shortid
  const urlCode = shortid.generate();

  // Check long url
  if (validUrl.isUri(longUrl)) {
    try {
      let url = await Url.findOne({ longUrl });

      if (url) {
        res.json(url.shortUrl);
      } else {
        const shortUrl = baseUrl + '/' + urlCode;

        url = new Url({
          longUrl,
          shortUrl,
          urlCode,
          date: new Date()
        });

        await url.save();

        res.json(url.shortUrl);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Server error');
    }
  } else {
    res.status(401).json('Invalid long url');
  }
});





//add registered users to DB 
app.post('/api/register', (req, res) => {
  let userData = req.body;
  let user = new User(userData)
  user.save((err, registeredUser) => {
    if(err){
      console.log(err)
    }else{
      let payload = {
        subject: registeredUser._id
      }
      let token = jwt.sign(payload, 'secretkey')
      res.status(200).send({token})
    }
  })
});

//add login
app.post('/api/login',(req,res) => {
  let userData = req.body;
  
  //recursively checking email, password
  User.findOne({email: userData.email}, (err, user) => {
    if(err)
    {
      console.log(err)
    }else {
      if(!user){
        res.status(401).send('Invalid email');
      }else{
        if(user.password !== userData.password){
          res.status(401).send("Invalid password")
        }else{
          let payload = {
            subject: user._id
          }
          let token = jwt.sign(payload, 'secretkey')
          res.status(200).send({token})
        }
      }
    }
  })

});

//add also some get requests for getmting the short URL after user authenticated















const PORT = 3000;

app.listen(PORT);


