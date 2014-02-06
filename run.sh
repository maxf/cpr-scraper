#!/bin/sh
node scrape
rm cpr.epub
cd scraped
zip -r ../cpr.epub *

