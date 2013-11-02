'use strict';

/* Controllers */

angular.module('gkClientFrame.controllers',[])
    .controller('initFrame',['$scope','GKApi',function($scope,GKApi){
        GKApi.update(3).success(function(data){
            $scope.messageCount = data.update_count;
            $scope.messages = data.updates;
        });

        $scope.handleHeaderClick = function(){
              gkClientInterface.lanchpad();
        };

        $scope.showMessage = function(){
            gkClientInterface.lanchpad({type:'message'});
        };

    }])

