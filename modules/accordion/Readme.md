Accordion Module
================

The Accordion module can be used to easily display content within accordion elements.

```javascript
/*
  The Accordion module can be used to easily
  display content within accordion elements.
*/
```

The Load Event Handler
----------------------

The Accordion module defines two block types, Accordion Blocks and Accordion Item Blocks, that represent collapsible accordions and their items.

The module's load event handler registers the block handlers for these types.

```javascript
// Registers the block handlers.
MODULE_LOAD_HANDLERS.add (
  function (done) {
    block_HANDLERS.addHandlers ({
      accordion_block:      accordion_block,
      accordion_item_block: accordion_itemBlock
    });
    done (null);
});
```

The Accordion Block Handler
---------------------------

Accordion Blocks expand into accordion elements containing any nested Accordion Block Item elements.

```javascript
/*
  Accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that accepts two
    arguments: an Error object and a JQuery
    HTML Element

  replaces context.element with a UL element
  containing any Accordion Item Blocks nested
  within it; and passes the resulting element
  to done.
*/
function accordion_block (context, done) {
  context.element.addClass ('accordion');
  done (null);
}
```

The Accordion Item Block Handler
--------------------------------

Accordion Item Blocks expand into accordion item elements that have the proper click event handlers set.

```javascript
/*
  Accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that accepts two
    arguments: an Error object and a JQuery
    HTML Element.

  context.element must be a DIV element that
  has three child DIVs:

  * the first, must belong to the
    "accordion_item_number" class and contain a
    single text node
  * the second, must belong to the
    "accordion_item_title" class
  * and the third, must belong to the
    "accordion_item_body" class.

  This function replaces context.element
  with a LI that has a header and body
  element. The header will display the string
  given in the accordion_item_number and the
  accordion_item_title elements. The body will
  display the content in the accordion_item_body
  element.

  This function will then pass the resulting
  element to done.

  Note: Item blocks will expand any blocks
  nested within their body elements. As a result,
  content editors can wrap content within Quote
  blocks to load content on demand.
*/
function accordion_itemBlock (context, done, expand) {
  getBlockArguments ([
      {'name': 'accordion_item_number', 'text': true,  'required': true},
      {'name': 'accordion_item_title',  'text': false, 'required': true},
      {'name': 'accordion_item_body',   'text': false, 'required': true}
    ],
    context.element,
    function (error, blockArguments) {
      if (error) { return done (error); }

      var expanded = false;
      var element = $('<div></div>')
        .addClass ('accordion_item')
        .append ($('<div></div>')
          .addClass ('accordion_item_header')
          .append ($('<div></div>')
            .addClass ('accordion_item_header_left')
            .text (blockArguments.accordion_item_number.trim ()))
          .append ($('<div></div>')
            .addClass ('accordion_item_header_middle')
            .append (blockArguments.accordion_item_title))
          .append ($('<div></div>')
            .addClass ('accordion_item_header_right'))
          .click (function () {
              if (expanded) {
                element.toggleClass ('accordion_expanded');
                return blockArguments.accordion_item_body.slideToggle ();
              }
              expand (blockArguments.accordion_item_body,
                function () {
                  element.toggleClass ('accordion_expanded');
                  blockArguments.accordion_item_body.slideToggle ();
                  expanded = true;
              });
            }))
        .append (blockArguments.accordion_item_body.hide ());

      context.element.replaceWith (element);
      done (null, null);
  });
}
```

Accordion Block Example
-----------------------

The following illustrates how Accordion blocks can be embedded within HTML templates.

```html
<div class="accordion_block">
  <div class="accordion_item_block">
    <div class="accordion_item_number">Step 1</div>
    <div class="accordion_item_title">First Example</div>
    <div class="accordion_item_body">
      <h3>The First Item</h3>
      <p>This is the first item.</p>
    </div>
  </div>
  <p>Sample content between items.</p>
  <div class="accordion_item_block">
    <div class="accordion_item_number">Step 2</div>
    <div class="accordion_item_title">Second Example: This title is too long for small mobile screen sizes. It will need to wrap.</div>
    <div class="accordion_item_body">
      <h3>The Second Item</h3>
      <p>This is the second item.</p>
    </div>
  </div>
  <div class="accordion_item_block">
    <div class="accordion_item_number">Step 3</div>
    <div class="accordion_item_title">Third Example: The following is an embedded page that takes advantage of the Accordion Modules support for lazy loading</div>
    <div class="accordion_item_body">
      <div class="block_quote_block">
        <div class="page_block">example_page</div>
      </div>
    </div>
  </div>
</div>
```

Generating Source Files
-----------------------

You can generate this module's source files using [Literate Programming](https://github.com/jostylr/literate-programming), simply execute:
`literate-programming "Readme.md"`
from the command line.

<!---
### accordion.js
```
_"Accordion Module"

_"The Load Event Handler"

_"The Accordion Block Handler"

_"The Accordion Item Block Handler"
```
[accordion.js](#accordion.js "save:")
-->
