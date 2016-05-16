/*
  Block Handler Stores store the registered
  block handlers and provide a safe interface
  for registering and retrieving them.
*/
function block_HandlerStore () {
  var self = this;

  /*
    An associative array of Block Handlers keyed
    by HTML class name strings. 
  */
  var _handlers = {};

  /*
    Accepts one argument: 

    * className, an HTML class name string

    and returns the first Handler in handlers
    that is associated with className. If none of
    the handlers in handlers are associated
    with className, this function returns null
    instead.
  */
  this.get = function (className) {
    return _handlers [className];
  }

  /*
    Accepts no arguments and returns a string
    array listing the registered block class
    names.
  */
  this.getClassNames = function () {
    return Object.keys (_handlers);
  }

  /*
    Accepts two arguments:

    * className, a string that represents an
      HTML class name
    * and handler, a Handler;

    and adds handler to handlers under
    className. If another handler has already
    been added to handlers under className,
    this function throws a strictError instead.
  */
  this.add = function (className, handler) {
    if (_handlers [className]) {
      return strictError (new Error ('[block][block_HandlerStore] Error: an error occured while trying to register a block handler for "' + className + '". Another block handler has already been registered for "' + className + '"'));
    }
    _handlers [className] = handler;
  }

  /*
    Accepts one argument:

    * handlers, an associative array of Block
      Handlers keyed by HTML class name strings

    and adds handlers to this._handlers. If
    any block handlers have already been added
    to this store under a class name listed
    in handlers, this function throws a strict
    error and skips the handler associated with
    the class name.
  */
  this.addHandlers = function (handlers) {
    for (var className in handlers) {
      self.add (className, handlers [className]);
    }
  }
}

/*
  A Handler Store that stores the registered
  block handlers.
*/
var block_HANDLERS = new block_HandlerStore ();

/*
  Accepts two arguments:

  * id, a string that represents a page ID
  * element, a JQuery Element that represents a block element

  and returns a Block Expansion Context.
*/
function block_Context (id, element) {
  this.getId = function () { return id; }
  this.element = element;
}

/*
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Register the core block handlers.
    block_HANDLERS.addHandlers ({
      'core_id_block':        block_idBlock,
      'block_template_block': block_templateBlock
    });

    // II. Continue.
    done (null);
});

/*
  block_expandDocumentBlocks accepts two
  arguments:

  * id, a Resource ID string
  * and done, a function that does not accept
    any arguments.

  block_expandDocumentBlocks expands the blocks
  contained within the current page and calls
  done.

  Note: block_expandDocumentBlocks sets the
  initial block expansion context's id to id.
*/
function block_expandDocumentBlocks (id, done) {
  block_expandBlock (new block_Context (id, $(document.body)), done);
}

/*
  block_expandBlock accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that does not accept
    any arguments.

  block_expandBlock recursively expands
  context.element and any blocks nested within
  context.element.

  If either context or context.element is undefined
  or null, block_expandBlock calls done.

  If none of the handlers can be applied to
  context.element, block_expandPageBlock simply
  calls done.

  If an error occurs, block_expandPageBlock
  calls done.

  Note: Block handlers must pass null or undefined
  to their continuations when they remove their
  block element.

  Note: Whenever a block handler replaces a block
  element, they must pass the replacement element
  to their successful continuations.

  Note: In rare circumstances, a block handler may
  intentionally prevent the block system from
  recursing into its expanded block element
  by intentionally passing null or undefined to
  its successful continuation. This should only be
  done when the expanded block element needs to be
  parsed by an external library.
*/
function block_expandBlock (context, done) {
  if (!context || !context.element) { return done (); }

  var id = context.getId ();
  async.mapSeries (
    block_getNestedBlocks (block_HANDLERS.getClassNames (), context.element),
    function (nestedBlockElement, next) {
      block_expandBlock (new block_Context (id, nestedBlockElement), next);
    },
    function (error) {
      if (error) { return done (error); }

      var blockHandler = block_getHandler (block_HANDLERS, context.element);
      if (blockHandler) {
        // Remove the block handler's class.
        context.element.removeClass (blockHandler.name);

        // Apply the block handler.
        return block_applyBlockHandler (blockHandler.handler, context,
          function (error, expandedElement) {
            if (error) { return done (error); }

            block_expandBlock (new block_Context (id, expandedElement), done);
        });
      }
      done ();
  });
}

