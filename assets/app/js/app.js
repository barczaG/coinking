// Filename: app.js
define([
  'jquery',
  'underscore',
  'backbone',
  'router', // Request router.js
  ], function($, _, Backbone, Router){
    var initialize = function(){
    window.app={};
    // Pass in our Router module and call it's initialize function
    Router.initialize();

    console.log("App Started");
  }

  return {
    initialize: initialize
  };
});