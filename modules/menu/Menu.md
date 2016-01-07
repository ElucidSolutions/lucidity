Menu Module
===========

The Menu module provides developers with a way to organize content into tree-like structures composed of sections and pages.

The Menu module is defined by menu.js. This file defines the module's base classes, block handlers, and load event handler. The opening to this file reads.

```javascript
/*
  The Menu module provides developers with a way
  to organize content into tree-like structures
  composed of sections and pages.
*/
```

The Load Event Handler
----------------------

The Menu module's Load Event Handler loads the CSS stylesheets used by the module. 

```javascript
/*
*/
(function () {
  // I. Load the CSS stylesheets.
  $.getCSS ('modules/menu/theme/menu.css');
}) ();
```

The Element Class
-----------------

The Element class defines a base class for both the Page and Section classes.

```javascript
/*
*/
function menu_Element (id, title) {
  this.id    = id;
  this.title = title;
}

/*
*/
// menu_Element.prototype.getParent = function (success, failure) {}

/*
*/
// menu_Element.prototype.getRawTemplate = function (success, failure) {} 

/*
*/
// menu_Element.prototype.getFirstPage = function (success, failure) {}

/*
*/
// menu_Element.prototype.getElement = function (id, success, failure) {} 

/*
*/
// menu_Element.prototype.getLinkElement = function (success, failure) {}

/*
*/
menu_Element.prototype.getAncestors = function (success, failure) {
  this.getParent (
    function (parent) {
      parent ? parent.getPath (success, failure) : success ([]);
    },
    failure
  );
}

/*
*/
menu_Element.prototype.getPath = function (success, failure) {
  var self = this;
  this.getAncestors (
    function (ancestors) {
      ancestors.push (self);
      success (ancestors);
    },
    failure
  );
}

/*
*/
menu_Element.prototype.getLevel = function (success, failure) {
  var self = this;
  this.getPath (
    function (path) {
      success (path.length);
    },
    failure
  );
}

/*
*/
menu_Element.prototype.getLine = function (success, failure) {
  this.getPath (
    function (path) {
      success (path.map (
        function (element) {
          return element.id;
      }));
    },
    failure
  );
}

/*
*/
menu_Element.prototype.addAttributes = function (element, success, failure) {
  var self = this;
  this.getLevel (
    function (level) {
      success (element
        .attr ('data-menu-id', self.id)
        .attr ('data-menu-level', level)
      );
    },
    failure
  );
}

/*
*/
menu_Element.prototype.getTemplate = function (success, failure) {
  var self = this;
  this.getRawTemplate (
    function (rawTemplate) {
      rawTemplate.addClass ('menu_template');
      self.addAttributes (rawTemplate, success, failure);
    },
    failure
  );
} 

/*
*/
menu_Element.prototype.getFullTemplate = function (success, failure) {
  this.getPath (
    function (path) {
      var element = path.shift ();
      element.getTemplate (
        function (template) {
          $('.menu_id_block', template).replaceWith (element.id);
          fold (
            function (template, nestedElement, success, failure) {
              nestedElement.getTemplate (
                function (nestedTemplate) {
                  $('.menu_id_block', nestedTemplate).replaceWith (nestedElement.id);
                  $('.menu_hole_block', template).replaceWith (nestedTemplate);
                  success (template);
                },
                failure
              );
            },
            template,
            path,
            success,
            failure
          );
        }
      );
    },
    failure
  )
}

/*
*/
menu_Element.prototype.getLabelElement = function (success, failure) {
  this.addAttributes (
    $('<span></span>')
      .addClass ('menu_label')
      .addClass ('menu_title')
      .html (this.title),
    success,
    failure
  );
}

/*
*/
menu_Element.prototype._getLinkElement = function (id, success, failure) {
  this.addAttributes (
    $('<a></a>')
      .addClass ('menu_link')
      .addClass ('menu_title')
      .attr ('href', getContentURL (id))
      .html (this.title),
    success,
    failure
  );
}

/*
*/
menu_Element.prototype.getContentsItemElement = function (numColumns, depth, success, failure) {
  var element = $('<li></li>').addClass ('menu_contents_item');

  var self = this;
  this.addAttributes (element,
    function () {
      self.getLinkElement (
        function (linkElement) {
          success (element.append (linkElement));
        },
        failure
      );
    },
    failure
  );
}

```

