'use strict';

/* Controllers */

angular.module('gkClientFrame.controllers',[])
    .controller('initFrame',['$scope','GKApi','GKNews','$rootScope','GKDialog','localStorageService',function($scope,GKApi,GKNews,$rootScope,GKDialog,localStorageService){
        $rootScope.PAGE_CONFIG  ={
            user:gkClientInterface.getUser()
        };

        $scope.handleClick = function(type){
            if(type == 'lanchpad'){
                gkClientInterface.launchpad();
            }else if(type == 'chat'){
                gkClientInterface.launchpad({type:'message'});
            }else if(type == 'trasfer'){
                GKDialog.openTransfer();
            }else if(type == 'setting'){
                GKDialog.openSetting();
            }
        };

        if($rootScope.PAGE_CONFIG.user.member_id){

            var getNews = function(){
                var news = GKNews.getNews();
                if(news&&news.length){
                    $scope.messages = news.slice(0,4);
                }
            };

            GKNews.requestNews().then(function(news){
                if(news && news.length){
                    var unreadMsgKey = $rootScope.PAGE_CONFIG.user.member_id+'_unreadmsg';
                    localStorageService.add(unreadMsgKey,true);
                }
                getNews();
            });

            /**
             * 监听消息的通知
             */
            $scope.$on('UpdateMessage', function (e, data) {
                GKNews.appendNews(data).then(function(){
                    getNews();
                });
            })

            $scope.showMessage = function(){
                gkClientInterface.launchpad();
            };

            $scope.logout = function(){
                gkClientInterface.quit();
                return false;
            }
        }

    }])

