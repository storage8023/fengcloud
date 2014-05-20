'use strict';

/* Directives */
angular.module('gkClientIndex.directives', [])
    .directive('fileContextMenu', ['GKAuth','$rootScope','GKFileList','GKOpt',function (GKAuth,$rootScope,GKFileList,GKOpt) {
        return {
            restrict: 'A',
            link:function($scope, $element, $attrs ){
                jQuery.contextMenu({
                    selector:'.list_body',
                    reposition: false,
                    zIndex: 99,
                    animation: {
                        show: "show",
                        hide: "hide"
                    },
                    build:function(){
                        var isSearch = $scope.search.length ? true : false;
                        var selectedFile = GKFileList.getSelectedFile();
                        var optKeys = GKOpt.getOpts($rootScope.PAGE_CONFIG.file, selectedFile, $rootScope.PAGE_CONFIG.partition, $rootScope.PAGE_CONFIG.filter, $rootScope.PAGE_CONFIG.mount, isSearch);
                        var excludeRightOpts = [];
                        var rightOpts = {};

                        angular.forEach(optKeys, function (value) {
                            if (excludeRightOpts.indexOf(value) < 0) {
                                var opt = $scope.allOpts[value];
                                if (opt) {
                                    if (value == 'open_with' && jQuery.isEmptyObject(opt.items)) {
                                        return;
                                    }
                                    if (value != 'open_with' && !!opt.items && jQuery.isEmptyObject(GKOpt.checkSubOpt(optKeys, opt.items))) {
                                        return;
                                    }
                                    rightOpts[value] = opt;
                                }
                            }
                        });
                        return {
                            items:rightOpts
                        };
                    }
                });

            }
        }
    }])
    .directive('checkAuth', ['GKAuth','$rootScope',function (GKAuth,$rootScope) {
        return {
            restrict: 'A',
            link:function(scope, element, attrs ){
                var checkAuth = attrs.checkAuth;
                scope.$watch('PAGE_CONFIG.mount',function(val){
                    var hasAuth = GKAuth.check(val,$rootScope.PAGE_CONFIG.partition,checkAuth);
                    if(!hasAuth){
                        element.hide();
                    }else{
                        element.show();
                    }
                })
            }
        }
    }])
    .directive('gkVersionContextmenu', ['$timeout','$rootScope','GKException','GKPath',function ($timeout,$rootScope,GKException,GKPath) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                var getVersion =  function(triggerElem){
                    return Number(triggerElem.data('version'));
                };

                var getDir =  function(triggerElem){
                    return Number(triggerElem.data('dir'));
                };

                var getFullpath =  function(triggerElem){
                    return triggerElem.data('fullpath');
                };

                var getMountId = function(){
                    return Number($scope.localFile.mount_id || $rootScope.PAGE_CONFIG.mount.mount_id);
                };

                var getHash = function(triggerElem){
                    return triggerElem.data('hash');
                };

                $scope.$watch($attrs.gkVersionContextmenu,function(newValue){
                    if(!newValue){
                        jQuery.contextMenu('destroy', '.history_list > li');
                    }else{
                        /**
                         * 设置右键菜单
                         */
                        jQuery.contextMenu({
                            selector: '.history_list > li',
                            reposition: true,
                            zIndex: 9999,
                            className: 'version_contextmenu',
                            events: {
                                show: function () {
                                    this.addClass('hover');
                                },
                                hide: function () {
                                    this.removeClass('hover');
                                }
                            },
                            build: function($trigger, e) {
                                var triggerElem = jQuery($trigger);
                                var dir = getDir(triggerElem);
                                var fullpath = getFullpath(triggerElem);
                                var mountId = getMountId();
                                var hash = getHash(triggerElem);
                                var file = gkClientInterface.getFileInfo({
                                    uuidhash:hash,
                                    mountid:mountId
                                })
                                if(!file|| !file.path){
                                    return;
                                }
                                var items = {};
                                if(dir){
                                    if(triggerElem.hasClass('act_0')){
                                        return;
                                    }
                                    items = {
                                        'open': {
                                            name: '打开',
                                            callback: function (key,opt) {
                                                $timeout(function(){
                                                    GKPath.gotoFile(mountId,file.path);
                                                })
                                            }
                                        },
                                        'goto': {
                                            name: '位置',
                                            callback: function (key,opt) {
                                                $timeout(function(){
                                                    GKPath.gotoFile(mountId, Util.String.dirName(file.path),file.path);
                                                })
                                            }
                                        },
                                        'saveto': {
                                            name: '保存到本地',
                                            callback: function (key,opt) {
                                                var param = {
                                                    list:[{
                                                        mountid:mountId,
                                                        webpath:file.path,
                                                        dir:1
                                                    }]
                                                }
                                                gkClientInterface.saveToLocal(param);
                                            }
                                        }
                                    };
                                }else{
                                    var version = getVersion(triggerElem);
                                    items = {
                                        'open': {
                                            name: '打开',
                                            callback: function (key,opt) {
                                                if(!version){
                                                    return;
                                                }
                                                gkClientInterface.open({
                                                    mountid:mountId,
                                                    webpath:file.path,
                                                    version:version
                                                });
                                            }
                                        },
                                        'goto': {
                                            name: '位置',
                                            callback: function (key,opt) {
                                                $timeout(function(){
                                                    GKPath.gotoFile(mountId, Util.String.dirName(file.path),file.path);
                                                })
                                            }
                                        },
                                        'recover': {
                                            name: '还原',
                                            callback: function (key,opt) {
                                                if(!version){
                                                    return;
                                                }
                                                gkClientInterface.revert({
                                                    mountid:mountId,
                                                    webpath:file.path,
                                                    version:version
                                                },function(msg){
                                                    if(!msg.error){
                                                        angular.extend(msg,{
                                                            mount_id:mountId
                                                        });
                                                        alert('恢复成功');
                                                        $rootScope.$broadcast('UpdateFileInfo',msg);
                                                    }else{
                                                        GKException.handleClientException(msg);
                                                    }
                                                });
                                            }
                                        },
                                        'saveto': {
                                            name: '保存到本地',
                                            callback: function (key,opt) {
                                                if(!version){
                                                    return;
                                                }
                                                var param = {
                                                    list:[{
                                                        mountid:mountId,
                                                        webpath:file.path,
                                                        version:version
                                                    }]
                                                }
                                                gkClientInterface.saveToLocal(param);
                                            }
                                        }
                                    };
                                }
                                if($scope.localFile.dir == 0){
                                    delete items['goto'];
                                }
                                return {
                                    items:items
                                };
                            }
                        });
                    }
                })
                $scope.$on('$destroy',function(){
                    jQuery.contextMenu('destroy', '.history_list > .item');
                })
            }
        }
    }])
    .directive('fixScroll', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                /**
                 * fix列表出现滚动条后列表头部对不齐的问题
                 */
                var checkScroll = function (elem) {
                    var scrollY = false;
                    var st = elem.scrollTop();
                    elem.scrollTop(st > 0 ? -1 : 1);
                    if (elem.scrollTop() !== st) {
                        scrollY = scrollY || true;
                    }
                    elem.scrollTop(st);
                    return scrollY;
                }

                var setListHeaderWidth = function () {
                    if (checkScroll($element.find('.list_body'))) {
                        $element.find('.file_list_header,.file_list_hint').css('right', 8);
                    } else {
                        $element.find('.file_list_header,.file_list_hint').css('right', 0);
                    }
                };

                jQuery(window).on('resize.fixScroll', function () {
                    setListHeaderWidth();
                });

                var fixTimer;

                fixTimer = $timeout(function () {
                    setListHeaderWidth();
                }, 0);

                $scope.$on('$locationChangeSuccess',function(){
                    if (fixTimer) {
                        $timeout.cancel(fixTimer);
                        fixTimer = null;
                    }
                     fixTimer = $timeout(function () {
                        setListHeaderWidth();
                    }, 0);
                })

                $scope.$on('$destroy', function () {
                    jQuery(window).off('resize.fixScroll');
                    if (fixTimer) {
                        $timeout.cancel(fixTimer);
                        fixTimer = null;
                    }
                    setListHeaderWidth = checkScroll = null;
                })
            }
        };
    }])
    .directive('keybroadNav', ['GKFileList', 'GKOpt',function (GKFileList,GKOpt) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                var getColCount = function () {
                    var colCount = 4;
                    if ($scope.view == 'thumb' && $element.find('.file_item').size()) {
                        colCount = Math.floor($element.width() / $element.find('.file_item').eq(0).outerWidth(true));
                    }
                    return colCount;
                };

                /**
                 * up left 键
                 * @param $event
                 */
                var upLeftPress = function ($event) {
                    if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) >= 0) {
                        return;
                    }
                    /**
                     * 非所缩略图模式不激活左右键
                     */
                    if ($scope.view != 'thumb' && $event.keyCode == 37) {
                        return;
                    }
                    var step = 1;
                    if ($scope.view == 'thumb' && $event.keyCode == 38) {
                        step = getColCount();
                    }
                    /**
                     * 初始index是最后一个
                     * @type {number}
                     */
                    var initIndex = $scope.fileData.length + step - 1;
                    /**
                     * 如果已经选中，则取已选中的最小一个
                     */
                    var selectedIndex = GKFileList.getSelectedIndex();
                    if (selectedIndex.length) {
                        initIndex = Math.min.apply('', selectedIndex);
                    }
                    var newIndex = initIndex - step;
                    if (newIndex < 0) {
                        newIndex = 0;
                    }

                    if ($event.shiftKey) {
                        for (var i = (initIndex > ($scope.fileData.length - 1) ? $scope.fileData.length - 1 : initIndex); i >= newIndex; i--) {
                            GKFileList.select($scope, i, true);
                        }
                    } else {
                        GKFileList.unSelectAll($scope);
                        GKFileList.select($scope, newIndex);
                        $scope.shiftLastIndex = newIndex;
                    }
                };

                /**
                 * down right 键
                 * @param $event
                 */
                var downRightPress = function ($event) {
                    if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) >= 0) {
                        return;
                    }
                    /**
                     * 非所缩略图模式不激活左右键
                     */

                    if ($scope.view != 'thumb' && $event.keyCode == 39) {
                        return;
                    }
                    var step = 1;
                    if ($scope.view == 'thumb' && $event.keyCode == 40) {
                        step = getColCount();
                    }
                    /**
                     * 初始index是第一个
                     * @type {number}
                     */
                    var initIndex = -1 * step;
                    /**
                     * 如果已经选中，则取已选中的最大一个
                     */
                    var selectedIndex = GKFileList.getSelectedIndex();
                    if (selectedIndex.length) {
                        initIndex = Math.max.apply('', selectedIndex);
                    }
                    var newIndex = initIndex + step;
                    if (newIndex > $scope.fileData.length - 1) {
                        newIndex = $scope.fileData.length - 1;
                    }
                    if ($event.shiftKey) {
                        for (var i = (initIndex > 0 ? initIndex : 0); i <= newIndex; i++) {
                            GKFileList.select($scope, i, true);
                        }
                    } else {
                        GKFileList.unSelectAll($scope);
                        GKFileList.select($scope, newIndex, true);
                        $scope.shiftLastIndex = newIndex;
                    }
                };

                /**
                 * 监听键盘事件
                 */
                jQuery(document).on('keydown.shortcut', function ($event) {
                    if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) >=0) {
                       return;
                    }
                    $scope.$apply(function () {
                        var ctrlKeyOn = $event.ctrlKey || $event.metaKey;
                        switch ($event.keyCode) {
                            case 13: //enter
                                var selectedFile = GKFileList.getSelectedFile();
                                if (selectedFile && selectedFile.length) {
                                    $scope.handleDblClick(selectedFile[0]);
                                }
                                break;
                            case 37: //up
                            case 38: //left
                                upLeftPress($event);
                                break;
                            case 39: //down
                            case 40: //right
                                downRightPress($event);
                                break;
                            case 46: //Delete
                                $scope.triggleOptByShortCut(GKOpt.getAccessKey('del'));
                                break;
                            case 67: //c
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut(GKOpt.getAccessKey('copy'));
                                }
                                break;
                            case 80: //p
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut(GKOpt.getAccessKey('view_property'));
                                }
                                break;
                            case 83: //s
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut(GKOpt.getAccessKey('save'));
                                }
                                break;
                            case 86: //v
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut(GKOpt.getAccessKey('paste'));
                                }
                                break;
                            case 88: //x
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut(GKOpt.getAccessKey('cut'));
                                }
                                break;
                        }
                    });
                });


                $scope.$on('$destroy', function () {
                    jQuery(document).off('keydown.shortcut')
                    getColCount = upLeftPress = downRightPress = null;

                })
            }
        };
    }])
    .directive('renameFile', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                var fileItem = $element,
                    input,
                    nameElem;
                var fn = $parse($attrs.renameFileSubmit);

                var clear = function(){
                    fileItem.removeClass('file_item_edit');
                    if (input) {
                        input.remove();
                        input = null;
                    }
                    if (nameElem) {
                        nameElem.show();
                        nameElem = null;
                    }
                }
                $scope.$watch($attrs.renameFile, function (value, oldValue) {
                    if (value == oldValue) return;
                    if (value == true) {
                        var oldFileName = Util.String.baseName($element.data('fullpath'));
                        var dir = $element.data('dir');
                        input = jQuery('<input name="new_file_name" type="text" id="new_file_name" value="' + oldFileName + '" class="new_file_name form-control" />');
                        fileItem.addClass('file_item_edit');
                        nameElem = fileItem.find('.name');
                        nameElem.hide().after(input);
                        var selectionEnd = oldFileName.length;
                        var extIndex = oldFileName.lastIndexOf('.');
                        if (dir == 0 && extIndex > 0) {
                            selectionEnd = extIndex;
                        }
                        input[0].selectionStart = 0;
                        input[0].selectionEnd = selectionEnd;
                        input.focus();
                        var submit = function(){
                            var newFileName = jQuery.trim(input.val());
                            if (!newFileName.length) newFileName = oldFileName;
                            var extIndex = newFileName.lastIndexOf('.');
                            if(extIndex>=0 && !jQuery.trim(newFileName.slice(0,extIndex))){
                                alert('请输入文件名');
                                newFileName = oldFileName;
                            }
                            fn($scope, {filename: newFileName});
                        };

                        input.on('keydown', function (e) {
                            if (e.keyCode == 13) {
                                submit();
                                return false;
                            }
                        });
                        input.on('blur', function () {
                            submit();
                        })
                        input.on('dblclick', function () {
                            submit();
                        })
                    } else {
                        clear();
                    }
                });


                $scope.$on('$destroy',function(){
                    clear();
                })

                $scope.$on('$locationChangeSuccess',function(){
                    clear();
                })
            }
        };
    }])
    .directive('createNewFolder', ['GKFileList', '$compile', '$parse', function (GKFileList, $compile, $parse) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                var newFileItem,
                    fn = $parse($attrs.createFileSubmit);
                $scope.$watch($attrs.createNewFolder, function (value, oldValue) {
                    if (value == oldValue) return;
                    if (value == true) {
                        $element.scrollTop(0);
                        var newFileExt = $attrs.createNewFileExt;
                        var dir = 0;
                        if(!newFileExt){
                            dir = 1 ;
                        }
                        var defaultNewName = GKFileList.getDefualtNewName($scope,newFileExt);
                        var isShare = 0;
                        var isSync = $scope.PAGE_CONFIG.file.syncpath ? 1 : 0;
                        GKFileList.unSelectAll($scope);
                        $scope.submitNewFileName = function (filename) {
                            if (!filename.length) {
                                filename = defaultNewName
                            }
                            if(newFileExt){
                                var ext = Util.String.getExt(filename);
                                if(ext != newFileExt){
                                    filename+='.'+newFileExt;
                                }
                            }

                            fn($scope, {filename: filename,dir:dir});
                        };

                        newFileItem = $compile(angular.element('<new-file-item dir="{{'+dir+'}}" view="{{view}}" default-new-name="' + defaultNewName + '" is-share="{{' + isShare + '}}" is-sync="{{' + isSync + '}}" on-submit="submitNewFileName(filename)"></new-file-item>'))($scope);
                        newFileItem.addClass('selected').prependTo($element);
                    } else {
                        if (newFileItem) {
                            newFileItem.remove();
                        }
                    }
                });

                $scope.$on('$destroy',function(){
                  if(newFileItem){
                      newFileItem.remove();
                      newFileItem = null;
                  }
                })

                $scope.$on('$locationChangeSuccess',function(){
                    if(newFileItem){
                        newFileItem.remove();
                        newFileItem = null;
                    }
                })
            }
        };
    }])
    .directive('contextmenu', ['GKContextMenu', function (GKContextMenu) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                /**
                 * 设置右键菜单
                 */
                jQuery.contextMenu({
                    selector: '.left_sidebar .abn-tree .abn-tree-row',
                    reposition: false,
                    zIndex: 9999,
                    className: 'sidebar_contextmenu',
                    animation: {
                        show: "show",
                        hide: "hide"
                    },
                    events: {
                        show: function () {
                            this.addClass('hover');
                        },
                        hide: function () {
                            this.removeClass('hover');
                        }
                    },
                    build: function ($trigger, e) {
                        var items = GKContextMenu.getSidebarMenu($trigger);
                        return {
                            callback: function () {

                            },
                            items: items
                        }
                    }
                });
            }
        }
    }])
    .directive('queueItem', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/queue_item.html'
        }
    }])
    .directive('queueSyncItem', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/queue_sync_item.html'
        }
    }])
    .directive('networkUnconnect', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/network_unconnect.html'
        }
    }])
    .directive('newFileItem', ['$timeout', function ($timeout) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/new_file_item.html',
            scope: {
                'onSubmit': '&',
                'view': '@',
                'isShare': '@',
                'isSync': '@',
                'defaultNewName': '@',
                'dir':'@'
            },
            link: function ($scope, $element, $attrs) {
                $scope.filename = $scope.defaultNewName ? $scope.defaultNewName : '新建文件夹';
                var input = $element.find('input');
                var submit = function(){
                    if ($scope.onSubmit != null) {
                        var extIndex = $scope.filename.lastIndexOf('.');
                        if(extIndex>=0 && !jQuery.trim($scope.filename.slice(0,extIndex))){
                            alert('请输入文件名');
                            $scope.filename = $scope.defaultNewName;
                            reset();
                            return;
                        }
                        $scope.onSubmit({
                            filename: $scope.filename
                        });
                    }
                };
                input.on('blur', function (event) {
                    submit();
                })

                input.on('keydown', function (event) {
                    if (event.keyCode == 13) {
                        $scope.$apply(function () {
                            submit();
                        });
                    }
                });
                var reset = function(){
                    $timeout(function () {
                        input[0].select();
                        var selectionEnd = $scope.defaultNewName.length;
                        var extIndex = $scope.defaultNewName.lastIndexOf('.');
                        if ($scope.dir == 0 && extIndex > 0) {
                            selectionEnd = extIndex;
                        }
                        input[0].selectionStart = 0;
                        input[0].selectionEnd = selectionEnd;
                        input.focus();
                    }, 0)
                };

                reset();

                $scope.$on('$destroy', function () {
                    input.off('blur').off('keydown');
                    input = null;
                })
            }
        }
    }])
    .directive('editName', [function () {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {

            }
        }
    }])
    .directive('gkinput', [function () {
        return {
            restrict: 'E',
            link: function (scope, element, attrs) {

            }
        }
    }])
    .directive('uiSelectable', ['uiSelectableConfig', 'GKFileList', function (uiSelectableConfig, GKFileList) {
        return {
            restrict: 'A',
            require: ['ngModel'],
            link: function (scope, element, attrs, ctrlArr) {

                var ngModel = ctrlArr[0];
                var uiSelectableDragDropCtrl = ctrlArr[1];

                function combineCallbacks(first, second) {
                    if (second && (typeof second === "function")) {
                        return function (e, ui) {
                            first(e, ui);
                            second(e, ui);
                        };
                    }
                    return first;
                }

                var opts = { filter: 'li' };
                angular.extend(opts, uiSelectableConfig);

                var callbacks = {
                    selected: null,
                    selecting: null,
                    start: null,
                    stop: null,
                    unselected: null,
                    unselecting: null
                };

                if (ngModel) {
                    ngModel.$render = function () {
                        element.selectable("refresh");
                    };
                    callbacks.selected = function (e, ui) {
                        scope.$apply(function () {
                            GKFileList.select(scope, jQuery(ui.selected).index(), true);
                        })
                    };
                    callbacks.stop = function (e, ui) {

                    };
                    callbacks.start = function (e, ui) {
                        scope.$apply(function () {
                            GKFileList.unSelectAll(scope);
                        })
                    };
                    callbacks.unselected = function (e, ui) {
                        scope.$apply(function () {
                            GKFileList.unSelect(scope, jQuery(ui.selected).index());
                        })
                    };
//                    callbacks.selecting = function(e, ui) {
//                        var offsetParent = $(ui.selecting).offsetParent();
//                        var position = $(ui.selecting).position();
//                        var grid = position.top - offsetParent.height();
//                        if(grid-20>0){
//                            offsetParent.scrollTop(grid);
//                        }
//                    };
                }

                angular.forEach(callbacks, function (value, key) {
                    opts[key] = combineCallbacks(value, opts[key]);
                });
                element.selectable(opts);
            }
        };
    }])
    .directive('href', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('click', function () {
                    var href = attrs['href'];
                    var targetElem = element;
                    if (!targetElem.hasClass('gk_blank') && /\/storage#!files:(0|1):(.*?)(:(.*):.*)??$/.test(href)) {
                        if (!RegExp.$2 && !RegExp.$2.length && !RegExp.$4 && !RegExp.$4.length) {
                            //gkClientInterface.openSyncDir();
                        } else {
                            var dir = 0, path = '', uppath = '', file = '';
                            if (RegExp.$2 && RegExp.$2.length) {
                                uppath = decodeURIComponent(RegExp.$2);
                            }
                            if (RegExp.$4 && RegExp.$4.length) {
                                file = decodeURIComponent(RegExp.$4);
                                if (Util.String.lastChar(file) === '/') {
                                    dir = 1;
                                }
                                file = Util.String.rtrim(file, '/');
                            } else {
                                dir = 1;
                            }
                            path = (uppath.length ? uppath + '/' : '') + file;
//                            if (dir) {
//                                gkClientInterface.openSyncDir(path + '/');
//                            } else {
//                                gkClientInterface.openPathWithSelect(path);
//                            }
                        }
                        return false;
                    } else if ($.trim(href) != '' && $.trim(href).indexOf('#') != 0 && !/^javascript:.*?$/.test(href)) {
                        var param = {
                            url: href,
                            sso: 0
                        };
                        if ($rootScope.PAGE_CONFIG && $rootScope.PAGE_CONFIG.member || targetElem.data('sso') == 1) {
                            param.sso = 1;
                        }
                        var url = gkClientInterface.getUrl(param);
                        gkClientInterface.openUrl(url);
                        return false;
                    }
                })
            }
        }
    }])
    .directive('loadingEllipsis', ['$interval', function ($interval) {
        return {
            replace: true,
            restrict: 'E',
            template: '<span ng-bind="ellipsis" style="margin: 0 0 0 3px"></span>',
            link: function ($scope) {
                var cell = '. ';
                $scope.ellipsis = '';
                var max = cell.length * 3;
                $interval(function () {
                    if ($scope.ellipsis.length >= max) {
                        $scope.ellipsis = '';
                    } else {
                        $scope.ellipsis += cell;
                    }
                }, 500)
            }
        }
    }])
    .directive('nofileRightSidebar', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/nofile_right_sidebar.html"
        }
    }])
    .directive('member', ['GKPartition','GKDialog', '$rootScope', 'localStorageService','$interval','GKModal','GKNews','GKApi','$timeout','GKBrowserMode',function (GKPartition,GKDialog,$rootScope,localStorageService,$interval,GKModal,GKNews,GKApi,$timeout,GKBrowserMode) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/member.html",
            scope: {
                user: '=',
                mode:'='
            },
            link: function ($scope, $element) {
                var unreadMsgKey = $rootScope.PAGE_CONFIG.user.member_id+'_unreadmsg';

                $timeout(function(){
                    $scope.newMsg = !!localStorageService.get(unreadMsgKey);
                    $scope.openNews = function(){
                        GKModal.news(GKNews, GKApi);
                    }
                },1500);

                var t,count = 0;
                $scope.$on('UpdateMessage', function () {
                    if(t){
                        $interval.cancel(t);
                    }
                    t = $interval(function(){
                        if(count==10){
                            if(t){
                                $interval.cancel(t);
                                count = 0;
                            }
                            $scope.newMsg = true;
                            localStorageService.add(unreadMsgKey,$scope.newMsg);
                            return;
                        }
                        $scope.newMsg = !$scope.newMsg;
                        count++;
                    },150);
                })

                $scope.$on('newsOpen',function(){
                    if(t){
                        $interval.cancel(t);
                        count = 0;
                    }
                    $scope.newMsg = false;
                    localStorageService.remove(unreadMsgKey);
                    gkClientInterface.clearMessage();
                })

                $scope.personalOpen = function ($scope) {
                    GKDialog.openSetting('account');
                };

                $scope.handleCreate = function () {
                    GKModal.createTeam();
                };

                $scope.handleAdd = function () {
                    GKModal.joinTeam();
                };

                $scope.gotoUpgrade = function () {
                    var url = gkClientInterface.getUrl({
                        sso:1,
                        url: gkClientInterface.getSiteDomain()+'/pay/order'
                    });
                    gkClientInterface.openUrl(url);
                };

                var hideTimer;

                var settingsWrapper = $element.find('.setting_wrapper_dropdown');

                $element.find('.account_info,.setting_wrapper_dropdown').on('mouseenter',function(){
                    if(hideTimer){
                       $timeout.cancel(hideTimer);
                    }
                    settingsWrapper.fadeIn(100);
                    $element.addClass('hover');
                })

                $element.find('.account_info,.setting_wrapper_dropdown').on('mouseleave',function(){
                    //return;
                    hideTimer = $timeout(function(){
                        settingsWrapper.fadeOut(100);
                        $element.removeClass('hover');
                    },200)
                })

                $element.find('.toggle_btn_wrapper').click(function(){
                    var $this = jQuery(this);
                    $scope.$apply(function(){
                        if($this.hasClass('toggle_btn_2')){
                            GKBrowserMode.setMode('chat');
                            $this.removeClass('toggle_btn_2');
                            //判断是否为智能文件夹
                            if(GKPartition.isSmartFolderPartition($rootScope.PAGE_CONFIG.partition)){
                                $rootScope.$broadcast("initSelectedBranch");
                            }
                        }else{
                            GKBrowserMode.setMode('file');
                            $this.addClass('toggle_btn_2');
                        }
                    })
                })
            }
        }
    }])
    .directive('singlefileRightSidebar', ['GKFilter', 'GKSmartFolder', '$timeout', 'GKApi', '$rootScope', 'GKModal', 'GKException', 'GKPartition', 'GKFile', 'GKMount', '$interval', 'GKDialog','GKChat','GKPath','$location','GKAuth','$filter','$document','GKMode',function (GKFilter, GKSmartFolder, $timeout, GKApi, $rootScope, GKModal, GKException, GKPartition, GKFile, GKMount, $interval,GKDialog,GKChat,GKPath,$location,GKAuth,$filter,$document,GKMode) {
        return {
            replace: true,
            restrict: 'E',
            scope: true,
            templateUrl: "views/singlefile_right_sidebar.html",
            link: function ($scope, $element) {
                $scope.file = {};
                $scope.tag = {
                    content:''
                };
                $scope.showTab = false; //是否显示共享等tab
                $scope.fileExist = false;
                var fileInterval,
                    lastGetRequest,
                    lastClientSidebarRequest,
                    histories;

                var getOptMountId = function (file) {
                    var mountID;
                    if (!file) {
                        mountID = $rootScope.PAGE_CONFIG.mount.mount_id;
                    } else {
                        mountID = file['mount_id'] || $rootScope.PAGE_CONFIG.mount.mount_id;
                    }
                    return Number(mountID);
                };
                $scope.smarts = GKSmartFolder.getFolders(['recent','recent_visit']);

                var getFileState = function (mountId, fullpath) {
                    //网络断开后不重新连接
                    if($rootScope.PAGE_CONFIG.networkConnected ==0){
                        return;
                    }
                    var info = gkClientInterface.getTransInfo({
                        mountid: mountId,
                        webpath: fullpath
                    });
                    if (info.status == 1) {
                        $scope.sidbarData.icon = '';
                        if (fileInterval) {
                            $interval.cancel(fileInterval);
                            fileInterval = null;
                        }

                        getFileInfo($scope.localFile);
                        return;
                    }

                    if (info.offset == 0 || info.offset === undefined) {
                        $scope.sidbarData.title = '准备上传中';
                    } else {
                        var offset = Number(info.offset);
                        var filesize = Number(info.filesize || 0);
                        if (filesize != 0) {
                            if (offset != 0) {
                                var str = Math.round(offset / filesize * 100) + '%';
                                $scope.sidbarData.title = '正在上传中' + str;
                            }
                        } else {
                            $scope.sidbarData.title = '正在上传中';
                        }
                    }
                };
                /**
                 * 通过接口获取文件信息
                 */
                var getFileInfo = function (file, options) {
                    if (fileInterval) {
                        $interval.cancel(fileInterval);
                        fileInterval = null;
                    }
                    if(lastGetRequest){
                        lastGetRequest.abort();
                        lastGetRequest = null;
                    }
                    if(lastClientSidebarRequest){
                        lastClientSidebarRequest.abort();
                        lastClientSidebarRequest = null;
                    }
                    var defaultOptions = {
                        data: '',
                        cache: true,
                        first:false
                    };

                    options = angular.extend({}, defaultOptions, options);
                    var mountId = getOptMountId(file);
                    var mount = GKMount.getMountById(mountId);
                    var fullpath = file.dir == 1 ? file.fullpath + '/' : file.fullpath;
                    var formatTag = [];
                    var extParam = {
                        type:options.data == 'file'?'':'ext'
                    };

                    lastGetRequest = GKApi.info(mountId, fullpath,extParam).success(function (data) {
                        $scope.$apply(function () {
                            $scope.fileLoaded = true;
                            $scope.fileExist = true;
                            var formatFile = GKFile.formatFileItem(data, 'api');
                            angular.extend($scope.file, formatFile);
                            if (data.history) {
                                histories = data.history.map(function(item){
                                    item.milestone = item.property?item.property.milestone : 0;
                                    return item;
                                });
                            }else{
                                histories = [];
                            }
                            $scope.histories = histories;
                            $scope.tag.content = $scope.file.tag;
                            if ($scope.file.cmd > 0 && mount && GKMount.isMember(mount)) {
                                $scope.showTab = true;
                            } else {
                                $scope.showTab = false;
                            }
                        });
                    }).error(function (request,textStatus,errorThrown) {
                                $scope.fileLoaded = true;
                                $scope.fileExist = false;
                                var errorCode = GKException.getAjaxErroCode(request);
                                if (errorCode == 404 || String(errorCode).slice(0, 3) != '404') {
                                    return;
                                }
                                if (errorCode == 40402 && $scope.localFile.status != 1) {
                                    $scope.sidbarData = {
                                        icon: 'trash',
                                        title: '云端已删除'
                                    };
                                    return;
                                }
                                $scope.sidbarData = {
                                    icon: 'uploading'
                                };
                                getFileState(mountId, file.fullpath);
                                fileInterval = $interval(function () {
                                    getFileState(mountId, file.fullpath);
                                }, 1000);

                        });

                    $scope.showChatBtn = GKAuth.check(mount,'','file_discuss');
                    $scope.showLinkBtn = GKAuth.check(mount,'','file_link');
                    $scope.showHistory = GKAuth.check(mount,'','file_history');
                    $scope.showMilestone = GKAuth.check(mount,'','file_history_unlimit');
                };

                $scope.$watch('localFile', function (file, oldValue) {
                    if (!file || !oldValue || file == oldValue || file.fullpath == oldValue.fullpath) {
                        return;
                    }
                    if (fileInterval) {
                        $interval.cancel(fileInterval);
                        fileInterval = null;
                    }
                    $scope.onlyShowMileStone = false;
                    $scope.tag.content = '';
//                    $scope.fileLoaded = false;
                    getFileInfo(file);
                },true);
                $scope.fileLoaded = false;
                getFileInfo($scope.localFile,{first:true});

                $scope.editingTag = false;
                $scope.handleFocus = function($event){
                    $scope.editingTag = true;
                }

//                $document.on('mousedown',function(e){
//                    if(jQuery(e.target).parents('.post_textarea_wrapper').size() || jQuery(e.target).hasClass('tag_edit')){
//                        return
//                    }
//                    $scope.$apply(function(){
//                        $scope.editingTag = false;
//                        $scope.tag.content = $scope.file.tag;
//                    })
//                })

                /**
                 * 添加tag
                 * @param tag
                 */
                $scope.postTag = function (tag) {
                    tag = String(tag);
                    var reg = /\/|\\|\:|\*|\?|\"|<|>|\|/;
                    if (reg.test(tag)) {
                        alert('注释不能包含下列任何字符： / \\ : * ? " < > |');
                        return;
                    }
                    GKApi.setTag(getOptMountId($scope.file), $scope.file.fullpath, tag).success(function(){
                        $scope.$apply(function(){
                            $scope.editingTag = false;
                        })
                    }).error(function (request) {
                        GKException.handleAjaxException(request);
                    });
                }

                $scope.cancelPostTag = function(){
                    $scope.editingTag = false;
                    $scope.tag.content = $scope.file.tag;
                }

                /**
                 * 检测是否已加标
                 * @param favorite
                 * @param filter
                 * @returns {boolean}
                 */
                $scope.isSmartAdd = function (favorite, filter) {
                    if (!favorite) favorite = [];
                    var type = GKFilter.getFilterType(filter);
                    if (favorite.indexOf(String(type)) >= 0) {
                        return true;
                    }
                    return false;
                };

                /**
                 * 星标
                 * @param star
                 */
                $scope.toggleSmart = function (filter, favorite) {
                    var fullpath = $scope.file.fullpath;
                    var mountId = $scope.file.mount_id || $scope.PAGE_CONFIG.mount.mount_id;
                    if (!fullpath) return;
                    var filterType = String(GKFilter.getFilterType(filter));
                    if (!favorite) favorite = [];
                    var star = favorite.indexOf(filterType) >= 0;
                    if (star) {
                        GKApi.removeFromFav(mountId, fullpath, filterType).success(function () {
                            $scope.$apply(function () {
                                if (GKPartition.isSmartFolderPartition($scope.PAGE_CONFIG.partition) && $scope.filter == filter) {
                                    $scope.$emit('unFav');
                                } else {
                                    Util.Array.removeByValue(favorite, filterType);
                                }
                            })
                        }).error(function (request) {
                                GKException.handleAjaxException(request);
                            });
                    } else {
                        GKApi.addToFav(mountId, fullpath, filterType).success(function () {
                            $scope.$apply(function () {
                                favorite.push(filterType);
                            })
                        }).error(function (request) {
                                GKException.handleAjaxException(request);
                            });
                    }
                };

                /**
                 * 锁定、解锁
                 * @param lock
                 */
                $scope.toggleLock = function(lock){
                    var mountId = getOptMountId($scope.file);
                    var mount = GKMount.getMountById(mountId);
                    if(!mount) return;
                  var param = {
                      webpath: $scope.file.fullpath,
                      mountid: mountId
                  };
                  if(lock){
                      if(!GKAuth.check(mount,'','file_write')){
                          alert('你没有权限锁定该文件');
                          return;
                      }
                      param.status = 1;
                  }else{
                      param.status = 0;
                  }
                    gkClientInterface.toggleLock(param, function (re) {
                        if (re && !re.error) {
                            if(lock){
                                $rootScope.$broadcast('editFileSuccess','lock', mountId,$scope.file.fullpath);
                                $scope.$apply(function(){
                                    $scope.localFile.lock = 2;
                                })

                            }else{
                                $rootScope.$broadcast('editFileSuccess','unlock', mountId,$scope.file.fullpath);
                                $scope.$apply(function(){
                                    $scope.localFile.lock = 0;
                                })
                            }
                        } else {
                            GKException.handleClientException(re);
                        }
                    });
                };

                /**
                 * 打开生成临时链接的窗口
                 * @param file
                 */
                $scope.publishFile = function(file){
                   GKModal.publish(getOptMountId(file),file);
                };

                $scope.showMilestoneDialog = function(file){
                    $scope.$emit("showDiscussHistory",file);
                    return;
                    var firstHistory = histories[0];
                    var oldMsg = '';
                    if(firstHistory){
                        oldMsg = firstHistory['property']?firstHistory['property']['message']||'' : '';
                    }
                    GKModal.setMilestone(getOptMountId(file),file,oldMsg).result.then(function(){
                        if($rootScope.PAGE_CONFIG.browserMode == 'chat'){
                            GKMode.setMode('chat');
                        }
                        $timeout(function(){
                            getFileInfo($scope.localFile, {data: 'sidebar', type: 'history', cache: false});
                        },1000);
                    });
                }

                /**
                 * 双击打开历史版本
                 * @param history
                 */
                $scope.openFile = function(history){
                    var mountId = getOptMountId($scope.file);
                    //判断文件是否存在，不存在则不能打开
                    var file = gkClientInterface.getFileInfo({
                        mountid: mountId,
                        uuidhash: history.hash
                    });
                    if(!file) return;

                    if(history.dir == 1){
                        if(history.act == 0) return;
                        GKPath.gotoFile(mountId,history.fullpath);
                    }else{
                        var version = history.property.version;
                        if(!version){
                            return;
                        }
                        if(!mountId) return;
                        gkClientInterface.open({
                            mountid:mountId,
                            webpath:file.path,
                            version:Number(version)
                        });
                    }

                }

                /**
                 * 滚动加载历史
                 */
                $scope.disableScrollLoadHistory = false;
                $scope.loadHistory = function(){
                    var mountId = getOptMountId($scope.localFile);
                    var fullpath = $scope.localFile.fullpath;
                    $scope.disableScrollLoadHistory = true;
                    var extParam = {
                        type:'ext',
                        start: histories.length,
                        date:''
                    }
                    GKApi.info(mountId, fullpath,'history',false,histories.length).success(function (data) {
                        $scope.$apply(function () {
                            $scope.disableScrollLoadHistory = false;
                            if (data.history) {
                                var moreHistory = data.history.map(function(item){
                                    item.milestone = item.property?item.property.milestone : 0;
                                    return item;
                                });
                                histories = histories.concat(moreHistory);
                                if($scope.onlyShowMileStone){
                                    $scope.histories = $filter('filter')(histories,{milestone:1});
                                }else{
                                    $scope.histories = histories;
                                }

                            }

                        })
                    }).error(function(){
                            $scope.$apply(function () {
                                $scope.disableScrollLoadHistory = false;
                            })
                        })
                };

                var setHistoryMinheight = function(){
                    if(!$element.find('.history_wrapper').size()){
                        return;
                    }
                    var minHeight = $element.outerHeight()- 166 - $element.find('.file_detail_wrapper .section_title').outerHeight();
                    $element.find('.history_wrapper').css({
                        'min-height':minHeight
                    })
                }

                jQuery(window).on('resize.historyList',function(){
                    $timeout(function(){
                        setHistoryMinheight();
                    })
                })

                $timeout(function(){
                    setHistoryMinheight();
                })

                /**
                 * 监听刷新事件
                 */
                $scope.$on('refreshSidebar', function ($event,type) {
                    if(!$scope.fileExist){
                        return;
                    }
                    getFileInfo($scope.localFile, {data: 'sidebar', type: type, cache: false});
                })


                $scope.$watch('onlyShowMileStone',function(newValue){
                    if(newValue){
                        $scope.histories = $filter('filter')(histories,{milestone:1});
                    }else{
                        $scope.histories = histories;
                    }
                })

                $scope.$on('$destroy', function () {
                    jQuery(window).off('resize.historyList');
                    if (fileInterval) {
                        $interval.cancel(fileInterval);
                        fileInterval = null;
                    }
                })

            }
        }
    }])
    .directive('multifileRightSidebar', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/multifile_right_sidebar.html"

        }
    }])
    .directive('toolbar', ['GKFilter', 'GKPartition', 'GKSmartFolder', 'GKMount', '$location', '$compile', '$timeout','$rootScope', function (GKFilter, GKPartition, GKSmartFolder, GKMount, $location, $compile, $timeout,$rootScope) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/toolbar.html",
            link: function ($scope, $element) {
                $scope.$on('$locationChangeSuccess', function () {
                    var param = $location.search(), listName = '';
                    if (param.search) {
                        listName = '搜索结果';
                    } else {
                        if (GKPartition.isSmartFolderPartition(param.partition) && param.filter) {
                            listName = GKSmartFolder.getSmartFoldeName(param.filter);
                        } else {
                            var mount = GKMount.getMountById(param.mountid);
                            if (mount) {
                                listName = mount['name'];
                            }
                        }
                    }
                    $scope.listName = listName;
                })

                $scope.$on('editSmartFolder', function ($event, name, code, filter) {
                    if ($scope.listName && $scope.filter == filter) {
                        $scope.listName = name;
                    }
                })

                $scope.$on('editOrgObjectSuccess', function (event, mount) {
                    if (!mount) {
                        return;
                    }
                    if ($scope.listName && $rootScope.PAGE_CONFIG.mount && $rootScope.PAGE_CONFIG.mount.mount_id == mount.mount_id) {
                        $scope.listName = mount.name;
                    }
                })

                var moreBtn;
                var toolOpt = $element.find('.opt_tool');

                var setUI = function () {
                    var grid = $element.width() - toolOpt.outerWidth(true) - $element.find('.opt_view_change').outerWidth(true);
                    var count = 0;
                    while (grid < 0) {
                        if (count > 50) break;
                        if (!moreBtn) {
                            var moreBtnHtml = '<button class="f_l dropdown">';
                            moreBtnHtml += '<a dropdown-toggle class="btn btn-opt opt" href="javascript:void(0);" ng-class="">';
                            moreBtnHtml += '<span>更多</span>';
                            moreBtnHtml += '<i class="gk_down_arrow"></i>';
                            moreBtnHtml += '</a>';
                            moreBtnHtml += '<ul class="dropdown-menu">';
                            moreBtnHtml += '</ul>';
                            moreBtnHtml += '</button>';
                            moreBtn = $compile(angular.element(moreBtnHtml))($scope);
                        }
                        var lastBtn = toolOpt.find('button.opt_btn:visible:last');
                        var lastBtnClone = jQuery('<li/>').append(lastBtn.find('> a').clone(true).removeClass('btn btn-opt'));
                        lastBtn.hide();
                        moreBtn.appendTo(toolOpt).find('.dropdown-menu').prepend(lastBtnClone);
                        grid = $element.width() - toolOpt.outerWidth() - $element.find('.opt_view_change').outerWidth(true);
                        count++;
                    }
                };

                var oldWidth = $element.width();
                jQuery(window).on('resize.tool', function () {
                    var newWidth = $element.width();
                    if(newWidth<=0){
                        return;
                    }
                    var grid = newWidth - oldWidth;
                    if (grid > 0) {
                        var lastHideBtn = toolOpt.find('button.opt_btn:hidden:first');
                        if (lastHideBtn.size() && grid > lastHideBtn.outerWidth(true)) {
                            lastHideBtn.show();
                            if (moreBtn) {
                                moreBtn.find('.dropdown-menu li:first').remove();
                                if (moreBtn.find('.dropdown-menu li').size() == 0) {
                                    moreBtn.remove();
                                    moreBtn = null;
                                }
                            }
                        }
                    } else{
                        $timeout(function(){
                            setUI();
                        })
                    }
                    //TODO:resize完应该重新赋值oldWidth，但无法知道resize end事件
                    //oldWidth = $element.width();
                })

                $scope.$watch('opts', function (val) {
                    if (moreBtn) {
                        moreBtn.remove();
                        moreBtn = null;
                    }
                    $timeout(function () {
                        setUI();
                    })
                })

                $scope.$on('$destroy', function () {
                    jQuery(window).off('resize.tool');
                    if (moreBtn && moreBtn.size()) {
                        moreBtn.remove();
                        moreBtn = null;
                        toolOpt = null;
                    }
                })
            }
        }
    }])

    .directive('rightTagInput', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function ($scope, $element, $attrs, $ngModel) {
                if (!$ngModel) {
                    return;
                }
                jQuery($element).tagsInput({
                    'height': 'auto',
                    'width': '225px',
                    'interactive': true,
                    'onAddTag': function (tag) {
                        $scope.addTag(tag);
                    },
                    'onRemoveTag': function (tag) {
                        $scope.removeTag(tag);
                    },
                    'onChange': function (input, d, c) {

                    }
                })
            }
        }
    }])
    .directive('breadsearch', ['$location', '$timeout', 'GKPartition', '$rootScope', 'GKSmartFolder','GKPath', function ($location, $timeout, GKPartition, $rootScope, GKSmartFolder,GKPath) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/bread_and_search.html",
            link: function ($scope, $element) {
                var bread = $element.find('.bread');
                var searchIcon = $element.find('.icon-search');
                var eleWidth = $element.width();
                var hideBread = $element.find('.hide_bread');
                $scope.currentSearchScope = null;
                /**
                 * 显示搜索模式
                 * @param $event
                 */
                $scope.showSearch = function ($event) {
                    if (jQuery($event.target).hasClass('bread_list')
                        || jQuery($event.target).parents('.bread_list').size()
                        || jQuery($event.target).hasClass('searching_label')
                        || jQuery($event.target).parents('.searching_label').size()
                        || jQuery($event.target).hasClass('hide_bread')
                        || jQuery($event.target).parents('.hide_bread').size()
                        || $scope.searchState == 'end'
                        ) {
                        return;
                    }
                    $scope.searchState = 'start';
                    $element.find('input[name="keyword"]').focus();
                };

                $scope.hideBreads = [];

                var setBreadUI = function () {
                    var breadWidth = $element.find('.bread').width();
                    $element.find('.bread_list .bread_item a').css({'max-width': breadWidth});
                    var breadListWidth = $element.find('.bread_list').width();
                    var count = 0;
                    while (breadListWidth > breadWidth && breadListWidth > 0 && breadWidth > 0) {
                        if (count > 50) break;
                        count++;
                        if ($element.find('.bread_list .bread_item:visible').size() == 1) {
                            break;
                        }
                        if ($scope.breads && $scope.breads.length) {
                            var hideBread = $scope.breads[$scope.hideBreads.length];
                            if (hideBread) {
                                $scope.hideBreads.unshift($scope.breads[$scope.hideBreads.length]);
                                $element.find('.bread_list .bread_item:visible').eq(0).hide();
                                breadListWidth = $element.find('.bread_list').width();
                            }
                        }
                    }
                };

                $scope.$watch('breads', function (val) {
                    $scope.hideBreads = [];
                    $element.find('.bread_list .bread_item:hidden').show();
                    $timeout(function () {
                        setBreadUI();
                        return null;
                    }, 0);
                })

                var oldBreadWidth = $element.find('.bread').width();

                jQuery(window).on('resize', function () {
                    $scope.$apply(function () {
                        var newBreadWidth = $element.find('.bread').width();
                        if(newBreadWidth<=0){
                            return;
                        }
                        var grid = newBreadWidth - oldBreadWidth;
                        if (grid > 0) {
                            var lastHideBread = $element.find('.bread_list .bread_item:hidden').last();
                            if (lastHideBread.size()) {
                                if (grid >= lastHideBread.outerWidth()) {
                                    $scope.hideBreads.splice(0, 1);
                                    lastHideBread.show();
                                }
                            }
                        } else if(grid<0) {
                            $timeout(function () {
                                setBreadUI();
                                return null;
                            }, 0)
                        }
                    })
                })


                /**
                 * 点击面包屑后的跳转
                 * @param bread
                 * @param $event
                 */
                $scope.selectBread = function ($event, bread) {
                    var params = $location.search();
                    GKPath.gotoFile(params.mountid,bread.path || '', '','', bread.filter,'file');
                    $event.stopPropagation();
                };

                $scope.$on('searchStateChange',function(event,state){
                    $scope.searchState = state;
                })

                $scope.searchFile = function () {
                    if (!$scope.keyword || !$scope.keyword.length || $scope.searchState == 'loading') {
                        return;
                    }
                    if($scope.keyword.indexOf('|')>=0){
                        alert('搜索关键字中不能包含 | ');
                        return;
                    }
                    if(!$scope.currentSearchScope){
                        return;
                    }
                    var extendParam = {
                          search:[$scope.keyword,$scope.currentSearchScope.name].join('|')
                    };
                    var search = $location.search();
                    $location.search(angular.extend(search, extendParam));
                };

                var resetSearch = function () {
                    $scope.keyword = $scope.searchState = '';
//                    $scope.currentSearchScope = null;
                };

                $scope.cancelSearch = function ($event) {
                    var search = $location.search();
                    $location.search(angular.extend(search, {
                        search: ''
                    }));
                    $event.stopPropagation();
                };

//                $('body').on('mousedown.resetsearch', function (event) {
//                    $scope.$apply(function () {
//                        if (
//                            $(event.target).hasClass('bread_and_search_wrapper')
//                                || $(event.target).parents('.bread_and_search_wrapper').size()
//                                || $scope.searchState == 'loading'
//                                || $scope.searchState == 'end'
//                            ) {
//                            return;
//                        }
//                        resetSearch();
//                    })
//                })


                var getSearchScopes = function () {
                    var searchScopes = [];
                    var params = $location.search();
                    if (params.filter) {
                        searchScopes.push({
                            name: 'filter',
                            text: GKSmartFolder.getSmartFoldeName(params.filter)
                        })
                    } else {
                        if(GKPartition.isTeamFilePartition(params.partition) || GKPartition.isEntFilePartition(params.partition)){
                            searchScopes.push({
                                name: 'partition',
                                text: '所有云库'
                            });
                        }
                        searchScopes.push({
                            name: 'mount',
                            text: $rootScope.PAGE_CONFIG.mount['name']
                        });

                        if (params.path) {
                            searchScopes.push({
                                name: 'path',
                                text: Util.String.baseName(params.path)
                            })
                        }
                    }
                    return searchScopes;
                };

                var getCurrentSearchScope = function(scope,searchScopes){
                    var currentScope;
                    angular.forEach(searchScopes,function(val){
                        if(val.name == scope){
                            currentScope = val;
                            return false;
                        }
                    });
                    return currentScope;
                }

                var getSearchParam = function(){
                    var params = $location.search();
                    $scope.searchScopes =  getSearchScopes();

                    if(!params.search){
                        resetSearch();
                        var len = $scope.searchScopes.length;
                        if(len){
                            $scope.currentSearchScope = $scope.searchScopes[len-1];
                        }
                    }else{
                        var searchArr = params.search.split('|');
                        if($scope.keyword == searchArr[0] && ($scope.currentSearchScope && $scope.currentSearchScope.name == searchArr[1])){
                            return;
                        }
                        var currentScope = getCurrentSearchScope(searchArr[1],$scope.searchScopes);
                        if(!currentScope) return;
                        $scope.keyword = searchArr[0];
                        $scope.currentSearchScope = currentScope;
                        $scope.searchState = 'start';
                    }
                };

                $scope.$on('$locationChangeSuccess', function ($e, $new, $old) {
                    getSearchParam();
                });

                getSearchParam();

                $scope.setSearchScope = function (searchScope) {
                    $scope.currentSearchScope = searchScope;
                }

                $scope.$on('$destroy', function () {
                    $('body').off('mousedown.resetsearch');
                    jQuery(window).off('resize');
                })
            }
        }
    }])
    .directive('inputDatepicker', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                isOpen: "@",
                ngModel: '='
            },
            template: '<div class="form-control input-datepicker">'
                + '<input type="text" datepicker-popup="yyyy年M月d日" show-weeks="false" ng-model="ngModel" is-open="false" current-text="今天" toggle-weeks-text="周" clear-text="清空" close-text="关闭"/>'
                //+'<i class="calendar" ng-class="isOpen=true"></i>'
                + '</div>',
            link: function ($scope, $element, $attrs) {
                $scope.isOpen = false;
            }
        }
    }])
    .directive('resize', ['$document', '$window', function ($document, $window) {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="resize" ng-style="style" ng-class="moving?\'moving\':\'\'"></div>',
            link: function ($scope, $element, $attrs) {
                $scope.moving = false;

                $element.off('mousedown').on('mousedown', function (e) {
                    $scope.$apply(function () {
                        $scope.moving = true;
                        $document.find('body').addClass('resizing');
                        $document.bind('mousemove.resize', function (e) {
                            $scope.$apply(function () {
                                if (e.pageX < 80) {
                                    return false;
                                }
                                if ($scope.moving) {
                                    $scope.style = {
                                        left: e.pageX - 1
                                    }
                                }

                            })

                        })
                    });
                })

                var setPosition = function (width) {
                    if (width < 160) {
                        width = 160;
                    }
                    if ($document.width() - width < 650) {
                        width = $document.width() - 650;
                    }
                    $document.find('.left_sidebar').css('width', width);
                    $document.find('.main').css('left', width);
                    $scope.style = {
                        left: width - 1
                    }
                };

                $document.bind('mouseup', function (e) {
                    $scope.$apply(function () {
                        if ($scope.moving) {
                            setPosition(e.pageX);
                        }
                        $document.find('body').removeClass('resizing');
                        $scope.moving = false;
                        $document.unbind('mouseup.resize');
                    });
                })

                jQuery(window).off('resize.resizeLeft').on('resize.resizeLeft', function () {
                    var max = jQuery(window).width() - 650;
                    if (max < 0) {
                        return;
                    }
                    if ($document.find('.left_sidebar').width() > max) {
                        $scope.style = {
                            left: max - 1
                        }
                        setPosition(max);
                    }
                })

                $scope.$on('$destory', function () {
                    jQuery(window).off('.resizeLeft');
                })
            }
        }
    }])
    .directive('commonRightSidebar', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: "views/common_right_sidebar.html"
        }
    }])
    .directive('filterRightSidebar', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: "views/filter_right_sidebar.html"
        }
    }])
    .directive('discussHistory',['$timeout','$interval','GKFile','GKApi','$rootScope','GKKeyEvent','chatMember',function($timeout,$interval,GKFile,GKApi,$rootScope,GKKeyEvent,chatMember){
        return{
            restrict: 'E',
            replace: true,
            templateUrl: "views/singlefile-right-discusshistory.html",
            link:function(scope, element, attrs){
                var ELEMENT_RIGHT = -300;
                scope.canShowHistory = false;
                scope.currentDiscussFile = null;
                scope.discussionList = [];
                scope.discussContent = "";
                scope.loadDiscussionhistory = true;
                scope.isOpen = false;
                scope.remindMembers = chatMember.getMembers($rootScope.PAGE_CONFIG.mount.org_id);
                scope.$on('$locationChangeStart',function() {
                    close();
                });
                scope.$watch(function(){
                    return $rootScope.PAGE_CONFIG.mode;
                },function(value,oldValue){
                    if(value == 'chat'){
                        //保存切换前的状态
                        var opened = scope.showDisscussHitoryWin;
                        close();
                        //重新复制
                        scope.showDisscussHitoryWin = opened;
                    }else if(value == 'file'){
                        if(scope.showDisscussHitoryWin){
                            scope.$broadcast("showDiscussHistory",scope.currentDiscussFile);
                        }
                    }
                })
                scope.$on("updateDiscussMsg",function(obj,discussHistoryArr){
                    if(!scope.currentDiscussFile){
                        return;
                    }
                    angular.forEach(discussHistoryArr,function(item){
                        if(item.sender != $rootScope.PAGE_CONFIG.user.member_name){
                            if(item.receiver && item.receiver == $rootScope.PAGE_CONFIG.mount.org_id){
                                var fileInfo = JSON.parse(item.metadata);
                                if(scope.currentDiscussFile.hash == fileInfo.hash){
                                    item.status = true;
                                    scope.discussionList.push(item);
                                    scope.scrollToIndex = scope.discussionList.length -1;
                                }
                            }
                        }
                    });
                });
                scope.$on("closeDiscussHistory",function(){
                   close();
                });
                scope.$on("showDiscussHistory",function(obj,file){
                    scope.isOpen = true;
                    scope.showDisscussHitoryWin = true;
                    scope.loadDiscussionhistory = true;
                    if(file && !file.mount_id){
                        file.mount_id = $rootScope.PAGE_CONFIG.mount.mount_id;
                    }

                    scope.discussionList = [];
                    scope.currentDiscussFile = file;
                    scope.canShowHistory = true;
                    element.show();
                    element.animate({right:0},300,function(){
                        scope.focusTextarea = true;
                    });

                    GKFile.getDiscussHistory(file).then(function(data){
                        for(var i=data.list.length-1;i>=0;i--){
                            var value = data.list[i];
                            value.status = true
                            scope.discussionList.push(value);
                        }
                        scope.scrollToIndex = scope.discussionList.length -1;
                        scope.loadDiscussionhistory = false;
                    },function(data){
                        scope.loadDiscussionhistory = false;
                    });
                });



                scope.atMember = function(at){
                    scope.insertStr = ['@',at,' '].join('');
                };

                scope.handleKeyDown = function ($event, message) {
                    var msg = GKKeyEvent.postMsgKeyDown($event,message,'',scope.it_isOpen,'',140);
                    if(msg == "-1" || msg == "0"){
                       return;
                    }else{
                        scope.discussContent = "";
                        postMsg(msg);
                        scope.focusTextarea = true;
                    }
                };
                scope.sendDiscussion = function(message){
                    if(!scope.currentDiscussFile) return;
                    if (!message) {
                        return;
                    }
                    if (message.length > 140) {
                        alert('一次发送的消息字数不能超过140字，请分条发送');
                        return;
                    }
                    scope.discussContent = "";
                    postMsg(message);
                    scope.focusTextarea = true;
                };
                var postMsg = function(message){
                    var newDisscussMsg = {
                        content:message,
                        receiver:$rootScope.PAGE_CONFIG.mount.org_id,
                        sender:$rootScope.PAGE_CONFIG.user.member_name,
                        medadata:[],
                        time:new Date().getTime(),
                        status:true,
                        type:"text"
                    }
                    scope.discussionList.push(newDisscussMsg)
                    scope.scrollToIndex = scope.discussionList.length -1;
                    GKApi.markMilestone(scope.currentDiscussFile.mount_id,scope.currentDiscussFile.fullpath,message,1)
                        .success(function(data){
                            newDisscussMsg.status=true;
                        })
                        .error(function(reqest){
                            newDisscussMsg.status=false;
                        })
                };

                var close = function(){
                    scope.showDisscussHitoryWin = false;
                    scope.loadDiscussionhistory = true;
                    element.animate({right:ELEMENT_RIGHT},200,function(){
                        scope.canShowHistory = false;
                        scope.discussionList = [];
                        element.hide();
                    });
                };

                scope.cancel = function(){
                    close();
                };
                $timeout(function(){
                    element.css("right",ELEMENT_RIGHT+"px");
                    element.hide();
                });
            }
        }
    }])
;
