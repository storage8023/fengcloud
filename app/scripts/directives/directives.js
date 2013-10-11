'use strict';

/* Directives */


angular.module('gkClientIndex.directives', []).
    directive('thumbitem', function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/file_item_thumb.html",
            link:function(scope, element, attrs){
                element.parent().gridly('layout');
            }
        };
    });
;
