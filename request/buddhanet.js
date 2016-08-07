var request = require('request');
var cheerio = require('cheerio');
var fs      = require('fs');
var async   = require('async');


var baseUrl    = 'http://www.buddhanet.net/';
var ebooksHome = baseUrl + 'ebooks.htm';


function download(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    request(url).pipe(file);
    file.on('finish', function() {
        log('Downloaded ' + dest);
        file.close(cb);
    });
}

function processCategories(cats) {
    async.each(cats, function(category, cbFinished) {
        request(baseUrl + category.link, function(err, res, body) {
            console.log('----------------');
            console.log(category.name);
            var $ = cheerio.load(body);

            // get download urls
            var links = [];
            $('#wlinks table table a').each(function(i, elem) {
                var link = $(this).attr('href');

                if ( typeof link !== 'undefined' && link.includes('pdf') ) {
                    if (! link.includes('buddhanet.net')) {
                        link = baseUrl + link;
                    }

                    links.push(link);
                }
            });

            console.log(links);
            cbFinished();
        })
    });
}

function downloadLinks(category, links) {
    if (!fs.existsSync(category)){
        fs.mkdirSync(category);
    }
}

// get category links
request(ebooksHome, function(err, res, body) {

    var cats      = [];
    var $         = cheerio.load(body);
    var menuLinks = $('.linksMenu a');

    menuLinks.each(function(i, elem) {
        var item = {
            name: $(this).text(),
            link: $(this).attr('href')
        };

        if ('Buddhanet eBooks Home' !== item.name) {
            cats.push(item);
        }
    });

    console.log(cats);
    processCategories(cats);
});