The Page Class
--------------

The Page class defines the basic block elements and functions for pages.

```javascript
/*
*/
function menu_Page (id, title) {
  menu_Element.call (this, id, title);
}

/*
*/
menu_Page.prototype = Object.create (menu_Element.prototype);

/*
*/
menu_Page.prototype.constructor = menu_Page;

/*
*/
menu_Page.prototype.getFirstPage = function (done) {
  done (this);
}

/*
*/
menu_Page.prototype.getElement = function (id, done) {
  done (this.id === id ? this : null);
}

/*
*/
menu_Page.prototype.getTemplate = function (success, failure) {
  menu_Element.prototype.getTemplate.call (this,
    function (template) {
      success (template.addClass ('menu_page_template'));
    },
    failure
  );
}

/*
*/
menu_Page.prototype.getLabelElement = function (success, failure) {
  menu_Element.prototype.getLabelElement.call (this,
    function (element) {
      success (element.addClass ('menu_page_label'));
    },
    failure
  );
}

/*
*/
menu_Page.prototype.getLinkElement = function (success, failure) {
  menu_Element.prototype._getLinkElement.call (this, this.id,
    function (element) {
      success (element.addClass ('menu_page_link'));
    },
    failure
  );
}

/*
*/
menu_Page.prototype.getContentsItemElement = function (numColumns, depth, success, failure) {
  menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth,
    function (element) {
      success (element.addClass ('menu_contents_page_item'));
    },
    failure
  );
}
```

The Section Class
-----------------

Sections are pages that may contain other subsections and pages. The Section class provides a base class that can be used to represent sections.

```javascript
/*
*/
function menu_Section (id, title) {
  menu_Element.call (this, id, title);
}

/*
*/
menu_Section.prototype = Object.create (menu_Element.prototype);

/*
*/
menu_Section.prototype.constructor = menu_Section;

/*
*/
// menu_Section.prototype.getChildren = function (success, failure) {}

/*
*/
menu_Section.prototype.getElement = function (id, success, failure) {
  if (this.id === id) {
    return success (this);
  }
  this.getChildren (
    function (children) {
      iter (
        function (child, next) {
          child.getElement (id,
            function (descendant) {
              descendant ? success (descendant) : next ();
            },
            failure
          );
        },
        children,
        function () {
          success (null);
        }
      );
    },
    failure 
  );
}

/*
*/
menu_Section.prototype.getFirstPage = function (success, failure) {
  this.getChildren (
    function (children) {
      iter (
        function (child, next) {
          child.getFirstPage (
            function (page) {
              page ? success (page) : next ();
            },
            failure
          );
        },
        children,
        function () {
          success (null);
        }
      );
    },
    failure
  );
}

/*
*/
menu_Section.prototype.getTemplate = function (success, failure) {
  menu_Element.prototype.getTemplate.call (this,
    function (template) {
      success (template.addClass ('menu_section_template'));
    },
    failure
  );
}

/*
*/
menu_Section.prototype.getLabelElement = function (success, failure) {
  menu_Element.prototype.getLabelElement.call (this,
    function (element) {
      success (element.addClass ('menu_section_label'));
    },
    failure
  );
}

/*
*/
menu_Section.prototype.getLinkElement = function (success, failure) {
  var self = this;
  this.getFirstPage (
    function (page) {
      if (!page) {
        strictError ('[menu][menu_Section.getLinkElement] Error: an error occured while trying to create a new section link. The section is empty.');
        return failure ();
      }
      self._getLinkElement (page.id,
        function (element) {
          success (element.addClass ('menu_section_link'));
        },
        failure
      );
    },
    failure
  );
}

/*
*/
menu_Section.prototype.getContentsItemElement = function (numColumns, depth, success, failure) {
  var self = this;
  menu_Page.prototype.getContentsItemElement.call (this, numColumns, depth,
    function (element) {
      element.addClass ('menu_section_contents_item');
      if (depth === 0) {
        return success (element);
      }
      self.getContentsElement (numColumns, depth,
        function (contentsElement) {
          success (element.append (contentsElement));
        },
        failure
      );
    },
    failure
  );
}

/*
*/
menu_Section.prototype.getContentsElement = function (numColumns, depth, success, failure) {
  var element = $('<ol></ol>').addClass ('menu_contents');

  var self = this;
  this.addAttributes (element,
    function () {
      if (depth === 0) {
        return success (element);
      }
      self.getChildren (
        function (children) {
          map (
            function (child, success, failure) {
              child.getContentsItemElement (numColumns, depth - 1, success, failure);              
            },
            children,
            function (itemElements) {
              success (element.append (menu_columnate (numColumns, itemElements)));
            },
            failure
          );
        },
        failure
      );
    },
    failure
  );
}
```

