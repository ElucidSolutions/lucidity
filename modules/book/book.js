/*
  The Book module defines the book content type
  which can be used to represent books, manuals,
  and other text-based materials divided into
  chapters, sections, and pages.
*/

/*
*/
var book_DATABASE_URL = 'modules/book/database.xml';

/*
*/
var book_DATABASE = {};

/*
  The module's load event handler. This function
  registers this modules block and page handlers.
*/
(function () {
  var failure = function () {}

  // I. Load the Book database.
  book_loadDatabase (book_DATABASE_URL,
    function (database) {
      // II. Cache the Book database.
      book_DATABASE = database;

      // III. Register the block handlers.
      registerBlockHandlers ({
        book_body_block:     book_bodyBlock,
        book_contents_block: book_contentsBlock,
        book_label_block:    book_labelBlock,
        book_link_block:     book_linkBlock
      });

      // IV. Register the page handlers.
      registerPageHandlers ({
        book_book_page:    book_page,
        book_page_page:    book_page,
        book_section_page: book_page
      });
    },
    failure
  );

}) ();

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
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      success (book_parseDatabase (url, doc));
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
*/
function book_parseDatabase (url, doc) {
  return new book_Database (
    $('> books', doc).children ().map (
      function (i, element) {
        return book_parseBook ([url], element);
    }).toArray ()
  );
}

/*
  book_parseBook accepts two arguments:

  * databasePath, a string array
  * element, a JQuery HTML Element
*/
function book_parseBook (databasePath, element) {
  var path = databasePath.concat ($('> name', element).text ());
  var book = new book_Book (
    null,
    book_getId ('book_book_page', path),
    $('> title', element).text (),
    $('> body',  element).text (),
    []
  );
  book.children = book_parseContent (book, path, $('> content', element).children ().toArray ());
  return book;
}

/*
  book_parseSection accepts two arguments:

  * parentPath, a string array
  * element, a JQuery HTML Element
*/
function book_parseSection (parent, parentPath, element) {
  var path = parentPath.concat ($('> name', element).text ());
  var section = new book_Section (
    parent,
    book_getId ('book_section_page', path),
    $('> title', element).text (),
    $('> body',  element).text (),
    []
  );
  section.children = book_parseContent (section, path, $('> content', element).children ().toArray ());
  return section;
}

/*
  book_parsePage accepts two arguments:

  * parentPath, a string array
  * element, a JQuery HTML Element
*/
function book_parsePage (parent, parentPath, element) {
  return new book_Page (
    parent,
    book_getId ('book_page_page', parentPath.concat ($('> name', element).text ())),
    $('> title', element).text (),
    $('> body', element).text ()
  );
}

/*
  book_parseContent accepts four arguments:

  * parentPath, a string array
  * elements, a JQuery HTML Element array
*/
function book_parseContent (parent, parentPath, elements) {
  return elements.map (
    function (element) {
      var element = $(element);
      switch (element.prop ('tagName')) {
        case 'section':
          return book_parseSection (parent, parentPath, element);
        case 'page':
          return book_parsePage (parent, parentPath, element);
        default:
          strictError ('[book][book_parseContent] Error: an error occured while trying to parse a Book Content element. The element\'s tag name is invalid.');
          return null;
      }
  });
}

/*
*/
function book_bodyBlock (blockElement, success, failure) {
  book_DATABASE.getBodyBlock (blockElement, success, failure);
}

/*
*/
function book_contentsBlock (blockElement, success, failure) {
  book_DATABASE.getContentsBlock (blockElement, success, failure);
}

/*
*/
function book_labelBlock (blockElement, success, failure) {
  book_DATABASE.getLabelBlock (blockElement, success, failure);
}

/*
*/
function book_linkBlock (blockElement, success, failure) {
  book_DATABASE.getLinkBlock (blockElement, success, failure);
}

/*
*/
function book_page (id, success, failure) {
  book_DATABASE.getPage (id, success, failure);
}

/*
*/
function book_Page (parent, id, title, body) {
  menu_Page.call (this, parent, id, title);
  this.body = body;
}

/*
  Create a new prototype object for book_Page
  and set book_Element's prototype as the
  object's prototype.
*/
book_Page.prototype = Object.create (menu_Page.prototype);

/*
  Update the prototype's constructor property so
  that any functions that read it can determine
  which constructor function was used to
  construct its instance objects.
*/
book_Page.prototype.constructor = book_Page;

/*
*/
book_Page.prototype.getRawPageTemplate = function (success, failure) {
  getTemplate ('modules/book/templates/page_page_template.html', success, failure);
}

/*
*/
book_Page.prototype.getBodyElement = function () {
  return this.addAttributes (
    $('<div></div>')
      .addClass ('book_body')
      .addClass ('book_page_body')
      .html (this.body));
}

/*
*/
book_Page.prototype.getLabelElement = function () {
  return menu_Page.prototype.getLabelElement.call (this)
    .addClass ('book_label')
    .addClass ('book_page_label');
}

/*
*/
book_Page.prototype.getLinkElement = function (success, failure) {
  return menu_Page.prototype.getLinkElement.call (this)
    .addClass ('book_link')
    .addClass ('book_page_link');
}

/*
*/
book_Page.prototype.getContentsItemElement = function (numColumns, depth) {
  return menu_Page.prototype.getContentsItemElement.call (this, numColumns, depth)
    .addClass ('book_contents_item')
    .addClass ('book_contents_page_item');
}

