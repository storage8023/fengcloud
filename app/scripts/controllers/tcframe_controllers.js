'use strict';

/* Controllers */

angular.module('gkClientFrame.controllers',[])
    .controller('initFrame',['$scope','GKApi',function($scope,GKApi){
        GKApi.update(3).success(function(data){
            $scope.messageCount = data.update_count;
            $scope.messages = data.updates;
        });

        $scope.handleHeaderClick = function(){
              gkClientInterface.launchpad();
        };

        $scope.showMessage = function(){
            gkClientInterface.launchpad({type:'message'});
        };

    }])