The Database Class
------------------

```javascript
/*
*/
function menu_Database () {
}

/*
*/
// menu_Database.prototype.getElement = function (id, success, failure) {}

/*
*/
menu_Database.prototype.getLabelBlock = function (blockElement, success, failure) {
  this.getElement (
    blockElement.text (),
    function (page) {
      page.getLabelElement (
        function (element) {
          blockElement.replaceWith (element);
          success (element);
        },
        failure
      );
    },
    failure
  );
}

/*
*/
menu_Database.prototype.getLinkBlock = function (blockElement, success, failure) {
  this.getElement (
    blockElement.text (),
    function (page) {
      page.getLinkElement (
        function (element) {
          blockElement.replaceWith (element);
          success (element);
        },
        failure
      );
    },
    failure
  );
}

/*
*/
menu_Database.prototype.getContentsBlock = function (blockElement, success, failure) {
  var self = this;
  getBlockArguments ([
      {'name': 'menu_id',                  'text': true, 'required': true},
      {'name': 'menu_num_columns',         'text': true, 'required': true},
      {'name': 'menu_max_level',           'text': true, 'required': true},
      {'name': 'menu_expand_level',        'text': true, 'required': true},
      {'name': 'menu_expandable',          'text': true, 'required': true},
      {'name': 'menu_selected_element_id', 'text': true, 'required': true}
    ],
    blockElement,
    function (blockArguments) {
      self.getElement (
        blockArguments.menu_id,
        function (section) {
          section.getLine (
            function (line) {
              section.getContentsElement (
                blockArguments.menu_num_columns,
                blockArguments.menu_max_level,
                function (element) {
                  menu_collapse   (blockArguments.menu_expand_level + 1, element);
                  menu_selectLine (line, element);

                  if (blockArguments.menu_expandable === 'true') {
                    menu_expandLine      (line, element);
                    menu_makeCollapsable (blockArguments.menu_expand_level + 1, element);
                  }

                  blockElement.replaceWith (element);

                  PAGE_LOAD_HANDLERS.push (
                    function (done, id) {
                      menu_deselect (element);
                      self.getElement (id,
                        function (newElement) {
                          newElement.getLine (
                            function (newLine) {
                              menu_selectLine (newLine, element);
                              menu_expandLine (newLine, element);
                            },
                            done
                          );
                        },
                        done
                      );
                      done ();
                  });

                  success (element);
                },
                failure
              );
            },
            failure
          );
        },
        failure
      );
    },
    failure
  );
}
```

Auxiliary Functions
-------------------

```javascript
/*
*/
function menu_columnate (numColumns, elements) {
  var columns = [];
  var numElements = elements.length / numColumns;
  for (var i = 0; i < numColumns; i ++) {
    columns.push (
      $('<div></div>')
        .addClass ('menu_column')
        .append (elements.slice (i * numElements, (i + 1) * numElements)));
  }
  return columns;
}

/*
*/
function menu_deselect (element) {
  $('.menu_selected', element).removeClass ('menu_selected');
}

/*
*/
function menu_collapse (level, element) {
  $('.menu_contents_item', element).each (
    function (itemElementIndex, itemElement) {
      itemElement = $(itemElement);
      if (itemElement.attr ('data-menu-level') >= level) {
        itemElement.addClass ('menu_collapsed');
        $('> .menu_contents', itemElement).hide ();
      }
  });
}

/*
*/
function menu_expandLine (line, element) {
  line.forEach (
    function (id) {
      var element = $('.menu_contents_item[data-menu-id="' + id + '"]', element)
        .removeClass ('menu_collapsed');

      $('> .menu_contents', element).show ();
  });
}

/*
*/
function menu_selectLine (line, element) {
  line.forEach (
    function (id) {
      var element = $('.menu_contents_item[data-menu-id="' + id + '"]', element)
        .addClass ('menu_selected');
  });
}

/*
*/
function menu_makeCollapsable (level, element) {
  $('.menu_contents_item', element).each (
    function (itemElementIndex, itemElement) {
      itemElement = $(itemElement);
      if (itemElement.attr ('data-menu-level') >= level) {
        var linkElement = $('> .menu_section_link', itemElement);
        linkElement.click (
          function (event) {
            event.preventDefault ();
            itemElement.toggleClass ('menu_collapsed');
            $('> .menu_contents', itemElement).slideToggle ();
        });
      }
  });
}
```

