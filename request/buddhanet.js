/**
 * Download all eBooks from BuddaNet Library http://www.buddhanet.net/ebooks.htm
 *
 * @author   John Tribolet <john@tribolet.info>
 * @created  2016-08-07 21:12
 */

'use strict';

let request = require('request');
let cheerio = require('cheerio');
let fs      = require('fs');
let async   = require('async');


let baseUrl    = 'http://www.buddhanet.net/';
let ebooksHome = baseUrl + 'ebooks.htm';


// download and save a file
function download(url, dest, cb) {
    let file = fs.createWriteStream(dest);
    request(url).pipe(file);
    file.on('finish', function () {
        console.log('Downloaded ' + dest);
        file.close(cb);
    });
}

// load a category page, parse and clean up all the ebook download links
function processCategories(cats) {
    async.each(cats, function(category, cbFinished) {
        request(baseUrl + category.link, function(err, res, body) {
            console.log('----------------');
            console.log(category.name);
            let $ = cheerio.load(body);

            // get download urls
            let links = [];
            $('#wlinks table table a').each(function (i, elem) {
                let link = $(this).attr('href');

                // only get pdf or zip files
                if ( typeof link !== 'undefined'
                     && ( link.includes('.pdf') | link.includes('.zip') )
                ) {
                    // add base url if its a relative link
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

// create directory for the category and save all files to it
function downloadLinks(category, links) {
    console.log('Download Category: ' + category);
    if (!fs.existsSync(category)){
        fs.mkdirSync(category);
    }
}

// get category links
request(ebooksHome, function(err, res, body) {

    let cats      = [];
    let $         = cheerio.load(body);
    let menuLinks = $('.linksMenu a');

    menuLinks.each(function (i, elem) {
        let item = {
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
