var cheerio   = require('cheerio');
var fs        = require('fs');

function cleanUpTable(table) {
    $ = cheerio.load(table, {
            decodeEntities: true,
            //normalizeWhitespace: true
        });

    // fix images
    $('img').each(function(i, element) {
        var dataSrc = $(this).attr('data-src');
        if (dataSrc) {
            // console.log(dataSrc);
            // console.log(element);
            $(this).attr('src', dataSrc);
        }
    });

    $('noscript').remove();

    $('span').each(function(i, elem) {
        console.log( $(this).text() );
    });
    console.log('Write combined table out');
    fs.writeFile('bows-combined-table-cleaned.html', $.html());
}

fs.readFile('bows-combined-table.html', function (err, data) {
    cleanUpTable(data);
});