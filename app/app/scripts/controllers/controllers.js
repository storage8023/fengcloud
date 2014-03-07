'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .run(['$rootScope','$window','GKWindowCom',function($rootScope,$window,GKWindowCom){
        GKWindowCom.message(function(event){
            var data = event.data;
            if(!data){
                return;
            }
            if(data.type=='gotoFile'){
                gkClientInterface.setWindowTop();
                $rootScope.$broadcast('OpenMountPath',data);
            }
        })
    }])
    .controller('initClient', ['localStorageService','$rootScope', 'GKNews', '$scope', 'GKMount', '$location', 'GKFile', 'GKPartition', 'GKModal', 'GKApi' , 'GKDialog','$timeout','GKFrame','GKAuth',function (localStorageService,$rootScope, GKNews, $scope, GKMount, $location, GKFile, GKPartition, GKModal, GKApi,GKDialog,$timeout,GKFrame,GKAuth) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            file: {},
            mount: {},
            filter: '',
            mode:'',
            partition:'',
            networkConnected: Number(gkClientInterface.getNetworkStatus())
        };

        /**
         * 监听打开消息的通知
         */
        $scope.$on('ShowMessage', function (e, data) {
            if (!$rootScope.showNews) {
                GKModal.news(GKNews, GKApi);
            }
        })

        $scope.$on('ShowAction', function (e, data) {
            if(!data){
                return;
            }
            if(data.type=='addMember'){
                GKModal.teamMember(data.orgId);
            }
        })

        $rootScope.$on('createTeamSuccess', function (event, param) {
            var orgId = param.orgId;
            gkClientInterface.notice({type: 'getOrg', 'org_id': Number(orgId)}, function (newOrg) {
                if (newOrg) {
                    $scope.$apply(function () {
                        $rootScope.$broadcast('createOrgSuccess', newOrg);
                        if(param.close == 1){
                            $rootScope.$broadcast('closeModal');
                        }
                    });
                }
            })
        })

        //更新云库
        $rootScope.$on('updateTeam', function (event, param) {
            if (!param) {
                return;
            }
            gkClientInterface.notice({type: 'getOrg', 'org_id': Number(param.orgId)}, function (newMount) {
                if (newMount) {
                    $scope.$apply(function () {
                        $rootScope.$broadcast('EditOrgObject', newMount);
                        $rootScope.$broadcast('closeModal', 'changeTeamLogo');
                    });
                }
            })
        })

        $scope.$on('teamSecurity', function ($event, orgId) {
            if (!orgId) {
                return;
            }
            GKModal.teamManage(orgId);
        })

        $scope.$on('openUrl', function ($event, param) {
            var sso = Number(param.sso) || 0;
            var url = gkClientInterface.getUrl({
                sso: sso,
                url: param.url
            });
            var type = param.type;
            var title = param.title;
            if(type == 'browser'){
                gkClientInterface.openUrl(url);
            }else if(type == 'dialog'){
                GKDialog.openUrl(url);
            }else if(type == 'modal'){
                GKModal.openNew(url,title);
            }
        })

        $scope.$on('addMember', function ($event, orgId) {
            if (!orgId) {
                return;
            }
            GKModal.teamMember(orgId);

        })

        $scope.$on('viewSubscriber', function ($event, orgId) {
            if (!orgId) {
                return;
            }
            GKModal.teamSubscribe(orgId);

        })

        $scope.$on('qr', function ($event, orgId) {
            if (!orgId) {
                return; 
            }
            GKModal.teamQr(orgId);
        })

        $scope.$on('UserInfo', function (event, param) {
            $scope.$apply(function () {
                $rootScope.PAGE_CONFIG.user = param;
            });
        })

        var setPageConfig = function(){
            var param = $location.search();
            if(!param.partition) return;
            var extend = {
                filter: param.filter || '',
                partition: param.partition,
                mode: param.mode || 'chat'
            };
            if (GKPartition.isMountPartition(param.partition)) {
                if(!param.filter){
                    if(GKPartition.isSubscribePartition(param.partition)){
                        extend.file = {
                            fullpath: param.path,
                            mount_id: param.mountid
                        }
                    }else{
                        extend.file = GKFile.getFileInfo(param.mountid, param.path);
                    }

                }else{
                    extend.file = {};
                }
                if(!param.path){
                    var mount = GKMount.getMountById(param.mountid);
                    if(mount){
                        extend.file.filename = mount['name'];
                    }
                }

                extend.mount = GKMount.getMountById(param.mountid);
                var mount = gkClientInterface.getMount({
                    mountid:Number(param.mountid)
                });

                angular.extend(extend.mount,{
                    trash_size: mount.size_recycle,
                    trash_dateline: mount.dateline_recycle
                })

                if(param.mode == 'chat'){
                    $rootScope.$broadcast('clearMsgTime',{orgId: extend.mount.org_id})
                }
                if(extend.mode=='chat' && !GKAuth.check(extend.mount,param.partition,'file_discuss')){
                    extend.mode = 'file';
                }
            } else {
                extend.file = {};
                extend.mount = {};
                extend.mode = 'file';
            }
            angular.extend($rootScope.PAGE_CONFIG, extend);
        }

        /**
         * 监听路径的改变
         */
        $scope.$on('$locationChangeSuccess', function () {
            setPageConfig();
        })

        $scope.$on('UpdateFileList', function () {
            var param = $location.search();
            var oldSyncPath = $rootScope.PAGE_CONFIG.file.syncpath;
            angular.extend($rootScope.PAGE_CONFIG, {
                file:GKFile.getFileInfo(param.mountid, param.path)
            });
            if(oldSyncPath&&!$rootScope.PAGE_CONFIG.file.syncpath){
                $scope.$broadcast('editFileSuccess','unsync',param.mountid, param.path);
            }
        })

        $scope.$on('LinkStatus', function ($event, param) {
            $scope.$apply(function () {
                $rootScope.PAGE_CONFIG.networkConnected = param.link;
            });
        })

        if(!localStorageService.get('silde_guide_shown')){
            $scope.showSildeGuide = true;
            localStorageService.add('silde_guide_shown',true);
        }
        $scope.$on('removeSlideGuide',function(){
            $scope.showSildeGuide = false;
        });

        $scope.$on('editOrgObjectSuccess', function (event, mount) {
            if (!mount) {
                return;
            }
            if($rootScope.PAGE_CONFIG.mount && $rootScope.PAGE_CONFIG.mount.mount_id == mount.mount_id) {
                angular.extend($rootScope.PAGE_CONFIG.mount,mount)
            }
        })

        $scope.$on('UpdateMembers', function (event, param) {
            var iframe = GKFrame('ifame_chat');
            if(iframe && typeof iframe.gkFrameCallback !== 'undefined'){
                iframe.gkFrameCallback('UpdateMembers',param);
            }
        })

        /**
         * 网站iframe成员管理的回调
         */
        $scope.$on('_inviteMember',function($event,param){
            var orgId = param.orgId;
            var mount = GKMount.getMountByOrgId(orgId);
            if(!mount) return;
            $rootScope.$broadcast('UpdateMembers',{mountid:mount.mount_id});
        })

        $scope.$on('_uninviteMember',function($event,param){
            var orgId = param.orgId;
            var mount = GKMount.getMountByOrgId(orgId);
            if(!mount) return;
            $rootScope.$broadcast('UpdateMembers',{mountid:mount.mount_id});
        })

        $scope.$on('_editMember',function($event,param){
            var orgId = param.orgId;
            var mount = GKMount.getMountByOrgId(orgId);
            if(!mount) return;
            gkClientInterface.editMember({
                mountid:mount.mount_id,
                userid:Number(param.memberId),
                type:Number(param.memberType)
            });
        })

        $scope.$on('_delMember',function($event,param){
            var orgId = param.orgId;
            var mount = GKMount.getMountByOrgId(orgId);
            if(!mount) return;
            gkClientInterface.removeMember({
                mountid:mount.mount_id,
                userid:Number(param.memberId)
            });
        })

        $scope.$on('showSelectFileDialog',function($event,param){
            var mountId = param.mountId;
            var mount = GKMount.getMountById(mountId);
            if(!mount){
                return;
            }
            if(!GKAuth.check(mount,'','file_write')){
                alert('你没有权限在当前云库添加文件');
                return;
            }
            GKModal.selectFile(mountId,'请选择添加到哪个目录').result.then(function(re){
                var iframe = GKFrame('ifame_chat');
                if(iframe && typeof iframe.gkFrameCallback !== 'undefined'){
                    iframe.gkFrameCallback('selectAddDirSuccess',re);
                }
                return;
            });
        })

    }])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKFile', '$rootScope', 'GKSmartFolder', 'GKMount', 'GKFilter', 'GKPartition', 'GKModal', 'GK', 'GKFileList', 'GKFileOpt', 'GKSideTree', 'GKApi', '$q','$timeout','$interval','localStorageService','GKWindowCom','GKFrame','GKAuth',function ($scope, $location, GKPath, GKFile, $rootScope, GKSmartFolder, GKMount, GKFilter, GKPartition, GKModal, GK, GKFileList, GKFileOpt, GKSideTree, GKApi, $q,$timeout,$interval,localStorageService,GKWindowCom,GKFrame,GKAuth) {
        $scope.GKPartition = GKPartition;
        var orgMount = GKMount.getOrgMounts();

        $scope.entTreeList = GKSideTree.getTreeList(GKMount.getMounts());
        /**
         * 我的云库
         */
        $scope.orgTreeList = GKFile.dealTreeData(orgMount, GKPartition.teamFile,0,true);

        /**
         * 初始选中
         * @type {*}
         */
        $scope.selectedBranch = null;
        if(!$location.search().partition){
            $scope.initSelectedBranch = $scope.orgTreeList[0];
        }
        var unSelectAllBranch = function () {
            if ($scope.selectedBranch) {
                $scope.selectedBranch.selected = false;
                $scope.selectedBranch = null;
            }
        };

        var selectBreanch = function (branch, partition, isListFile) {
            if (!angular.equals($scope.selectedBranch, branch)) {
                branch.selected = true;
                $scope.selectedBranch = branch;
                if (isListFile) {
                    $scope.handleSelect(branch, partition);
                }
            }
        };

        /**
         * 智能文件夹
         * @type {*}
         */
        var smartFolders = GKSmartFolder.getFolders();
        $scope.smartTreeList = GKFile.dealTreeData(smartFolders, GKPartition.smartFolder,0,true);

        $scope.$on('RemoveMagicObject', function ($event, param) {
            $scope.$apply(function () {
                var code = param.condition;
                GKSmartFolder.removeSmartFolderByCode(code);
                GKSideTree.removeSmartNode($scope.smartTreeList, code);
            })
        })

        $scope.$on('AddMagicObject', function ($event, param) {
            $scope.$apply(function () {
                var name = param.name,
                    code = param.condition;
                var node = GKSmartFolder.addSmartFolder(name, code);
                GKSideTree.addSmartNode($scope.smartTreeList, node);
            })
        })

        $scope.$on('editSmartFolder', function ($event, name, code) {
            GKSmartFolder.editSmartFolder(name, code);
            GKSideTree.editSmartNode($scope.smartTreeList, code, name);
        })

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleSelect = function (branch, partition) {
            var pararm = {
                partition: partition,
                mode:'file'
            };

            if (GKPartition.isMountPartition(partition)) {
                pararm['path'] = branch.data.fullpath;
                pararm['mountid'] = branch.data.mount_id;
                pararm['entid'] = branch.data.ent_id||0;
                pararm['filter'] = branch.data.filter || '';
                pararm['mode'] = $rootScope.PAGE_CONFIG.mode || 'chat';
            } else if (GKPartition.isSmartFolderPartition(partition)) {
                pararm['filter'] = branch.data.filter;
            } else {
                return;
            }
            $location.search(pararm);
        };

        $scope.handleDrop = function (branch) {
            var selectedFile = GKFileList.getSelectedFile();
            var file = branch.data;
            var toFullpath = file.fullpath,
                toMountId = file.mount_id,
                fromFullpathes = [],
                fromMountId = $rootScope.PAGE_CONFIG.mount.mount_id;
            var mount = GKMount.getMountById(toMountId);
            if(!mount) return;
            if(!GKAuth.check(mount,'','file_write')){
                alert('你没有权限将文件或文件夹复制到该云库');
                return;
            }
            angular.forEach(selectedFile, function (value) {
                fromFullpathes.push({
                    webpath: value.fullpath
                });
            });

            GKModal.selectFile(file.mount_id,'请选择复制到哪个目录').result.then(function(re){
                GKFileOpt.copy(re.selectedPath, file.mount_id, fromFullpathes, fromMountId);
            });
        };

        $scope.handleHeaderClick = function(tree){
            var url = gkClientInterface.getUrl({
                sso: 0,
                url: gkClientInterface.getSiteDomain()+'/ent'
            });
            gkClientInterface.openUrl(url);
        };

        var selectBranchOnLocationChange = function(param){
            var branch;
            if (GKPartition.isTeamFilePartition(param.partition)) {
                angular.forEach($scope.orgTreeList, function (value) {
                    if (value.data.mount_id == param.mountid) {
                        branch = value;
                        return false;
                    }
                })

            }else if(GKPartition.isSmartFolderPartition(param.partition)){
                angular.forEach($scope.smartTreeList, function (value) {
                    if (value.data.filter == param.filter) {
                        branch = value;
                        return false;
                    }
                })
            }else if(GKPartition.isEntFilePartition(param.partition)){
                var entId = param.entid;
                if($scope.entTreeList[entId]){
                    var list = $scope.entTreeList[entId].data;
                    angular.forEach(list, function (value) {
                        if (value.data.mount_id == param.mountid) {
                            branch = value;
                            return false;
                        }
                    })
                }
            }
            /**
             * 如果当前的路径分区与选择的节点分区不同，则需要手动unselect已选择的节点
             */
            if(branch && branch != $scope.selectedBranch){
                unSelectAllBranch();
                selectBreanch(branch, param.partition);
            }
        };

        $scope.$on('$locationChangeSuccess', function () {
            var param = $location.search();
            var filter='';
            if($scope.selectedBranch){
                filter = $scope.selectedBranch.data.filter || '';
            }

            if(!$scope.selectedBranch){
                selectBranchOnLocationChange(param);
            }else{
                if($scope.selectedBranch.data.partition != param.partition){
                    selectBranchOnLocationChange(param);
                }else{
                    if(GKPartition.isSmartFolderPartition($scope.selectedBranch.data.partition)){
                        if(filter != param.filter){
                            selectBranchOnLocationChange(param);
                        }
                    }else{
                        if($scope.selectedBranch.data.mount_id  != param.mountid || $scope.selectedBranch.data.fullpath != param.path || filter!=param.filter){
                            selectBranchOnLocationChange(param);
                        }
                    }
                }
            }
        })

        /**
         * 监控增加云库的回调
         */
        $scope.$on('AddOrgObject', function (event, param) {
            if (!param) {
                return;
            }
            $scope.$apply(function () {
                var newOrg = param;
                if (GKMount.checkMountExsit(newOrg.mountid)) {
                    return;
                }
                var partition = GKPartition.getPartitionByMountType(newOrg['type'],newOrg['ent_id']);
                newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], partition,0,true)[0];
                if (GKPartition.isTeamFilePartition(partition)) {
                    $scope.orgTreeList.push(newOrg);
                }else if(GKPartition.isEntFilePartition(partition)){
                    var entId = newOrg['data']['ent_id'];
                    if(!$scope.entTreeList[entId]){
                        var tempData= GKSideTree.getTreeList([newOrg]);
                        angular.extend($scope.entTreeList,tempData);
                    }else{
                        $scope.entTreeList[entId].data.push(newOrg);
                    }
                }
            });
        })

        $scope.$on('EditOrgObject', function (event, param) {
            if (!param) {
                return;
            }
            if (!GKMount.checkMountExsit(param.mountid)) {
                return;
            }
            var editMount = GKMount.formatMountItem(param);
            var newMount = GKMount.editMount(param.mountid, editMount);
            if (!newMount) {
                return;
            }
            var type = GKPartition.getPartitionByMountType(newMount['type'],newMount['ent_id']);
            var list;
            if(GKPartition.isTeamFilePartition(type)){
                list = $scope.orgTreeList;
            }else if(GKPartition.isEntFilePartition(type)){
                var entId = newMount['ent_id'];
                list = $scope.entTreeList[entId]['data'];
            }
            if(!list || !list.length) return;
            var newNode = GKFile.dealTreeData([newMount], type, newMount['mount_id'],true)[0];
            $timeout(function(){
                GKSideTree.editNode(list, newMount['mount_id'], '', newNode);
            });
            $rootScope.$broadcast('editOrgObjectSuccess',newMount);
        })

        /**
         * 监控删除云库的回调
         */
        $scope.$on('RemoveOrgObject', function (event, param) {
            $scope.$apply(function () {
                if (!param) {
                    return;
                }
                var mount = null;
                if(param.mountid){
                     mount = GKMount.getMountById(param.mountid);
                }else if(param.org_id){
                    mount = GKMount.getMountByOrgId(param.org_id);
                }
                if(!mount) return;
                var partition = GKPartition.getPartitionByMountType(mount['type'],mount['ent_id']);
                if (GKPartition.isTeamFilePartition(partition)) {
                    GKMount.removeTeamList($scope, mount.org_id);
                }else if(GKPartition.isEntFilePartition(partition)){
                    GKMount.removeEntFileList($scope,mount.org_id,mount.ent_id);
                }
                var currentMountId = $location.search().mountid;
                if(currentMountId==mount.mount_id){
                    selectBreanch($scope.orgTreeList[0], GKPartition.teamFile, true);
                }
            });
        })


        /**
         * 创建云库成功
         */
        $scope.$on('createOrgSuccess', function (event, newOrg) {
            if (GKMount.checkMountExsit(newOrg.mountid)) {
                return;
            }
            var partition = GKPartition.getPartitionByMountType(newOrg['type'],newOrg['ent_id']);
            newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], partition,0,true)[0];

            if (GKPartition.isTeamFilePartition(partition)) {
                $scope.orgTreeList.push(newOrg);
            }
            unSelectAllBranch();
            selectBreanch(newOrg,partition, true);
        })

        var setNewMsgTime = function(orgId,newMsgTime){
            var mount = GKMount.getMountByOrgId(orgId);
            if(!mount){
                return;
            }
            var partition = GKPartition.getPartitionByMountType(mount['type'],mount['ent_id']);
            var list;
            if (GKPartition.isTeamFilePartition(partition)) {
                list = $scope.orgTreeList;
            }else if(GKPartition.isEntFilePartition(partition)){
                if(!$scope.entTreeList[mount['ent_id']]){
                    return;
                }
                list = $scope.entTreeList[mount['ent_id']].data;
            }else{
                list = $scope.joinOrgTreeList;
            }
            GKSideTree.editNode(list, mount['mount_id'], '', {newMsgTime:newMsgTime});
        };

        var setChatState = function(list){
            angular.forEach(list,function(item){
                var orgId = item.receiver;
                var mount = GKMount.getMountByOrgId(orgId);
                if(!mount) return;
                if(!GKAuth.check(mount,'','file_discuss')){
                    return;
                }
                if($rootScope.PAGE_CONFIG.mount.org_id != orgId || $rootScope.PAGE_CONFIG.mode != 'chat'){
                    setNewMsgTime(orgId,item.time);
                }
                var iframe = GKFrame('ifame_chat');
                if(iframe && typeof iframe.gkFrameCallback !== 'undefined'){
                    iframe.gkFrameCallback('chatMessageUpdate',item);
                }
            });
        }

        var chatState = gkClientInterface.getChateState();
        if(chatState && chatState['list']){
            setChatState(chatState['list']);
        }

        $scope.$on('ChatMessageUpdate',function(event,param){
           if(!param || !param['list'] || !param['list'].length){
               return;
           }
           var list = param['list'];
            $scope.$apply(function(){
                setChatState(list);
            })
        })

        $rootScope.$on('clearMsgTime',function(event,param){
           var orgId = param.orgId;
            setNewMsgTime(orgId,0);
        })
    }])
    .controller('fileBrowser', ['$location','$interval', 'GKDialog', '$scope', '$filter', 'GKPath', 'GK', 'GKException', 'GKOpt', '$rootScope', '$q', 'GKFileList', 'GKPartition', 'GKFileOpt', '$timeout', 'GKFile', 'GKFileListView','GKChat','GKModal','GKAuth','GKMount',function ($location,$interval, GKDialog, $scope, $filter, GKPath, GK, GKException, GKOpt, $rootScope, $q, GKFileList, GKPartition, GKFileOpt, $timeout, GKFile,GKFileListView,GKChat,GKModal,GKAuth,GKMount) {
        $scope.fileData = []; //文件列表的数据
        $scope.errorMsg = '';
        $scope.mountReadable = true;
        $scope.order = '+filename'; //当前的排序
        if (GKPartition.isSmartFolderPartition($scope.partition) && $scope.filter == 'recent') {
            $scope.order = '-last_edit_time'; //当前的排序
        }
        $scope.allOpts = null;
        $scope.rightOpts = [];
        $scope.showHint = false;
        $scope.totalCount = 0;
        $scope.shiftLastIndex = 0; //shift键盘的起始点
        $scope.search = '';
        $scope.view = 'list';

        var setBread = function(){
            var param = $location.search();
            if(!param.partition) return;
            $scope.breads = GKPath.getBread();
            $scope.path = $rootScope.PAGE_CONFIG.file.fullpath || '';
        }

        $scope.$on('editSmartFolder', function ($event, name, code, filter) {
            angular.forEach($scope.breads, function (value) {
                if (value.filter == filter) {
                    value.name = name;
                }
            });
        })

        $scope.$on('editOrgObjectSuccess', function (event, mount) {
            if (!mount) {
                return;
            }
            if($rootScope.PAGE_CONFIG.mount && $rootScope.PAGE_CONFIG.mount.mount_id == mount.mount_id) {
                if($scope.breads && $scope.breads.length){
                    angular.extend($scope.breads[0],{
                        logo:mount.logo,
                        name:mount.name
                    })
                }
            }
        })

        var getOpenWithMenu = function (mountId, file, allOpts) {
            allOpts['open_with']['items'] = {};
            var ext = '.' + file.ext;
            var re = gkClientInterface.getOpenWithMenu({
                'ext': ext
            });
            if (!re) {
                return;
            }
            var list = re['list'];
            if (!list || !list.length) {
                return;
            }
            var subMenu = {};
            angular.forEach(list, function (value, key) {
                var item = {
                    name: value['name'],
                    callback: function () {
                        var mount = GKMount.getMountById(mountId);
                        if(!mount) return;
                        if(!GKAuth.check(mount,'','file_read')){
                            alert('你没有权限打开该文件');
                            return;
                        }
                        if (!$rootScope.PAGE_CONFIG.networkConnected && !file.cache) {
                            alert('该文件无本地缓存，离线状态下无法查看');
                            return;
                        }
                        gkClientInterface.open({
                            webpath: file.fullpath,
                            mountid: mountId,
                            openpath: value.openpath
                        });
                    }
                }
                subMenu['open_with_' + key] = item;
            })
            allOpts['open_with']['items'] = subMenu;
        };

        var excludeOpts = ['open_with', 'view_property', 'order_by','link'],
            excludeRightOpts = [], //右键要排除的操作
            optKeys,
            topOptKeys,
            excludeRightOpts
            ; // 顶部要排除的操作

        var setOpts = function (selectedFile) {
            selectedFile = angular.isDefined(selectedFile)?selectedFile:[];
            $scope.allOpts = GKOpt.getAllOpts($scope,selectedFile);
            var isSearch = $scope.search.length ? true : false;
            optKeys = GKOpt.getOpts($scope.PAGE_CONFIG.file, selectedFile, $scope.partition, $scope.filter, $scope.PAGE_CONFIG.mount, isSearch);
            $scope.opts = null;
            $scope.opts = [];
            $scope.rightOpts = null;
            $scope.rightOpts = {};
            topOptKeys = [];

            /**
             * 如果选择了文件，那么把currentOpts中的“同步”，“取消同步” 去掉
             */
            if (selectedFile.length) {
                var currentOpts = GKOpt.getOpts($rootScope.PAGE_CONFIG.file, false, $scope.partition, $scope.filter, $scope.PAGE_CONFIG.mount, isSearch);
                angular.forEach(['sync', 'unsync'], function (value) {
                    var index = currentOpts.indexOf(value);
                    if (index >= 0) {
                        currentOpts.splice(index, 1);
                    }
                })
                /**
                 * 如果是订阅的文件就不用合并当前的操作和选中的操作
                 */
                if (GKPartition.isSubscribePartition($scope.partition)) {
                    topOptKeys = optKeys;
                } else {
                    topOptKeys = jQuery.merge(currentOpts, optKeys);
                    topOptKeys = Util.Array.unique(topOptKeys);
                }
                if (selectedFile.length == 1 && selectedFile[0].dir == 0) {
                    getOpenWithMenu(GKFileList.getOptFileMountId(selectedFile[0]), selectedFile[0], $scope.allOpts);
                }
            } else {
                topOptKeys = optKeys;
            }

            /**
             * 扩展操作的值
             */
            var extendOpt = function (opt, key, isRightOpt) {
                var extendParam = {};
                if (!isRightOpt) {
                    extendParam['key'] = key;
                }
                return angular.extend(opt, extendParam);
            }

            /**
             * 检测subopt是否允许
             */
            var checkSubOpt = function (optKeys, subOpts) {
                var cloneOpt = angular.extend({}, subOpts);
                angular.forEach(cloneOpt, function (value, key) {
                    if (optKeys.indexOf(key) < 0) {
                        delete cloneOpt[key];
                    }
                });
                return cloneOpt;
            };

            angular.forEach(topOptKeys, function (value) {
                if (excludeOpts.indexOf(value) < 0) {
                    var opt = $scope.allOpts[value];
                    if (opt) {
                        if (opt.items) {
                            var subItems = checkSubOpt(topOptKeys, opt.items);
                            if (jQuery.isEmptyObject(subItems)) {
                                return;
                            } else {
                                opt.items = subItems;
                            }
                        }
                        var item = extendOpt(opt, value, false);
                        $scope.opts.push(item);
                    }

                }
            });


            /**
             * 右键的操作
             */
            angular.forEach(optKeys, function (value) {
                if (excludeRightOpts.indexOf(value) < 0) {
                    var opt = $scope.allOpts[value];
                    if (opt) {
                        if (value == 'open_with' && jQuery.isEmptyObject(opt.items)) {
                            return;
                        }
                        if (value != 'open_with' && !!opt.items && jQuery.isEmptyObject(checkSubOpt(optKeys, opt.items))) {
                            return;
                        }
                        var item = extendOpt(opt, value, true);
                        $scope.rightOpts[value] = item;
                    }
                }
            });
            $scope.allOpts = null;
        }

        $scope.triggleOptByShortCut = function (shortcut) {
            var opt = GKOpt.getOptByShortCut($scope.rightOpts, shortcut);
            if (opt) {
                opt['callback']();
            }
        };

        /**
         * 改变视图
         */
        $scope.changeView = function (view) {
            GKFileList.changeView($scope,view);
        };

        $scope.$on('changeView',function(event,view){
            if(arguments.length>2){
                GKFileList.changeView($scope,view);
            }else{
                $scope.$apply(function(){
                    GKFileList.changeView($scope,view);
                })
            }
        })

        var selectedFile;
        /**
         * 操作
         * @type {Array}
         */
        $scope.$on('selectedFileChange',function($event,selectedFile){
            selectedFile = selectedFile;
            setOpts(selectedFile);
        })

        $scope.$on('refreshOpt',function($event){
            setOpts(selectedFile);
        })


        $scope.$watch('rightOpts', function () {
            jQuery.contextMenu('destroy', '.file_list .list_body');
            /**
             * 设置右键菜单
             */
            jQuery.contextMenu({
                selector: '.file_list .list_body',
                reposition: false,
                zIndex: 99,
                animation: {
                    show: "show",
                    hide: "hide"
                },
                items: $scope.rightOpts
            });
        })

        $scope.$watch('order', function (newValue) {
            if ($scope.rightOpts && $scope.rightOpts['order_by'] && $scope.rightOpts['order_by']['items']) {
                angular.forEach($scope.rightOpts['order_by']['items'], function (value, key) {
                    if (key == 'order_by_' + $scope.order.slice(1)) {
                        value['className'] = 'current';
                    } else {
                        value['className'] = '';
                    }
                });
            }
            if (!newValue) {
                return;
            }
            var order = newValue;
            var localCompare = false;
            if (newValue.indexOf('filename') >= 0) {
                localCompare = true;
                var desc = newValue.indexOf('-') ? '-' : '+';
                order = [desc + 'dir', newValue];
            }
            var newFileData= $filter('orderBy')($scope.fileData, order,localCompare).concat();
            $scope.fileData = null;
            $scope.fileData = newFileData;
            GKFileList.reIndex($scope.fileData);
        })

        /**
         * 取消收藏
         */
        $scope.$on('unFav', function ($event) {
            GKFileList.removeAllSelectFile($scope);
        })

        $scope.$on('UpdateWebpath', function (event, param) {
            $scope.$apply(function () {
                var upPath = Util.String.dirName(param.webpath);
                if (upPath == $scope.PAGE_CONFIG.file.fullpath) {
                    GKFileList.refreahData($scope);
                }
            });
        })

        /**
         * 监听对文件的操作事件,同步文件列表和左侧的树
         */
        $scope.$on('editFileSuccess', function (event, opt, mountId, fullpath, extraParam) {
            if (!$rootScope.PAGE_CONFIG.mount || $rootScope.PAGE_CONFIG.mount.mount_id != mountId) {
                return;
            }
            var fullpathArr = !angular.isArray(fullpath) ? [fullpath] : fullpath;
            if (!fullpathArr.length) {
                return;
            }
            var forEachFullpath = function (callback) {
                angular.forEach(fullpathArr, function (path) {
                    if (angular.isFunction(callback)) {
                        callback(path);
                    }
                })
            };

            if ($rootScope.PAGE_CONFIG.file && fullpathArr[0] === $rootScope.PAGE_CONFIG.file.fullpath) {
                switch (opt) {
                    case 'sync':
                        forEachFullpath(function (fullpath) {
                            if(!fullpath) fullpath = '/';
                            $rootScope.PAGE_CONFIG.file.syncpath = fullpath;
                            $scope.showHint = true;
                        });
                        break;
                    case 'unsync':
                        forEachFullpath(function (fullpath) {
                            $rootScope.PAGE_CONFIG.file.syncpath = '';
                            $scope.showHint = false;
                        });
                        break;
                    case 'del':
                        forEachFullpath(function (fullpath) {
                            GKPath.gotoFile(mountId, Util.String.dirName(fullpath),'','','','file');
                        });
                        break;
                    case 'create':
                        GKFileList.refreahData($scope, extraParam.fullpath);
                        break;
                }
            } else {
                var forEachFile = function (callback) {
                    forEachFullpath(function (path) {
                        angular.forEach($scope.fileData, function (value,key) {
                            if (value.fullpath === path && angular.isFunction(callback)) {
                                callback(value,key);
                            }
                        });
                    })

                };
                switch (opt) {
                    case 'sync':
                        forEachFile(function (value,key) {
                            value.sync = 1;
                            GKFileListView.updateFileItem(key,value);
                        })
                        break;
                    case 'unsync':
                        forEachFile(function (value,key) {
                            value.sync = 0;
                            GKFileListView.updateFileItem(key,value);
                        })
                        break;
                    case 'del':
                        GKFileList.removeAllSelectFile($scope);
                        forEachFile(function (value) {
                            GKFileList.remove($scope, value);

                        })
                        break;
                    case 'set_open':
                        forEachFile(function (value,key) {
                            value.open = extraParam.open;
                            GKFileListView.updateFileItem(key,value);
                        })
                        break;
                    case 'lock':
                        forEachFile(function (value,key) {
                            value.lock = 2;
                            value.lock_member_name = $rootScope.PAGE_CONFIG.user.member_name;
                            value.lock_member_id = $rootScope.PAGE_CONFIG.user.member_id;
                            GKFileListView.updateFileItem(key,value);
                            setOpts(GKFileList.getSelectedFile());
                        })
                        break;
                    case 'unlock':
                        forEachFile(function (value,key) {
                            value.lock = 0;
                            value.lock_member_name = '';
                            value.lock_member_id = 0;
                            GKFileListView.updateFileItem(key,value);
                            setOpts(GKFileList.getSelectedFile());
                        })
                        break;
                }

            }
        })

        $scope.$on('clearTrashSuccess', function (event, mountId) {
            if ($scope.mountId != mountId || $scope.filter != 'trash') {
                return;
            }
            GKFileList.refreahData($scope);
        })

        var getFileData = function(){
            var param =  $location.search();
            if(!param.partition) return;
            $scope.path = param.path || '';
            $scope.partition = param.partition || GKPartition.teamFile;
            $scope.filter = param.filter || '';
            $scope.selectedpath = param.selectedpath || '';
            $scope.mountId = Number(param.mountid || $rootScope.PAGE_CONFIG.mount.mount_id);
            $scope.search = param.search || '';
            $scope.showHint =$rootScope.PAGE_CONFIG.file.syncpath?true:false;
            if(param.view){
                GKFileList.changeView($scope,param.view);
            }
            GKFileList.unSelectAll($scope);
            GKFileList.refreahData($scope,param.selectedpath);
            setOpts();
            GKChat.setSrc($rootScope.PAGE_CONFIG.mount.mount_id);
            if(GKPartition.isMountPartition($scope.partition)){
                $scope.mountReadable = GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_read');
            }
        };

        $scope.gkChat = GKChat;

        $scope.limit = 100;

        $scope.$on('$locationChangeSuccess',function(){
            setBread();
            getFileData();
        })

        $scope.getItemClasses = function(file){
            var classes = {
                'nocache' : file.cache==0 && file.dir==0
            };
            return classes;
        };

        $scope.renameFileSubmit = function (filename, index) {
            if (!GKFile.checkFilename(filename)) {
                return;
            }
            var file = $scope.fileData[index];
            if(!file) return;
            var mountId = GKFileList.getOptFileMountId(file);
            if (filename === file.filename) {
                file.rename = false;
            } else {
                var upPath = Util.String.dirName(file.fullpath);
                var newpath = upPath + (upPath ? '/' : '') + filename;
                GK.rename({
                    oldpath: file.fullpath,
                    newpath: newpath,
                    mountid: mountId
                }).then(function () {
                        file.fullpath = newpath;
                        file.filename = filename;
                        file.ext = Util.String.getExt(filename);
                        file.rename = false;
                        GKFileListView.updateFileItem(index,file);
                    }, function (error) {
                        file.rename = false;
                        GKException.handleClientException(error);
                    });
            }
        };

        $scope.createFileNameSubmit = function (filename,dir) {
            if (!GKFile.checkFilename(filename)) {
                return;
            }
            var webpath = $scope.path ? $scope.path + '/' + filename : filename;
            var params = {
                webpath: webpath,
                dir: Number(dir),
                mountid: $scope.mountId
            };
            GK.createFolder(params).then(function () {
                $scope.createNewFolder = false;
                $rootScope.$broadcast('editFileSuccess', 'create', $scope.mountId, $scope.path, {fullpath: webpath})
            }, function (error) {
                GKException.handleClientException(error);
            });
        }

        /**
         * 处理点击
         * @param $event
         * @param index
         */
        $scope.handleClick = function ($event, index) {
            var fileItem = jQuery($event.target).hasClass('item')?jQuery($event.target):jQuery($event.target).parents('.item');
            var file = $scope.fileData[index];
            if ($event.ctrlKey || $event.metaKey) {
                if (fileItem.hasClass('selected')) {
                    GKFileList.unSelect($scope, index);
                } else {
                    GKFileList.select($scope, index, true);
                }
            } else if ($event.shiftKey) {
                var lastIndex = $scope.shiftLastIndex;
                GKFileList.unSelectAll($scope)
                if (index > lastIndex) {
                    for (var i = lastIndex; i <= index; i++) {
                        GKFileList.select($scope, i, true);
                    }
                } else if (index < lastIndex) {
                    for (var i = index; i <= lastIndex; i++) {
                        GKFileList.select($scope, i, true);
                    }
                }

            } else {
                GKFileList.select($scope, index);
            }
            if (!$event.shiftKey) {
                $scope.shiftLastIndex = index;
            }
        };

        /**
         * 双击文件
         * @param $event
         * @param file
         */
        $scope.handleDblClick = function (file) {
            /**
             * 文件夹
             */
            if ($scope.filter == 'trash') {
                return;
            }
            if (file.dir == 1) {
                GKPath.gotoFile(GKFileList.getOptFileMountId(file), file.fullpath);
            } else {
                if (!$scope.PAGE_CONFIG.networkConnected && !file.cache) {
                    alert('该文件无本地缓存，离线状态下无法查看');
                    return;
                }
                var mountId = GKFileList.getOptFileMountId(file);
                var mount = GKMount.getMountById(mountId);
                if(!mount) return;
                if(!GKAuth.check(mount,'','file_read')){
                    alert('你没有权限查看该文件');
                    return;
                }
                GK.open({
                    mountid: GKFileList.getOptFileMountId(file),
                    webpath: file.fullpath
                });
            }
        };

        /**
         * 右键文件
         * @param $event
         * @param file
         */
        $scope.handleRightClick = function ($event) {
            var jqTarget = jQuery($event.target);
            var fileItem = jqTarget.hasClass('file_item') ? jqTarget : jqTarget.parents('.file_item');
            if (fileItem.size()) {
                var index = fileItem.index();
                if (!GKFileList.checkIsSelectedByIndex(index)) {
                    GKFileList.select($scope, index);
                }
            } else {
                GKFileList.unSelectAll($scope);
            }
        };

        /**
         * 设置order
         * @param order
         */
        $scope.setOrder = function (order) {
            GKFileList.setOrder($scope, order);
        };

        /**
         * 监听mousedown事件
         * @param event
         */
        $scope.handleMouseDown = function (event) {
            var $target = jQuery(event.target);
            if((['TEXTAREA','INPUT','BUTTON'].indexOf(event.target.nodeName))>=0){
                return;
            }
            if (!$target.hasClass('file_item') && !$target.parents('.file_item').size()) {
                GKFileList.unSelectAll($scope);
            }
            /**
             * 为了修复框选组件的bug
             */
            $timeout(function(){
                document.activeElement.blur();
            },0);
        };

        $scope.dragBegin = function (event, index) {
            var file = $scope.fileData[index];
            if (!file) {
                return;
            }
            if (!GKFileList.checkIsSelectedByIndex(index)) {
                GKFileList.select($scope, index);
            }
            var selectedFile = GKFileList.getSelectedFile();
            var dragIcon = jQuery('#drag_helper')[0];
            event.dataTransfer.setDragImage(dragIcon, -10, -10);
            if(selectedFile.length == 1){
                var mountId = GKFileList.getOptFileMountId(selectedFile[0]);
                var mount =  GKMount.getMountById(mountId);
                if(mount && GKAuth.check(mount,'','file_read')){
                    var re = gkClientInterface.getCachePath({
                        filehash:selectedFile[0].filehash,
                        mountid:mountId,
                        webpath:selectedFile[0].fullpath
                    });
                    var downloadUrl = re['path'];
                    if(!downloadUrl){
//                    var downloadReq = gkClientInterface.getDownloadUrl({
//                        webpath:selectedFile[0].fullpath,
//                        mountid:GKFileList.getOptFileMountId(selectedFile[0]),
//                    });
//                    downloadUrl = downloadReq['list'][0]['url'];
                    }else{
                        var fileDetail = 'application/octet-stream:'+selectedFile[0].filename+':'+downloadUrl;
                        event.dataTransfer.setData("DownloadURL",fileDetail);
                    }
                }
            }
            angular.forEach(selectedFile, function (value) {
                value.disableDrop = true;
            });
        };

        /**drag drop **/
        $scope.getHelper = function () {
            var selectFileName = $scope.fileData[$scope.shiftLastIndex].filename;
            var selectedFile = GKFileList.getSelectedFile();
            var len = selectedFile.length;
            var selectFileName = selectedFile[0].filename;
            var moreInfo = len > 1 ? ' 等 ' + len + ' 个文件或文件夹' : '';
            return '<div class="helper">' + selectFileName + moreInfo + '</div>';
        };


        $scope.dragEnd = function (event, index) {
            angular.forEach(GKFileList.getSelectedFile(), function (value) {
                value.disableDrop = false;
            });
        };

        $scope.handleOver = function (event, index) {
            GKFileListView.hoverItem(index);
        };

        $scope.handleOut = function (event, index) {
            GKFileListView.unhoverItem(index);
        };

        $scope.handleDrop = function (file,index) {
            var toMountId = $scope.mountId,
                toFullpath = file.fullpath,
                fromMountId = $scope.mountId,
                fromFullpathes = [];
            if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_write')){
                alert('你没有权限在当前云库复制或移动文件');
                return;
            }
            angular.forEach(GKFileList.getSelectedFile(), function (value) {
                fromFullpathes.push({
                    webpath: value.fullpath
                });
            });
            if(!fromFullpathes.length){
                return;
            }
            var msg = '你要将 ' + Util.String.baseName(fromFullpathes[0]['webpath']) + (fromFullpathes.length > 1 ? ' 等 ' + fromFullpathes.length + ' 文件或文件夹' : ' ') + ' 复制到还是移动到 ' + Util.String.baseName(toFullpath) + ' 中？';
            var choseModal = GKModal.choseDrag(msg).result.then(function(type){
              if(type == 'move'){
                  GKFileOpt.move(toFullpath, toMountId, fromFullpathes, fromMountId).then(function () {
                      GKFileList.refreahData($scope);
                  }, function () {

                  });
              }else{
                  GKFileOpt.copy(toFullpath, toMountId, fromFullpathes, fromMountId).then(function () {

                      GKFileListView.unhoverItem(index);
                  }, function () {

                  });
              }
            },function(){
                GKFileListView.unhoverItem(index);
            });
        };

        $scope.handleSysDrop = function ($event) {
            var dragFiles = gkClientInterface.getDragFiles();
            if (GKPartition.isSmartFolderPartition($scope.partition) || GKPartition.isSubscribePartition($scope.partition) || $scope.filter == 'trash') {
                alert('不能在当前路径添加文件');
                return;
            }
           if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_write')){
               alert('你没有权限在当前云库添加文件');
               return;
           }
            var params = {
                parent: $scope.path,
                type: 'save',
                list: dragFiles.list,
                mountid: $scope.mountId
            };
            GK.addFile(params).then(function () {
                GKFileList.refreahData($scope);
            }, function (error) {
                GKException.handleClientException(error);
            })
        };

        $scope.goToLocal = function () {
            gkClientInterface.open({
                mountid: $rootScope.PAGE_CONFIG.mount.mount_id,
                webpath: $rootScope.PAGE_CONFIG.file.fullpath
            });
        };

        $scope.showSyncSetting = function () {
            GKDialog.openSetting('sync');
        }

        $scope.handleScrollLoad = function () {
            if (GKPartition.isSubscribePartition($scope.partition)) {
                var start = $scope.fileData.length;
                if (start >= $scope.totalCount) return;

                GKFileList.getFileData($scope, {start:start}).then(function (list) {
                    $scope.fileData = $scope.fileData.concat(list);
                })
            }else if(GKPartition.isTeamFilePartition($scope.partition) || GKPartition.isEntFilePartition($scope.partition)){
                $scope.limit += 50;
            }

        }

        $scope.$on('UpdateFileList',function(){
            if($scope.createNewFolder){ //新建文件（夹）的情况下忽略该回调
                return;
            }
            var selecedPath = [];
            angular.forEach(GKFileList.getSelectedFile(),function(value){
                selecedPath.push(value.fullpath);
            })
            GKFileList.refreahData($scope,selecedPath.join('|'));
        })

        $scope.$on('UpdateFileInfo',function($event,file){
            var fileItem = GKFile.formatFileItem(file,'client');
            var isSelected = false;
            var index;
            $scope.$apply(function(){
                if(GKPartition.isMountPartition($scope.partition)){
                    if(fileItem.mount_id != $rootScope.PAGE_CONFIG.mount.mount_id) return;
                    angular.forEach($scope.fileData,function(value,key){
                        if(value.fullpath === fileItem.fullpath){
                            angular.extend(value,fileItem);
                            index = key;
                            return false;
                        }
                    })
                }else if(GKPartition.isSmartFolderPartition($scope.partition)){
                    angular.forEach($scope.fileData,function(value,key){
                        if(value.fullpath === fileItem.fullpath && value.mount_id == fileItem.mount_id){
                            angular.extend(value,fileItem);
                            index = key;
                            return false;
                        }
                    })
                }
            })
            if(index !== undefined){
                isSelected = GKFileList.checkIsSelectedByIndex(index);
                GKFileListView.updateFileItem(index,fileItem);
                if(isSelected){
                    $scope.$broadcast('refreshSidebar','');
                }
            }
        })

        /**
         * ctrlV结束
         */
        $scope.$on('ctrlVEnd', function (event, newFileData) {
            $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
        });

        $scope.$on('LinkStatus', function () {
            $scope.$apply(function () {
                var selectPath = [];
                angular.forEach(GKFileList.getSelectedFile(), function (value) {
                    selectPath.push(value.fullpath);
                })
                GKFileList.refreahData($scope, selectPath.join('|'));
            });
        })

        /**
         * 监听侧边栏的搜索
         */
        $scope.$on('invokeSearch', function ($event) {
            GKFileList.refreahData($scope);
        })

        $scope.$on('OpenMountPath',function($event,param){
            if($scope.view == 'chat'){
                GKFileList.changeView($scope,'list');
            }
            var mountId = param.mountid,
                fullpath = param.webpath,
                selectFile = '',
                path = '';
            var lastStr = Util.String.lastChar(fullpath);
            if(lastStr==='/'){
                path = Util.String.rtrim(fullpath,'/');
                selectFile = '';
            }else{
                path = Util.String.dirName(fullpath);
                selectFile = fullpath;
            }
            $timeout(function(){
                GKPath.gotoFile(mountId, path, selectFile,'','','file');
            })
        })

        $scope.$on('$destroy', function () {
            jQuery.contextMenu('destroy', '.file_list .list_body');
        })
    }])
    .controller('header', ['$scope', 'GKPath', '$location', '$filter', 'GKApi', '$rootScope', '$document', '$compile', '$timeout', 'GKDialog', 'GKFind', 'GKModal', 'GKPartition','localStorageService','$interval','GKNews','GKConstant',function ($scope, GKPath, $location, $filter, GKApi, $rootScope, $document, $compile, $timeout, GKDialog, GKFind, GKModal, GKPartition,localStorageService,$interval,GKNews,GKConstant) {

        $scope.changeMode = function(mode){
            var param = $location.search();
            angular.extend(param,{
                mode:mode
            });
            $location.search(param);
        };

        $scope.visitBBS = function(){
            var url = gkClientInterface.getUrl({
                sso:1,
                url: '/account/bbs'
            });
            gkClientInterface.openUrl(url);
        }

        $scope.showTransferQueue = function(){
            GKDialog.openTransfer();
        }

        $scope.$on('TransferState',function(event,param){
            $timeout(function(){
                $scope.transfering = param.state;
            })
        })

        $scope.items = [
            {
                item: "创建云库",
                menuclick: function () {
                    var createTeamDialog = GKModal.createTeam();
                }
            },
            {
                item: "设置",
                menuclick: function () {
                    GKDialog.openSetting();
                }
            },
            {
                item: "帮助",
                menuclick: function () {
                    var url = gkClientInterface.getUrl({
                        sso: 1,
                        url: '/help'
                    });
                    gkClientInterface.openUrl(url);
                }
            },
            {
                item: "关于",
                menuclick: function () {
                    gkClientInterface.openAbout();
                }
            },
            {
                item: "退出",
                menuclick: function () {
                    gkClientInterface.quit();
                }
            }
        ];
        var guiderKey = GKConstant.guideKey+$rootScope.PAGE_CONFIG.user.member_id;
        $scope.hideGuider = localStorageService.get(guiderKey);
        $scope.toggleGuider = function(hideGuider){
            if(!hideGuider){
                localStorageService.remove(guiderKey);
            }else{
                localStorageService.add(guiderKey,1);
            }
            $scope.hideGuider = hideGuider;
        }
        $scope.showHelpTip = false;
        $scope.$on('toggleGuider',function(event,hideGuider){
            $scope.hideGuider = hideGuider;
            if(hideGuider){
                $scope.showHelpTip = true;
                $timeout(function(){
                    $scope.showHelpTip = false;
                },2000)
            }
        })
    }])
    .controller('rightSidebar', ['$scope', 'GKFile', 'GKOpen', 'GKFilter', '$rootScope', 'GKApi', '$http', '$location', 'GKFileList', 'GKPartition', 'GKModal', 'GKMount', 'GKSmartFolder','GKDialog', 'GKChat','GKFrame','GKAuth',function ($scope, GKFile, GKOpen, GKFilter, $rootScope, GKApi, $http, $location, GKFileList, GKPartition, GKModal, GKMount, GKSmartFolder,GKDialog,GKChat,GKFrame,GKAuth) {

        $scope.GKPartition = GKPartition;
        /**
         * 监听已选择的文件
         */
        $scope.shareMembers = []; //共享参与人
        $scope.remarks = []; //讨论
        $scope.histories = []; //历史
        $scope.remindMembers = [];//可@的成员列表
        $scope.localFile = null;
        $scope.sidebar = 'nofile';
        $scope.localFile = $rootScope.PAGE_CONFIG.file;
        var getSidbarData = function(params){
            var sideBarData;
            if(params.search){
                sideBarData =  {
                    title: '搜索结果',
                    tip: '',
                    icon: 'search'
                };
            }else if(params.filter){
                var filterName = GKSmartFolder.getSmartFoldeName(params.filter);
                sideBarData = {
                    title: filterName,
                    tip: GKFilter.getFilterTip(params.filter),
                    icon: params.filter
                };
            }
            return sideBarData;
        };

        var getRootSidebarData = function(params){
            var title = $rootScope.PAGE_CONFIG.mount ? $scope.PAGE_CONFIG.mount.name : '';
            var sideBarData = {
                title:title,
                tip: '将文稿，照片，视频等文件保存在我的文件夹里，文件将自动备份到云端。可以使用手机，平板来访问它们，使设备之间无缝，无线连接',
                photo: "",
                attrHtml: '',
                menus: []
            };

            sideBarData.photo = $rootScope.PAGE_CONFIG.mount.logo;
            sideBarData.tip = $rootScope.PAGE_CONFIG.mount.org_description || '';
            sideBarData.menus = [];
            if (GKPartition.isTeamFilePartition(params.partition) || GKPartition.isEntFilePartition(params.partition)) {
                sideBarData.atrrHtml = '成员' + $rootScope.PAGE_CONFIG.mount.member_count + '人';
            }
            return sideBarData;
        };

        $scope.hideNoFile = true;

        $scope.sidbarData = getSidbarData($location.search());

        $scope.rootSidebarData = getRootSidebarData($location.search());

        $scope.$on('$locationChangeSuccess',function(){
            var param = $location.search();
            $scope.localFile = $rootScope.PAGE_CONFIG.file;
            $scope.rootSidebarData = getRootSidebarData(param);
            if(param.path){
                $scope.sidebar = 'singlefile';
            }else if(param.filter||param.search){
                $scope.sidebar = 'nofile';
                $scope.sidbarData = getSidbarData(param);
            }
            $scope.currentTab = 'member';
            getMember();

            if(param.mode == 'chat'){
                $scope.hideNoFile = false;
            }else{
               if(param.path){
                   $scope.hideNoFile = true;
               }else{
                   if(param.search || param.filter){
                       $scope.hideNoFile = true;
                   }else{
                       $scope.hideNoFile = false;
                   }

               }
            }
        })

        $scope.$on('selectedFileChange', function ($event, selectedFile) {
            if ($rootScope.PAGE_CONFIG.filter == 'trash') {
                return;
            }
            if($rootScope.PAGE_CONFIG.mode == 'chat'){
                return;
            }
            var  hideNoFile;
            $scope.selectedFileLength = selectedFile.length;
            if (!selectedFile.length) {
                $scope.localFile = $rootScope.PAGE_CONFIG.file;
                if(!$scope.localFile.fullpath){
                    $scope.sidebar = 'nofile';
                    if([GKPartition.teamFile,GKPartition.entFile].indexOf($rootScope.PAGE_CONFIG.partition)>=0){
                        $scope.hideNoFile = false;
                    }else{
                        $scope.hideNoFile = true;
                    }
                }else{
                    $scope.sidebar = 'singlefile';
                    $scope.hideNoFile = true;
                }

           }else if(selectedFile.length ==1){
               $scope.localFile = selectedFile[0];
               $scope.sidebar = 'singlefile';
                $scope.hideNoFile = true;
           }else{
               $scope.localFile = null;
               $scope.sidebar = 'multifile';
                $scope.hideNoFile = true;
           }
        })

        $scope.toggleNoFile = function(){
            $scope.hideNoFile = !$scope.hideNoFile;
        }

        $scope.$on('editSmartFolder', function ($event, name, code, filter) {
            if ($scope.filter == filter) {
                $scope.sidbarData.title = name;
            }
        })

        $scope.$on('editOrgObjectSuccess', function (event, mount) {
            if (!mount) {
                return;
            }
            if($rootScope.PAGE_CONFIG.mount && $rootScope.PAGE_CONFIG.mount.mount_id == mount.mount_id) {
                angular.extend($scope.rootSidebarData,{
                    photo:mount.logo,
                    title:mount.name
                })
            }
        })


        $scope.showAddMember = function(){
            GKModal.teamMember($rootScope.PAGE_CONFIG.mount.org_id);
        };

        var getMember = function(){
            var re = gkClientInterface.getOrgMembers({
                orgid:$rootScope.PAGE_CONFIG.mount.org_id
            })
            var members = re.list || [];
            angular.forEach(members,function(value,key){
                if(value.member_id == $rootScope.PAGE_CONFIG.user.member_id){
                    members.splice(key,1);
                    members.unshift(value);
                    return false;
                }
            })
            $scope.members = members;
            GKApi.pendingMembers($rootScope.PAGE_CONFIG.mount.org_id).success(function(data){
               $scope.$apply(function(){
                   $scope.pendingMembers = data.members || [];
               })
            })
        };

        var getSubscriber = function(){
            GKApi.subscriberList($rootScope.PAGE_CONFIG.mount.org_id,0,500).success(function(data){
                $scope.$apply(function(){
                    $scope.memberLoading = false;
                    $scope.subscribers = data.members;
                })
            }).error(function(){
                    $scope.$apply(function(){
                        $scope.memberLoading = false;
                    })
                })
        };


        $scope.$on('UpdateMembers',function($event,param){
            if($rootScope.PAGE_CONFIG.mount.mount_id == param.mountid){
                getMember();
            }
        })

        $scope.showMember = function(){
            GKModal.teamMember($rootScope.PAGE_CONFIG.mount.org_id);
        };

        $scope.showSubscriber = function(){
            GKModal.teamSubscribe($rootScope.PAGE_CONFIG.mount.org_id);
        };

        $scope.headClick = function () {
            GKModal.teamOverview($rootScope.PAGE_CONFIG.mount.org_id);
        };

        $scope.atMember = function(memberName){
            if(!GKAuth.check($rootScope.PAGE_CONFIG.mount,'','file_discuss')){
                return;
            }
            if($rootScope.PAGE_CONFIG.mode !='chat'){
                var param = $location.search();
                angular.extend(param,{
                    mode:'chat'
                })
                $location.search(param);
            }
            var iframe = GKFrame('ifame_chat');
            if(iframe && typeof iframe.gkFrameCallback !== 'undefined'){
                iframe.gkFrameCallback('atMember',memberName);
            }
        };

    }])
    .controller('slide', ['$scope',function ($scope) {
        var currentIndex = 0;
        $scope.slides = [];
        for(var i=1;i<4;i++){
            $scope.slides.push({
                image:'images/guide_'+i+'.png?v=2'
            });
        }
        $scope.handleClick = function(index){
            if($scope.slides[currentIndex]){
                $scope.slides[currentIndex].active = false;
            }
            $scope.slides[index+1].active = true;
            currentIndex = index+1;
        }
        $scope.handleClick(-1);
        $scope.nextCallback = function(index){
            if(index==0){
                $scope.$emit('removeSlideGuide');
                $scope.$destroy();
                return false;
            }
        }
    }])
;


