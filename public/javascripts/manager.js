let manager;


(function() {
  manager = {
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

    getContacts: function() {
      $.ajax({
        url: '/api/contacts',
        type: 'GET',
        dataType: "json",
      }).done((json, second, xhr) => {
        this.collection = json;
        console.log(xhr.status);
        this.loadMainPage();
      });
    },

    newContact: function(event) {
      event.preventDefault();
      let data = {};
      this.formToObject(event, data);
      $.ajax({
        url: '/api/contacts',
        type: 'POST',
        data: data,
        dataType: "json",
      }).done((json, second, xhr) => {
        // console.log(json);
        // console.log(xhr.status);
        this.getContacts();
      }).fail(error => {
        console.log(error.status);
      });
    },

    updateContact: function(event) {
      event.preventDefault();
      let id = this.findID(event);
      let contact = this.getSingleContact(id);
      this.formToObject(event, contact);

      $.ajax({
        url: `/api/contacts/${id}`,
        type: 'PUT',
        data: contact,
        dataType: 'json',
      }).done((json, second, xhr) => {
        console.log(xhr.status);
        console.log(json);
        this.getContacts();
      }).fail((xhr) => {
        console.log(xhr.status);
      });
    },

    delete: function(event) {
      let id = this.findID(event);
      $.ajax({
        url: `/api/contacts/${id}`,
        type: 'DELETE',
        dataType: 'text',
      }).done(() => {
        this.getContacts();
      }).fail((xhr) => {
        console.log(xhr.status);
      });
    },

    displayContent: function(domSection, template, content) {
      $(domSection).html(template(content));
    },

    generateSkeleton: function() {
      this.displayContent('section', this.templates.skeleton);
    },

    createAddPage: function() {
      this.templates.createContact()
      this.displayContent('section', this.templates.createContact);
    },

    loadEditPage: function(event) {
      let id = this.findID(event);
      let contact = this.getSingleContact(id);
      this.displayContent('section', this.templates.editContact, contact);
    },

    displayContacts: function(list, template = '#contactTemplate') {
      template = '#contactTemplate';
      this.displayContent('main', this.templates.contactTemplate, {contact: list})
    },

    getSingleContact: function(id) {
      return this.collection.find(person => person.id === id);
    },

    formToObject: function(event, object) {
      let formData = $(event.target).serializeArray();
      formData.forEach(item => {
        object[item.name] = item.value;
      });
    },

    loadMainPage: function() {
      this.generateSkeleton();
      this.generateMainPage();
    },

    generateMainPage: function() {
      this.updateTags();
      this.displayContacts(this.collection);
      this.displayContent('#tag-bar', this.templates.tagTemplate, {tag: this.tags})
    },

    findID: function(event) {
      return +$(event.target).closest('.id_finder').find('input[type=hidden]').val();
    },

    getCheckedValues: function() {
      return $.grep($('input[type=checkbox]'), (checkbox) => {
        return checkbox.checked;
      }).map(checkbox => checkbox.value);
    },

    filterChecked: function(values) {
      return this.collection.filter(contact => {
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

    displayFilteredTags: function() {
      let checkValues = this.getCheckedValues();
      if (checkValues.length === 0) {
        this.displayContacts(this.collection);
      } else {
        this.displayContacts(this.filterChecked(checkValues));
      }
    },

    searchFilter: function() {
      let input = $('input[type=search]').val().toLowerCase();
      this.displayContacts(this.filterByName(input));
    },

    filterByName: function(text) {
      return this.collection.filter(contact => {
        return contact.full_name.toLowerCase().includes(text);
      });
    },

    debounce: function(func, delay) {
      let timeout;
      return (...args) => {
        if (timeout) { clearTimeout(timeout) }
        timeout = setTimeout(() => func.apply(null, args), delay);
      };
    },

    compileTemplates: function() {
      let templates = $('script[type="text/x-handlebars"]');
      let self = this;
      $('script[type="text/x-handlebars"]').each(function() {
        let $template = $(this);
        self.templates[$template.attr('id')] = Handlebars.compile($template.html());
      });
    },

    init: function() {
      this.tags;
      this.collection;
      this.templates = {};
      this.searchFilter = this.debounce(this.searchFilter.bind(this), 300);
      this.compileTemplates();
      this.getContacts();
    },
  };
})();

$(() => {
  $(document.body).on('click', '[value=delete]', event => {
    manager.delete(event);
  });

  $(document.body).on('change', 'input[type=checkbox]', event => {
    manager.displayFilteredTags()
  });

  $(document.body).on('input', 'input[type=search]', event => {
    manager.searchFilter();
  });

  $(document.body).on('click', '.add', event => {
    manager.createAddPage()
  });

  $(document.body).on('click', 'input[value=Cancel]', event => {
    manager.loadMainPage();
  });

  $(document.body).on('submit', 'form.createNew', event => {
    manager.newContact(event);
  });

  $(document.body).on('submit', 'form.edit', event => {
    manager.updateContact(event);
  });

  $(document.body).on('click', 'input[value=edit]', event => {
    manager.loadEditPage(event);
  });
});

$(manager.init.bind(manager));


