var host = 'http://localhost:3000';
var socket = io.connect(host);
var token = window.location.search.substring(6);
socket.emit('newPlayer', token);

setInterval(function (){
socket.emit('123');
}, 5000);

socket.on('currentlyPlaying', function(data){
  songInformation = [];
  $("#album").animate({
      opacity: 0
    }, 750 );
setTimeout(function(){
  $('#album').html('<img src="'+data.image+'" /><div class="details">'+data.track+' - '+data.artist+'</div><br /><div class="details">'+data.album+'</div>');
  setTimeout(function(){$("#album").animate({
      opacity: 1
    }, 750 );}, 500);
}, 1000);
});

socket.on('fuckOff', function(data){
  window.location.replace(host);
});

var songInformation = [];
var count = 0;
socket.on('payload', function(data){
count = 0;
songInformation = [];
if (data.p4Info != undefined) {
  for (let f of data.p4Info) {if(f.length>50){songInformation.push(f);}}
}
if (data.wikiInfo != undefined) {
  for (let g of data.wikiInfo) {if(g.length>50){songInformation.push(g);}}
}
});

setInterval(function(){songReel();}, 10000);

function songReel() {
  if (songInformation[0] != undefined){
  $("#words").animate({
      opacity: 0
    }, 300 );
setTimeout(function(){
  $('#words').html('<div class="bodywords">'+songInformation[count]+'</div>');
  setTimeout(function(){$("#words").animate({
      opacity: 1
    }, 750 );
  }, 60);
  count++;
  if (count == songInformation.length) {count=0;}
}, 400);
}
}
