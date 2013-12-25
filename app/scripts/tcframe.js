'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientFrame',['GKCommon','gkClientIndex.filters','gkClientIndex.directives','gkClientFrame.controllers','gkClientFrame.directives','gkClientIndex.services','LocalStorageModule','ngSanitize']);
