'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientFrame',['GKCommon','gkClientIndex.filters','gkClientIndex.directives','gkClientIndex.services','gkClientFrame.controllers','LocalStorageModule','ngSanitize']);
