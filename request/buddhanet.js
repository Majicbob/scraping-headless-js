/**
 * Download all eBooks from BuddaNet Library http://www.buddhanet.net/ebooks.htm
 *
 * @author   John Tribolet <john@tribolet.info>
 * @created  2016-08-07 21:12
 */

'use strict';

const request    = require('request');
const cheerio    = require('cheerio');
const fs         = require('fs');
const async      = require('async');


const baseUrl    = 'http://www.buddhanet.net/';
const ebooksHome = baseUrl + 'ebooks.htm';

// download and save a file
function download(url, dest, cb) {
    const file = fs.createWriteStream(dest);
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
        const startOfName = link.lastIndexOf('/') + 1;
        const filename    = link.substring(startOfName);
        const destPath    = category + '/' + filename;

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
        const categoryUrl = baseUrl + category.link;
        request(categoryUrl, function(err, resp, body) {
            if (err) {
                console.error('Error loading category page ' + categoryUrl + '\n ' + err);
                return;
            }

            // get download urls
            const $     = cheerio.load(body);
            const links = [];

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

    const cats      = [];
    const $         = cheerio.load(body);
    const menuLinks = $('.linksMenu a');

    menuLinks.each(function(i, elem) {
        const item = {
            name: $(elem).text(),
            link: $(elem).attr('href')
        };

        if ('Buddhanet eBooks Home' !== item.name) {
            cats.push(item);
        }
    });

    processCategories(cats);
});
