/*
  The Analytics module uses Google Analytics to
  track page visits. The module loads the Google
  Analytics library and, once loaded, the Google
  Analytics library can be used to track additional
  events.
*/

/*
  The Analytics Settings file defines the property
  Id and other parameters needed to connect to
  Google Analytics and track page visits.
*/
var analytics_SETTINGS_URL = 'modules/analytics/settings.xml';

/*
  The module's load event handler. This function
  loads the Google Analytics library and sends a
  page visit event to Google Analytics for the
  current page.
*/
(function () {
  // Define the failure event handler.
  var failure = function () {
    strictError ('[analytics] Error: an error occured while trying to load the Analytics module.');
  }

  // I. Load the configuration settings.
  analytics_loadSettings (analytics_SETTINGS_URL,
    function (settings) {
      // II. Load Google Analytics.
      // Note: This code was taken verbatim from https://developers.google.com/analytics/devguides/collection/analyticsjs/.
      (function (i,s,o,g,r,a,m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
          (i[r].q = i[r].q || []).push (arguments)
        },
        i[r].l = 1 * new Date ();

        a = s.createElement (o),
        m = s.getElementsByTagName (o) [0];

        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore (a,m)
      })(window,document,'script','http://www.google-analytics.com/analytics.js','ga');

      // III. Create the Property Tracker. 
      ga('create', settings.pageVisitPropertyId, 'auto');

      // IV. Update the Page Visit count.
      ga('send', 'pageview');

      // V. Register a Page Load event handler that logs page view events.
      PAGE_LOAD_HANDLERS.push (
        function (done, id) {
          var url = getContentURL (id);
          ga ('set', 'page', url);
          ga ('send', 'pageview');
          done ();
      });
    },
    failure
  );
}) ();

/*
  analytics_loadSettings accepts three arguments:

  * url, a URL string
  * success, a function that accepts an Analytics
    Settings object
  * and failure, a function that does not accept
    any arguments.

  analytics_loadSettings loads and parses the
  Analytics Settings document referenced by url and
  passes the result to success. If an error occurs,
  it calls failure instead of calling success. 
*/
function analytics_loadSettings (url, success, failure) {
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      success (analytics_parseSettings (doc));
    },
    error: function (request, status, error) {
      strictError ('[analytics][analytics_loadSettings] Error: an error occured while trying to load "' + url + '".');
      failure ();
    }
  });
}

/*
  analytics_parseSettings accepts an XML Document
  string that represents an Analytics Settings
  Document, parses the document, and returns the
  resulting Analytics Settings object.
*/
function analytics_parseSettings (doc) {
  return {
    pageVisitPropertyId: $('settings > pageVisitPropertyId', doc).text ()
  };
}