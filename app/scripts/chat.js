'use strict';

angular.module('gkChat', ['GKCommon'])
    .run(['$rootScope', function ($rootScope) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser()
        }
    }])
    .controller('initSession','$scope',[function(chatSession,$scope){
       $scope.sessions = chatSession.getSession();
       var setMount = function(){
           var param = $location.search();
           $scope.mountId = Number(param.mount_id);
       }
       $scope.$on('$locationChangeSuccess', function () {
           setMount();
       })
       setMount();

    }])

    .controller('initContent', ['$location', '$scope', 'chatService', '$timeout', 'GKApi', 'GKException', '$filter', 'chatSession', function ($location, $scope, chatService, $timeout, GKApi, GKException, $filter, chatSession) {

        $scope.$on('$locationChangeSuccess', function () {
            var param = $location.search();
            var mountId = Number(param.mount_id);
        })

        $scope.connecting = true;
        $scope.msg_list = [];
        $scope.start = 0;
        $scope.size = 100;
        $scope.teamList = GKMount.getOrgMounts().concat(GKMount.getJoinOrgMounts());
        $scope.org = gkClientInterface.getMount({
            mountid: mountId
        });
        $scope.members = [];
        var now = new Date().getTime();

        $scope.historyGrid = false;


        GKApi.teamGroupsMembers($scope.org.orgid).success(function (data) {
            $scope.members = data.members;
            $scope.connecting = false;
        });

        $scope.scrollToBottom = false;
        $scope.handleKeyDown = function ($event, postText) {
            var keyCode = $event.keyCode;
            if (keyCode != 13) {
                return;
            }
            if (!postText.length) {
                return;
            }
            $scope.postText = '';
            var start = $scope.msg_list.length + 1 - $scope.size;
            $scope.start = start < 0 ? 0 : start;
            var newMsg = add({
                content: postText,
                receiver: $scope.org.orgid,
                sender: $scope.PAGE_CONFIG.user.member_id,
                time: new Date().getTime(),
                type: 'text'
            });
            $scope.scrollToBottom = true;
            chatService.add($scope.org.orgid, postText).success(function () {

            }).error(function (error) {
                    var errorMsg = GKException.getAjaxErrorMsg(error);
                    setMsgError(newMsg, errorMsg);
                });

            $event.preventDefault();
        };


        $scope.handleScrollLoad = function (scrollToBottom) {
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

        $scope.goToFile = function (msg) {
            var fullpath = msg.fullpath;
            var mountId = $scope.PAGE_CONFIG.mount.mountid;
        };

        $scope.openFile = function (msg) {
            var fullpath = msg.fullpath;
            var mountId = $scope.PAGE_CONFIG.mount.mountid;
            var params = {
                mountid: Number(mountId),
                webpath: fullpath
            }
            gkClientInterface.open(params);
        }

        var connect = function () {
            chatService.connect($scope.org.orgid).success(function (data) {
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
        connect();
        $scope.handleScrollLoad(true);

    }])
    .factory('chatContent', ['chatMember',function (chatMember) {
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
            setItemError:function($scope,msg,errorMsg){
                angular.forEach($scope.msg_list, function (value) {
                    if (msg == value) {
                        value.error = errorMsg;
                        return false;
                    }
                })
            },
            add:function($scope,newMsg){
                newMsg = this.formatItem(newMsg);
                $scope.msg_list.push(newMsg);
                return newMsg;
            },
            pop:function($scope,newMsg){
                newMsg = this.formatItem(newMsg);
                $scope.msg_list.unshift(newMsg);
                return newMsg;
            }
        };
        return chatContent;
    }])
    .factory('chatSession', [function (GKMount) {
        var sessions = GKMount.getOrgMounts().concat(GKMount.getJoinOrgMounts());
        var chatSession = {
            getSession:function(){
                return sessions;
            },
            refreshSession:function(){
                GKMount.refreshMounts();
                sessions = GKMount.getOrgMounts().concat(GKMount.getJoinOrgMounts());
            }

        };
        return chatSession;
    }])
    .factory('chatMember', [function () {
        var chatMember = {
            getMemberItem: function (orgId,memberId) {
                var member;
                angular.forEach($scope.members, function (value) {
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
        //var host = 'http://10.0.0.150:1238';
        var host = 'http://112.124.68.214:1238';
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

