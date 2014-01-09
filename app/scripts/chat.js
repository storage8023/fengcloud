'use strict';

angular.module('gkChat', ['GKCommon'])
    .run(['$rootScope', '$location', 'GKMount','$window', function ($rootScope, $location, GKMount,$window) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            mount: {}
        }
        var setMount = function () {
            var param = $location.search();
            angular.extend($rootScope.PAGE_CONFIG, {
                mount: GKMount.getMountById(param.mountid)
            })
        }
        $rootScope.$on('$locationChangeSuccess', function () {
            setMount();
        })
        setMount();
        $window.onmessage = function(){
            console.log(arguments);
        }
    }])
    .controller('initChat', ['$scope', 'chatSession', '$location', '$timeout', 'chatContent', '$rootScope', 'chatService', 'GKException', function ($scope, chatSession, $location, $timeout, chatContent, $rootScope, chatService, GKException) {
        $scope.sessions = chatSession.sessions;
        $scope.currentMsgList = [];
        var initTime = new Date().getTime();

        $scope.selectSession = function (session) {
            $location.search({
                mountid: session.mount_id
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
            var newMsg = chatContent.add($rootScope.PAGE_CONFIG.mount.mount_id, {
                content: postText,
                receiver: $rootScope.PAGE_CONFIG.mount.orgId,
                sender: $scope.PAGE_CONFIG.user.member_id,
                time: new Date().getTime(),
                type: 'text'
            });

            if (!newMsg) {
                return;
            }
            $scope.scrollToBottom = true;
            //console.log($rootScope.PAGE_CONFIG.mount);
            chatService.add($rootScope.PAGE_CONFIG.mount.org_id, postText).error(function (error) {
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
            scrollToBottom = angular.isDefined(scrollToBottom) ? scrollToBottom : false;
            console.log(scrollToBottom);
            var minDateline = new Date().getTime();
            if ($scope.currentMsgList.length) {
                minDateline = $scope.currentMsgList[0]['time'];
            }
            chatService.search($scope.PAGE_CONFIG.mount.org_id, minDateline, 10).success(function (data) {
                $scope.$apply(function () {
                    $scope.start = -1;
                    var len = data.length;
                    if ($scope.currentMsgList.length + len > $scope.size) {
                        $scope.start -= len;
                    }
                    angular.forEach(data, function (item) {
                        if(!$scope.currentMsgList.historyGrid && item.time<initTime){
                            item.historyMsg = true;
                            $scope.currentMsgList.historyGrid = true;
                        }
                        chatContent.add($scope.PAGE_CONFIG.mount.mount_id,item,true);
                    })
                    $scope.scrollToBottom = scrollToBottom;
                })
            })
        };

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
        };

        var setList = function () {
            var param = $location.search();
            var mountId = Number(param.mountid);
            var session = chatSession.getSessionByMountId(mountId);
            if (!session) return;
            $scope.currentMsgList = session.msgList;
            $scope.start = 0;
            $scope.size = 100;
            chatSession.setUnreadCount(session,0);
            if(!$scope.currentMsgList.length || $scope.currentMsgList[0]['time']>initTime){
                $scope.handleScrollLoad(true);
            }else{
                $scope.scrollToBottom = true;
            }
        };

        $scope.$on('$locationChangeSuccess', function () {
            setList();
        })

        var connect = function () {
            chatService.connect(0).success(function (data) {
                if (data) {
                    var lastTime = Number(data.time) - 1,
                        orgId = data.receiver.split('_')[0];
                    var session = chatSession.getSessionByOrgId(orgId);
                    if (!session) return;
                    $timeout(function () {
                        chatService.list(lastTime, orgId).success(function (newMsgList) {
                            $scope.$apply(function(){
                                var len = newMsgList.length;

                                angular.forEach(newMsgList, function (item) {
//                                var start = $scope.msg_list.length + len - $scope.size;
//                                $scope.start = start < 0 ? 0 : start;
                                    chatContent.add(session.mount_id,item);
                                    $scope.scrollToBottom = true;
                                })
                                if(session.mount_id != $rootScope.PAGE_CONFIG.mount.mount_id){
                                    chatSession.setUnreadCount(session,session.unreadCount+len);
                                }
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
        connect();
    }])

    .factory('chatContent', ['chatMember', 'chatSession', function (chatMember, chatSession) {
        var chatContent = {
            formatItem: function (value) {
                var sender = chatMember.getMemberItem(value.receiver, value.sender);
                var filename = Util.String.baseName(value.fullpath);
                var ext = Util.String.getExt(filename);
                angular.extend(value, {
                    sender_name: sender?sender['member_name']:value.sender,
                    filename: filename,
                    ext: ext,
                    is_vip: sender && sender.isvip ? true : false
                })
                return value;
            },
            setItemError: function (msg, errorMsg) {
                msg.error = errorMsg;
            },
            add: function (mountId, newMsg, head) {
                head = angular.isDefined(head) ? head : false;
                newMsg = this.formatItem(newMsg);
                var session = chatSession.getSessionByMountId(mountId);
                if (!session) {
                    return;
                }
                if (!session.msgList) {
                    session.msgList = [];
                }
                head ? session.msgList.unshift(newMsg) : session.msgList.push(newMsg);
                return newMsg;
            }
        };
        return chatContent;
    }])
    .factory('chatSession', ['GKMount', function (GKMount) {
        var getSession = function () {
            return GKMount.getOrgMounts().concat(GKMount.getJoinOrgMounts()).map(function (session) {
                if (!angular.isArray(session.msgList)) {
                    session.msgList = [];
                }
                if(!session.unreadCount){
                    session.unreadCount = 0;
                }
                if(!session.lastTime){
                    session.lastTime = 0;
                }
                return session;
            })
        };
        var chatSession = {
            sessions: getSession(),
            refreshSession: function () {
                GKMount.refreshMounts();
                this.sessions = getSession();
            },
            getSessionByMountId: function (mountId) {
                return Util.Array.getObjectByKeyValue(this.sessions, 'mount_id', mountId);
            },
            getSessionByOrgId: function (orgId) {
                return Util.Array.getObjectByKeyValue(this.sessions, 'org_id', orgId);
            },
            setUnreadCount:function(session,unreadCount){
                session.unreadCount = unreadCount;
            }
        };
        return chatSession;
    }])
    .factory('chatMember', ['GKApi', function (GKApi) {
        var members = {};
        var chatMember = {
            getMembers: function (orgId) {
                if (!members[orgId]) {
                    GKApi.teamGroupsMembers(orgId).success(function (data) {
                        members[orgId] = data.members;
                    });
                }
                return members[orgId];
            },
            getMemberItem: function (orgId, memberId) {
                var members = this.getMembers(orgId),
                    member;
                angular.forEach(members, function (value) {
                    if (value.member_id == memberId) {
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
                        'receiver': orgId + '_0',
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
                        'time': dateline,
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
            connect: function () {
                return jQuery.ajax({
                    type: 'GET',
                    url: host + '/login',
                    dataType: 'json',
                    data: {
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

