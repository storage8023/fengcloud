'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('initClient', ['GKGuiders','localStorageService','$rootScope', 'GKNews', '$scope', 'GKMount', '$location', 'GKFile', 'GKPartition', 'GKModal', 'GKApi' , 'GKDialog','$timeout',function (GKGuiders,localStorageService,$rootScope, GKNews, $scope, GKMount, $location, GKFile, GKPartition, GKModal, GKApi,GKDialog,$timeout) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            file: {},
            mount: {},
            filter: '',
            networkConnected: 1
        };

        /**
         * 监听打开消息的通知
         */
        $scope.$on('ShowMessage', function (e, data) {
            if (!$rootScope.showNews) {
                GKModal.news(GKNews, GKApi);
            }
        })


        $rootScope.$on('createTeamSuccess', function (event, param) {
            var orgId = param.orgId;
            gkClientInterface.notice({type: 'getOrg', 'org_id': Number(orgId)}, function (param) {
                if (param) {
                    $scope.$apply(function () {
                        var newOrg = param;
                        $rootScope.$broadcast('createOrgSuccess', newOrg);
                        $rootScope.$broadcast('closeModal');
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

        /**
         * 监听路径的改变
         */
        $scope.$on('$locationChangeSuccess', function () {
            setPageConfig();
        })

        var setPageConfig = function(){
            var param = $location.search();
            if(!param.partition) return;
            var extend = {
                filter: param.filter || '',
                partition: param.partition
            };
            if ([GKPartition.myFile, GKPartition.teamFile, GKPartition.subscribeFile].indexOf(param.partition) >= 0) {
                if(!param.filter){
                    extend.file = GKFile.getFileInfo(param.mountid, param.path);
                }else{
                    extend.file = {};
                }
                if(!param.path){
                    var mount = GKMount.getMountById(param.mountid);
                    if(mount){
                        extend.file.filename = mount['name'];
                    }
                }
                extend.mount = GKMount.getMountById(param.mountid)
            } else {
                extend.file = {};
                extend.mount = {};
            }
            angular.extend($rootScope.PAGE_CONFIG, extend);
        }

        setPageConfig();

        $scope.$on('LinkStatus', function ($event, param) {
            $scope.$apply(function () {
                $rootScope.PAGE_CONFIG.networkConnected = param.link;
            });
        })

        if(!localStorageService.get('silde_guide_shown')){
            $scope.showSildeGuide = true;
            localStorageService.add('silde_guide_shown',true);
        }

        var showGuider = function () {
            GKGuiders.show('guide_1');
        }

        $scope.$on('removeSlideGuide',function(){
            $scope.showSildeGuide = false;
            $timeout(function(){
                showGuider();
            },0)
        });

        $scope.$on('editOrgObjectSuccess', function (event, mount) {
            if (!mount) {
                return;
            }
            if($rootScope.PAGE_CONFIG.mount && $rootScope.PAGE_CONFIG.mount.mount_id == mount.mount_id) {
                angular.extend($rootScope.PAGE_CONFIG.mount,mount)
            }
        })
    }])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKFile', '$rootScope', 'GKSmartFolder', 'GKMount', 'GKFilter', 'GKPartition', 'GKModal', 'GK', 'GKFileList', 'GKFileOpt', 'GKSideTree', 'GKApi', '$q','$timeout',function ($scope, $location, GKPath, GKFile, $rootScope, GKSmartFolder, GKMount, GKFilter, GKPartition, GKModal, GK, GKFileList, GKFileOpt, GKSideTree, GKApi, $q,$timeout) {
        $scope.GKPartition = GKPartition;
        var orgMount = GKMount.getOrgMounts(),//云库的空间
            subscribeMount = GKMount.getSubscribeMounts(); //订阅的云库
        /**
         * 云库的文件
         */

        $scope.orgTreeList = GKFile.dealTreeData(orgMount, GKPartition.teamFile);

        /**
         * 订阅的文件
         * @type {*}
         */
        $scope.orgSubscribeList = GKFile.dealTreeData(subscribeMount, GKPartition.subscribeFile);

        /**
         * 初始选中
         * @type {*}
         */
        $scope.selectedBranch = null;
        $scope.initSelectedBranch = $scope.orgTreeList[0];
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
        $scope.smartTreeList = GKFile.dealTreeData(smartFolders, GKPartition.smartFolder);

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
                partition: partition
            };
            if (partition == GKPartition.myFile || partition == GKPartition.teamFile || partition == GKPartition.subscribeFile) {
                pararm['path'] = branch.data.fullpath;
                pararm['mountid'] = branch.data.mount_id;
                pararm['filter'] = branch.data.filter || '';
            } else if (partition == GKPartition.smartFolder) {
                pararm['filter'] = branch.data.filter;
            } else {
                return;
            }
            $location.search(pararm);

        };

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleExpand = function (branch) {
            if (branch.expanded) {
                GKFile.getChildNode(branch).then(function (children) {
                    branch.children = children;
                });
            } else {

            }
        };

        $scope.handleAdd = function (partition) {
            if (partition == GKPartition.teamFile) {
                var createTeamDialog = GKModal.createTeam();
            }
        };

        $scope.handleDrop = function (branch) {
            var selectedFile = GKFileList.getSelectedFile();
            var file = branch.data;
            var toFullpath = file.fullpath,
                toMountId = file.mount_id,
                fromFullpathes = [],
                fromMountId = $rootScope.PAGE_CONFIG.mount.mount_id;
            angular.forEach(selectedFile, function (value) {
                fromFullpathes.push({
                    webpath: value.fullpath
                });
            });
            var actName = '移动';
            if (file.mount_id != $rootScope.PAGE_CONFIG.mount.mount_id) {
                actName = '复制';
            }
            var toName = '';
            if (toFullpath) {
                toName = Util.String.baseName(toFullpath);
            } else {
                toName = GKMount.getMountById(toMountId)['name'];
            }
            var msg = '你确定要将 ' + Util.String.baseName(fromFullpathes[0]['webpath']) + (fromFullpathes.length > 1 ? '等' + fromFullpathes.length + '文件或文件夹' : '') + ' ' + actName + '到 ' + toName + ' 吗？';
            if (!confirm(msg)) {
                return;
            }
            if (file.mount_id == $rootScope.PAGE_CONFIG.mount.mount_id) {
                GKFileOpt.move(toFullpath, toMountId, fromFullpathes, fromMountId);
            } else {
                GKFileOpt.copy(toFullpath, toMountId, fromFullpathes, fromMountId);
            }
        };


        var getSmartGuide = function(guideId){
            return  '{buttons: [{name: "完成", onclick: GKGuiders.hideAll}],description: "智能文件夹中将记录最近修改过的文件。不同图形标记的文件（夹）也能在这里快速找到",id: "'+guideId+'",position: 3,title: "智能文件夹",width: 280}';
        };

        $timeout(function(){
            $scope.smartFolderGuider = getSmartGuide('guide_5');
        },500);

        $scope.$on('$locationChangeSuccess', function () {
            var param = $location.search();
            var branch;
            if (param.partition == GKPartition.teamFile) {
                angular.forEach($scope.orgTreeList, function (value) {
                    if (value.data.mount_id == param.mountid) {
                        branch = value;
                        return false;
                    }
                })
            } else if (param.partition == GKPartition.subscribeFile) {
                angular.forEach($scope.orgSubscribeList, function (value) {
                    if (value.data.mount_id == param.mountid) {
                        branch = value;
                        return false;
                    }
                })
            }
            /**
             * 如果当前的路径分区与选择的节点分区不同，则需要手动unselect已选择的节点
             */
            if (branch && $scope.selectedBranch && branch.data.partition != $scope.selectedBranch.data.partition) {
            //if (branch) {
                if(branch != $scope.selectedBranch){
                    unSelectAllBranch();
                    selectBreanch(branch, param.partition);
                }
            }

            if(param.filter){
                var guideId = 'guide_4';
                $scope.smartFolderGuider = getSmartGuide(guideId);
            }
        })

        $scope.$on('selectedFileChange',function($event,selectedFile){
            $timeout(function(){
                var guideId = '';
                if(selectedFile.length==1){
                    if($scope.PAGE_CONFIG.partition == GKPartition.subscribeFile){
                        guideId = 'guide_5';
                    }else{
                        guideId = 'guide_6';
                    }
                }else{
                    guideId = 'guide_5';
                }
                $scope.smartFolderGuider = getSmartGuide(guideId);
            },0)
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
                var partition = GKPartition.teamFile;
                if (newOrg['type'] == 3) {
                    partition = GKPartition.subscribeFile;
                }
                newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], partition)[0];
                if (partition == GKPartition.teamFile) {
                    $scope.orgTreeList.push(newOrg);
                } else {
                    $scope.orgSubscribeList.push(newOrg);
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
            var list = $scope.orgTreeList;
            var type = GKPartition.teamFile;
            if (newMount['type'] == 3) {
                list = $scope.orgSubscribeList;
                type = GKPartition.subscribeFile;
            }
            var newNode = GKFile.dealTreeData([newMount], type, newMount['mount_id'])[0];
            GKSideTree.editNode(list, newMount['mount_id'], '', newNode);
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
                var partition = GKPartition.teamFile;
                if (mount['type'] == 3) {
                    partition = GKPartition.subscribeFile;
                }
                if (partition == GKPartition.teamFile) {
                    GKMount.removeTeamList($scope, mount.org_id);
                } else {
                    GKMount.removeOrgSubscribeList($scope, mount.org_id);
                }
                var currentMountId = $location.search().mountid;
                if(currentMountId==mount.mount_id && $scope.orgTreeList && $scope.orgTreeList.length){
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
            var partition = GKPartition.teamFile;
            if (newOrg['type'] == 3) {
                partition = GKPartition.subscribeFile;
            }
            newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], partition)[0];
            if (partition == GKPartition.teamFile) {
                $scope.orgTreeList.push(newOrg);
            } else {
                $scope.orgSubscribeList.push(newOrg);
            }
            unSelectAllBranch();
            selectBreanch(newOrg, GKPartition.teamFile, true);
        })

        $scope.$on('editFileSuccess', function (event, opt, mountId, fullpath) {
            var fullpathArr = !angular.isArray(fullpath) ? [fullpath] : fullpath;
            angular.forEach(fullpathArr, function (path) {
                switch (opt) {
                    case 'del':
                        GKSideTree.removeNode($scope.orgTreeList, mountId, path);
                        break;
                    case 'sync':
                        GKSideTree.editNode($scope.orgTreeList, mountId, path, {
                            sync: 1
                        });
                        break;
                    case 'unsync':
                        GKSideTree.editNode($scope.orgTreeList, mountId, path, {
                            sync: 0
                        });
                        break;
                    case 'create':
                        var node = GKSideTree.findNode($scope.orgTreeList, mountId, path);
                        /**
                         * 已展开的node才刷新数据
                         */
                        if(node){
                            if (node.expanded) {
                                $scope.handleExpand(node);
                            }else{
                                node.hasChildren = true;
                            }
                        }
                        break;
                    case 'set_open':
                        var node = GKSideTree.findNode($scope.orgTreeList, mountId, path);
                        /**
                         * 已展开的node才刷新数据
                         */
                        if (node) {
                            node.data.open = 1;
                            node.iconNodeCollapse = node.iconNodeExpand = 'icon_teamfolder';
                        }
                        break;

                }
            })

        });

        $scope.$on('OpenMountPath',function($event,param){
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
            $scope.$apply(function(){
                GKPath.gotoFile(mountId, path, selectFile);
            })
        })
    }])
    .controller('fileBrowser', ['$location','$interval', 'GKDialog', '$scope', '$filter', 'GKPath', 'GK', 'GKException', 'GKOpt', '$rootScope', '$q', 'GKFileList', 'GKPartition', 'GKFileOpt', '$timeout', 'GKFile', 'GKSearch', 'GKFileListView',function ($location,$interval, GKDialog, $scope, $filter, GKPath, GK, GKException, GKOpt, $rootScope, $q, GKFileList, GKPartition, GKFileOpt, $timeout, GKFile, GKSearch,GKFileListView) {
        $scope.fileData = []; //文件列表的数据
        $scope.errorMsg = '';
        $scope.order = '+filename'; //当前的排序
        if ($scope.partition == GKPartition.smartFolder && $scope.filter == 'recent') {
            $scope.order = '-last_edit_time'; //当前的排序
        }
        $scope.allOpts = null;
        $scope.rightOpts = [];
        $scope.showHint = false;
        $scope.totalCount = 0;
        $scope.shiftLastIndex = 0; //shift键盘的起始点
        $scope.keyword = '';
        $scope.view = 'list';

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

        var excludeOpts = ['open_with', 'view_property', 'order_by', 'paste', 'copy', 'cut'],
            excludeRightOpts = [], //右键要排除的操作
            optKeys,
            topOptKeys,
            excludeRightOpts
            ; // 顶部要排除的操作

        var setOpts = function (selectedFile) {
            selectedFile = angular.isDefined(selectedFile)?selectedFile:[];
            $scope.allOpts = GKOpt.getAllOpts($scope,selectedFile);
            var isSearch = $scope.keyword.length ? true : false;
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
                if ($scope.partition == GKPartition.subscribeFile) {
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

        /**
         * 操作
         * @type {Array}
         */
        $scope.$on('selectedFileChange',function($event,selectedFile){
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
                            $scope.showHint = true;
                        });
                        break;
                    case 'del':
                        forEachFullpath(function (fullpath) {
                            GKPath.gotoFile(mountId, Util.String.dirName(fullpath));
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
            $scope.keyword = param.keyword || '';
            $scope.showHint =$rootScope.PAGE_CONFIG.file.syncpath?true:false;
            GKFileList.unSelectAll($scope);
            GKFileList.refreahData($scope,param.selectedpath);
            setOpts();
        };

        $scope.limit = 50;
        $scope.$on('$locationChangeSuccess',function(){
            $scope.limit = 50;
            getFileData();
        })

        getFileData();

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
            var file = $scope.fileData[index];
            var fileItem = jQuery($event.target).hasClass('file_item')?jQuery($event.target):jQuery($event.target).parents('.file_item');
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

        /**drag drop **/
        $scope.getHelper = function () {
            var selectFileName = $scope.fileData[$scope.shiftLastIndex].filename;
            var len =GKFileList.getSelectedFile().length;;
            var moreInfo = len > 1 ? ' 等' + len + '个文件或文件夹' : '';
            return '<div class="helper">' + selectFileName + moreInfo + '</div>';
        };

        $scope.dragBegin = function (event, ui, index) {
            var file = $scope.fileData[index];
            if (!file) {
                return;
            }
            if (!GKFileList.checkIsSelectedByIndex(index)) {
                GKFileList.select($scope, index);
            }
            angular.forEach(GKFileList.getSelectedFile(), function (value) {
                value.disableDrop = true;
            });
        };

        $scope.dragEnd = function (event, ui, index) {
            angular.forEach(GKFileList.getSelectedFile(), function (value) {
                value.disableDrop = false;
            });
        };

        $scope.handleOver = function (event, ui, file) {
            file.hover = true;
        };

        $scope.handleOut = function (event, ui, file) {
            file.hover = false;
        };

        $scope.handleDrop = function (event, ui, file) {
            var toMountId = $scope.mountId,
                toFullpath = file.fullpath,
                fromMountId = $scope.mountId,
                fromFullpathes = [];

            angular.forEach(GKFileList.getSelectedFile(), function (value) {
                fromFullpathes.push({
                    webpath: value.fullpath
                });
            });
            var msg = '你确定要将 ' + Util.String.baseName(fromFullpathes[0]['webpath']) + (fromFullpathes.length > 1 ? '等' + fromFullpathes.length + '文件或文件夹' : '') + ' 移动到 ' + Util.String.baseName(toFullpath) + ' 吗？';
            if (!confirm(msg)) {
                file.hover = false;
                return;
            }

            GKFileOpt.move(toFullpath, toMountId, fromFullpathes, fromMountId).then(function () {
                GKFileList.refreahData($scope);
            }, function () {

            });
        };

        $scope.handleSysDrop = function ($event) {
            var dragFiles = gkClientInterface.getDragFiles();
            if ($scope.partition == GKPartition.subscribeFile) {
                alert('不能在当前路径添加文件');
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

            if ($scope.partition == GKPartition.subscribeFile) {
                var start = $scope.fileData.length;
                if (start >= $scope.totalCount) return;

                GKFileList.getFileData($scope, {start:start}).then(function (list) {
                    $scope.fileData = $scope.fileData.concat(list);
                })
            }else if($scope.partition == GKPartition.teamFile){
                $scope.limit += 50;
            }

        }

        $scope.$on('UpdateFileList',function(){
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
                angular.forEach($scope.fileData,function(value,key){
                    if(value.fullpath === fileItem.fullpath){
                        angular.extend(value,fileItem);
                        index = key;
                        return false;
                    }
                })
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
        var tmpData;
        $scope.$on('searchSmartFolder', function (event, keyword) {
            if (!keyword) {
                return;
            }
            if(!tmpData){
                tmpData = $scope.fileData;
            }
            var fileList = $filter('filter')(tmpData, {filename: keyword});
            $scope.keyword = keyword;
            if (!fileList || !fileList.length) {
                $scope.errorMsg = '未找到相关搜索结果';
            } else {
                $scope.fileData = fileList;
            }
            GKSearch.setSearchState('end');
        })

        $scope.$on('cancelSearchSmartFolder', function (event, keyword) {
            $scope.keyword = '';
            GKFileList.refreahData($scope);
            tmpData = null;
        })

        $scope.$on('$destroy', function () {
            jQuery.contextMenu('destroy', '.file_list .list_body');
        })
    }])
    .controller('header', ['$scope', 'GKPath', '$location', '$filter', 'GKHistory', 'GKApi', '$rootScope', '$document', '$compile', '$timeout', 'GKDialog', 'GKFind', 'GKModal', 'GKPartition','GKGuiders',function ($scope, GKPath, $location, $filter, GKHistory, GKApi, $rootScope, $document, $compile, $timeout, GKDialog, GKFind, GKModal, GKPartition,GKGuiders) {
        $scope.canBack = false;
        $scope.canForward = false;

        var setBread = function(){
            var param = $location.search();
            if(!param.partition) return;
            $scope.breads = GKPath.getBread();
            $scope.canBack = GKHistory.canBack();
            $scope.canForward = GKHistory.canForward();
            $scope.path = $rootScope.PAGE_CONFIG.file.fullpath || '';
        }

        /**
         * 判断前进后退按钮的状态
         * @type {*}
         */
        $scope.$on('$locationChangeSuccess', function () {
            setBread();
        });

        setBread();

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

        /**
         * 前进 后退
         * @param forward
         */
        $scope.handleNav = function (forward) {
            if (!forward) {
                GKHistory.back();
            } else {
                GKHistory.forward();
            }
        };

        $scope.showGuider = function(){
            GKGuiders.show('guide_1');
        }

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
                item: "传输队列",
                menuclick: function () {
                    GKDialog.openTransfer();
                }
            },
            {
                item: "论坛",
                menuclick: function () {
                    var url = gkClientInterface.getUrl({
                        sso:1,
                        url: '/account/bbs'
                    });
                    gkClientInterface.openUrl(url);
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

    }])
    .controller('rightSidebar', ['$scope', 'GKFile', 'GKOpen', 'GKFilter', 'RestFile', '$rootScope', 'GKApi', '$http', '$location', 'GKSearch', 'GKFileList', 'GKPartition', 'GKModal', 'GKMount', 'GKSmartFolder', function ($scope, GKFile, GKOpen, GKFilter, RestFile, $rootScope, GKApi, $http, $location, GKSearch, GKFileList, GKPartition, GKModal, GKMount, GKSmartFolder) {

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
            if(params.keyword){
                sideBarData =  {
                    title: '搜索结果',
                    tip: '',
                    icon: 'search'
                };
            }else if(!params.filter){
                var title = $rootScope.PAGE_CONFIG.mount ? $scope.PAGE_CONFIG.mount.name : '';
                sideBarData = {
                    title:title,
                    tip: '将文稿，照片，视频等文件保存在我的文件夹里，文件将自动备份到云端。可以使用手机，平板来访问它们，使设备之间无缝，无线连接',
                    photo: "",
                    attrHtml: '',
                    menus: []
                };

                sideBarData.photo = $rootScope.PAGE_CONFIG.mount.logo;
                sideBarData.tip = $rootScope.PAGE_CONFIG.mount.org_description || '';
                sideBarData.menus = [
                    {
                        text: '资料',
                        icon: 'icon_info',
                        name: 'visit_website',
                        click: function () {
                            GKModal.teamOverview($rootScope.PAGE_CONFIG.mount.org_id);
                        }
                    },
                    {
                        text: '名片',
                        icon: 'icon_teamcard',
                        name: 'team_card',
                        click: function () {
                            GKModal.teamCard($rootScope.PAGE_CONFIG.mount.org_id);
                        }
                    },
                ];

                if (params.partition == GKPartition.teamFile) {
                    sideBarData.atrrHtml = '成员 ' + $rootScope.PAGE_CONFIG.mount.member_count + ',订阅 ' + $rootScope.PAGE_CONFIG.mount.subscriber_count + '人';
                    if (GKMount.isMember($rootScope.PAGE_CONFIG.mount)) {
                        sideBarData.menus.push({
                            text: '成员',
                            icon: 'icon_team',
                            name: 'member_group',
                            click: function () {
                                GKModal.teamMember($rootScope.PAGE_CONFIG.mount.org_id);
                            }
                        });
                        sideBarData.menus.push({
                            text: '订阅者',
                            icon: 'icon_pin',
                            name: 'subscriber',
                            click: function () {
                                GKModal.teamSubscribe($rootScope.PAGE_CONFIG.mount.org_id);
                            }
                        });
                    }
                    if (GKMount.isAdmin($rootScope.PAGE_CONFIG.mount)) {
                        sideBarData.menus.push({
                            text: '安全设置',
                            icon: 'icon_manage',
                            name: 'manage_team',
                            click: function () {
                                GKModal.teamManage($rootScope.PAGE_CONFIG.mount.org_id);
                            }
                        })
                    }
                    if (GKMount.isSuperAdmin($rootScope.PAGE_CONFIG.mount)) {
                        sideBarData.menus.push({
                            text: '升级',
                            icon: 'icon_team_upgrade',
                            name: 'team_upgrade',
                            click: function () {
                                var url = gkClientInterface.getUrl({
                                    sso: 1,
                                    url: '/pay/order?org_id=' + $rootScope.PAGE_CONFIG.mount.org_id
                                })
                                gkClientInterface.openUrl(url);
                            }
                        })
                    }
                }
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

        $scope.sidbarData = getSidbarData($location.search());
        $scope.$on('$locationChangeSuccess',function(){
            var param = $location.search();
            $scope.localFile = $rootScope.PAGE_CONFIG.file;
            $scope.sidbarData = getSidbarData(param);
        })

        $scope.$on('selectedFileChange',function($event,selectedFile){
           if($rootScope.PAGE_CONFIG.filter == 'trash'){
               return;
           }
           if(!selectedFile.length){
               $scope.localFile = $rootScope.PAGE_CONFIG.file;
               $scope.sidebar = 'nofile';

           }else if(selectedFile.length ==1){
               $scope.localFile = selectedFile[0];
               $scope.sidebar = 'singlefile';
           }else{
               $scope.localFile = null;
               $scope.sidebar = 'multifile';
           }
        })

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
                angular.extend($scope.sidbarData,{
                    photo:mount.logo,
                    title:mount.name
                })
            }
        })

        $scope.headClick = function () {
            $scope.sidbarData.menus[0].click();
        };

    }])
    .controller('slide', ['$scope',function ($scope) {
        var currentIndex = 0;
        $scope.slides = [];
        for(var i=1;i<4;i++){
            $scope.slides.push({
                image:'images/guide_'+i+'.png?v=1'
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



