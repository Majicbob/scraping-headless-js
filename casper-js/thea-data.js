var casper = require('casper').create();

// Get stats tables for all types of an item type
// The item type page lists all of the types available based on primary material
// Get those page urls and then grab tables from them

var url = 'http://thea-the-awakening.wikia.com/wiki/Bows';


var links;

function getLinks() {
    var links = document.querySelectorAll('.article-table.sortable td:nth-child(2) a');
    return Array.prototype.map.call(links, function (e) {
        return e.getAttribute('href')
    });
}

casper.start(url);
// Opens casperjs homepage
// casper.start('http://casperjs.org/');

casper.then(function () {
    links = this.evaluate(getLinks);
});

casper.run(function () {
    for(var i in links) {
        console.log(links[i]);
    }
    casper.done();
});