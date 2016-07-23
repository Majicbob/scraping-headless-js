# Scraping and Automation
A collection of various scraping and automation scripts I wrote.
Some are for checking out some of the headless JS tech like Casper, Phantom, Nightmare, etc.
Also includes some notes I made while researching and comparing some of the newer options. Previously I had used Selenium for everything (testing, automation, and advanced scraping) the majority of the time.

At some point I will write up a detailed comparison with benchmark data for several common use cases.

## Headless Browsers and Helpers
* [Selenium](http://docs.seleniumhq.org/) - Full browser automation tool that supports both head and headless mode, as well as a large amount of browsers. It also has binding to most popular languages and testing frameworks.
* [PhantomJS](http://phantomjs.org/) - A headless WebKit scriptable with a JavaScript API. Similar to Selenium but more lightweight, faster, and easier to setup/use. This comes at the cost of some features.
* [SlimerJS](https://slimerjs.org/) - Similar to PhantomJS but it uses the Gecko engine instead of WebKit and isn't completely headless yet.


* [CasperJS](http://casperjs.org/) - Navigation scripting & testing for PhantomJS and SlimerJS. Makes some stuff much simpler to use and work with.
* [NightmareJS](https://github.com/segmentio/nightmare) - High level browser automation library that uses [Electron](http://electron.atom.io/) under the hood.


* @TODO - Add WebDriver info with PhantomJS integration

## Projects
List of specific projects with some general info about them. Additional details available in the project README.

*