'use strict';

/* Directives */

angular.module('gkClientIndex.directives', [])
    .directive('gkVersionContextmenu', ['$timeout','$rootScope','GKException',function ($timeout,$rootScope,GKException) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                var getVersion =  function(triggerElem){
                    return Number(triggerElem.data('version'));
                };
                var getMountId = function(){
                    return $scope.localFile.mount_id || $rootScope.PAGE_CONFIG.mount.mount_id;
                };

                $scope.$watch($attrs.gkVersionContextmenu,function(newValue){
                    if(!newValue){
                        jQuery.contextMenu('destroy', '.history_list > .item');
                    }else{
                        /**
                         * 设置右键菜单
                         */
                        jQuery.contextMenu({
                            selector: '.history_list > .item',
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
                            items:{
                                'open': {
                                    name: '打开',
                                    callback: function (key,opt) {
                                        var triggerElem = jQuery(opt.$trigger);
                                        var version = getVersion(triggerElem);
                                        if(!version){
                                            return;
                                        }
                                        var mountId = getMountId();
                                        if(!mountId) return;
                                        gkClientInterface.open({
                                            mountid:mountId,
                                            webpath:$scope.localFile.fullpath,
                                            version:version
                                        });
                                    }
                                },
                                'recover': {
                                    name: '还原',
                                    callback: function (key,opt) {
                                        var triggerElem = jQuery(opt.$trigger);
                                        var version = getVersion(triggerElem);
                                        if(!version){
                                            return;
                                        }
                                        var mountId = getMountId();
                                        if(!mountId) return;
                                        gkClientInterface.revert({
                                            mountid:mountId,
                                            webpath:$scope.localFile.fullpath,
                                            version:version
                                        },function(msg){
                                            if(!msg.error){
                                                alert('恢复成功');
                                                $rootScope.$broadcast('UpdateFileInfo',msg);
                                            }else{
                                                GKException.handleClientException(msg);
                                            }
                                        });
                                    }
                                },
                                'saveto': {
                                    name: '另存为',
                                    callback: function (key,opt) {
                                        var triggerElem = jQuery(opt.$trigger);
                                        var version = getVersion(triggerElem);
                                        if(!version){
                                            return;
                                        }
                                        var mountId = getMountId();
                                        if(!mountId) return;
                                        var param = {
                                            list:[{
                                                mountid:mountId,
                                                webpath:$scope.localFile.fullpath,
                                                version:version
                                            }]
                                        }
                                        gkClientInterface.saveToLocal(param);
                                    }
                                }
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
    .directive('sizeAdjust', ['$timeout', '$compile', function ($timeout, $compile) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                var fakeDiv = $compile(angular.element('<div ng-bind-html="content"></div>'))($scope);
                fakeDiv.css($element.css()).css({
                    'display': 'none',
                    'word-wrap': 'break-word',
                    'min-height': $element.height(),
                    'height': 'auto'
                }).insertAfter($element.css('overflow-y', 'hidden'));
                $element.before(fakeDiv);
                $scope.$watch($attrs.ngModel, function (value) {
                    value = String(value);
                    $scope.content = value.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/'/g, '&#039;')
                        .replace(/"/g, '&quot;')
                        .replace(/ /g, '&nbsp;')
                        .replace(/((&nbsp;)*)&nbsp;/g, '$1 ')
                        .replace(/\n/g, '<br/>')
                        .replace(/<br \/>[ ]*$/, '<br />-')
                        .replace(/<br \/> /g, '<br />&nbsp;');
                    $timeout(function () {
                        $element.height(fakeDiv.height());
                    })
                })

                $scope.$on('$destroy', function () {
                    fakeDiv.remove();
                })
            }
        };
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
    .directive('keybroadNav', ['GKFileList', function (GKFileList) {
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
                    $scope.$apply(function () {
                        var ctrlKeyOn = $event.ctrlKey || $event.metaKey;
                        switch ($event.keyCode) {
                            case 13: //enter
                                if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) < 0) {
                                    var selectedFile = GKFileList.getSelectedFile();
                                    if (selectedFile && selectedFile.length) {
                                        $scope.handleDblClick(selectedFile[0]);
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
                        input.on('keydown', function (e) {
                            if (e.keyCode == 13) {
                                var newFileName = jQuery.trim(input.val());
                                if (!newFileName.length) newFileName = oldFileName;
                                fn($scope, {filename: newFileName});
                                return false;
                            }
                        });
                        input.on('blur', function () {
                            var newFileName = jQuery.trim(input.val());
                            if (!newFileName.length) newFileName = oldFileName;
                            fn($scope, {filename: newFileName});
                        })
                        input.on('dblclick', function () {
                            var newFileName = jQuery.trim(input.val());
                            if (!newFileName.length) newFileName = oldFileName;
                            fn($scope, {filename: newFileName});
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
                        var isShare = $scope.partition == $scope.PAGE_CONFIG.file.sharepath ? 1 : 0;
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

                        newFileItem = $compile(angular.element('<new-file-item dir="{{'+dir+'}}" view="{{view}}" default-new-name="' + defaultNewName + '" is-share="{{' + isShare + '}}" on-submit="submitNewFileName(filename)"></new-file-item>'))($scope);
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
    .directive('gkGuider', ['GKGuiders', '$parse', '$timeout', function (GKGuiders, $parse, $timeout) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                $scope.GKGuiders = GKGuiders;
                $timeout(function () {
                    $attrs.$observe('gkGuider', function (newValue) {
                        var option = $scope.$eval(newValue);
                        angular.extend(option, {
                            attachTo: $element[0]
                        });
                        GKGuiders.createGuider(option);
                    })
                })
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
                'defaultNewName': '@',
                'dir':'@'
            },
            link: function ($scope, $element, $attrs) {
                $scope.filename = $scope.defaultNewName ? $scope.defaultNewName : '新建文件夹';
                var input = $element.find('input');
                input.on('blur', function (event) {
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
    .directive('preventDragDrop', [function () {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                $element.on('dragover', function (event) {
                    event.preventDefault();
                });
                $element.on('dragenter', function (event) {
                    event.preventDefault();
                });
                $element.on('drop', function (event) {
                    event.preventDefault();
                });
            }
        }
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
                element.selectable(opts);
            }
        };
    }])
    .directive('errorSrc', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var errorSrc = attrs.errorSrc;
                element.on('error', function () {
                    if (errorSrc) {
                        element.attr('src', attrs.errorSrc);
                    } else {
                        element.css('display', 'none');
                    }

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
    .directive('member', ['GKDialog', 'GKModal', 'GKNews', 'GKApi', function (GKDialog, GKModal, GKNews, GKApi) {
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
    .directive('singlefileRightSidebar', ['GKFilter', 'GKSmartFolder', 'RestFile', '$timeout', 'GKApi', '$rootScope', 'GKModal', 'GKException', 'GKPartition', 'GKFile', 'GKMount', '$interval', function (GKFilter, GKSmartFolder, RestFile, $timeout, GKApi, $rootScope, GKModal, GKException, GKPartition, GKFile, GKMount, $interval) {
        return {
            replace: true,
            restrict: 'E',
            scope: true,
            templateUrl: "views/singlefile_right_sidebar.html",
            link: function ($scope, $element) {
                $scope.file = {};
                $scope.showTab = false; //是否显示共享等tab
                $scope.enableAddShare = false; //是否允许编辑共享参与人
                $scope.loading = true;
                $scope.fileExist = false;
                var fileInterval,lastGetRequest,lastClientSidebarRequest;
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

                $scope.inputingRemark = false;
                $scope.remarkText = '';

                var getFileState = function (mountId, fullpath) {
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
                        cache: true
                    };

                    options = angular.extend({}, defaultOptions, options);
                    var mountId = getOptMountId(file);
                    var mount = GKMount.getMountById(mountId);
                    var fullpath = file.dir == 1 ? file.fullpath + '/' : file.fullpath;
                    var formatTag = [];

                    if (options.data != 'sidebar') {
                        lastGetRequest = RestFile.get(mountId, fullpath).success(function (data) {
                            $scope.$apply(function () {
                                $scope.loading = false;
                                $scope.fileExist = true;
                                var formatFile = GKFile.formatFileItem(data, 'api');
                                angular.extend($scope.file, formatFile);
                                if (mount['org_id'] > 0 && $scope.file.cmd > 0 && $scope.PAGE_CONFIG.partition != GKPartition.subscribeFile) {
                                    $scope.showTab = true;
                                } else {
                                    $scope.showTab = false;
                                }

                                $scope.enableAddShare = false;
                                /**
                                 * 如果是管理员，并且在根目录允许共享操作
                                 */
                                if (GKMount.isAdmin(mount) && !$rootScope.PAGE_CONFIG.file.fullpath) {
                                    $scope.enableAddShare = true;
                                }
                            });

                        }).error(function (request) {
                                $scope.$apply(function () {
                                    $scope.loading = false;
                                    $scope.fileExist = false;
                                    var errorCode = GKException.getAjaxErroCode(request);
                                    if (String(errorCode).slice(0, 3) != '404') {
                                        return;
                                    }
                                    if (errorCode == 404024 && $scope.localFile.status != 1) {
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
                                })
                            });
                    }

                    if (options.data != 'file') {
                        lastClientSidebarRequest = GKApi.sideBar(mountId, fullpath, options.type, options.cache).success(function (data) {
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
                    $scope.inputingRemark = false;
                    $scope.remarkText = '';
                    if (fileInterval) {
                        $interval.cancel(fileInterval);
                        fileInterval = null;
                    }
                    getFileInfo(file);
                });

                getFileInfo($scope.localFile);

                $scope.postTag = function (tag) {
                    tag = String(tag);
                    GKApi.setTag(getOptMountId($scope.file), $scope.file.fullpath, tag).error(function (request) {
                        GKException.handleAjaxException(request);
                    });
                }

                $scope.handlePostKeyDown = function ($event, tag) {
                    tag = String(tag);
                    var keyCode = $event.keyword;
                    if (keyCode == 13) {
                        $scope.postTag(tag);
                        $scope.focusPostTextarea = false;
                    }
                }

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
                        $timeout(function () {
                            if (!$scope.remarkText) {
                                $scope.inputingRemark = false;
                                $element.find('.post_wrapper textarea').blur();
                            }
                        }, 0)
                    }
                })
                $scope.posting = false;
                /**
                 * 发布讨论
                 */
                $scope.postRemark = function (remarkText) {
                    if($scope.posting){
                        return;
                    }
                    if (!remarkText || !remarkText.length) return;
                    var fullpath = $scope.file.dir == 1 ? $scope.file.fullpath + '/' : $scope.file.fullpath;
                    $scope.posting = true;
                    RestFile.remind(getOptMountId($scope.file), fullpath, remarkText).success(function (data) {
                        $scope.$apply(function(){
                            $scope.posting = false;
                            $scope.cancelPostRemark();
                            if (data && data.length) {
                                $scope.remarks.unshift(data[0]);
                            }
                        })
                    }).error(function (request) {
                            $scope.$apply(function(){
                            $scope.posting = false;
                            GKException.handleAjaxException(request);
                            })
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
                        $element.find('.post_wrapper textarea').blur();
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
                 * 监听刷新事件
                 */
                $scope.$on('refreshSidebar', function ($event,type) {
                    if(!$scope.fileExist){
                        return;
                    }
                    getFileInfo($scope.localFile, {data: 'sidebar', type: type, cache: false});
                })

                $scope.$on('$destroy', function () {
                    jQuery('body').off('click.cancelRemark');
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
    .directive('toolbar', ['GKFilter', 'GKPartition', 'GKSmartFolder', 'GKMount', '$location', '$compile', '$timeout', function (GKFilter, GKPartition, GKSmartFolder, GKMount, $location, $compile, $timeout) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/toolbar.html",
            link: function ($scope, $element) {
                $scope.$on('$locationChangeSuccess', function () {
                    var param = $location.search(), listName = '';
                    if (param.keyword) {
                        listName = '搜索结果';
                    } else {
                        if (param.partition == GKPartition.smartFolder && param.filter) {
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
                    var grid = $element.width() - toolOpt.width() - $element.find('.opt_view_change').outerWidth(true);
                    var count = 0;
                    while (grid < 0) {
                        if (count > 50) break;
                        if (!moreBtn) {
                            var moreBtnHtml = '<button class="f_l dropdown">';
                            moreBtnHtml += '<a dropdown-toggle class="opt" href="javascript:void(0);" ng-class="">';
                            moreBtnHtml += '<span>更多</span>';
                            moreBtnHtml += '<i class="gk_down_arrow"></i>';
                            moreBtnHtml += '</a>';
                            moreBtnHtml += '<ul class="dropdown-menu">';
                            moreBtnHtml += '</ul>';
                            moreBtnHtml += '</button>';
                            moreBtn = $compile(angular.element(moreBtnHtml))($scope);
                        }
                        var lastBtn = toolOpt.find('button.opt_btn:visible:last');
                        var lastBtnClone = jQuery('<li/>').append(lastBtn.find('> a').clone(true));
                        lastBtn.hide();
                        moreBtn.appendTo(toolOpt).find('.dropdown-menu').prepend(lastBtnClone);
                        grid = $element.width() - toolOpt.width() - $element.find('.opt_view_change').outerWidth(true);
                        count++;
                    }
                }
                var oldWidth = $element.width();
                jQuery(window).on('resize.tool', function () {
                    var grid = $element.width() - oldWidth;
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
                    } else {
                        setUI();
                    }
                    //TODO:resize完应该重新赋值oldWidth，但无法知道resize end事件
                    //oldWidth = $element.width();
                })
                $scope.$watch('opts', function () {
                    $timeout(function () {
                        if (moreBtn && moreBtn.size()) {
                            moreBtn.remove();
                            moreBtn = null;

                        }
                        setUI();
                    })
                })
                $timeout(function () {
                    setUI();
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
            scope: { list: '=', onSelect: '&', 'isOpen': '&'},
            template: '<ul class="dropdown-menu input_tip_list" ng-show="isOpen()">'
                + '<li ng-repeat="item in list"><a  ng-mouseenter="handleMouseEnter($index)" ng-click="handleClick($event,$index)" ng-class="item.selected?\'active\':\'\'" title="{{item.member_name}}" href="javascript:void(0)">{{item.member_name}}</a></li>'
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

                $scope.handleMouseEnter = function ($index) {
                    preSelectItem($index);

                };
                $scope.handleClick = function ($event, $index) {
                    //preSelectItem(key);
                    selectItem();
                    $event.stopPropagation();
                };
                $document.bind('keydown', function (e) {
                    if (!$scope.isOpen()) {
                        return;
                    }
                    $scope.$apply(function () {
                        var key_code = e.keyCode;
                        if (!$scope.list || !$scope.list.length) return;
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
    .directive('inputTip', [ '$compile', '$parse', '$document', '$position', '$timeout', '$interval', function ($compile, $parse, $document, $position, $timeout, $interval) {
        var template =
            '<input-tip-popup ' +
                'list="it_list" ' +
                'on-select="it_onSelect(item)" ' +
                'is-open="it_isOpen"' +
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
                    $timeout(function () {
                        setPosition();
                        inputtip.css('display', 'block');
                    }, 0);
                };

                /**
                 * 隐藏提示框
                 */
                var hide = function () {
                    $scope.it_isOpen = false;
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

                $scope.$watch('remarkText', function (newValue, oldeValue) {
                    if (!newValue && newValue !== oldeValue) {
                        hide();
                    }
                });
                var inputPos, val, lastIndex;

                var checkAt = function () {
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
                                } else if (value.member_name.indexOf(q) != -1) {
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
                };

                $scope.it_list = [];
                $scope.it_index = 0;
                var timer;
                $element.bind('focus',function () {
                    if (timer) {
                        $interval.cancel(timer);
                    }
                    timer = $interval(function () {
                        checkAt();
                    }, 100);
                }).bind('blur', function () {
                        if (timer) {
                            $interval.cancel(timer);
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
                    insertChar(item.member_name);
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
    .directive('breadsearch', ['$location', '$timeout', 'GKSearch', 'GKPartition', '$rootScope', 'GKSmartFolder', function ($location, $timeout, GKSearch, GKPartition, $rootScope, GKSmartFolder) {
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
                jQuery(window).on('resize', function () {
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
                        mountid: params.mountid,
                        partition: params.partition,
                        filter: bread.filter
                    });
                    $event.stopPropagation();
                };


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
                    if(!$scope.currentSearchScope){
                        return;
                    }
                    if ($scope.PAGE_CONFIG.partition == GKPartition.smartFolder || ($scope.searchScope == 'path' && $scope.PAGE_CONFIG.filter == 'trash')) {
                        $rootScope.$broadcast('searchSmartFolder', $scope.keyword);
                    } else {
                        var params = {
                            keyword: $scope.keyword,
                            searchscope:$scope.currentSearchScope.name
                        };
                        var fileSearch = new GKFileSearch();
                        fileSearch.conditionIncludeKeyword($scope.keyword);
                        if(['mount','path'].indexOf($scope.currentSearchScope.name)>=0){
                            fileSearch.conditionIncludeMountId($scope.PAGE_CONFIG.mount.mount_id);
                        }
                        if($scope.currentSearchScope.name == 'path'){
                            fileSearch.conditionIncludePath($scope.path);
                        }
                        var condition = fileSearch.getCondition();

                        GKSearch.setCondition(condition);
                        var search = $location.search();
                        $location.search(angular.extend(search, params));
                    }
                };

                var resetSearch = function () {
                    $scope.keyword = '';
                    $scope.searchState = '';
                    GKSearch.reset();
                };

                $scope.cancelSearch = function ($event) {
                    resetSearch();
                    if ($scope.PAGE_CONFIG.partition == GKPartition.smartFolder || ($scope.searchScope == 'path' && $scope.PAGE_CONFIG.filter == 'trash')) {
                        $rootScope.$broadcast('cancelSearchSmartFolder');
                    } else {
                        var search = $location.search();
                        $location.search(angular.extend(search, {
                            keyword: '',
                            searchscope:''
                        }));
                    }
                    $event.stopPropagation();
                };

                $('body').on('mousedown.resetsearch', function (event) {
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

                var getSearchScopes = function () {
                    var searchScopes = [];
                    var params = $location.search();
                    if (params.filter) {
                        searchScopes.push({
                            name: 'filter',
                            text: GKSmartFolder.getSmartFoldeName(params.filter)
                        })
                    } else {
                        if(params.partition == GKPartition.teamFile){
                            searchScopes.push({
                                name: 'partition',
                                text: '我的云库'
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
                    $scope.searchScopes = searchScopes;
                    var len = $scope.searchScopes.length;
                    if (len) {
                        $scope.currentSearchScope = $scope.searchScopes[len - 1];
                    }
                };


                $scope.$on('$locationChangeSuccess', function ($e, $new, $old) {
                    var params = $location.search();
                    if (!params.keyword) {
                        resetSearch();
                        getSearchScopes();
                    }
                });
                getSearchScopes();

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
;