/*
*/
function book_Section (parent, id, title, body, children) {
  menu_Section.call (this, parent, id, title, children);
  this.body = body;
}

/*
  Create a new prototype object for book_Section
  and set book_Element's prototype as the
  object's prototype.
*/
book_Section.prototype = Object.create (menu_Section.prototype);

/*
  Update the prototype's constructor property so
  that any functions that read it can determine
  which constructor function was used to
  construct its instance objects.
*/
book_Section.prototype.constructor = book_Section;

/*
*/
book_Section.prototype.getRawPageTemplate = function (success, failure) {
  getTemplate ('modules/book/templates/section_page_template.html', success, failure);
}

/*
*/
book_Section.prototype.getRawSectionTemplate = function (success, failure) {
  getTemplate ('modules/book/templates/section_section_template.html', success, failure);
}

/*
*/
book_Section.prototype.getBodyElement = function () {
  return this.addAttributes (
    $('<div></div>')
      .addClass ('book_body')
      .addClass ('book_section_body')
      .html (this.body));
}

/*
*/
book_Section.prototype.getLabelElement = function () {
  return menu_Section.prototype.getLabelElement.call (this)
    .addClass ('book_label')
    .addClass ('book_section_label');
}

/*
*/
book_Section.prototype.getLinkElement = function () {
  var element = null;
  var page = this.getFirstPage ();
  if (page) {
    element = menu_Element.prototype._getLinkElement.call (this, page.id);
  } else {
    strictError ('[menu][menu_Section.getLinkElement] Error: an error occured while trying to create a new section link. The section is empty.');
    element = menu_Element.prototype._getLinkElement.call (this, this.id);
  }
  return element
    .addClass ('book_link')
    .addClass ('book_section_link');
}

/*
*/
book_Section.prototype.getContentsItemElement = function (numColumns, depth) {
  return menu_Section.prototype.getContentsItemElement.call (this, numColumns, depth)
    .addClass ('book_contents_item')
    .addClass ('book_contents_section_item');
}

/*
*/
book_Section.prototype.getContentsElement = function (numColumns, depth) {
  return menu_Section.prototype.getContentsElement.call (this, numColumns, depth)
    .addClass ('book_contents')
    .addClass ('book_section_contents');
}

/*
*/
function book_Book (parent, id, title, body, children) {
  menu_Section.call (this, parent, id, title, children);
  this.body = body;
}

/*
  Create a new prototype object for book_Book
  and set book_Element's prototype as the
  object's prototype.
*/
book_Book.prototype = Object.create (menu_Section.prototype);

/*
  Update the prototype's constructor property so
  that any functions that read it can determine
  which constructor function was used to
  construct its instance objects.
*/
book_Book.prototype.constructor = book_Book;

/*
*/
book_Book.prototype.getRawPageTemplate = function (success, failure) {
  getTemplate ('modules/book/templates/book_page_template.html', success, failure);
}

/*
*/
book_Book.prototype.getRawSectionTemplate = function (success, failure) {
  getTemplate ('modules/book/templates/book_section_template.html', success, failure);
}

/*
*/
book_Book.prototype.getBodyElement = function () {
  return this.addAttributes (
    $('<div></div>')
      .addClass ('book_body')
      .addClass ('book_book_body')
      .html (this.body));
}

/*
*/
book_Book.prototype.getLabelElement = function () {
  return menu_Section.prototype.getLabelElement.call (this)
      .addClass ('book_label')
      .addClass ('book_book_label');
}

/*
*/
book_Book.prototype.getLinkElement = function () {
  return menu_Section.prototype.getLinkElement.call (this)
    .addClass ('book_link')
    .addClass ('book_book_link');
}

/*
*/
book_Book.prototype.getContentsItemElement = function (numColumns, depth) {
  return menu_Section.prototype.getContentsItemElement.call (this, numColumns, depth)
    .addClass ('book_contents_item')
    .addClass ('book_contents_book_item');
}

/*
*/
book_Book.prototype.getContentsElement = function (numColumns, depth) {
  return menu_Section.prototype.getContentsElement.call (this, numColumns, depth)
    .addClass ('book_contents')
    .addClass ('book_book_contents');
}

/*
*/
function book_Database (books) {
  menu_Database.call (this);
  this.books = books;
}

/*
*/
book_Database.prototype = Object.create (menu_Database.prototype);

/*
*/
book_Database.prototype.constructor = book_Database;

/*
*/
book_Database.prototype.getElement = function (id) {
  for (var i = 0; i < this.books.length; i ++) {
    var element = this.books [i].getElement (id);
    if (element) { return element; }
  }
  strictError ('[book][book_Database.getElement] Error: The referenced element does not exist.');
  return null;
}

/*
*/
book_Database.prototype.getBodyBlock = function (blockElement, success, failure) {
  var element = this.getElement (blockElement.text ()).getBodyElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
book_Database.prototype.getPage = function (id, success, failure) {
  this.getElement (id).getFullPageTemplate (success, failure);
}

/*
*/
function book_getId (type, path) {
  var uri = new URI ('').segmentCoded (type);
  path.forEach (
    function (name) {
      uri.segmentCoded (name);
  });
  return uri.toString ();
}