#!/bin/sh
node scrape
rm cpr.epub
cd scraped
zip -q -r ../cpr.epub *

