/*
  The Rate module defines a simple page rating
  system. This module creates two blocks that
  expand into up-vote/down-vote buttons. When users
  click on these buttons, they trigger a Google
  Analytics hit event.

  This module depends on the Analytics module.
*/

/*
  The module's load event handler. This function
  registers the module's block handlers.
*/
(function () {
  // I. Register the block handlers.
  registerBlockHandlers ({
    rate_block:           'modules/rate/templates/rate_block.html',
    rate_up_vote_block:   rate_upVoteBlock,
    rate_down_vote_block: rate_downVoteBlock
  });
}) ();

/*
  rate_upVoteBlock accepts two arguments:

  * blockElement, a JQuery HTML Element
  * done, a function that accepts a JQuery HTML
    Element

  rate_upVoteBlock will add an on-click event
  handler to blockElement that will send Google
  analytics an "Up Vote" event notification
  whenever a user clicks on the element.
  rate_upVoteBlock then calls done.
*/
function rate_upVoteBlock (blockElement, done) {
  // I. Register the on-click event handler.
  blockElement.click (
    function () {
      blockElement.addClass ('rate_clicked');

      // Send an "Up Vote" event notification to Google Analytics.
      ga ('send', 'event', 'Up Vote', 'clicked');
  });

  // II. Continue.
  done ();
}

/*
  rate_downVoteBlock accepts two arguments:

  * blockElement, a JQuery HTML Element
  * done, a function that accepts a JQuery HTML
    Element

  rate_downVoteBlock will add an on-click event
  handler to blockElement that will send Google
  analytics a "Down Vote" event notification
  whenever a user clicks on the element.
  rate_downVoteBlock then calls done.
*/
function rate_downVoteBlock (blockElement, done) {
  // I. Register the on-click event handler.
  blockElement.click (
    function () {
      blockElement.addClass ('rate_clicked');

      // Send an "Down Vote" event notification to Google Analytics.
      ga ('send', 'event', 'Down Vote', 'clicked');
  });

  // II. Continue.
  done ();
}