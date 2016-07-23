/**
 * Data scraping to consolidate some item data for 'Thea: The Awakening' using Nightmare.js
 *
 * Get stats tables for all types of an item type
 * The item type page lists all of the types available based on primary material
 * Get those page urls and then grab tables from them
 *
 * @author   John Tribolet <john@tribolet.info>
 * @created  2016-07-05 22:22
 */

"use strict";

var Nightmare = require('nightmare');
var cheerio   = require('cheerio');
var fs        = require('fs');
var async     = require('async');
var tidy      = require('tidy-html5').tidy_html5;

const util    = require('util');


var nightmareConfig = {
    show: false,
    fullscreen: false
};
var nightmare = Nightmare(nightmareConfig);

var baseUrl = 'http://thea-the-awakening.wikia.com';

// @todo Set array of main pages to scrape or ID an existing page to be used
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
        console.log('Links Found: '); console.log(subTypeLinks);
        consolidateStatsTables(subTypeLinks);
    })
    .catch(function (error) {
        console.error('Error getting sub-type links: ', error);
    });


/**
 * map/reduce array of links to array of tables to combined table
 */
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
                var $item     = cheerio.load(item);
                $combined('tbody').append($item('tbody tr'));
                nextItem      = $combined.html();
            }

            callback(null, nextItem);
        }, function(err, combinedTable) {
            cleanUpTable(combinedTable);
        } );
    });

}

/**
 * Get stats table function for use in async.map, callback sig (err, transformed)
 */
function getStatTable(link, callback) {
    // hit the subtype pages to get additional data
    var nightmare2 = Nightmare(nightmareConfig);
    nightmare2
        .goto(baseUrl + link)
        .evaluate(function () {
            // get the table HTML for now
            return document.querySelector('.wikitable.sortable').outerHTML;
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

/**
 * clean up the combined table: fix image srcs, remove unneeded code, etc
 * tidy and add js/css to make dataTables work
 *
 * @todo Add H1 to show class of item on final doc
 * @todo Gen final filename off of top-level item
 */
function cleanUpTable(table) {
    // fs.writeFile('table-unedited.html', table);

    var $ = cheerio.load(table);

    // fix images, they were lazy loaded originally
    $('img').each(function(i, element) {
        var dataSrc = $(this).attr('data-src');
        if (dataSrc) {
            $(this).attr('src', dataSrc);
        }
    });

    // add classes for dataTables
    $('table').addClass('table table-bordered table-hover');

    $('noscript').remove();

    // run through tidy and insert JS/CSS
    var tidyOptions = {
        indent: 'auto',
        'indent-spaces': 2,
        wrap: 132,
        markup: 'yes',
        'output-xml': 'yes',
        'input-xml': 'no',
        'numeric-entities': 'yes',
        'quote-marks': 'yes',
        'quote-nbsp': 'yes',
        'quote-ampersand': 'no',
        'break-before-br': 'no',
        'uppercase-tags': 'no',
        'uppercase-attributes': 'no',
    }
    var $doc = cheerio.load(tidy($.html(), tidyOptions));

    var jsAndCss = `
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>

    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.6/css/bootstrap.min.css">

    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.12/css/dataTables.bootstrap.min.css">
    <script type="text/javascript" src="https://cdn.datatables.net/1.10.12/js/jquery.dataTables.min.js"></script>
    <script type="text/javascript" src="https://cdn.datatables.net/1.10.12/js/dataTables.bootstrap.min.js"></script>

    <script>
        $(document).ready(function() {
            $(".wikitable").DataTable();
        } );
    </script>
    `;

    $doc('head').append(jsAndCss);

    fs.writeFile('bows-doc-combined-table-cleaned.html', $doc.html());
}
