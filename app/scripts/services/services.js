'use strict';

/* Services */
//全局AJAX请求默认返回的数据格式
jQuery.ajaxSetup({
    dataType: 'json',
    timeout: 30000
});

angular.module('gkClientIndex.services', [])
    .value('GKConstant', {
        guideKey: 'gk_guide_hide'
    })
    .value('uiSelectableConfig', {
        filter: '.file_item',
        //tolerance:'fit',
        distance: 10
    })
    .value('smartSearchConfig',{
        name: 'partition',
        text: '所有云库'
    })
    .factory('GKSope', [function () {
        return {
            rightSidebar:null
        };
    }])
    .factory('GKBrowserMode', ['$rootScope','localStorageService',function ($rootScope,localStorageService) {
        var key = 'gk_browser_mode';
        var GKBrowserMode = {
            getMode:function(){
                var re =  localStorageService.get(key);
                if(['chat','file'].indexOf(re)<0){
                    return 'file';
                }
                return re;
            },
            setMode:function(mode){
                $rootScope.PAGE_CONFIG.browserMode = mode;
                localStorageService.add(key, mode);
            }
        };
        return GKBrowserMode;
    }])
    .factory('GKSync', [function (GKPartition, GKModal, GKOpt) {
        return {
            getSyncByMountIdFullpath: function (mountId, fullpath) {
                var syncedFiles = gkClientInterface.getLinkPath()['list'] || [];
                var syncItem = null;
                angular.forEach(syncedFiles, function (value) {
                    if (value.mountid == mountId && value.webpath == fullpath) {
                        syncItem = value;
                        return false;
                    }
                })
                return syncItem;
            }
        };
    }])
    .factory('GKEnt', [function () {
        var GKEnt = {
            getEnt: function (entId) {
               if(!entId){
                   return {
                       entid:0,
                       entname:'我的云库'
                   };
               }else{
                   return gkClientInterface.getEnt({
                       entid:entId
                   });
               }
            }
        };
        return GKEnt;
    }])
    .factory('GKSideTree', ['GKFile', 'GKPartition','GKEnt', function (GKFile, GKPartition,GKEnt) {
        return {
            getTreeList:function(mounts){
                var treeList = {};
                angular.forEach(mounts,function(mount){
                    if(mount.ent_id){
                        var entId = mount.ent_id,
                            partition = GKPartition.getPartitionByMountType(mount.member_type,mount.ent_id),
                            treeItem = GKFile.dealTreeItem(mount, mount.mount_id);
                        var ent = GKEnt.getEnt(entId);
                        if(ent && ent.entname){
                            var showHeaderBtn = false;
                            if(ent.property){
                                ent.property = JSON.parse(ent.property);
                                showHeaderBtn = (ent.property.ent_admin==1);
                            }
                            if(!treeList[entId]){
                                treeList[entId] = {
                                    guider:!entId?'lib':'',
                                    header:ent.entname,
                                    data:[treeItem],
                                    entId:ent.entid,
                                    showHeaderBtn:showHeaderBtn
                                };
                            }else{
                                treeList[entId].data.push(treeItem);
                            }
                        }
                    }
                });
                return treeList;
            },
            getNode: function (list, mountId, fullpath) {
                var node = null;
                angular.forEach(list, function (value, key) {
                    if (!value.data.filter && value.data.mount_id == mountId && value.data.fullpath === fullpath) {
                        node = [key, value];
                        return false;
                    }
                })
                return node;
            },
            findNode: function (list, mountId, fullpath) {
                var context = this;
                var fullpathArr = fullpath.split('/');
                fullpathArr.unshift('');
                var node = null;
                var children = list;
                angular.forEach(fullpathArr, function (path, key) {
                    var checkPath = '';
                    for (var i = 0; i <= key; i++) {
                        checkPath += fullpathArr[i] + '/';
                    }
                    checkPath = Util.String.ltrim(Util.String.rtrim(checkPath, '/'), '/');
                    var cNode = context.getNode(children, mountId, checkPath);
                    var parentNode = null;
                    if (cNode && cNode.length) {
                        parentNode = context.getNode(children, mountId, checkPath)[1];
                    }
                    if (!parentNode) {
                        return false;
                    } else {
                        if (checkPath === fullpath) {
                            node = parentNode;
                            return false;
                        } else {
                            children = parentNode['children'];
                        }
                    }
                })
                return node;
            },
            removeNode: function (list, mountId, fullpath) {
                var context = this;
                var fullpathArr = fullpath.split('/');
                fullpathArr.unshift('');
                var children = list;
                angular.forEach(fullpathArr, function (path, key) {
                    var checkPath = '';
                    for (var i = 0; i <= key; i++) {
                        checkPath += fullpathArr[i] + '/';
                    }
                    checkPath = Util.String.ltrim(Util.String.rtrim(checkPath, '/'), '/');
                    var parent = context.getNode(children, mountId, checkPath);
                    if (!parent) {
                        return false;
                    } else {
                        if (checkPath === fullpath) {
                            children.splice(parent[0], 1);
                            return false;
                        } else {
                            children = parent[1]['children'];
                        }
                    }
                })
            },
            editNode: function (list, mountId, fullpath, param) {
                var node = this.findNode(list, mountId, fullpath);
                if (node) {
                    angular.extend(node, param);
                }
                return node;
            },
            findSmartNode: function (list, condition) {
                var node = null;
                angular.forEach(list, function (value) {
                    if (value.data.type == condition) {
                        node = value;
                        return false;
                    }
                });
                return node;
            },
            editSmartNode: function (list, condition, name) {
                var node = this.findSmartNode(list, condition);
                if (node) {
                    node.label = node.data.name = name;
                }

            },
            removeSmartNode: function (list, condition) {
                angular.forEach(list, function (value, key) {
                    if (value.data.type == condition) {
                        list.splice(key, 1);
                        return false;
                    }
                });
            },
            addSmartNode: function (list, node) {
                var exist = this.findSmartNode(list, node.type);
                if (exist) {
                    this.editSmartNode(list, node.type, node.name);
                } else {
                    var formatNode = GKFile.dealTreeData([node])[0]
                    list.push(formatNode);
                }
            },

        };
    }])
    .factory('GKOpen', [function ($q) {
        return {
            manage: function (orgId) {
                var url = gkClientInterface.getUrl({
                    url: '/manage?org_id=' + orgId,
                    sso: 1
                });
                gkClientInterface.openUrl(url);
            },
            move: function () {

            }
        };
    }])
    .factory('GKContextMenu', ['GKPartition', 'GKModal', 'GKOpt', 'GKFile', 'GKMount', 'GKSmartFolder','GKPath', '$rootScope','GKAuth',function (GKPartition, GKModal, GKOpt, GKFile, GKMount, GKSmartFolder,GKPath,$rootScope,GKAuth) {
        return {
            getSidebarMenu: function ($trigger) {
                var data = $trigger.data('branch');
                var partition = data.partition,
                    fullpath = data.fullpath,
                    mountId = data.mount_id,
                    orgId = data.org_id,
                    items;
                var mount = null;
                if (mountId) {
                    mount = GKMount.getMountById(mountId);
                }
                if (GKPartition.isTeamFilePartition(partition) || GKPartition.isEntFilePartition(partition)) {
                    if (data.filter == 'trash') {
                        if(GKAuth.check(mount,'','file_delete_com')){
                            items = {
                                'clear_trash': {
                                    name: '清空回收站',
                                    callback: function () {
                                        GKOpt.clearTrash(mountId);
                                    }
                                }
                            }
                        }
                    } else {
                        items = {};
                        if (!fullpath) {
                            angular.extend(items, {
                                'view_dashboard': {
                                    name: '资料',
                                    callback: function () {
                                        GKModal.teamOverview(orgId);
                                    }
                                },
                                'view_card': {
                                    name: '名片',
                                    callback: function () {
                                        GKModal.teamCard(orgId);
                                    }
                                }
                            });
                            if(GKAuth.check(mount,'','org_member')){
                                angular.extend(items, {
                                    'view_member': {
                                        name: '成员',
                                        callback: function () {
                                            GKModal.teamMember(data.org_id);
                                        }
                                    }
                                });
                            }
//                            if (GKAuth.check(mount,'','ent_org')) {
//                                angular.extend(items, {
//                                    'manage': {
//                                        name: '安全设置',
//                                        callback: function () {
//                                            GKModal.teamManage(data.org_id);
//                                        }
//                                    }
//                                })
//                            }
                            if(GKAuth.check(mount,'','file_recycle')){
                                angular.extend(items, {
                                    'trash': {
                                        name: '回收站',
                                        callback: function () {
                                            $rootScope.$apply(function(){
                                                GKPath.gotoFile(mountId, '','','','trash');
                                            })
                                        }
                                    }
                                })
                            }

                            if (GKAuth.check(mount,'','org_upgrade')) {
                                angular.extend(items, {
                                    'team_upgrade': {
                                        name: '升级',
                                        callback: function () {
                                            var url = gkClientInterface.getUrl({
                                                sso: 1,
                                                url: '/pay/order?org_id=' + orgId
                                            })
                                            gkClientInterface.openUrl(url);
                                        }
                                    }
                                })
                            }
                        } else {
                            angular.extend(items, {
                                'view_property': {
                                    name: '属性',
                                    callback: function () {
                                        var parentFile = {
                                            mount_id: mountId,
                                            fullpath: ''
                                        }
                                        var upPath = Util.String.dirName(fullpath);
                                        if (upPath) {
                                            parentFile = GKFile.getFileInfo(mountId, upPath);
                                        }
                                        GKModal.filePropery(mountId, data, parentFile);
                                    }
                                },
                                'del': {
                                    name: '删除',
                                    callback: function () {
                                        GKOpt.del(mountId, [fullpath]);
                                    }
                                }
                            });
                        }

                    }

                } else if (GKPartition.isSubscribePartition(data.partition)) {
                    if(!data.fullpath){
                        items = {
                            'view_dashboard': {
                                name: '资料',
                                callback: function () {
                                    GKModal.teamOverview(orgId);
                                }
                            },
                            'view_card': {
                                name: '名片',
                                callback: function () {
                                    GKModal.teamCard(orgId);
                                }
                            },
                            'unsubscribe': {
                                name: '取消订阅',
                                callback: function () {
                                    GKOpt.unsubscribe(orgId);
                                }
                            }
                        };
                    }else{
                        items = {
                            'view_property': {
                                name: '属性',
                                callback: function () {
                                    var parentFile = {
                                        mount_id: mountId,
                                        fullpath: ''
                                    }
                                    var upPath = Util.String.dirName(fullpath);
                                    if (upPath) {
                                        parentFile = GKFile.getFileInfo(mountId, upPath);
                                    }
                                    GKModal.filePropery(mountId, data, parentFile);
                                }
                            }
                        }
                    }

                } else if (GKPartition.isSmartFolderPartition(data.partition) && data.type > 0 ) {
                    items = {
                        'rename': {
                            name: '修改名称',
                            callback: function () {
                                var label = $trigger.find('.tree-label');
                                label.hide();
                                var input = $('<input class="form-control" name="new_name" />');
                                input.css({
                                    'width': $trigger.width() - 50,
                                    'display': 'inline-block',
                                    'height': '28px',
                                    'line-height': '18px',
                                    'padding': '0 5px',
                                    'vertical-align': 'top'
                                })
                                var oldName = jQuery.trim(label.text());
                                input.val(oldName).insertAfter(label).focus();
                                input.on('blur', function () {
                                    var newName = jQuery.trim(jQuery(this).val());
                                    if (!GKSmartFolder.checkFolderName(newName)) {
                                        return;
                                    }
                                    if (newName === oldName) {
                                        input.remove();
                                        label.show();
                                        return;
                                    }
                                    GKOpt.renameSmartFolder(data.type, newName).then(function () {
                                        input.remove();
                                        label.show();
                                    });
                                })

                                input.bind('keydown', function (event) {
                                    if (event.keyCode == 13) {
                                        input.trigger('blur');
                                        event.preventDefault();
                                    }
                                });

                                input.on('click', function (e) {
                                    e.stopPropagation();
                                })
                            }
                        }
                    };
                }

                return items;
            }
        };
    }])
    .factory('GKFileOpt', ['$q', 'GK', function ($q, GK) {
        var GKFileOpt = {};
        return {
            copy: function (toFullpath, toMountId, fromFullpathes, fromMountId) {
                if (!angular.isArray(fromFullpathes)) {
                    fromFullpathes = [fromFullpathes];
                }
                var params = {
                    target: toFullpath,
                    targetmountid: toMountId,
                    frommountid: fromMountId,
                    fromlist: fromFullpathes
                };
                var deferred = $q.defer();
                GK.copy(params).then(function () {
                    deferred.resolve();
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            },
            move: function (toFullpath, toMountId, fromFullpathes, fromMountId) {
                if (!angular.isArray(fromFullpathes)) {
                    fromFullpathes = [fromFullpathes];
                }
                var params = {
                    target: toFullpath,
                    targetmountid: toMountId,
                    frommountid: fromMountId,
                    fromlist: fromFullpathes
                };
                var deferred = $q.defer();
                GK.move(params).then(function () {
                    deferred.resolve();
                }, function (error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            }
        };
    }])
    .factory('GKModal', ['$rootScope', '$modal','gkWindow', 'GKChat','GK', 'GKMount', 'GKPartition', '$location', '$timeout', 'GKException', 'GKDialog', 'GKPath', 'GKSync', 'GKFile', 'GKApi','GKSmartFolder','GKMode','localStorageService','smartSearchConfig',function ($rootScope, $modal,gkWindow,GKChat, GK, GKMount, GKPartition, $location, $timeout, GKException, GKDialog, GKPath, GKSync, GKFile,GKApi,GKSmartFolder,GKMode,localStorageService,smartSearchConfig) {
        var defaultOption = {
            backdrop: 'static'
        };
        var getOrgName = function(orgId){
            var orgName = '';
            var mount = GKMount.getMountByOrgId(orgId);
            if(mount){
                orgName = '（'+mount.name+'）';
            }
            return orgName;
        };

        return{
            editSmartFolder:function(smartObj){
                var option = {
                    templateUrl: 'views/editsmartfolder_dialog.html',
                    windowClass: 'edit_smartfolder',
                    controller: function ($scope, gkWindowInstance) {
                        $scope.smart = smartObj;
                        $scope.saveSmart = function(){
                            var newName = $scope.smart.newName;
                            if (!GKSmartFolder.checkFolderName(newName)) {
                                return;
                            }
                            if (newName === $scope.smart.name) {
                                return;
                            }
                            GKSmartFolder.renameSmartFolder($scope.smart.type, newName).then(function () {
                                $scope.smart.name = newName;
                                gkWindowInstance.dismiss('cancel');
                            });
                        }
                        $scope.cancel = function () {
                            gkWindowInstance.dismiss('cancel');
                        };
                    }
                }
                option = angular.extend({}, defaultOption, option);
                return gkWindow.open(option);
            },
            smartDesktop:function(param){
                var option = {
                    templateUrl:'views/smart_desktop_dialog.html',
                    windowClass:'gk_window smart_desktop_content',
                    controller:function($scope,gkWindowInstance){
                        var unreadMsgKey = $rootScope.PAGE_CONFIG.user.member_id+'_unreadmsg';
                        $scope.searchKeyword = "";
                        $scope.smartFolders = GKSmartFolder.getFolders()||[];
                        angular.forEach($scope.smartFolders,function(value){
                            value.active = false;
                            value.edit = false;
                            value.newName = value.name;
                        });

                        $scope.lastVisitFolder = $scope.smartFolders[0] || {};
                        $scope.lastModifyFolder = $scope.smartFolders[1] || {};
                        $scope.smartFolders = $scope.smartFolders.slice(2);
                        $scope.newMsg = !!localStorageService.get(unreadMsgKey);
                        $scope.searchFile = function(searchKeyword){
                            if (!searchKeyword || !searchKeyword.length) {
                                return;
                            }
                            if(searchKeyword.indexOf('|')>=0){
                                alert('搜索关键字中不能包含 | ');
                                return;
                            }
                            var extendParam = {
                                search:[searchKeyword,smartSearchConfig.name].join('|')
                            };
                            var search = $location.search();
                            $location.search(angular.extend(search, extendParam));
                            gkWindowInstance.dismiss('cancel');
                        }

                        $scope.editItem = function($event,index){
                            $scope.smartFolders[index].edit = true;
                            $event.stopPropagation();
                        }
                        $scope.clickItem = function(item,$index){
                            var mode = 'file';
                            var partition =  item.partition;
                            var pararm = {
                                partition: partition
                            };
                            pararm['filter'] = item.filter;
                            GKMode.setMode(mode);
                            $timeout(function(){
                                $location.search(pararm);
                                gkWindowInstance.dismiss('cancel');
                            })
                            event.stopPropagation();
                        }


                        $scope.saveItemEdit = function($event,index){


                        }

                        $scope.closeItemEdit = function($event,index){
                            $scope.smartFolders[index].edit = false;
                        }
                        $scope.openNews = function(){
                            $rootScope.$broadcast("openNews");
                            gkWindowInstance.dismiss('cancel');
                        }

                        $scope.personalOpen = function(){
                            $rootScope.$broadcast("personalOpen");
                            gkWindowInstance.dismiss('cancel');
                        }


                        $scope.cancel = function () {
                            gkWindowInstance.dismiss('cancel');
                        };
                    }
                }
                option = angular.extend({}, defaultOption, option);
                return gkWindow.open(option);
            },
            summaryDetail:function(param){
                var option = {
                    templateUrl: 'views/summary_dialog.html',
                    windowClass: 'chat_file_update_dialog',
                    controller: function ($scope,$modalInstance) {
                        var perPageItemNum = 11;
                        $scope.loadSummarySuccess = false;
                        $scope.summarys = [];
                        $scope.ableScroll = true;
                        $scope.showMoreLoading = false;
                        //在加载数据未完成前不允许再次滚动到底部加载
                        $scope.isLoading = false;
                        param.size = perPageItemNum;
                        GKChat.getSummarys(param).then(function(data){
                            if(data && data.updates){
                               if(data.updates.length < perPageItemNum) $scope.ableScroll = false;
                               else data.updates.splice(data.updates.length - 1,1);
                               formatData(data.updates,$scope.summarys);
                            }
                            $scope.loadSummarySuccess = true;
                        });
                        //滚动加载
                        $scope.handleScrollLoad = function(){
                            if(!$scope.isLoading) {
                                $scope.isLoading = true;
                                param.start = $scope.summarys.length;
                                $scope.showMoreLoading = true;
                                GKChat.getSummarys(param).then(function (data) {
                                    if (data && data.updates) {
                                        if (data.updates.length < perPageItemNum) $scope.ableScroll = false;
                                        else data.updates.splice(data.updates.length - 1, 1);
                                        formatData(data.updates, $scope.summarys);
                                    }
                                    $scope.showMoreLoading = false;
                                    $scope.isLoading = false;
                                });
                            }
                        }
                        //打开文件位置
                        $scope.goToFile = function ($event, summary) {
                           var file = gkClientInterface.getFileInfo({
                                mountid: Number(summary.mount_id),
                                uuidhash: summary.hash
                            });
                            if(!file || !file.path){
                              alert("定位失败，文件已删除！");
                              return;
                            }
                            var fullpath = file.path;
                            window.top.gkFrameCallback('OpenMountPath', {
                                mountid: param.mountId,
                                webpath: fullpath
                            });
                            $modalInstance.dismiss('cancel');
                            $event.stopPropagation();
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                        var formatData = function(listValue,arrObj){
                            angular.forEach(listValue,function(value){
                                var file_fullpath = value.fullpath;
                                var fileName = file_fullpath;
                                var index = file_fullpath.lastIndexOf("/");
                                if(index != -1){
                                    fileName = file_fullpath.substring(index+1);
                                }
                                value.fileName = fileName;
                                if(arrObj){
                                    arrObj.push(value);
                                }
                            });
                            return listValue;
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            selectFile:function(mountId,title){
                var option = {
                    templateUrl: 'views/select_file_dialog.html',
                    windowClass: 'select_file_dialog',
                    controller: function ($scope,$modalInstance) {
                        var mount = GKMount.getMountById(mountId);
                        if(!mount) return;
                        $scope.title = title;
                        $scope.fileData = [{
                            label:mount.name,
                            nodeImg : mount.logo,
                            hasChildren:true,
                            isParent: true,
                            data:{
                                mount_id:mountId,
                                fullpath:'',
                                partition:GKPartition.teamFile
                            }
                        }];
                        $scope.initSelectedBranch = $scope.fileData[0];
                        GKFile.getChildNode({
                            data:{
                                mount_id:mountId,
                                fullpath:'',
                                partition:GKPartition.teamFile
                            }
                        }).then(function(data){
                                $scope.fileData[0].expanded = true;
                                $scope.fileData[0].children = data;
                            });

                        $scope.handleExpand = function (branch) {
                            if (branch.expanded) {
                                GKFile.getChildNode(branch).then(function (children) {
                                    branch.children = children;
                                });
                            }
                        };

                        var selectedFile = $scope.fileData[0];
                        $scope.handleSelect = function (branch) {
                            selectedFile = branch;
                        };

                        $scope.ok = function(){
                            if(!selectedFile) return;
                            $modalInstance.close({
                                selectedPath:selectedFile.data.fullpath
                            });
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            choseDrag: function (msg) {
                var option = {
                    templateUrl: 'views/chose_drag_dialog.html',
                    windowClass: 'chose_drag_dialog',
                    controller: function ($scope,$modalInstance) {
                        $scope.msg = msg;
                        $scope.copy = function(){
                            $modalInstance.close('copy');
                        };

                        $scope.move = function(){
                            $modalInstance.close('move');
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);

            },
            publish: function (mountId, file) {
                var option = {
                    templateUrl: 'views/publish_dialog.html',
                    windowClass: 'modal_frame publish_dialog',
                    controller: function ($scope,$modalInstance,src) {
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/mount/file_link_publish?mount_id='+mountId+'&fullpath='+file.fullpath
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);

            },
            setMilestone:function(mountId,file,oldMessage){
                var option = {
                    templateUrl: 'views/set_milestone_dialog.html',
                    windowClass: 'set_milestone_dialog',
                    controller: function ($scope,$modalInstance) {
                        $scope.file = file;
                        $scope.message = '';
                        $scope.isSendToChat = true;
                        $scope.markMilestone = function(message,isSendToChat){
                            GKApi.markMilestone(mountId,file.fullpath,message,isSendToChat?1:0)
                                .success(function(){
                                    $modalInstance.close();
                                })

                                .error(function(reqest){
                                    GKException.handleAjaxException(reqest);
                                })
                        };
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            openNew: function (url,title) {
                var context = this;
                var option = {
                    templateUrl: 'views/new_unname_dialog.html',
                    windowClass: 'modal_frame new_unname_dialog',
                    controller: function ($scope, $modalInstance, src,title) {
                        $scope.url = src;
                        $scope.title = title;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.$on('closeModal', function () {
                            $modalInstance.dismiss('cancel');
                        })
                    },
                    resolve: {
                        src: function () {
                            return url;
                        },
                        title:function(){
                            return title;
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            teamCard: function (orgId,memberId) {
                memberId = angular.isDefined(memberId)?memberId:0;
                var context = this;
                var option = {
                    templateUrl: 'views/team_card_dialog.html',
                    windowClass: 'modal_frame team_card_dialog',
                    controller: function ($scope, $modalInstance, src) {
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                        $scope.orgName = getOrgName(orgId);
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/manage/info?org_id=' + orgId+'&member_id='+memberId
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            teamOverview: function (orgId) {
                var context = this;
                var option = {
                    templateUrl: 'views/team_overview_dialog.html',
                    windowClass: 'modal_frame team_overview_dialog',
                    controller: function ($scope, $modalInstance, src) {
                        $scope.url = src;
                        $scope.orgName = getOrgName(orgId);
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.$on('removeTeam', function (event, orgId) {
                            $rootScope.PAGE_CONFIG.visitHistory.removeHistory("",$rootScope.PAGE_CONFIG.mount.mount_id );
                            gkClientInterface.notice({type: 'removeOrg', 'org_id': Number(orgId)}, function (param) {
                                if (param) {
                                    $rootScope.$broadcast('RemoveOrgObject', {'org_id': orgId});
                                    $modalInstance.close(orgId);
                                }
                            })
                        })

                        $scope.$on('closeModal', function (event,name) {
                            if(!name){
                                $modalInstance.dismiss('cancel');
                            }
                        })
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/manage/overview?org_id=' + orgId
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            filePropery: function (mountId, file) {
                var option = {
                    templateUrl: 'views/file_property_dialog.html',
                    windowClass: 'file_property_dialog',
                    controller: function ($scope, $modalInstance, mountId, file) {
                        $scope.file = file;
                        $scope.mountId = mountId;
                        var parentFile = {};
                        $scope.publishEnable = false;
                        var mount = GKMount.getMountById(mountId);
                        var filePath = $scope.file.fullpath;
                        var index = filePath.lastIndexOf("/");
                        if(-1 != index){
                            parentFile = gkClientInterface.getFileInfo({
                                mountid: Number(mountId),
                                webpath: filePath.substring(0,index)
                            });
                        }else{
                            parentFile = mount;
                        }
                        parentFile.fullpath = angular.isDefined(parentFile.path)?parentFile.path:"";
                        $scope.parentFile = parentFile;
                        if (!$scope.parentFile.fullpath && mount && file.dir == 1 && GKMount.isAdmin(mount)) {
                            $scope.publishEnable = true;
                        }
                        $scope.innerLink = gkClientInterface.getLinkDomain() + '/' + mountId + '/' + encodeURIComponent(file.fullpath);
                        $scope.localUri = '';
                        if ($scope.file.sync == 1 || $scope.parentFile.syncpath) {
                            var syncPath = $scope.parentFile.syncpath || $scope.file.fullpath;
                            var syncItem = GKSync.getSyncByMountIdFullpath(mountId, syncPath);
                            if (syncItem) {
                                var rePath = ($scope.file.fullpath + '/').replace(syncItem.webpath + '/', '');
                                console.log(rePath);
                                var grid = gkClientInterface.isWindowsClient() ? '\\' : '/';
                                console.log(gkClientInterface.isWindowsClient());
                                if (gkClientInterface.isWindowsClient()) {
                                    rePath = rePath.replace(/\//g, "\\");
                                }
                                $scope.localUri = syncItem.fullpath + rePath;
                            }
                        }
                        $scope.setFilePublic = function (open, mountId) {
                            var msg = '你确定要' + (open == 1 ? '公开' : '取消公开') + '该文件夹？';
                            if (!confirm(msg)) {
                                return;
                            }
                            var mountId = file.mount_id || mountId;
                            var param = {
                                mountid: mountId,
                                webpath: file.fullpath,
                                open: open
                            };
                            gkClientInterface.setFilePublic(param, function (re) {
                                $scope.$apply(function () {
                                    if (!re.error) {
                                        $scope.file.open = open;
                                        $rootScope.$broadcast('editFileSuccess', 'set_open', mountId, file.fullpath, {
                                            open: open
                                        })
                                    } else {
                                        GKException.handleClientException(re);
                                    }
                                })
                            })
                        }

                        $scope.handleInputFocus = function ($event) {
                            jQuery($event.target).select();
                        }

                        $scope.copy = function (innerLink) {
                            gkClientInterface.copyToClipboard(innerLink);
                            alert('已复制到剪切板');
                        };

                        $scope.goto = function (localUri) {
                            gkClientInterface.openLocation({
                                mountid: 0,
                                webpath: Util.String.ltrim(Util.String.rtrim(localUri, '\\\\'), '/')
                            });
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                    },
                    resolve: {
                        mountId: function () {
                            return mountId
                        },
                        file: function () {
                            return file;
                         }
//                        ,
//                        parentFile: function () {
//                            return parentFile;
//                        }
                    }
                };

                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);

            },
            sync: function (mountId, fullpath) {
                var option = {
                    templateUrl: 'views/set_sync.html',
                    windowClass: 'sync_settiong_dialog',
                    controller: function ($scope, $modalInstance) {
                        if (!fullpath) {
                            $scope.filename = GKMount.getMountById(mountId)['name'];
                        } else {
                            $scope.filename = Util.String.baseName(fullpath);
                        }
                        $scope.localURI = GK.getLocalSyncURI({
                            mountid: mountId,
                            webpath: fullpath
                        });
                        $scope.reSetLocalPath = function () {
                            gkClientInterface.selectPath({
                                path: $scope.localURI,
                                disable_root: true
                            },function(re){
                                var newPath = re.path;
                                if (newPath) {
                                    $scope.$apply(function(){
                                        $scope.localURI = newPath;
                                    })
                                }
                            });
                        };

                        $scope.ok = function () {
                            var new_local_uri = $scope.localURI;
                            var trimPath = Util.String.rtrim(Util.String.rtrim(new_local_uri, '/'), '\\\\');
                            var currentFilename = $scope.filename;
                            if (!confirm('你确定要将 ' + currentFilename + ' 与 ' + trimPath + ' 进行同步？')) {
                                return;
                            }
                            var params = {};
                            params = {
                                webpath: fullpath,
                                fullpath: new_local_uri,
                                mountid: mountId
                            };
                            gkClientInterface.setLinkPath(params, function () {
                                $scope.$apply(function () {
                                    $rootScope.$broadcast('editFileSuccess', 'sync', mountId, fullpath);
                                    $modalInstance.close();
                                })
                                alert('同步设置成功');
                            });
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };

                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);

            },
            news: function (GKNews, GKApi) {
                var context = this;
                var option = {
                    templateUrl: 'views/news_dialog.html',
                    windowClass: 'news_dialog',
                    controller: function ($scope, $modalInstance, classifyNews) {
                        $rootScope.showNews = true;
                        $rootScope.$broadcast('newsOpen');
                        $scope.cancel = function () {
                            $rootScope.showNews = false;
                            $modalInstance.dismiss('cancel');
                        };

                        var showTimer = $timeout(function () {
                            $scope.showList = true;
                            return null;
                        }, 500);

                        $scope.$on('$destroy', function () {
                            $rootScope.showNews = false;
                            if (showTimer) {
                                $timeout.cancel(showTimer);
                                showTimer = null;
                            }
                        })

                        $scope.classifyNews = classifyNews;
                        $scope.loading = false;
                        var requestDateline = 0;
                        $scope.getMoreNews = function () {
                            $scope.loading = true;
                            GKApi.update(100, requestDateline).success(function (data) {
                                $scope.$apply(function () {
                                    $scope.loading = false;
                                    var renews = data['updates'] || [];
                                    var classifyNews = GKNews.classify(renews);
                                    $scope.classifyNews = GKNews.concatNews($scope.classifyNews, classifyNews);
                                    requestDateline = getLastDateline(renews, requestDateline);
                                });

                            }).error(function () {
                                    $scope.loading = false;
                                })
                        };
                        var updateClassifyNews = function(id,newData){
                            angular.forEach($scope.classifyNews,function(value){
                                angular.forEach(value.list,function(item){
                                    if(item.id == id){
                                        angular.extend(item,newData);
                                        return false;
                                    }
                                })
                            })
                        };

                        $scope.getBtnClasses = function (opt) {
                            var successBtn = ['invite_accept'];
                            var dangerBtn = ['invite_reject'];
                            if (dangerBtn.indexOf(opt.opt) >= 0) {
                                return 'btn-danger';
                            } else if (successBtn.indexOf(opt.opt) >= 0) {
                                return 'btn-success';
                            } else if (opt.type == 'view') {
                                return 'btn-primary';
                            } else if (opt.type == 'url') {
                                if (!opt.btn_class) {
                                    return 'btn-primary';
                                } else {
                                    if (opt.btn_class == 'blue') {
                                        return 'btn-primary';
                                    } else if (opt.btn_class == 'red') {
                                        return 'btn-danger';
                                    } else if (opt.btn_class == 'green') {
                                        return 'btn-success';
                                    } else if (opt.btn_class == 'yellow') {
                                        return 'btn-warning';
                                    } else {
                                        return 'btn-default';
                                    }
                                }
                            } else {
                                return 'btn-primary';
                            }
                        };

                        $scope.handleOpt = function (opt, item) {
                            if (opt.type == 'request') {
                                if (opt.opt == 'invite_accept' || opt.opt == 'invite_reject') {
                                    if (!confirm('你确定要' + opt.name + '该云库的邀请？')) {
                                        return;
                                    }
                                }
                                if(opt.opt == 'apply_accept'){
                                    if (!confirm('你确定要' + opt.name + '该申请？')) {
                                        return;
                                    }
                                }
                                GKApi.updateAct(item.id, opt.opt).success(function (data) {
                                    if (opt.opt == 'invite_accept' && item.property.org_id) {
                                        gkClientInterface.notice({type: 'getOrg', 'org_id': Number(item.property.org_id)}, function (param) {
                                            $scope.$apply(function () {
                                                if (param) {
                                                    var newOrg = param;
                                                    $rootScope.$broadcast('createOrgSuccess', newOrg);
                                                }
                                            });
                                        })
                                    }
                                    $scope.$apply(function () {
                                        item.opts = [];
                                        if (data && data.updates) {
                                            angular.forEach(data.updates,function(newItem){
                                                updateClassifyNews(newItem.id, newItem);
                                                GKNews.updateNews(newItem.id, newItem);
                                            })
                                        }

                                    });

                                }).error(function (request) {
                                        var code = GKException.getAjaxErroCode(request);
                                        if(code==403322){
                                            context.createTeam('加入云库');
                                        }else{
                                            GKException.handleAjaxException(request);
                                        }

                                    });
                            } else if (opt.type == 'url') {
                                var url = gkClientInterface.getUrl({
                                    url: opt.url,
                                    sso: Number(opt.sso)
                                });
                                if (opt.browser == 1) {
                                    gkClientInterface.openUrl(url);
                                } else {
                                    var data = {
                                        url: url,
                                        type: "sole",
                                        width: 794,
                                        resize: 1,
                                        height: 490
                                    }
                                    gkClientInterface.setMain(data);
                                };
                                $modalInstance.close();
                            } else if (opt.type == 'view') {
                                if (opt.opt == 'view_file') {
                                    var fullpath = item.dir == 1 ? item.fullpath : Util.String.dirName(item.fullpath);
                                    var selectPath = item.dir == 1 ? '' : item.fullpath;
                                    GKPath.gotoFile(item.mount_id, fullpath, selectPath);
                                } else if (opt.opt == 'view_org_root') {
                                    if (!item.org_id) {
                                        return;
                                    }
                                    var mount = GKMount.getMountByOrgId(item.org_id);
                                    if (!mount) {
                                        alert('该云库已被删除或你已退出该云库');
                                        return;
                                    }
                                    GKPath.gotoFile(mount.mount_id, '');
                                } else if (opt.opt == 'view_org_member') {
                                    if (!item.org_id) {
                                        return;
                                    }
                                    var mount = GKMount.getMountByOrgId(item.org_id);
                                    if (!mount) {
                                        alert('该云库已被删除或你已退出该云库');
                                        return;
                                    }
                                    context.teamMember(item.org_id);
                                }
                                else if (opt.opt == 'view_device') {
                                    GKDialog.openSetting('device');
                                }
                                else if (opt.opt == 'view_chat') {
                                    var mount = GKMount.getMountByOrgId(item.org_id);
                                    var mountId = 0;
                                    if(!mount){
                                        alert('该云库已被删除或你已退出该云库');
                                        return;
                                    }
                                    mountId = mount['mount_id'];
                                    GKPath.gotoFile(mountId, '', '','','','chat');
                                }
                                $rootScope.showNews = false;
                                $modalInstance.close();
                            }
                        };

                        /**
                         *处理邀请加入云库的请求
                         * @param accept
                         */
                        $scope.handleTeamInvite = function (accept, item) {
                            if (accept) {
                                GKApi.teamInviteJoin(item['org_id'], item['property']['invite_code']).success(function () {
                                    $scope.$apply(function () {
                                        item.handled = true;
                                    });

                                }).error(function () {

                                    });
                            } else {
                                GKApi.teamInviteReject(item['org_id'], item['property']['invite_code']).success(function () {
                                    $scope.$apply(function () {
                                        item.handled = true;
                                    });

                                }).error(function () {

                                    });
                            }

                        };

                        /**
                         * 处理申请加入云库的请求
                         */
                        $scope.handleTeamRequest = function (agree) {

                        };
                    },
                    resolve: {
                        classifyNews: function () {
                            var news = GKNews.getNews();
                            var getLastDateline = function (news, lastDateline) {
                                var dateline = lastDateline;
                                if (news && news.length) {
                                    dateline = news[news.length - 1]['dateline'];
                                }
                                return dateline;
                            };
                            var requestDateline = getLastDateline(news, 0);
                            return GKNews.classify(news);
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            createTeam: function (title) {
                title = angular.isDefined(title) ? title : '创建云库';
                var option = {
                    templateUrl: 'views/create_team_dialog.html',
                    windowClass: 'modal_frame create_team_dialog',
                    controller: function ($scope, $modalInstance, src) {
                        $scope.title = title;
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.$on('changeModalSrc', function (event, param) {
                            $scope.url = gkClientInterface.getUrl({
                                sso: 1,
                                url: param.src
                            });
                        })

                        $scope.$on('closeModal', function (event, param) {
                            $modalInstance.dismiss('cancel');
                        })
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/org/regist'
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            joinTeam: function () {
                var title = '加入云库';
                var option = {
                    templateUrl: 'views/join_team_dialog.html',
                    windowClass: 'modal_frame join_team_dialog',
                    controller: function ($scope, $modalInstance, src) {
                        $scope.title = title;
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.$on('closeModal', function (event, param) {
                            $modalInstance.dismiss('cancel');
                        })
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/org/find_org'
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            teamMember: function (orgId) {
                var option = {
                    templateUrl: 'views/team_member_dialog.html',
                    windowClass: 'modal_frame team_member_dialog',
                    controller: function ($scope, $modalInstance, src) {
                        $scope.url = src;
                        $scope.orgName = getOrgName(orgId);
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/manage/members?org_id=' + orgId
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            teamSubscribe: function (orgId) {
                var option = {
                    templateUrl: 'views/team_subscriber_dialog.html',
                    windowClass: 'modal_frame team_subscriber_dialog',
                    controller: function ($scope, $modalInstance, src) {
                        $scope.url = src;
                        $scope.orgName = getOrgName(orgId);
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/manage/subscribers?org_id=' + orgId
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            teamManage: function (orgId) {
                var option = {
                    templateUrl: 'views/team_manage_dialog.html',
                    windowClass: 'modal_frame team_manage_dialog',
                    controller: function ($scope, $modalInstance, src) {
                        $scope.url = src;
                        $scope.orgName = getOrgName(orgId);
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.$on('removeTeam', function (event, orgId) {
                            $rootScope.PAGE_CONFIG.visitHistory.removeHistory("",$rootScope.PAGE_CONFIG.mount.mount_id );
                            gkClientInterface.notice({type: 'removeOrg', 'org_id': Number(orgId)}, function (param) {
                                if (param) {
                                    $rootScope.$broadcast('RemoveOrgObject', {'org_id': orgId});
                                    $modalInstance.close(orgId);
                                }
                            })
                        })
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/manage/safe?org_id=' + orgId
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            teamQr: function (orgId, width) {
                width = angular.isDefined(width) ? width : 400;
                var option = {
                    templateUrl: 'views/team_qr_dialog.html',
                    windowClass: 'modal_frame team_qr_dialog',
                    controller: function ($scope, $modalInstance, src) {
                        $scope.url = src;
                        $scope.orgName = getOrgName(orgId);
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso: 1,
                                url: '/org/qr_subscribe?org_id=' + orgId + '&width=' + 600
                            });
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            },
            createTeamFolder: function (mountId, fullpath, publish) {
                publish = angular.isDefined(publish) ? Number(publish) : 0;
                var option = {
                    templateUrl: 'views/create_teamfolder_dialog.html',
                    windowClass: 'create_teamfolder',
                    controller: function ($scope, $modalInstance) {
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                        $scope.filename = '';
                        $scope.disableCheck = false;
                        $scope.publish = publish;
                        $scope.shareToSubscriber = false;
                        if (publish) {
                            $scope.disableCheck = true;
                            $scope.shareToSubscriber = true;
                        }
                        $scope.ok = function (filename, shareToSubscriber) {
                            if (!GKFile.checkFilename(filename)) {
                                return;
                            }
                            var path = fullpath ? fullpath + '/' + filename : filename;
                            var params = {
                                webpath: path,
                                dir: 1,
                                mountid: mountId
                            };
                            var callback = function () {
                                $rootScope.$broadcast('editFileSuccess', 'create', mountId, fullpath, {fullpath: path});
                            };

                            GK.createFolder(params).then(function () {
                                if (shareToSubscriber) {
                                    gkClientInterface.setFilePublic({
                                        mountid: mountId,
                                        webpath: path,
                                        open: 1
                                    }, function (re) {
                                        if (!re.error) {
                                            callback();
                                        } else {
                                            GKException.handleClientException(re);
                                        }
                                    });
                                } else {
                                    callback();
                                }
                            }, function (error) {
                                GKException.handleClientException(error);
                            });

                            $modalInstance.close();
                        }
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);
            }
        }
    }])
    .factory('GKFind', ['$rootScope', function ($rootScope) {
        return {
            toogleFind: function () {
                $rootScope.showNearBy = !$rootScope.showNearBy;
                if ($rootScope.showNearBy) {
                    gkClientInterface.startFind();
                } else {
                    gkClientInterface.stopFind();
                }
            }
        }
    }])
    .factory('GKNews', ['localStorageService', 'GKApi', '$filter', 'GKDialog', 'GKPath', 'GKException', '$q', function (localStorageService, GKApi, $filter, GKDialog, GKPath, GKException, $q) {
        var newsKey = 'gknews_' + gkClientInterface.getUser()['member_id'];
        var GKNews = {
            getOptsByItem: function (item) {
                var opts = [];
                switch (item.act) {
                    case 'file':
                        opts.push({
                            classes: 'btn-primary',
                            text: '查看',
                            click: function (item) {
                                var orgId = item.org_id,
                                    mountId = item.mount_id,
                                    fullpath = item.fullpath;
                                GKPath.gotoFile(mountId, fullpath);
                            }
                        });
                        break;
                    case 'invite':
                        opts.push({
                            classes: 'btn-default',
                            text: '接收',
                            click: function (item) {
                                var orgId = item.orgId;
                                var code = item.code;
                                GKApi.teamInviteJoin(orgId, code).success(function () {

                                }).error(function (request) {
                                        GKException.handleAjaxException(request);
                                    });
                            }
                        });
                        opts.push({
                            classes: 'btn-danger',
                            text: '拒绝',
                            click: function (item) {
                                GKApi.teamInviteReject(orgId, code).success(function () {

                                }).error(function (request) {
                                        GKException.handleAjaxException(request);
                                    });
                            }
                        });
                    case 'accepted':
                        opts.push({
                            classes: 'btn-primary',
                            text: '查看',
                            click: function (item) {
                                GKDialog.openTeamMember();
                            }
                        });
                    case 'join_success':
                        opts.push({
                            classes: 'btn-primary',
                            text: '查看',
                            click: function (item) {
                                var orgId = item.org_id,
                                    mountId = item.mount_id,
                                    fullpath = '';
                                GKPath.gotoFile(mountId, fullpath);
                            }
                        });
                    case 'new_device':
                        opts.push({
                            classes: 'btn-primary',
                            text: '查看',
                            click: function (item) {
                                GKDialog.openSetting('device');
                            }
                        });
                    case 'product':
                        opts.push({
                            classes: 'btn-primary',
                            text: '查看',
                            click: function (item) {
                                var url = item.url;
                                url = gkClientInterface.getUrl({
                                    url: url,
                                    sso: 1
                                });
                                gkClientInterface.openUrl();
                            }
                        });
                        break;
                }
            },
            classify: function (news) {
                var classifyNews = [],
                    context = this;
                ;
                var now = new Date().valueOf();
                var today = $filter('date')(now, 'yyyy-MM-dd');
                var yesterdayTimestamp = now - 24 * 3600 * 1000;
                var yesterday = $filter('date')(yesterdayTimestamp, 'yyyy-MM-dd');
                angular.forEach(news, function (value) {
                    var date = value.date;
                    //value.opts = context.getOptsByItem(value);
                    var dateText = $filter('date')(value.dateline * 1000, 'yyyy年M月d日');
                    if (date == today) {
                        dateText = '今天，' + $filter('date')(now, 'yyyy年M月d日');
                    } else if (date == yesterday) {
                        dateText = '昨天，' + $filter('date')(yesterdayTimestamp, 'yyyy年M月d日');
                    }
                    var existClassifyItem = context.getClassifyItemByDate(date, classifyNews);
                    if (!existClassifyItem) {
                        existClassifyItem = {
                            date: date,
                            date_text: dateText,
                            list: [value]
                        }
                        classifyNews.push(existClassifyItem);
                    } else {
                        existClassifyItem['list'].push(value);
                    }
                });
                return classifyNews;
            },
            getClassifyItemByDate: function (date, classifyNews) {
                if (!classifyNews || !classifyNews.length) {
                    return null;
                }
                for (var i = 0; i < classifyNews.length; i++) {
                    var value = classifyNews[i];
                    if (value['date'] == date) {
                        return value;
                        break;
                    }
                }
                return null;
            },
            requestNews: function (dateline) {
                var deferred = $q.defer();
                var context = this;
                var dateline = 0;
                var oldNews = this.getNews();
                if (oldNews && oldNews.length) {
                    dateline = oldNews[0]['dateline'] + 1;
                }
                GKApi.newUpdate(dateline).success(function (data) {
                    var news = data['updates'] || [];
                    var dateline = data['dateline'];
                    gkClientInterface.setMessageDate(dateline);
                    context.addNews(news);
                    deferred.resolve(news);
                }).error(function () {
                        deferred.resolve();
                    })
                return deferred.promise;
            },
            getNews: function () {
                var news = localStorageService.get(newsKey);
                return news;
            },
            concatNews: function (oldClassifyNews, newClassifyNews) {
                var context = this;
                if (!newClassifyNews || !newClassifyNews.length) {
                    return oldClassifyNews;
                }
                var existItem;
                angular.forEach(newClassifyNews, function (value) {
                    existItem = context.getClassifyItemByDate(value['date']);
                    if (existItem) {
                        existItem['list'] = existItem['list'].concat(value['list']);
                    } else {
                        oldClassifyNews.push(value);
                    }

                });
                return oldClassifyNews;
            },
            updateNews: function (newsId, param) {
                var news = this.getNews();
                angular.forEach(news, function (value) {
                    if (value.id == newsId) {
                        angular.extend(value, param);
                        return false;
                    }
                });
                localStorageService.add(newsKey, JSON.stringify(news));
            },
            addNews: function (news) {
                if (!news || !news.length) {
                    return;
                }
                var oldNews = this.getNews();
                if (!oldNews || !oldNews.length) {
                    localStorageService.add(newsKey, JSON.stringify(news));
                } else {
                    var newOldNews = news.concat(oldNews);
                    newOldNews = newOldNews.slice(0, 100);
                    localStorageService.add(newsKey, JSON.stringify(newOldNews));
                }
            },
            appendNews: function (data) {
                var deferred = $q.defer();
                if (!data['list'] || !data['list'].length) {
                    this.requestNews().then(function () {
                        deferred.resolve();
                    });
                } else {
                    this.addNews(data['list']);
                    deferred.resolve();
                }
                return deferred.promise;
            }
        };
        return GKNews;
    }])
    .factory('GKSmartFolder', ['GKFilter', '$filter', 'GKApi', '$q', 'GKException', 'GKFile', '$rootScope','GKPartition',function (GKFilter, $filter, GKApi, $q, GKException, GKFile,$rootScope,GKPartition) {
        var getFolderAliasByType = function (type) {
            var filter = '';
            switch (type) {
                case -1:
                case '-1':
                    filter = GKFilter.recentVisit;
                    break;
                case 0:
                    filter = GKFilter.recent;
                    break;
                case 1:
                    filter = GKFilter.star;
                    break;
                case 2:
                    filter = GKFilter.moon;
                    break;
                case 3:
                    filter = GKFilter.heart;
                    break;
                case 4:
                    filter = GKFilter.flower;
                    break;
                case 5:
                    filter = GKFilter.triangle;
                    break;
                case 6:
                    filter = GKFilter.diamond;
                    break;
            }
            return filter;
        };

        var formartSmartFolder = function (value) {
            var condition = Number(value.condition);
            var filter = getFolderAliasByType(condition);
            var item = {
                name: value.name,
                type: condition,
                filter: filter,
                icon: 'icon_' + filter,
                partition:GKPartition.smartFolder
            };
            return item;
        };

        var reSmartFolders = gkClientInterface.getSideTreeList({sidetype: 'magic'})['list'];
        if (!reSmartFolders) {
            reSmartFolders = [];
        }
        reSmartFolders = $filter('orderBy')(reSmartFolders, '+condition');
        reSmartFolders.unshift({
            condition: '0',
            name: '最近修改的文件'
        })

        reSmartFolders.unshift({
            condition: '-1',
            name: '最近访问的文件'
        })

        var smartFolders = [], item;
        angular.forEach(reSmartFolders, function (value) {
            smartFolders.push(formartSmartFolder(value))
        });
        var GKSmartFolder = {
            getFolderAliasByType: getFolderAliasByType,
            checkFolderName: function (filename) {
                if (!filename.length) {
                    alert('名称不能为空');
                    return false;
                }
                var reg = /\/|\\|\:|\*|\?|\"|<|>|\|/;
                if (reg.test(filename)) {
                    alert('名称不能包含下列任何字符： / \\ : * ? " < > |');
                    return false;
                }
                if (filename.length > 15) {
                    alert('名称的长度不能超过15个字符');
                    return false;
                }
                return true;
            },
            getSmartFoldeName: function (filter) {
                var filterName = '';
                switch (filter) {
                    case GKFilter.trash:
                        filterName = '回收站';
                        break;
                    case GKFilter.recent:
                        filterName = '最近修改的文件';
                        break;
                    case GKFilter.recentVisit:
                        filterName = '最近访问的文件';
                        break;
                    case GKFilter.search:
                        filterName = '搜索结果';
                        break;
                }
                if (!filterName) {
                    var type = GKFilter.getFilterType(filter);
                    var smartFolder = this.getFolderByCode(type);
                    if (smartFolder) {
                        filterName = smartFolder['name'];
                    }
                }
                return filterName;
            },
            getFolders: function (exclue) {
                var newSmartFolder = smartFolders.slice(0);
                if (exclue) {
                    if (!angular.isArray(exclue)) exclue = [exclue];
                    angular.forEach(exclue, function (value) {
                        angular.forEach(newSmartFolder, function (smart, key) {
                            if (smart.filter == value) {
                                newSmartFolder.splice(key, 1);
                                return false
                            }
                        })
                    });
                }
                return newSmartFolder;
            },
            getFolderByCode: function (code) {
                var value, smartFolder = null;
                for (var i = 0; i < smartFolders.length; i++) {
                    value = smartFolders[i];
                    if (value.type == code) {
                        smartFolder = value
                    }
                }
                return smartFolder
            },
            removeSmartFolderByCode: function (code) {
                angular.forEach(smartFolders, function (value, key) {
                    if (code == value.type) {
                        smartFolders.splice(key, 1);
                    }
                });
            },
            addSmartFolder: function (name, code) {
                var newNode = formartSmartFolder({
                    name: name,
                    condition: code
                });
                var smartFolder = this.getFolderByCode(code);
                if (smartFolder) {
                    this.editSmartFolder(name, code);
                } else {
                    smartFolders.push(newNode)
                }
                return newNode;
            },
            editSmartFolder: function (name, code) {
                angular.forEach(smartFolders, function (value) {
                    if (value.type == code) {
                        value.name = name;
                        return false;
                    }
                })
            },
            getList: function (filter, option) {
                var list = [],
                    deferred = $q.defer(),
                    source = 'api',
                    param,
                    cacheKey;
                if(['star', 'diamond', 'moon', 'triangle', 'flower', 'heart','recent','recent_visit'].indexOf(filter)<0){
                    return deferred.resolve(list);
                }
                cacheKey = filter+':';
                if(!$rootScope.PAGE_CONFIG.networkConnected){
                    list = gkClientInterface.getCache({
                        key:cacheKey
                    });
                    if(!list) list = [];
                    list = list.map(function(value){
                        if(value.dir == 0 && value.filehash){
                            value.cache = gkClientInterface.checkFileCache(value.filehash);
                        }
                        return value;
                    })
                    deferred.resolve(list);
                }else{
                if (['star', 'diamond', 'moon', 'triangle', 'flower', 'heart'].indexOf(filter) >= 0) {
                    /**
                     * 加星标的文件
                     */
                    var type = GKFilter.getFilterType(filter);
                    GKApi.starFileList(type).success(function (data) {
                        list = GKFile.dealFileList(data['list'], source);
                        param = {
                            key:cacheKey,
                            value:JSON.stringify(list)
                        }
                        gkClientInterface.addCache(param);
                        deferred.resolve(list);
                    }).error(function (request) {
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });
                    /**
                     * 最近修改的文件
                     */
                } else if (filter == 'recent') {
                    GKApi.recentFileList(filter).success(function (data) {
                        list = GKFile.dealFileList(data['list'], source);
                        param = {
                            key:cacheKey,
                            value:JSON.stringify(list)
                        }
                        gkClientInterface.addCache(param);
                        deferred.resolve(list);
                    }).error(function (request) {
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });
                    /**
                     * 最近访问的文件
                     */
                }else if(filter == 'recent_visit'){
                    GKApi.starFileList(255).success(function (data) {
                        list = GKFile.dealFileList(data['list'], source);
                        param = {
                            key:cacheKey,
                            value:JSON.stringify(list)
                        }
                        gkClientInterface.addCache(param);
                        deferred.resolve(list);
                    }).error(function (request) {
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });
                }
                }
                return deferred.promise;
            },
            renameSmartFolder: function (condition, name) {
                var deferred = $q.defer();
                var param = {
                    condition: condition,
                    name: name
                };
                gkClientInterface.renameSmartFolder(param, function (re) {
                    if (!re.error) {
                        var filter = GKSmartFolder.getFolderAliasByType(condition);
                        $rootScope.$broadcast('editSmartFolder', name, condition, filter);
                        deferred.resolve();
                    } else {
                        GKException.handleClientException(re);
                        deferred.reject();
                    }
                });
                return deferred.promise;
            }
        };
        return GKSmartFolder;
    }])
    .factory('GKFilter', [function () {
        var GKFilter = {
            trash: 'trash',
            inbox: 'inbox',
            star: 'star',
            recentVisit: 'recent_visit',
            recent: 'recent',
            triangle: 'triangle',
            diamond: 'diamond',
            flower: 'flower',
            moon: 'moon',
            heart: 'heart',
            search: 'search',
            getFilterType: function (filter) {
                var filterType = '';
                switch (filter) {
                    case this.star:
                        filterType = 1;
                        break;
                    case this.moon:
                        filterType = 2;
                        break;
                    case this.heart:
                        filterType = 3;
                        break;
                    case this.flower:
                        filterType = 4;
                        break;
                    case this.triangle:
                        filterType = 5;
                        break;
                    case this.diamond:
                        filterType = 6;
                        break;
                }
                return filterType;
            },
            getFilterTip: function (filter) {
                var tip = '';
                switch (filter) {
                    case this.trash:
                        tip = '';
                        break;
                    case this.inbox:
                        tip = '';
                        break;
                    case this.star:
                        tip = '';
                        break;
                    case this.recent:
                        tip = '';
                        break;
                    case this.search:
                        tip = '';
                        break;
                }
                return tip;
            },
            isTrash: function (filter) {
                return filter == this.trash;
            },
            isInbox: function (filter) {
                return filter == this.inbox;
            },
            isRecent: function (filter) {
                return filter == this.recent;
            },
            isSearch: function (filter) {
                return filter == this.search;
            },
            isStar: function (filter) {
                return filter == this.star;
            }

        }

        return GKFilter;
    }])
    .factory('GKPath', ['$location', 'GKMount', 'GKSmartFolder', 'GKFilter', 'GKPartition','GKMode', function ($location, GKMount, GKSmartFolder, GKFilter, GKPartition,GKMode) {
        var GKPath = {
            gotoFile: function (mountId, path, selectFile,view,filter,mode) {
                view = angular.isDefined(view)?view:'';
                selectFile = angular.isDefined(selectFile) ? selectFile : '';
                filter = angular.isDefined(filter) ? filter : '';
                mode = angular.isDefined(mode) ? mode : 'file';
                var searchParam = $location.search();
                var mount = GKMount.getMountById(mountId);
                if (!mount) return;
                var search = {
                    partition: mount['ent_id']?GKPartition.entFile: GKPartition.teamFile,
                    mountid: mountId,
                    path: path,
                    selectedpath: selectFile,
                    view:view,
                    filter:filter,
                    entid:mount['ent_id']?mount['ent_id']:-1,
                    time:new Date().getTime()
                };

                if (mount) {
                    GKMode.setMode(mode,search.partition,mount);
                    $location.search(search);
                }
            },

            getPath: function () {
                var paramArr = Array.prototype.slice.call(arguments);
                var params = {
                    partition: paramArr[0],
                    path: paramArr[1] | '',
                    mountid: paramArr[3] || 0,
                    filter: paramArr[4] || '',
                    search: paramArr[5] || ''
                };
                return '/file?' + jQuery.param(params);
            },
            getBread: function ($scope) {
                var path = $location.search().path || '';
                var partition = $location.search().partition || GKPartition.teamFile;
                var filter = $location.search().filter;
                var mountId = $location.search().mountid;
                var breads = [], bread;

                if($scope && $scope.view == 'fileupdate'){
                    path = '文件更新'
                }

                if (path.length) {
                    path = Util.String.rtrim(Util.String.ltrim(path, '/'), '/');
                    var paths = path.split('/');
                    for (var i = 0; i < paths.length; i++) {
                        bread = {
                            name: paths[i]
                        };
                        var fullpath = '';
                        for (var j = 0; j <= i; j++) {
                            fullpath += paths[j] + '/'
                        }
                        fullpath = Util.String.rtrim(fullpath, '/');
                        bread.path = fullpath;
                        bread.filter = '',
                            bread.url = '#' + this.getPath(partition, bread.path, mountId, filter);
                        breads.push(bread);
                    }
                }

                /**
                 * 搜索不需要bread
                 */
                if (filter) {
                    var filterItem, icon, filterName;
                    filterName = GKSmartFolder.getSmartFoldeName(filter);
                    filterItem = {
                        name: filterName,
                        url: '#' + this.getPath(partition, '', mountId, filter),
                        filter: filter
                    }
                    if (filter != GKFilter.trash) {
                        filterItem.icon = 'icon_' + filter;
                    }
                    breads.unshift(filterItem);
                }


                if (mountId) {
                    var mount = GKMount.getMountById(mountId);
                    if (mount) {
                        var item = {
                            name: mount['name'],
                            filter: '',
                            url: '#' + this.getPath(partition, '', mountId, filter)
                        }

                        if (mount.org_id == 0) {
                            item.icon = 'icon_myfolder';
                        } else {
                            item.logo = mount['logo'];
                        }
                        breads.unshift(item);
                    }
                }
                return breads;
            }
        }

        return GKPath;
    }])
    .factory('GK', ['$q', function ($q) {
        return {
            recover: function (params) {
                var deferred = $q.defer();
                gkClientInterface.recover(params, function (re) {
                    if (!re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            addFile: function (params) {
                var deferred = $q.defer();
                gkClientInterface.addFile(params, function (re) {
                    if (!re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            createFolder: function (params) {
                var deferred = $q.defer();
                gkClientInterface.createFolder(params, function (re) {
                    if (re && !re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            lock: function (params) {
                params.status = 1;
                var deferred = $q.defer();
                gkClientInterface.toggleLock(params, function (re) {
                    if (re && !re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            unlock: function (params) {
                params.status = 0;
                var deferred = $q.defer();
                gkClientInterface.toggleLock(params, function (re) {
                    if (re && !re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            getUser: function () {
                return gkClientInterface.getUser();
            },
            saveToLocal: function (params) {
                gkClientInterface.saveToLocal(params);
            },
            del: function (params) {
                var deferred = $q.defer();
                var re = gkClientInterface.del(params, function (re) {
                    if (re && !re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            rename: function (params) {
                var deferred = $q.defer();
                var re = gkClientInterface.rename(params, function (re) {
                    if (re && !re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            copy: function (params) {
                var deferred = $q.defer();
                var re = gkClientInterface.copy(params, function (re) {
                    if (re && !re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });

                return deferred.promise;
            },
            move: function (params) {
                var deferred = $q.defer();
                gkClientInterface.move(params, function (re) {
                    if (re && !re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            open: function (params) {
                gkClientInterface.open(params);

            },
            selectPath: function (params) {
                return gkClientInterface.selectPath(params);
            },
            removeLinkPath: function (params) {
                var deferred = $q.defer();
                gkClientInterface.removeLinkPath(params, function (re) {
                    if (re && !re.error) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
                return deferred.promise;
            },
            getRestHost: function () {
                return gkClientInterface.getRestHost();
            },
            getApiHost: function () {
                return gkClientInterface.getApiHost();
            },
            getToken: function () {
                return gkClientInterface.getToken();
            },
            getAuthorization: function (ver, webpath, date, mountid) {
                return gkClientInterface.getAuthorization(ver, webpath, date, mountid);
            },
            getApiAuthorization: function (params) {
                return gkClientInterface.getApiAuthorization(params);
            },
            getLocalSyncURI: function (params) {
                return gkClientInterface.getLocalSyncURI(params);
            }
        }
    }])
    .factory('GKPartition', [function(){
        var GKPartition = {
            teamFile: 'teamfile',
            entFile: 'entfile',
            smartFolder: 'smartfolder',
            subscribeFile: 'subscribefile',
            getPartitionByMountType : function(type,entId){
                var partition;
                if(!entId){
                    partition = this.teamFile;
                }else{
                    partition = this.entFile;
                }
                return partition;
            },
            isMountPartition:function(partition){
                return [this.teamFile,this.entFile,this.subscribeFile].indexOf(partition) >= 0;
            },
            isSubscribePartition:function(partition){
                return this.subscribeFile == partition;
            },
            isSmartFolderPartition:function(partition){
                return this.smartFolder == partition;
            },
            isTeamFilePartition:function(partition){
                return this.teamFile == partition;
            },
            isEntFilePartition:function(partition){
                return this.entFile == partition;
            }

        };
        return GKPartition;
    }])
    .factory('GKFile', ['FILE_SORTS', 'GKPartition', 'GKFilter', '$q', 'GKApi', 'GKException','$rootScope','$filter', function (FILE_SORTS, GKPartition, GKFilter, $q, GKApi, GKException,$rootScope,$filter) {
        var GKFile = {
            checkFilename: function (filename) {
                if (!filename.length) {
                    alert('文件名不能为空');
                    return false;
                }
                var reg = /\/|\\|\:|\*|\?|\"|<|>|\|/;
                if (reg.test(filename)) {
                    alert('文件名不能包含下列任何字符： / \\ : * ? " < > |');
                    return false;
                }
                if (filename.length > 255) {
                    alert('文件名的长度不能超过255个字符');
                    return false;
                }
                var lastStr = filename.slice(filename.length-1);
                if(lastStr === '.'){
                    alert('无效的文件名');
                    return;
                }
                return true;
            },
            /**
             * 获取单文件信息
             */
            getFileInfo: function (mountId, fullpath) {
                var file = gkClientInterface.getFileInfo({
                    mountid: mountId,
                    webpath: fullpath
                });
                if (!file.path) {
                    file.path = '';
                }
                var formatedFile = this.formatFileItem(file, 'client');
                angular.extend(formatedFile, {
                    mount_id: mountId
                });

                return formatedFile;
            },
            getDiscussHistory:function(file){
                var deferred = $q.defer();
                //查询出来的消息
                GKApi.disscussHistory(file.mount_id,file.fullpath).success(function (data) {
                    deferred.resolve(data);
                }).error(function (request) {
                    deferred.reject(GKException.getAjaxErrorMsg(request));
                })
                return deferred.promise;
            },
	    
	       /*
            * 获取文件更新列表
            * */
            getFileUpdateList:function(mountId){
                var deferred = $q.defer(),
                    list;
                var defaultOption = {
                    count: 1000,
                    start: 0,
                    mountid:mountId
                };

                gkClientInterface.getFileUpdateList(defaultOption,function(re){
                    if (!re.error) {
                        list = GKFile.dealFileList(re['list'], 'client');
                        deferred.resolve(list);
                    } else {
                        deferred.reject(GKException.getClientErrorMsg(re));
                    }
                });

                return deferred.promise;
            },
	    
            getFileList: function (mountId, fullpath, source, option) {
                var deferred = $q.defer(),
                    list;
                var defaultOption = {
                    size: 1000,
                    start: 0,
                    dir: 0,
                    recycle: false,
                    current:0
                };
                option = angular.extend({}, defaultOption, option);
                if (source == 'api') {
                    if (!option.recycle) {
                        var cacheKey = mountId+':'+fullpath;
                        if(!$rootScope.PAGE_CONFIG.networkConnected){
                            list = gkClientInterface.getCache({
                                key:cacheKey
                            });
                            if(!list) list = [];
                            if(option.dir==1){
                                list = $filter('filter')(list,{dir:1});
                            }else{
                                list = list.map(function(value){
                                    if(value.dir == 0 && value.filehash){
                                        value.cache = gkClientInterface.checkFileCache(value.filehash);
                                    }
                                    return value;
                                })
                            }
                            deferred.resolve(list);
                        }else{
                            GKApi.list(mountId, fullpath, option.start, option.size, option.dir).success(function (data) {
                                list = GKFile.dealFileList(data['list'], source);
                                var param = {
                                    key:cacheKey,
                                    value:JSON.stringify(list)
                                }
                                gkClientInterface.addCache(param);
                                deferred.resolve(list);
                            }).error(function (request) {
                                    deferred.reject(GKException.getAjaxErrorMsg(request));
                                })
                        }
                    ;
                    } else {
                        GKApi.recycle(mountId, '').success(function (data) {
                            list = data['list'];
                            deferred.resolve(GKFile.dealFileList(list, source));
                        }).error(function (request) {
                                deferred.reject(GKException.getAjaxErrorMsg(request));
                            })
                    }

                } else {
                   gkClientInterface.getFileList({webpath: fullpath, dir: option.dir, mountid: mountId,current:option.current},function(re){
                        if (!re.error) {
                            list = GKFile.dealFileList(re['list'], 'client');
                            deferred.resolve(list);
                        } else {
                            deferred.reject(GKException.getClientErrorMsg(re));
                        }
                    });
                }
                return deferred.promise;
            },
            /**
             * 是否已同步
             * @param parentFile
             * @param file
             * @returns {boolean}
             */
            isSynced: function (parentFile, file) {
                if (!parentFile) {
                    return false;
                }
                if (parentFile.syncpath) {
                    return true;
                }
                if (file && file.sync == 1) {
                    return true;
                }
                return false;
            },
            /**
             * 是否可对同步进行设置
             * @param parentFile
             * @param file
             * @returns {boolean}
             */
            isSyncable: function (parentFile, file) {
                /**
                 * 根目录不允许同步
                 */
                if (!file.fullpath) {
                    return true;
                }
                /**
                 * 未同步的允许进行同步、不同步 操作
                 */
                if (!this.isSynced(parentFile, file)) {
                    return true;
                }
                /**
                 * 同步的目录 就是当前操作目录
                 */
                if (parentFile.syncpath === file.fullpath || file.sync == 1) {
                    return true;
                }
                return false;
            },
            getTrashNode: function (mount_id, partition) {
                var node = {
                    label: '回收站',
                    isParent: false,
                    dropAble: false,
                    data: {
                        fullpath: '',
                        filter: 'trash',
                        mount_id: mount_id,
                        partition: partition
                    },
                    iconNodeExpand: 'icon_trash',
                    iconNodeCollapse: 'icon_trash'
                };
                return node;
            },
            getChildNode: function (branch) {
                var context = this;
                var deferred = $q.defer(), children;
                if (branch.data.filter != 'trash') {
                    var source = 'client';
                    if (GKPartition.isSubscribePartition(branch.data.partition)) {
                        source = 'api';
                    }
                    var option  = {dir:1};
                    context.getFileList(branch.data.mount_id, branch.data.fullpath, source,option).then(function (list) {
                        children = context.dealTreeData(list, branch.data.mount_id,true);
                        /**
                         * 添加回收站
                         */
//                        if (!branch.data.fullpath && !branch.data.filter && branch.data.type != 3) {
//                            var trashNode = context.getTrashNode(branch.data.mount_id, branch.data.partition);
//                            children.push(trashNode);
//                        }
                        deferred.resolve(children);
                    })
                }
                return deferred.promise;
            },
            dealTreeData: function (data, mountId,isTreeView) {
                var newData = [],
                    item,
                    context = this;
                angular.forEach(data, function (value) {
                    item = context.dealTreeItem(value, mountId,isTreeView);
                    newData.push(item);
                });
                return newData;
            },
            dealTreeItem:function(value, mountId,isTreeView){
                isTreeView = isTreeView === undefined ? false : isTreeView;
                var item = {},label;
                /**
                 * 云库
                 */
                if (mountId || value.mount_id) {
                    var icon = '';
                    if (!value.fullpath) {
                        label = value.name;
                        item.nodeImg = value.logo;
                    } else {
                        label = value.filename;
                        mountId && angular.extend(value, {
                            mount_id: mountId
                        });
                        icon = 'icon_myfolder';
                    }
                    var dropAble = true;
                    angular.extend(item, {
                        dropAble: dropAble,
                        label: label,
                        data: value,
                        isParent: !isTreeView?false:true,
                        hasChildren: !isTreeView?false:value.hasFolder == 1,
                        iconNodeExpand: icon,
                        iconNodeCollapse: icon,
                        newMsgTime:0,
                        visitTime:0
                    });
                } else {
                    /**
                     * 智能文件夹
                     */
                    item = {
                        label: value.name,
                        isParent: false,
                        data: value,
                        hasChildren: false,
                        iconNodeExpand: value.icon,
                        iconNodeCollapse: value.icon,
                        newMsgTime:-1,
                        visitTime:0
                    };
                }
                return item;
            },
            formatFileItem: function (value, source) {
                var file;
                if (source == 'api') {
                    var ext = value.dir == 1 ? '' : Util.String.getExt(value.filename);
                    file = {
                        mount_id: value.mount_id || 0,
                        filename: value.filename,
                        filesize: Number(value.filesize),
                        ext: ext,
                        last_edit_time: Number(value.last_dateline),
                        fullpath: Util.String.rtrim(value.fullpath, '/'),
                        lock: value.lock || 0,
                        lock_member_name: value.lock_member_name || '',
                        lock_member_id: value.lock_member_id || 0,
                        dir: Number(value.dir),
                        last_member_name: value.last_member_name || '',
                        last_member_id: value.last_member_id,
                        creator_member_name: value.create_member_name || '',
                        creator_member_id: value.create_member_id || '',
                        creator_time: Number(value.create_dateline),
                        cmd: value.cmd,
                        favorite: value.favorite,
                        filehash: value.filehash,
                        hash: value.hash,
                        open: value.publish || 0,
                        hasFolder: 1,
                        tag:value.tag||'',
                        version:value.version,
                        index:value.index
                    };
                } else {
                    var fileName = Util.String.baseName(value.path);
                    var ext = value.dir == 1 ? '' : Util.String.getExt(fileName);
                    file = {
                        mount_id: value.mount_id || 0,
                        filename: fileName,
                        filesize: Number(value.filesize),
                        ext: ext,
                        last_edit_time: Number(value.lasttime),
                        fullpath: value.path,
                        lock: value.lock,
                        lock_member_name: value.lockname,
                        lock_member_id: value.lockid,
                        dir: Number(value.dir),
                        last_member_name: value.lastname,
                        last_member_id: value.lastid,
                        creator_member_name: value.creatorname,
                        creator_member_id: value.creatorid,
                        creator_time: Number(value.creatortime),
                        status: value.status,
                        sync: value.sync,
                        cmd: 1,
                        sharepath: value.sharepath || '',
                        syncpath: value.syncpath || '',
                        share: value.share,
                        auth: value.auth,
                        cache: value.have,
                        filehash: value.filehash,
                        hash: value.uuidhash,
                        open: value.open || 0,
                        hasFolder: value.hasfolder || 0,
                        tag:'',
                        version:value.version,
                        index:0
                    };
                }
                return file;
            },
            dealFileList: function (fileList, source) {
                var fileData = [], file, context = this;
                angular.forEach(fileList, function (value) {
                    file = context.formatFileItem(value, source);
                    fileData.push(file);
                });
                return fileData;
            },
            /**
             * 获取文件类型
             * @param type
             * @param dir
             */
            getFileType: function (type, dir) {
                return dir ? '文件夹' : GKFile.getFileTypeName(type);
            },
            getFileTypeName: function (type) {
                var typeName;
                switch (type) {
                    case 'movie':
                        typeName = '视频';
                        break;
                    case 'music':
                        typeName = '音频';
                        break;
                    case 'image':
                        typeName = '图像';
                        break;
                    case 'document':
                        typeName = '文档';
                        break;
                    case 'compress':
                        typeName = '压缩文件';
                        break;
                    case 'execute':
                        typeName = '可执行文件';
                        break;
                    default:
                        typeName = '文件';
                        break;
                }
                return typeName;
            },
            /**
             * 获取文件类型的前缀
             * @param filename
             * @param dir
             * @param share
             * @param local
             * @returns {string}
             */
            getFileIconSuffix: function (filename, dir, share, sync) {
                var suffix = '';
                var sorts = FILE_SORTS;
                if (dir == 1) {
                    suffix = 'folder';
                    if (sync == 1) {
                        suffix = 'sync_' + suffix;
                    }
                    if (share > 0) {
                        suffix = 'shared_' + suffix;
                    }
                } else {
                    var ext = Util.String.getExt(filename);
                    if (jQuery.inArray(ext, sorts['SORT_SPEC']) > -1) {
                        suffix = ext;
                    } else if (jQuery.inArray(ext, sorts['SORT_MOVIE']) > -1) {
                        suffix = 'movie';
                    } else if (jQuery.inArray(ext, sorts['SORT_MUSIC']) > -1) {
                        suffix = 'music';
                    } else if (jQuery.inArray(ext, sorts['SORT_IMAGE']) > -1) {
                        suffix = 'image';
                    } else if (jQuery.inArray(ext, sorts['SORT_DOCUMENT']) > -1) {
                        suffix = 'document';
                    } else if (jQuery.inArray(ext, sorts['SORT_ZIP']) > -1) {
                        suffix = 'compress';
                    } else if (jQuery.inArray(ext, sorts['SORT_EXE']) > -1) {
                        suffix = 'execute';
                    } else {
                        suffix = 'other';
                    }
                }
                return suffix;
            }
        };
        return GKFile;
    }])
    .factory('GKCilpboard', ['GKFileList','GKMount','GKApi',function (GKFileList,GKMount,GKApi) {
        var GKClipboard = {
            data: null,
            setData: function (data) {
                this.data = data;
            },
            getData: function () {
                return this.data;
            },
            clearData: function () {
                this.data = null;
            },
            isEmpty: function () {
                return !this.data;
            },
            copyModule:function(file,options,resultCallBack){
                var default_param = {
                    imgSize:64,
                    expreeDate:7
                }

                var getTemplate = function(linkUrl,imgUrl,fileName,fileSize,expricess){

                 return '<a style="text-decoration:none;" href="'+linkUrl+'" target="_blank">'+
                        '<table border="0" cellspacing="0" cellpadding="0" style="background-color:#f2f5f5;">'+
                        '<tr>'+
                        '<td rowspan="2" width="64" height="64">'+
                        '<img src="'+imgUrl+'" border="0">'+
                        '</td>'+
                        '<td style="font-size:20px; color:#666666; font-weight:bold;height:30px; line-height:40px; vertical-align:middle;padding-right:10px;" align="left">'+
                         fileName +
                        '</td>'+
                        '</tr>'+
                        '<tr>'+
                        '<td style=" font-size:12px; color:#939ca9; height:30px;line-height:24px;padding-right:10px;">'+
                        '大小:'+fileSize+'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;到期时间:'+expricess+
                        '</td>'+
                        '</tr>'+
                        '</table>'+
                        '</a><br/><br/>';
                };


                var iconUrl = GKApi.getIcon(file.dir,file.filename,default_param.imgSize);
                var currDate = new Date();
                var expireDate = currDate.getTime() + default_param.expreeDate * (24 * 60 * 60 * 1000);
                var mountId = GKFileList.getOptFileMountId(file);
                var mount = GKMount.getMountById(mountId);
                var param = {
                    memberid: file.creator_member_id,
                    mountid: mountId,
                    hash: file.hash,
                    dateline: expireDate / 1000
                }
                var linkUrl = gkClient.gGetShareLink(JSON.stringify(param));
                var sizeLen = file.filesize / (1024 * 1024);
                if (sizeLen < 1) {
                    sizeLen = Math.ceil(file.filesize / 1024) + "KB";
                } else {
                    sizeLen = Math.ceil(sizeLen) + "MB";
                }
                var tem = getTemplate(linkUrl,iconUrl, file.filename, sizeLen, Util.Date.format(new Date(expireDate), 'yyyy年MM月dd日'));
                gkClient.gSetClipboardDataHtml(tem);
                if(typeof resultCallBack == 'function'){
                    resultCallBack(tem);
                }

            }
        };
        return GKClipboard
    }])
    .factory('GKOpt', ['GKFile', 'GKPartition', 'GKMount', '$rootScope', 'GK', '$q', 'GKFileList', 'GKPath', 'GKModal', 'GKOpen', 'GKCilpboard', 'GKException', 'GKApi', 'GKFilter', 'GKFileOpt', 'GKSmartFolder','GKAuth','$timeout','GKFrame', function (GKFile, GKPartition, GKMount, $rootScope, GK, $q, GKFileList, GKPath, GKModal, GKOpen, GKCilpboard, GKException, GKApi, GKFilter, GKFileOpt, GKSmartFolder,GKAuth,$timeout,GKFrame) {
        var GKOpt = {
            checkSubOpt:function(optKeys, subOpts){
                var cloneOpt = angular.extend({}, subOpts);
                angular.forEach(cloneOpt, function (value, key) {
                    if (optKeys.indexOf(key) < 0) {
                        delete cloneOpt[key];
                    }
                });
                return cloneOpt;
            },
            /**
             * 同步，不同步命令的逻辑
             * @param opts
             * @param parentFile 夫目录
             * @param file 设置的目录
             */
            setSyncOpt: function (opts, parentFile, file) {
                this.disableOpt(opts, 'unsync');
                if (!GKFile.isSyncable(parentFile, file)) {
                    this.disableOpt(opts, 'sync', 'unsync');
                } else {
                    if (GKFile.isSynced(parentFile, file)) {
                        this.disableOpt(opts, 'sync');
                    } else {
                        this.disableOpt(opts, 'unsync');
                    }
                }
            },
            getOpts: function (currentFile, selectedFiles, partition, filter, mount, isSearch) {
                var opts,
                    partitionOpts,
                    multiOpts,
                    singleOpts,
                    currentOpts,
                    authOpts;

                partitionOpts = this.getPartitionOpts(partition, filter, mount, isSearch);
                authOpts = this.getAuthOpts(currentFile, selectedFiles, partition, mount);
                if (!selectedFiles || !selectedFiles.length) {
                    currentOpts = this.getCurrentOpts(currentFile, partition);
                    opts = this.getFinalOpts(partitionOpts, currentOpts, authOpts);
                } else {
                    multiOpts = this.getMultiSelectOpts(selectedFiles);
                    singleOpts = this.getSelectOpts(currentFile, selectedFiles);
                    opts = this.getFinalOpts(partitionOpts, multiOpts, singleOpts, authOpts);
                }
                return opts;
            },
            /**
             * 所有默认操作
             * */
            getDefaultOpts: function () {
                return [
                    'goto', //打开位置
                    'open_with', //打开方式
                    'new_file',
                    'new_doc_file',
                    'new_xls_file',
                    'new_ppt_file',
                    'new_txt_file',
                    'new_folder', //新建
                    'create_sync_folder',
                    'add', //添加
                    'clear_trash', //清空回收站
                    'lock',  //锁定
                    'unlock', //解锁
                    'sync',  //同步
                    'unsync',//不同步
                    'save',  //保存到
                    'rename', //重命名
                    'del',   //删除
                    'paste', //粘贴
                    'cut', //剪切
                    'copy', //复制
                    'del_completely', //彻底删除
                    'revert', //还原
                    'view_property',
                    'order_by', //排序
                    'order_by_file_name',
                    'order_by_file_size',
                    'order_by_file_type',
                    'order_by_last_edit_time',
                    'link'
                ];
            },
            /**
             * 根据各个条件的命令计算出所有命令
             * */
            getFinalOpts: function () {
                var optsArr = Array.prototype.slice.call(arguments);
                var opts = this.getDefaultOpts();
                var optLen = opts.length;
                var optsArrLen = optsArr.length;
                for (var i = optLen - 1; i >= 0; i--) {
                    var value = opts[i];
                    for (var j = 0; j < optsArrLen; j++) {
                        var index = opts.indexOf(value);
                        if (optsArr[j].indexOf(value) < 0 && index >= 0) {
                            opts.splice(index, 1);
                        }
                    }
                }

                return opts;
            },
            /**
             * 获取分区的命令
             * */
            getPartitionOpts: function (partition, filter, mount, isSearch) {
                var opts = this.getDefaultOpts();
                if(gkClientInterface.isWindowsClient()){
                    //this.disableOpt(opts, 'new_txt_file');
                }else{
                    this.disableOpt(opts, 'new_doc_file', 'new_ppt_file', 'new_xls_file');
                }
                switch (partition) {
                    case GKPartition.teamFile:
                    case GKPartition.entFile:
                        this.disableOpt(opts, 'nearby', 'unsubscribe');
                        if (filter == 'trash') {
                            this.disableOpt(opts, 'link','new_txt_file','new_ppt_file','new_xls_file','new_doc_file','view_property', 'open_with', 'create_sync_folder', "add", "new_folder", "sync", "unsync", "paste", "rename", "save", "del", "cut", "copy", "lock", "unlock", "order_by", 'manage', 'create');
                        } else {
                            this.disableOpt(opts, "clear_trash", "revert", "del_completely");
                        }
                        if (GKCilpboard.isEmpty()) {
                            this.disableOpt(opts, 'paste');
                        }
                        if(!isSearch){
                            this.disableOpt(opts, 'goto');
                        }
//                        if(GKPartition.isTeamFilePartition(partition)){
//                            this.disableOpt(opts, 'lock','unlock');
//                        }
                        break;
                    case GKPartition.subscribeFile:
                        this.disableOpt(opts, 'lock','unlock','link','new_txt_file','new_ppt_file','new_xls_file','new_doc_file','create_sync_folder', 'new_file', 'goto', "new_folder", "manage", "create", 'add', 'clear_trash', 'sync', 'unsync', 'rename', 'del', 'paste', 'cut', 'lock', 'unlock', 'del_completely', 'revert');
                        break;
                    case GKPartition.smartFolder:
                        this.disableOpt(opts, 'lock','unlock','link','new_txt_file','new_ppt_file','new_xls_file','new_doc_file','del', 'rename', 'create_sync_folder', 'new_file', 'revert', 'del_completely', 'del', 'rename', 'nearby', 'unsubscribe', 'create', 'add', 'clear_trash', 'manage', 'new_folder', 'sync', 'unsync', 'paste', 'copy', 'cut');
                        break;
                };
                if (isSearch) {
                    this.disableOpt(opts, 'new_txt_file','new_ppt_file','new_xls_file','new_doc_file','sync', 'unsync', 'new_file','new_folder', 'add', 'create', 'paste', 'manage');
                }
                return opts;
            },
            /**
             * 获取权限的命令
             * */
            getAuthOpts: function (currentFile, files, partition, mount) {
                var opts = this.getDefaultOpts();
                if (GKPartition.isTeamFilePartition(partition) || GKPartition.isEntFilePartition(partition)) {
//                    if(!GKAuth.check(mount,'','file_write')){
//                        this.disableOpt(opts, 'create');
//                    }
                    /**
                     * 团队文件夹的根目录
                     */
                    if (currentFile.syncpath) {
                        this.disableOpt(opts, 'create_sync_folder');
                    }
                    if (!currentFile.fullpath) {

                    } else {
                        this.disableOpt(opts, 'create');
                    }
                }else{
                    this.disableOpt(opts, 'link');
                }
                return opts;
            },
            /**
             * 获取当前文件夹的命令
             * */
            getCurrentOpts: function (currentFile, partition) {
                var opts = this.getDefaultOpts();
                this.disableOpt(opts, 'link','view_property', "goto", "rename", "save", "cut", "copy", "lock", "unlock", "del", 'revert', 'del_completely');
                if (GKCilpboard.isEmpty()) {
                    this.disableOpt(opts, 'paste');
                }
                this.setSyncOpt(opts, currentFile, currentFile);
                return opts;
            },
            /**
             * 获取多选的命令
             * */
            getMultiSelectOpts: function (files) {
                var opts = this.getDefaultOpts();
                if (files && files.length > 1) {
                    this.disableOpt(opts, 'link','new_file', 'view_property', 'open_with', "goto", "sync", "unsync", "rename", "lock", "unlock");
                }
                return opts;
            },
            /**
             * 获取选中的命令
             * */
            getSelectOpts: function (currentFile, files) {
                var opts = this.getDefaultOpts();
                var context = this;
                angular.forEach(files, function (file) {
                    context.disableOpt(opts, "add", "new_folder",'new_txt_file','new_ppt_file','new_xls_file','new_doc_file', 'new_file', "order_by", 'clear_trash', 'create', 'manage', 'nearby', 'unsubscribe');
                    if (file.dir == 1) {
                        context.disableOpt(opts, 'open_with', 'lock', 'unlock');
                        context.setSyncOpt(opts, currentFile, file);
                    } else {
                        context.disableOpt(opts, 'sync', 'unsync');
                        if (file.lock > 0) {
                            context.disableOpt(opts, 'lock');
                        } else {
                            context.disableOpt(opts, 'unlock');
                        }
                    }
                    if (file.auth < 1) {
                        context.disableOpt(opts, 'del', 'rename');
                    }
                });
                return opts;
            },
            /**
             * disable命令
             * */
            disableOpt: function (opts) {
                var disableOpts = Array.prototype.slice.call(arguments).splice(1);
                var l = opts.length;
                for (var i = opts.length - 1; i >= 0; i--) {
                    if (disableOpts.indexOf(opts[i]) >= 0) {
                        opts.splice(i, 1);
                    }
                }
            },
            getOptByShortCut: function (allOpt, shortCut) {
                var context = this,
                    opt = null,
                    shortCut = shortCut.toLowerCase();
                angular.forEach(allOpt, function (value) {
                    if (!value.accesskeyText) {
                        return;
                    }
                    if (value.items) {
                        opt = context.getOptByShortCut(value.items, shortCut);
                    } else {
                        if (value.accesskeyText.toLowerCase() === shortCut) {
                            opt = value;
                            return false;
                        }
                    }
                });
                return opt;
            },
            del: function (mountId, fullpathes) {
                var mount = GKMount.getMountById(mountId);
                if(!mount){
                    return;
                }
                if(!GKAuth.check(mount,'','file_delete')){
                    alert('你没有权限删除当前库下的文件或文件夹');
                    return;
                }
                var files = [];
                angular.forEach(fullpathes, function (value) {
                    files.push({
                        webpath: value
                    })
                });
                var params = {
                    list: files,
                    mountid: mountId
                };
                var confirmMsg = '确定要删除' + (fullpathes.length == 1 ? '“' + Util.String.baseName(fullpathes[0]) + '”' : '这' + fullpathes.length + '个文件（夹）') + '吗?';
                if (!confirm(confirmMsg)) {
                    return;
                }
                GK.del(params).then(function () {
                    $rootScope.$broadcast('editFileSuccess', 'del', mountId, fullpathes);
                }, function (error) {
                    GKException.handleClientException(error);
                });
            },
            unsubscribe: function (org_id) {
                if (!confirm('你确定要取消订阅该云库？')) {
                    return;
                }
                GKApi.teamQuit(org_id).success(function () {
                    gkClientInterface.notice({type: 'removeOrg', 'org_id': Number(org_id)}, function (param) {
                        if (param) {
                            $rootScope.$broadcast('RemoveOrgObject', {'org_id': org_id});
                        }
                    })
                }).error(function (request) {
                        GKException.handleAjaxException(request);
                    });
            },
            clearTrash: function (mountId) {
                var mount = GKMount.getMountById(mountId);
                if(!mount) return;
                if(!GKAuth.check(mount,'','file_delete_com')){
                    alert('你没有权限清空该云库的回收站');
                    return;
                }
                if (!confirm('确定要清空该回收站？')) {
                    return;
                }
                GKApi.clear(mountId).success(function () {
                    $rootScope.$broadcast('clearTrashSuccess', mountId);
                }).error(function (request) {
                        GKException.handleAjaxException(request);
                    });
            },
            setOrder: function ($scope, type, asc) {
                var orderAsc = $scope.order.slice(0, 1);
                if (asc === undefined) {
                    asc = orderAsc == '+' ? '-' : '+';
                }
                $scope.order = asc + type;
            },
            getAccessKey:function(cmd){
                var accesskeyMap = {
                    copy:{
                        mac:'⌘C',
                        pc:'Ctrl+C'
                    },
                    cut:{
                        mac:'⌘X',
                        pc:'Ctrl+X'
                    },
                    paste:{
                        mac:'⌘V',
                        pc:'Ctrl+V'
                    },
                    del:{
                        mac:'',
                        pc:'Delete'
                    },
                    save:{
                        mac:'⌘S',
                        pc:'Ctrl+S'
                    },
                    view_property:{
                        mac:'⌘P',
                        pc:'Ctrl+P'
                    }
                };
                var os = gkClientInterface.isMacClient()?'mac':'pc';
                cmd = cmd.toLowerCase();
                return accesskeyMap[cmd]?accesskeyMap[cmd][os] ||'':'';
            },

            getAllOpts: function ($scope,selectedFile) {
                var context = this;
                var toggleSync = function (isSync) {
                    var params,
                        setParentFile = true,
                        file;
                    if (selectedFile && selectedFile.length == 1) {
                        setParentFile = false;
                        file = selectedFile[0];
                    } else {
                        file = $rootScope.PAGE_CONFIG.file;
                    }
                    if (isSync) { //取消同步
                        if (!confirm('确定取消同步"' + file.filename + '" 吗？取消后，两个文件夹将来发生的变化不会相互同步。')) {
                            return;
                        }
                        params = {
                            webpath: file.fullpath,
                            mountid: $rootScope.PAGE_CONFIG.mount.mount_id
                        }
                        GK.removeLinkPath(params).then(function () {
                            $rootScope.$broadcast('editFileSuccess', 'unsync', GKFileList.getOptFileMountId(file), file.fullpath)
                        });
                    } else {
                        if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_write')){
                            alert('你没有权限在当前云库同步文件夹');
                            return;
                        }
                        GKModal.sync($rootScope.PAGE_CONFIG.mount.mount_id, file.fullpath);
                    }
                };

                var getCilpFileData = function () {
                    var files = [];
                    angular.forEach(selectedFile, function (value) {
                        files.push({
                            webpath: value.fullpath,
                            dir: Number(value.dir)
                        })
                    });
                    return files;
                }
                var checkCreate = function(){
                    if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_write')){
                        alert('你没有权限在当前云库新建文件或文件夹');
                        return false;
                    }
                    return true;
                };
                var allOpt = {
                    'goto': {
                        key:'goto',
                        name: '位置',
                        index: 0,
                        icon: 'icon_location',
                        className: "goto",
                        callback: function () {
                            var file = selectedFile[0];
                            var mountId = GKFileList.getOptFileMountId(file);
                            var fullpath = file.fullpath;
                            var upPath = Util.String.dirName(fullpath);
                            $timeout(function(){
                                GKPath.gotoFile(mountId, upPath, fullpath);
                            })
                        }
                    },
                    'open_with': {
                        key:'open_with',
                        name: '打开方式',
                        index: 0,
                        icon: 'icon_open_with',
                        className: "open_with",
                        items: {}
                    },
                    'new_file': {
                        key:'new_file',
                        name: '新建',
                        className: "new_folder",
                        icon: 'icon_newfolder',
                        index: 1,
                        items: {
                            'new_folder': {
                                name: '新建文件夹',
                                index: 0,
                                className: "new_folder",
                                callback: function () {
                                    if(!checkCreate()){
                                        return;
                                    }
                                    if (arguments.length <= 1) {
                                        $scope.createNewFileExt = '';
                                        $scope.createNewFolder = true;
                                    } else {
                                        $scope.$apply(function () {
                                            $scope.createNewFileExt = '';
                                            $scope.createNewFolder = true;
                                        })
                                    }
                                }
                            },
                            'create': {
                                name: '创建公开文件夹',
                                index: 1,
                                className: "create",
                                callback: function () {
                                    if(!checkCreate()){
                                        return;
                                    }
                                    GKModal.createTeamFolder($scope.mountId, '', 1);
                                }
                            },
                            'create_sync_folder': {
                                name: '创建同步文件夹',
                                index: 2,
                                className: "sync_folder",
                                callback: function () {
                                    if(!checkCreate()){
                                        return;
                                    }
                                    var mountId = $scope.mountId;
                                    var fullpath = $rootScope.PAGE_CONFIG.file.fullpath;
                                    if($rootScope.PAGE_CONFIG.file.syncpath){
                                        alert('不能在已同步的目录中再创建同步文件夹');
                                        return;
                                    }
                                    var localUri = '', defaultName = '';
                                   gkClientInterface.selectPath({
                                        disable_root: 1
                                    },function(re){
                                        localUri = re.path;
                                        if (!localUri) {
                                            return;
                                        }
                                        defaultName = Util.String.baseName(Util.String.rtrim(Util.String.rtrim(localUri, '/'), '\\\\'));

                                        if (!defaultName) return;
                                        var syncPath = fullpath + (fullpath ? '/' : '') + defaultName;
                                        var params = {
                                            webpath: syncPath,
                                            fullpath: localUri,
                                            mountid: mountId
                                        };
                                        gkClientInterface.setLinkPath(params, function () {
                                            $rootScope.$broadcast('editFileSuccess', 'create', mountId, fullpath, {fullpath: syncPath});
                                        })
                                    });


                                }
                            },
                            'new_doc_file': {
                                name: '新建Word文档',
                                index: 3,
                                className: "new_doc_file",
                                callback: function () {
                                    if(!checkCreate()){
                                        return;
                                    }
                                    if (arguments.length <= 1) {
                                        $scope.createNewFileExt = 'doc';
                                        $scope.createNewFolder = true;
                                    } else {
                                        $scope.$apply(function () {
                                            $scope.createNewFileExt = 'doc';
                                            $scope.createNewFolder = true;
                                        })
                                    }

                                }
                            },
                            'new_ppt_file': {
                                name: '新建PPT文档',
                                index: 4,
                                className: "new_ppt_file",
                                callback: function () {
                                    if(!checkCreate()){
                                        return;
                                    }
                                    if (arguments.length <= 1) {
                                        $scope.createNewFileExt = 'ppt';
                                        $scope.createNewFolder = true;
                                    } else {
                                        $scope.$apply(function () {
                                            $scope.createNewFileExt = 'ppt';
                                            $scope.createNewFolder = true;
                                        })
                                    }

                                }
                            },
                            'new_xls_file': {
                                name: '新建Excel文档',
                                index: 5,
                                className: "new_xls_file",
                                callback: function () {
                                    if(!checkCreate()){
                                        return;
                                    }
                                    if (arguments.length <= 1) {
                                        $scope.createNewFileExt = 'xls';
                                        $scope.createNewFolder = true;
                                    } else {
                                        $scope.$apply(function () {
                                            $scope.createNewFileExt = 'xls';
                                            $scope.createNewFolder = true;
                                        })
                                    }

                                }
                            },
                            'new_txt_file': {
                                name: '新建文本文档',
                                index: 6,
                                className: "new_txt_file",
                                callback: function () {
                                    if(!checkCreate()){
                                        return;
                                    }
                                    if (arguments.length <= 1) {
                                        $scope.createNewFileExt = 'txt';
                                        $scope.createNewFolder = true;
                                    } else {
                                        $scope.$apply(function () {
                                            $scope.createNewFileExt = 'txt';
                                            $scope.createNewFolder = true;
                                        })
                                    }

                                }
                            },
                        }
                    },
                    'manage': {
                        key:'manage',
                        index: 4,
                        name: '管理',
                        icon: 'icon_setting',
                        className: "manage",
                        callback: function () {
                            GKOpen.manage($rootScope.PAGE_CONFIG.mount.org_id);
                        }
                    },
                    'clear_trash': {
                        key:'clear_trash',
                        index: 5,
                        name: '清空回收站',
                        icon: 'icon_del',
                        className: "clear_trash",
                        callback: function () {
                            GKOpt.clearTrash($scope.PAGE_CONFIG.mount.mount_id);
                        }
                    },
                    'revert': {
                        key:'revert',
                        index: 6,
                        name: '还原',
                        icon: 'icon_recover',
                        className: "revert",
                        callback: function () {
                            var list = [];
                            angular.forEach(selectedFile, function (value) {
                                list.push({
                                    webpath: value.fullpath
                                });
                            });
                            var param = {
                                mountid: $rootScope.PAGE_CONFIG.mount.mount_id,
                                list: list
                            };
                            GK.recover(param).then(function () {
                                angular.forEach(selectedFile, function (value) {
                                    angular.forEach($scope.fileData, function (file, key) {
                                        if (value == file) {
                                            $scope.fileData.splice(key, 1);
                                        }
                                    })
                                });
                                GKFileList.unSelectAll($scope);
                            })
                        }
                    },
                    'del_completely': {
                        key:'del_completely',
                        index: 20,
                        name: '彻底删除',
                        className: "del_completely",
                        icon: 'icon_disable',
                        callback: function () {
                                if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_delete_com')){
                                    alert('你没有权限彻底删除当前云库下的文件或文件夹');
                                    return;
                                }
                                var fullpaths = [];
                                var hasDir = false;
                                angular.forEach(selectedFile, function (value) {
                                    if(value.dir==1){
                                        hasDir = true;
                                    }
                                    fullpaths.push(value.dir == 1 ? value.fullpath + '/' : value.fullpath);
                                });
                                var msg;
                                if(selectedFile.length ==1){
                                    msg = '你确定要删除这个文件'+(hasDir?'夹':'')+'？';
                                }else{
                                    msg = '你确定要删除这'+selectedFile.length+'个文件'+(hasDir?'和文件夹':'')+'？';
                                }
                                if(!confirm(msg)){
                                    return;
                                }
                                GKApi.delCompletely($rootScope.PAGE_CONFIG.mount.mount_id, fullpaths).success(function () {
                                    $scope.$apply(function(){
                                        angular.forEach(selectedFile, function (value) {
                                            angular.forEach($scope.fileData, function (file, key) {
                                                if (value == file) {
                                                    $scope.fileData.splice(key, 1);
                                                }
                                            })
                                        });
                                        GKFileList.unSelectAll();
                                    })
                                }).error(function () {

                                    });
                        }
                    },
                    'sync': {
                        key:'sync',
                        index: 8,
                        name: '同步',
                        className: "sync",
                        icon: 'icon_sync',
                        callback: function () {
                            toggleSync(0);
                        }
                    },
                    'unsync': {
                        key:'unsync',
                        index: 9,
                        name: '取消同步',
                        className: "unsync",
                        icon: 'icon_disable',
                        callback: function () {
                            toggleSync(1);
                        }
                    },
                    'paste': {
                        key:'paste',
                        index: 10,
                        name: '粘贴',
                        className: "paste",
                        icon: 'icon_paste',
                        accesskeyText: context.getAccessKey('paste'),
                        callback: function () {
                            if (GKPartition.isSmartFolderPartition($rootScope.PAGE_CONFIG.partition) || GKPartition.isSubscribePartition($rootScope.PAGE_CONFIG.partition) || $scope.filter == 'trash') {
                                alert('不能在当前路径添加文件');
                                return;
                            }
                            if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_write')){
                                alert('你没有权限将文件或文件夹粘贴到当前云库中');
                                return;
                            }
                            var data = GKCilpboard.getData();
                            var targetMount = $rootScope.PAGE_CONFIG.mount;
                             if(data && data.files && data.files.length && data.mount_id){
                                 var target = $rootScope.PAGE_CONFIG.file.fullpath;
                                 if (selectedFile.length == 1 && selectedFile[0].dir==1) {
                                     target = selectedFile[0].fullpath;
                                 }
                                 var fromMount = GKMount.getMountById(data.mount_id);
                                 if(!fromMount) return;
                                 if(targetMount.storage_point != fromMount.storage_point){
                                     alert('不同的存储点之间不能复制或移动文件');
                                     return;
                                 }
                                 //清空剪切板的内容，如果不清空会跟系统的剪切板冲突
                                 GKCilpboard.clearData();
                                 if (data.code == 'ctrlC') {
                                     GKFileOpt.copy(target, $rootScope.PAGE_CONFIG.mount.mount_id, data.files, data.mount_id).then(function () {
                                         GKFileList.refreahData($scope);
                                     }, function (error) {
                                         GKException.handleClientException(error);
                                     });
                                 } else if (data.code == 'ctrlX') {
                                     if($rootScope.PAGE_CONFIG.mount.mount_id != data.mount_id){
                                         alert('不能将文件或文件夹剪切到另一个云库中');
                                         return;
                                     }
                                     GKFileOpt.move(target, $rootScope.PAGE_CONFIG.mount.mount_id, data.files, data.mount_id).then(function () {
                                         GKFileList.refreahData($scope);
                                         $scope.$broadcast('refreshOpt');
                                     }, function (error) {
                                         GKException.handleClientException(error);
                                     });
                                 }
                             }else{
                                 var sysData = gkClientInterface.getClipboardData();
                                 if(!sysData || !sysData.list || !sysData.list.length){
                                     return;
                                 }
                                 if($rootScope.PAGE_CONFIG.mode == 'chat'){
                                     GKModal.selectFile(targetMount.mount_id,'请选择添加到哪个目录').result.then(function(re){
                                         var iframe = GKFrame('ifame_chat');
                                         if(iframe && typeof iframe.gkFrameCallback !== 'undefined'){
                                             if(!re || re.selectedPath === undefined) return;
                                             angular.extend(re,{
                                                 list:sysData.list
                                             });
                                             iframe.gkFrameCallback('selectAddDirSuccess',re);
                                         }
                                     });
                                 }else{
                                     var params = {
                                         parent: $rootScope.PAGE_CONFIG.file.fullpath,
                                         type: 'save',
                                         list: sysData.list,
                                         mountid: targetMount.mount_id
                                     };
                                     GK.addFile(params).then(function () {
                                         GKFileList.refreahData($scope);
                                     }, function (error) {
                                         GKException.handleClientException(error);
                                     })
                                 }
                             }
                        }
                    },
                    'cut': {
                        key:'cut',
                        index: 11,
                        name: '剪切',
                        className: "cut",
                        icon: 'icon_cut',
                        accesskeyText: context.getAccessKey('cut'),
                        callback: function () {
                            if (!selectedFile || !selectedFile.length) {
                                return;
                            }

                            if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_delete')){
                                alert('你没有权限删除当前库下的文件或文件夹');
                                return;
                            }

					       var hasUploadFile = false;
                            angular.forEach(selectedFile,function(file){
                                if(file.status == 1){
                                    hasUploadFile = true;
                                    return false;
                                }
                            })
                            if(hasUploadFile){
                               alert('上传中的文件或文件夹不能剪切');
                               return;
                            }
                            var data = {
                                code: 'ctrlX',
                                mount_id: $rootScope.PAGE_CONFIG.mount.mount_id,
                                files: getCilpFileData()
                            }
                            GKCilpboard.setData(data);
                        }
                    },
                    'copy': {
                        key:'copy',
                        index: 12,
                        name: '复制',
                        className: "copy",
                        icon: 'icon_copy',
                        accesskeyText: context.getAccessKey('copy'),
                        callback: function () {
                            if (!selectedFile || !selectedFile.length) {
                                return;
                            }
                            if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_read')){
                                alert('你没有权限复制当前云库下的文件或文件夹');
                                return;
                            }
                            var data = {
                                code: 'ctrlC',
                                mount_id: $rootScope.PAGE_CONFIG.mount.mount_id,
                                files: getCilpFileData()
                            };

                            GKCilpboard.setData(data);
                        }
                    },
                    'add': {
                        key:'add',
                        index: 2,
                        name: '添加到云库',
                        className: "add",
                        icon: 'icon_download',
                        callback: function () {
                         var mount = GKMount.getMountById($scope.mountId);
                         if(!mount) return;
                         if(!GKAuth.check(mount,'','file_write')){
                             alert('你没有权限在当前云库下添加文件或文件夹');
                             return;
                         }
                         gkClientInterface.addFileDialog(function(addFiles){
                                if (!addFiles || !addFiles.list || !addFiles.list.length) {
                                    return;
                                }
                                var params = {
                                    parent: $scope.path,
                                    type: 'save',
                                    list: addFiles.list,
                                    mountid: $scope.mountId
                                };
                                GK.addFile(params).then(function () {
                                    GKFileList.refreahData($scope);
                                }, function (error) {
                                    GKException.handleClientException(error);
                                })
                            });

                        }
                    },
                    'lock': {
                        key:'lock',
                        index: 14,
                        name: '锁定',
                        className: "lock",
                        icon: 'icon_lock',
                        callback: function () {
                            var file = selectedFile[0];
                            var mountId = GKFileList.getOptFileMountId(file);
                            var mount = GKMount.getMountById(mountId);
                            if(!mount) return;
                            if(!GKAuth.check(mount,'','file_write')){
                                alert('你没有权限锁定该文件');
                                return;
                            }
                            GK.lock({
                                webpath: file.fullpath,
                                mountid: mountId
                            }).then(function () {
                                 $rootScope.$broadcast('editFileSuccess','lock', mountId,file.fullpath);
                                },function(re){
                                GKException.handleClientException(re);
                            })

                        }
                    },
                    'unlock': {
                        key:'unlock',
                        index: 15,
                        name: '解锁',
                        className: "unlock",
                        icon: 'icon_unlock',
                        callback: function () {
                            var file = selectedFile[0];
                            var mountId = GKFileList.getOptFileMountId(file);
                            if (file.lock_member_id != $rootScope.PAGE_CONFIG.user.member_id) {
                                alert(file.lock_member_name + ' 已经锁定了这个文件。你只能以只读方式查看它。如果你需要修改它，请让 ' + file.lock_member_name + ' 先将其解锁。');
                                return;
                            }
                            GK.unlock({
                                webpath: file.fullpath,
                                mountid: mountId
                            }).then(function () {
                                    $rootScope.$broadcast('editFileSuccess','unlock', mountId,file.fullpath);
                                },function(re){
                                GKException.handleClientException(re);
                            })

                        }
                    },
                    'save': {
                        key:'save',
                        index: 16,
                        name: '保存到本地',
                        className: "save",
                        icon: 'icon_save',
                        accesskeyText: context.getAccessKey('save'),
                        callback: function () {
                            if (!selectedFile || !selectedFile.length) {
                                return;
                            }
                            if(GKPartition.isMountPartition($rootScope.PAGE_CONFIG.partition)){
                                if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_read')){
                                    alert('你没有权限保存该云库下的文件或文件夹');
                                    return;
                                }
                            }
                            var unAuthFile;
                            var files = [];
                            angular.forEach(selectedFile, function (value) {
                                var mountId = GKFileList.getOptFileMountId(value);
                                var mount = GKMount.getMountById(mountId);
                                if(!mount){
                                    return;
                                }
                                if(!GKAuth.check(mount,'','file_read')){
                                    unAuthFile = value;
                                    return false;
                                }
                                files.push({
                                    webpath: value.fullpath,
                                    mountid: GKFileList.getOptFileMountId(value),
                                    dir: Number(value.dir)
                                })
                            });

                            if(unAuthFile){
                                alert('你没有权限保存 ' + unAuthFile.filename);
                                return;
                            }
                            var params = {
                                list: files
                            };
                            GK.saveToLocal(params);
                        }
                    },
                    'del': {
                        key:'del',
                        index: 22,
                        name: '删除',
                        className: "del",
                        icon: 'icon_trash',
                        accesskeyText: context.getAccessKey('del'),
                        callback: function () {
                            if (!selectedFile || !selectedFile.length) {
                                return;
                            }
                            var fullpathes = [];
                            var mountId = GKFileList.getOptFileMountId();
                            angular.forEach(selectedFile, function (value) {
                                fullpathes.push(value.fullpath);
                            });
                            GKOpt.del(mountId, fullpathes);
                        }
                    },
                    'rename': {
                        key:'rename',
                        index: 18,
                        name: '重命名',
                        className: "rename",
                        icon: 'icon_rename',
                        callback: function () {
                            var file = selectedFile[0];
                            var mountId = GKFileList.getOptFileMountId(file);
                            var mount = GKMount.getMountById(mountId);
                            if(!mount){
                                return;
                            }
                            if(!GKAuth.check(mount,'','file_write')){
                                alert('你没有权限重命名该文件'+(file.dir==1?'夹':''));
                                return;
                            }
			                if(file.status==1){
                                alert('上传中的文件或文件夹不能重命名');
                                return;
                            }
                            if (arguments.length <= 1) {
                                file.rename = true;
                            }else{
                                $scope.$apply(function(){
                                    file.rename = true;
                                })
                            }
                        }
                    },
                    'link': {
                        key:'link',
                        index: 19,
                        name: '分享链接',
                        className: "file_link",
                        icon: 'icon_link',
                        callback: function () {
                            if (selectedFile.length != 1) {
                                return;
                            }
                            var file = selectedFile[0],
                                parentFile = $rootScope.PAGE_CONFIG.file;
                            var mountId = GKFileList.getOptFileMountId(file);
                            var mount = GKMount.getMountById(mountId);
                            if(!mount){
                                return;
                            }
                            if(file.status==1){
                                alert('上传中的文件不能获取分享链接');
                                return;
                            }
                            if(mount.ent_id == 1 && !GKAuth.check(mount,'','file_link')){
                                alert('你没有权限获取该文件的分享链接');
                                return;
                            }
                            GKModal.publish(mountId,file);
                        }
                    },
                    'view_property': {
                        key:'view_property',
                        index: 20,
                        name: '属性',
                        className: "file_property",
                        icon: 'icon_file_property',
                        accesskeyText: context.getAccessKey('view_property'),
                        callback: function () {
                            if (selectedFile.length != 1) {
                                return;
                            }
                            var file = selectedFile[0],
                                parentFile = $rootScope.PAGE_CONFIG.file;
                            var mountId = GKFileList.getOptFileMountId(file);
                            GKModal.filePropery(mountId, file);
                        }
                    },
                    'order_by': {
                        key:'order_by',
                        index: 21,
                        name: '排序方式',
                        icon: 'icon_orderby',
                        className: "order_by",
                        items: {
                            'order_by_file_name': {
                                name: '文件名',
                                className: 'order_by_file_name' + ($scope.order.indexOf('file_name') >= 0 ? 'current' : ''),
                                callback: function () {
                                    $scope.$apply(function () {
                                        GKOpt.setOrder($scope, 'filename');
                                    });
                                }
                            },
                            'order_by_file_size': {
                                name: '大小',
                                className: 'order_by_file_size' + ($scope.order.indexOf('file_size') >= 0 ? 'current' : ''),
                                callback: function () {
                                    $scope.$apply(function () {
                                        GKOpt.setOrder($scope, 'filesize');
                                    });
                                }
                            },
                            'order_by_file_type': {
                                name: '类型',
                                className: 'order_by_file_type' + ($scope.order.indexOf('file_type') >= 0 ? 'current' : ''),
                                callback: function () {
                                    $scope.$apply(function () {
                                        GKOpt.setOrder($scope, 'ext');
                                    });
                                }
                            },
                            'order_by_last_edit_time': {
                                name: '最后修改时间',
                                className: 'order_by_last_edit_time' + ($scope.order.indexOf('last_edit_time') >= 0 ? 'current' : ''),
                                callback: function () {
                                    $scope.$apply(function () {
                                        GKOpt.setOrder($scope, 'last_edit_time');
                                    })

                                }
                            }
                        }
                    }
                };
                return allOpt;
            }
        };
        return GKOpt
    }])
    .factory('GKFileListView', ['$compile','$filter','$rootScope',function ($compile,$filter,$rootScope) {
        var fileListElem = angular.element('.file_list .list_body');
        var GKFileListView = {
            getFileItem:function(index){
                return fileListElem.find('> div > .file_item:eq('+index+')');
            },
            selectItem:function(index){
                this.getFileItem(index).removeClass('item-hover');
                this.getFileItem(index).addClass('selected');
            },
            unselectItem:function(index){
                this.getFileItem(index).removeClass('selected');
            },
            hoverItem:function(index){
                if(this.getFileItem(index).attr("class").indexOf('selected')< 0) {
                    this.getFileItem(index).addClass('item-hover');
                    this.getFileItem(index).css('background-color', '#e1e3e7');
                }
            },
            unhoverItem:function(index){
                this.getFileItem(index).removeAttr('style');
                this.getFileItem(index).removeClass('item-hover');
            },
            removeFileItem:function(index){
                this.getFileItem(index).remove();
            },
            updateFileItem:function(index,file){
                var PAGE_CONFIG = $rootScope.PAGE_CONFIG;
                var oldFileItem = this.getFileItem(index);
                oldFileItem.data('fullpath',file.fullpath);
                oldFileItem.find('.file_name span').prop({
                    'title':file.fullpath
                }).text(file.filename);

                oldFileItem.find('.file_name,.thumb,.file_icon_wrapper').prop({
                    'title':file.fullpath
                });

                var icon = $filter('getFileIcon')(file.filename, file.dir, 0, (file.sync || PAGE_CONFIG.file.syncpath ? 1 : 0)),
                    thumbUrl = '';
                var thumbIcon = oldFileItem.find('.thumb i'),
                    fionIcon = oldFileItem.find('.file_icon_wrapper i');

                if(['jpg','jpeg','png','gif','bmp'].indexOf(file.ext)>=0){
                    thumbUrl = $filter('getThumbUrl')(file.hash, file.filehash,file.fullpath)
                }
                angular.forEach([thumbIcon, fionIcon], function (elem) {
                    elem.removeClass();
                    if(thumbIcon == elem){
                        thumbIcon.addClass('file_icon128x128 '+icon);
                    }else{
                        fionIcon.addClass('file_icon '+icon);
                    }
                    if(thumbUrl){
                        var thumbImg = elem.find('img');
                        if (thumbImg.size()) {
                            thumbImg.prop('src', thumbUrl);
                        }
                    }
                    elem.find('s').remove();
                    if(file.status ==1){
                        elem.append('<s class="icon16x16 icon_up"></s>');
                    }else if(file.status==2){
                        elem.append('<s class="icon16x16 icon_down"></s>');
                    }
                    if(file.lock>0){
                        elem.append('<s class="icon16x16 '+(file.lock==1?'icon_lock_green':'icon_edit_color')+'" title="已被'+(file.lock==1?file.lock_member_name:'我')+'锁定"></s>');
                    }
                })
                var atts = {
                    'last_edit_time':$filter('date')(file.last_edit_time*1000,'yyyy/MM/dd HH:mm'),
                    'file_type':$filter('getFileType')(file.filename,file.dir,file.ext),
                    'file_size':file.dir==1?'-':$filter('bitSize')(file.filesize)
                };
                angular.forEach(atts,function(value,key){
                    if(key == 'last_edit_time'){
                        $(oldFileItem.find('.' + key + ' span')[0]).text(value);
                    }
                    else {
                        oldFileItem.find('.' + key + ' span').text(value);
                    }
                })
                return oldFileItem;
            }
        };
        return GKFileListView;
    }])
    .factory('GKFileList', ['$location', '$q', 'GKFile', 'GKApi', 'GKPartition', '$filter', 'GKException', 'GKFilter', '$rootScope', 'GKFileListView', '$timeout', 'GKSmartFolder', 'GKAuth','GKMount','GKSope','smartSearchConfig','GKPath',function ($location, $q, GKFile, GKApi, GKPartition, $filter, GKException, GKFilter, $rootScope, GKFileListView, $timeout, GKSmartFolder,GKAuth,GKMount,GKSope,smartSearchConfig,GKPath) {
        var selectedFile = [];
        var selectedIndex = [];
        var selectedPath = '';
        var fileListElem = jQuery('.file_list');
        var currentView = 'list';
        var smartFileList;
        var lastSelectTimeout,lastUnSelectTimeout;
        var GKFileList = {
            setOrder: function ($scope, type, asc) {
                var orderAsc = $scope.order.slice(0, 1);
                if (asc === undefined) {
                    asc = orderAsc == '+' ? '-' : '+';
                }
                $scope.order = asc + type;
            },
            checkIsSelectedByIndex:function(index){
                return selectedIndex.indexOf(index) >=0;
            },
            select: function ($scope, index, multiSelect) {
                if(lastSelectTimeout){
                    $timeout.cancel(lastSelectTimeout);
                }
                multiSelect = !angular.isDefined(multiSelect) ? false : multiSelect;
                if (!multiSelect && selectedFile && selectedFile.length) {
                    this.unSelectAll($scope);
                }
                if (selectedIndex.indexOf(index) < 0) {
                    GKFileListView.selectItem(index);
                    selectedFile.push($scope.fileData[index]);
                    selectedIndex.push(index);
                    //lastSelectTimeout = $timeout(function(){
                        $scope.setOpts(selectedFile);
                        GKSope.rightSidebar.setRightSidebar(selectedFile);
                    //},0)

                    //$scope.$broadcast('selectedFileChange',selectedFile);
                }
            },
            unSelect: function ($scope, index) {
                if(lastUnSelectTimeout){
                    $timeout.cancel(lastUnSelectTimeout);
                }
                var i = selectedIndex.indexOf(index);
                if (i >= 0) {
                    GKFileListView.unselectItem(index);
                    selectedIndex.splice(i, 1);
                    selectedFile.splice(i, 1);
                    //lastUnSelectTimeout = $timeout(function(){
                       $scope.setOpts(selectedFile);
                       GKSope.rightSidebar.setRightSidebar(selectedFile);
                    //},0)
                    //$scope.$broadcast('selectedFileChange',selectedFile);
                }
            },
            unSelectAll: function ($scope) {
                for (var i = selectedIndex.length - 1; i >= 0; i--) {
                    this.unSelect($scope, selectedIndex[i]);
                }
            },
            selectByPath: function ($scope, path) {
                var context = this;
                angular.forEach($scope.fileData, function (value, index) {
                    if (value.fullpath === path) {
                        context.select($scope, index, true);
                    }
                });
            },
            reIndex: function (fileData) {
                var newSelectedIndex = [];
                var newSelectedFile = [];
                angular.forEach(fileData, function (value, key) {
                    angular.forEach(selectedFile, function (file) {
                        if (value.fullpath == file.fullpath) {
                            newSelectedIndex.push(key);
                            newSelectedFile.push(file);
                        }
                    });
                });
                selectedIndex = newSelectedIndex;
                selectedFile = newSelectedFile;
            },
            getSelectedIndex: function () {
                return selectedIndex;
            },
            getSelectedFile: function () {
                return selectedFile;
            },
            changeView: function ($scope, view) {
                if($scope.oldView != $scope.view && $scope.view != $scope.fileUpdate.fileUpdateView) {
                    $scope.oldView = $scope.view;
                }
                $scope.view = currentView = view;
                if(view && view == $scope.fileUpdate.fileUpdateView) {
                    $scope.showHint = false;
                    if($scope.showDisscussHitoryWin){
                        $scope.$broadcast('closeDiscussHistory');
                    }
                    //更新视图
                    $scope.fileUpdate.isFileUpdateView = true;
                    $scope.setOpts();
                    $scope.limit = 100;
                    $scope.breads = GKPath.getBread($scope);
                    GKFileList.unSelectAll($scope);
                    GKFileList.refreahData($scope);
                }else{
                    $scope.showHint = $rootScope.PAGE_CONFIG.file.syncpath?true:false;
                    $scope.order = "+filename";
                    if($scope.fileUpdate.isFileUpdateView) {
                        if($scope.showDisscussHitoryWin){
                            $scope.$broadcast('closeDiscussHistory');
                        }
                        GKFileList.unSelectAll($scope);
                        $scope.breads = GKPath.getBread();
                        $scope.fileUpdate.isFileUpdateView = false;
                        GKFileList.refreahData($scope);
                    }else{
                        $scope.fileData = $scope.fileDataArr;
                    }
                    $scope.setOpts();
                }
            },
            getCurrentView:function(){
              return currentView;
            },
            getOptFileMountId: function (file) {
                var mountID = 0;
                if (file && file.mount_id) {
                    mountID = file.mount_id;
                } else if ($rootScope.PAGE_CONFIG.mount) {
                    mountID = $rootScope.PAGE_CONFIG.mount.mount_id || 0;
                }
                return Number(mountID);
            },
            remove: function ($scope, value) {
                var context = this;
                angular.forEach($scope.fileData, function (file, key) {
                    if (value == file) {
                        $scope.fileData.splice(key, 1);
                        if(selectedIndex.indexOf(key)>=0){
                            context.unSelect($scope,key);
                        }
                        //如果删除的是文件夹，则去除访问历史
                        if(file.dir == 1)
                            $rootScope.PAGE_CONFIG.visitHistory.removeHistory(file.fullpath,$rootScope.PAGE_CONFIG.mount.mount_id);
                    }
                })
            },
            removeAllSelectFile: function ($scope) {
                var context = this;
                angular.forEach(selectedFile, function (value) {
                    context.remove($scope, value);
                });
                GKFileList.unSelectAll($scope);
            },
            getPreNameByExt:function(ext){
                var preName = '';
                switch (ext){
                    case 'doc':
                        preName = '新建 Microsoft Word 文档';
                        break;
                    case 'xls':
                        preName = '新建 Microsoft Excel 工作表';
                        break;
                    case 'ppt':
                        preName = '新建 Microsoft PowerPoint 演示文稿';
                        break;
                    case 'txt':
                        preName = '新建文本文档';
                        break;
                    default :
                        preName = '新建文件夹';
                        break;
                }
                return preName;
            },
            getDefualtNewName: function ($scope,ext) {
                ext = angular.isDefined(ext)?ext:'';
                var preName = this.getPreNameByExt(ext);
                var count = 0;
                do {
                    var exist = false;
                    var defaultFileName = preName + (!count ? '' : '(' + count + ')')+(ext?'.'+ext:'');
                    angular.forEach($scope.fileData, function (value) {
                        if (String(value.filename) === defaultFileName) {
                            exist = true;
                            return false;
                        }
                    });
                    count++;
                } while (exist);
                return defaultFileName;
            },
            getFileData: function ($scope, options) {
                var defaultOptions = {
                    start:0
                }
                options = angular.extend({},defaultOptions,options);
                var fileList,
                    source = 'client',
                    deferred = $q.defer();
                if ($scope.search) {
                    var searchArr = $scope.search.split('|');
                    if (searchArr[1] == smartSearchConfig.name || (GKPartition.isMountPartition($scope.partition) && $scope.filter != 'trash')) {
                        source = 'api';
                        $rootScope.$broadcast('searchStateChange','loading');
                        var fileSearch = new GKFileSearch();
                        fileSearch.conditionIncludeKeyword(searchArr[0]);
                        var mountId = 0;
                        if(['mount','path'].indexOf(searchArr[1])>=0){
                            fileSearch.conditionIncludeMountId($scope.PAGE_CONFIG.mount.mount_id);
                            mountId = $scope.PAGE_CONFIG.mount.mount_id;
                        }

                        if(searchArr[1] == 'path'){
                            fileSearch.conditionIncludePath($scope.path);
                        }
                        var condition = fileSearch.getCondition();
                        GKApi.searchFile(condition, mountId).success(function (data) {
                            $rootScope.$broadcast('searchStateChange','end');
                            fileList = data['list'];
                            deferred.resolve(GKFile.dealFileList(fileList, source));
                        }).error(function (request) {
                                $rootScope.$broadcast('searchStateChange','end');
                                deferred.reject(GKException.getAjaxErrorMsg(request));
                            });
                    } else {
                        var fileData = smartFileList?smartFileList:$scope.fileData;
                        fileList = $filter('filter')(fileData, {filename: searchArr[0]});
                        deferred.resolve(fileList);
                        $rootScope.$broadcast('searchStateChange','end');
                    }
                } else {
                    if (GKPartition.isMountPartition($scope.partition)) {
                        var source = 'api', option = {};
                        if ($scope.filter == 'trash') {
                            option.recycle = true;
                        } else {
                            var mount = GKMount.getMountById($scope.mountId);
                            if (mount.compare==1 && (GKPartition.isTeamFilePartition($scope.partition) || GKPartition.isEntFilePartition($scope.partition))) {
                                source = 'client';
                                option.current = 1;
                            }
                        }
                        if(!$scope.fileUpdate.isFileUpdateView) {
                            GKFile.getFileList($scope.mountId, $scope.path, source, option).then(function (list) {
                                smartFileList = list;
                                deferred.resolve(list);
                            }, function (re) {
                                deferred.reject(re);
                            });
                        }else{
                            //获取文件更新列表
                            GKFile.getFileUpdateList($scope.mountId).then(function(list){
                                smartFileList = list;
                                deferred.resolve(list);
                            }, function (re) {
                                deferred.reject(re);
                            })
                        }
                    } else {
                        GKSmartFolder.getList($scope.filter).then(function(list){
                            smartFileList = list;
                            deferred.resolve(list);
                        },function(re){
                            deferred.reject(re);
                        });
                    }
                }
                return deferred.promise;
            },
            refreahData: function ($scope, selectPath) {
                if($scope.search || $scope.filter) {
                    if($scope.view == $scope.fileUpdate.fileUpdateView)
                        $scope.view = $scope.oldView;
                    $scope.fileUpdate.isFileUpdateView = false;
                    $scope.fileUpdate.canShow = false;
                    $scope.breads = GKPath.getBread($scope);
                }else{
                    $scope.fileUpdate.canShow = true;
                }
                var context = this;
                $scope.loadingFileData = true;
                $scope.errorMsg = '';
                GKFileList.getFileData($scope).then(function (newFileData) {
                    $scope.loadingFileData = false;
                    var order = $scope.order;
                    if(!$scope.fileUpdate.isFileUpdateView) {
                        if ($scope.order.indexOf('filename') >= 0) {
                            var desc = $scope.order.indexOf('-') ? '-' : '+';
                            order = [desc + 'dir', $scope.order];
                        }
                    }else{
                        $scope.order = "-last_edit_time"
                        order = [$scope.order];
                    }
                    $scope.fileData = $filter('orderBy')(newFileData, order);
                    //判断如果不是文件更新视图
                    if(!$scope.fileUpdate.isFileUpdateView) $scope.fileDataArr = $scope.fileData;
                    if (selectPath) {
                        $timeout(function(){
                            GKFileList.unSelectAll($scope);
                            var selectedPathArr = selectPath.split('|');
                            angular.forEach($scope.fileData, function (value,key) {
                                if(selectedPathArr.indexOf(value.fullpath)>=0){
                                    context.select($scope,key);
                                }
                            });
                        })
                        $scope.selectedpath = selectPath;
                    }
                    if (!$scope.fileData || !$scope.fileData.length) {
                        if ($scope.search) {
                            $scope.errorMsg = '未找到相关搜索结果';
                        }else{
                            $scope.errorMsg = '该文件夹为空';
                        }
                    }
                }, function (errorMsg) {
                    $scope.loadingFileData = false;
                    $scope.errorMsg = errorMsg;
                })
            }
        };
        return GKFileList;
    }])
    .factory('GKChat', ['$q','GKApi','GKException',function ($q,GKApi,GKException) {
        var GKChat = {
            src:'',
            setSrc:function(mountId,fullpath,atMember){
                mountId = angular.isDefined(mountId)?mountId:0;
                fullpath = angular.isDefined(fullpath)?fullpath:'';
                atMember = angular.isDefined(atMember)?atMember:''; 
		var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///' + UIPath + '/chat.html#/?mountid=' + mountId+'&fullpath='+encodeURIComponent(fullpath)+'&at='+encodeURIComponent(atMember);
                this.src = url;
            },
            getSummarys:function(params) {
                var deferred = $q.defer();
                //查询出来的消息
                GKApi.summarys(params.mountId, params.from, params.to, params.start, params.size).success(function (data) {
                    deferred.resolve(data);
                }).error(function (request) {
                    deferred.reject(GKException.getAjaxErrorMsg(request));
                })
                return deferred.promise;
            }
        };
        return GKChat;
    }])
    .factory('GKMode', ['$rootScope','localStorageService','GKFrame','GKAuth','GKPartition','GKBrowserMode',function ($rootScope,localStorageService,GKFrame,GKAuth,GKPartition,GKBrowserMode) {
        var key = 'gk_mode';
        var GKMode = {
            getMode:function(){
                return $rootScope.PAGE_CONFIG.mode || GKBrowserMode.getMode();
//
//                var re =  localStorageService.get(key);
//                if(['chat','file'].indexOf(re)<0){
//                    return 'chat';
//                }
//                return re;
            },
            setMode:function(mode,partition,mount){
                partition = partition === undefined ?$rootScope.PAGE_CONFIG.partition:partition;
                mount = mount === undefined ? $rootScope.PAGE_CONFIG.mount:mount;
                if(mode == 'chat' && (!GKPartition.isMountPartition(partition) || !GKAuth.check(mount,partition,'file_discuss'))){
                    mode = 'file';
                }
                $rootScope.PAGE_CONFIG.mode = mode;
                if(mode == 'chat'){
                    $rootScope.$broadcast('clearMsgTime',{orgId: mount.org_id})
                }
                var iframe = GKFrame('ifame_chat');
                if(iframe && typeof iframe.gkFrameCallback !== 'undefined'){
                    iframe.gkFrameCallback('changeMode',mode);
                }
                //localStorageService.add(key, mode);
            }
        };
        return GKMode;
    }])
    .factory('GKDialog', [function () {
        return {
            chat: function (mountId,fullpath,atMember) {
                mountId = angular.isDefined(mountId)?mountId:0;
                fullpath = angular.isDefined(fullpath)?fullpath:'';
                atMember = angular.isDefined(atMember)?atMember:'';
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///' + UIPath + '/chat.html#/?mountid=' + mountId+'&fullpath='+encodeURIComponent(fullpath)+'&at='+encodeURIComponent(atMember);
                var data = {
                    url: url,
                    type:'single',
                    width: 900,
                    resize: 1,
                    height: 580
                };
                gkClientInterface.setMain(data);
            },
            /**
             * 打开设置框
             */
            openSetting: function (tab) {
                tab = angular.isDefined(tab) ? tab : '';
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///' + UIPath + '/setting.html#/?tab=' + tab;
                var data = {
                    url: url,
                    type: "sole",
                    width: 794,
                    resize: 0,
                    height: 490
                }
                gkClientInterface.setMain(data);
            },
            /**
             * 打开传输列表
             */
            openTransfer: function () {
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///' + UIPath + '/transfer.html';
                var data = {
                    url: url,
                    type: "sole",
                    width: 794,
                    height: 490,
                    resize: 0,
                }
                gkClientInterface.setMain(data);
            },
            openUrl: function (url, param) {
                if (!url) return;
                var defaultParam = {
                    type: "sole",
                    width: 794,
                    height: 490,
                    resize: 1
                };
                var param = angular.extend({}, defaultParam, param);
                param.url = url;
                gkClientInterface.setMain(param);
            }
        }
    }
    ])
    .factory('GKQueue', ['$rootScope', '$interval', function ($rootScope, $interval) {
        var dealList = function (oldList, newList, type) {
            angular.forEach(oldList, function (value,index) {
                var localUri = '';
                if (['download', 'syncdownload'].indexOf(type) >= 0) {
                    localUri = value.path;
                }
                var mountId = value.mountid;
                var fullpath = value.webpath;
                var has = false;
                angular.forEach(newList, function (newItem, key) {
                    if (newItem.mountid == mountId && newItem.webpath == fullpath) {
                        value.time = newItem.time;
                        value.pos = newItem.pos;
                        value.status = newItem.status;
                        value.num = newItem.num;
                        has = true;
                        newList.splice(key, 1);
                        return false;
                    }
                });
                if(!has){
                    oldList.splice(index, 1);
                }
            });
        };
        return {
            getQueueList: function ($scope, type) {
                $rootScope.downloadSpeed = 0;
                $rootScope.uploadSpeed = 0;

                var getFileList = function (isUpdate) {
                    isUpdate = angular.isDefined(isUpdate) ? isUpdate : false;
                    var re = gkClientInterface.getTransList({type: type});
                    var list = re['list'] || [];
                    $rootScope.downloadSpeed = re['download'];
                    $rootScope.uploadSpeed = re['upload'];

                    var syncList;
                    var hasSyncList = false;
                    if (['download', 'upload'].indexOf(type) >= 0) {
                        hasSyncList = true;
                        var syncRe = gkClientInterface.getTransList({type: 'sync' + type});
                        var syncList = syncRe['list'] || [];
                        $rootScope.downloadSpeed = syncRe['download'];
                        $rootScope.uploadSpeed = syncRe['upload'];
                    }
                    if (isUpdate) {
                        var newList = angular.extend([], list);
                        dealList($scope.fileList, newList, type);
                        if (newList && newList.length) {
                            $scope.fileList = $scope.fileList.concat(newList);
                        }
                        if (hasSyncList) {
                            var newSyncList = angular.extend([], syncList);
                            dealList($scope.syncFileList, newSyncList, 'sync' + type);
                            if (newSyncList && newSyncList.length) {
                                $scope.syncFileList = $scope.syncFileList.concat(newSyncList);
                            }
                        }
                    } else {
                        $scope.fileList = list;
                        if (hasSyncList) {
                            $scope.syncFileList = syncList;
                        }
                    }
                };

                getFileList();
                var listTimer = $interval(function () {
                    getFileList(true);
                }, 1000);
                return listTimer;
            }
        }
    }
    ])
;

/**
 * 搜索
 * @constructor
 */
function GKFileSearch() {
    this.includeCondition = {};
    this.iexcludeCondition = {};
    this.condition = {};
    this.limit = {};
    this.order = {};
}
GKFileSearch.prototype = {
    includeCondition: {},
    excludeCondition: {},
    condition: {},
    order: {},
    limit: {}
};
GKFileSearch.prototype.getCondition = function () {
    if (this.includeCondition) {
        this.condition['include'] = this.includeCondition;
    }
    if (this.excludeCondition) {
        this.condition['exclude'] = this.excludeCondition;
    }
    if (this.order) {
        this.condition['order'] = this.order;
    }
    if (this.limit) {
        this.condition['limit'] = this.limit;
    }
    return JSON.stringify(this.condition);
}
GKFileSearch.prototype.conditionIncludeKeyword = function (keyword) {
    this.includeCondition['keywords'] = ['text', keyword];
};
GKFileSearch.prototype.conditionIncludeDir = function (dir) {
    this.includeCondition['dir'] = ['eq', dir];
};
GKFileSearch.prototype.conditionIncludeMountId = function (mountId) {
    this.includeCondition['mount_id'] = ['eq', mountId];
};

GKFileSearch.prototype.conditionIncludePath = function (path) {
    this.includeCondition['path'] = ['prefix', path];
};
GKFileSearch.prototype.conditionIncludeCreator = function (creator) {
    if (!angular.isArray(creator)) {
        creator = [creator];
    }
    this.includeCondition['creator'] = ['in', creator];
};
GKFileSearch.prototype.conditionIncludeModifier = function (modifier) {
    if (!angular.isArray(modifier)) {
        modifier = [modifier];
    }
    this.includeCondition['modifier'] = ['in', modifier];
};
GKFileSearch.prototype.conditionIncludeDateline = function (dateline, pre) {
    pre = angular.isDefined(pre) ? pre : 'gt';
    if (angular.isArray(dateline)) {
        pre = 'between'
    }
    this.includeCondition['dateline'] = [pre, dateline];
};
GKFileSearch.prototype.conditionIncludeLastDateline = function (lastDateline, pre) {
    pre = angular.isDefined(pre) ? pre : 'gt';
    if (angular.isArray(lastDateline)) {
        pre = 'between'
    }
    this.includeCondition['last_dateline'] = [pre, lastDateline];
};
GKFileSearch.prototype.conditionIncludeExtension = function (ext) {
    if (!angular.isArray(ext)) {
        ext = [ext];
    }
    this.includeCondition['extension'] = ['in', ext];
};
GKFileSearch.prototype.conditionIncludeFilesize = function (filesize, pre) {
    pre = angular.isDefined(pre) ? pre : 'gt';
    if (angular.isArray(dataline)) {
        pre = 'between'
    }
    this.includeCondition['filesize'] = [pre, filesize];
};
GKFileSearch.prototype.conditionExcludeCreator = function (creator) {
    if (!angular.isArray(creator)) {
        creator = [creator];
    }
    this.excludeCondition['creator'] = ['in', creator];
};
GKFileSearch.prototype.conditionExcludeModifier = function (modifier) {
    if (!angular.isArray(modifier)) {
        modifier = [modifier];
    }
    this.excludeCondition['modifier'] = ['in', modifier];
};
GKFileSearch.prototype.conditionExcludeKeywords = function (keyword) {
    this.excludeCondition['keywords'] = ['text', keyword];
};
GKFileSearch.prototype.conditionExcludeExtension = function (ext) {
    if (!angular.isArray(ext)) {
        ext = [ext];
    }
    this.excludeCondition['extension'] = ['in', ext];
};
GKFileSearch.prototype.conditionSetOrder = function (orderField, orderType) {
    this.order[orderField] = angular.isDefined(orderType) ? orderType : 'asc';
};
GKFileSearch.prototype.conditionSetLimit = function () {
    this.limit = [].slice.call(arguments);
};
