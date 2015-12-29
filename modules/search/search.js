/*
*/
var search_DATABASE_URL = 'modules/search/database.xml';

/*
*/
var search_DATABASE = {};

/*
*/
var search_INTERFACES = {};

/*
*/
var search_SOURCES = {};

/*
*/
var search_ENTRIES = {};

/*
*/
var search_LUNR_INDICES = {};

/*
*/
(function () {
  var failure = function () {};

  // I. Load libraries.
  loadScript ('modules/search/lib/lunr/lunr.js',
    function () {
      // II. Load the search database.
      search_loadDatabase (search_DATABASE_URL,
        function (database) {
          search_DATABASE = database;

          // III. Register the block handlers.
          registerBlockHandlers ({
            search_filter_block:    search_filterBlock,
            search_form_block:      search_formBlock,
            search_index_block:     search_indexBlock,
            search_interface_block: search_interfaceBlock,
            search_link_block:      search_linkBlock,
            search_results_block:   search_resultsBlock
          });

          // IV. Register the page handlers.
          registerPageHandler ('search_page_block', 'modules/search/templates/search_page.html');
        },
        failure
      );
  });
}) ();

/*
*/
function search_filterBlock (blockElement, success, failure, expand) {
  var interface = search_INTERFACES [blockElement.text ()];
  if (!interface) {
    strictError ('[search][search_filterBlock] Error: The "' + blockElement.text () + '" search interface has not been initialized.'); 
    return failure ();
  }
  interface.getFilterElement (
    function (filterElement) {
      blockElement.replaceWith (filterElement);
      success (filterElement);
    },
    failure, expand
  );
}

/*
  search_form_block accepts three arguments:

  * blockElement, a JQuery HTML Element
  * and success and failure, two functions that
    do not accept any arguments.

  blockElement must contain a single text node
  that represents a Search Interface id.

  search_form_block replaces blockElement with an
  inline search form and calls success. Whenever
  a query is entered into the form, an event
  handler executes the query against the
  referenced search interface.

  If an error occurs, search_block calls failure
  instead of success.
*/
function search_formBlock (blockElement, success, failure) {
  var interface = search_INTERFACES [blockElement.text ()];
  if (!interface) {
    strictError ('[search][search_formBlock] Error: The "' + blockElement.text () + '" search interface has not been initialized.');
    return failure ();
  }
  var element = search_createFormElement (interface);
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
function search_indexBlock (blockElement, success, failure) {
  var indexName = blockElement.text ();
  var index = search_DATABASE [indexName];
  if (!index) {
    strictError ();
    return failure ();
  }
  index.getLunrIndex (
    function (lunrIndex) {
      var element = $('<div></div>')
        .addClass ('search_index')
        .append ($('<div></div>')
          .addClass ('search_index_name')
          .text (indexName))
        .append ($('<textarea></textarea>')
          .addClass ('search_lunr_index')
          .text (JSON.stringify (lunrIndex.toJSON ())));

      blockElement.replaceWith (element);
      success ();
    },
    failure
  ); 
}

/*
  search_interfaceBlock accepts three arguments:

  * blockElement, a JQuery HTML Element
  * and success and failure, two functions that
    do not accept any arguments.

  blockElement must have an HTML id attribute
  and contain a single text node that represents
  a Search Id.

  search_interfaceBlock removes blockElement,
  creates a search interface linked to the index
  given by the search id, adds the interface to
  search_INTERFACES using blockElement's id as
  the interface id, and calls success.

  If the search id includes a query,
  search_interfaceBlock executes it before
  calling success.

  If an error occurs, search_interfaceBlock
  calls failure instead of success.
*/
function search_interfaceBlock (blockElement, success, failure) {
  var errorMessage = '[search][search_interfaceBlock]';

  // I. Get the interface ID
  var interfaceId = blockElement.attr ('id');
  if (!interfaceId) {
    strictError (errorMessage + ' Error: The Search Interface block is invalid. The HTML ID attribute is required for Search Interface blocks.');
    return failure ();
  }

  // II. Parse the search ID
  var searchId    = new URI (blockElement.text ());
  var indexName   = searchId.segmentCoded (1);
  var query       = searchId.segmentCoded (2);
  var start       = parseInt (searchId.segment (3), 10);
  var num         = parseInt (searchId.segment (4), 10);

  if (isNaN (start)) {
    strictError (errorMessage + ' Error: "' + blockElement.text () + '" is an invalid search id. The "start" parameter is missing or invalid.');
    start = 0;
  }
  if (isNaN (num)) {
    strictError (errorMessage + ' Error: "' + blockElement.text () + '" is an invalid search id. The "num" parameter is missing or invalid.');
    num = 10;
  }

  // II. Remove the block element
  blockElement.remove ();

  // III. Create and register the search interface 
  var index = search_DATABASE [indexName];
  if (!index) {
    strictError ();
    return failure ();
  }

  var interface = new search_Interface (index, start, num);

  search_INTERFACES [interfaceId] = interface;

  query ? interface.search (query, success) : success ();
}

/*
  search_linkBlock accepts three arguments:

  * blockElement, a JQuery HTML Element
  * and done, a function that does not accept
    any arguments.

  blockElement must contain a single text node that
  represents a Search Id. 

  search_linkBlock replaces blockElement with
  a search form linked to the referenced search
  index and calls done. Whenever a user enters
  a query into the form, the Search module will
  redirect them to the search results page.
*/
function search_linkBlock (blockElement, done) {
  var searchId = new URI (blockElement.text ());
  var element = search_createLinkElement (searchId);
  blockElement.replaceWith (element);
  done (element);
}

/*
  search_resultsBlock accepts four arguments:
  
  * blockElement, a JQuery HTML Element
  * success, a function that acepts a JQuery
    HTML Element
  * failure, a function that does not accept
    any arguments
  * and expand, a function that accepts a JQuery
    HTML Element.

  blockElement must contain a single text node
  that represents a Search Interface id.

  search_resultsElement replaces blockElement
  with a search results element that lists the
  results returned by the last query executed
  against the referenced interface and then calls
  success. Whenever the interface executes a
  new query, an event handler updates this list.

  If an error occurs, search_resultsBlock calls
  failure instead of success.
*/
function search_resultsBlock (blockElement, success, failure, expand) {
  var interface = search_INTERFACES [blockElement.text ()];
  if (!interface) {
    strictError ('[search][search_resultsBlock] Error: The "' + blockElement.text () + '" search interface has not been initialized.');
    return failure ();
  }
  interface.getResultsElement (
    function (resultsElement) {
      blockElement.replaceWith (resultsElement);
      success (resultsElement);
    },
    failure, expand
  );
} 

/*
*/
function search_registerSource (name, source) {
  if (search_SOURCES [name]) {
    return strictError ();
  }
  search_SOURCES [name] = source;
}

/*
*/
function search_loadDatabase (url, success, failure) {
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      success (search_parseDatabase (doc));
    },
    error: function (request, status, error) {
      strictError ();
      failure (); 
    }
  });
}

