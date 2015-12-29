/*
*/

/*
  The global BOOK_BOOK_CACHE associative array
  stores a cached version of books loaded in memory
  keyed by url.
*/
var BOOK_BOOK_CACHE = {};

/*
  The module's load event handler. This function
  registers this modules block and page handlers.
*/
(function () {
  // I. Register the block handlers.
  registerBlockHandlers ({
    book_body_block:     book_bodyBlock,
    book_children_block: book_childrenBlock,
    book_contents_block: book_contentsBlock,
    book_context_block:  book_contextBlock,
    book_link_block:     book_linkBlock,
    book_title_block:    book_titleBlock
  });

  // II. Register the page handlers.
  registerPageHandlers ({
    book_book_page:    'modules/book/templates/book_page.html',
    book_page_page:    'modules/book/templates/page_page.html',
    book_section_page: 'modules/book/templates/section_page.html'
  });
}) ();

// II. Block Functions

/*
  book_bodyBlock accepts three arguments:

  * blockElement, a JQuery DOM Element
  * success, a function that accepts a JQuery
    DOM Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a valid Book Element ID.

  book_bodyBlock replaces blockElement with a new
  HTML element that represents the referenced
  element's body and passes the new element to
  success. If an error occurs, book_bodyBlock
  calls failure instead.
*/
function book_bodyBlock (blockElement, success, failure) {
  var id = blockElement.text ();
  book_loadElementById (id,
    function (element) {
      var body = element.bodyElement ();
      blockElement.replaceWith (body);
      success (body);
    },
    failure
  );
}

/*
  book_childrenBlock accepts three arguments:

  * blockElement, a JQuery DOM Element
  * success, a function that accepts a JQuery
    DOM Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a valid Book Element ID.

  book_childrenBlock replaces blockElement
  with a new HTML element that represents the
  referenced book element's children and passes
  the new element to success. If an error occurs,
  book_childrenBlock calls failure instead.
*/
function book_childrenBlock (blockElement, success, failure) {
  var id = blockElement.text ();
  book_loadElementById (id,
    function (element) {
      var children = element.childrenElement ();
      blockElement.replaceWith (children);
      success (children);
    },
    failure
  );
}

/*
  book_contentsBlock accepts three arguments:

  * blockElement, a JQuery DOM Element
  * success, a function that accepts a JQuery
    DOM Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a valid Book Element ID.

  book_contentsBlock replaces blockElement
  with a new HTML element that represents the
  referenced book element's table of contents
  and passes the new element to success. If
  an error occurs, book_contentsBlock calls
  failure instead.
*/
function book_contentsBlock (blockElement, success, failure) {
  getBlockArguments ([
      {'name': 'book_element_id',          'text': true, 'required': true},
      {'name': 'book_expand_level',        'text': true, 'required': true},
      {'name': 'book_expandible',          'text': true, 'required': true},
      {'name': 'book_selected_element_id', 'text': true, 'required': true}
    ],
    blockElement,
    function (blockArguments) {
      book_loadElementById (
        blockArguments.book_element_id,
        function (element) {
          var path = book_getPathFromId (blockArguments.book_selected_element_id);
          var contents = element.contentsElement (
            blockArguments.book_expand_level,
            blockArguments.book_expandible === 'true',
            path
          );
          blockElement.replaceWith (contents);

          PAGE_LOAD_HANDLERS.push (
            function (done, id) {
              $('.book_selected', contents).removeClass ('book_selected');
              book_highlightContents (id, contents);
              done ();
          });

          success (contents);
        },
        failure
      );
    },
    failure
  );
}

/*
  book_contextBlock accepts three arguments:

  * blockElement, a JQuery DOM Element
  * success, a function that accepts a JQuery
    DOM Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a valid Book Element ID.

  book_contextBlock replaces blockElement with
  a new HTML element that lists the table of
  contents of the book elements that contain
  the referenced book element and passes the
  new element to success. If an error occurs,
  book_contextBlock calls failure instead.
*/
function book_contextBlock (blockElement, success, failure) {
  var id = blockElement.text ();
  book_loadElementById (id,
    function (element) {
      var context = element.contextElement ();
      blockElement.replaceWith (context);
      success (context);
    },
    failure
  );
}

