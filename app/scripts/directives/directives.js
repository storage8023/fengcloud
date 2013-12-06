'use strict';

/* Directives */

angular.module('gkClientIndex.directives', [])
    .directive('fixScroll', ['$timeout',function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope,$element,$attrs) {
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

                var fixTimer = $timeout(function () {
                    setListHeaderWidth();
                }, 0);

                $scope.$on('$destroy',function(){
                    jQuery(window).off('resize.fixScroll');
                    if(fixTimer){
                        $timeout.cancel(fixTimer);
                        fixTimer = null;
                    }
                    setListHeaderWidth = checkScroll = null;
                })
            }
        };
    }])
    .directive('keybroadNav', ['GKFileList',function (GKFileList) {
        return {
            restrict: 'A',
            link: function ($scope,$element,$attrs) {
                var getColCount = function(){
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
                    $scope.$apply(function () {
                        var ctrlKeyOn = $event.ctrlKey || $event.metaKey;
                        switch ($event.keyCode) {
                            case 13: //enter
                                if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) < 0) {
                                    if ($scope.selectedFile && $scope.selectedFile.length) {
                                        $scope.handleDblClick($scope.selectedFile[0]);
                                    }
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
                                $scope.triggleOptByShortCut('Delete');
                                break;
                            case 67: //c
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut('Ctrl+C');
                                }
                                break;
                            case 80: //p
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut('Ctrl+P');
                                }
                                break;
                            case 83: //s
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut('Ctrl+S');
                                }
                                break;
                            case 86: //v
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut('Ctrl+V');
                                }
                                break;
                            case 88: //x
                                if (ctrlKeyOn) {
                                    $scope.triggleOptByShortCut('Ctrl+X');
                                }
                                break;
                        }
                    });
                });


                $scope.$on('$destroy',function(){
                    jQuery(document).off('keydown.shortcut')
                    getColCount = upLeftPress = downRightPress = null;

                })
            }
        };
    }])
    .directive('renameFile', ['$parse',function ($parse) {
        return {
            restrict: 'A',
            link: function ($scope,$element,$attrs) {
                var fileItem = $element,
                    input,
                    nameElem;
                var fn = $parse($attrs.renameFileSubmit);
                $scope.$watch($attrs.renameFile, function (value,oldValue) {
                    if(value == oldValue) return;
                    if (value == true) {
                        var oldFileName = Util.String.baseName($attrs.fullpath);
                        input = jQuery('<input name="new_file_name" type="text" id="new_file_name" value="' + oldFileName + '" class="new_file_name form-control" />');
                        fileItem.addClass('file_item_edit');
                        nameElem = fileItem.find('.name');
                        nameElem.hide().after(input)
                        input.focus();
                        input.on('keydown', function (e) {
                            if (e.keyCode == 13) {
                                var newFileName = input.val();
                                fn($scope,{filename:newFileName});
                                return false;
                            }
                        });
                        input.on('blur', function () {
                            var newFileName = input.val();
                            fn($scope,{filename:newFileName});
                        })
                        input.on('dblclick', function () {
                            var newFileName = input.val();
                            fn($scope,{filename:newFileName});
                        })
                    }else{
                        fileItem.removeClass('file_item_edit');
                        if(input){
                            input.remove();
                        }
                        if(nameElem){
                            nameElem.show();
                            nameElem = null;
                        }
                    }
                });
            }
        };
    }])
    .directive('createNewFolder', ['GKFileList','$compile','$parse',function (GKFileList,$compile,$parse) {
        return {
            restrict: 'A',
            link: function ($scope,$element,$attrs) {
                var newFileItem,
                    fn = $parse($attrs.createFileSubmit);
                $scope.$watch($attrs.createNewFolder, function (value,oldValue) {
                    if(value == oldValue) return;
                    if (value == true) {
                        var isShare = $scope.partition == $scope.PAGE_CONFIG.file.sharepath ? 1 : 0;
                        GKFileList.unSelectAll($scope);
                        $scope.submitNewFileName = function (filename) {
                            fn($scope,{filename:filename});
                        };
                        var isShare = 0;
                        var defaultNewName = GKFileList.getDefualtNewName($scope);
                        newFileItem = $compile(angular.element('<new-file-item view="{{view}}" default-new-name="' + defaultNewName + '" is-share="{{' + isShare + '}}" on-submit="submitNewFileName(filename)"></new-file-item>'))($scope);
                        newFileItem.addClass('selected').prependTo($element);
                    }else{
                        if(newFileItem){
                            newFileItem.remove();
                        }
                    }
                });
            }
        };
    }])
    .directive('focusMe', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                scope.$watch(attrs.focusMe, function (value) {
                    if (value === true) {
                        element[0].focus();
                        scope[attrs.focusMe] = false;
                    }
                });
            }
        };
    })
    .directive('gkGuider', ['GKGuiders', '$parse', function (GKGuiders, $parse) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                $scope.GKGuiders = GKGuiders;
                var option = $scope.$eval($attrs.gkGuider);
                angular.extend(option, {
                    attachTo: $element[0]
                });
                GKGuiders.createGuider(option);
            }
        }
    }])
    .directive('contextmenu', ['GKContextMenu', function (GKContextMenu) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                /**
                 * 设置右键菜单
                 */
                jQuery.contextMenu({
                    selector: '.abn-tree .abn-tree-row',
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
    .directive('inputGroup', [function () {
        return {
            restrict: 'C',
            link: function ($scope, $element) {
                $element.find('input[type="text"],input[type="password"]').on('focus', function () {
                    $element.addClass('input-group-focus');
                })
                $element.find('input[type="text"],input[type="password"]').on('blur', function () {
                    $element.removeClass('input-group-focus');
                })
            }
        }
    }])
    .directive('networkUnconnect', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/network_unconnect.html'
        }
    }])
    .directive('avatar', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                gkSrc: '@'
            },
            template: '<img src="images/default_photo.png" error-src="images/default_photo.png" ng-src="{{gkSrc}}" />'
        }
    }])
    .directive('groupPhoto', [function () {
        return {
            restrict: 'E',
            replace: true,

            scope: {
                gkSrc: '@'
            },
            template: '<img src="images/default_group.png" error-src="images/default_group.png" ng-src="{{gkSrc}}" />'
        }
    }])
    .directive('teamLogo', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                gkSrc: '@'
            },
            template: '<img src="images/default_logo.png" error-src="images/default_logo.png" ng-src="{{gkSrc}}" />'
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
                'defaultNewName': '@'
            },
            link: function ($scope, $element, $attrs) {
                $scope.filename = $scope.defaultNewName ? $scope.defaultNewName : '新建文件夹';
                var input = $element.find('input');
                input.on('blur', function (event) {
                    console.log($scope.filename);
                    if ($scope.onSubmit != null) {
                        $scope.onSubmit({
                            filename: $scope.filename
                        });
                    }
                })

                input.on('keydown', function (event) {
                    if (event.keyCode == 13) {
                        $scope.$apply(function () {
                            if ($scope.onSubmit != null) {
                                $scope.onSubmit({
                                    filename: $scope.filename
                                });
                            }
                        });
                    }
                });

                $timeout(function(){
                    input[0].focus();
                },0)

                $scope.$on('$destroy',function(){
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
    .directive('preventDragDrop', [function () {
        return function ($scope, $element, $attrs) {
            $element.on('drop', function (event) {
                event.preventDefault();
            });
        };
    }])
    .directive('ngDrop', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngDrop);
            $element.on('drop', function (event) {
                $scope.$apply(function () {
                    fn($scope, {$event: event});
                });
            });
        };
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
                //console.log(opts);
                element.selectable(opts);
            }
        };
    }])
    .directive('errorSrc', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('error', function () {
                    element.attr('src', attrs.errorSrc);
                });
            }
        }
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
    .directive('closeWindowButton', [function () {
        return {
            restrict: 'E',
            template: '<button class="close_window"><i class="icon16x16 icon_close_window"></i></button>',
            link: function (scope, element) {
                element.on('click', function () {
                    gkClientInterface.closeWindow();
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
    .directive('scrollLoad', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function ($scope, $element, attrs) {
                var triggerDistance = 0;
                var disableScroll = false;
                if (attrs.triggerDistance != null) {
                    $scope.$watch(attrs.triggerDistance, function (value) {
                        return triggerDistance = parseInt(value, 10);
                    });
                }

                if (attrs.disableScroll != null) {
                    $scope.$watch(attrs.disableScroll, function (value) {
                        return disableScroll = !!value;
                    });
                }

                var startScrollTop = $element.scrollTop();
                $element.on('scroll.scrollLoad', function (e) {
                    var _self = jQuery(this),
                        realDistance = 0,
                        scrollH = 0,
                        scrollT = 0,
                        isScrollDown = false;
                    scrollH = jQuery.isWindow(this) ? document.body.scrollHeight : $element[0].scrollHeight;
                    scrollT = _self.scrollTop();
                    isScrollDown = scrollT > startScrollTop;
                    var clientHeight = jQuery.isWindow(this) ? document.documentElement.clientHeight || document.body.clientHeight : this.clientHeight;
                    realDistance = scrollH - scrollT - clientHeight;
                    if (isScrollDown //向下滚动才触发
                        && realDistance <= triggerDistance && !disableScroll) {
                        if ($rootScope.$$phase) {
                            return $scope.$eval(attrs.scrollLoad);
                        } else {
                            return $scope.$apply(attrs.scrollLoad);
                        }
                    }
                    startScrollTop = scrollT;
                });
                $scope.$on('$destroy', function () {
                    $element.off('scroll.scrollLoad');
                })
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
    .directive('member', ['GKDialog','GKModal','GKNews','GKApi',function (GKDialog, GKModal,GKNews,GKApi) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/member.html",
            scope: {
                user: '='
            },
            link: function ($scope, $element) {
                $scope.newsOpen = function () {
                    GKModal.news(GKNews, GKApi);
                };

                $scope.personalOpen = function ($scope) {
                    GKDialog.openSetting('account');
                };
            }
        }
    }])
    .directive('singlefileRightSidebar', ['GKFilter', 'GKSmartFolder', 'RestFile', '$timeout', 'GKApi', '$rootScope', 'GKModal', 'GKException', 'GKPartition', 'GKFile', 'GKMount','$interval', function (GKFilter, GKSmartFolder, RestFile, $timeout, GKApi, $rootScope, GKModal, GKException, GKPartition, GKFile, GKMount,$interval) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/singlefile_right_sidebar.html",
            link: function ($scope, $element) {
                $scope.file = {};
                $scope.showTab = false; //是否显示共享等tab
                $scope.enableAddShare = false; //是否允许编辑共享参与人
                $scope.loading = true;
                $scope.fileExist = false;
                var fileInterval;
                var gird = /[,;；，\s]/g;

                var getOptMountId = function (file) {
                    var mountID;
                    if (!file) {
                        mountID = $rootScope.PAGE_CONFIG.mount.mount_id;
                    } else {
                        mountID = file['mount_id'] || $rootScope.PAGE_CONFIG.mount.mount_id;
                    }
                    return Number(mountID);
                };

                $scope.smarts = GKSmartFolder.getFolders('recent');

                /**
                 * 通过接口获取文件信息
                 */
                var getFileInfo = function (file, options) {
                    var defaultOptions = {
                        data: '',
                        cache: true
                    };

                    options = angular.extend({}, defaultOptions, options);

                    var mountId = getOptMountId(file);
                    var mount = GKMount.getMountById(mountId);
                    var fullpath = file.dir == 1 ? file.fullpath + '/' : file.fullpath;
                    var formatTag = [];

                    if (options.data != 'sidebar') {
                        RestFile.get(mountId, fullpath).success(function (data) {
                            $scope.$apply(function () {
                                $scope.loading = false;
                                $scope.fileExist = true;
                                angular.forEach(jQuery.trim(data.tag).split(gird), function (value) {
                                    if (value && formatTag.indexOf(value) < 0) {
                                        formatTag.push(value);
                                    }
                                });
                                var formatFile = GKFile.formatFileItem(data, 'api');
                                angular.extend($scope.file, formatFile);
                                $scope.file.formatTag = formatTag;
                                if (mount['org_id'] > 0 && $scope.file.cmd > 0 && $scope.PAGE_CONFIG.partition != GKPartition.subscribeFile) {
                                    $scope.showTab = true;
                                } else {
                                    $scope.showTab = false;
                                }

                                $scope.enableAddShare = false;
                                /**
                                 * 如果是管理员，并且在根目录允许共享操作
                                 */
                                if (GKMount.isAdmin(mount) && !$rootScope.PAGE_CONFIG.file.fullpath
                                    ) {
                                    $scope.enableAddShare = true;
                                }
                            });

                        }).error(function (request) {
                                $scope.$apply(function () {
                                    $scope.loading = false;
                                    var errorCode = GKException.getAjaxErroCode(request);
                                    /**
                                     * 云端不存在
                                     */
                                    if(errorCode == 404024){
                                        $scope.sidbarData.title = '云端已删除';
                                    }else if (String(errorCode).slice(0, 3) == '404') {
                                        $scope.fileExist = false;
                                        $scope.sidbarData = {
                                            icon: 'uploading'
                                        }
                                        /**
                                         * 1:上传中
                                         * 9：重新上传中
                                         */
                                        if ($scope.localFile.status == 1 || $scope.localFile.status == 9) {
                                            $scope.sidbarData.title = '正在上传中';
                                            var info;
                                            fileInterval = $interval(function () {
                                                    info = gkClientInterface.getTransInfo({
                                                        mountid: mountId,
                                                        webpath: file.fullpath
                                                    });
                                                    if (typeof info.offset !== 'undefined') {
                                                        var offset = Number(info.offset);
                                                        var filesize = Number(info.filesize || 0);
                                                        var status = info.status || 0
                                                        var str = '';
                                                        if (filesize != 0) {
                                                            str = Math.round(offset / filesize * 100) + '%';
                                                        }
                                                        $scope.sidbarData.title = '正在上传中' + str;
                                                        if (status == 1) {
                                                            if(fileInterval){
                                                               $interval.cancel(fileInterval);
                                                                fileInterval = null;
                                                            }
                                                            getFileInfo($scope.localFile);
                                                        }
                                                    }
                                            }, 1000);
                                        }
                                    }
                                })
                            });
                    }

                    if (options.data != 'file') {
                        GKApi.sideBar(mountId, fullpath, options.type, options.cache).success(function (data) {
                            $scope.$apply(function () {
                                if (data.share_members) {
                                    $scope.shareMembers = data.share_members;
                                }
                                if (data.share_groups) {
                                    $scope.shareGroups = data.share_groups;
                                }
                                if (data.remark) {
                                    $scope.remarks = data.remark;
                                }
                                if (data.history) {
                                    $scope.histories = data.history;
                                }
                                if (data.remind_members) {
                                    $scope.remindMembers = data.remind_members;
                                }
                            })
                        });
                    }

                };

                $scope.$watch('localFile', function (file, oldValue) {
                    if (!file || !oldValue || file == oldValue || file.fullpath == oldValue.fullpath) {
                        return;
                    }
                    if (fileInterval) {
                        $interval.cancel(fileInterval);
                        fileInterval = null;
                    }
                    getFileInfo(file);
                });

                getFileInfo($scope.localFile);

                $scope.$watch('file.formatTag', function (value, oldValue) {
                    if (!angular.isDefined(value)
                        || !angular.isDefined(oldValue)
                        || value == oldValue) {
                        return;
                    }
                    var fullpath = $scope.file ? $scope.file.fullpath || '' : '';
                    if (!value) {
                        value = '';
                    }

                    GKApi.setTag(getOptMountId($scope.file), fullpath, value.join(' ')).error(function (request) {
                            GKException.handleAjaxException(request);
                        });
                }, true);

                $scope.inputingRemark = false;
                $scope.remarkText = '';
                /**
                 * 取消发布备注
                 */
                $scope.cancelPostRemark = function () {
                    $scope.remarkText = '';
                    $scope.inputingRemark = false;
                };

                $scope.handleFocus = function () {
                    if (!$scope.inputingRemark) {
                        $scope.inputingRemark = true;
                    }
                };


                jQuery('body').on('click.cancelRemark', function (e) {
                    if (!jQuery(e.target).hasClass('post_wrapper') && !jQuery(e.target).parents('.post_wrapper').size()) {
                        $scope.$apply(function () {
                            if (!$scope.remarkText) {
                                $scope.inputingRemark = false;
                            }
                        });
                    }
                })

                /**
                 * 发布讨论
                 */
                $scope.postRemark = function (remarkText) {
                    if (!remarkText || !remarkText.length) return;
                    var fullpath = $scope.file.dir == 1 ? $scope.file.fullpath + '/' : $scope.file.fullpath;
                    RestFile.remind(getOptMountId($scope.file), fullpath, remarkText).success(function (data) {
                        $scope.cancelPostRemark();
                        if (data && data.length) {
                            $scope.remarks.unshift(data[0]);
                        }

                    }).error(function (request) {
                            GKException.handleAjaxException(request);
                        });
                };

                $scope.showAddMember = function () {
                    GKModal.teamMember($rootScope.PAGE_CONFIG.mount.org_id);
                };

                $scope.insertAt = function (input) {
                    var val = $scope.remarkText;
                    var jqTextarea = $element.find('.post_wrapper textarea');
                    var input_pos = Util.Input.getCurSor(jqTextarea[0]).split('|');
                    var is_insert = input_pos[1] != val.length ? 1 : 0;
                    var l = val.substr(0, input_pos[0]);
                    var r = val.substr(input_pos[1], val.length);
                    val = l + input + r;
                    $scope.remarkText = val;
                    $timeout(function () {
                        if (is_insert) {
                            Util.Input.moveCur(jqTextarea[0], parseInt(input_pos[0]) + (input).length);
                        } else {
                            Util.Input.moveCur(jqTextarea[0], val.length);
                        }
                        return null;
                    }, 0);

                }

                $scope.handleKeyDown = function (e) {
                    if (e.keyCode == 13 & (e.ctrlKey || e.metaKey)) {
                        $scope.postRemark($scope.remarkText);
                    }
                };

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
                                if ($scope.PAGE_CONFIG.partition == GKPartition.smartFolder && $scope.filter == filter) {
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
                }

                /**
                 * 删除共享
                 * @param shareItem
                 */
                $scope.removeShare = function (shareItem) {
                    var fullpath = $scope.file.fullpath;
                    var collaboration = [], collaborationItem = '';
                    var type = shareItem['group_id'] ? 'group' : 'member';
                    if (!confirm('你确定要删除改共享参与' + (type == 'group' ? '组' : '人' + '？'))) {
                        return;
                    }
                    collaborationItem = type + '|' + (type == 'group' ? shareItem['group_id'] : shareItem['member_id']);

                    collaboration.push(collaborationItem);
                    GKApi.delCollaboration(getOptMountId($scope.file), fullpath, collaboration.join(',')).success(function () {
                        $scope.$apply(function () {
                            if (type == 'group') {
                                Util.Array.removeByValue($scope.shareGroups, shareItem);
                            } else {
                                Util.Array.removeByValue($scope.shareMembers, shareItem);
                            }
                        });

                    }).error(function (request) {
                            GKException.handleAjaxException(request);
                        });
                }

                /**
                 * 添加共享
                 */
                $scope.showEditShareDialog = function () {
                    var fullpath = $scope.file.dir == 1 ? $scope.file.fullpath + '/' : $scope.file.fullpath;
                    var addShareModal = GKModal.addShare(getOptMountId($scope.file), fullpath);
                    addShareModal.result.then(function () {

                    })
                };

                /**
                 * 监听刷新事件
                 */
                $scope.$on('refreshSidebar', function () {
                    getFileInfo($scope.localFile, {data: 'sidebar', type: 'share', cache: false});
                })

                $scope.$on('$destroy',function(){
                    jQuery('body').off('click.cancelRemark');
                    if(fileInterval){
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
    .directive('toolbar', ['GKFilter', 'GKPartition', 'GKSmartFolder', 'GKMount', function (GKFilter, GKPartition, GKSmartFolder, GKMount) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/toolbar.html",
            link: function ($scope, $element) {
                if ($scope.partition == GKPartition.smartFolder && $scope.filter) {
                    var type =  GKFilter.getFilterType($scope.filter);
                    var smartFolder = GKSmartFolder.getFolderByCode(type);
                    if(smartFolder){
                        $scope.listName = smartFolder['name'];
                    }
                } else {
                    var mount = GKMount.getMountById($scope.mountId);
                    if (mount) {
                        $scope.listName = mount['name'];
                    }
                }

                $scope.$on('editSmartFolder', function ($event, name, code,filter) {
                   if($scope.listName && $scope.filter == filter){
                       $scope.listName = name;
                   }
                })
            }
        }
    }])
    .directive('ngRightClick', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngRightClick);
            $element.bind('contextmenu', function (event) {
                $scope.$apply(function () {
                    event.preventDefault();
                    fn($scope, {$event: event});
                });
            });
        };
    }])
    .directive('ngDragend', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngDragend);
            $element.on('dragend', function (event) {
                $scope.$apply(function () {
                    event.preventDefault();
                    fn($scope, {$event: event});
                });
            });
        };
    }])
    .directive('inputTipPopup', ['$document', '$parse', '$timeout', function ($document, $parse, $timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: { list: '=', onSelect: '&'},
            template: '<ul class="dropdown-menu input_tip_list">'
                + '<li ng-repeat="(key,item) in list"><a  ng-mouseenter="handleMouseEnter(key)" ng-click="handleClick(key)" ng-class="item.selected?\'active\':\'\'" title="{{item.name}}" href="javascript:void(0)">{{item.name}}</a></li>'
                + '</ul>',
            link: function ($scope, $element, $attrs) {
                var index = 0;
                var selectItem = function () {
                    if (!$scope.list[index]) return;
                    if ($scope.onSelect != null) {
                        $scope.onSelect({item: $scope.list[index]})
                    }

                    if ($scope.list[index]) {
                        $scope.list[index].selected = false;
                        index = 0;
                    }
                };
                var preSelectItem = function (newIndex) {
                    if (!$scope.list || !$scope.list.length) return;
                    angular.forEach($scope.list, function (value) {
                        if (value.selected) {
                            value.selected = false;
                        }
                    });
                    $scope.list[newIndex].selected = true;
                    index = newIndex;
                };

                $scope.handleMouseEnter = function (key) {

                    preSelectItem(key);
                };
                $scope.handleClick = function (key) {
                    //preSelectItem(key);
                    selectItem();
                };
                $document.bind('keydown', function (e) {
                    $scope.$apply(function () {
                        var key_code = e.keyCode;
                        if (!$scope.list || !$scope.list) return;
                        var listLength = $scope.list.length;
                        var step = 1;
                        if (key_code == 38 || key_code == 40) { //up
                            if (key_code == 38) {
                                step = -1;
                            }
                            var newIndex = index + step;
                            if (newIndex < 0) {
                                newIndex = listLength - 1;
                            } else if (newIndex > listLength - 1) {
                                newIndex = 0;
                            }
                            preSelectItem(newIndex);
                            e.preventDefault();
                        } else if (key_code == 13 || key_code == 32) {
                            selectItem();
                            e.preventDefault();
                        }
                    });
                })

            }
        };
    }])
    .directive('inputTip', [ '$compile', '$parse', '$document', '$position', '$timeout', function ($compile, $parse, $document, $position, $timeout) {
        var template =
            '<input-tip-popup ' +
                'list="it_list" ' +
                'on-select="it_onSelect(item)"' +
                '>' +
                '</input-tip-popup>';
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {

                var watchStr = $attrs.inputTip;
                var placementArr = $attrs.inputTipPlacement.split(' ');
                var placement = {
                    v: placementArr[0],
                    h: placementArr[1]
                };
                var inputtip = $compile(template)($scope);
                var elem = $element[0];
                /**
                 * 是否appendToBody
                 * @TODO 可定制
                 */
                var appendToBody = true;
                $scope.it_isOpen = false;
                var $body;


                var setPosition = function (jqTextarea, hintWrapper) {
                    var position,
                        ttWidth,
                        ttHeight,
                        ttPosition;

                    //获取textarea的相对位置
                    //position = appendToBody ? $position.offset($element) : $position.position($element);

                    ttWidth = inputtip.outerWidth();
                    ttHeight = inputtip.outerHeight();

                    /**
                     * 获取光标在输入框的位置
                     * @type {*}
                     */
                    var lineHeight = 4;
                    var cursorPosition = Util.Input.getInputPositon(elem);
                    var ttPosition = {
                        top: cursorPosition.top + lineHeight,
                        left: cursorPosition.left
                    }

                    if (ttPosition.top + ttHeight > jQuery(window).height()) {
                        ttPosition.top = ttPosition.top - ttHeight - lineHeight - parseInt($element.css('line-height').replace('px'));
                    }

                    if (ttPosition.left + ttWidth > jQuery(window).width()) {
                        ttPosition.left = ttPosition.left - ttWidth;
                    }

                    ttPosition.top += 'px';
                    ttPosition.left += 'px';
                    inputtip.css(ttPosition);
                };

                /**
                 * 显示提示框
                 */
                var show = function () {
                    var selected = false;
                    angular.forEach($scope.it_list, function (value) {
                        if (value.selected) {
                            selected = true;
                        }
                    });
                    if (!selected && $scope.it_list) {
                        $scope.it_list[0].selected = true;
                    }
                    if (appendToBody) {
                        $body = $body || $document.find('body');
                        $body.append(inputtip);
                    } else {
                        //TODO
                    }

                    /**
                     * 设置位置
                     */
                    $scope.it_isOpen = true;
                    setTimeout(function () {
                        setPosition();
                        inputtip.css('display', 'block');
                    }, 0);
                };

                /**
                 * 隐藏提示框
                 */
                var hide = function () {
                    $scope.it_isOpen = false;
                    inputtip.remove();
                };

                $scope.$on('$locationChangeSuccess', function () {
                    if ($scope.it_isOpen) {
                        hide();
                    }
                });

                $scope.$on('$destroy', function () {
                    if ($scope.it_isOpen) {
                        hide();
                    } else {
                        inputtip.remove();
                    }
                });
                var inputPos, val, lastIndex;

                var checkAt = function () {
                    $scope.$apply(function () {
                        val = $scope.remarkText;
                        var cursor = Util.Input.getCurSor($element[0]);
                        inputPos = cursor.split('|');
                        var leftStr = val.slice(0, inputPos[0]); //截取光标左边的所有字符
                        lastIndex = leftStr.lastIndexOf(watchStr); //获取光标左边字符最后一个@字符的位置
                        if (lastIndex < 0) {
                            hide();
                            return;
                        }
                        var q = leftStr.slice(lastIndex + 1, leftStr.length); //获取@与光标位置之间的字符

                        //如果@与光标之间有空格，隐藏提示框
                        if ($.trim(q).length != q.length) {
                            hide();
                            return;
                        }
                        var resultList = [];
                        if (!q.length) {
                            resultList = $scope.remindMembers;
                        } else {
                            if ($scope.remindMembers && $scope.remindMembers.length) {
                                angular.forEach($scope.remindMembers, function (value) {
                                    if (value.short_name && value.short_name.indexOf(q) === 0) {
                                        resultList.unshift(value);
                                    } else if (value.name.indexOf(q) != -1) {
                                        resultList.push(value);
                                    }
                                });
                            }
                        }
                        if (!resultList || !resultList.length) {
                            hide();
                        } else {
                            $scope.it_list = resultList;
                            show();
                        }
                    });
                };

                $scope.it_list = [];
                $scope.it_index = 0;
                var timer;
                $element.bind('focus',function () {
                    if (timer) {
                        clearInterval(timer);
                    }
                    timer = setInterval(checkAt, 200);
                }).bind('blur', function () {
                        if (timer) {
                            clearInterval(timer);
                        }
                    })


                var insertChar = function (input) {
                    input += ' ';
                    var newVal = $scope.remarkText;
                    var newInputPos = inputPos;
                    var isInsert = newInputPos[1] != newVal.length;
                    newVal = newVal.substr(0, lastIndex + 1) + input + newVal.substr(inputPos[1], newVal.length);
                    $scope.remarkText = newVal;
                    $timeout(function () {
                        if (isInsert) {
                            Util.Input.moveCur(elem, parseInt(inputPos[0]) + (input).length);
                        } else {
                            Util.Input.moveCur(elem, $scope.remarkText.length);
                        }
                    }, 0)

                };
                $scope.it_onSelect = function (item) {
                    insertChar(item.name);
                };


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
    .directive('breadsearch', ['$location', '$timeout', 'GKSearch', 'GKPartition', '$rootScope', function ($location, $timeout, GKSearch, GKPartition, $rootScope) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/bread_and_search.html",
            link: function ($scope, $element) {
                var bread = $element.find('.bread');
                var searchIcon = $element.find('.icon-search');
                var eleWidth = $element.width();
                var hideBread = $element.find('.hide_bread');
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
                        || jQuery($event.target).parents('.hide_bread').size()) {
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

                $scope.$watch('breads', function () {
                    $scope.hideBreads = [];
                    $element.find('.bread_list .bread_item:hidden').show();
                    $timeout(function () {
                        setBreadUI();
                        return null;
                    }, 0);
                })

                var oldBreadWidth = $element.find('.bread').width();
                jQuery(window).off('resize').on('resize', function () {
                    $scope.$apply(function () {
                        var grid = $element.find('.bread').width() - oldBreadWidth;
                        if (grid > 0) {
                            var lastHideBread = $element.find('.bread_list .bread_item:hidden').last();
                            if (lastHideBread.size()) {
                                if (grid >= lastHideBread.outerWidth()) {
                                    $scope.hideBreads.splice(0, 1);
                                    lastHideBread.show();
                                }
                            }
                        } else {
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
                    $location.search({
                        path: bread.path || '',
                        view: params.view,
                        mountid: params.mountid,
                        partition: params.partition,
                        filter: bread.filter
                    });
                    $event.stopPropagation();
                };

                /**
                 * 搜索的范围
                 * @type {string}
                 */
                $scope.searchScope = 'path';
                $scope.setSearchScope = function (searchScope) {
                    $scope.searchScope = searchScope;
                }

                $scope.$watch(function () {
                    return GKSearch.getSearchState();
                }, function (newValue, oldValue) {
                    if (newValue == oldValue) {
                        return;
                    }
                    $scope.searchState = newValue;
                });

                $scope.searchFile = function () {
                    if (!$scope.keyword || !$scope.keyword.length || $scope.searchState == 'loading') {
                        return;
                    }
                    var params = {
                        keyword: $scope.keyword
                    };
                    if ($scope.PAGE_CONFIG.partition != GKPartition.smartFolder) {
                        var fileSearch = new GKFileSearch();
                        fileSearch.conditionIncludeKeyword($scope.keyword);
                        fileSearch.conditionIncludePath($scope.searchScope == 'path' ? $scope.path : '');
                        var condition = fileSearch.getCondition();
                        GKSearch.setCondition(condition);
                        params.filter = 'search';
                        var search = $location.search();
                        $location.search(angular.extend(search, params));
                    } else {
                        $rootScope.$broadcast('searchSmartFolder', $scope.keyword);
                    }

                };
                var resetSearch = function () {
                    $scope.keyword = '';
                    $scope.searchState = '';
                    GKSearch.reset();
                };

                $scope.cancelSearch = function ($event) {
                    resetSearch();
                    var search = $location.search();
                    $location.search(angular.extend(search, {
                        filter: '',
                        keyword: ''
                    }));
                    if ($event) {
                        $event.stopPropagation();
                    }
                };

                $('body').off('mousedown.resetsearch').on('mousedown.resetsearch', function (event) {
                    $scope.$apply(function () {
                        if (
                            $(event.target).hasClass('bread_and_search_wrapper')
                                || $(event.target).parents('.bread_and_search_wrapper').size()
                                || $scope.searchState == 'loading'
                                || $scope.searchState == 'end'
                            ) {
                            return;
                        }
                        resetSearch();
                    })
                })

                $scope.disableSearch = false;
                $scope.$on('$routeChangeSuccess', function (event, current, previous) {
                    if (!previous || !current) {
                        return;
                    }
                    var previousParams = previous.params;
                    var currentParams = current.params;
//                    if ([GKPartition.myFile, GKPartition.teamFile, GKPartition.subscribeFile].indexOf(currentParams.partition) >= 0) {
//                        $scope.disableSearch = false;
//                    } else {
//                        $scope.disableSearch = true;
//                    }
                    if (previousParams.partition + previousParams.path !== currentParams.partition + currentParams.path) {
                        resetSearch();
                    }

                });

            }
        }
    }])
    .directive('searchRightSidebar', ['$filter', 'GKApi', '$rootScope', '$modal', 'GKSearch', 'FILE_SORTS', '$location', 'GKSmartFolder', 'GKMount', 'GKException', function ($filter, GKApi, $rootScope, $modal, GKSearch, FILE_SORTS, $location, GKSmartFolder, GKMount, GKException) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: "views/search_right_sidebar.html",
            link: function ($scope, $element, $attrs) {
                var condition = '';
                if ($scope.partition == 'smartfolder' && $scope.filter == 'search') {
                    GKApi.getSmartFolder($scope.keyword).success(function (data) {
                        $scope.$apply(function () {
                            if (data && data.condition) {
                                condition = data.condition;
                                GKSearch.setCondition(condition);
                            }
                        });

                    })
                }

                /**
                 * 文件扩展名列表
                 * @type {Array}
                 */
                $scope.extensions = [
                    {
                        name: '任意',
                        value: ''
                    },
                    {
                        name: '文件夹',
                        value: 'dir=1'
                    },
                    {
                        name: '文件',
                        value: 'dir=0'
                    },
                    {
                        name: '图片',
                        value: 'extensions=' + FILE_SORTS['SORT_IMAGE'].join('|')
                    },
                    {
                        name: '视频',
                        value: 'extensions=' + FILE_SORTS['SORT_MOVIE'].join('|')
                    },
                    {
                        name: '音频',
                        value: 'extensions=' + FILE_SORTS['SORT_MUSIC'].join('|')
                    },
                    {
                        name: 'PDF',
                        value: 'extensions=pdf'
                    },
                    {
                        name: 'Word文档',
                        value: 'extensions=doc|docx'
                    },
                    {
                        name: 'Excel表格',
                        value: 'extensions=xls|xlsx'
                    },
                    {
                        name: 'PowerPoint演示文档',
                        value: 'extensions=ppt|pptx'
                    }
                ];


                var getTimeStamp = function (date) {
                    return Date.parse(date) / 1000;
                };

                var getCondition = function () {
                    var fileSearch = new GKFileSearch();
                    fileSearch.conditionIncludeKeyword(GKSearch.getKeyWord());
                    fileSearch.conditionIncludePath($rootScope.PAGE_CONFIG.file.fullpath || '');
                    if ($scope.mountId > 0) {
                        fileSearch.conditionIncludeMountId($scope.mountId);
                    }
                    if ($scope.extension) {

                        if (!$scope.extension.value) {

                        } else {
                            var tem = $scope.extension.value.split('=');
                            if (tem[0] == 'dir') {
                                fileSearch.conditionIncludeDir(tem[1]);
                            } else if (tem[0] == 'extensions') {
                                fileSearch.conditionIncludeExtension(tem[1].split('|'));
                            }
                        }

                    }
                    var fromCreateDateline = 0,
                        toCreateDateline = 0,
                        toEditDateline = 0,
                        fromEditDateline = 0;
                    if ($scope.fromCreateDate) {
                        fromCreateDateline = getTimeStamp($scope.fromCreateDate);
                    }
                    if ($scope.toCreateDate) {
                        toCreateDateline = getTimeStamp($scope.toCreateDate);
                    }
                    if (fromCreateDateline && toCreateDateline) {
                        fileSearch.conditionIncludeDateline([fromCreateDateline, toCreateDateline]);
                    } else if (fromCreateDateline) {
                        fileSearch.conditionIncludeDateline(fromCreateDateline, 'gt');
                    } else if (toCreateDateline) {
                        fileSearch.conditionIncludeDateline(toCreateDateline, 'lt');
                    }

                    if ($scope.fromEditDate) {
                        fromEditDateline = getTimeStamp($scope.fromEditDate);
                    }
                    if ($scope.toEditDate) {
                        toEditDateline = getTimeStamp($scope.toEditDate);
                    }
                    if (fromEditDateline && toEditDateline) {
                        fileSearch.conditionIncludeLastDateline([fromEditDateline, toEditDateline]);
                    } else if (fromEditDateline) {
                        fileSearch.conditionIncludeLastDateline(fromEditDateline, 'gt');
                    } else if (toEditDateline) {
                        fileSearch.conditionIncludeLastDateline(toEditDateline, 'lt');
                    }
                    if ($scope.creator) {
                        fileSearch.conditionIncludeCreator(String($scope.creator).split(','));
                    }
                    if ($scope.modifier) {
                        fileSearch.conditionIncludeModifier(String($scope.modifier).split(','));
                    }
                    var condition = fileSearch.getCondition();
                    return condition;
                };
                var smartFolderName = '';
                if ($scope.partition == 'smartfolder') {
                    var smartfolder = GKSmartFolder.getFolderByCode($scope.keyword);
                    if (smartfolder) {
                        smartFolderName = smartfolder['name'];
                        $scope.smartFolderName = smartFolderName;
                    }

                }

                $scope.disabledSave = true;
                $scope.$watch('[creator,modifier,fromCreateDate,toCreateDate,fromEditDate,toEditDate,extension]', function (newValue, oldValue) {
                    if (angular.equals(newValue, oldValue)) return;
                    var condition = getCondition();
                    //console.log(condition);
                    GKSearch.setCondition(condition);
                    $rootScope.$broadcast('invokeSearch');
                }, true);

                if ($scope.partition == 'smartfolder') {
                    $scope.$watch('smartFolderName', function (newValue, oldValue) {
                        if (newValue == smartFolderName && getCondition() == condition) {
                            $scope.disabledSave = true;
                        } else {
                            $scope.disabledSave = false;
                        }
                    })
                }

                var getSelectExtension = function (dir, ext) {
                    var selectedValue;
                    var selectedExtension;

                    if (dir === null && ext === null) {
                        selectedValue = '';
                    } else if (ext) {
                        selectedValue = 'extensions=' + ext.join('|');
                    } else {
                        selectedValue = 'dir=' + dir;
                    }
                    angular.forEach($scope.extensions, function (value) {
                        if (value.value == selectedValue) {
                            selectedExtension = value;
                            return false;
                        }
                    })
                    return selectedExtension;
                };

                $scope.$watch(function () {
                    return GKSearch.getCondition();
                }, function (newValue, oldValue) {
//                    console.log(newVale == oldValue);
//                    if(newVale == oldValue){
//                        return;
//                    }
                    $scope.searchKeyword = GKSearch.getKeyWord();
                    $scope.mountId = GKSearch.getConditionField('mount_id');
                    $scope.searchPath = GKSearch.getConditionField('path');
                    var mountId = GKSearch.getConditionField('mount_id') || $scope.PAGE_CONFIG.mount.mount_id;
                    var mount = GKMount.getMountById(mountId);
                    if (mount) {
                        $scope.searchPath = $scope.searchPath ? mount['name'] + '/' + $scope.searchPath : mount['name'];
                    }

                    var creator = GKSearch.getConditionField('creator');
                    $scope.creator = creator ? String(creator).split(' ') : '';
                    var modifier = GKSearch.getConditionField('modifier');
                    $scope.modifier = modifier ? String(modifier).split(' ') : '';

                    var dateline = GKSearch.getConditionField('dateline');

                    if (dateline) {
                        $scope.fromCreateDate = dateline[0] ? $filter('date')(dateline[0] * 1000, 'yyyy-MM-dd') : '';
                        $scope.toCreateDate = dateline[1] ? $filter('date')(dateline[1] * 1000, 'yyyy-MM-dd') : '';
                    }
                    var lastDateline = GKSearch.getConditionField('last_dateline');
                    if (lastDateline) {
                        $scope.fromEditDate = lastDateline[0] ? $filter('date')(lastDateline[0] * 1000, 'yyyy-MM-dd') : '';
                        $scope.toEditDate = lastDateline[1] ? $filter('date')(lastDateline[1] * 1000, 'yyyy-MM-dd') : '';
                    }
                    var dir = GKSearch.getConditionField('dir');
                    var extension = GKSearch.getConditionField('extension');
                    $scope.extension = getSelectExtension(dir, extension);

                    if ($scope.partition == 'smartfolder') {
                        if ($scope.smartFolderName == smartFolderName && newValue == condition) {
                            $scope.disabledSave = true;
                        } else {
                            $scope.disabledSave = false;
                        }
                    }

                })

                /**
                 * 创建智能文件夹
                 */
                $scope.saveSearch = function () {
                    if (!$scope.smartFolderName) {
                        alert('智能文件夹名不能为空');
                        return;
                    }
                    var condition = getCondition();
                    GKApi.createSmartFolder($rootScope.PAGE_CONFIG.mount.mount_id, $scope.smartFolderName, condition).success(function (data) {
                        $scope.$apply(function () {
                            if (data && data.code) {
                                $rootScope.$broadcast('addSmartFolder', $scope.smartFolderName, data.code);
                            }
                        });

                    }).error(function (request) {
                            GKException.handleAjaxException(request);
                        });
                };

                /**
                 * 删除智能文件夹
                 */
                $scope.cancelSmartFolder = function () {
                    if (!confirm('你确定要删除该智能文件夹？')) {
                        return;
                    }
                    GKApi.removeSmartFolder($scope.keyword).success(function (data) {
                        $scope.$apply(function () {
                            $rootScope.$broadcast('removeSmartFolder', $scope.keyword)
                            $location.search({
                                mountid: GKMount.getMyMount()['mount_id'],
                                path: '',
                                partition: 'myfile'
                            });
                        });


                    }).error(function () {

                        });
                };

                /**
                 * 保存智能文件夹
                 */
                $scope.editSmartFolder = function () {
                    if (!$scope.smartFolderName) {
                        alert('智能文件夹名不能为空');
                        return;
                    }
                    var condition = getCondition();
                    GKApi.updateSmartFolder($scope.keyword, $scope.smartFolderName, condition).success(function (data) {
                        alert('保存成功');
                        $scope.$apply(function () {
                            $rootScope.$broadcast('editSmartFolder', $scope.smartFolderName, $scope.keyword);
                        })

                    }).error(function (requst) {
                            GKException.handleAjaxException(requst);
                        });
                };

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
                    if (width < 80) {
                        width = 80;
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

                $scope.$on('$destory',function(){
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
;
