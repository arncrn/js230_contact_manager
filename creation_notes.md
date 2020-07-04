MAIN PAGE
if there are no contacts, display that there are no contacts, and have an 'add contact' button as the main content

If there are contacts, display contacts

CREATE CONTACT FORM
  fullname: cannot be blank
            no limit to amount of chars??? (cut down to 20)
  email address: cannot be blank
                 requires char + `@` + char + `.` + 2 chars
  telephone number: cannot be blank

flash messages when input is invalid


SEARCH
flash message displays if there are no matches
filters the contacts by name

TAGGING FEATURE
allows you to create tags
  - marketing, sales, engineering
when add/edit a contact, you can select a tag to attach to the contact

you can click on a tag and show all contacts w/ that tag.


CONTACT
contains: an `edit` and `delete` choice
delete: shows an alert, verify if you want to delete the contact
edit: brings up an edit page




**********
create a single global variable to access from the terminal (testing purposes)
  initialize it with an IIFE

encapsulate all event details into an object.






Because Ajax calls are asynchronous by default, the response is not immediately available. Responses can only be handled using a callback

----- You can access the returned XHR data inside of the callback, but not from outside of it.  Inside of the callback, data is set once the data has returned from the server.  Outside of the callback, the data does not exist yet, and will be undefined.



If text or html is specified, no pre-processing occurs. The data is simply passed on to the success handler, and made available through the responseText property of the jqXHR object.



If json is specified, the response is parsed using jQuery.parseJSON before being passed, as an object, to the success handler. The parsed JSON object is made available through the responseJSON property of the jqXHR object.

With regards to importing and exporting, you have to specify that manager.js is a module (i.e., <script type="module" src="/javascripts/manager.js"></script>). You shouldn't need a script tag for debounce also.

In terms of your code, a refactor I'd recommend is to break down your manager object into smaller objects that have more specific responsibilities. This would make the design easier to reason about since it will give you an added layer of abstraction.


// $(() => {
// DELETE A CONTACT
// http://localhost:3000/api/contacts/:id
  // $.ajax({
  //   url: '/api/contacts/5',
  //   type: 'DELETE',
  //   dataType: 'text',
  // }).fail((xhr) => {
  //   console.log(xhr.status);
  // });

// GET ALL CONTACTS
// GET http://localhost:3000/api/contacts
  // $.ajax({
  //   url: '/api/contacts',
  //   type: 'GET',
  //   dataType: "json",
  // }).done((json, second, xhr) => {
  //   // do something with json
  //   console.log(xhr.status);
  // });

// GET SINGLE CONTACT
// http://localhost:3000/api/contacts/:id
  // $.ajax({
  //   url: '/api/contacts/1',
  //   type: 'GET',
  //   dataType: 'json',
  // }).done((json, _, xhr) => {
  //   console.log(xhr.status);
  //   console.log(json);
  // }).fail(error => {
  //   console.log(error.status);
  // });


// CREATE A NEW CONTACT
// http://localhost:3000/api/contacts/
// $.ajax({
//     url: '/api/contacts',
//     type: 'POST',
//     data: {
//       full_name: 'Aaron C',
//       email: 'me@me.com',
//       phone_number: '7751234567',
//       tags: 'i,am,a,master',
//     },
//     dataType: "json",
//   }).done((json, second, xhr) => {
//     console.log(json);
//     console.log(xhr.status);
//   }).fail(error => {
//     console.log(error.status);
//   });

// UPDATE A CONTACT
// http://localhost:3000/api/contacts/:id
// $.ajax({
//     url: '/api/contacts/11',
//     type: 'PUT',
//     data: {
//       id: 11,
//       full_name: 'Aaron Crane',
//       email: 'skilledjuggler@gmail.com',
//       phone_number: '775 313 6696',
//       tags:'i,might,have,done,it',
//   },
//     dataType: 'json',
//   }).done((json, second, xhr) => {
//     console.log(xhr.status);
//     console.log(json);
//   }).fail((xhr) => {
//     console.log(xhr.status);
//   });
// });




<!-- templating -->
<!-- api calls (retrieving, creating, deleting and updating contacts) -->
managing tags
<!-- displaying page -->
filtering
<!-- throttling -->
event handling
utilities (findID, form conversion)



Managing them all in one place.












let Manager;
let API;
let Templater;
let Generator;
let Throttler;
let Filter;


Throttler = {
  debounce: function(func, delay) {
    let timeout;
    return (...args) => {
      if (timeout) { clearTimeout(timeout) }
      timeout = setTimeout(() => func.apply(null, args), delay);
    };
  },

  throttle: function(func, duration, context) {
    return this.debounce(func.bind(context), duration)
  },
};

(function(){
  API = {
    getContacts: function(url, callbacks, context) {
      $.ajax({
        url: url,
        dataType: "json",
      }).done((json, second, xhr) => {
        callbacks.forEach(callback => {
          callback.call(context, json);
        });
      });
    },

    newContact: function(url, data, callback, context) {
      $.ajax({
        url: url,
        type: 'POST',
        data: data,
        dataType: "json",
      }).done((json) => {
        callback.call(context);
      }).fail(error => {
        console.log(error.status);
      });
    },

    updateContact: function(url, data, callback, context) {
      $.ajax({
        url: url,
        type: 'PUT',
        data: data,
        dataType: 'json',
      }).done((json) => {
        callback.call(context);
      }).fail((xhr) => {
        console.log(xhr.status);
      });
    },

    delete: function(url, callback, context) {
      $.ajax({
        url: url,
        type: 'DELETE',
        dataType: 'text',
      }).done(() => {
        callback.call(context);
      }).fail((xhr) => {
        console.log(xhr.status);
      });
    },
  };
})();