/*
  book_linkBlock accepts three arguments:

  * blockElement, a JQuery DOM Element
  * success, a function that accepts a JQuery
    DOM Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a valid Book Element ID.

  book_linkBlock replaces blockElement with a
  new HTML element that represents a link to
  the referenced book element and passes the
  new element to success. If an error occurs,
  book_linkBlock calls failure instead.
*/
function book_linkBlock (blockElement, success, failure) {
  var id = blockElement.text ();
  book_loadElementById (id,
    function (element) {
      var link = element.linkElement ();
      blockElement.replaceWith (link);
      success (link);
    },
    failure
  );
}

/*
  book_titleBlock accepts three arguments:

  * blockElement, a JQuery DOM Element
  * success, a function that accepts a JQuery
    DOM Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a valid Book Element ID.

  book_titleBlock replaces blockElement with a
  new HTML element that represents the referenced
  book element's title and passes the new element
  to success. If an error occurs, book_titleBlock
  calls failure instead.
*/
function book_titleBlock (blockElement, success, failure) {
  var id = blockElement.text ();
  book_loadElementById (id,
    function (element) {
      var title = element.titleElement ();
      blockElement.replaceWith (title);
      success (title);
    },
    failure
  );
}

/*
  book_highlightContents accepts two arguments:

  * id, a Resource ID string
  * and contents, a JQuery HTML Element that
    represents a table of contents.

  book_highlightContents finds the item
  within contents that links to id, adds the
  "book_selected" class to the item, expands any
  sections that contain the item, and returns
  true iff contents contains an item that links
  to id.
*/
function book_highlightContents (id, contents) {
  var items = $('> .book_contents_item', contents).toArray ();
  for (var i = 0; i < items.length; i ++) {
    var item = $(items [i]);
    if (book_highlightContentsItem (id, item)) {
      contents
        .removeClass ('book_collapsed')
        .slideDown ();
      return true;
    }
  }
  return false;
}

/*
  book_highlightContentsItem accepts two
  arguments:

  * id, a Resource ID string
  * and item, a JQuery HTML Element that
    represents a table of contents item.

  If item links to id, book_highlightContentsItem
  adds the "book_selected" class to item. If
  item contains a section list that, in
  turn, contains an item that links to
  id, book_highlightContentsItem adds the
  "book_selected" class to the nested item and
  expands any sections that contain it.
  book_highlightContentsItem returns true if
  item either links to id or contains a nested
  item that does.
*/
function book_highlightContentsItem (id, item) {
  // I. Highlight links.
  var link = $('> .book_link', item);
  if (link.length > 0) {
    var url = new URI (link.attr ('href'));
    var linkId = getIdFromURL (url);
    if (linkId && linkId === id) {
      link.addClass ('book_selected');
      return true;
    }
    return false;
  }

  // II. Expand sections.
  var contents = $('> .book_contents', item);
  if (contents.length > 0) {
    if (book_highlightContents (id, contents)) {
      var label = $('> .book_label', item);
      if (label.length > 0) {
        label.removeClass ('book_collapsed');
      }
      return true;
    }
    return false;
  }

  // III. Return default.
  return false;
}


// III. Object Functions

/*
  book_loadElementById accepts three arguments:

  * id, a Book Element ID string
  * success, a function that accepts an Book Element array
  * and failure, a function that does not accept any arguments.
*/
function book_loadElementById (id, success, failure) {
  var error = '[book][book_loadElementById] Error: an error occured while trying to load Book Element "' + id + '".';

  var path = book_getPathFromId (id);
  if (path.length == 0) {
    strictError (error + ' The ID "' + id + '" is invalid.');
    return failure ();
  }
  var url = path [0];
  book_loadDatabase (url,
    function (books) {
      var element = book_getElementByPath (path, books, 1);
      if (!element) {
        strictError (error + ' The referenced element does not exist.');
        return failure ();
      }
      success (element);
    },
    failure
  );
}