The Default Stylesheet
----------------------

A set of default stylesheet ([theme/menu.sass.default](#The Default Stylesheet "save:")) is provided by the module. 

```sass
/* I. Variables */

$dark_gray: rgb(178, 178, 178)

$light_gray: rgb(249, 245, 242)

$medium_gray: rgb(221, 221, 221)

$primary-color: rgb(242,154,47)

$text_gray: rgb(51, 51, 51)

/* II. Mixins */

@mixin navHeader()
  background-color: $primary-color
  color:            white
  display:          block
  font-weight:      300
  padding:          10px 0px
  text-align:       center

@mixin navItem($indent)
  display:       block
  padding:       10px 10px 10px $indent
  border-bottom: 1px solid rgba(0, 0, 0, 0.2)

@mixin navItemHover($color, $background_color)
  background-color: $background_color !important
  color:            $color !important
  transition:       background-color 0.25s ease 0s, color 0.25s ease 0s

/* III. Declarations */

.menu_link
  color:           $text_gray
  text-decoration: none

.menu_contents
  margin:  0px
  padding: 0px

  h3
    font-size: 1.1em
    @include navHeader()

  li
    list-style: none

  .menu_link
    font-weight:     400
    font-size:       .9em

  .menu_link:hover
    @include navItemHover(rgb(242,155,48), rgb(255,255,204))

  .menu_link[data-menu-level="2"]
    @include navHeader()

  .menu_link[data-menu-level="3"]
    @include navItem(40px)

  .menu_link[data-menu-level="4"]
    @include navItem(60px)
    background: url('images/navArrow.png') no-repeat 15px 14px

  .menu_link[data-menu-level="4"]:hover
    @include navItemHover(rgb(226,118,18), rgb(254,214,176))

  .menu_link[data-menu-level="5"]
    @include navItem(80px)
    background: url('images/navCircle.png') no-repeat 55px 18px

  .menu_link[data-menu-level="5"]:hover
    @include navItemHover(rgb(183,85,19), rgb(247,186,119))

  .menu_section_link[data-menu-level="3"]
    background: url('images/collapse.png') no-repeat 15px 14px

  .menu_section_link[data-menu-level="4"]
    background: url('images/navArrowCollapse.png') no-repeat 15px 14px

  .menu_contents_item.menu_collapsed

    > .menu_section_link[data-menu-level="3"]
      background: url('images/expand.png') no-repeat 15px 14px
      
    > .menu_section_link[data-menu-level="4"]
      background: url('images/navArrowExpand.png') no-repeat 15px 14px

  .menu_contents_item.menu_selected

    > .menu_link[data-menu-level="3"] 
      @include navItemHover(rgb(242,155,48), rgb(255,255,204))

    > .menu_link[data-menu-level="4"]
      @include navItemHover(rgb(226,118,18), rgb(254,214,176))

    > .menu_link[data-menu-level="5"]
      @include navItemHover(rgb(183,85,19), rgb(247,186,119))

.menu_contents[data-menu-level="1"] 
  background-color: $light_gray

.menu_contents[data-menu-level="3"]
  background-color: $medium_gray

.menu_contents[data-menu-level="4"]
  background-color: $dark_gray
```

Generating Source Files
-----------------------

You can generate the Menu module's source files using [Literate Programming](https://github.com/jostylr/literate-programming), simply execute:
`literate-programming Menu.md`
from the command line.

<!---
#### Menu.js
```
_"Menu Module"

_"The Load Event Handler"

_"The Element Class"

_"The Page Class"

_"The Section Class"

_"The Database Class"

_"Auxiliary Functions"
```
[menu.js](#Menu.js "save:")
-->