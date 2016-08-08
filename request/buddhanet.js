/**
 * Download all eBooks from BuddaNet Library http://www.buddhanet.net/ebooks.htm
 *
 * @author   John Tribolet <john@tribolet.info>
 * @created  2016-08-07 21:12
 */

'use strict';

let request    = require('request');
let cheerio    = require('cheerio');
let fs         = require('fs');
let async      = require('async');


let baseUrl    = 'http://www.buddhanet.net/';
let ebooksHome = baseUrl + 'ebooks.htm';

// download and save a file
function download(url, dest, cb) {
    let file = fs.createWriteStream(dest);
    request(url).pipe(file);
    file.on('finish', function() {
        console.log('Download Finished: ' + dest);
        file.close(cb);
    });
}

// create directory for the category and save all files to it without overwrite
function downloadLinks(category, links) {
    if (!fs.existsSync(category)){
        fs.mkdirSync(category);
    }

    async.each(links, function(link) {
        // get filename from url
        let startOfName = link.lastIndexOf('/') + 1;
        let filename    = link.substring(startOfName);
        let destPath    = category + '/' + filename;

        // download if file doesn't exist
        fs.stat(destPath, (err) => {
            if (null !== err && 'ENOENT' === err.code) {
                download(link, destPath);
            }
        });
    });
}

// load a category page, parse and clean up all the ebook download links
function processCategories(cats) {
    async.each(cats, function(category, cbFinished) {
        let categoryUrl = baseUrl + category.link;
        request(categoryUrl, function(err, resp, body) {
            if (err) {
                console.error('Error loading category page ' + categoryUrl + '\n ' + err);
                return;
            }

            // get download urls
            let $     = cheerio.load(body);
            let links = [];

            $('#wlinks table table a').each(function(i, elem) {
                let link = $(elem).attr('href');

                // only get pdf or zip files
                if ( 'undefined' !== typeof link
                     && ( link.includes('.pdf') || link.includes('.zip') )
                ) {
                    // add base url if its a relative link
                    if (! link.includes('buddhanet.net')) {
                        link = baseUrl + link;
                    }

                    links.push(link);
                }
            });

            downloadLinks(category.name, links);
            cbFinished();
        });
    });
}

// get category links
request(ebooksHome, function(err, resp, body) {
    if (err) {
        console.error('Error loading main page ' + ebooksHome + '\n ' + err);
        return;
    }

    let cats      = [];
    let $         = cheerio.load(body);
    let menuLinks = $('.linksMenu a');

    menuLinks.each(function(i, elem) {
        let item = {
            name: $(elem).text(),
            link: $(elem).attr('href')
        };

        if ('Buddhanet eBooks Home' !== item.name) {
            cats.push(item);
        }
    });

    processCategories(cats);
});