/*
  book_loadDatabase accepts three arguments:

  * url, a URL string
  * success, a function that accepts a Book
    Book array
  * and failure, a function that does not accept
    any arguments.

  book_loadDatabase loads the books stored in the
  database referenced by url and passes them to
  success. If an error occurs book_loadDatabase
  calls failure instead.
*/
function book_loadDatabase (url, success, failure) {
  if (BOOK_BOOK_CACHE [url]) {
    return success (BOOK_BOOK_CACHE [url]);
  }
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      book_parseDatabase (url, doc,
        function (books) {
          BOOK_BOOK_CACHE [url] = books;
          success (books);
        },
        failure
      );
    },
    error: function (request, status, error) {
      strictError ('[book][book_loadDatabase] Error: an error occured while trying to load "' + url + '".');
      failure ();
    }
  });
}

/*
  book_parseDatabase accepts four arguments:

  * url, a URL string
  * doc, a JQuery HTML Document
  * success, a function that accepts a Book
    Book array
  * and failure, a function that does not accept
    any arguments.

  book_parseDatabase parses the books represented
  by doc and passes the results them to
  success. If an error occurs, book_parseDatabase
  calls failure instead.
*/
function book_parseDatabase (url, doc, success, failure) {
  book_parseBooks (url, [url],
    $('> books', doc).children (),
    success,
    failure
  );
}

/*
  book_parseBooks accepts four arguments:

  * databaseURL, a URL string
  * databasePath, a string array
  * elements, a JQuery HTML Element array
  * success, a function that accepts a Book
    Book array
  * and failure, a function that does not accept
    any arguments.

  book_parseBooks parses elements and passes
  the books that it represents to success. If
  an error occurs, book_parseBooks calls failure.
*/
function book_parseBooks (databaseURL, databasePath, elements, success, failure) {
  map (
    function (element, success, failure) {
      book_parseBook (databaseURL, databasePath, element, success, failure);
    },
    elements,
    success,
    failure
  );
}

/*
  book_parseBook accepts four arguments:

  * databaseURL, a URL string
  * databasePath, a string array
  * element, a JQuery HTML Element
  * success, a function that accepts a Book Book
  * and failure, a function that does not accept
    any arguments.

  book_parseBook parses element and passes the
  Book that it represents to success. If an error
  occurs, book_parseBook calls failure instead.
*/
function book_parseBook (databaseURL, databasePath, element, success, failure) {
  var name = $('> name', element).text ();
  if (!name) {
    strictError ('[book][book_Book.parse] Error: an error occured while trying to parse a Book element. The "name" element is missing.');
    return failure ();
  }
  var path = databasePath.concat (name);
  var book = new book_Book (
    databaseURL,
    name,
    $('> title', element).text (),
    $('> body',  element).text (),
    []
  );
  book_parseContent (book, path, $('> content', element).children (),
    function (children) {
      book.children = children;
      success (book);
    },
    failure
  );
}

/*
  book_parseSection accepts five arguments:

  * parent, a Book Element
  * parentPath, a string array
  * element, a JQuery HTML Element
  * success, a function that accepts a Book
    Section object
  * and failure, a function that does not accept
    any arguments.

  book_parseSection parses the section
  represented by element and passes the
  section to success. If an error occurs,
  book_parseSection calls failure instead.
*/
function book_parseSection (parent, parentPath, element, success, failure) {
  var name = $('> name', element).text ();
  if (!name) {
    strictError ('[book][book_Section.parse] Error: an error occured while trying to parse a Book Section element. The "name" element is missing.');
    return failure ();
  }
  var path = parentPath.concat (name);
  var section = new book_Section (
    parent,
    name,
    $('> title', element).text (),
    $('> body',  element).text (),
    []
  );
  book_parseContent (section, path, $('> content', element).children (),
    function (children) {
      section.children = children;
      success (section);
    },
    failure
  );
}

