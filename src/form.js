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


    var DOT_CONTROL_GROUP = '.control-group';
    var DOT_CONTROL_LABEL = '.control-label';
    var DOT_HELP_INLINE = '.help-inline';
    var INVALID_CLASS = 'error';

    var ElementModel = Base.Model.extend({
        defaults: {
            valid: true,
            active: true,
            disabled: false,
            readonly: false,
            value: null,
            label: null,
            activeRules: [],
            validationRules: [],
            type: 'text',
            errorCode: '',
            group: 'elements'
        },
        idAttribute: 'name',
        updateActive: function () {
            var activeRules = this.get('activeRules');
            var isActive = _.every(activeRules, function (rule) {
                var sourceElement = this.collection.get(rule.element);
                return activeRuleMethods[rule.expr].call(null, sourceElement, rule);
            }, this);
            this.set('active', isActive);
        },
        isElementValid: function () {
            var validationRules = this.get('validationRules');
            var errors = [];
            if(this.isNot('active')){
                return [];
            }
            var errorRule;
            var isValid = _.every(validationRules, function (rule) {
                var isValidForRule = validationRuleMethods[rule.expr].call(this, rule, this.get('value'));
                if (!isValidForRule) {
                    errors.push(rule);
                    errorRule = rule;
                }
                return isValidForRule;
            }, this);
            this.set('valid', isValid);
            if (errorRule) {
                this.set('errorCode', 'error.' + this.get('name') + '.' + errorRule.expr);
            } else {
                this.set('errorCode', '');
            }
            return errors;
        }
    });

    var ElementCollection = Base.Collection.extend({
        model: ElementModel
    });


    var InputView = Base.View.extend({
        tagName: 'div',
        className: 'element',
        dataEvents: {
            'change': 'watchAttributes'
        },
        events: {
            'change input': 'updateValue',
            'blur input': 'updateValue'
        },
        template: 'inputView',
        render: function () {
            if (typeof this.template === 'string') {
                if ($('script#' + this.template).length > 0) {
                    this.template = app.getTemplateFromScriptTag(this.template);
                }
            }
            this.$el.html(this.template(this.model.toJSON()));
            this.syncAttributes();
            return this;
        },
        watchAttributes: function (eventType, model) {
            var changes = model.changedAttributes();
            _.each(changes, function (value, attribute) {
                var handler = this[attribute + 'ChangeHandler'];
                if (handler && typeof handler === 'function') {
                    handler.call(this, model.get(attribute));
                }
            }, this);
        },
        syncAttributes: function () {
            var model = this.model;
            var attr = model.toJSON();
            _.each(attr, function (value, attribute) {
                var handler = this[attribute + 'ChangeHandler'];
                if (handler && typeof handler === 'function') {
                    handler.call(this, model.get(attribute));
                }
            }, this);
            this.updateValue(true);
        },
       // typeChangeHandler:function(value){
       //     this.$('input').attr('type', value);
       // },
       
        disabledChangeHandler: function (value) {
            this.$el.toggleClass('disabled', value);
            this.$('input').attr('disabled', value);
        },
        readonlyChangeHandler: function (value) {
            this.$el.toggleClass('readonly', value);
            this.$('input').attr('readonly', value);
        },
        validChangeHandler: function (value) {
            this.$(DOT_CONTROL_GROUP).toggleClass(INVALID_CLASS, !value);
        },
        activeChangeHandler: function (value) {
            this.$el.toggle(value);
        },
        valueChangeHandler: function (value) {
            this.$('input').val(value);
        },
        errorCodeChangeHandler: function (errorCode) {
            var el = this.$(DOT_HELP_INLINE);
            if (errorCode === '') {
                el.empty();
            } else {
                this.$(DOT_HELP_INLINE).html(app.getString(errorCode));
            }
        },
        valueFunction: function () {
            return this.$('input').val();
        },
        updateValue: function (skipValidate) {
            this.model.set('value', this.valueFunction());
            if (skipValidate !== true) {
                this.model.isElementValid();
            }

        }
    });

    var CheckboxView = InputView.extend({
        valueFunction: function () {
            return this.$('input').is(':checked');
        },
        valueChangeHandler: function (value) {
            this.$('input').attr('checked', value);
        }
    });
    var TextAreaView = InputView.extend({
        template: 'textAreaView',
        events: {
            'change textarea': 'updateValue',
            'blur textarea': 'updateValue'
        },
        valueFunction: function () {
            return this.$('textarea').val();
        },
        valueChangeHandler: function (value) {
            this.$('textarea').val(value);
        }
    });

    var SelectView = InputView.extend({
        template: 'selectView',
        events: {
            'change select': 'updateValue',
            'blur select': 'updateValue'
        },
        valueFunction: function () {
            return this.$('select').val();
        },
        valueChangeHandler: function (value) {
            this.$('select').val(value);
        }
    });


    var RadioListView = InputView.extend({
        template: 'radioListView',
        valueFunction: function () {
            return this.$('input:checked').val();
        },
        valueChangeHandler: function (value) {
            this.$('input[value=' + value + ']').attr('checked', true);
        }
    });

    var CheckListView = InputView.extend({
        template: 'checkListView',
        valueFunction: function () {
            var selectedOptions = this.$('input:checked');

            var valueArr = _.map(selectedOptions, function (option) {
                return $(option).val();
            });

            return valueArr;
        },
        valueChangeHandler: function (valueArr) {
            //this.$('input[value='+value+']').attr('checked',true);
            if (_.isArray(valueArr)) {
                _.each(valueArr, function (value) {
                    this.$('input[value=' + value + ']').attr('checked', true);
                }, this);
            }
        }
    });

    var CheckboxList = InputView.extend({
        valueFunction: function () {
            return this.$('input').is(':checked');
        },
        valueChangeHandler: function (value) {
            this.$('input').attr('checked', value);
        }
    });

    var typeViewIndex = {
        'select': SelectView,
        'textarea': TextAreaView,
        'checkbox': CheckboxView,
        'radioList': RadioListView,
        'checkList': CheckListView
    };

    var getViewByType = function (type) {
        return typeViewIndex[type] || InputView;
    };

    var updateTypeViewIndex = function (indexObj) {
        typeViewIndex = _.extend({}, typeViewIndex, indexObj);
    };

    var FormModel = Base.Model.extend({
        constructor: function () {
            Base.Model.apply(this, arguments);
            var elements = this.get('elements');
            elements.on('all', function (eventName, model) {
                var args = Array.prototype.slice.call(arguments, [0]);
                args[0] = 'elements:' + eventName;
                this.trigger.apply(this, args);
                args[0] = 'elements:' + model.get('name') + ':' + eventName;
                this.trigger.apply(this, args);
            }, this);

            elements.each(function (elementModel) {

                //add active rules
                var activeRules = elementModel.get('activeRules');
                _.each(activeRules, function (rule) {
                    var toWatchElement = elements.get(rule.element);
                    toWatchElement.on('change:value', function (model, value) {
                        elementModel.updateActive();
                    });
                    elementModel.updateActive();
                    /*
                     switch(rule.expr){
                     case 'eq':
                     elementModel.set('active', toWatchElement.isEqual('value', rule.value));
                     toWatchElement.on('change:value',function(model, value){
                     elementModel.updateActive();
                     });
                     break;
                     case 'neq':
                     elementModel.set('active', toWatchElement.isNotEqual('value', rule.value));
                     toWatchElement.on('change:value',function(model, value){
                     elementModel.set('active', value !== rule.value);
                     });
                     break;
                     }
                     */

                });
            });

        },
        defaults: {
            elements: new ElementCollection()
        },
        setElementAttribute: function (elementName, attribute, value) {
            var elements = this.get('elements');
            elements.get(elementName).set(attribute, value);
        },
        getValueObject: function () {
            var elements = this.get('elements');
            var errors = this.validateElements();
            var obj = {};
            if (errors.length === 0) {
                elements.each(function (model) {
                    if (model.is('active')) {
                        obj[model.id] = model.get('value');
                    }
                });
            }
            return obj;
        },
        validateElements: function () {
            var elements = this.get('elements');
            var errors = [];
            elements.each(function (model) {

                errors = errors.concat(model.isElementValid());

            });
            return errors;
        }

    });


    var groupPrefix = 'grp-';


    var FormView = Base.View.extend({
        constructor: function (options) {
            this.typeViewIndex = {};
            Base.View.apply(this, arguments);
        },
        tagName: 'div',
        className: 'form-view',
        events: {
            'submit form': 'formSubmitHandler'
        },
        template: app.getTemplateFromString('<form action="{{action}}" id="form-{{id}}" class="form-horizontal"></form>'),
        render: function () {
            var el = this.$el;
            el.empty();
            el.html(this.template(this.model.toJSON()));
            this.formEl = this.$('form');
            this.renderGroupContainers();
            var model = this.model;
            var elements = model.get('elements');
            elements.each(function (elementModel) {
                this.addElement(elementModel);
            }, this);
            return this;
        },
        addElement: function (model) {
            var attr = model.toJSON();
            var ElementView = this.typeViewIndex[attr.type] || getViewByType(attr.type);
            var view = new ElementView({
                model: model
            });
            var group = attr.group;
            this.$('.' + groupPrefix + group).append(view.render().el);
        },
        renderGroupContainers: function () {
            var model = this.model;
            var elements = model.get('elements');
            var groupList = _.unique(elements.pluck('group'));
            _.each(groupList, function (groupName) {
                if (this.$('.' + groupPrefix + groupName).length === 0) {
                    this.formEl.append('<div class="' + groupPrefix + groupName + '"></div>');
                }
            }, this);
        },
        formSubmitHandler: function (e) {
            e.preventDefault();
            console.log(this.model.getValueObject());
        },
        addToTypeViewIndex: function (type, View) {
            this.typeViewIndex[type] = View;
        }
    });

    var validationRuleMethods = {
        'req': function (rule, value) {
            return !_.isEmpty(value);
        },
        'digits': function (rule, value) {
            return (/^\d{5}$/).test(value);
        },
        'alphanumeric': function (rule, value) {
            var ck_alphaNumeric = /^\w+$/;
            return ck_alphaNumeric.test(value);
        },
        'number': function (rule, value) {
            if (value === undefined) {
                return true;
            }
            var numberVal = +value;
            return numberVal === numberVal;
        },
        'email': function (rule, value) {
            var ck_email = /^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return ck_email.test($.trim(value));
        },
        'minlen': function (rule, value) {
            var min = rule.length;
            return $.trim(String(value)).length >= min;
        },
        'maxlen': function (rule, value, exprvalue) {
            var max = rule.length;
            return $.trim(String(value)).length <= max;
        },
        'lt': function (rule, value, exprvalue) {
            var target = parseFloat(exprvalue);
            var curvalue = parseFloat(value);
            return curvalue < target;
        },
        'gt': function (rule, value, exprvalue) {
            var target = parseFloat(exprvalue);
            var curvalue = parseFloat(value);
            return curvalue > target;
        },
        'eq': function (rule, value, exprvalue) {
            return exprvalue === value;
        },
        'url': function (rule, value) {
            if (value === '') {
                return true;
            }
            var ck_url = /(http|https|market):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;
            return ck_url.test($.trim(value));
        },
        'emaillist': function (rule, value) {
            var emails = value.split(',');
            var ck_email = /^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            for (var i = 0; i < emails.length; i++) {
                if ($.trim(emails[i]) !== '' && !ck_email.test($.trim(emails[i]))) {
                    return false;
                }
            }
            return true;
        },
        'function': function (rule, value) {
            var func = rule.func;
            return func.call(null, value);
        }

    };


    var activeRuleMethods = {
        'eq': function (source, rule) {
            return source.isEqual('value', rule.value);
        },
        'neq': function (source, rule) {
            return source.isNotEqual('value', rule.value);
        }
    };


    window.FormModel = FormModel;
    window.ElementModel = ElementModel;
    window.ElementCollection = ElementCollection;
    window.ElementView = InputView;
    window.FormView = FormView;
})();


