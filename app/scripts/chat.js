'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkChat');
angular.module('gkChat', ['GKCommon','ui.bootstrap','LocalStorageModule'])
    .run(['$rootScope', function ($rootScope) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            file: null,
            partition:'teamfile'
        }
    }])
    .controller('initChat', ['$scope', 'chatSession', '$location', '$timeout', 'chatContent', '$rootScope', 'chatService', 'GKException', 'chatMember','$window','$interval','GKApi','localStorageService',function ($scope, chatSession, $location, $timeout, chatContent, $rootScope, chatService, GKException, chatMember,$window,$interval,GKApi,localStorageService) {
        var maxCount = 20,
            maxMsgTime = 0,
            minMsgTime = 0,
            topWindow = window.top,
            pendingMsg = [],
            pendingTimer,
            postedMsg = [];
        $scope.view = 'chat';
        $scope.currentMsgList = [];
        $scope.currentSession = null;

        var post = function(type,content,metadata,status){
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
            chatService.add(type,$scope.currentSession.orgid, content, metadata,now,status).then(function(){
                postedMsg.push(now);
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
            if(postText.length>800){
                alert('一次发送的消息字数不能超过800字，请分条发送');
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
            if(postText.length>800){
                alert('一次发送的消息字数不能超过800字，请分条发送');
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
        $scope.openFile = function ($event,msg) {
            var metadata = msg.metadata;
            var mountId = Number($scope.currentSession.mountid);
            var file;
            if(!metadata.hash){
                if(metadata.fullpath){
                    file = gkClientInterface.getFileInfo({
                        mountid: Number(metadata.mount_id),
                        webpath: metadata.fullpath
                    });
                }
            }else{
                file = gkClientInterface.getFileInfo({
                    mountid: Number(metadata.mount_id),
                    uuidhash: metadata.hash
                });
            }
            if(jQuery.isEmptyObject(file)){
                file = null;
            }
            if(metadata.dir==1){
                if(!file) return;
                var fullpath = file.path;
                topWindow.gkFrameCallback('OpenMountPath',{
                    mountid:mountId,
                    webpath:fullpath+'/'
                })
            }else{
                var permissions = [];
                if($scope.currentSession.property){
                    var properties = JSON.parse($scope.currentSession.property);
                    permissions = properties.permissions? properties.permissions:[];
                }
                if(permissions.indexOf('file_read')<0 && file){
                    alert('你没有权限查看改文件');
                    return;
                }
                var params = {
                    mountid: mountId,
                    filehash:metadata.filehash,
                    uuidhash:metadata.hash
                };
                if(!file){
                    if(metadata.fullpath){
                        params.webpath = metadata.fullpath;
                    }else{
                        params.webpath = metadata.filename;
                        params.mountid = metadata.mount_id;
                    }
                }else{
                    params.webpath = file.path;
                }
                gkClientInterface.open(params);
            }
            $event.stopPropagation();
        };

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
            chatContent.pendingMsg = [];
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
                    }else{
                        var defaultMsgCache= localStorageService.get('defaultMsgCache');;
                        if(!defaultMsgCache || defaultMsgCache==$scope.currentSession.orgid){
                            msgList = chatContent.getDefaultMsg();
                            localStorageService.add('defaultMsgCache',$scope.currentSession.orgid);
                        }
                    }
                    $scope.currentMsgList = msgList;
                //文件
                //console.log('fullpath',param);
                if (param.fullpath) {
                    extendParam.file = gkClientInterface.getFileInfo({
                        mountid: mountId,
                        webpath: param.fullpath
                    });
                    if(!extendParam.file || jQuery.isEmptyObject(extendParam.file)){
                       alert('文件已被删除');
                       return;
                    }
                    var metadata = JSON.stringify({
                        mount_id: mountId,
                        dir:extendParam.file.dir,
                        hash:  extendParam.file.uuidhash,
                        filehash: extendParam.file.filehash,
                        filesize: extendParam.file.filesize,
                        version: extendParam.file.version,
                        fullpath:extendParam.file.path
                    });
                    post('file','',metadata,extendParam.file.status==1?1:0);
                }

                    $scope.scrollToIndex = $scope.currentMsgList.length-1;
                    //topWindow.gkFrameCallback('clearMsgTimeclearMsgTime',{orgId:$scope.currentSession.orgid});
                });
            $timeout(function(){
                $scope.focusTextarea = true;
            })
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
            //console.log('newLocation',newLocation == oldLocation);
            if(newLocation == oldLocation){
                return;
            }
            setList();
        })

        setList();

        $scope.saveLastText = function(postText){
        };

        $scope.$on('UpdateMembers',function($event,param){
            if($scope.currentSession.mountid == param.mountid){
                chatMember.refreshMembers($scope.currentSession.orgid);
                $scope.remindMembers = chatMember.getMembers($scope.currentSession.orgid);
            }
        })

        var dragFiles;
        $scope.$on('selectAddDirSuccess',function($event,param){
            var selectedPath = param.selectedPath;
            var params = {
                parent: selectedPath,
                type: 'save',
                list: dragFiles.list,
                mountid: $scope.currentSession.mountid
           };

           gkClientInterface.addFile(params,function(re){
                if(!re.error){
                    var list = re.list;
                    if(!list || !list.length) return;
                    angular.forEach(list,function(file){
                        GKApi.dragUpload($scope.currentSession.mountid,file.path);
                        var metadata = JSON.stringify({
                            mount_id: $scope.currentSession.mountid,
                            hash:  file.uuidhash||'',
                            dir:file.dir,
                            filehash: file.filehash||'',
                            filesize: file.filesize||0,
                            version: file.version||0,
                            fullpath:file.path
                        });
                        post('file','',metadata,file.status==1?1:0);
                    })
                }else{

                }
           })
       })

        $scope.handleChatDrop = function($event){
             dragFiles = gkClientInterface.getDragFiles();
            topWindow.gkFrameCallback('showSelectFileDialog',{
                mountId:$scope.currentSession.mountid
            })
        };
        var lastOffset = 0;
        pendingTimer = $interval(function(){
            if(!chatContent.pendingMsg.length){
                return;
            }
            angular.forEach(chatContent.pendingMsg,function(item,key){
                var metadata = item.metadata;
                var info = gkClientInterface.getTransInfo({
                    mountid: metadata.mount_id,
                    webpath: metadata.fullpath
                });
                //上传完成
                if (info.status == 1) {
                    lastOffset = 0;
                    item.file = gkClientInterface.getFileInfo({
                        mountid: metadata.mount_id,
                        webpath: metadata.fullpath
                    });
                    item.file.status=3;
                    chatContent.pendingMsg.splice(key,1);
                    return;
                }else{
                    var offset = Number(info.offset || 0);
                    if(offset<=lastOffset){
                        return;
                    }
                    lastOffset = item.offset = offset;
                }
            })
        },1000)

    }])
    .factory('chatContent', ['chatMember', 'chatSession','$q','$rootScope', function (chatMember, chatSession,$q,$rootScope) {
        var chatContent = {
            getDefaultMsg:function(){
                var msg = [
                    {
                        content: '亲爱的用户，你好！欢迎使用够快云库。我和我的同事在这里向你介绍一下如何在讨论中快速引用文件。',
                        receiver: 0,
                        sender_name: '够快产品经理',
                        sender:'够快产品经理',
                        time: new Date().getTime(),
                        type: 'file',
                        metadata:JSON.stringify({
                            mount_id: 3655,
                            dir:0,
                            filehash: '4956ba1ddec299adc6ae5158634c7d5cc1687655',
                            fullpath:'轻轻一拖，即刻发送.jpg'
                        })
                    },
                    {
                        content: '你可以直接将桌面的文件直接拖动到聊天窗口',
                        receiver: 0,
                        sender_name: '够快产品经理',
                        sender:'够快产品经理',
                        time: new Date().getTime(),
                        type: 'text',
                        metadata:''
                    },
                    {
                        content: '很方便是不是，现在让我们的技术总监向你介绍下另外一种实现方法吧。',
                        receiver: 0,
                        sender_name: '够快产品经理',
                        sender:'够快产品经理',
                        time: new Date().getTime(),
                        type: 'text',
                        metadata:''
                    },
                    {
                        content: 'OK，另外一种其实也很简单，只需在文件列表页对选中的文件发起讨论就可以了。',
                        receiver: 0,
                        sender_name: '够快技术总监',
                        sender:'够快技术总监',
                        time: new Date().getTime(),
                        type: 'file',
                        metadata:JSON.stringify({
                            mount_id: 3655,
                            dir:0,
                            filehash: 'ab498105782fc60a12ad48f7523e37a805869f32',
                            fullpath:'一键点击，方便讨论.jpg'
                        })
                    },
                    {
                        content: '恩，这就是两种在讨论中引用文件的方式，现在你也可以和你的小伙伴一起沟通协作了。',
                        receiver: 0,
                        sender_name: '够快产品经理',
                        sender:'够快产品经理',
                        time: new Date().getTime(),
                        type: 'text',
                        metadata:''
                    },
                    {
                        content: '这次就说到这啦，Bye。',
                        receiver: 0,
                        sender_name: '够快产品经理',
                        sender:'够快产品经理',
                        time: new Date().getTime(),
                        type: 'text',
                        metadata:''
                    }
                ];
                return msg.map(this.formatItem);
            },
            pendingMsg:[],
            formatItem: function (value) {
                var sender = chatMember.getMemberItem(value.receiver, value.sender);
                var extendValue = {
                    sender_name: value.sender_name?value.sender_name:sender ? sender['member_name'] : value.sender,
                    is_vip: sender && sender.isvip ? true : false
                };

                if (value.metadata) {
                    value.metadata = JSON.parse(value.metadata);
                    if(value.metadata.mount_id){
                        if(value.metadata.fullpath){
                            value.metadata.filename = Util.String.baseName(value.metadata.fullpath);
                            value.metadata.ext = Util.String.getExt(value.metadata.filename);
                        }
                        var file;
                        if(!value.metadata.hash){
                            if(value.metadata.fullpath){
                                file = gkClientInterface.getFileInfo({
                                    mountid: Number(value.metadata.mount_id),
                                    webpath: value.metadata.fullpath
                                });
                            }
                        }else{
                            file = gkClientInterface.getFileInfo({
                                mountid: Number(value.metadata.mount_id),
                                uuidhash: value.metadata.hash
                            });
                        }
                        if(file && !jQuery.isEmptyObject(file)){
                            file.mount_id = Number(value.metadata.mount_id);
                            extendValue.file = file;
                        }
                    }
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
                if(newMsg.type =='file' && !newMsg.metadata.hash){
                    this.pendingMsg.push(newMsg);
                }
                return newMsg;
            }
        };
        return chatContent;
    }])
    .factory('chatSession', ['GKMount','$filter', function (GKMount,$filter) {
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
            add: function (type,orgId, content, metadata,time,status) {
                var deferred = $q.defer();
                metadata = angular.isDefined(metadata) ? metadata : '';
                status = angular.isDefined(status)?status:0;
                gkClientInterface.postChatMessage({
                    'content': content,
                    'receiver': String(orgId),
                    'metadata': metadata,
                    'type': type,
                    'time':time,
                    status:status
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
                gkClientInterface.getChatMessage({
                    'receiver':String(orgId),
                    'dateline':dateline,
                    'count':size,
                    'before':1
                },function(re){
                    if(!re.error){
                        deferred.resolve(re);
                    }else{
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            list: function (orgId,lastTime,count) {
                var deferred = $q.defer();
                gkClientInterface.getChatMessage({
                    'receiver':String(orgId),
                    'dateline':lastTime,
                    'count':count,
                    'before':0
                },function(re){
                    if(!re.error){
                        deferred.resolve(re);
                    }else{
                        deferred.reject(re);
                    }
                });
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