/*
  book_parsePage accepts six arguments:

  * parent, a Book Element
  * parentPath, a string array
  * element, a JQuery HTML Element
  * success, a function that accepts a Book
    Page object
  * and failure, a function that does not accept
    any arguments.

  book_parsePage parses the page represented
  by element and passes the resulting Book
  Page object to success. If an error occurs,
  it calls failure instead.
*/
function book_parsePage (parent, parentPath, element, success, failure) {
  var name = $('> name', element).text ();
  if (!name) {
    strictError ('[book][book_Page.parse] Error: an error occured while trying to parse a Book Page element. The "name" element is missing.');
    return failure ();
  }
  success (
    new book_Page (
      parent,
      name,
      $('> title', element).text (),
      $('> body', element).text ()
  ));
}

/*
  book_parseContent accepts five arguments:

  * parent, a Book Element
  * parentPath, a string array
  * elements, a JQuery HTML Element array
  * success, a function that accepts a Book
    Content array
  * and failure, a function that does not accept
    any arguments.

  book_parseContent parses the elements
  represented by elements and passes them to
  success. If an error occurs, book_parseContent
  calls failure instead.
*/
function book_parseContent (parent, parentPath, elements, success, failure) {
  map (
    function (_element, success, failure) {
      var element = $(_element);
      switch (element.prop ('tagName')) {
        case 'section':
          return book_parseSection (parent, parentPath, element, success, failure);
        case 'page':
          return book_parsePage (parent, parentPath, element, success, failure);
        default:
          strictError ('[book][book_parseContent] Error: an error occured while trying to parse a Book Content element. The element\'s tag name is invalid.');
          return failure ();
      }
    },
    elements,
    success,
    failure
  );
}

/*
  book_getElementByPath accepts three arguments:

  * path, a string array
  * elements, a Book Element array
  * and index, a positive integer

  and returns the element in elements referenced
  by path.

  Note: this function will search within each
  element in elements to find the element
  referenced by path.
*/
function book_getElementByPath (path, elements, index) {
  var element = book_findElementByName (path [index], elements);
  return index < path.length - 1 ?
    element.getDescendant (path, index) :
    element;
}

/*
  book_findElementByName accepts two arguments:

  * name, a string
  * and elements, a Book Element array.

  book_findElementByName returns the first
  element in elements named name. If none of
  the elements in elements are named name,
  book_findElementByName returns null.
*/
function book_findElementByName (name, elements) {
  return find (
    function (element) {
      return element.name === name;
    },
    elements
  );
}

// IV. ID Functions

/*
  book_getPathFromId accepts a Book Element ID
  and returns the Book Element Path embedded
  within it.
*/
function book_getPathFromId (id) {
  return new URI (id).segmentCoded ().slice (1);
}

/*
  book_isPathPrefix accepts two arguments:

  * prefix, a string array,
  * and path, another string array

  and returns true iff you can remove zero or
  more elements from the end of path to produce
  prefix.
*/
function book_isPathPrefix (prefix, path) {
  if (path.length < prefix.length) { return false; }
 
  for (var i = 0; i < prefix.length; i ++) {
    if (prefix [i] !== path [i]) { return false; }
  }
  return true;
}

/*
  book_arePathsEqual accepts two arguments:

  * path0, a string array
  * and path1, another string array

  and returns true iff every element in path0
  equals the corresponding element in path1.
*/
function book_arePathsEqual (path0, path1) {
  if (path0.length != path1.length) { return false; }

  for (var i = 0; i < path0.length; i ++) {
    if (path0 [i] !== path1 [i]) { return false; }
  }
  return true;
}

// V. Object Definitions

/*
  book_Element accepts four arguments:

  * parent, a Book Element
  * name, a string
  * title, a JQuery HTML Element
  * body, a JQuery HTML Element
  * children, a Book Element array

  and return a Book Element that has the given
  properties.
*/
function book_Element (parent, name, title, body, children) {
  this.parent   = parent;
  this.name     = name;
  this.title    = title;
  this.body     = body;
  this.children = children;
}

/*
  getAncestors returns this Book Element's
  ancestors in a Book Element array.
*/
book_Element.prototype.getAncestors = function () {
  var ancestors = [];
  if (this.parent) {
    ancestors = this.parent.getAncestors ();
    ancestors.push (this.parent);
  }
  return ancestors;
}

