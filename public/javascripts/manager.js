let Manager;
let API;
let Templater;
let Generator;
let Throttler;
let Filter;
let ConvertForm;

(function() {
  Throttler = {
    throttle: function(func, delay, context) {
      let timeout;
      return (...args) => {
        if (timeout) { clearTimeout(timeout) }
        timeout = setTimeout(() => func.apply(context, args), delay);
      };
    },
  };
})();


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

(function() {
  Filter = {
    singleContact: function(event, array) {
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

    byChecked: function(array) {
      let values = this.checkedValues();
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
})();

(function() {
  ConvertForm = {
    toObject: function(event, object) {
      let formData = $(event.target).serializeArray();
      formData.forEach(item => {
        object[item.name] = item.value;
      });
    },
  };
})();


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

    search: function() {
      let input = $('input[type=search]').val().toLowerCase();
      Generator.displayContacts(Filter.byName(this.collection, input));
    },

    // ******PAGE MANAGEMENT
    updateCollection: function(jsonData) {
      this.collection = jsonData;
    },

    displayFilteredTags: function() {
      let checkValues = Filter.checkedValues();
      if (checkValues.length === 0) {
        Generator.displayContacts(this.collection);
      } else {
        Generator.displayContacts(Filter.byChecked(this.collection));
      }
    },

    editPage: function(event) {
      let contact = Filter.singleContact(event, this.collection);
      Generator.contactEditor(contact);
    },

    loadMainPage: function() {
      this.updateTags();
      Generator.skeleton();
      Generator.mainPage(this.collection);
      Generator.displayTags(this.tags);
    },

    loadCreationPage: function() {
      Generator.contactCreation();
    },

    createNewContact: function(event) {
      event.preventDefault();
      let data = {};
      ConvertForm.toObject(event, data);
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
      let contact = Filter.singleContact(event, this.collection);
      ConvertForm.toObject(event, contact);
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
$(Generator.init.bind(Generator));