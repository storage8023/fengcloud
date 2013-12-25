'use strict';

angular.module('gkChat', ['GKCommon'])
    .controller('initChat',['$location','$scope','chatService','$timeout','GKApi',function($location,$scope,chatService,$timeout,GKApi){
        var param = $location.search();
        var mountId = Number(param.mount_id);

        $scope.org = gkClientInterface.getMount({
            mountid:mountId
        });
        $scope.members = [];
        GKApi.teamGroupsMembers($scope.org.orgid).success(function(data){
            $scope.members = data.members;
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
                postText = '';
            }).error(function(){

                });
        };

        var connect = function(){
            chatService.connect($scope.org.orgid).success(function(data){
                console.log(data);
//                var lastTime = data ||0;
//                $timeout(function(){
//                    chatService.list(lastTime,$scope.org.orgid).success(function(){
//
//                    }).error(function(){
//
//                        });
//                },1000)
                //connect();
            }).error(function(XMLHttpRequest, textStatus, errorThrown){
                    if (textStatus == "timeout") {
                        //connect();
                    }
                });
        };
        connect();
    }])
    .factory('chatService', [function () {
       var host = 'http://10.0.0.150:1238';
       var chat = {
            add:function(orgId,content){
                return jQuery.ajax({
                    url: host + '/post-message',
                    type:'POST',
                    data:{
                        'content':content,
                        'target-team':orgId,
                        'type':'text',
                        'token':gkClientInterface.getToken()
                    },
                    dataType: 'text'
                });
            },
            search:function(){
             return jQuery.ajax({
                    url: host + '/post-message',
                    dataType: 'json',
                    type: method,
                    data:{
                        'team-id':orgId,
                        'token':gkClientInterface.getToken()
                    }
                });
            },
           list:function(lastTime,orgId){
               return jQuery.ajax({
                   type: 'GET',
                   dataType: 'json',
                   url: host+'/get-message',
                   data:{
                       'team-id':orgId,
                       'time':lastTime,
                       'token':gkClientInterface.getToken()
                   }
               })
           },
            connect:function(orgId){
                return jQuery.ajax({
                    type: 'GET',
                    url: host+'/login',
                    dataType:'text',
                    data:{
                       'team-id':orgId,
                       'token':gkClientInterface.getToken()
                    },
                    timeout: 30000
                });
            }
       };
       return chat;
    }])

