'use strict';

angular.module('gkChat', ['GKCommon'])
    .run(['$rootScope', '$location', 'GKMount', '$window', function ($rootScope, $location, GKMount, $window) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            mount: {},
            file: null
        }

        var setMount = function () {
            var param = $location.search();
            var mountId = Number(param.mountid);
            var extendParam = {
                mount: GKMount.getMountById(mountId)
            };
            if (param.fullpath) {
                extendParam.file = gkClientInterface.getFileInfo({
                    mountid: mountId,
                    webpath: param.fullpath
                });
                extendParam.file.mount_id = mountId;
                extendParam.file.filename = Util.String.baseName(extendParam.file.path);
                extendParam.file.ext = Util.String.getExt(extendParam.file.filename);
            }
            angular.extend($rootScope.PAGE_CONFIG, extendParam);
        };

        $rootScope.$on('$locationChangeSuccess', function () {
            setMount();
        })
        setMount();
    }])
    .controller('initChat', ['$scope', 'chatSession', '$location', '$timeout', 'chatContent', '$rootScope', 'chatService', 'GKException', 'GKWindowCom', 'chatMember', function ($scope, chatSession, $location, $timeout, chatContent, $rootScope, chatService, GKException, GKWindowCom, chatMember) {
        $scope.sessions = chatSession.sessions;
        $scope.currentMsgList = [];
        $scope.currentSession = null;
        var initTime = 0,lastContect;

        /**
         * 库发生变化后重新初始化
         */
        GKWindowCom.message(function (event) {
            chatSession.refreshSession();
            initConnect();
        });

        $scope.selectSession = function (session) {
            $location.search({
                mountid: session.mount_id
            });
        };

        var key = 0;
        /**
         * 发布新消息
         * @param $event
         * @param postText
         */
        $scope.postText = '';
        $scope.handleKeyDown = function ($event, postText) {
            var keyCode = $event.keyCode;
            if (keyCode != 13 || $scope.it_isOpen) {
                return;
            }
            if (!postText.length) {
                return;
            }
            $scope.postText = '';
            var start = $scope.currentMsgList.length + 1 - $scope.size;
            $scope.start = start < 0 ? 0 : start;
            var now = new Date().getTime();
            var msgData = {
                content: postText,
                receiver: $rootScope.PAGE_CONFIG.mount.org_id,
                sender: $scope.PAGE_CONFIG.user.member_id,
                time: now,
                type: 'text'
            };
            var metaData;
            if ($rootScope.PAGE_CONFIG.file && !$rootScope.PAGE_CONFIG.file.posted && $rootScope.PAGE_CONFIG.file.mount_id == $rootScope.PAGE_CONFIG.mount.mount_id) {
                metaData = {
                    mount_id: $rootScope.PAGE_CONFIG.mount.mount_id,
                    hash: $rootScope.PAGE_CONFIG.file.uuidhash
                };
                angular.extend(msgData, {
                    metadata: JSON.stringify(metaData)
                });
                $rootScope.PAGE_CONFIG.file.posted = true;
            }
            var newMsg = chatContent.add($scope.currentSession, msgData);
            if (!newMsg) {
                return;
            }
            $scope.scrollToIndex = $scope.currentMsgList.length-1;

            chatSession.setLastTime($scope.currentSession, now);
            chatService.add($rootScope.PAGE_CONFIG.mount.org_id, postText, metaData ? JSON.stringify(metaData) : '').error(function (error) {
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
            var minDateline = new Date().getTime();
            if ($scope.currentMsgList.length) {
                minDateline = $scope.currentMsgList[0]['time'];
            }
            $scope.loadingHistoryMsg = true;
            chatService.search($scope.PAGE_CONFIG.mount.org_id, minDateline, 10).success(function (data) {
                $scope.$apply(function () {
                    $scope.loadingHistoryMsg = false;
                    $scope.start = -1;
                    var len = data.length;
                    if ($scope.currentMsgList.length + len > $scope.size) {
                        $scope.start -= len;
                    }
                    angular.forEach(data, function (item) {
                        if (!$scope.currentSession.historyGrid && Number(item.time) < initTime) {
                            item.historyMsg = true;
                            $scope.currentSession.historyGrid = true;
                        }
                        chatContent.add($scope.currentSession, item, true);
                    })
                    if(scrollToBottom){
                        $scope.scrollToIndex = $scope.currentMsgList.length-1;
                    }else{
                        $scope.scrollToIndex = len;
                    }
                })
            }).error(function(){
                    $scope.loadingHistoryMsg = false;
                })
        };

        /**
         * 打开文件位置
         * @param msg
         */
        $scope.goToFile = function (file) {
            var fullpath = file.path;
            var mountId = $rootScope.PAGE_CONFIG.mount.mount_id;
            GKWindowCom.post('launchpad', {
                type: 'gotoFile',
                mountid: Number(mountId),
                webpath: fullpath
            });
        };

        /**
         * 打开文件
         * @param msg
         */
        $scope.openFile = function (file) {
            var fullpath = file.path;
            var mountId = Number($rootScope.PAGE_CONFIG.mount.mount_id);
            if(file.dir==1){
                GKWindowCom.post('launchpad', {
                    type: 'gotoFile',
                    mountid: mountId,
                    webpath: fullpath+'/'
                });
            }else{
                var params = {
                    mountid: mountId,
                    webpath: fullpath
                }
                gkClientInterface.open(params);
            }

        };

        $scope.remindMembers = [];
        var setList = function () {
            var param = $location.search();
            var mountId = Number($rootScope.PAGE_CONFIG.mount.mount_id);
            var session = chatSession.getSessionByMountId(mountId);
            if (!session) return;
            $scope.currentSession = session;
            $scope.remindMembers = chatMember.getMembers($rootScope.PAGE_CONFIG.mount.org_id);
            $scope.currentMsgList = session.msgList;
            $scope.start = 0;
            $scope.size = 100;
            chatSession.setUnreadCount(session, 0);

            if (!$scope.currentMsgList.length || $scope.currentMsgList[0]['time'] > initTime) {
                $scope.handleScrollLoad(true);
            }else{
                $scope.scrollToIndex = $scope.currentMsgList.length-1;
            }
        };

        var lastActiveTime = 0;
        var connect = function () {
            lastContect = chatService.connect(lastActiveTime).success(function (data) {
                if (data) {
                    $timeout(function () {
                        chatService.list(data.time, 0).success(function (newMsgList) {
                            $scope.$apply(function () {
                                var len = newMsgList.length;
                                var orgMag = {};
                                angular.forEach(newMsgList, function (item) {
                                    var session = chatSession.getSessionByMountId(item.receiver);
                                    if (!session) return;
//                                  var start = $scope.msg_list.length + len - $scope.size;
//                                  $scope.start = start < 0 ? 0 : start;
                                    chatContent.add(session, item);
                                    if (session.mount_id != $rootScope.PAGE_CONFIG.mount.mount_id) {
                                        chatSession.setUnreadCount(session, session.unreadCount + 1);
                                    }else{
                                        $scope.scrollToIndex = $scope.currentMsgList.length-1;
                                    }
                                    var time = Number(item.time);
                                    if(time>lastActiveTime){
                                        lastActiveTime = time;
                                    }
                                    chatSession.setLastTime(session, time);
                                })
                            })
                            connect();
                        });
                    }, 1000)

                }
            }).error(function (request, textStatus, errorThrown) {
                    if (textStatus != 'abort') {
                        var errorCode = GKException.getAjaxErroCode(request);
                        $timeout(function () {
                            if (errorCode == 40310) {
                                initConnect();
                            } else {
                                connect();
                            }
                        }, 2000)
                    }
                });
        };
        var initConnect = function () {
                $scope.error = null;
                chatService.login().success(function (data) {
                if (lastContect) {
                    lastContect.abort();
                }
                lastActiveTime = Number(data.time);
                initTime = Number(data.time);
                setList();
                connect();
            }).error(function (xhr,textStatus,thrown) {
                    $scope.$apply(function(){
                        //$scope.error = GKException.getAjaxError(xhr,textStatus,thrown);
                    })
                });
        };
        $scope.$on('$locationChangeSuccess', function (event,newLocation,oldLocation) {
            if(newLocation == oldLocation){
                return;
            }
            setList();
        })
        initConnect();
    }])

    .factory('chatContent', ['chatMember', 'chatSession', function (chatMember, chatSession) {
        var chatContent = {
            formatItem: function (value) {
                var sender = chatMember.getMemberItem(value.receiver, value.sender);
                var filename = Util.String.baseName(value.fullpath);
                var ext = Util.String.getExt(filename);
                var extendValue = {
                    sender_name: sender ? sender['member_name'] : value.sender,
                    is_vip: sender && sender.isvip ? true : false
                };

                if (value.metadata) {
                    value.metadata = JSON.parse(value.metadata);
                    if (value.metadata.hash && value.metadata.mount_id) {
                        var file = gkClientInterface.getFileInfo({
                            mountid: Number(value.metadata.mount_id),
                            uuidhash: value.metadata.hash
                        });
                        file.filename = Util.String.baseName(file.path);
                        file.ext = Util.String.getExt(file.filename);
                        extendValue.file = file;
                    }
                }
                angular.extend(value, extendValue)
                return value;
            },
            setItemError: function (msg, errorMsg) {
                msg.error = errorMsg;
            },
            add: function (session, newMsg, head) {
                head = angular.isDefined(head) ? head : false;
                newMsg = this.formatItem(newMsg);
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
                if (!session.unreadCount) {
                    session.unreadCount = 0;
                }
                if (!session.lastTime) {
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
            setUnreadCount: function (session, unreadCount) {
                session.unreadCount = unreadCount;
            },
            setLastTime: function (session, lastTime) {
                session.lastTime = lastTime;
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
        //var host = 'http://10.0.0.150:1238';
        var host = 'http://112.124.68.214:1238';
        var chat = {
            add: function (orgId, content, metadata) {
                metadata = angular.isDefined(metadata) ? metadata : '';
                return jQuery.ajax({
                    url: host + '/post-message',
                    type: 'POST',
                    data: {
                        'content': content,
                        'receiver': orgId,
                        'metadata': metadata,
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
            connect: function (time) {
                return jQuery.ajax({
                    type: 'GET',
                    url: host + '/connect',
                    dataType: 'json',
                    data: {
                        'token': gkClientInterface.getToken(),
                        'time':time
                    },
                    timeout: 30000000
                });
            },
            login: function () {
                return jQuery.ajax({
                    type: 'POST',
                    url: host + '/login',
                    dataType: 'json',
                    data: {
                        'token': gkClientInterface.getToken()
                    }
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
    .directive('scrollToMsg', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                $scope.$watch($attrs.scrollToMsg, function (value, oldValue) {
                    if(angular.isNumber(value)){
                        if(value<0) value = 0;
                        $timeout(function () {
                            var chatItem = $element.find('.chat_item:eq(' + value + ')');
                            if (chatItem.size()) {
                                $element.scrollTop(chatItem.position().top+$element.scrollTop());
                            }
                        });
                        $scope[$attrs.scrollToMsg] = undefined;
                    }
                });
            }
        }
    }])

