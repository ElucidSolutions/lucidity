/*
  The Menu module provides developers with a way
  to organize content into tree-like structures
  composed of sections and pages.
*/

/*
*/
(function () {
  // I. Load the CSS stylesheets.
  $.getCSS ('modules/menu/theme/menu.css');
}) ();

/*
*/
function menu_Element (parent, id, title) {
  this.parent = parent;
  this.id     = id;
  this.title  = title;
}

/*
*/
// menu_Element.prototype.getRawTemplate = function (success, failure) {} 

/*
*/
// menu_Element.prototype.getFirstPage = function () {}

/*
*/
// menu_Element.prototype.getElement = function (id) {} 

/*
*/
// menu_Element.prototype.getLinkElement = function () {}

/*
*/
menu_Element.prototype.getAncestors = function () {
  return this.parent ? this.parent.getPath () : [];
}

/*
*/
menu_Element.prototype.getPath = function () {
  var ancestors = this.getAncestors ();
  ancestors.push (this);
  return ancestors;
}

/*
*/
menu_Element.prototype.getLevel = function () {
  return this.getPath ().length;
}

/*
*/
menu_Element.prototype.getLine = function () {
  var line = [];
  var path = this.getPath ();
  for (var i = 0; i < path.length; i ++) {
    line.push (path [i].id);
  };
  return line;
}

/*
*/
menu_Element.prototype.addAttributes = function (element) {
  return element
    .attr ('data-menu-id', this.id)
    .attr ('data-menu-level', this.getLevel ());
}

/*
*/
menu_Element.prototype.getTemplate = function (success, failure) {
  var self = this;
  this.getRawTemplate (
    function (rawTemplate) {
      success (self.addAttributes (rawTemplate).addClass ('menu_template'));
    },
    failure
  );
} 

/*
*/
menu_Element.prototype.getFullTemplate = function (success, failure) {
  var path = this.getPath ();
  var element = path.shift ();
  element.getTemplate (
    function (template) {
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
    },
    failure
  );
}

/*
*/
menu_Element.prototype.getLabelElement = function () {
  return this.addAttributes (
    $('<span></span>')
      .addClass ('menu_label')
      .addClass ('menu_title')
      .html (this.title));
}

/*
*/
menu_Element.prototype._getLinkElement = function (id) {
  return this.addAttributes (
    $('<a></a>')
      .addClass ('menu_link')
      .addClass ('menu_title')
      .attr ('href', getContentURL (id))
      .html (this.title));
}

/*
*/
menu_Element.prototype.getContentsItemElement = function (numColumns, depth) {
  return this.addAttributes (
    $('<li></li>')
      .addClass ('menu_contents_item')
      .append (this.getLinkElement ()));
}

/*
*/
function menu_Page (parent, id, title) {
  menu_Element.call (this, parent, id, title);
}

/*
*/
menu_Page.prototype = Object.create (menu_Element.prototype);

/*
*/
menu_Page.prototype.constructor = menu_Page;

/*
*/
menu_Page.prototype.getFirstPage = function () {
  return this;
}

/*
*/
menu_Page.prototype.getElement = function (id) {
  return this.id === id ? this : null;
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
menu_Page.prototype.getLabelElement = function () {
  return menu_Element.prototype.getLabelElement.call (this).addClass ('menu_page_label');
}

/*
*/
menu_Page.prototype.getLinkElement = function () {
  return menu_Element.prototype._getLinkElement.call (this, this.id).addClass ('menu_page_link');
}

/*
*/
menu_Page.prototype.getContentsItemElement = function (numColumns, depth) {
  return menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth).addClass ('menu_contents_page_item');
}

/*
*/
function menu_Section (parent, id, title, children) {
  menu_Element.call (this, parent, id, title);
  this.children = children;
}

/*
*/
menu_Section.prototype = Object.create (menu_Element.prototype);

/*
*/
menu_Section.prototype.constructor = menu_Section;

/*
*/
menu_Section.prototype.getElement = function (id) {
  if (this.id === id) { return this; }

  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getElement (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
menu_Section.prototype.getFirstPage = function () {
  for (var i = 0; i < this.children.length; i ++) {
    var page = this.children [i].getFirstPage ();
    if (page) { return page; }
  }
  return null;
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
menu_Section.prototype.getLabelElement = function () {
  return menu_Element.prototype.getLabelElement.call (this).addClass ('menu_section_label');
}

/*
*/
menu_Section.prototype.getLinkElement = function () {
  var element = null;
  var page = this.getFirstPage ();
  if (page) {
    element = menu_Element.prototype._getLinkElement.call (this, page.id);
  } else {
    strictError ('[menu][menu_Section.getLinkElement] Error: an error occured while trying to create a new section link. The section is empty.');
    element = menu_Element.prototype._getLinkElement.call (this, this.id);
  }
  return element.addClass ('menu_section_link');
}

/*
*/
menu_Section.prototype.getContentsItemElement = function (numColumns, depth) {
  var element = menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth).addClass ('menu_section_contents_item');
  return depth === 0 ? element : element.append (this.getContentsElement (numColumns, depth));
}

/*
*/
menu_Section.prototype.getContentsElement = function (numColumns, depth) {
  var element = this.addAttributes ($('<ol></ol>').addClass ('menu_contents'));
  if (depth === 0) { return element; }

  for (var i = 0; i < this.children.length; i ++) {
    element.append (this.children [i].getContentsItemElement (numColumns, depth - 1));
  }
  return element;
}

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
  var element = this.getElement (blockElement.text ()).getLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Database.prototype.getLinkBlock = function (blockElement, success, failure) {
  var element = this.getElement (blockElement.text ()).getLinkElement ();
  blockElement.replaceWith (element);
  success (element);
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
      var section = self.getElement (blockArguments.menu_id);

      var line = self.getElement (blockArguments.menu_selected_element_id).getLine ();

      var element = section.getContentsElement (
        blockArguments.menu_num_columns,
        blockArguments.menu_max_level
      );

      menu_collapse (blockArguments.menu_expand_level + 1, element);
      menu_selectLine (line, element);

      if (blockArguments.menu_expandable === 'true') {
        menu_expandLine      (line, element);
        menu_makeCollapsable (blockArguments.menu_expand_level + 1, element);
      }

      blockElement.replaceWith (element);

      PAGE_LOAD_HANDLERS.push (
        function (done, id) {
          menu_deselect (element);
          var newLine = self.getElement (id).getLine ();
          menu_selectLine (newLine, element);
          menu_expandLine (newLine, element);
          done ();
      });

      success (element);
    },
    failure
  );
}

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
  for (var i = 0; i < line.length; i ++) {
    var element = $('.menu_contents_item[data-menu-id="' + line [i] + '"]', element)
      .removeClass ('menu_collapsed');

    $('> .menu_contents', element).show ();
  }
}

/*
*/
function menu_selectLine (line, element) {
  for (var i = 0; i < line.length; i ++) {
    $('.menu_contents_item[data-menu-id="' + line [i] + '"]', element)
      .addClass ('menu_selected');
  }
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