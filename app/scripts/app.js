'use strict';

angular.module('gkClientIndex', ['gkClientIndex.controllers','gkClientIndex.filters','gkClientIndex.directives','gkClientIndex.services','ngRoute','LocalStorageModule','ui.directives','ui.bootstrap'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/myfile/:path?/:view', {
                templateUrl: 'views/file_browser.html',
                controller: 'fileBrowser'
            }).
            otherwise({
                redirectTo: '/myfile//list'
            });
    }]);
