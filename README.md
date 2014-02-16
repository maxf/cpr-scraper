cpr-scraper
===========

A tool to scrape the UK Civil Procedure Rules (CPR) pages and put them in epub format for e-book readers.

## Description

This is a node.js application that fetches pages from the CPR and
generates epub files.

I just wrote this to teach myself node.js, but I have not current plans to push it further. But do get in touch if you're interested.


## Running

1. clone this directory
2. install node modules: `npm install request cheerio async`
3. run `run.sh`

This will produce two `.epub` files, one for each URL given in the `run.sh` file.



## Disclaimer

The software and its output are provided without any warranty of any kind, in particular with regards to the text of the CPR. The definitive source for the CPR is the UK Ministry of Justice website.
