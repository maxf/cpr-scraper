/* jshint node: true, unused: vars */
/* global require, setTimeout */

(function() {
  "use strict";

  var request = require('request'),
      cheerio = require('cheerio'),
      async = require('async'),
      fs = require('fs'),
      index_page_url = "http://www.justice.gov.uk/courts/procedure-rules/civil/rules",
      html_subdir = "scraped",

      html_header = function(title) {
        return "<!DOCTYPE html><html><head><title>"+title+"</title>"+"<meta charset='UTF-8'></head><body><h1>"+title+"</h1>";
      },

      html_footer = function(title) {
        return "</body></html>";
      };

  request(index_page_url, function(err, resp, body) {
    var a, $, index_links, index_links_array=[];
    if (err) {
      throw err;
    }
    $ = cheerio.load(body);
    index_links = $("#content table a");

    // clean up results and put in array
    for (a in index_links) {
      if (index_links.hasOwnProperty(a) && index_links[a].name==="a" && index_links[a].attribs && index_links[a].attribs.href) {
        index_links_array.push(index_links[a].attribs.href);
      }
    }

    // debug
//    index_links_array = [
//      "http://www.justice.gov.uk/courts/procedure-rules/civil/rules/part51/practice-direction-51i-the-second-mediation-service-pilot-scheme",
//      "http://www.justice.gov.uk/courts/procedure-rules/civil/rules/devolution_issues",
//      "http://www.justice.gov.uk/courts/procedure-rules/civil/rules/devolution_issues_welsh"
//      "http://www.justice.gov.uk/courts/procedure-rules/civil/rules/appforwarrant",
//      "http://www.justice.gov.uk/courts/procedure-rules/civil/rules/part08/pd_part08b",
//      "http://www.justice.gov.uk/courts/procedure-rules/civil/rules/insolvency_pd"
//    ];

    async.forEach(index_links_array, function(index_link, callback) {

      function fetch_page () {
        request(index_link, function(err, resp, body) {
          var html, file, title, fileTitle, context;
          if(err) {
            throw err;
          }
          $ = cheerio.load(body);
          try {
            context = $("div.article");
            $("a[href='#Back-to-top']", context).remove();
            $("a:empty", context).remove();
            $("div.backToTop", context).remove();
            $("p:empty", context).remove();
            $("table", context).remove();
            html = context.html();

            html = html.replace(/<!--.*-->/gim,'').
                        replace(/( ){2,}/gm,' ').
                        replace(/<\/p>/g,'</p>\n').
                        replace(/<p>/g,'\n<p>').
                        replace(/^ +/gm,'').
                        replace(/(\r\n|\n|\r){2,}/gm,'\n');
            title = $("h1").first().text();
          } catch(e) {
            var delay = Math.floor(Math.random()*10000);
            console.log("Failed fetching " + index_link + " ("+resp.statusCode+"). Waiting "+delay+"ms before retrying.");
            setTimeout(fetch_page, delay);
            return;
          }
          fileTitle = title.replace(/^\s*|\s(?=\s)|\s*$/g, "").replace(/[^a-z0-9]+/ig,'_').toLowerCase() + ".html";
          file = fs.openSync(html_subdir + "/" + fileTitle, "w");
          fs.writeSync(file,html_header(title) + html + html_footer());
          process.stdout.write(".");
          fs.closeSync(file);
          callback();
        });
      }
      fetch_page();
    },
    function(err) {
      if (err) {
        throw err;
      }
      return 1;
    });
  });
}());
