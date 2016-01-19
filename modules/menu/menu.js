/*
  The Menu module provides developers with a way
  to organize content into tree-like structures
  composed of nodes and leafs.
*/

/*
*/
var menu_MENU = new menu_Menu ([]);

/*
*/
(function () {
  // I. Register the block handlers.
  registerBlockHandlers ({
    menu_label_block:    menu_labelBlock,
    menu_link_block:     menu_linkBlock,
    menu_contents_block: menu_contentsBlock
  });
}) ();

/*
*/
function menu_labelBlock (blockElement, success, failure) {
  menu_MENU.getLabelBlock (blockElement, success, failure);
}

/*
*/
function menu_linkBlock (blockElement, success, failure) {
  menu_MENU.getLinkBlock (blockElement, success, failure);
}

/*
*/
function menu_contentsBlock (blockElement, success, failure) {
  menu_MENU.getContentsBlock (blockElement, success, failure);
}

/*
*/
function menu_Element (parent, id, title) {
  this.parent         = parent;
  this.id             = id;
  this.title          = title;
}

/*
*/
// menu_Element.prototype.getFirstLeaf = function () {}

/*
*/
// menu_Element.prototype.getElement = function (id) {} 

/*
*/
// menu_Element.prototype.getNodeElement = function (id) {}

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
  return this.addAttributes ($('<li></li>').addClass ('menu_contents_item'))
    .append (this.getLinkElement ());
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
menu_Leaf.prototype.getNodeElement = function (id) {
  return null;
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
  return menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth)
    .addClass ('menu_contents_leaf_item');
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
menu_Node.prototype.getNodeElement = function (id) {
  if (this.id === id) { return this; }

  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getNodeElement (id);
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
menu_Node.prototype.getLabelElement = function () {
  return menu_Element.prototype.getLabelElement.call (this).addClass ('menu_node_label');
}

/*
*/
menu_Node.prototype.getLinkElement = function () {
  var leaf = this.getFirstLeaf ();
  return leaf ? this._getLinkElement (leaf.id) :
                this.getLabelElement ();
}

/*
*/
menu_Node.prototype.getContentsItemElement = function (numColumns, depth) {
  var element = menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth)
    .addClass ('menu_node_contents_item');

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
function menu_Menu (children) {
  this.children = children;
}

/*
*/
menu_Menu.prototype.getElement = function (id) {
  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getElement (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
menu_Menu.prototype.getNodeElement = function (id) {
  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getNodeElement (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
menu_Menu.prototype.getLabelBlock = function (blockElement, success, failure) {
  var element = this.getElement (blockElement.text ()).getLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getLinkBlock = function (blockElement, success, failure) {
  var element = this.getElement (blockElement.text ()).getLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getContentsBlock = function (blockElement, success, failure) {
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
      var node = self.getNodeElement (blockArguments.menu_id);

      var element = node.getContentsElement (
        blockArguments.menu_num_columns,
        blockArguments.menu_max_level
      );

      menu_collapse (blockArguments.menu_expand_level + 1, element);

      if (blockArguments.menu_expandable === 'true') {
        menu_makeCollapsable (
          blockArguments.menu_expand_level + 1,
          blockArguments.menu_max_level,
          element
        );
      }

      var leaf = self.getElement (blockArguments.menu_selected_element_id);
      if (leaf) {
        var line = leaf.getLine ();

        menu_select     (blockArguments.menu_selected_element_id, element);
        menu_selectLine (line, element);

        if (blockArguments.menu_expandable === 'true') {
          menu_expandLine (line, element);
        }
      }

      blockElement.replaceWith (element);

      PAGE_LOAD_HANDLERS.push (
        function (done, id) {
          menu_deselect (element);
          var leaf = self.getElement (id);
          if (leaf) {
            var newLine = leaf.getLine ();
            menu_select     (id, element);
            menu_selectLine (newLine, element);
            menu_expandLine (newLine, element);
          }
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
function menu_select (id, element) {
  $('.menu_contents_item[data-menu-id="' + id + '"]', element)
    .addClass ('menu_selected');
}

/*
*/
function menu_deselect (element) {
  $('.menu_selected', element).removeClass ('menu_selected');
  $('.menu_selected_line', element).removeClass ('menu_selected_line');
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
     .addClass ('menu_selected_line'); 
  }
}

/*
*/
function menu_makeCollapsable (expandLevel, maxLevel, element) {
  $('.menu_contents_item', element).each (
    function (itemElementIndex, itemElement) {
      itemElement = $(itemElement);
      var level = itemElement.attr ('data-menu-level');
      if (level >= expandLevel && level <= maxLevel) {
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