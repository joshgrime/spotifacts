const fs = require('fs');
const express = require('express');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const request = require('request');
const pup = require('puppeteer');
const Base64 = require('js-base64').Base64;


var clientId;
var clientSec;

fs.readFile('keys.txt', 'utf8', function (err,data) {
  clientId = data.substring(0, 32);
  clientSec = data.substring(32);
  console.log('Read keys.');
});

server.listen(3000);

  app.use(express.static('public'));
  var urlencodedParser = bodyParser.urlencoded({ extended: false });

  app.post('/login', urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    var scopes = 'user-read-currently-playing';
    res.redirect('https://accounts.spotify.com/authorize' +
  '?response_type=code' +
  '&client_id=' + clientId +
  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
  '&redirect_uri=' + encodeURIComponent('http://localhost:3000/playing'));
  });

io.on('connection', function (socket) {
  console.log('new connection');
  var access_token = '';
  var refresh_token = '';
  var details = {id:''};
  var songInfo = [];


  socket.on('newPlayer', function (data) {
    var string = new String(clientId + ':' + clientSec);
    var encode = Base64.encode(string);
    encode = encode.replace(/.$/,"=");

  var authOptions = {
       url: 'https://accounts.spotify.com/api/token',
       form: {
         code: data,
         redirect_uri: 'http://localhost:3000/playing',
         grant_type: 'authorization_code'
       },
       headers: {
         'Authorization': 'Basic ' + encode
       },
       json: true
     };
console.log(authOptions.headers);
     request.post(authOptions, function(error, response, body) {
           if (!error && response.statusCode === 200) {
             access_token = body.access_token;
             refresh_token = body.refresh_token;
             console.log('Got Access Tokens');
             console.log('Access: '+access_token);
             console.log('Refresh: '+refresh_token);
          }
          else {
            socket.emit('fuckOff');
          }
        });

  });

  socket.on('123', function (data) {
    console.log('.');
    var options = {
      url: 'https://api.spotify.com/v1/me/player/currently-playing?market=GB',
      headers: {
          'Accept': 'application/json',
          'Content-Type':'application/json',
          'Authorization':'Bearer ' + access_token
        }
      };

    request(options, function (error, response, body) {
    if (response.statusCode == '400') {
      socket.emit('fuckOff');
      return;
    }
    else if (response.statusCode == '204') {
      //no song playing
      console.log('No Song is playing');
      return;
    }
    else if (response.statusCode != '200') {
      console.log(response.statusCode);
      return;
    }
    var obj = JSON.parse(body);
    if (details.album != obj.item.album.name) {
      //new song has begun
      details.id = obj.item.id;
      details.track = obj.item.name;
      details.artist = obj.item.artists[0].name;
      details.image = obj.item.album.images[0].url;
      details.album = obj.item.album.name;
      console.log('New album!');
      console.log(details);
      socket.emit('currentlyPlaying', details);
      async function go() {
        var obj = {};
        try{
          const browser = await pup.launch();
          const google = await browser.newPage();
          var wdArtist = details.artist.split(' ');
          var qs = '';
          for (let u of wdArtist) {
            qs += (u + '+');
          }
          qs += '-+';
          var wdAlbum = details.album.split(' ');
          for (let w of wdAlbum) {
            qs += (w + '+');
          }
          console.log('?q='+qs+'(album)');
          await google.goto('https://www.google.co.uk/search?q='+qs+'+(album)', {waitUntil: 'networkidle0'});
          var cites = await google.evaluate(function(){
            var arr = document.getElementsByClassName('r');
            var arr2 = [];
            for (let y of arr) {
              var x = y.childNodes[0];
              arr2.push(x.href);
              }
              return arr2;
            });
      var wikiLink = '';
      var p4Link = '';
if (cites[0].includes('wikipedia')) {
  wikiLink = cites[0];
}
if (wikiLink === '') {
for (let link of cites) {
  if (link.includes('wikipedia') && wikiLink === '') {
    wikiLink = link;
    break;
}
}
}
for (let lonk of cites) {
  if (lonk.includes('pitchfork') && p4Link === '') {
    p4Link = lonk;
    break;
}
}
if (wikiLink === '' && p4Link === '') {
console.log('Couldn\'t find album.');
}
else {
if (wikiLink !== '') {
  console.log('Gathering information from wikipedia...');
  const wikiPage = await browser.newPage();
  await wikiPage.goto(wikiLink, {waitUntil: 'networkidle0'});
  await wikiPage.waitFor(1000);
  var wikiInfo = await wikiPage.evaluate(function () {
    var ps = document.getElementsByTagName("p");
    var uis = [];
    for (let ui of ps) {
      uis.push(ui.innerText);
    }
    return uis;
});
}
if (p4Link !== '') {
  console.log('Gathering information from pitchfork...');
  const p4Page = await browser.newPage();
  await p4Page.goto(p4Link, {waitUntil: 'networkidle0'});
  await p4Page.waitFor(1000);
  var p4Info = await p4Page.evaluate(function (){
    var cap = document.getElementsByClassName('review-detail');
var firstArticle = cap[0].childNodes[0].childNodes[1].childNodes[1].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes;
console.log(firstArticle);
var arr=[];
for (let y of firstArticle) {
if (y.tagName == 'P') {
arr.push(y);
}
}
console.log(arr);
var res = [];
for (let x of arr) {
if (x.className === "") {
res.push(x.innerText);
}
}
return res;
});
}
}
browser.close();
}
catch(err){
  console.log('Something went wrong getting info. Links:\n'+p4Link+'\n'+wikiLink);
}
if (wikiInfo != undefined) {obj.wikiInfo = wikiInfo;}
if (p4Info != undefined) {obj.p4Info = p4Info;}
socket.emit('payload', obj);
console.log(obj);
}
  go();
}
  });
});

});