/*
  getDescendant accepts two arguments:

  * path, a string array
  * and index, a positive integer

  and returns the descendant of Book Element
  that is referenced by path.
*/
book_Element.prototype.getDescendant = function (path, index) {
  var name = path [index];
  if (this.name !== name) { return null; }

  return index < path.length - 1 ?
    book_getElementByPath (path, this.children, index + 1) :
    this;
}

// getPath returns this Book Element's path.
book_Element.prototype.getPath = function () {
  var path = this.parent.getPath ();
  path.push (this.name);
  return path;
}

/*
  getId accepts this Book Element's type and
  returns this Book Element's id.
*/
book_Element.prototype.getId = function (type) {
  var uri = new URI ('').segmentCoded (type);
  this.getPath ().forEach (
    function (x) {
      uri.segmentCoded (x);
  });
  return uri.toString ();
}

// getLevel returns this Book Element's level.
book_Element.prototype.getLevel = function () {
  return this.getPath ().length - 1;
}

/*
  getFirstPage returns the first page contained
  by this Book Element.
*/
book_Element.prototype.getFirstPage = function () {
  for (var i = 0; i < this.children.length; i ++) {
    var child = this.children [i];
    var page  = child.getFirstPage ();
    if (page) {
      return page;
    }
  }
  return null;
}

/*
  bodyElement returns a JQuery HTML Element that
  represents this Book Element's body. 
*/
book_Element.prototype.bodyElement = function () {
  return this.addLevel ($('<div></div>').addClass ('book_body').html (this.body));
}

/*
  childrenElement returns a JQuery HTML Element
  that represents this Book Element's children.
*/
book_Element.prototype.childrenElement = function (selectedPath) {
  var children = this.addLevel ($('<ol></ol>').addClass ('book_children'));

  var first = $('<div class="book_children_section book_children_first_section"></div>');
  children.append (first);

  var second = $('<div class="book_children_section book_children_second_section"></div>');
  children.append (second);


  var middle = this.children.length / 2;
  this.children.forEach (
    function (child, index) {
      var item = child.childrenItemElement (selectedPath);
      if (item) {
        if (index < middle) {
          first.append (item);
        } else {
          second.append (item);
        }
      }
  });
  return children;
}

/*
  childrenItemElement returns a JQuery HTML
  Element that represents this Book Element as
  a children list item.
*/
book_Element.prototype.childrenItemElement = function (selectedPath) {
  var item = this.addLevel ($('<li></li>').addClass ('book_children_item').append (this.linkElement ()));
  if (book_isPathPrefix (this.getPath (), selectedPath)) {
    item.addClass ('book_selected');
  }
  return item;
}

/*
  contentsElement accepts one argument:
  selectedId, a Book Element ID string; and
  returns a JQuery HTML Element that represents
  this Book Element's table of contents.
*/
book_Element.prototype.contentsElement = function (rootContentsElement, expandLevel, expandible, selectedPath) {
  var contents = this.addLevel ($('<ol></ol>').addClass ('book_contents'));

  for (var i = 0; i < this.children.length; i ++) {
    var child = this.children [i];
    var item = child.contentsItemElement (rootContentsElement ? rootContentsElement : contents, expandLevel, expandible, selectedPath);
    if (item) {
      contents.append (item);
    }
  }
  return contents;
}

/*
  contentsItemElement accepts one argument:
  selectedId, a Book Element ID string; and
  returns a JQuery HTML Element that represents
  this Book Element as a table of contents item.
*/
book_Element.prototype.contentsItemElement = function () {
  return this.addLevel ($('<li></li>').addClass ('book_contents_item'))
}

/*
  contextElement returns a JQuery HTML Element
  that represents this Book Element's context.
*/
book_Element.prototype.contextElement = function () {
  var context = this.addLevel ($('<ol></ol>').addClass ('book_context'));
  var element = this;
  this.getAncestors ().forEach (
    function (ancestor) {
      var item = ancestor.contextItemElement (element.getPath ());
      if (item) {
        context.append (item);
      }
  });
  return context;
}

