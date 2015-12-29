/*
  This module is a simple
  wrapper for the Lightbox2 library
  (http://lokeshdhakar.com/projects/lightbox2/).
  When loaded, this module loads the Lightbox2
  library and its associated stylesheets.
*/

/*
  This function loads the Lightbox2 library and
  its associated stylesheets.
*/
(function () {
  // I. Load the Lightbox2 library.
  loadScript ('modules/lightbox/lib/lightbox2/dist/js/lightbox.js',
    function () {
      // II. Load the CSS files.
      $.getCSS ('modules/lightbox/lib/lightbox2/dist/css/lightbox.css');

      // III. Set the default Lightbox settings.
      lightbox.option ({
        positionFromTop: 200
      });
  });
}) ();