var request = require('request');
var cheerio = require('cheerio');
var fs      = require('fs');


function download(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    request(url).pipe(file);
    file.on('finish', function() {
        log('Downloaded ' + dest);
        file.close(cb);
    });
}

var ebooksHome = 'http://www.buddhanet.net/ebooks.htm';
var cats = [];

// get category links
request(ebooksHome, function(err, res, body) {

    var $ = cheerio.load(body);
    var menuLinks = $('.linksMenu a');

    menuLinks.each(function(i, elem) {
        var item = {
            name: $(this).text(),
            link: $(this).attr('href')
        };

        cats.push(item);
    });

    // console.log(cats);
});