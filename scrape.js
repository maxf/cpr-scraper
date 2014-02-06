/* jshint node: true, unused: vars, multistr: true */
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
        var head = '<?xml version="1.0" encoding="UTF-8"?>\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">\
  <head>\
    <title>'+title+'</title>\
    <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8"/>\
  </head>\
  <body>\
    <h1>'+title+'</h1>';
        return head;
      },

      html_footer = function(title) {
        return "</body></html>";
      };

  request(index_page_url, function(err, resp, body) {
    var a, $, index_links, index_links_array=[], opf_file, i, basename, manifest=[], spine=[];
    if (err) {
      throw err;
    }
    $ = cheerio.load(body);
    index_links = $("#content table a");

    // clean up results and put in array
    i=0;
    for (a in index_links) {
      if (index_links.hasOwnProperty(a) && index_links[a].name==="a" && index_links[a].attribs && index_links[a].attribs.href) {
        basename = index_links[a].attribs.href.replace(/http:\/\/www\.justice\.gov\.uk\/courts\/procedure-rules\/civil\/rules\//,'');
        basename = basename.replace('/','_');
        index_links_array.push({"href":index_links[a].attribs.href,"id":"id-"+(i++)});
      }
    }

    // generate the opf file
    opf_file = fs.openSync(html_subdir+"/OPS/content.opf", "w");
    fs.writeSync(opf_file, '<?xml version="1.0" encoding="UTF-8"?>\
\
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="EPB-UUID" version="2.0">\
   <metadata xmlns:opf="http://www.idpf.org/2007/opf"\
             xmlns:dc="http://purl.org/dc/elements/1.1/">\
      <dc:title>Civil Procedure Rule</dc:title>\
      <dc:publisher>Ministry of Justice</dc:publisher>\
      <dc:date opf:event="epub-publication">2014-01-01</dc:date>\
      <dc:subject>Legal</dc:subject>\
      <dc:source>gov.uk</dc:source>\
      <dc:rights>© 2014 Crown Copyright</dc:rights>\
      <dc:language>en-gb</dc:language>\
   </metadata>');

    // manifest
    for(i=0;i<index_links_array.length;i++) {
      basename = index_links_array[i].id;
      manifest.push('<item id="'+basename+'" href="'+basename+'.xhtml" media-type="application/xhtml+xml"/>');
    }
    fs.writeSync(opf_file, '<manifest>'+manifest.join('\n')+'</manifest>\n');

    // spine
    for(i=0;i<index_links_array.length;i++) {
      spine.push('<itemref idref="'+index_links_array[i].id+'" linear="yes"/>');
    }
    fs.writeSync(opf_file, '<spine>'+spine.join('\n')+'</spine>\n');

    fs.writeSync(opf_file, '</package>');
    fs.closeSync(opf_file);

//    // debug
//    index_links_array = [
//      {"href":"http://www.justice.gov.uk/courts/procedure-rules/civil/rules/part51/practice-direction-51i-the-second-mediation-service-pilot-scheme","basename":"part51_practice-direction-51i-the-second-mediation-service-pilot-scheme"},
//      {"href":"http://www.justice.gov.uk/courts/procedure-rules/civil/rules/devolution_issues","basename":"devolution_issues"},
//      {"href":"http://www.justice.gov.uk/courts/procedure-rules/civil/rules/devolution_issues_welsh","basename":"devolution_issues_welsh"},
//      {"href":"http://www.justice.gov.uk/courts/procedure-rules/civil/rules/appforwarrant","basename":"appforwarrant"},
//      {"href":"http://www.justice.gov.uk/courts/procedure-rules/civil/rules/part08/pd_part08b","basename":"part08_pd_part08b"},
//      {"href":"http://www.justice.gov.uk/courts/procedure-rules/civil/rules/insolvency_pd","basename":"insolvency_pd"}
//    ];

    async.forEach(index_links_array, function(index_link, callback) {

      function fetch_page () {
        request(index_link.href, function(err, resp, body) {
          var html, file, title, context;
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
            $("hr", context).remove(); // for now @@
            $("img", context).remove(); // for now @@
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
            console.log("Failed fetching " + index_link.href + " ("+resp.statusCode+"). Waiting "+delay+"ms before retrying.");
            setTimeout(fetch_page, delay);
            return;
          }
          file = fs.openSync(html_subdir + "/OPS/" + index_link.id + ".xhtml", "w");
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
