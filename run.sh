#!/bin/sh
rm -f cpr1.epub scraped/OPS/*
node scrape http://www.justice.gov.uk/courts/procedure-rules/civil/rules/ "Civil Procedure Rules - Rules & Practice Directions"
cd scraped
zip -q -r ../cpr1.epub *
echo volume 1 done
cd ..

rm -f cpr2.epub scraped/OPS/*
node scrape http://www.justice.gov.uk/courts/procedure-rules/civil/protocol/ "Civil Procedure Rules - Pre-Action Protocols"
cd scraped
zip -q -r ../cpr2.epub *
echo volume 2 done
cd ..

rm -f scraped/OPS/*
