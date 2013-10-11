'use strict';

angular.module('gkClientIndex', ['gkClientIndex.controllers','gkClientIndex.filters','gkClientIndex.directives','ngRoute','ngGrid','ui.directives'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/myfile/:path?/list', {
                templateUrl: 'partials/file_list_view.html',
                controller: 'fileBrowser'
            }).
            when('/myfile/:path?/thumb', {
                templateUrl: 'partials/file_thumb_view.html',
                controller: 'fileBrowser'
            }).
            otherwise({
                redirectTo: '/myfile//list'
            });
    }]);
