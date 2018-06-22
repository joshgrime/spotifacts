const pup = require('puppeteer');

async function go() {

const browser = await pup.launch();
const google = await browser.newPage();
var details = {album:'tango in the night'};
var wds = details.album.split(' ');
var qs = '';
for (let w of wds) {
  qs += (w + '+');
}
qs = qs.substring(0, qs.length - 1);
await google.goto('https://www.google.co.uk/search?q='+qs, {waitUntil: 'networkidle2'});
var cites = await google.evaluate(function(){
  var arr = document.getElementsByClassName('r');
  var arr2 = [];
  for (let y of arr) {
    var x = y.childNodes[0];
  arr2.push(x.href);
  }
  return arr2;
});

if (cites[0].includes('wikipedia')) {
  wikiLink = cites[0];
}

for (let link of cites) {
  if (link.includes('wikipedia') && wikiLink === '') {
    wikiLink = link;
}
}
const wikiPage = await browser.newPage();
await wikiPage.goto(wikiLink, {waitUntil: 'networkidle2'});
var info = await wikiPage.evaluate(function () {
  var ps = document.getElementsByTagName("p");
  var uis = [];
  for (let ui of ps) {
    uis.push(ui.innerText);
  }
  return uis;
});

console.log(info);

}

go();
