'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientIndex', ['ngDragDrop','gkClientIndex.controllers', 'gkClientIndex.filters', 'gkClientIndex.directives', 'gkClientIndex.services', 'LocalStorageModule', 'ui.directives', 'ui.utils', 'ui.bootstrap', 'ngSanitize', 'tags-input', 'LocalStorageModule'])
    .config(['$sceDelegateProvider',function ($sceDelegateProvider) {
        var siteDomain = gkClientInterface.getSiteDomain();
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            siteDomain+'/**'
        ]);
    }])
;








