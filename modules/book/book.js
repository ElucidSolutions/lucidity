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

      // III. Register the book templates.
      template_registerTemplates (book_DATABASE.getTemplates ());

      // IV. Register the book menu.
      menu_MENU = book_DATABASE.getMenu ();

      // V. Register the block handlers.
      registerBlockHandlers ({
        book_body_block: book_bodyBlock,
      });

      // VI. Register the page handlers.
      registerPageHandlers ({
        book_book_page:    template_page,
        book_page_page:    template_page,
        book_section_page: template_page
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
  return new book_Book (
    book_getId ('book_book_page', path),
    $('> title', element).text (),
    $('> body',  element).text (),
    book_parseContent (path, $('> content', element).children ().toArray ())
  );
}

/*
  book_parseSection accepts two arguments:

  * parentPath, a string array
  * element, a JQuery HTML Element
*/
function book_parseSection (parentPath, element) {
  var path = parentPath.concat ($('> name', element).text ());
  return new book_Section (
    book_getId ('book_section_page', path),
    $('> title', element).text (),
    book_parseContent (path, $('> content', element).children ().toArray ())
  );
}

/*
  book_parsePage accepts two arguments:

  * parentPath, a string array
  * element, a JQuery HTML Element
*/
function book_parsePage (parentPath, element) {
  return new book_Page (
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
function book_parseContent (parentPath, elements) {
  return elements.map (
    function (element) {
      var element = $(element);
      switch (element.prop ('tagName')) {
        case 'section':
          return book_parseSection (parentPath, element);
        case 'page':
          return book_parsePage (parentPath, element);
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
function book_Page (id, title, body) {
  this.id     = id;
  this.title  = title;
  this.body   = body;
}

/*
*/
book_Page.prototype.getElement = function (id) {
  return this.id === id ? this : null;
}

/*
*/
book_Page.prototype.getRawPageTemplate = function (success, failure) {
  getTemplate ('modules/book/templates/page_page_template.html', success, failure);
}

/*
*/
book_Page.prototype.getTemplates = function () {
  return [new template_Page (null, this.id, this.getRawPageTemplate)];
}

/*
*/
book_Page.prototype.getMenuElements = function () {
  return [new menu_Leaf (null, this.id, this.title, this.getRawPageTemplate)];
}

/*
*/
book_Page.prototype.getBodyElement = function () {
  return $('<div></div>')
    .addClass ('book_body')
    .addClass ('book_page_body')
    .html (this.body);
}

/*
*/
function book_Section (id, title, children) {
  this.id       = id;
  this.title    = title;
  this.children = children;
}

/*
*/
book_Section.prototype.getElement = function (id) {
  if (this.id === id) { return this; }

  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getElement (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
book_Section.prototype.getRawSectionTemplate = function (success, failure) {
  getTemplate ('modules/book/templates/section_section_template.html', success, failure);
}

/*
*/
book_Section.prototype.getTemplates = function () {
  // I. Create the section template.
  var sectionTemplate = new template_Section (null, this.id, [], this.getRawSectionTemplate);

  // III. Create child templates.
  for (var i = 0; i < this.children.length; i ++) {
    templates = this.children [i].getTemplates ();
    for (var j = 0; j < templates.length; j ++) {
      var template = templates [j];
      template.parent = sectionTemplate;
      sectionTemplate.children.push (template);
    }
  }

  // IV. Return templates.
  return [sectionTemplate];
}

/*
*/
book_Section.prototype.getMenuElements = function () {
  // I. Create node element.
  var node = new menu_Node (null, this.id, this.title, [], this.getRawSectionTemplate);

  // II. Create children elements.
  for (var i = 0; i < this.children.length; i ++) {
    elements = this.children [i].getMenuElements ();
    for (var j = 0; j < elements.length; j ++) {
      elements [j].parent = node;
      node.children.push (elements [j]);
    }
  }
  return [node];
}

/*
*/
function book_Book (id, title, body, children) {
  book_Section.call (this, id, title, children);
  this.body = body;
}

/*
*/
book_Book.prototype = Object.create (book_Section.prototype);

/*
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
  return $('<div></div>')
    .addClass ('book_body')
    .addClass ('book_book_body')
    .html (this.body);
}

/*
*/
book_Book.prototype.getTemplates = function () {
  var templates = book_Section.prototype.getTemplates.call (this);
  templates.push (new template_Page (null, this.id, this.getRawPageTemplate));
  return templates;
}

/*
*/
book_Book.prototype.getMenuElements = function () {
  // I. Create node element.
  var node = new menu_Node (null, this.id, this.title, [], this.getRawSectionTemplate);

  // II. Create the leaf element.
  node.children.push (new menu_Leaf (node, this.id, this.title, this.getRawPageTemplate));

  // II. Create children elements.
  for (var i = 0; i < this.children.length; i ++) {
    elements = this.children [i].getMenuElements ();
    for (var j = 0; j < elements.length; j ++) {
      elements [j].parent = node;
      node.children.push (elements [j]);
    }
  }
  return [node];
}

/*
*/
function book_Database (books) {
  this.books = books;
}

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
book_Database.prototype.getTemplates = function () {
  var templates = [];
  for (var i = 0; i < this.books.length; i ++) {
    Array.prototype.push.apply (templates, this.books [i].getTemplates ());
  }
  return templates;
}

/*
*/
book_Database.prototype.getMenu = function () {
  var menu = new menu_Menu ([]);
  for (var i = 0; i < this.books.length; i ++) {
    Array.prototype.push.apply (menu.children, this.books [i].getMenuElements ());
  }
  return menu;
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
function book_getId (type, path) {
  var uri = new URI ('').segmentCoded (type);
  path.forEach (
    function (name) {
      uri.segmentCoded (name);
  });
  return uri.toString ();
}