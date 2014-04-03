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

        $scope.showUpgradeTip = false;

        $scope.$on('UpgradeClient',function($event,data){
            if(!data) return;
            var version = data['version'];
            $scope.$apply(function(){
                $scope.upgradeTip = gkClientInterface.isMacClient()?'客户端有新版本了，点击立即更新':'客户端已更新到'+version+'，点击重启后生效';
                $scope.showUpgradeTip = true;
            })
        })

        $scope.handleUpgradeClick = function(){
            var msg = gkClientInterface.isMacClient()?'确定要升级客户端？':'确定要重启客户端？';
            if(!confirm(msg)){
                return;
            }
            gkClientInterface.upgradeClient();
        }

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

            $scope.$on('ResetMessage', function (e, data) {
                GKApi.resetMessage(data.ids).success(function(re){
                    angular.forEach(re,function(newItem){
                        GKNews.updateNews(newItem.id, newItem);
                    })
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

