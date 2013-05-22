/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 20/05/13
 * Time: 8:41 PM
 * To change this template use File | Settings | File Templates.
 */

(function () {
    "use strict";
    var HandleBars = window.Handlebars;
    var app = window.app;
    var Base = window.Base;

    var ElementModel = Base.Model.extend({
            defaults:{
                valid:true,
                disabled:false,
                readonly:false,
                value:null,
                label:null,
                group:'elements'
            },
        idAttribute:'name'
    });

    var ElementCollection = Base.Collection.extend({
        model:ElementModel
    });


    var InputView = Base.View.extend({
        tagName:'div',
        className:'element',
        dataEvents:{
            'change' :'watchAttributes'
        },
        events:{
            'change input': 'updateValue',
            'blur input': 'updateValue'
        },
        template:'inputView',
        render:function(){
            if(typeof this.template === 'string'){
                if($('script#'+this.template).length > 0){
                    this.template = app.getTemplateFromScriptTag(this.template);
                }

            }
            this.$el.html(this.template(this.model.toJSON()));
            this.syncAttributes();
            return this;
        },
        watchAttributes:function(eventType,model){
            var changes = model.changedAttributes();
            _.each(changes, function(value, attribute){
                var handler = this[attribute+'ChangeHandler'];
                if(handler && typeof handler==='function'){
                    handler.call(this, model.get(attribute));
                }
            },this);
        },
        syncAttributes:function(){
            var model = this.model;
            var attr = model.toJSON();
            _.each(attr, function(value, attribute){
                var handler = this[attribute+'ChangeHandler'];
                if(handler && typeof handler==='function'){
                    handler.call(this, model.get(attribute));
                }
            },this);
        },
//        typeChangeHandler:function(value){
//            this.$('input').attr('type', value);
//        },
        disabledChangeHandler:function(value){
            this.$el.toggleClass('disabled', value);
            this.$('input').attr('disabled', value);
        },
        readonlyChangeHandler:function(value){
            this.$el.toggleClass('readonly', value);
            this.$('input').attr('readonly', value);
        },
        validChangeHandler:function(value){
            this.$el.toggleClass('readonly', value);
            this.$('input').attr('readonly', value);
        },
        valueChangeHandler:function(value){
            this.$('input').val(value);
        },
        valueFunction:function(){
            return this.$('input').val();
        },
        updateValue:function(){
            this.model.set('value', this.valueFunction());
        }
    });

    var CheckboxView = InputView.extend({
        valueFunction:function(){
            return this.$('input').is(':checked');
        },
        valueChangeHandler:function(value){
            this.$('input').attr('checked',value);
        }
    });

    var SelectView = InputView.extend({
        template:'selectView',
        events:{
            'change select': 'updateValue',
            'blur select': 'updateValue'
        },
        valueFunction:function(){
            return this.$('select').val();
        },
        valueChangeHandler:function(value){
            this.$('select').val(value);
        }
    });


    var RadioListView = InputView.extend({
        template:'radioListView',
        valueFunction:function(){
            return this.$('input:checked').val();
        },
        valueChangeHandler:function(value){
            this.$('input[value='+value+']').attr('checked',true);
        }
    });

    var CheckListView = InputView.extend({
        template:'checkListView',
        valueFunction:function(){
            var selectedOptions = this.$('input:checked');

            var valueArr = _.map(selectedOptions, function(option){
                return $(option).val();
            });

            return valueArr;
        },
        valueChangeHandler:function(valueArr){
            //this.$('input[value='+value+']').attr('checked',true);
            if(_.isArray(valueArr)){
                _.each(valueArr,function(value){
                    this.$('input[value='+value+']').attr('checked', true);
                }, this);
            }
        }
    });

    var CheckboxList = InputView.extend({
        valueFunction:function(){
            return this.$('input').is(':checked');
        },
        valueChangeHandler:function(value){
            this.$('input').attr('checked',value);
        }
    });

    var FormModel = Base.Model.extend({
        constructor:function(){
            Base.Model.apply(this,arguments);
            var elements = this.get('elements');
            elements.on('all',function(eventName, model){
                var args = Array.prototype.slice.call(arguments, [0]);
                args[0] = 'elements:'+eventName;
                this.trigger.apply(this, args);
                args[0] = 'elements:'+model.get('name')+':'+eventName;
                this.trigger.apply(this, args);
            },this);
        },
        defaults:{
            elements : new Base.Collection()
        },
        setElementAttribute:function(elementName, attribute, value){
            var elements = this.get('elements');
            elements.get(elementName).set(attribute, value);
        },
        getValueObject:function(){
            var elements = this.get('elements');
            var arr = elements.map(function(model){
                var obj = {};
                obj[model.id] = model.get('value');
                return obj;
            });

            return _.extend.apply(null, arr);
        }

    });


    var groupPrefix = 'grp-';


    var FormView = Backbone.View.extend({
        tagName:'div',
        className:'form-view',
        events:{
          'submit form':'formSubmitHandler'
        },
        template: app.getTemplateFromString('<form action="{{action}}" id="form-{{id}}"></form>'),
        render:function(){
            var el = this.$el;
            el.empty();
            el.html(this.template(this.model.toJSON()));
            this.formEl = this.$('form');
            this.renderGroupContainers();
            var model = this.model;
            var elements = model.get('elements');
            elements.each(function(elementModel){
                this.addElement(elementModel);
            }, this);
            return this;
        },
        addElement:function(model){
            var ElementView = InputView;
            var attr = model.toJSON();
            switch(attr.type){
                case 'select':
                    ElementView = SelectView;
                    break;
                case 'checkbox':
                    ElementView = CheckboxView;
                    break;
                case 'radioList':
                    ElementView = RadioListView;
                    break;
                case 'checkList':
                    ElementView = CheckListView;
                    break;
            }
            var view = new ElementView({
                model:model
            });

            var group =  attr.group;

            this.$('.'+groupPrefix+group).append(view.render().el);
        },
        renderGroupContainers:function(){
            var model = this.model;
            var elements = model.get('elements');
            var groupList = _.unique(elements.pluck('group'));
            _.each(groupList,function(groupName){
                if(this.$('.'+groupPrefix+groupName).length===0){
                    this.formEl.append('<div class="'+groupPrefix+groupName+'"></div>');
                }
            },this);
        },
        formSubmitHandler:function(e){
            e.preventDefault();
            console.log(this.model.getValueObject());
        }
    });




    window.FormModel = FormModel;
    window.ElementModel = ElementModel;
    window.ElementCollection = ElementCollection;
    window.ElementView = InputView;
    window.FormView = FormView;
})();


