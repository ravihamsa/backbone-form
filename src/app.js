/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 22/05/13
 * Time: 11:45 AM
 * To change this template use File | Settings | File Templates.
 */
(function(){
    "use strict";

    var app = {};

    var stringIndex = {};

    var compiledIdTemplateIndex = {};

    app.getString = function(str){
        return stringIndex[str] || str;
    };

    app.getTemplateFromString=function(str){
        return Handlebars.compile(str);
    };

    app.getTemplateFromScriptTag=function(sid){
        var template = compiledIdTemplateIndex[sid];
        if(template){
            return template;
        }else{
            template = compiledIdTemplateIndex[sid] = Handlebars.compile($.trim($('script#'+sid).html()));
            return template;
        }
    };

    Handlebars.registerHelper('string',function(str){
        return app.getString(str);
    });

    Handlebars.registerHelper('formLabel',function(str){
        return app.getString('form.label.'+str);
    });


    window.app = app;

})();