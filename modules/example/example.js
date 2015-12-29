/*
  The module load event handler. This function
  registers the module's block and page handlers.
*/
(function () {
  // I. Register the block handler.
  registerBlockHandler ('example_block', 'modules/example/templates/block.html');

  // II. Register the page handler.
  registerPageHandler ('example_page', 'modules/example/templates/page.html');
}) ();