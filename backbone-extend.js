define(['layoutmanager'], function(Backbone){
  // BackboneView default options
  var viewOptions = {
    manage:true,
    swapView: function(view) {
      this.setElement(view.el);
      this.render();
      view.setElement(null);
      view.remove();
    },
    disposeEach: [],
    cleanup:function(){
      var disposeThing = function(thing) {
        if (thing) {
          if (thing.off) thing.off(null, null, this);
          if (thing.dispose) thing.dispose();
          if (this.disposeEach) {
            thing.disposeEach.forEach(function(dispose) {
              dispose.apply(thing); //apply to keep context the same.
            });
          }
          thing = undefined;
        }
      };
      var disposeThings = function(things) {
        if (things) {
          var key, thing;
          for (key in things) {
            thing = things[key];
            disposeThing(thing);
          }
        }
      };

      this.undelegateEvents();
      disposeThing(this.model);
      disposeThing(this.collection);
      disposeThings(this.models);
      disposeThings(this.collections);

      disposeThing(this);
    }
  };
  Backbone.View = Backbone.View.extend(viewOptions);
  Backbone.LayoutView = Backbone.LayoutView.extend(viewOptions);

  var modelFetch = Backbone.Model.prototype.fetch;
  var modelOptions = {
    fetch        : function (options) {
      if (options && options.data) {
        options.data = $.param(options.data);
      }
      modelFetch.call(this, options);
    },
    saveAttribute: function (attribute, value, options) {
      var self = this;
      options = options || {};
      options.success = options.success || function(){};
      options.error   = options.error   || function(){};

      if (!attribute) {
        throw new Error("Attribute is required");
      }
      var newData = {};
      newData[attribute] = value;
      if (!options.wait) {
        var prevValue = this.get(attribute);
        this.set(data, options);// for silent
      }

      $.ajax({
        url  : this.url()+'/'+attribute,
        type : "POST",
        success: function(data, textStatus, xhr) {
          if (options.wait) self.set(newData, options); // for silent
          options.success(this, data, xhr);
        },
        error  : function(xhr, textStatus, errorThrown) {
          var prevData = {};
          prevData[attribute] = prevValue;
          if (!options.wait) this.set(prevData, options); // for silent
          options.error(this, xhr);
        }
      });
    },
    destroyAttribute: function (attribute, options) {
      var self = this;
      options = options || {};
      options.success = options.success || function(){};
      options.error   = options.error   || function(){};

      if (!attribute) {
        throw new Error("Attribute is required");
      }

      if (!options.wait) {
        var prevValue = this.get(attribute);
        this.unset(attribute, options); // for silent
      }

      $.ajax({
        url  : this.url()+'/'+attribute,
        type : "DELETE",
        success: function(data, textStatus, xhr) {
          if (options.wait) self.unset(attribute, options); //for silent
          options.success(this, data, xhr);
        },
        error  : function(xhr, textStatus, errorThrown) {
          var prevData = {};
          prevData[attribute] = prevValue;
          if (!options.wait) this.set(prevData, options); // for silent
          options.error(this, xhr);
        }
      });
    }
  };

  Backbone.Model = Backbone.Model.extend(modelOptions);

  var collectionFetch = Backbone.Collection.prototype.fetch;
  var collectionOptions = {
    fetch        : function (options) {
      if (options && options.data) {
        options.data = $.param(options.data);
      }
      collectionFetch.call(this, options);
    }
  };

  Backbone.Collection = Backbone.Collection.extend(collectionOptions);

  Backbone.LayoutManager.configure({
    fetch : function(template){
      return template; //using hbs instead of text now..
    },
    render: function(template, context) {
      return template(context);
    }
  });

  console.log("extending backbone views and models");
  return Backbone;
});