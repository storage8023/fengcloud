'use strict';

/* Services */

angular.module('gkClientIndex.services', []).
    factory('GKPath', function() {
       return {
           getPath:function(){
               var paramArr = Array.prototype.slice.call(arguments);
               return '/'+paramArr.join('/');
           }
       }
    });