/*
  contextItemElement returns a JQuery HTML
  Element that represents this Book Element as
  a context item.
*/
book_Element.prototype.contextItemElement = function (selectedPath) {
  return this.addLevel ($('<li></li>')
    .addClass ('book_context_item')
    .append (this.labelElement (),
             this.childrenElement (selectedPath)));
}

/*
  labelElement returns a JQuery HTML Element
  that represents this Book Element's label.
*/
book_Element.prototype.labelElement = function () {
  return this.addLevel ($('<span></span>').addClass ('book_label').html (this.title));
}

/*
  linkElement returns a JQuery HTML Element that
  represents a link this Book Element.
*/
book_Element.prototype.linkElement = function () {
  return this.addLevel (getContentLink (this.getId (), this.title).addClass ('book_link'));
}

/*
  titleElement returns a JQuery HTML Element that
  represents this Book Element's title.
*/
book_Element.prototype.titleElement = function () {
  return this.addLevel ($('<h2></h2>').addClass ('book_title').html (this.linkElement ()));
}

/*
  addLevel accepts a JQuery HTML Element and
  adds a class named "book_level_<n>" where
  "<n>" represents this Book Element's level.
*/
book_Element.prototype.addLevel = function (element) {
  return element.addClass ('book_level_' + this.getLevel ());
}

/*
  book_addContentsItemLabelClickEventHandler
  accepts two arguments:

  * label, a JQuery HTML Element
  * and rootContentsElement, a JQuery HTML
    Element.

  label must represent a table of contents item
  label while rootContentsElement must represent
  the highest level table of contents that
  contains label.

  book_addContentsItemLabelClickEventHandler
  adds a click event handler to label that
  removes the "book_selected" class from every
  element within rootContentsElement and adds
  the class to label.

  This class is used to identify the last table
  of contents item that the user has clicked on.
*/
function book_addContentsItemLabelClickEventHandler (label, rootContentsElement) {
  return label.click (
    function () {
      $('.book_selected', rootContentsElement).removeClass ('book_selected');
      label.addClass ('book_selected');
  });
}

/*
  book_Book accepts five arguments:

  * databaseURL, a URL string
  * name, a string
  * title, a JQuery HTML Element
  * body, a JQuery HTML Element
  * and children, an array of Book Content Elements
*/
function book_Book (databaseURL, name, title, body, children) {
  book_Element.call (this, null, name, title, body, children);
  this.databaseURL = databaseURL;
}

/*
  Create a new prototype object for book_Book
  and set book_Element's prototype as the
  object's prototype.
*/
book_Book.prototype = Object.create (book_Element.prototype);

/*
  Update the prototype's constructor property so
  that any functions that read it can determine
  which constructor function was used to
  construct its instance objects.
*/
book_Book.prototype.constructor = book_Book;

// getPath returns this Book's path.
book_Book.prototype.getPath = function () {
  return [this.databaseURL, this.name];
}

// getId returns this Book's ID.
book_Book.prototype.getId = function () {
  return book_Element.prototype.getId.call (this, 'book_book_page');
}

/*
  bodyElement returns a JQuery HTML Element that
  represents this Book's body. 
*/
book_Book.prototype.bodyElement = function () {
  return book_Element.prototype.bodyElement.call (this).addClass ('book_book_body');
}

/*
  childrenElement returns a JQuery HTML Element
  that represents this Book's children.
*/
book_Book.prototype.childrenElement = function (selectedPath) {
  return book_Element.prototype.childrenElement.call (this, selectedPath).addClass ('book_book_children');
}

/*
  contentsElement returns a JQuery HTML Element
  that represents this Book's table of contents.
*/
book_Book.prototype.contentsElement = function (expandLevel, expandible, selectedPath) {
  return book_Element.prototype.contentsElement.call (this, null, expandLevel, expandible, selectedPath)
    .addClass ('book_book_contents');
}

/*
  contextElement returns a JQuery HTML Element
  that represents this Book's context.
*/
book_Book.prototype.contextElement = function () {
  return book_Element.prototype.contextElement.call (this).addClass ('book_book_context');
}

