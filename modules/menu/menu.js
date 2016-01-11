/*
  The Menu module provides developers with a way
  to organize content into tree-like structures
  composed of nodes and leafs.
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
// menu_Element.prototype.getRawPageTemplate = function (success, failure) {} 

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
menu_Element.prototype.getPageTemplate = function (success, failure) {
  var self = this;
  this.getRawPageTemplate (
    function (rawTemplate) {
      success (self.addAttributes (rawTemplate)
        .addClass ('menu_template')
        .addClass ('menu_page_template'));
    },
    failure
  );
} 

/*
*/
menu_Element.prototype.getFullPageTemplate = function (success, failure) {
  var elements = this.getPath ().reverse ();
  var leaf = elements.shift ();
  leaf.getPageTemplate (
    function (pageTemplate) {
      fold (
        function (template, node, success, failure) {
          node.getSectionTemplate (
            function (sectionTemplate) {
              $('.menu_id_block', sectionTemplate).replaceWith (node.id);
              $('.menu_hole_block', sectionTemplate).replaceWith (template);
              success (sectionTemplate);
            },
            failure
          );
        },
        pageTemplate,
        elements,
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
function menu_Leaf (parent, id, title) {
  menu_Element.call (this, parent, id, title);
}

/*
*/
menu_Leaf.prototype = Object.create (menu_Element.prototype);

/*
*/
menu_Leaf.prototype.constructor = menu_Leaf;

/*
*/
menu_Leaf.prototype.getFirstLeaf = function () {
  return this;
}

/*
*/
menu_Leaf.prototype.getElement = function (id) {
  return this.id === id ? this : null;
}

/*
*/
menu_Leaf.prototype.getPageTemplate = function (success, failure) {
  menu_Element.prototype.getPageTemplate.call (this,
    function (template) {
      success (template.addClass ('menu_leaf_page_template'));
    },
    failure
  );
}

/*
*/
menu_Leaf.prototype.getLabelElement = function () {
  return menu_Element.prototype.getLabelElement.call (this).addClass ('menu_leaf_label');
}

/*
*/
menu_Leaf.prototype.getLinkElement = function () {
  return menu_Element.prototype._getLinkElement.call (this, this.id).addClass ('menu_leaf_link');
}

/*
*/
menu_Leaf.prototype.getContentsItemElement = function (numColumns, depth) {
  return menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth).addClass ('menu_contents_leaf_item');
}

/*
*/
function menu_Node (parent, id, title, children) {
  menu_Element.call (this, parent, id, title);
  this.children = children;
}

/*
*/
menu_Node.prototype = Object.create (menu_Element.prototype);

/*
*/
menu_Node.prototype.constructor = menu_Node;

/*
*/
menu_Node.prototype.getRawSectionTemplate = function (success, failure) {};

/*
*/
menu_Node.prototype.getElement = function (id) {
  if (this.id === id) { return this; }

  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getElement (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
menu_Node.prototype.getFirstLeaf = function () {
  for (var i = 0; i < this.children.length; i ++) {
    var leaf = this.children [i].getFirstLeaf ();
    if (leaf) { return leaf; }
  }
  return null;
}

/*
*/
menu_Node.prototype.getSectionTemplate = function (success, failure) {
  var self = this;
  this.getRawSectionTemplate (
    function (rawTemplate) {
      success (
        self.addAttributes (rawTemplate)
          .addClass ('menu_template')
          .addClass ('menu_section_template'));
    },
    failure
  );
}

/*
*/
menu_Node.prototype.getLabelElement = function () {
  return menu_Element.prototype.getLabelElement.call (this).addClass ('menu_node_label');
}

/*
*/
menu_Node.prototype.getLinkElement = function () {
  return menu_Element.prototype._getLinkElement.call (this, this.id).addClass ('menu_node_link');
}

/*
*/
menu_Node.prototype.getContentsItemElement = function (numColumns, depth) {
  var element = menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth).addClass ('menu_node_contents_item');
  return depth === 0 ? element : element.append (this.getContentsElement (numColumns, depth));
}

/*
*/
menu_Node.prototype.getContentsElement = function (numColumns, depth) {
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
      var node = self.getElement (blockArguments.menu_id);

      var line = self.getElement (blockArguments.menu_selected_element_id).getLine ();

      var element = node.getContentsElement (
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
    $('.menu_contents_item[data-menu-id="' + line [i] + '"]', element)
      .removeClass ('menu_collapsed')
      .children ('.menu_contents')
        .show ();
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
        var linkElement = $('> .menu_node_link', itemElement);
        linkElement.click (
          function (event) {
            event.preventDefault ();
            itemElement.toggleClass ('menu_collapsed');
            $('> .menu_contents', itemElement).slideToggle ();
        });
      }
  });
}