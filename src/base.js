/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 20/05/13
 * Time: 8:55 PM
 * To change this template use File | Settings | File Templates.
 */
(function(){
    "use strict";

    var app = window.app;

    var BaseView = Backbone.View.extend({
        constructor: function (options) {
            Backbone.View.call(this, options);
            this.bindAnchorEvents();
            this.bindDataEvents();
            this.bindLoadingEvents();
        },
        bindAnchorEvents:function(){
            var _this = this;
            this.$el.on('click', 'a.action', function(e){
                e.preventDefault();
                e.stopPropagation();
                var href = $(e.currentTarget).attr('href');
                _this.actionHandler.call(_this, href);
            });
        },
        actionHandler:function(action){
            alert('unhandled action '+action);
        },
        bindDataEvents: function () {
            if (this.model) {
                this._bindDataEvents(this.model);
            }
            if (this.collection) {
                this._bindDataEvents(this.collection);
            }
        },

        bindLoadingEvents: function () {
            var _this = this;
            if (this.model) {
                this.model.on('change:isLoading', function (model, isLoading) {
                    if (isLoading) {
                        _this.showLoading();
                    } else {
                        _this.hideLoading();
                    }
                });
            }

        },
        _bindDataEvents: function (modelOrCollection) {
            var eventList, _this;
            _this = this;
            eventList = this.dataEvents;
            return _.each(eventList, function (handler, event) {
                var events, handlers, splitter;
                splitter = /\s+/;
                handlers = handler.split(splitter);
                events = event.split(splitter);
                return _.each(handlers, function (shandler) {
                    return _.each(events, function (sevent) {
                        return modelOrCollection.on(sevent, function () {
                            if (_this[shandler]) {
                                //var debounced = _.debounce(_this[shandler], 10);
                                var args = [].slice.call(arguments);
                                args.unshift(sevent);
                                return _this[shandler].apply(_this, args);
                            } else {
                                throw shandler + ' Not Defined';
                            }
                        });
                    });
                });
            });
        },
        renderTemplate: function () {
            if (typeof this.template === 'string') {
                //check for template script element
                if ($('script#' + this.template).length > 0) {
                    this.template = app.getTemplateFromScriptTag(this.template);
                }else{
                    //TODO: load template from external file
                    console.log('tod0');
                }
            }

            if(typeof this.template === 'function'){
                this.$el.html(this.template(this.model.toJSON()));
            }
            this.syncAttributes();
            
        },
        render:function(){
            this.beforeRender();
            this.renderTemplate();
            this.afterRender();
            return this;

        },
        beforeRender:function(){

        },
        afterRender:function(){

        },
        hideLoading:function(){
            this.$el.removeClass('loading');
        },
        showLoading:function(){
            this.$el.addClass('loading');
        }
    });

    var BaseModel = Backbone.Model.extend({
        is:function(param){
            return this.get(param) === true;
        },
        isNot:function(param){
            return !this.is(param);
        },
        isEqual:function(param, value){
            return this.get(param) === value;
        },
        isNotEqual:function(param, value){
            return !this.isEqual.apply(this, arguments);
        }
    });

    var BaseCollection = Backbone.Collection.extend({

    });

    window.Base = {};
    window.Base.View = BaseView;
    window.Base.Model = BaseModel;
    window.Base.Collection = BaseCollection;
})();