/*
  Accepts two arguments:

  * classNames, a string array
  * and element, a JQuery HTML Element

  and returns the elements in element that have
  a class name listed in classNames as a JQuery
  HTML Element array.

  Unlike a JQuery selector, this function
  does not include the descendants of returned
  elements.
*/
function block_getNestedBlocks (classNames, element) {
  var blocks = [];
  element.children ().each (
    function (i, child) {
      child = $(child);
      var childClassNames = block_getClassNames (child);
      for (var i = 0; i < childClassNames.length; i ++) {
        var className = childClassNames [i];
        if (classNames.indexOf (className) !== -1) {
          return blocks.push (child);
        }
      }
      Array.prototype.push (blocks, block_getNestedBlocks (classNames, child));
  });
  return blocks;
}

/*
  block_getHandler accepts two arguments:

  * handlers, a Handler Store
  * and element, a JQuery Element.

  block_getHandler returns the first handler
  in handlers that is associated with one of
  element's classes and returns the associated
  class in an associative array that has two
  properties:

  * handler, the handler
  * and name, the class name.

  If none of the handlers are associated
  with any of element's classes, this function
  returns null.
*/
function block_getHandler (handlers, element) {
  // I. Get the set of possible block names.
  var names = block_getClassNames (element);

  // II. Find the first handler in handlers associated with one of the names.
  for (var nameIndex = 0; nameIndex < names.length; nameIndex ++) {
    var name = names [nameIndex];
    var handler = handlers.get (name);
    if (handler) {
      return {handler: handler, name: name};
    }
  }

  // III. Return null if none of the handlers in handlers are associated with any of the names.
  return null;
}

/*
  block_applyBlockHandler accepts four arguments:

  * handler, a Block Handler
  * context, a Block Expansion Context
  * done, a function that accepts two
    arguments: an Error object and a JQuery
    HTML Element

  block_applyBlockHandler applies handler to
  context.element and passes the result to done.
*/
function block_applyBlockHandler (handler, context, done) {
  switch ($.type (handler)) {
    case 'function':
      return handler (context, done,
        function (element, done) {
          block_expandBlock (new block_Context (context.getId (), element), done);
      });
    case 'string':
      return replaceWithTemplate (handler, context.element, done);
    default:
      var error = new Error ('[block][block_applyBlockHandler] Error: Invalid block handler. Block handlers must be either template URL strings or block handler functions.');
      strictError (error);
      return done (error);
  }
}

/*
  block_idBlock accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that accepts two
    arguments: an Error object and a JQuery
    HTML Element

  replaces context.element with context's page
  id and calls done.
*/
function block_idBlock (context, done) {
  context.element.replaceWith (context.getId ());
  return done ();
}

/*
  block_templateBlock accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that accepts two
    arguments: an Error object and a JQuery
    HTML Element

  context.element must contain a single text node that 
  represents an HTML document URL.

  block_templateBlock will load the referenced document, 
  replace context.element with the loaded content, and
  passes the content to done. If an error occurs,
  it will pass an error to done instead. 
*/
function block_templateBlock (context, done) {
  replaceWithTemplate (context.element.text (), context.element, done);
}

/*
  getBlockArguments accepts three arguments:

  * schema, an array of Block Schema objects
  * rootElement, a JQuery HTML Element
  * and done, a function that accepts two
    arguments: an Error object and a Block
    Arguments object.

  getBlockArguments finds the child elements of
  rootElement that have the argument class names
  given in schema, stores them in an associative
  array keyed by the names given in schema, and
  passes the resulting object to done.

  If any of the argument elements are listed as 
  required but none of the child elements have the
  given argument class name, this function throws a
  strict error and passes the error to done.
*/
function getBlockArguments (schema, rootElement, done) {
  var elements = {};
  for (var i = 0; i < schema.length; i ++) {
    var scheme  = schema [i];
    var element = $('> .' + scheme.name, rootElement);
    if (element.length > 0) {
      elements [scheme.name] = scheme.text ? element.text () : element;
    } else if (scheme.required) {
      var error = new Error ('[core][getBlockArguments] Error: an error occured while trying to get a required element. The "' + scheme.name + '" element is required.');
      strictError (error);
      return done (error);
    }
  }
  done (null, elements);
}

/*
  block_getClassNames accepts a JQuery HTML
  Element, element, and returns a string array
  listing element's class names.
*/
function block_getClassNames (element) {
  var classNames = element.attr ('class');
  return classNames ? classNames.split (/\s+/) : [];
}