(function() {
  Templater = {
    templates: {},
    compile: function() {
      let templates = $('script[type="text/x-handlebars"]');
      let self = this;
      $('script[type="text/x-handlebars"]').each(function() {
        let $template = $(this);
        self.templates[$template.attr('id')] = Handlebars.compile($template.html());
      });
    },

    init: function() {
      this.compile();
      return this;
    },
  };
})();

(function() {
  Generator = {
    displayContent: function(domSection, template, content) {
      $(domSection).html(template(content));
    },

    skeleton: function() {
      this.displayContent('section', this.templates.skeleton);
    },

    contactCreation: function() {
      this.templates.createContact()
      this.displayContent('section', this.templates.createContact);
    },

    contactEditor: function(contact) {
      this.displayContent('section', this.templates.editContact, contact);
    },

    displayContacts: function(list) {
      this.displayContent('main', this.templates.contactTemplate, {contact: list})
    },

    displayTags: function(tags) {
      this.displayContent('#tag-bar', this.templates.tagTemplate, {tag: tags});
    },

    mainPage: function(collection) {
      this.displayContacts(collection);
    },

    init: function(templates) {
      this.data;
      this.templates = Templater.templates;
      this.templates;
      return this;
    }
  };
})();

Filter = {
  getSingleContact: function(event, array) {
    let id = this.findID(event);
    return array.find(person => person.id === id);
  },

  findID: function(event) {
    return +$(event.target).closest('.id_finder').find('input[type=hidden]').val();
  },

  checkedValues: function() {
    return $.grep($('input[type=checkbox]'), (checkbox) => {
      return checkbox.checked;
    }).map(checkbox => checkbox.value);
  },

  byChecked: function(array, values) {
    console.log(values)
      return array.filter(contact => {
        let found = false;
        for (let i = 0; i < values.length; i += 1) {
          let tags = contact.tags;
          if (tags && tags.includes(values[i])) {
            return true;
          }
        }
        return false;
      });
    },

    byName: function(array, text) {
      return array.filter(contact => {
        return contact.full_name.toLowerCase().includes(text);
      });
    },
};


(function() {
  Manager = {
    updateTags: function() {
      let tagNames = this.getTagArray();
      let tagObjects = [];
      tagNames.forEach(name => {
        tagObjects.push({tagName: `${name}`});
      });
      this.tags = tagObjects;
    },

    getTagArray: function() {
      return this.collection.reduce((arr, obj) => {
        let tags = obj.tags || '';
        if (tags) {
          tags.split(',').forEach(tag => {
            tag = tag.trim();
            if (!arr.includes(tag)) arr.push(tag);
          });
        }
        return arr;
      }, []);
    },

    formToObject: function(event, object) {
      let formData = $(event.target).serializeArray();
      formData.forEach(item => {
        object[item.name] = item.value;
      });
    },

    search: function() {
      let input = $('input[type=search]').val().toLowerCase();
      this.Generator.displayContacts(Filter.byName(this.collection, input));
    },

    // ******PAGE MANAGEMENT
    updateCollection: function(jsonData) {
      this.collection = jsonData;
    },

    displayFilteredTags: function() {
      let checkValues = Filter.checkedValues();
      if (checkValues.length === 0) {
        this.Generator.displayContacts(this.collection);
      } else {
        this.Generator.displayContacts(Filter.byChecked(checkValues));
      }
    },

    editPage: function(event) {
      let contact = Filter.getSingleContact(event, this.collection);
      this.Generator.contactEditor(contact);
    },

    loadMainPage: function() {
      this.updateTags();
      this.Generator.skeleton();
      this.Generator.mainPage(this.collection);
      this.Generator.displayTags(this.tags);
    },

    loadCreationPage: function() {
      this.Generator.contactCreation();
    },

    // ****API CALLS****
    createNewContact: function(event) {
      event.preventDefault();
      let data = {};
      this.formToObject(event, data);
      this.api.newContact('/api/contacts', data, this.updatePage, this);
    },

    updatePage: function() {
      this.api.getContacts('/api/contacts',
                          [this.updateCollection, this.loadMainPage],
                          this);
    },

    updateContact(event) {
      event.preventDefault();
      let id = Filter.findID(event);
      let contact = Filter.getSingleContact(event, this.collection);
      this.formToObject(event, contact);
      this.api.updateContact(`/api/contacts/${id}`, contact, this.updatePage, this);
    },

    delete: function(event) {
      let id = Filter.findID(event);
      this.api.delete(`/api/contacts/${id}`, this.updatePage, this);
    },

    init: function() {
      this.tags;
      this.collection;
      this.search = Throttler.throttle(this.search, 300, this);
      this.api = API;
      this.Generator = Generator.init();
      this.updatePage();
    },
  };
})();

$(() => {
  $(document.body).on('click', '[value=delete]', event => {
    Manager.delete(event);
  });

  $(document.body).on('change', 'input[type=checkbox]', event => {
    Manager.displayFilteredTags()
  });

  $(document.body).on('input', 'input[type=search]', event => {
    Manager.search();
  });

  $(document.body).on('click', '.add', event => {
    Manager.loadCreationPage()
  });

  $(document.body).on('click', 'input[value=Cancel]', event => {
    Manager.loadMainPage();
  });

  $(document.body).on('submit', 'form.createNew', event => {
    Manager.createNewContact(event);
  });

  $(document.body).on('submit', 'form.edit', event => {
    Manager.updateContact(event);
  });

  $(document.body).on('click', 'input[value=edit]', event => {
    Manager.editPage(event);
  });
});

$(Manager.init.bind(Manager));
$(Templater.init.bind(Templater));