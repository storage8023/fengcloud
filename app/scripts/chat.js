'use strict';

angular.module('gkChat', ['GKCommon','jmdobry.angular-cache'])
    .run(['$rootScope', function ($rootScope) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            file: null,
            partition:'teamfile'
        }
    }])
    .controller('initChat', ['$scope', 'chatSession', '$location', '$timeout', 'chatContent', '$rootScope', 'chatService', 'GKException', 'chatMember','$angularCacheFactory','$window',function ($scope, chatSession, $location, $timeout, chatContent, $rootScope, chatService, GKException, chatMember,$angularCacheFactory,$window) {
        var maxCount = 20,
            maxMsgTime = 0,
            minMsgTime = 0,
            topWindow = window.top,
            postedMsg = [];
        $scope.view = 'chat';
        $scope.currentMsgList = [];
        $scope.currentSession = null;

        var post = function(type,content,metadata){
            metadata = angular.isDefined(metadata) ? metadata : '';
            var now = new Date().getTime();
            var msgData = {
                content: content,
                receiver: $scope.currentSession.orgid,
                sender: $rootScope.PAGE_CONFIG.user.member_name,
                time: now,
                type: type,
                metadata:metadata
            };
            var newMsg = chatContent.add($scope.currentMsgList, msgData);

            if (!newMsg) {
                return;
            }
            $scope.scrollToIndex = $scope.currentMsgList.length-1;
            chatService.add(type,$scope.currentSession.orgid, content, metadata).then(function(re){
                postedMsg.push(re.time);
            },function(re){
                var errorMsg = GKException.getClientErrorMsg(re);
                chatContent.setItemError(newMsg, errorMsg);
            })
        };

        /**
         * 发布新消息
         * @param $event
         * @param postText
         */

        $scope.handleKeyDown = function ($event, postText) {
            var keyCode = $event.keyCode;
            if (keyCode != 13 || $scope.it_isOpen) {
                return;
            }
            if (!postText) {
                $event.preventDefault();
                return;
            }
            $scope.postText = '';
            post('text',postText);
            $event.preventDefault();
        };

        $scope.postMessage = function(postText){
            if (!postText) {
                return;
            }
            $scope.postText = '';
            post('text',postText);
        };

        /**
         * 滚动加载
         * @param scrollToBottom
         */
        $scope.postText = '';
        $scope.handleScrollLoad = function (scrollToBottom) {
            scrollToBottom = angular.isDefined(scrollToBottom) ? scrollToBottom : false;
            var minDateline = new Date().getTime();
            if ($scope.currentMsgList.length) {
                minDateline = $scope.currentMsgList[0]['time'];
            }
            $scope.firstLoading = scrollToBottom;
            chatService.search($scope.currentSession.orgid, minDateline, 10).then(function(data){
                if(!data || !data.list || !data.list.length) return;
                var list =  data.list;
                var len = list.length;
                for(var i=len;i--; i>=0){
                    chatContent.add($scope.currentMsgList, list[i], true);
                }
                if(scrollToBottom){
                    $scope.scrollToIndex = $scope.currentMsgList.length-1;
                }else{
                    $scope.scrollToIndex = len;
                }
            })
        };

        /**
         * 打开文件位置
         * @param msg
         */
        $scope.goToFile = function ($event,file) {
            var fullpath = file.path;
            var mountId = $scope.currentSession.mountid;
            topWindow.gkFrameCallback('OpenMountPath',{
                mountid:mountId,
                webpath:fullpath
            })
            $event.stopPropagation();
        };

        /**
         * 打开文件
         * @param msg
         */
        $scope.openFile = function ($event,file) {
            var fullpath = file.path;
            var mountId = Number($scope.currentSession.mountid);
            if(file.dir==1){
                topWindow.gkFrameCallback('OpenMountPath',{
                    mountid:mountId,
                    webpath:fullpath+'/'
                })
            }else{
                var params = {
                    mountid: mountId,
                    webpath: fullpath
                }
                gkClientInterface.open(params);
            }
            $event.stopPropagation();
        };

        /**
         * 引用文件
         * @param file
         */
        $scope.quoteFile = function (file) {
            var metadata = JSON.stringify({
                mount_id: file.mount_id,
                hash:  file.uuidhash,
                filehash: file.filehash,
                filesize: file.filesize,
                version: file.version
            });
            post('file','',metadata);
        };

        $scope.cancelAtFile = function(){
            $rootScope.PAGE_CONFIG.file = null
        };

        var postTextCache = $angularCacheFactory.get('postTextCache');
        if(!postTextCache){
            postTextCache = $angularCacheFactory('postTextCache',{
                maxAge: 2592000000, //30天后过期
                deleteOnExpire: 'aggressive',
                storageMode: 'localStorage'
            });
        }

        $scope.remindMembers = [];

        var setList = function () {
            postedMsg = [];
            var param = $location.search();
            var mountId = Number(param.mountid);
            var session = chatSession.getSessionByMountId(mountId);
            if (jQuery.isEmptyObject(session)){
                return;
            };
            $scope.currentSession = session;
            var extendParam = {};
            $scope.remindMembers = chatMember.getMembers($scope.currentSession.orgid);
            var msgList = [];
            chatService.list($scope.currentSession.orgid,0,maxCount).then(function(re){
                    var minDataline = 0;
                    if(re && re.list && re.list.length){
                        angular.forEach(re.list,function(item){
                            chatContent.add(msgList,item);
                            var time =  Number(item.time);
                            if(time<minMsgTime){
                                minMsgTime = time;
                            }
                            if(time>maxMsgTime){
                                maxMsgTime = time;
                            }
                        });
                    }
                    $scope.currentMsgList = msgList;
                //文件
                if (param.fullpath) {
                    extendParam.file = gkClientInterface.getFileInfo({
                        mountid: mountId,
                        webpath: param.fullpath
                    });
                    var metadata = JSON.stringify({
                        mount_id: mountId,
                        hash:  extendParam.file.uuidhash,
                        filehash: extendParam.file.filehash,
                        filesize: extendParam.file.filesize,
                        version: extendParam.file.version
                    });
                    post('file','',metadata);
                }

                    $scope.scrollToIndex = $scope.currentMsgList.length-1;
                    //topWindow.gkFrameCallback('clearMsgTimeclearMsgTime',{orgId:$scope.currentSession.orgid});
                });

            $scope.focusTextarea = true;
            //$scope.postText = postTextCache.get(String($scope.currentSession.orgid)) || '';
            $scope.postText = '';

        };

        $scope.$on('atMember',function(event,at){
            $timeout(function(){
                $scope.insertStr = '@'+ at+' ';
                $scope.focusTextarea = true;
            })
        })

        $scope.$on('chatMessageUpdate',function(event,item){
            if(item.receiver == $scope.currentSession.orgid){
                chatService.list($scope.currentSession.orgid,maxMsgTime, maxCount).then(function(re){
                    if(!re || !re.list || !re.list.length){
                        return;
                    }
                    var newMsgList = re.list;
                    angular.forEach(newMsgList, function (item) {
                        var time = Number(item.time);
                        if(time>maxMsgTime){
                            maxMsgTime = time;
                        }
                        if(postedMsg.indexOf(time)>=0){
                            return;
                        }
                        chatContent.add($scope.currentMsgList, item);
                        $scope.scrollToIndex = $scope.currentMsgList.length-1;
                    })
                })
            }
        })

        $scope.$on('$locationChangeSuccess', function (event,newLocation,oldLocation) {
            if(newLocation == oldLocation){
                return;
            }
            setList();
        })

        setList();
        $scope.saveLastText = function(postText){
            postTextCache.put($scope.currentSession.orgid,postText);
        };

        $scope.$on('UpdateMembers',function($event,param){
            if($scope.currentSession.mountid == param.mountid){
                chatMember.refreshMembers($scope.currentSession.orgid);
                $scope.remindMembers = chatMember.getMembers($scope.currentSession.orgid);
            }
        })

    }])
    .factory('chatContent', ['chatMember', 'chatSession','$q', function (chatMember, chatSession,$q) {
        var chatContent = {
            post:function(){

            },
            formatItem: function (value) {
                var sender = chatMember.getMemberItem(value.receiver, value.sender);
                var filename = Util.String.baseName(value.fullpath);
                var ext = Util.String.getExt(filename);
                var extendValue = {
                    sender_name: sender ? sender['member_name'] : value.sender,
                    is_vip: sender && sender.isvip ? true : false,
                    sender_id:sender ? sender['member_id'] : value.sender,
                };
                if (value.metadata) {
                    value.metadata = JSON.parse(value.metadata);
                    if (value.metadata.hash && value.metadata.mount_id) {
                        var file = gkClientInterface.getFileInfo({
                            mountid: Number(value.metadata.mount_id),
                            uuidhash: value.metadata.hash
                        });
                        if(!jQuery.isEmptyObject(file)){
                            file.mount_id = Number(value.metadata.mount_id);
                            file.filename = Util.String.baseName(file.path);
                            file.ext = Util.String.getExt(file.filename);
                            extendValue.file = file;
                        }

                    }
                }
                angular.extend(value, extendValue)
                return value;
            },
            setItemError: function (msg, errorMsg) {
                msg.error = errorMsg;
            },
            add: function (msgList, newMsg, head) {
                head = angular.isDefined(head) ? head : false;
                newMsg = this.formatItem(newMsg);
                if (!msgList) {
                    msgList = [];
                }
                head ? msgList.unshift(newMsg) : msgList.push(newMsg);
                return newMsg;
            }
        };
        return chatContent;
    }])
    .factory('chatSession', ['GKMount','$angularCacheFactory','$filter', function (GKMount,$angularCacheFactory,$filter) {
        var chatSessionCache = $angularCacheFactory.get('chatSessionCache');
        if(!chatSessionCache){
            chatSessionCache = $angularCacheFactory('postRemarkCache',{
                maxAge: 2592000000, //30天后过期
                deleteOnExpire: 'aggressive',
                storageMode: 'localStorage'
            });
        }
        var chatSession = {
            getSessionByMountId: function (mountId) {
                return gkClientInterface.getMount({
                    mountid:Number(mountId)
                });
            }
        };
        return chatSession;
    }])
    .factory('chatMember', ['GKApi', function (GKApi) {
        var members = {};
        var chatMember = {
            getMembers: function (orgId) {
                if (!members[orgId]) {
                    var re = gkClientInterface.getOrgMembers({
                        orgid:orgId
                    });
                    members[orgId] = re.list || [];
                }
                return members[orgId];
            },
            getMemberItem: function (orgId, memberId) {
                var members = this.getMembers(orgId),
                    member;
                angular.forEach(members, function (value) {
                    if (value.username == memberId) {
                        member = value;
                        return false;
                    }
                })
                return member;
            },
            refreshMembers:function(orgId){
                if(members[orgId] !== undefined){
                    var re = gkClientInterface.getOrgMembers({
                        orgid:orgId
                    });
                    members[orgId] = re.list || [];
                }
            }
        };
        return chatMember;
    }])
    .factory('chatService', ['$q',function ($q) {
        var chat = {
            add: function (type,orgId, content, metadata) {
                var deferred = $q.defer();
                metadata = angular.isDefined(metadata) ? metadata : '';
                gkClientInterface.postChatMessage({
                    'content': content,
                    'receiver': String(orgId),
                    'metadata': metadata,
                    'type': type,
                },function(re){
                    if(!re.error){
                        deferred.resolve(re);
                    }else{
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            search: function (orgId, dateline, size) {
                var deferred = $q.defer();
                var re = gkClientInterface.getChatMessage({
                    'receiver':String(orgId),
                    'dateline':dateline,
                    'count':size,
                    'before':1
                });
                deferred.resolve(re);
                return deferred.promise;
            },
            list: function (orgId,lastTime,count) {
                var deferred = $q.defer();
                var re = gkClientInterface.getChatMessage({
                    'receiver':String(orgId),
                    'dateline':lastTime,
                    'count':count,
                    'before':0
                });
                deferred.resolve(re);
                return deferred.promise;
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

