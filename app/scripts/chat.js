'use strict';

angular.module('gkChat', ['gkClientIndex.directives'])
    .controller('initChat',['$location','$scope','chatService','$timeout',function($location,$scope,chatService,$timeout){
        var param = $location.search();
        var mountId = Number(param.mount_id);

        $scope.org = gkClientInterface.getMount({
            mountid:mountId
        });

        $scope.handleKeyDown = function($event,postText){
            var keyCode = $event.keyCode;
            if(keyCode != 13){
                return;
            }
            if(!postText.length){
                return;
            }
            chatService.add($scope.org.orgid,postText).success(function(){

            }).error(function(){

                });
        };

        var connect = function(){
            var callee = arguments.callee;
            chatService.connect($scope.org.orgid).success(function(data){
                var lastTime = data;
                $timeout(function(){
                    chatService.list(lastTime,$scope.org.orgid).success(function(){

                    }).error(function(){

                        });
                },1000)
                callee();
            }).error(function(XMLHttpRequest, textStatus, errorThrown){
                    if (textStatus == "timeout") {
                        callee();
                    }
                });
        };
        connect();
    }])
    .factory('chatService', [function () {
       var host = 'http://112.124.68.214';
       var chat = {
            add:function(orgId,content){
                var headers = {
                    'x-gk-team-id': orgId,
                    'x-gk-type': 'text',
                    'x-gk-sign': gkClientInterface.getToken()
                };
                return jQuery.ajax({
                    url: host + '/post-message',
                    data:content,
                    dataType: 'text',
                    type: method,
                    headers: headers
                });
            },
            search:function(){
                var headers = {
                    'x-gk-team-id': orgId,
                    'x-gk-sign': gkClientInterface.getToken()
                };
                return jQuery.ajax({
                    url: host + '/post-message',
                    dataType: 'text',
                    type: method,
                    headers: headers
                });
            },
           list:function(lastTime,orgId){
               return jQuery.ajax({
                   type: 'GET',
                   dataType: 'json',
                   url: host+'/get-message',
                   headers: {
                       "x-gk-team-id": orgId,
                       "x-gk-sign": gkClientInterface.getToken(),
                       "x-gk-time": lastTime
                   }
               })
           },
            connect:function(orgId){
                return jQuery.ajax({
                    type: 'GET',
                    url: host+'/login',
                    headers: {
                        "x-gk-team-id": orgId,
                        "x-gk-sign": gkClientInterface.getToken(),
                        "x-gk-time": new Date().getTime()
                    },
                    timeout: 10000000000
                });
            }
       };
       return chat;
    }])

