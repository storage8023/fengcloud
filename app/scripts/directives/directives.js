'use strict';

/* Directives */
angular.module('gkClientIndex.directives', [])
    .directive('guiderPopup', [function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: {  content: '@', placement: '@',turnOffGuide:'&',closeGuide:'&'},
            templateUrl: 'views/guider_popup.html'
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
    .directive('guider', ['$compile','$document','$position','$timeout','localStorageService','GKConstant','$rootScope',function ($compile,$document,$position,$timeout,localStorageService,GKConstant,$rootScope) {
        var template = '<guider-popup content="{{guiderContent}}" close-guide="closeGuide()" turn-off-guide="turnOffGuide()" placement="{{placement}}"></guider-popup>';
        return {
            restrict: 'A',
            scope:true,
            link:function(scope, element, attrs ){
                var showTimer,
                    hideTimer,
                    showDely,
                    hideDely,
                    $body,
                    guider,
                    storageKey,
                    isOpen;

                showDely = hideDely = 200;
                guider = $compile(template)(scope);
                storageKey = GKConstant.guideKey+$rootScope.PAGE_CONFIG.user.member_id;

                attrs.$observe('guider',function(value){
                    if(!value) return;
                    jQuery.ajax({
                        url:'views/guider_'+value+'.html',
                        dataType:'html'
                    }).success(function(data){
                            scope.$apply(function(){
                                scope.guiderContent = data;
                            })
                        }).error(function(){
                            scope.$apply(function(){
                                scope.guiderContent = '';
                            })
                        })

                })

                attrs.$observe('guiderPlacement',function(value){
                    scope.placement = angular.isDefined(value)?value:'left';
                })

                scope.closeGuide = function(){
                    cancelBind();
                }

                scope.turnOffGuide = function(){
                    cancelBind();
                    localStorageService.add(storageKey,1);
                    $rootScope.$broadcast('toggleGuider',1);
                }

                var hide = function(){
                    guider.hide();
                    isOpen = false;
                };
                var bufferPosition =  10;
                var position = function(guiderElem){
                    var base,
                        tWidth,
                        tHeight,
                        attachToHeight,
                        attachToWidth,
                        arrowHeigth,
                        arrowWidth,
                        arrowElem,
                        top,
                        left,
                        positionType;

                    positionType  = 'absolute';
                    arrowElem = guiderElem.find('.arrow');
                    base = $position.offset(element);
                    top = base.top;
                    left = base.left;
                    tWidth = guider.width();
                    tHeight = guider.height();
                    attachToHeight = element.outerHeight();
                    attachToWidth = element.outerWidth();
                    arrowHeigth = arrowElem.outerHeight();
                    arrowWidth = arrowElem.outerWidth();
                    $body = $body || $document.find('body');

                    var placementMap = {
                        'right':[attachToHeight/2 - tHeight/2, arrowWidth + attachToWidth],
                        'left':[attachToHeight/2 - tHeight/2, -tWidth - arrowWidth],
                        'top':[-arrowHeigth - tHeight, attachToWidth/2 - tWidth/2],
                        'bottom':[arrowHeigth + attachToHeight, attachToWidth/2 - tWidth/2]
                    };
                    var offset = placementMap[scope.placement];
                    top += offset[0];
                    left += offset[1];

                    var minTop = 0+bufferPosition;
                    var maxTop = $(window).height()-tHeight-bufferPosition;
                    var minLeft = 0+bufferPosition;
                    var maxLeft = $(window).width()-tWidth-bufferPosition;
                    if(top<minTop){
                        arrowElem.css({
                            'margin-top':(arrowHeigth/2+(minTop-top))*-1
                        })
                        top = minTop;
                    }

                    if(top>maxTop){
                        arrowElem.css({
                            'margin-top':(arrowHeigth/2+(top-maxTop))*-1
                        })
                        top = maxTop;
                    }

                    if(left<minLeft){
                        arrowElem.css({
                            'margin-left':(arrowWidth/2+(minLeft-left))*-1
                        })
                        left = minLeft;
                    }

                    if(left>maxLeft){
                        arrowElem.css({
                            'margin-left':(arrowWidth/2+(maxLeft-left))*-1
                        })
                        left = maxLeft;
                    }

                    guiderElem.css({
                        "position": positionType,
                        "top": top,
                        "left": left,
                        "z-index":9999
                    });
                };

                var show =function(){
                    if(!scope.guiderContent){
                        return;
                    }

                    guider.css({
                        'top':'0',
                        'left':'0',
                        'display':'block'
                    })

                    $body = $body || $document.find('body');
                    $body.append(guider);
                    position(guider);
                    isOpen = true;
                    guider.on('mouseenter',function(){
                        if(hideTimer){
                            $timeout.cancel(hideTimer);
                            hideTimer = null;
                        }
                    });

                    guider.on('mouseleave',function(){
                        //return;
                        hideTimer =  $timeout(hide,hideDely);
                    });
                };

                var cancelBind = function(){
                    $timeout.cancel(showTimer);
                    $timeout.cancel(hideTimer);
                    showTimer = hideTimer = null;
                    hide();
                }


                element.on('mouseenter.guider',function(event){
                    if(localStorageService.get(storageKey)){
                        return;
                    }
                    if(isOpen) return;
                    showTimer = $timeout(function(){
                        show();
                    },showDely);
                });

                element.on('mouseleave.guider',function(){
                    if(showTimer){
                        $timeout.cancel(showTimer);
                        showTimer = null;
                    }
                    hideTimer =  $timeout(hide,hideDely);
                });

                element.on('click.guider',function(){
                    if(showTimer){
                        $timeout.cancel(showTimer);
                        showTimer = null;
                    }
                    hide();
                });

                jQuery(window).on('resize.guider',function(){
                    if(isOpen){
                        position(guider);
                    }
                })

                scope.$on('$destroy',function(){
                    cancelBind();
                    guider.remove();
                    jQuery(window).off('resize.guider');
                    element.off('mousedown.guider');
                    element.off('mouseenter.guider');
                    element.off('mouseleave.guider');
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
                                if(dir){
                                    if(triggerElem.hasClass('act_0')){
                                        return;
                                    }
                                    return {
                                        items:{
                                            'open': {
                                                name: '打开',
                                                callback: function (key,opt) {
                                                    var mountId = getMountId();
                                                    if(!mountId) return;
                                                    $timeout(function(){
                                                        GKPath.gotoFile(mountId,fullpath);
                                                    })
                                                }
                                            },
                                            'saveto': {
                                                name: '保存到本地',
                                                callback: function (key,opt) {
                                                    var mountId = getMountId();
                                                    if(!mountId) return;
                                                    var param = {
                                                        list:[{
                                                            mountid:mountId,
                                                            webpath:fullpath,
                                                            dir:1
                                                        }]
                                                    }
                                                    gkClientInterface.saveToLocal(param);
                                                }
                                            }
                                        }
                                    }
                                }else{
                                    var version = getVersion(triggerElem);
                                    return {
                                        items:{
                                            'open': {
                                                name: '打开',
                                                callback: function (key,opt) {
                                                    if(!version){
                                                        return;
                                                    }
                                                    var mountId = getMountId();
                                                    if(!mountId) return;
                                                    gkClientInterface.open({
                                                        mountid:mountId,
                                                        webpath:fullpath,
                                                        version:version
                                                    });
                                                }
                                            },
                                            'recover': {
                                                name: '还原',
                                                callback: function (key,opt) {
                                                    if(!version){
                                                        return;
                                                    }
                                                    var mountId = getMountId();
                                                    if(!mountId) return;
                                                    gkClientInterface.revert({
                                                        mountid:mountId,
                                                        webpath:fullpath,
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
                                                name: '保存到本地',
                                                callback: function (key,opt) {
                                                    if(!version){
                                                        return;
                                                    }
                                                    var mountId = getMountId();
                                                    if(!mountId) return;
                                                    var param = {
                                                        list:[{
                                                            mountid:mountId,
                                                            webpath:fullpath,
                                                            version:version
                                                        }]
                                                    }
                                                    gkClientInterface.saveToLocal(param);
                                                }
                                            }
                                        }
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
        var template = '<size-elem content="{{content}}"></size-elem>';
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                var fakeDiv = jQuery('<div></div>');
                fakeDiv.css($element.css()).css({
                    'display': 'none',
                    'word-wrap': 'break-word',
                    'min-height': $element.height(),
                    'height': 'auto'
                }).insertAfter($element.css('overflow-y', 'hidden'));
                $scope.$watch($attrs.ngModel, function (value) {
                    value = String(value);
                    var content = value.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/'/g, '&#039;')
                        .replace(/"/g, '&quot;')
                        .replace(/ /g, '&nbsp;')
                        .replace(/((&nbsp;)*)&nbsp;/g, '$1 ')
                        .replace(/\n/g, '<br/>')
                        .replace(/<br \/>[ ]*$/, '<br />-')
                        .replace(/<br \/> /g, '<br />&nbsp;');
                    fakeDiv.html(content);
                    $timeout(function () {
                        $element.height(fakeDiv.height());
                    },200)
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
    .directive('member', ['GKDialog', '$rootScope', 'localStorageService','$interval','GKModal','GKNews','GKApi',function (GKDialog,$rootScope,localStorageService,$interval,GKModal,GKNews,GKApi) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/member.html",
            scope: {
                user: '='
            },
            link: function ($scope, $element) {
                var unreadMsgKey = $rootScope.PAGE_CONFIG.user.member_id+'_unreadmsg';
                $scope.newMsg = !!localStorageService.get(unreadMsgKey);
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

                $scope.openNews = function(){
                    GKModal.news(GKNews, GKApi);
                }

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
            }
        }
    }])
    .directive('singlefileRightSidebar', ['$angularCacheFactory','GKFilter', 'GKSmartFolder', '$timeout', 'GKApi', '$rootScope', 'GKModal', 'GKException', 'GKPartition', 'GKFile', 'GKMount', '$interval', 'GKDialog','GKChat','GKPath','$location','GKAuth',function ($angularCacheFactory,GKFilter, GKSmartFolder, $timeout, GKApi, $rootScope, GKModal, GKException, GKPartition, GKFile, GKMount, $interval,GKDialog,GKChat,GKPath,$location,GKAuth) {
        return {
            replace: true,
            restrict: 'E',
            scope: true,
            templateUrl: "views/singlefile_right_sidebar.html",
            link: function ($scope, $element) {
                $scope.file = {};
                $scope.showTab = false; //是否显示共享等tab
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

                    if (options.data != 'sidebar') {
                        lastGetRequest = GKApi.info(mountId, fullpath).success(function (data) {
                            $scope.$apply(function () {
                                $scope.fileLoaded = true;
                                $scope.fileExist = true;
                                var formatFile = GKFile.formatFileItem(data, 'api');
                                angular.extend($scope.file, formatFile);
                                if ($scope.file.cmd > 0 && mount && GKMount.isMember(mount)) {
                                    $scope.showTab = true;
                                } else {
                                    $scope.showTab = false;
                                }
                            });

                        }).error(function (request,textStatus,errorThrown) {
                               //$scope.$apply(function () {
                                    $scope.fileLoaded = true;
                                    $scope.fileExist = false;
                                    var errorCode = GKException.getAjaxErroCode(request);
                                    if (errorCode == 404 || String(errorCode).slice(0, 3) != '404') {
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
                               //})
                                    getFileState(mountId, file.fullpath);
                                    fileInterval = $interval(function () {
                                        getFileState(mountId, file.fullpath);
                                    }, 1000);

                            });
                    }

                    if (options.data != 'file') {
                        lastClientSidebarRequest = GKApi.sideBar(mountId, fullpath, options.type, options.cache).success(function (data) {
                            $scope.$apply(function () {
                                $scope.sidebarLoaded = true;
                                if (data.history) {
                                    $scope.histories = data.history.map(function(item){
                                        item.milestone = item.property?item.property.milestone : 0;
                                        return item;
                                    });
                                }else{
                                    $scope.histories = [];
                                }
                            })
                        }).error(function(){
                                //$scope.$apply(function () {
                                    $scope.sidebarLoaded = true;
                                //})
                            });
                    }
                    $scope.showChatBtn = GKAuth.check(mount,'','file_discuss');
                    $scope.showLinkBtn = GKAuth.check(mount,'','file_link');
                    $scope.showHistory = GKAuth.check(mount,'','file_history');
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
//                    $scope.fileLoaded = false;
//                    $scope.sidebarLoaded = false;
                    getFileInfo(file);
                });

                $scope.fileLoaded = false;
                $scope.sidebarLoaded = false;
                getFileInfo($scope.localFile,{first:true});

                /**
                 * 添加tag
                 * @param tag
                 */
                $scope.postTag = function (tag) {
                    tag = String(tag);
                    GKApi.setTag(getOptMountId($scope.file), $scope.file.fullpath, tag).error(function (request) {
                        GKException.handleAjaxException(request);
                    });
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
                }

                /**
                 * 打开生成临时链接的窗口
                 * @param file
                 */
                $scope.publishFile = function(file){
                   GKModal.publish(getOptMountId(file),file);
                };

                /**
                 * 打开聊天窗口
                 */
                $scope.startChat = function(file){
                    var mountId = getOptMountId(file);
                    GKPath.gotoFile(mountId,'', '','','','chat');
                    GKChat.setSrc(mountId,file.fullpath);
                }

                $scope.showMilestoneDialog = function(file){
                    var firstHistory = $scope.histories[0];
                    var oldMsg = '';
                    if(firstHistory){
                        oldMsg = firstHistory['property']?firstHistory['property']['message']||'' : '';
                    }
                    GKModal.setMilestone(getOptMountId(file),file,oldMsg).result.then(function(){
                        getFileInfo($scope.localFile, {data: 'sidebar', type: 'history', cache: false});
                    });
                }

                $scope.openFile = function(history){
                    var mountId = getOptMountId($scope.file);
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
                            webpath:history.fullpath,
                            version:Number(version)
                        });
                    }

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

                $scope.historyFilter = null;

                $scope.$watch('onlyShowMileStone',function(newValue){
                    if(newValue){
                        $scope.historyFilter = {milestone:1};
                    }else{
                        $scope.historyFilter = null;
                    }
                })

                $scope.$on('$destroy', function () {
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
                    var grid = $element.width() - toolOpt.width() - $element.find('.opt_view_change').outerWidth(true);
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
;
