const express = require('express');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const request = require('request');
const pup = require('puppeteer');


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
  var currentSong = '';
  socket.on('newPlayer', function (data) {

  var authOptions = {
       url: 'https://accounts.spotify.com/api/token',
       form: {
         code: data,
         redirect_uri: 'http://localhost:3000/playing',
         grant_type: 'authorization_code'
       },
       headers: {
         'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSec).toString('base64'))
       },
       json: true
     };

     request.post(authOptions, function(error, response, body) {
           if (!error && response.statusCode === 200) {
             access_token = body.access_token;
             refresh_token = body.refresh_token;
             console.log('Got Access Tokens');
             console.log('Access: '+access_token);
             console.log('Refresh: '+refresh_token);
          }
        });

  });

  socket.on('123', function (data) {
    console.log('server pinged! '+data);
    var options = {
      url: 'https://api.spotify.com/v1/me/player/currently-playing?market=GB',
      headers: {
          'Accept': 'application/json',
          'Content-Type':'application/json',
          'Authorization':'Bearer ' + access_token
        }
      };

    request(options, function (error, response, body) {
    console.log('statusCode:', response && response.statusCode);
    if (response.statusCode == '204') {
      //no song playing
    }
    var obj = JSON.parse(body);
    console.log(obj.item.id);
    else if (currentSong != obj.item.id) {
      currentSong = obj.item.id;
      //new song has begun
    }
    else {
      //new fact

    }
  });
});

});
