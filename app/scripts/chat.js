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
        $scope.connecting = true;
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
            var filename = Util.String.baseName(value.fullpath);
            var ext = Util.String.getExt(filename);
            angular.extend(value,{
                receiver_name:receiver?receiver['member_name']:'-;',
                sender_name:sender?sender['member_name']:'-',
                filename:filename,
                ext:ext,
                is_vip:sender&&sender.isvip?true:false
            })
            return value;
        };

        var setMsgError = function(msg,errorMsg){
            angular.forEach($scope.msg_list,function(value){
                if(msg == value){
                    value.error = errorMsg;
                    return false;
                }
            })
        };

        GKApi.teamGroupsMembers($scope.org.orgid).success(function(data){
            $scope.members = data.members;
            $scope.connecting = false;
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
            var newMsg = formateMsgItem({
                content: postText,
                receiver:$scope.org.orgid,
                sender:$scope.PAGE_CONFIG.user.member_id,
                time:new Date().getTime(),
                type:'text'
            });

            $scope.msg_list.push(newMsg);
            $scope.scrollToBottom = true;
            chatService.add($scope.org.orgid,postText).success(function(){

            }).error(function(error){
                    var errorMsg = GKException.getAjaxErrorMsg(error);
                    setMsgError(newMsg,errorMsg);
             });

            $event.preventDefault();
        };
        $scope.historyGrid = false;
        $scope.handleScrollLoad = function(){
            var minDateline = 0;
            if($scope.msg_list.length){
                minDateline = $scope.msg_list[0]['time'];

            }
            chatService.search($scope.org.orgid,minDateline,50).success(function(data){
                $scope.$apply(function(){
                angular.forEach(data,function(item){
                    item = formateMsgItem(item);
                    if(!$scope.historyGrid){
                        item.history_msg = true;
                        $scope.historyGrid = true;
                    }
                    $scope.msg_list.unshift(item);
                })
                })
            })
        }

        $scope.goToFile = function(msg){
            var fullpath = msg.fullpath;
            var mountId = $scope.PAGE_CONFIG.mount.mountid;
        };

        $scope.openFile = function(msg){
            var fullpath = msg.fullpath;
            var mountId = $scope.PAGE_CONFIG.mount.mountid;
            var params = {
                mountid:Number(mountId),
                webpath:fullpath
            }
            gkClientInterface.open(params);
        }

        var connect = function(){
            chatService.connect($scope.org.orgid).success(function(data){
                    if(data){
                        $timeout(function(){
                            var lastTime = data;
                            chatService.list(lastTime,$scope.org.orgid).success(function(data){
                                angular.forEach(data,function(item){
                                    item = formateMsgItem(item);
                                    $scope.$apply(function(){
                                        $scope.msg_list.push(item);
                                        $scope.scrollToBottom = true;
                                    })
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
            search:function(orgId,dateline,size){
             return jQuery.ajax({
                    type:'GET',
                    url: host + '/search-message',
                    dataType: 'json',
                    data:{
                        'receiver':'gokuai',
                        'limit':size,
                        'timestamp':dateline,
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
                    timeout: 3000000
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

