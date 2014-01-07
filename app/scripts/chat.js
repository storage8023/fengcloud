'use strict';

angular.module('gkChat', ['GKCommon'])
    .run(['$rootScope','$location','GKMount', function ($rootScope,$location,GKMount) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            mount:{}
        }
        var setMount = function(){
            var param = $location.search();
            angular.extend($rootScope.PAGE_CONFIG,{
                mount:GKMount.getMountById(param.mountid)
            })
        }
        $rootScope.$on('$locationChangeSuccess', function () {
            setMount();
        })
        setMount();
    }])
    .controller('initChat',['$scope','chatSession','$location','$timeout','chatContent','$rootScope','chatService',function($scope,chatSession,$location,$timeout,chatContent,$rootScope,chatService){
        $scope.sessions = chatSession.sessions;
        $scope.currentMsgList = [];
        var initTime =  new Date().getTime();

        $scope.selectSession = function(session){
            $location.search({
                mountid:session.mount_id
            });
        };


        /**
         * 发布新消息
         * @param $event
         * @param postText
         */
        $scope.handleKeyDown = function ($event, postText) {
            var keyCode = $event.keyCode;
            if (keyCode != 13) {
                return;
            }
            if (!postText.length) {
                return;
            }
            $scope.postText = '';
            var start = $scope.currentMsgList.length + 1 - $scope.size;
            $scope.start = start < 0 ? 0 : start;
            var newMsg = chatContent.add($rootScope.PAGE_CONFIG.mount.mount_id,{
                content: postText,
                receiver: $rootScope.PAGE_CONFIG.mount.orgId,
                sender: $scope.PAGE_CONFIG.user.member_id,
                time: new Date().getTime(),
                type: 'text'
            });
            if(!newMsg){
                return;
            }
            $scope.scrollToBottom = true;
            chatService.add($rootScope.PAGE_CONFIG.mount.orgId, postText).success(function () {

            }).error(function (error) {
                    var errorMsg = GKException.getAjaxErrorMsg(error);
                    chatContent.setItemError(newMsg, errorMsg);
                });

            $event.preventDefault();
        };

        /**
         * 滚动加载
         * @param scrollToBottom
         */
        $scope.handleScrollLoad = function (scrollToBottom) {
            return;
            scrollToBottom = angular.isDefined(scrollToBottom) ? scrollToBottom : false;
            var minDateline = new Date().getTime();
            if ($scope.msg_list.length) {
                minDateline = $scope.msg_list[0]['time'];
            }
            chatService.search($scope.org.orgid, minDateline, 10).success(function (data) {
                $scope.$apply(function () {
                    $scope.start = -1;
                    var len = data.length;
                    if ($scope.msg_list.length + len > $scope.size) {
                        $scope.start -= len;
                    }
                    angular.forEach(data, function (item) {
                        pop(item);
                    })
                    $scope.scrollToBottom = scrollToBottom;
                })
            })
        }

        /**
         * 打开文件位置
         * @param msg
         */
        $scope.goToFile = function (msg) {
            var fullpath = msg.fullpath;
            var mountId = $scope.PAGE_CONFIG.mount.mountid;
        };

        /**
         * 打开文件
         * @param msg
         */
        $scope.openFile = function (msg) {
            var fullpath = msg.fullpath;
            var mountId = $scope.PAGE_CONFIG.mount.mountid;
            var params = {
                mountid: Number(mountId),
                webpath: fullpath
            }
            gkClientInterface.open(params);
        }

        var setList = function(){
            var param = $location.search();
            $scope.scrollToBottom = false;
            var mountId = Number(param.mountid);
            $scope.historyGrid = false;
            var session = chatSession.getSessionByMountId(mountId);
            if(!session) return;
            $scope.currentMsgList = session.msgList || [];
            $scope.start = 0;
            $scope.size = 100;
            $scope.handleScrollLoad(true);
        }

        $scope.$on('$locationChangeSuccess', function () {
           setList();
        })

        var connect = function () {
            chatService.connect(0).success(function (data) {
                if (data) {
                    $timeout(function () {
                        var lastTime = Number(data) - 1;
                        chatService.list(lastTime, $scope.org.orgid).success(function (data) {
                            var len = data.length;
                            angular.forEach(data, function (item) {
                                $scope.$apply(function () {
                                    var start = $scope.msg_list.length + len - $scope.size;
                                    $scope.start = start < 0 ? 0 : start;
                                    add(item);
                                    $scope.scrollToBottom = true;
                                })
                            })
                        });
                    }, 1000)
                }
                connect();
            }).error(function (request, textStatus, errorThrown) {
                    $timeout(function () {
                        connect();
                    }, 1000)
                });
        };
        //connect();

    }])

    .factory('chatContent', ['chatMember','chatSession',function (chatMember,chatSession) {
        var chatContent = {
            formatItem: function (value) {
                var sender = chatMember.getMemberItem(value.receiver,value.sender) || value.sender;
                var filename = Util.String.baseName(value.fullpath);
                var ext = Util.String.getExt(filename);
                angular.extend(value, {
                    sender_name: sender,
                    filename: filename,
                    ext: ext,
                    is_vip: sender && sender.isvip ? true : false
                })
                return value;
            },
            setItemError:function(msg,errorMsg){
                msg.error = errorMsg;
            },
            add:function(mountId,newMsg,head){
                head = angular.isDefined(head)?head:false;
                newMsg = this.formatItem(newMsg);
                var session = chatSession.getSessionByMountId(mountId);
                if(!session){
                    return;
                }
                if(!session.msgList){
                    session.msgList = [];
                }
                head?session.msgList.unshift(newMsg):session.msgList.push(newMsg);
                return newMsg;
            }
        };
        return chatContent;
    }])
    .factory('chatSession', ['GKMount',function (GKMount) {
        var chatSession = {
            sessions:GKMount.getOrgMounts().concat(GKMount.getJoinOrgMounts()),
            getSessionList:function(){
                return sessions;
            },
            refreshSession:function(){
                GKMount.refreshMounts();
                this.sessions = GKMount.getOrgMounts().concat(GKMount.getJoinOrgMounts());
            },
            getSessionByMountId:function(mountId){
                return Util.Array.getObjectByKeyValue(this.sessions,'mount_id',mountId);
            },
        };
        return chatSession;
    }])
    .factory('chatMember', ['GKApi',function (GKApi) {
        var members = {};
        var chatMember = {
            getMembers:function(orgId){
                if(!members[orgId]){
                    GKApi.teamGroupsMembers(orgId).success(function (data) {
                        members[orgId] = data.members;
                    });
                }
                return members[orgId];
            },
            getMemberItem: function (orgId,memberId) {
                var members = this.getMembers(orgId),
                    member;
                angular.forEach(members, function (value) {
                    if (value.member_id == id) {
                        member = value;
                        return false;
                    }
                })
                return member;
            }
        };
        return chatMember;
    }])
    .factory('chatService', [function () {
        var host = 'http://10.0.0.150:1238';
        //var host = 'http://112.124.68.214:1238';
        var chat = {
            add: function (orgId, content) {
                return jQuery.ajax({
                    url: host + '/post-message',
                    type: 'POST',
                    data: {
                        'content': content,
                        'target-team': orgId,
                        'type': 'text',
                        'token': gkClientInterface.getToken()
                    },
                    dataType: 'json'
                });
            },
            search: function (orgId, dateline, size) {
                return jQuery.ajax({
                    type: 'GET',
                    url: host + '/search-message',
                    dataType: 'json',
                    data: {
                        'receiver': orgId,
                        'limit': size,
                        'timestamp': dateline,
                        'team-id': orgId,
                        'token': gkClientInterface.getToken()
                    }
                });
            },
            list: function (lastTime, orgId) {
                return jQuery.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: host + '/get-message',
                    data: {
                        'team-id': orgId,
                        'time': lastTime,
                        'token': gkClientInterface.getToken()
                    }
                })
            },
            connect: function (orgId) {
                return jQuery.ajax({
                    type: 'GET',
                    url: host + '/login',
                    dataType: 'json',
                    data: {
                        'team-id': orgId,
                        'token': gkClientInterface.getToken()
                    },
                    timeout: 30000000
                });
            }
        };
        return chat;
    }])

    .directive('scrollToBottom', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                $scope.$watch($attrs.scrollToBottom, function (value) {
                    if (value == true) {
                        $timeout(function () {
                            $element.scrollTop($element[0].scrollHeight);
                        })
                        $scope[$attrs.scrollToBottom] = false;
                    }
                });
            }
        }
    }])

