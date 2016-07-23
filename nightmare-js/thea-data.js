/**
 * Data scraping to consolidate some item data for 'Thea: The Awakening' using Nightmare.js
 *
 * @author   John Tribolet <john@tribolet.info>
 * @created  2016-07-05 22:22
 */

"use strict";

var Nightmare = require('nightmare');
var cheerio   = require('cheerio');
var fs        = require('fs');
var async     = require('async');

var nightmareConfig = { show: false, fullscreen: false };
var nightmare = Nightmare(nightmareConfig);

const util = require('util');

// Get stats tables for all types of an item type
// The item type page lists all of the types available based on primary material
// Get those page urls and then grab tables from them

var baseUrl = 'http://thea-the-awakening.wikia.com';
var url = baseUrl + '/wiki/Bows';

nightmare
    .goto(url)
    .wait('#WikiaPage')
    .evaluate(function () {
        // get the links to the sub-type pages
        var links = document.querySelectorAll('.article-table.sortable td:nth-child(2) a');

        return Array.prototype.map.call(links, function (e) {
            return e.getAttribute('href');
        });

    })
    .end()
    .then(function (subTypeLinks) {
        console.log(subTypeLinks);
        consolidateStatsTables(subTypeLinks);
    })
    .catch(function (error) {
        console.error('Error getting sub-type links: ', error);
    });

function consolidateStatsTables(subTypeLinks) {

    async.map(subTypeLinks, getStatTable, function(err, statTables) {
        async.reduce(statTables, null, function(memo, item, callback) {

            var nextItem;
            if (null == memo) {
                nextItem = item;
            }
            else {
                // add the rows from the current table into the combined table
                var $combined = cheerio.load(memo);
                var $item = cheerio.load(item);
                $combined('tbody').append($item('tbody tr'));
                nextItem = $combined.html();
            }

            callback(null, nextItem);
        }, function(err, combinedTable) {
            console.log('Clean up combined table');
            cleanUpTable(combinedTable);
        } );
    });

}

// get stats table function for use in async.map, callback is (err, transformed)
function getStatTable(link, callback) {
    // hit the subtype pages to get additional data
    var nightmare2 = Nightmare(nightmareConfig);
    nightmare2
        .goto(baseUrl + link)
        .evaluate(function () {
            // get the table HTML for now
            return document.querySelector('.wikitable.sortable').outerHTML
        })
        .end()
        .then(function (tableData) {
            // not sure why this is needed but tried to pass the cheerio objects and it wasn't working for some reason
            // @todo Come back and try to debug passing the cheerio objects instead of html
            callback(null, tableData);
        })
        .catch(function (error) {
            console.error('Error getting sub-type data table: ', error);
            callback(error, null);
        });
}

// clean up the combined table: fix image srcs, remove unneeded code, etc
function cleanUpTable(table) {
    // fs.writeFile('table-unedited.html', table);

    var $ = cheerio.load(table);

    // fix images
    $('img').each(function(i, element) {
        var dataSrc = $(this).attr('data-src');
        if (dataSrc) {
            // console.log(dataSrc);
            // console.log(element);
            $(this).attr('src', dataSrc);
        }
    });

    // add classes for dataTables
    $('table').addClass('table table-bordered table-hover');

    $('noscript').remove();

    $('span').each(function(i, elem) {
        console.log( $(this).text() );
    });

    console.log('Write combined table out');
    fs.writeFile('bows-new-combined-table-cleaned.html', $.html());
}
