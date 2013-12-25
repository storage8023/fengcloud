'use strict';

angular.module('gkChat', ['GKCommon'])
    .run(['$rootScope',function($rootScope){
        $rootScope.PAGE_CONFIG = {
            user:gkClientInterface.getUser()
        }
    }])
    .controller('initChat',['$location','$scope','chatService','$timeout','GKApi',function($location,$scope,chatService,$timeout,GKApi){
        var param = $location.search();
        var mountId = Number(param.mount_id);
        $scope.msg_list = [];
        $scope.org = gkClientInterface.getMount({
            mountid:mountId
        });
        $scope.members = [];
        var getMemberItemById = function(id){
            var member;
            angular.forEach($scope.members,function(value){
                if(value.member_id == id){
                    member =  value;
                    return false;
                }
            })
            return member;
        };

        var formateMsgItem = function(value){
            var receiver = getMemberItemById(value.receiver);
            var sender = getMemberItemById(value.sender);
            angular.extend(value,{
                receiver_name:receiver?receiver['member_name']:'-;',
                sender_name:sender?sender['member_name']:'-'
            })
            return value;
        };

        GKApi.teamGroupsMembers($scope.org.orgid).success(function(data){
            $scope.members = data.members;
        });
        $scope.scrollToBottom = false;
        $scope.handleKeyDown = function($event,postText){
            var keyCode = $event.keyCode;
            if(keyCode != 13){
                return;
            }
            if(!postText.length){
                return;
            }
            $scope.postText = '';
            chatService.add($scope.org.orgid,postText).success(function(){
                $scope.$apply(function(){
                    $scope.msg_list.push(formateMsgItem({
                        content: postText,
                        receiver:$scope.org.orgid,
                        sender:$scope.PAGE_CONFIG.user.member_id,
                        time:new Date().getTime(),
                        type:'text'
                    }))
                    $scope.scrollToBottom = true;
                })
            }).error(function(){

                });
            $event.preventDefault();
        };

        $scope.handleScrollLoad = function(){
            console.log(1);
        }

        var connect = function(){
            chatService.connect($scope.org.orgid).success(function(data){
                    if(data){
                        $timeout(function(){
                            var lastTime = data;
                            chatService.list(lastTime,$scope.org.orgid).success(function(data){
                                console.log(data);
                                angular.forEach(data,function(item){
                                    item = formateMsgItem(item);
                                    $scope.$apply(function(){
                                        $scope.msg_list.push(item);
                                        $scope.scrollToBottom = true;
                                    })

                                    //console.log($scope.msg_list);
                                })
                            });
                        },1000)
                    }
                connect();
            }).error(function(XMLHttpRequest, textStatus, errorThrown){
                    if (textStatus == "timeout") {
                       connect();
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
                    url: host + '/search',
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
                    timeout: 300000
                });
            }
       };
       return chat;
    }])
    .directive('scrollToBottom', ['$timeout',function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, $element,$attrs) {
                $scope.$watch($attrs.scrollToBottom, function (value) {
                    if (value === true) {
                        $element.scrollTop($element[0].scrollHeight);
                        $scope[$attrs.scrollToBottom] = false;
                    }
                });
            }
        }
    }])

