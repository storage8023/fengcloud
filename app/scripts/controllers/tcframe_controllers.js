'use strict';

/* Controllers */

angular.module('gkClientFrame.controllers',[])
    .controller('initFrame',['$scope','GKApi','GKNews',function($scope,GKApi,GKNews){
            var news = GKNews.getNews();
        if(news&&news.length){
            $scope.messages = news.slice(0,3);
        }

//        $scope.$watch(GKNews.getNews,function(value){
//            console.log(value);
//        });

        GKApi.update(3).success(function(data){
            $scope.messageCount = data.update_count;
        });

        $scope.handleHeaderClick = function(){
              gkClientInterface.launchpad();
        };

        $scope.showMessage = function(){
            gkClientInterface.launchpad({type:'message'});
        };

    }])