/*
  labelElement returns a JQuery HTML Element that
  represents this Book's title.
*/
book_Book.prototype.labelElement = function () {
  return book_Element.prototype.labelElement.call (this).addClass ('book_book_label');
}

/*
  linkElement returns a JQuery HTML Element that
  represents a link this Book.
*/
book_Book.prototype.linkElement = function () {
  return book_Element.prototype.linkElement.call (this).addClass ('book_book_link');
}

/*
  titleElement returns a JQuery HTML Element that
  represents this Book's title.
*/
book_Book.prototype.titleElement = function () {
  return book_Element.prototype.titleElement.call (this).addClass ('book_book_title');
}

/*
  book_Section accepts six arguments:

  * parent, a Book Element
  * id, a URI string
  * name, a string
  * title, a JQuery HTML Element
  * body, a JQuery HTML Element
  * and children, an array of Book Elements.

  book_Section creates a Book Section object
  that has the given properties.
*/
function book_Section (parent, id, name, title, body, children) {
  book_Element.call (this, parent, id, name, title, body, children);
}

/*
  Create a new prototype object for book_Section
  and set book_Element's prototype as the
  object's prototype.
*/
book_Section.prototype = Object.create (book_Element.prototype);

/*
  Update the prototype's constructor property so
  that any functions that read it can determine
  which constructor function was used to
  construct its instance objects.
*/
book_Section.prototype.constructor = book_Section;
 
// getId returns this Book Section's id.
book_Section.prototype.getId = function () {
  return book_Element.prototype.getId.call (this, 'book_section_page');
}

/*
  bodyElement returns a JQuery HTML Element that
  represents this Book Section's body. 
*/
book_Section.prototype.bodyElement = function () {
  return book_Element.prototype.bodyElement.call (this).addClass ('book_section_body');
}

/*
  childrenElement returns a JQuery HTML Element
  that represents this Book Section's children.
*/
book_Section.prototype.childrenElement = function (selectedPath) {
  return book_Element.prototype.childrenElement.call (this, selectedPath).addClass ('book_section_children');
}

/*
  childrenItemElement returns a JQuery HTML
  Element that represents this Book Section as
  a children list item.
*/
book_Section.prototype.childrenItemElement = function (selectedPath) {
  return book_Element.prototype.childrenItemElement.call (this, selectedPath).addClass ('book_children_section_item');
}

/*
  contentsElement returns a JQuery HTML Element
  that represents this Book Section's table of contents.
*/
book_Section.prototype.contentsElement = function (rootContentsElement, expandLevel, expandible, selectedPath) {
  return book_Element.prototype.contentsElement.call (this, rootContentsElement, expandLevel, expandible, selectedPath)
    .addClass ('book_section_contents');
}

/*
  contentsItemElement returns a JQuery HTML
  Element that represents this Book Section as
  a table of contents item.
*/
book_Section.prototype.contentsItemElement = function (rootContentsElement, expandLevel, expandible, selectedPath) {
  var item = book_Element.prototype.contentsItemElement.call (this).addClass ('book_contents_section_item');

  var label = book_addContentsItemLabelClickEventHandler (expandible ? this.labelElement () : this.linkElement (), rootContentsElement);

  var contents = this.contentsElement (rootContentsElement, expandLevel, expandible, selectedPath);

  if (this.getLevel () > expandLevel) {
    if (!book_isPathPrefix (this.getPath (), selectedPath)) {
      contents.hide ();
      label.addClass ('book_collapsed')
    }
    if (expandible) {
      label.click (
        function () {
          label.toggleClass ('book_collapsed');
          contents.slideToggle ();
      });
    }
  }
  return item.append (label, contents);
}

/*
  contextItemElement returns a JQuery HTML
  Element that represents this Book Section as
  a context item.
*/
book_Section.prototype.contextItemElement = function (selectedPath) {
  return book_Element.prototype.contextItemElement.call (this, selectedPath)
    .addClass ('book_context_section_item');
}

/*
  labelElement returns a JQuery HTML Element that
  represents this Book Section's title.
*/
book_Section.prototype.labelElement = function () {
  return book_Element.prototype.labelElement.call (this).addClass ('book_section_label');
}