/*
*/
function search_parseDatabase (databaseElement) {
  var database = {};
  $('> database > index', databaseElement).each (
    function (i, indexElement) {
      database [$('> name', indexElement).text ()]
        = new search_Index (
            $('> lunrIndexURL', indexElement).text (),
            $('> setIds > setId', indexElement).map (
              function (i, setElement) {
                return $(setElement).text ();
              }).toArray ());
  });
  return database;
}

/*
*/
function search_Index (lunrIndexURL, setIds) {
  this.lunrIndexURL = lunrIndexURL;
  this.setIds = setIds;
}

/*
*/
search_Index.prototype.getLunrIndex = function (success, failure) {
  if (this.lunrIndex) {
    return success (this.lunrIndex);
  } 
  if (this.lunrIndexURL) {
    var self = this;
    return search_loadLunrIndex (this.lunrIndexURL,
      function (lunrIndex) {
        self.lunrIndex = lunrIndex;
        success (lunrIndex);
      },
      failure
    );
  }
  this.createLunrIndex (success, failure);
}

/*
*/
search_Index.prototype.createLunrIndex = function (success, failure) {
  var self = this;
  this.getEntries (
    function (entries) {
      self.lunrIndex = search_createLunrIndex (entries);
      success (self.lunrIndex);
    },
    failure
  );
}

/*
*/
search_Index.prototype.getEntries = function (success, failure) {
  if (this.entries) {
    return success (this.entries);
  }
  var self = this;
  search_getSetsEntries (this.setIds,
    function (entries) {
      self.entries = entries;
      success (entries);
    },
    failure
  );
}

/*
*/
function search_loadLunrIndex (url, success, failure) {
  $.get (url,
    function (json) {
      index = lunr.Index.load (json);
      success (index);
    },
    'json'
  ).fail (function () {
    strictError ();
    failure ();
  });
}

/*
*/
function search_Entry (id) {
  this.id = id;
}

/*
*/
search_Entry.prototype.getResultElement = function (done) {
  done ($('<li></li>')
    .addClass ('search_result')
    .addClass ('search_' + getContentType (this.id) + '_result')
    .append ($('<div></div>')
      .addClass ('search_result_id')
      .append (getContentLink (this.id, this.id))));
}

/*
*/
function search_getEntriesResultElements (entries, success, failure) {
  map (
    function (entry, success, failure) {
      entry.getResultElement (success);
    },
    entries, success, failure
  );
}

/*
*/
function search_Interface (index, start, num) {
  this.index               = index;
  this.query               = ''; 
  this.start               = start;
  this.num                 = num;
  this.results             = []; 
  this.searchEventHandlers = [];
}

/*
*/
search_Interface.prototype.search = function (query, done) {
  this.query = query;
  var self = this;
  this.index.getLunrIndex (
    function (lunrIndex) {
      self.results = lunrIndex.search (query);
      self.callSearchEventHandlers (done);
    },
    done
  );
}

/*
*/
search_Interface.prototype.callSearchEventHandlers = function (done) {
  seq (this.searchEventHandlers, done);
}

