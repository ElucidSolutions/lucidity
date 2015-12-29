/*
  The video module can be used to play videos using
  the VideoJS library. More information about the
  VideoJS library can be found here:
  http://www.videojs.com.
*/

/*
  The global video_PLAYERS array lists the VideoJS
  Player objects that have been loaded.
*/
var video_PLAYERS = {};

/*
  The global video_LOAD_HANDLERS caches the Video
  Player load event handlers keyed by player
  ID. These functions will be executed one their
  associated Video Player has been loaded.
*/
var video_LOAD_HANDLERS = {};

/*
  The module's load event handler. This function
  registers this module's block handlers with the
  system.
*/
(function () {
  // I. Load libraries.
  loadScript ('modules/video/lib/video-js/video.js',
    function () {
      // II. Load the CSS files.
      $.getCSS ('modules/video/lib/video-js/video-js.css');

      // III. Configure the Video.js library.
      videojs.options.flash.swf = 'modules/video/lib/video-js/video-js.swf';

      // III. Register the block handlers.
      registerBlockHandlers ({
        video_player_block:  video_playerBlock,
        video_example_block: 'modules/video/templates/example_block.html'
      });
  });    
}) ();

/*
  video_playerBlock handles 'video_player_block'
  blocks.

  Every 'video_player_block' element must contain
  a video element containing the attributes and
  nodes described in https://github.com/videojs/
  video.js/blob/stable/docs/index.md.

  Note: The video element must not contain the
  'data-setup' attribute.

  This function initializes the nested video
  element using the VideoJS library and calls
  continuation.
*/
function video_playerBlock (blockElement, done) {
  var playerElement = $('> video', blockElement);

  var playerElementId = null;
  if (playerElement.attr ('id')) {
    playerElementId = playerElement.attr ('id');
  } else {
    playerElementId = getUniqueId ();
    playerElement.attr ('id', playerElementId);
  }

  blockElement.addClass ('video_player');

  var player = video_PLAYERS [playerElementId];
  if (player) {
    player.dispose ();
  }

  videojs (playerElementId, {autoplay: true}, function () {
    video_PLAYERS [playerElementId] = this;

    var handlers = video_LOAD_HANDLERS [playerElementId];
    for (var i = 0; i < handlers.length; i ++) {
      var handler = handlers [i];
      handler (this);
    }

    done ();
  });
}

/*
*/
function video_registerLoadHandler (playerId, handler) {
  var player = video_PLAYERS [playerId];
  if (player) {
    return handler (player);
  }
  if (!video_LOAD_HANDLERS [playerId]) {
    video_LOAD_HANDLERS [playerId] = [];
  }
  video_LOAD_HANDLERS [playerId].push (handler);
}
