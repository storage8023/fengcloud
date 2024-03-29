'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkChat', ['GKCommon', 'ui.bootstrap', 'LocalStorageModule'])
    .run(['$rootScope', 'localStorageService', function ($rootScope, localStorageService) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            file: null,
            partition: 'teamfile',
            mode: localStorageService.get('gk_mode') || 'chat'
        }

    }])
    .controller('initChat', [
        '$scope',
        'chatSession',
        '$location',
        '$timeout',
        'chatContent',
        '$rootScope',
        'chatService',
        'GKException',
        'chatMember',
        '$window',
        '$interval',
        'GKApi',
        'localStorageService',
        'GKDialog',
        '$document',
        'chatTopic',
        '$filter',
        'GKAuth',
        'GKKeyEvent',
        function ($scope, chatSession, $location, $timeout, chatContent, $rootScope, chatService, GKException, chatMember, $window, $interval, GKApi, localStorageService, GKDialog, $document,chatTopic,$filter,GKAuth,GKKeyEvent) {
        var maxCount = 20,
            maxMsgTime = 0,
            minMsgTime = 0,
            topWindow = window.top,
            postedMsg = [];
        $scope.currentMsgList = $scope.topicHintList = [];
        $scope.currentSession = null;
        $scope.onlyShowTopic = false;



        var post = function (type, content, metadata, status) {
            metadata = angular.isDefined(metadata) ? metadata : '';
            var now = new Date().getTime();
            var msgData = {
                content: content,
                receiver: $scope.currentSession.orgid,
                sender: $rootScope.PAGE_CONFIG.user.member_name,
                time: now,
                type: type,
                metadata: metadata
            };
            topWindow.gkFrameCallback('ChatMessageUpdate', {
                list:[msgData]
            })
            var newMsg = chatContent.add($scope.currentMsgList, msgData);
            if (!newMsg) {
                return;
            }
            $scope.scrollToIndex = $scope.currentMsgList.length - 1;
            chatService.add(type, $scope.currentSession.orgid, content, metadata, now, status).then(function () {
                postedMsg.push(now);
            }, function (re) {
                var errorMsg = GKException.getClientErrorMsg(re);
                chatContent.setItemError(newMsg, errorMsg);
            })
            var matches = content.match(Util.RegExp.POUND_TOPIC);
            if(matches&&matches.length){
                $scope.topicHintList = chatTopic.add($scope.currentSession.orgid,matches[1]);
            }
        };

        var getList = function (lastTime, callback) {
            var topic = '';
            if ($scope.onlyShowTopic) {
                topic = ['#', $scope.topic, '#'].join('');
            }
            $scope.loadingHistoryMsg = true;
            chatService.list($scope.currentSession.orgid, lastTime, maxCount, topic).then(function (re) {
                if (re && re.list && re.list.length) {
                    angular.forEach(re.list, function (item) {
                        var time = Number(item.time);
                        if (minMsgTime == 0 || time < minMsgTime) {
                            minMsgTime = time;
                        }
                        if (time > maxMsgTime) {
                            maxMsgTime = time;
                        }
                        if (postedMsg.indexOf(time) >= 0) {
                            return;
                        }
                        chatContent.add($scope.currentMsgList, item);
                    });
                }
                if (typeof callback === 'function') {
                    callback();
                }
                $scope.loadingHistoryMsg = false;
            });
        };

        var toggleTopicLabel = function(state){
            if(state == 'show'){
                var label = angular.element($document).find('.topic_label');
                $scope.showTopicLabel = true;
                $timeout(function(){
                    $scope.textareaStyle = {
                        'text-indent': label.outerWidth(true)
                    };
                })
            }else{
                $scope.showTopicLabel = false;
                $scope.textareaStyle = {
                    'text-indent': 0
                };
            }
        };

        $scope.handleSysKeyDown = function ($event) {
            var ctrlKeyOn = $event.ctrlKey || $event.metaKey;
            if (ctrlKeyOn && $event.keyCode == 86) {
                var sysData = gkClientInterface.getClipboardData();
                if (!sysData || !sysData.list || !sysData.list.length) {
                    return;
                }
                topWindow.gkFrameCallback('showSelectFileDialog', {
                    mountId: $scope.currentSession.mountid,
                    list: sysData.list
                })
            }
        };

        $scope.openSummaryDetail = function($event,msg){
            var param = {
                mountId:$scope.currentSession.mountid,
                from:msg.metadata.from,
                to:msg.metadata.to
            }
            topWindow.gkFrameCallback('openSummaryDetail',param);
        }

        /**
         * 发布新消息
         * @param $event
         * @param postText
         */

        $scope.handleKeyDown = function ($event, postText) {
            var keyCode = $event.keyCode;
            var postMsgKeyDown = GKKeyEvent.postMsgKeyDown($event,postText,$scope.showTopicLabel,$scope.it_isOpen,$scope.topic,800);
            if(postMsgKeyDown == "-1"){
               return;
            }else if(postMsgKeyDown == "0"){
                if (keyCode == 8) {
                    if($scope.showTopicLabel && !postText.length){
                        $scope.topic = '';
                        $scope.onlyShowTopic = false;
                        toggleTopicLabel('hide');
                    }
                }
            }else{
                $scope.postText = "";
                post('text', postMsgKeyDown);
            }
        };

        $scope.postMessage = function (postText) {
            if (!postText && !$scope.showTopicLabel) {
                return;
            }
            if (postText.length > 800) {
                alert('一次发送的消息字数不能超过800字，请分条发送');
                return;
            }
            if ($scope.showTopicLabel) {
                postText = '#' + $scope.topic + '#' + postText
            }
            $scope.postText = '';
            post('text', postText);
        };

        /**
         * 滚动加载
         * @param scrollToBottom
         */
        $scope.postText = '';
        var firstScrollLoad = true;
        $scope.handleScrollLoad = function (scrollToBottom) {
            if(firstScrollLoad){
                firstScrollLoad = false;
                return;
            }
            scrollToBottom = angular.isDefined(scrollToBottom) ? scrollToBottom : false;
            var minDateline = new Date().getTime();
            if ($scope.currentMsgList.length) {
                minDateline = $scope.currentMsgList[0]['time'];
            }
            $scope.firstLoading = scrollToBottom;
            var topic = '';
            if ($scope.onlyShowTopic) {
                topic = ['#', $scope.topic, '#'].join('');
            }
            chatService.search($scope.currentSession.orgid, minDateline, 10, topic).then(function (data) {
                if (!data || !data.list || !data.list.length) return;
                var list = data.list;
                var len = list.length;
                for (var i = len; i--; i >= 0) {
                    chatContent.add($scope.currentMsgList, list[i], true);
                }
                if (scrollToBottom) {
                    $scope.scrollToIndex = $scope.currentMsgList.length - 1;
                } else {
                    $scope.scrollToIndex = len;
                }
            })
        };

        /**
         * 打开文件位置
         * @param msg
         */
        $scope.goToFile = function ($event, file) {
            var fullpath = file.path;
            var mountId = $scope.currentSession.mountid;
            topWindow.gkFrameCallback('OpenMountPath', {
                mountid: mountId,
                webpath: fullpath
            })
            $event.stopPropagation();
        };

        /**
         * 打开文件
         * @param msg
         */
        $scope.openFile = function ($event, msg) {
            var type = msg.type;
            var metadata = msg.metadata;
            if (type == 'file') {
                var mountId = Number($scope.currentSession.mountid);
                var file;
                if (!metadata.hash) {
                    if (metadata.fullpath) {
                        file = gkClientInterface.getFileInfo({
                            mountid: Number(metadata.mount_id),
                            webpath: metadata.fullpath
                        });
                    }
                } else {
                    file = gkClientInterface.getFileInfo({
                        mountid: Number(metadata.mount_id),
                        uuidhash: metadata.hash
                    });
                }
                if (jQuery.isEmptyObject(file)) {
                    file = null;
                }
                if (metadata.dir == 1) {
                    if (!file) return;
                    var fullpath = file.path;
                    topWindow.gkFrameCallback('OpenMountPath', {
                        mountid: mountId,
                        webpath: fullpath + '/'
                    })
                } else {
                    var permissions = [];
                    if ($scope.currentSession.property) {
                        var properties = typeof $scope.currentSession.property === 'object'?$scope.currentSession.property:JSON.parse($scope.currentSession.property);
                        permissions = properties.permissions ? properties.permissions : [];
                    }
                    if (permissions.indexOf('file_read') < 0 && file) {
                        alert('你没有权限查看改文件');
                        return;
                    }
                    var params = {
                        mountid: mountId,
                        filehash: metadata.filehash,
                        uuidhash: metadata.hash
                    };
                    if (!file) {
                        if (metadata.fullpath) {
                            params.webpath = metadata.fullpath;
                        } else {
                            params.webpath = metadata.filename;
                            params.mountid = metadata.mount_id;
                        }
                    } else {
                        params.webpath = file.path;
                    }
                    gkClientInterface.open(params);
                }
            } else {
                var url = metadata.url;
                if (url.indexOf('?') >= 0) {
                    url += '&uuid=' + $rootScope.PAGE_CONFIG.user.uuid;
                } else {
                    url += '?uuid=' + $rootScope.PAGE_CONFIG.user.uuid;
                }
                 url = gkClientInterface.getUrl({
                    url: url,
                    sso: 0
                });
                GKDialog.openUrl(url);
            }
            $event.stopPropagation();
        };

        $scope.remindMembers = [];

        var setList = function () {
            if ($rootScope.PAGE_CONFIG.mode != 'chat') {
                return;
            }
            postedMsg = [];
            var param = $location.search();
            var mountId = Number(param.mountid);
            var session = chatSession.getSessionByMountId(mountId);
            if (jQuery.isEmptyObject(session)) {
                return;
            }
            $scope.currentSession = session;
            var extendParam = {};
            $scope.remindMembers = chatMember.getMembers($scope.currentSession.orgid);
            chatContent.pendingMsg = [];
            $scope.currentMsgList = [];
            $scope.topic = '';
            $scope.onlyShowTopic = false;
            $scope.showTopicLabel = false;
            $scope.textareaStyle = {
                'text-indent': 0
            };
            firstScrollLoad = true;

            getList(0, function () {
                //文件
                if (param.fullpath) {
                    extendParam.file = gkClientInterface.getFileInfo({
                        mountid: mountId,
                        webpath: param.fullpath
                    });
                    if (!extendParam.file || jQuery.isEmptyObject(extendParam.file)) {
                        alert('文件已被删除');
                        return;
                    }
                    var metadata = JSON.stringify({
                        mount_id: mountId,
                        dir: extendParam.file.dir,
                        hash: extendParam.file.uuidhash,
                        filehash: extendParam.file.filehash,
                        filesize: extendParam.file.filesize,
                        version: extendParam.file.version,
                        fullpath: extendParam.file.path
                    });
                    $scope.topic = Util.String.baseName(param.fullpath);
                    toggleTopicLabel('show');
                    post('file', ['#',$scope.topic,'#'].join(''), metadata, extendParam.file.status == 1 ? 1 : 0);
                }
                $scope.scrollToIndex = $scope.currentMsgList.length - 1;

            });

            $scope.chatLoaded = true;
            $timeout(function () {
                $scope.focusTextarea = true;
            })
            $scope.postText = '';
            /**工具栏**/
//            chatSession.getApps($scope.currentSession.orgid).then(function(list){
//                $scope.apps = list;
//            });
//            $scope.topicHintList = $filter('orderBy')(chatTopic.get($scope.currentSession.orgid),'-dateline');
        };


        var msgTip = localStorageService.get('msgTip');
        if (!msgTip) {
            $scope.showTip = true;
        }

        $scope.gotoApp = function (app) {
            switch (app.id){
                case -1://#话题
                    $scope.cursorPos = 1;
                    $scope.insertPos = 0;
                    $scope.insertStr = '##';
                    break
                case 0:
                    if(!GKAuth.check($scope.currentSession,'','file_write')){
                        alert('你没有权限在当前云库下添加文件或文件夹');
                        return;
                    }
                    gkClientInterface.addFileDialog(function(addFiles){
                        if (!addFiles || !addFiles.list || !addFiles.list.length) {
                            return;
                        }
                        topWindow.gkFrameCallback('showSelectFileDialog', {
                            mountId: $scope.currentSession.mountid,
                            list:addFiles.list
                        })
                    });

                    break
                default:
                    GKApi.getAppKey($scope.currentSession.orgid, app.id).success(function (data) {
                        if (!data || !data.request_key) {
                            return;
                        }
                        var request_key = data.request_key;
                        var uuid = data.uuid;
                        var url = app.url;
                        if (app.url.indexOf('?') >= 0) {
                            url += '&request_key=' + request_key;
                        } else {
                            url += '?request_key=' + request_key;
                        }
                        url += '&uuid=' + uuid + '&token=' + gkClientInterface.getToken();
                        GKDialog.openUrl(url);
                    }).error(function (req) {
                        GKException.handleAjaxException(req);
                    })
            }
        };

        $scope.hideTip = function () {
            $scope.showTip = false;
            localStorageService.add('msgTip', 1);
        }

        $scope.$on('atMember', function (event, at) {
            $timeout(function () {
                $scope.insertStr = '@' + at + ' ';
                $scope.focusTextarea = true;
            })
        })

        $scope.$on('chatMessageUpdate', function (event, item) {
            if (!$scope.currentSession) return;
            if (item.receiver != $scope.currentSession.orgid) return;

            getList(maxMsgTime,function(){
                if($scope.isScrollBottom){
                    $scope.scrollToIndex = $scope.currentMsgList.length - 1;
                }
            });
        })

        $scope.$on('$locationChangeSuccess', function (event, newLocation, oldLocation) {
            $scope.chatLoaded = false;
            setList();
        })

        $rootScope.$on('changeMode', function ($event, mode) {
            $rootScope.PAGE_CONFIG.mode = mode;
            if (mode == 'chat' && !$scope.chatLoaded) {
                setList();
            }
        })

        $scope.showDragChat = false;
        $scope.togglerDragChat = function (show) {
            $scope.showDragChat = show;
        };

        $scope.$on('UpdateMembers', function ($event, param) {
            if ($scope.currentSession && $scope.currentSession.mountid == param.mountid) {
                chatMember.refreshMembers($scope.currentSession.orgid);
                $scope.remindMembers = chatMember.getMembers($scope.currentSession.orgid);
            }
        })

        var dragFiles;
        $scope.$on('selectAddDirSuccess', function ($event, param) {
            var selectedPath = param.selectedPath;
            var list = param.list || dragFiles.list;
            var params = {
                parent: selectedPath,
                type: 'save',
                list: list,
                mountid: $scope.currentSession.mountid
            };

            gkClientInterface.addFile(params, function (re) {
                if (!re.error) {
                    var list = re.list;
                    if (!list || !list.length) return;
                    angular.forEach(list, function (file) {
                        GKApi.dragUpload($scope.currentSession.mountid, file.path);
                        var metadata = JSON.stringify({
                            mount_id: $scope.currentSession.mountid,
                            hash: file.uuidhash || '',
                            dir: file.dir,
                            filehash: file.filehash || '',
                            filesize: file.filesize || 0,
                            version: file.version || 0,
                            fullpath: file.path
                        });
                        post('file', '', metadata, file.status == 1 ? 1 : 0);
                    })
                } else {

                }
            })
        })

        $scope.handleChatDrop = function ($event) {
            dragFiles = gkClientInterface.getDragFiles();
            topWindow.gkFrameCallback('showSelectFileDialog', {
                mountId: $scope.currentSession.mountid
            })
            $scope.hideTip();
        };

        var lastOffset = 0;
        $interval(function () {
            if (!chatContent.pendingMsg.length) {
                return;
            }
            angular.forEach(chatContent.pendingMsg, function (item, key) {
                var metadata = item.metadata;
                var info = gkClientInterface.getTransInfo({
                    mountid: metadata.mount_id,
                    webpath: metadata.fullpath
                });
                //上传完成
                if (info.status == 1) {
                    lastOffset = 0;
                    item.offset = metadata.filesize;
                    chatContent.pendingMsg.splice(key, 1);
                    $timeout(function () {
                        item.file = gkClientInterface.getFileInfo({
                            mountid: metadata.mount_id,
                            webpath: metadata.fullpath
                        });
                        item.file.status = 3;
                        angular.extend(item.metadata, {
                            filehash: item.file.filehash,
                            hash: item.file.uuidhash
                        });
                    }, 500)
                    return;
                } else {
                    var offset = Number(info.offset || 0);
                    if (offset <= lastOffset) {
                        return;
                    }
                    lastOffset = item.offset = offset;
                }
            })
        }, 1000);



        $scope.quoteTopic = function(topic){
            $scope.topic = topic;
            toggleTopicLabel('show');
            $timeout(function(){
                $scope.focusTextarea = true;
            })
        };

        var onlyShowTopic = function(){
            if (!$scope.currentSession) return;
            $scope.loadingHistoryMsg = true;
            $scope.currentMsgList = [];
            postedMsg = [];
            getList(minMsgTime, function () {
                $scope.loadingHistoryMsg = false;
                $scope.scrollToIndex = $scope.currentMsgList.length - 1;
            });
        };

        $scope.handleBlur = function ($event, topic) {
            if (!topic){
                return;
            }
            toggleTopicLabel('show');
            if($scope.onlyShowTopic){
                onlyShowTopic();
            }
            $timeout(function () {
                $scope.focusTextarea = true;
            })
        };

        $scope.atMember = function(at){
            $scope.insertStr = ['@',at,' '].join('');
        };

        $scope.$watch('onlyShowTopic', function (val,oldVal) {
            if(val == oldVal) return;
            onlyShowTopic();
        })


    }])
    .factory('chatContent', ['chatMember', function (chatMember) {
        var chatContent = {
            pendingMsg: [],
            formatItem: function (value) {
                var sender = chatMember.getMemberItem(value.receiver, value.sender);
                var extendValue = {
                    sender_name: value.sender_name ? value.sender_name : sender ? sender['member_name'] : value.sender,
                    is_vip: sender && sender.isvip ? true : false
                };

                if (value.metadata) {
                    try{
                        value.metadata = JSON.parse(value.metadata);
                    }catch(e){
                        value.metadata = '';
                        console.log(' JSON Parse Error',e);
                    }
                    if (value.metadata.mount_id) {
                        if (value.metadata.fullpath) {
                            value.metadata.filename = Util.String.baseName(value.metadata.fullpath);
                            value.metadata.ext = Util.String.getExt(value.metadata.filename);
                        }
                        var file;
                        if (!value.metadata.hash) {
                            if (value.metadata.fullpath) {
                                file = gkClientInterface.getFileInfo({
                                    mountid: Number(value.metadata.mount_id),
                                    webpath: value.metadata.fullpath
                                });
                            }
                        } else {
                            file = gkClientInterface.getFileInfo({
                                mountid: Number(value.metadata.mount_id),
                                uuidhash: value.metadata.hash
                            });
                        }
                        if (file && !jQuery.isEmptyObject(file)) {
                            file.mount_id = Number(value.metadata.mount_id);
                            extendValue.file = file;
                        }
                    }
                }
                if(value.type == 'summary' && value.metadata) {
                    value.content = gkClientInterface.getSummaryText(value.metadata.count, value.metadata.from, value.metadata.to);
                }
                angular.extend(value, extendValue);
                return value;
            },
            setItemError: function (msg, errorMsg) {
                msg.error = 1;
                msg.errorMsg = errorMsg;
            },
            add: function (msgList, newMsg, head) {
                head = angular.isDefined(head) ? head : false;
                newMsg = this.formatItem(newMsg);
                if (!msgList) {
                    msgList = [];
                }
                head ? msgList.unshift(newMsg) : msgList.push(newMsg);
                if (newMsg.type == 'file' && !newMsg.metadata.hash) {
                    this.pendingMsg.push(newMsg);
                }
                return newMsg;
            }
        };
        return chatContent;
    }])
    .factory('chatSession', ['$q','GKApi',function ($q,GKApi) {
        var defaultApps = [
            {
                id: -1,
                name: '话题',
                icon: 'images/icon/topic16x16.png'
            },
            {
                id: 0,
                name: '发送文件',
                icon: 'images/icon/upload16x16.png'
            }
        ];

        var chatSession = {
            getSessionByMountId: function (mountId) {
                var mount = gkClientInterface.getMount({
                    mountid: Number(mountId)
                })
                if(mount.property){
                    mount.property = JSON.parse(mount.property);
                }
                return mount;
            },
            getApps:function(orgId){
                var deferred = $q.defer();
                GKApi.apps(orgId).success(function (data) {
                    var apps;
                    if (!data || !data.apps || !data.apps.length) {
                        apps = [];
                    }else{
                        apps = data.apps;
                    }
                    apps = defaultApps.concat(apps);
                    deferred.resolve(apps);
                }).error(function(req){
                    deferred.reject(req);
                });
                return deferred.promise;
            }
        };
        return chatSession;
    }])
    .factory('chatTopic', ['localStorageService',function (localStorageService) {
        var prefix = 'chat_topic_';
        var chatTopic = {
            get: function (orgId) {
                var re = localStorageService.get(prefix+orgId);
                if(!re){
                    return [];
                }
                return re;
            },
            add:function(orgId,val){
                if(!val) return;
                var oldVal = this.get(orgId);
                var time = new Date().getTime();
                if(!oldVal){
                    oldVal = [];
                }
                var index = -1;
                angular.forEach(oldVal,function(item,key){
                    if(item.value == val){
                        index = key;
                        return false;
                    }
                });
                if(index>=0){
                    oldVal[index].dateline = time;
                }else{
                    oldVal.push({
                        value:val,
                        dateline:time
                    });
                    if(oldVal.length>5){
                        oldVal.shift();
                    }
                }
                localStorageService.add(prefix+orgId, JSON.stringify(oldVal));
                return oldVal;
            }
        };
        return chatTopic;
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

    .directive('chatFile', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/chat_file.html"
        }
    }])
    .directive('chatText', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/chat_text.html"
        }
    }])
    .directive('chatSummary', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/chat_summary.html"
        }
    }])
    .directive('chatExt', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/chat_ext.html"
        }
    }])
    .directive('chatAudio', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/chat_audio.html"
        }
    }])

