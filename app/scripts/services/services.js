'use strict';

/* Services */
//全局AJAX请求默认返回的数据格式
jQuery.ajaxSetup({
    dataType: 'json',
    timeout: 30000
});

angular.module('gkClientIndex.services', [])
    .value('uiSelectableConfig', {
        filter: '.file_item',
        //tolerance:'fit',
        distance: 10
    })

    .factory('GKGuiders', [function () {
        return guiders;
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
    .factory('GKSideTree', ['GKFile', 'GKPartition', function (GKFile, GKPartition) {
        return {
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
                    var formatNode = GKFile.dealTreeData([node], GKPartition.smartFolder)[0]
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
    .factory('GKContextMenu', ['GKPartition', 'GKModal', 'GKOpt', 'GKFile', 'GKMount', 'GKSmartFolder', function (GKPartition, GKModal, GKOpt, GKFile, GKMount, GKSmartFolder) {
        return {
            getSidebarMenu: function ($trigger) {
                var data = $trigger.data('branch');
                console.log(data);
                var partition = data.partition,
                    fullpath = data.fullpath,
                    mountId = data.mount_id,
                    orgId = data.org_id,
                    items;
                var mount = null;
                if (mountId) {
                    mount = GKMount.getMountById(mountId);
                }
                if ([GKPartition.teamFile,GKPartition.joinFile].indexOf(partition)>=0) {
                    if (data.filter == 'trash') {
                        if(GKMount.isSuperAdmin(mount)){
                            items = {
                                'clear_trash': {
                                    name: '清空回收站',
                                    callback: function () {
                                        GKOpt.clearTrash(mountId);
                                    }
                                },
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
                            if (GKMount.isMember(mount)) {
                                angular.extend(items, {
                                    'view_member': {
                                        name: '成员',
                                        callback: function () {
                                            GKModal.teamMember(data.org_id);
                                        }
                                    }
                                });
                            }
                            if (GKMount.isAdmin(mount)) {
                                angular.extend(items, {
                                    'view_subscriber': {
                                        name: '订阅者',
                                        callback: function () {
                                            GKModal.teamSubscribe(data.org_id);
                                        }
                                    },
                                    'manage': {
                                        name: '安全设置',
                                        callback: function () {
                                            GKModal.teamManage(data.org_id);
                                        }
                                    }
                                })
                            }
                            if (GKMount.isSuperAdmin(mount)) {
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

                } else if (data.partition == GKPartition.subscribeFile) {
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

                } else if (data.partition == GKPartition.smartFolder && data.type != 0 ) {
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
    .factory('GKModal', ['$rootScope', '$modal', 'GK', 'GKMount', 'GKPartition', '$location', '$timeout', 'GKException', 'GKDialog', 'GKPath', 'GKSync', 'GKFile', 'GKApi',function ($rootScope, $modal, GK, GKMount, GKPartition, $location, $timeout, GKException, GKDialog, GKPath, GKSync, GKFile,GKApi) {
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
            publish: function (mountId, file) {
                var option = {
                    templateUrl: 'views/publish_dialog.html',
                    windowClass: 'publish_dialog',
                    controller: function ($scope,$modalInstance) {
                        $scope.file = file;
                        $scope.link = '';
                        $scope.publish = function(file){
                            GKApi.publish(mountId,file.fullpath)
                                .success(function(data){
                                    $scope.$apply(function(){
                                        $scope.link = data.link;
                                    })
                                })
                                .error(function(reqest){
                                    GKException.handleAjaxException(reqest);
                                })
                        }
                        $scope.copy = function (innerLink) {
                            gkClientInterface.copyToClipboard(innerLink);
                            alert('已复制到剪切板');
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };
                option = angular.extend({}, defaultOption, option);
                return $modal.open(option);

            },
            setMilestone:function(mountId,file){
                var option = {
                    templateUrl: 'views/set_milestone_dialog.html',
                    windowClass: 'set_milestone_dialog',
                    controller: function ($scope,$modalInstance) {
                        $scope.file = file;
                        $scope.message = '';
                        $scope.markMilestone = function(message){
                            GKApi.markMilestone(mountId,file.fullpath,message)
                                .success(function(){
                                    $modalInstance.close();
                                })
                                .error(function(reqest){
                                    GKException.handleAjaxException(reqest);
                                })
                        }
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
            teamCard: function (orgId) {
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
                                url: '/manage/info?org_id=' + orgId
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
            filePropery: function (mountId, file, parentFile) {
                var option = {
                    templateUrl: 'views/file_property_dialog.html',
                    windowClass: 'file_property_dialog',
                    controller: function ($scope, $modalInstance, mountId, file, parentFile) {
                        $scope.file = file;
                        $scope.mountId = mountId;
                        $scope.parentFile = parentFile;
                        $scope.publishEnable = false;
                        var mount = GKMount.getMountById(mountId);
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
                                var grid = gkClientInterface.isWindowsClient() ? '\\' : '/';
                                if (gkClientInterface.isWindowsClient()) {
                                    rePath = rePath.replace('/', '\\');
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
                                    if (re.error == 0) {
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
                        },
                        parentFile: function () {
                            return parentFile;
                        }
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
                            var newPath = GK.selectPath({
                                path: $scope.localURI,
                                disable_root: true
                            });
                            if (newPath) {
                                $scope.localURI = newPath;
                            }
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

                        $scope.cancel = function () {
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
                                return 'btn-default';
                            }
                        };

                        $scope.handleOpt = function (opt, item) {
                            if (opt.type == 'request') {
                                if (opt.opt == 'invite_accept' || opt.opt == 'invite_reject') {
                                    if (!confirm('你确定要' + opt.name + '该云库的邀请？')) {
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
                                        return;
                                    }
                                    GKPath.gotoFile(mount.mount_id, '');
                                } else if (opt.opt == 'view_org_member') {
                                    if (!item.org_id) {
                                        return;
                                    }
                                    context.teamMember(item.org_id);
                                }
                                else if (opt.opt == 'view_device') {
                                    GKDialog.openSetting('device');
                                }
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
                                        if (re.error == 0) {
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
                    deferred.resolve();
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
    .factory('GKSmartFolder', ['GKFilter', '$filter', 'GKApi', '$q', 'GKException', 'GKFile', '$rootScope',function (GKFilter, $filter, GKApi, $q, GKException, GKFile,$rootScope) {
        var getFolderAliasByType = function (type) {
            var filter = '';
            switch (type) {
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
        }

        var formartSmartFolder = function (value) {
            var condition = Number(value.condition);
            var filter = getFolderAliasByType(condition);
            var item = {
                name: value.name,
                type: condition,
                filter: filter,
                icon: 'icon_' + filter,
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
                if (exclue) {
                    if (!angular.isArray(exclue)) exclue = [exclue];
                    angular.forEach(exclue, function (value) {
                        angular.forEach(smartFolders, function (smart, key) {
                            if (smart.filter == value) {
                                smartFolders.splice(key, 1);
                                return false
                            }
                        })
                    });
                }
                return smartFolders;
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
                if(['star', 'diamond', 'moon', 'triangle', 'flower', 'heart','recent'].indexOf(filter)<0){
                    return;
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
                    deferred.resolve(list);;
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
                     * 最近访问的文件
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
                }
                }
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
    .factory('GKPath', ['$location', 'GKMount', 'GKSmartFolder', 'GKFilter', 'GKPartition', function ($location, GKMount, GKSmartFolder, GKFilter, GKPartition) {
        var GKPath = {
            gotoFile: function (mountId, path, selectFile) {
                selectFile = angular.isDefined(selectFile) ? selectFile : '';
                var searchParam = $location.search();
                var mount = GKMount.getMountById(mountId);
                if (!mount) return;
                var search = {
                    partition: mount['type'] > 2? GKPartition.subscribeFile : mount['type'] > 0?GKPartition.joinFile:GKPartition.teamFile,
                    mountid: mountId,
                    path: path,
                    selectedpath: selectFile
                };
                if (mount) {
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
                    keyword: paramArr[5] || '',
                };
                return '/file?' + jQuery.param(params);
            },
            getBread: function () {
                var path = $location.search().path || '';
                var partition = $location.search().partition || GKPartition.teamFile;
                var filter = $location.search().filter;
                var mountId = $location.search().mountid;
                var keyword = $location.search().keyword;
                var breads = [], bread;
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
                    if (re.error == 0) {
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
                    if (re.error == 0) {
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
                    if (re && re.error == 0) {
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
                    if (re && re.error == 0) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
            },
            unlock: function (params) {
                params.status = 0;
                var deferred = $q.defer();
                gkClientInterface.lock(params, function (re) {
                    if (re && re.error == 0) {
                        deferred.resolve(re);
                    } else {
                        deferred.reject(re);
                    }
                });
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
                    if (re && re.error == 0) {
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
                    if (re && re.error == 0) {
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
                    if (re && re.error == 0) {
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
                    if (re && re.error == 0) {
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
                    if (re && re.error == 0) {
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
    .constant('GKPartition', {
        joinFile: 'joinfile',
        teamFile: 'teamfile',
        smartFolder: 'smartfolder',
        subscribeFile: 'subscribefile'
    })
    .factory('GKFile', ['FILE_SORTS', 'GKPartition', 'GKFilter', '$q', 'GKApi', 'GKException', 'RestFile','$rootScope','$filter', function (FILE_SORTS, GKPartition, GKFilter, $q, GKApi, GKException, RestFile,$rootScope,$filter) {
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
                        RestFile.recycle(mountId, '').success(function (data) {
                            list = data['list'];
                            deferred.resolve(GKFile.dealFileList(list, source));
                        }).error(function (request) {
                                deferred.reject(GKException.getAjaxErrorMsg(request));
                            })
                    }

                } else {
                    var re = gkClientInterface.getFileList({webpath: fullpath, dir: option.dir, mountid: mountId,current:option.current});
                    if (!re.error) {
                        list = this.dealFileList(re['list'], 'client');
                        deferred.resolve(list);
                    } else {
                        deferred.reject(GKException.getClientErrorMsg(re));
                    }
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
                    if (branch.data.partition == GKPartition.subscribeFile) {
                        source = 'api';
                    }
                    var option  = {dir:1};
                    context.getFileList(branch.data.mount_id, branch.data.fullpath, source,option).then(function (list) {
                        children = context.dealTreeData(list, branch.data.partition, branch.data.mount_id);
                        /**
                         * 添加回收站
                         */
                        if (!branch.data.fullpath && !branch.data.filter && branch.data.type != 3) {
                            var trashNode = context.getTrashNode(branch.data.mount_id, branch.data.partition);
                            children.push(trashNode);
                        }
                        deferred.resolve(children);
                    })
                }
                return deferred.promise;
            },
            dealTreeData: function (data, type, mountId) {
                var newData = [],
                    item,
                    label,
                    context = this;
                angular.forEach(data, function (value) {
                    item = {};
                    angular.extend(value, {
                        partition: type
                    });
                    /**
                     * 我的云库，订阅的云库
                     */
                    if ([GKPartition.teamFile,GKPartition.joinFile,GKPartition.subscribeFile].indexOf(type)>=0) {
                        var icon = '';
                        if (!value.fullpath) {
                            label = value.name;
                            item.nodeImg = value.logo;
                        } else {
                            label = value.filename;
                            mountId && angular.extend(value, {
                                mount_id: mountId
                            });
                            if ([GKPartition.teamFile,GKPartition.joinFile].indexOf(type)>=0) {
                                icon = value.sharepath || value.open == 1 ? 'icon_teamfolder' : 'icon_myfolder';
                            }
                        }
                        var dropAble = false;
                        if ([GKPartition.teamFile,GKPartition.joinFile].indexOf(type)>=0) {
                            dropAble = true;
                        }
                        angular.extend(item, {
                            dropAble: dropAble,
                            label: label,
                            isParent: true,
                            hasChildren: value.hasFolder == 1,
                            data: value,
                            iconNodeExpand: icon,
                            iconNodeCollapse: icon
                        });

                    } else {
                        item = {
                            label: value.name,
                            isParent: false,
                            data: value,
                            hasChildren: false,
                            iconNodeExpand: value.icon,
                            iconNodeCollapse: value.icon
                        };
                    }
                    newData.push(item);
                });
                return newData;
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
                        version:value.version
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
                        version:value.version
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
    .factory('GKCilpboard', [function () {
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
            }
        };
        return GKClipboard
    }])
    .factory('GKOpt', ['GKFile', 'GKPartition', 'GKMount', '$rootScope', 'GK', 'RestFile', '$q', 'GKFileList', 'GKPath', 'GKModal', 'GKOpen', 'GKCilpboard', 'GKException', 'GKApi', 'GKFilter', 'GKFileOpt', 'GKSmartFolder', function (GKFile, GKPartition, GKMount, $rootScope, GK, RestFile, $q, GKFileList, GKPath, GKModal, GKOpen, GKCilpboard, GKException, GKApi, GKFilter, GKFileOpt, GKSmartFolder) {
        var GKOpt = {
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
                    'unsubscribe', //取消订阅
                    'new_folder', //新建
                    'create', //创建
                    'create_sync_folder',
                    'add', //添加
                    'clear_trash', //清空回收站
                    //'lock',  //锁定
                    //'unlock', //解锁
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
                    'order_by_last_edit_time'
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
                    case GKPartition.joinFile:
                    case GKPartition.teamFile:
                        this.disableOpt(opts, 'nearby', 'unsubscribe');
                        if (filter == 'trash') {
                            this.disableOpt(opts, 'new_txt_file','new_ppt_file','new_xls_file','new_doc_file','view_property', 'open_with', 'create_sync_folder', "add", "new_folder", "sync", "unsync", "paste", "rename", "save", "del", "cut", "copy", "lock", "unlock", "order_by", 'manage', 'create');
                            if (!GKMount.isSuperAdmin(mount)) {
                                this.disableOpt(opts, 'clear_trash', 'del_completely')
                            }
                        } else {
                            this.disableOpt(opts, "clear_trash", "revert", "del_completely");
                        }
                        if (GKCilpboard.isEmpty()) {
                            this.disableOpt(opts, 'paste');
                        }
                        if(!isSearch){
                        this.disableOpt(opts, 'goto');
                        }

                        break;
                    case GKPartition.subscribeFile:
                        this.disableOpt(opts, 'new_txt_file','new_ppt_file','new_xls_file','new_doc_file','create_sync_folder', 'new_file', 'goto', "new_folder", "manage", "create", 'add', 'clear_trash', 'sync', 'unsync', 'rename', 'del', 'paste', 'cut', 'lock', 'unlock', 'del_completely', 'revert');
                        break;
                    case GKPartition.smartFolder:
                        this.disableOpt(opts, 'new_txt_file','new_ppt_file','new_xls_file','new_doc_file','del', 'rename', 'create_sync_folder', 'new_file', 'revert', 'del_completely', 'del', 'rename', 'nearby', 'unsubscribe', 'create', 'add', 'clear_trash', 'manage', 'new_folder', 'sync', 'unsync', 'paste', 'copy', 'cut');
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
                if ([GKPartition.teamFile,GKPartition.joinFile].indexOf(partition)>=0) {
                    if(!GKMount.isAdmin(mount)){
                        this.disableOpt(opts, 'create');
                    }
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

                }
                return opts;
            },
            /**
             * 获取当前文件夹的命令
             * */
            getCurrentOpts: function (currentFile, partition) {
                var opts = this.getDefaultOpts();
                this.disableOpt(opts, 'view_property', "goto", "rename", "save", "cut", "copy", "lock", "unlock", "del", 'revert', 'del_completely');
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
                    this.disableOpt(opts, 'new_file', 'view_property', 'open_with', "goto", "sync", "unsync", "rename", "lock", "unlock");
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
                        if (file.lock == 1) {
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
                if (!confirm('确定要清空该回收站？')) {
                    return;
                }
                RestFile.clear(mountId).success(function () {
                    $rootScope.$broadcast('clearTrashSuccess', mountId);
                }).error(function (request) {
                        GKException.handleAjaxException(request);
                    });
            },
            renameSmartFolder: function (condition, name) {
                var deferred = $q.defer();
                var param = {
                    condition: condition,
                    name: name
                };
                gkClientInterface.renameSmartFolder(param, function (re) {
                    if (re.error == 0) {
                        var filter = GKSmartFolder.getFolderAliasByType(condition);
                        $rootScope.$broadcast('editSmartFolder', name, condition, filter);
                        deferred.resolve();
                    } else {
                        GKException.handleClientException(re);
                        deferred.reject();
                    }
                });
                return deferred.promise;
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

                var allOpt = {
                    'goto': {
                        name: '位置',
                        index: 0,
                        icon: 'icon_location',
                        className: "goto",
                        callback: function () {
                            var file = selectedFile[0];
                            var mountId = GKFileList.getOptFileMountId(file);
                            var fullpath = file.fullpath;
                            var upPath = Util.String.dirName(fullpath);
                            var filename = file.filename;
                            GKPath.gotoFile(mountId, upPath, fullpath);
                        }
                    },
                    'open_with': {
                        name: '打开方式',
                        index: 0,
                        icon: 'icon_open_with',
                        className: "open_with",
                        items: {}
                    },
                    'new_file': {
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
                                    GKModal.createTeamFolder($scope.mountId, '', 1);
                                }
                            },
                            'create_sync_folder': {
                                name: '创建同步文件夹',
                                index: 2,
                                className: "sync_folder",
                                callback: function () {
                                    var mountId = $scope.mountId;
                                    var fullpath = $rootScope.PAGE_CONFIG.file.fullpath;
                                    if($rootScope.PAGE_CONFIG.file.syncpath){
                                        alert('不能在已同步的目录中再创建同步文件夹');
                                        return;
                                    }
                                    var localUri = '', defaultName = '';
                                    localUri = gkClientInterface.selectPath({
                                        disable_root: 1
                                    });
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

                                }
                            },
                            'new_doc_file': {
                                name: '新建Word文档',
                                index: 3,
                                className: "new_doc_file",
                                callback: function () {
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
                    'unsubscribe': {
                        index: 2,
                        name: '取消订阅',
                        icon: 'icon_remove',
                        className: "unsubscribe",
                        callback: function () {
                            GKOpt.unsubscribe($rootScope.PAGE_CONFIG.mount.org_id);
                        }
                    },
                    'manage': {
                        index: 4,
                        name: '管理',
                        icon: 'icon_setting',
                        className: "manage",
                        callback: function () {
                            GKOpen.manage($rootScope.PAGE_CONFIG.mount.org_id);
                        }
                    },
                    'clear_trash': {
                        index: 5,
                        name: '清空回收站',
                        icon: 'icon_del',
                        className: "clear_trash",
                        callback: function () {
                            GKOpt.clearTrash($scope.PAGE_CONFIG.mount.mount_id);
                        }
                    },
                    'revert': {
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
                        index: 20,
                        name: '彻底删除',
                        className: "del_completely",
                        icon: 'icon_disable',
                        callback: function () {
                            var fullpaths = [];
                            angular.forEach(selectedFile, function (value) {
                                fullpaths.push(value.dir == 1 ? value.fullpath + '/' : value.fullpath);
                            });
                            RestFile.delCompletely($rootScope.PAGE_CONFIG.mount.mount_id, fullpaths).success(function () {
                                angular.forEach(selectedFile, function (value) {
                                    angular.forEach($scope.fileData, function (file, key) {
                                        if (value == file) {
                                            $scope.fileData.splice(key, 1);
                                        }
                                    })
                                });

                                GKFileList.unSelectAll();
                            }).error(function () {

                                });
                        }
                    },
                    'sync': {
                        index: 8,
                        name: '同步',
                        className: "sync",
                        icon: 'icon_sync',
                        callback: function () {
                            toggleSync(0);
                        }
                    },
                    'unsync': {
                        index: 9,
                        name: '取消同步',
                        className: "unsync",
                        icon: 'icon_disable',
                        callback: function () {
                            toggleSync(1);
                        }
                    },
                    'paste': {
                        index: 10,
                        name: '粘贴',
                        className: "paste",
                        icon: 'icon_paste',
                        accesskeyText: context.getAccessKey('paste'),
                        callback: function () {
                            var data = GKCilpboard.getData();
                            if (!data || !data.files || !data.mount_id) return;
                            var target = $rootScope.PAGE_CONFIG.file.fullpath;
                            if (selectedFile.length == 1 && selectedFile[0].dir==1) {
                                target = selectedFile[0].fullpath;
                            }

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
                                    GKCilpboard.clearData();
                                }, function (error) {
                                    GKException.handleClientException(error);
                                });
                            }
                        }
                    },
                    'cut': {
                        index: 11,
                        name: '剪切',
                        className: "cut",
                        icon: 'icon_cut',
                        accesskeyText: context.getAccessKey('cut'),
                        callback: function () {
                            if (!selectedFile || !selectedFile.length) {
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
                        index: 12,
                        name: '复制',
                        className: "copy",
                        icon: 'icon_copy',
                        accesskeyText: context.getAccessKey('copy'),
                        callback: function () {
                            if (!selectedFile || !selectedFile.length) {
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
                        index: 2,
                        name: '添加',
                        className: "add",
                        icon: 'icon_download',
                        callback: function () {
                            var addFiles = gkClientInterface.addFileDialog();
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
                        }
                    },
                    'lock': {
                        index: 14,
                        name: '锁定',
                        className: "lock",
                        icon: 'icon_lock',
                        callback: function () {
                            var file = selectedFile[0];
                            GK.lock({
                                webpath: file.fullpath,
                                mountid: $scope.mountId
                            }).then(function () {
                                    file.lock = 1;
                                    file.lock_member_name = $rootScope.PAGE_CONFIG.user.member_name;
                                })

                        }
                    },
                    'unlock': {
                        index: 15,
                        name: '解锁',
                        className: "unlock",
                        icon: 'icon_unlock',
                        callback: function () {
                            var file = selectedFile[0];
                            if (file.lock_member_id != $rootScope.PAGE_CONFIG.member_id) {
                                alert(file.lock_member_name + ' 已经锁定了这个文件。你只能以只读方式查看它。如果你需要修改它，请让 ' + file.lock_member_name + ' 先将其解锁。');
                                return;
                            }
                            GK.unlock({
                                webpath: file.fullpath,
                                mountid: $scope.mountId
                            }).then(function () {
                                    file.lock = 0;
                                    file.lock_member_name = '';
                                })

                        }
                    },
                    'save': {
                        index: 16,
                        name: '保存',
                        className: "save",
                        icon: 'icon_save',
                        accesskeyText: context.getAccessKey('save'),
                        callback: function () {
                            if (!selectedFile || !selectedFile.length) {
                                return;
                            }
                            var files = [];
                            angular.forEach(selectedFile, function (value) {
                                files.push({
                                    webpath: value.fullpath,
                                    mountid: GKFileList.getOptFileMountId(value),
                                    dir: Number(value.dir)
                                })
                            });
                            var params = {
                                list: files
                            };
                            GK.saveToLocal(params);
                        }
                    },
                    'del': {
                        index: 21,
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
                        index: 18,
                        name: '重命名',
                        className: "rename",
                        icon: 'icon_rename',
                        callback: function () {
                            var file = selectedFile[0];
                            file.rename = true;
                        }
                    },
                    'view_property': {
                        index: 19,
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
                            GKModal.filePropery(mountId, file, parentFile);
                        }
                    },
                    'order_by': {
                        index: 20,
                        name: '排序方式',
                        icon: 'icon_order',
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
                return fileListElem.find('> div > .item:eq('+index+')');
            },
            selectItem:function(index){
                this.getFileItem(index).addClass('selected');
            },
            unselectItem:function(index){
                this.getFileItem(index).removeClass('selected');
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
                var icon = $filter('getFileIcon')(file.filename,file.dir,(file.open||(PAGE_CONFIG.file.sharepath?1:0)),(file.sync||PAGE_CONFIG.file.syncpath?1:0)),
                    thumbUrl = $filter('getThumbUrl')(file.hash,file.filehash);
                var thumbIcon = oldFileItem.find('.thumb i'),
                    fionIcon = oldFileItem.find('.file_icon_wrapper i');

                angular.forEach([thumbIcon,fionIcon],function(elem){
                    elem.removeClass();
                    if(thumbIcon == elem){
                        thumbIcon.addClass('file_icon128x128 '+icon);
                    }else{
                        fionIcon.addClass('file_icon '+icon);
                    }
                    var thumbImg = elem.find('img');
                    if(!thumbImg.size()){
                        thumbImg = jQuery('<img />');
                    }
                    thumbImg.prop('src',thumbUrl);
                    elem.find('s').remove();
                    if(file.status ==1){
                        elem.append('<s class="icon16x16 icon_up"></s>');
                    }else if(file.status==2){
                        elem.append('<s class="icon16x16 icon_down"></s>');
                    }
                })
                var atts = {
                    'last_edit_time':$filter('date')(file.last_edit_time*1000,'yyyy/MM/dd HH:mm'),
                    'file_type':$filter('getFileType')(file.filename,file.dir,file.ext),
                    'file_size':file.dir==1?'-':$filter('bitSize')(file.filesize)
                };
                angular.forEach(atts,function(value,key){
                    oldFileItem.find('.' +key+ ' span').text(value);
                })
                return oldFileItem;
            }
        };
        return GKFileListView;
    }])
    .factory('GKFileList', ['$location', '$q', 'GKFile', 'GKApi', 'GKPartition', '$filter', 'GKException', 'RestFile', 'GKSearch', 'GKFilter', '$rootScope', 'GKFileListView', '$timeout', 'GKSmartFolder', function ($location, $q, GKFile, GKApi, GKPartition, $filter, GKException, RestFile, GKSearch, GKFilter, $rootScope, GKFileListView, $timeout, GKSmartFolder) {
        var selectedFile = [];
        var selectedIndex = [];
        var selectedPath = '';
        var fileListElem = jQuery('.file_list');
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
                multiSelect = !angular.isDefined(multiSelect) ? false : multiSelect;
                if (!multiSelect && selectedFile && selectedFile.length) {
                    this.unSelectAll($scope);
                }
                if (selectedIndex.indexOf(index) < 0) {
                    GKFileListView.selectItem(index);
                    selectedFile.push($scope.fileData[index]);
                    selectedIndex.push(index);
                    $rootScope.$broadcast('selectedFileChange',selectedFile);
                }
            },
            unSelect: function ($scope, index) {
                var i = selectedIndex.indexOf(index);
                if (i >= 0) {
                    GKFileListView.unselectItem(index);
                    selectedIndex.splice(i, 1);
                    selectedFile.splice(i, 1);
                    $rootScope.$broadcast('selectedFileChange',selectedFile);
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
                $scope.view = view;
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
                if ($scope.keyword) {
                    if ([GKPartition.teamFile,GKPartition.joinFile,GKPartition.subscribeFile].indexOf($scope.partition)>=0) {
                        source = 'api';
                        GKSearch.setSearchState('loading');
                        var condition = GKSearch.getCondition();
                        var mountId = GKSearch.getMountId();
                        GKApi.searchFile(condition, mountId).success(function (data) {
                            GKSearch.setSearchState('end');
                            fileList = data['list'];
                            deferred.resolve(GKFile.dealFileList(fileList, source));
                        }).error(function (request) {
                                GKSearch.setSearchState('end');
                                deferred.reject(GKException.getAjaxErrorMsg(request));
                            });
                    } else {
                        fileList = $filter('filter')($scope.fileData, {filename: $scope.keyword});
                        deferred.resolve(fileList);
                        GKSearch.setSearchState('end');
                    }
                } else {
                    if ([GKPartition.teamFile,GKPartition.subscribeFile,GKPartition.joinFile].indexOf($scope.partition)>=0) {
                        var source = 'api', option = {};
                        if ($scope.filter == 'trash') {
                            option.recycle = true;
                        } else {
                            if ([GKPartition.teamFile,GKPartition.joinFile].indexOf($scope.partition)>=0) {
                                source = 'client';
                                option.current = 1;
                            }
                        }
                        GKFile.getFileList($scope.mountId, $scope.path, source,option).then(function(list){
                            deferred.resolve(list);
                        },function(re){
                            deferred.reject(re);
                        });
                    } else {
                        GKSmartFolder.getList($scope.filter).then(function(list){
                            deferred.resolve(list);
                        },function(re){
                            deferred.reject(re);
                        });
                    }
                }
                return deferred.promise;
            },
            refreahData: function ($scope, selectPath) {
                var context = this;
                $scope.loadingFileData = true;
                $scope.errorMsg = '';
                GKFileList.getFileData($scope).then(function (newFileData) {
                    $scope.loadingFileData = false;
                    var order = $scope.order;
                    if ($scope.order.indexOf('filename') >= 0) {
                        var desc = $scope.order.indexOf('-') ? '-' : '+';
                        order = [desc + 'dir', $scope.order];
                    }
                    $scope.fileData = $filter('orderBy')(newFileData, order);
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
                        if ($scope.keyword) {
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
    .factory('GKSearch', [function () {
        var searchState = '',
            searchCondition = '',
            keyword = '',
            JSONCondition;
        return {
            checkExist: function (field) {
                if (!JSONCondition || !JSONCondition['include'] || !JSONCondition['include'][field]) {
                    return false;
                }
                return true;
            },
            getKeyWord: function () {
                if (!this.checkExist('keywords')) {
                    return '';
                }
                return JSONCondition['include']['keywords'][1] || '';
            },
            getMountId:function(){
                if (!this.checkExist('mount_id')) {
                    return 0;
                }
                return JSONCondition['include']['mount_id'][1] || 0;
            },
            setSearchState: function (state) {
                searchState = state;
            },
            getSearchState: function () {
                return searchState;
            },
            setCondition: function (condition) {
                searchCondition = condition;
                JSONCondition = JSON.parse(searchCondition);
            },
            getConditionField: function (field) {
                if (!this.checkExist(field)) {
                    return null;
                }
                var value = JSONCondition['include'][field];
                var reValue;
                if (value[0] == 'in') {
                    reValue = JSONCondition['include'][field][1];
                } else if (value[0] == 'lt') {
                    reValue = [0, dateline[1]];
                }
                else if (value[0] == 'gt') {
                    reValue = [value[1], 0];
                } else if (value[0] == 'eq') {
                    reValue = value[1];
                } else {
                    reValue = value[1];
                }
                return reValue;
            },
            getCondition: function () {
                return searchCondition;
            },
            reset: function () {
                searchState = '';
                searchCondition = '';
                keyword = '';
            }
        }
    }])
    .factory('GKHistory', ['$q', '$location', '$rootScope', function ($q, $location, $rootScope) {
        return new GKHistory($q, $location, $rootScope);
    }])
    .factory('GKDialog', [function () {
        return {
            chat: function (mountId,fullpath) {
                fullpath = angular.isDefined(fullpath)?fullpath:'';
                if(!mountId) return;
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///' + UIPath + '/chat.html#/?mountid=' + mountId+'&fullpath='+fullpath;
                var data = {
                    url: url,
                    type:'single',
                    width: 820,
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
                if(!has && ['syncdownload','syncupload'].indexOf(type)>=0){
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

function GKHistory($q, $location, $rootScope) {
    var self = this,
        update = true,
        history = [],
        current,
        maxLen = 100,
        reset = function () {
            history = [$location.search()];
            current = 0;
            update = true;
        },
        go = function (fwd) {
            var deferred = $q.defer();
            if ((fwd && self.canForward()) || (!fwd && self.canBack())) {
                update = false;
                $location.search(history[fwd ? ++current : --current]);
                return  deferred.resolve();
            }
            return deferred.reject();
        };
    this.canForward = function () {
        return current < history.length - 1;
    };
    this.canBack = function () {
        return current > 0;
    }
    this.back = function () {
        return go();
    }
    this.forward = function () {
        return go(true);
    }

    $rootScope.$on('$locationChangeSuccess', function () {
        var params = $location.search();
        if (!params.partition) return;
        if (!jQuery.isEmptyObject(params)) {
            var l = history.length,
                cwd = params;
            if (update) {
                current >= 0 && l > current + 1 && history.splice(current + 1);
                if (history[history.length - 1] != cwd) {
                    history.push(cwd);
                    if (history.length > maxLen) {
                        history.splice(0, 1);
                    }
                }
                current = history.length - 1;
            }
            update = true;
        }
        ;
    });

    reset();
}