/*
*/
search_Interface.prototype.getFilterElement = function (success, failure, expand) {
  var filterElement = $('<ol></ol>').addClass ('search_filter');

  var self = this;
  this.getFilterElements (
    function (filterElements) {
      self.searchEventHandlers.push (
	function (done) {
	  self.getFilterElements (
	    function (filterElements) {
	      expand (filterElement.empty ().append (resultElements), done);
	    },
	    done
	  );
      });

      success (filterElement.append (resultElements));
    },
    failure
  );
}

/*
*/
search_Interface.prototype.getFilterElements = function (success, failure) {
  if (!this.query) {
    return this.index.getEntries (
      function (entries) {
        search_getEntriesResultElements (entries, success, failure);
      },
      failure
    );
  }
  this.getResultElements (success, failure);
}

/*
*/
search_Interface.prototype.getResultsElement = function (success, failure, expand) {
  var self = this;
  this.getResultElements (
    function (resultElements) {
      var resultsElement = $('<ol></ol>').addClass ('search_results').append (resultElements);

      self.searchEventHandlers.push (
        function (done) {
          self.getResultElements (
            function (resultElements) {
              expand (resultsElement.empty ().append (resultElements), done);
            },
            done 
          );
      });
      success (resultsElement);
    },
    failure
  );
}

/*
*/
search_Interface.prototype.getResultElements = function (success, failure) {
  var self = this;
  this.getResultEntries (
    function (entries) {
      search_getEntriesResultElements (entries, success, failure);
    },
    failure
  );
}

/*
*/
search_Interface.prototype.getResultEntries = function (success, failure) {
  var self = this;
  this.index.getEntries (
    function (entries) {
      success (self.getResults ().map (
        function (result) {
          var entry = search_getEntry (entries, result.ref);
          if (!entry) {
            strictError ();
            return;
          }
          return entry;
      }));
    },
    failure
  );
}

/*
*/
search_Interface.prototype.getResults = function () {
  return this.results.slice (this.start, this.start + this.num);
}

/*
*/
function search_createLunrIndex (entries) {
  var index = lunr (
    function () {
      var names = search_getFieldNames (entries);
      var numNames = names.length;
      for (var i = 0; i < numNames; i ++) {
        this.field (names [i]);
      }
  });
  var numEntries = entries.length;
  for (var i = 0; i < numEntries; i ++) {
    index.add (entries [i]);
  }
  return index;
}

/*
*/
function search_getFieldNames (entries) {
  var names = [];
  var numEntries = entries.length;
  for (var i = 0; i < numEntries; i ++) {
    var entry = entries [i];
    var entryNames = Object.keys (entry);
    var numEntryNames = entryNames.length;
    for (var j = 0; j < numEntryNames; j ++) {
      var entryName = entryNames [j];
      if (names.indexOf (entryName) === -1) {
        names.push (entryName);
      }
    }
  }
  return names;
}

/*
*/
function search_getSetsEntries (setIds, success, failure) {
  fold (
    function (entries, setId, success, failure) {
      search_getSetEntries (setId,
        function (sourceEntries) {
          Array.prototype.push.apply (entries, sourceEntries);
          success (entries);
        },
        failure
      );
    },
    [], setIds, success, failure
  );
}

/*
*/
function search_getSetEntries (setId, success, failure) {
  if (search_ENTRIES [setId]) {
    return success (search_ENTRIES [setId]);
  }

  var path = new URI (setId).segmentCoded ();
  if (path.length < 1) {
    strictError ();
    return failure ();
  }

  var sourceName = path [0];
  var source = search_SOURCES [sourceName];
  if (!source) {
    strictError ();
    return failure ();
  }

  var setName = path.length > 1 ? path [1] : null;
  source (setName, success, failure);
}

/*
*/
function search_getEntry (entries, id) {
  return find (function (entry) { return entry.id === id; }, entries);
}

/*
  search_createFormElement accepts one argument:
  interface, a Search Interface; and returns a
  search form element linked to interface as a
  JQuery HTML Element.
*/
function search_createFormElement (interface) {
  var element = $('<input></input>')
    .addClass ('search_form')
    .attr ('type', 'text')
    .attr ('placeholder', 'Search')
    .val (interface.query)
    .on ('input', function () {
       interface.search ($(this).val (), function () {});
     });

  interface.searchEventHandlers.push (
    function (done) {
      element.val (interface.query);
      done ();
  });

  return element;
}

/*
  search_createLinkElement accepts one argument:
  searchId, a Search Id; and returns a search
  form as a JQuery HTML Element.

  If a user enters a query in the form, the
  Search module will redirect the user to the
  search results page with the query.
*/
function search_createLinkElement (searchId) {
  return $('<input></input>')
    .addClass ('search_link')
    .attr ('type', 'text')
    .attr ('placeholder', 'Search')
    .val (searchId.segmentCoded (2))
    .keypress (function (event) {
      if (event.which === 13) {
        var keywords = $(this).val ();
        var id = new URI ('')
          .segmentCoded ('search_page_block')
          .segmentCoded (searchId.segmentCoded (1))
          .segmentCoded (keywords ? keywords : ' ')
          .segment (searchId.segment (3))
          .segment (searchId.segment (4))
          .toString ();

        loadPage (id, function () {});
      }
    });
}