/*
  linkElement returns a JQuery HTML Element that
  represents a link this Book Section.
*/
book_Section.prototype.linkElement = function () {
  var page = this.getFirstPage ();
  return this.addLevel (getContentLink (page ? page.getId () : this.getId (), this.title).addClass ('book_link'));
}

/*
  titleElement returns a JQuery HTML Element that
  represents this Book Section's title.
*/
book_Section.prototype.titleElement = function () {
  return book_Element.prototype.titleElement.call (this).addClass ('book_section_title');
}

/*
  book_Page accepts five arguments:

  * parent, a Book Element
  * id, a URI string
  * name, a string
  * title, a JQuery HTML Element
  * and body, another JQuery HTML Element.

  book_Page creates a Book Page object that has
  the given properties.
*/
function book_Page (parent, id, name, title, body) {
  book_Element.call (this, parent, id, name, title, body, []);
}

/*
  Create a new prototype object for book_Page
  and set book_Element's prototype as the
  object's prototype.
*/
book_Page.prototype = Object.create (book_Element.prototype);

/*
  Update the prototype's constructor property so
  that any functions that read it can determine
  which constructor function was used to
  construct its instance objects.
*/
book_Page.prototype.constructor = book_Page;

// getId returns this Book Page's id.
book_Page.prototype.getId = function () {
  return book_Element.prototype.getId.call (this, 'book_page_page');
}

// getFirstPage returns this Book Page.
book_Page.prototype.getFirstPage = function () {
  return this;
}

/*
  bodyElement returns a JQuery HTML Element that
  represents this Book Page's body. 
*/
book_Page.prototype.bodyElement = function () {
  return book_Element.prototype.bodyElement.call (this).addClass ('book_page_body');
}
/*
  childrenElement returns a JQuery HTML Element
  that represents this Book Page's children.
*/
book_Page.prototype.childrenElement = function () {
  return book_Element.prototype.childrenElement.call (this).addClass ('book_page_children');
}

/*
  childrenItemElement returns a JQuery HTML
  Element that represents this Book Page as
  a children list item.
*/
book_Page.prototype.childrenItemElement = function (selectedPath) {
  return book_Element.prototype.childrenItemElement.call (this, selectedPath).addClass ('book_children_page_item');
}

/*
  contentsElement returns a JQuery HTML Element
  that represents this Book Page's table of contents.
*/
book_Page.prototype.contentsElement = function () {
  return book_Element.prototype.contentsElement.call (this).addClass ('book_page_contents');
}

/*
  contentsItemElement returns a JQuery HTML
  Element that represents this Book Page as
  a table of contents item.
*/
book_Page.prototype.contentsItemElement = function (rootContentsElement, expandLevel, expandible, selectedPath) {
  var link = book_addContentsItemLabelClickEventHandler (this.linkElement (), rootContentsElement);
  if (book_arePathsEqual (this.getPath (), selectedPath)) {
    link.addClass ('book_selected');
  }
  return book_Element.prototype.contentsItemElement.call (this)
    .addClass ('book_contents_page_item')
    .append (link);
}

/*
  contextElement returns a JQuery HTML Element
  that represents this Book Page's context.
*/
book_Page.prototype.contextElement = function (selectedPath) {
  return book_Element.prototype.contextElement.call (this, selectedPath).addClass ('book_page_context');
}

/*
  labelElement returns a JQuery HTML Element that
  represents this Book Page's title.
*/
book_Page.prototype.labelElement = function () {
  return book_Element.prototype.labelElement.call (this).addClass ('book_page_label');
}

/*
  linkElement returns a JQuery HTML Element that
  represents a link this Book Page.
*/
book_Page.prototype.linkElement = function () {
  return book_Element.prototype.linkElement.call (this).addClass ('book_page_link');
}

/*
  titleElement returns a JQuery HTML Element that
  represents this Book Page's title.
*/
book_Page.prototype.titleElement = function () {
  return book_Element.prototype.titleElement.call (this).addClass ('book_page_title');
}
