'use strict';

/* Directives */


angular.module('gkClientIndex.directives', [])
    .directive('finder', ['$location', 'GKPath', '$filter', '$templateCache', '$compile', function ($location, GKPath, $filter, $templateCache, $compile) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/file_list.html",
            scope: {
                fileData: '=',
                view: '=',
                partition: '=',
                order: '=',
                selectedFile: '=',
                rightOpts: '='
            },
            link: function ($scope, $element, $attrs) {
                var selectedFile = [], //当前已选中的条目
                    selectedIndex = [], //已选中文件的索引
                    unSelectFile, //取消选中的函数
                    unSelectAllFile, //取消所有选中的文件
                    selectFile,//选中函数
                    shiftLastIndex = 0 //shift键盘的起始点
                    ;

                selectFile = function (index, multiSelect) {
                    multiSelect = arguments[1] === undefined ? false : true;
                    if (!multiSelect && selectedFile && selectedFile.length) {
                        unSelectAllFile();
                    }
                    $scope.fileData[index].selected = true;
                    selectedFile.push($scope.fileData[index]);
                    selectedIndex.push(index);
                    $scope.selectedFile = selectedFile;
                    //$element.find('.list_body').focus();
                };

                unSelectFile = function (index) {
                    $scope.fileData[index].selected = false;
                    var i = selectedIndex.indexOf(index);
                    if (i >= 0) {
                        selectedIndex.splice(i, 1);
                        selectedFile.splice(i, 1);
                    }
                };

                unSelectAllFile = function () {
                    for (var i = selectedIndex.length - 1; i >= 0; i--) {
                        unSelectFile(selectedIndex[i]);
                    }

                };

                $scope.handleClick = function ($event, index) {
                    var file = $scope.fileData[index];
                    if ($event.ctrlKey || $event.metaKey) {
                        if (file.selected) {
                            unSelectFile(index);
                        } else {
                            selectFile(index, true);
                        }
                    } else if ($event.shiftKey) {
                        var lastIndex = shiftLastIndex;
                        unSelectAllFile();
                        if (index > lastIndex) {
                            for (var i = lastIndex; i <= index; i++) {
                                selectFile(i, true);
                            }
                        } else if (index < lastIndex) {
                            for (var i = index; i <= lastIndex; i++) {
                                selectFile(i, true);
                            }
                        }

                    } else {
                        selectFile(index);
                    }
                    if (!$event.shiftKey) {
                        shiftLastIndex = index;
                    }
                };

                /**
                 * 双击文件
                 * @param $event
                 * @param file
                 */
                $scope.handleDblClick = function ($event, file) {
                    $location.path(GKPath.getPath($scope.partition, file.path, $scope.view));
                };

                /**
                 * 右键文件
                 * @param $event
                 * @param file
                 */
                $element.find('.list_body').bind('contextmenu', function ($event) {
                    $scope.$apply(function () {
                        var jqTarget = jQuery($event.target);
                        var fileItem = jqTarget.hasClass('file_item') ? jqTarget : jqTarget.parents('.file_item');
                        if (fileItem.size()) {
                            var index = fileItem.index();
                            if (!$scope.fileData[index].selected) {
                                selectFile(index);
                            }
                        } else {
                            unSelectAllFile();
                        }
                    });

                });

                /**
                 * 重新索引文件
                 * @param fileData
                 * todo 对shiftlastindex的重新索引
                 */
                var reIndex = function (fileData) {
                    var newSelectedIndex = [];
                    var newSelectedFile = [];
                    angular.forEach(fileData, function (value, key) {
                        angular.forEach(selectedFile, function (file) {
                            if (value == file) {
                                newSelectedIndex.push(key);
                                newSelectedFile.push(file);
                            }
                        });
                    });
                    selectedIndex = newSelectedIndex;
                    selectedFile = newSelectedFile;
                };

                /**
                 * 监听order的变化
                 */
                $scope.$watch('order', function () {
                    $scope.fileData = $filter('orderBy')($scope.fileData, $scope.order);
                    reIndex($scope.fileData);
                });

                /**
                 * 设置order
                 * @param order
                 */
                $scope.setOrder = function (order) {
                    $scope.$emit('setOrder', order);
                };

                /**
                 * enter 键
                 */
                $scope.enterPress = function () {
                    if (selectedFile && selectedFile.length) {
                        $location.path(GKPath.getPath($scope.partition, selectedFile[0].path, $scope.view));
                    }
                };

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
                        $element.find('.file_list_header').css('right', 16);
                    } else {
                        $element.find('.file_list_header').css('right', 0);
                    }
                };

                jQuery(window).bind('resize', function () {
                    setListHeaderWidth();
                });

                /**
                 * fix列表出现滚动条后列表头部对不齐的问题
                 */
                setTimeout(function () {
                    setListHeaderWidth();
                }, 0);

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
                $scope.upLeftPress = function ($event) {
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
                    if (selectedIndex.length) {
                        initIndex = Math.min.apply('', selectedIndex);
                    }
                    var newIndex = initIndex - step;
                    if (newIndex < 0) {
                        newIndex = 0;
                    }

                    if ($event.shiftKey) {
                        for (var i = (initIndex > ($scope.fileData.length - 1) ? $scope.fileData.length - 1 : initIndex); i >= newIndex; i--) {
                            selectFile(i, true);
                        }
                    } else {
                        unSelectAllFile();
                        selectFile(newIndex);
                        shiftLastIndex = newIndex;
                    }
                };

                /**
                 * down right 键
                 * @param $event
                 */
                $scope.downRightPress = function ($event) {
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
                    if (selectedIndex.length) {
                        initIndex = Math.max.apply('', selectedIndex);
                    }
                    var newIndex = initIndex + step;
                    if (newIndex > $scope.fileData.length - 1) {
                        newIndex = $scope.fileData.length - 1;
                    }
                    if ($event.shiftKey) {
                        for (var i = (initIndex > 0 ? initIndex : 0); i <= newIndex; i++) {
                            selectFile(i, true);
                        }
                    } else {
                        unSelectAllFile();
                        selectFile(newIndex);
                        shiftLastIndex = newIndex;
                    }
                };

                /**
                 * 监听键盘事件
                 */
                jQuery(document).bind('keydown', function ($event) {
                    var ctrlKeyOn = $event.ctrlKey || $event.metaKey;
                    //console.log($event.keyCode);
                    $scope.$apply(function () {
                        switch ($event.keyCode) {
                            case 13: //enter
                                if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) < 0) {
                                    $scope.enterPress();
                                }
                                break;
                            case 37: //up
                            case 38: //left
                                $scope.upLeftPress($event);
                                break;
                            case 39: //down
                            case 40: //right
                                $scope.downRightPress($event);
                                break;
                            case 67: //c
                                if (ctrlKeyOn) {
                                    $scope.$emit('ctrlC');
                                }
                                $scope.view = 'thumb';
                                break;

                            case 86: //v
                                if (ctrlKeyOn) {
                                    $scope.$emit('ctrlV');
                                }
                                break;
                            case 88: //x
                                if (ctrlKeyOn) {
                                    $scope.$emit('ctrlX');
                                }
                                break;
                        }
                    });

                });

                /**
                 * 右键
                 */
                jQuery.contextMenu({
                    selector: '.file_list .list_body',
                    reposition: false,
                    zIndex:99,
                    animation: {
                        show: "show",
                        hide: "hide"
                    },
                    build: function (trigger, $event) {
                        //return $scope.$apply(function(){
                        var items = $scope.rightOpts;
                        return {
                            className: 'dropdown-menu',
                            callback: function (key, options) {

                            },
                            items: items
                        };
                        //});

                    }
                });

                /**
                 * 新建文件开始
                 */
                $scope.$on('fileNewFolderStart', function (event, callback) {
                    unSelectAllFile();
                    var newFileItem = $compile($templateCache.get('newFileItem.html'))($scope);
                    newFileItem.addClass('selected').prependTo($element.find('.list_body'));
                    var input = newFileItem.find('input[type="text"]');
                    var inputParent = input.parent();
                    var iElem = inputParent.find('i');
                    input.val('新建文件夹')[0].select();
                    input.bind('keydown', function (e) {
                        if (e.keyCode == 13) {
                            angular.isFunction(callback) && callback(input.val());
                            return false;
                        }
                    });

                    input.bind('blur', function () {
                        angular.isFunction(callback) && callback(input.val());
                    })
                });

                /**
                 * 新建文件结束
                 */
                $scope.$on('fileNewFolderEnd', function (event, newFileData, newFilePath) {
                    $element.find('.file_item_edit').remove();
                    $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
                    angular.forEach($scope.fileData, function (value, key) {
                        if (value.path === newFilePath) {
                            selectFile(key);
                        }
                    });
                });

                /**
                 * 重命名开始
                 */
                $scope.$on('fileEditNameStart', function (event, file, callback) {
                    var fileItem = $element.find('.file_item[data-path="' + file.path + '"]');
                    var input = jQuery('<input name="new_file_name" type="text" id="new_file_name" value="' + file.file_name + '" class="new_file_name form-control" />');
                    fileItem.addClass('file_item_edit');
                    fileItem.find('.name').hide().after(input);
                    input.focus();
                    input.bind('keydown', function (e) {
                        if (e.keyCode == 13) {
                            angular.isFunction(callback) && callback(input.val());
                            return false;
                        }
                    });
                    input.bind('blur', function () {
                        angular.isFunction(callback) && callback(input.val());
                    })
                });

                /**
                 * 重命名结束
                 */
                $scope.$on('fileEditNameEnd', function (event) {
                    var fileItem = $element.find('.file_item.file_item_edit');
                    fileItem.removeClass('file_item_edit');
                    fileItem.find('input[type="text"]').remove();
                    fileItem.find('.name').show();
                });

                /**
                 * ctrlV结束
                 */
                $scope.$on('ctrlVEnd', function (event, newFileData) {
                    $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
                });

                //监听mountdown时间
                $scope.handleMouseDown = function (event) {
                    var $target = jQuery(event.target);
                    if (!$target.hasClass('file_item') && !$target.parents('.file_item').size()) {
                        unSelectAllFile();
                    }
                };
            }
        };
    }])
    .directive('bread', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/bread.html",
            scope: {
                breads: '='
            },
            link: function () {

            }
        }
    }])
    .directive('toolbar', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/toolbar.html",
            link: function ($scope, $element) {

            }
        }
    }])
    .directive('ngRightClick', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngRightClick);
            $element.bind('contextmenu', function (event) {
                $scope.$apply(function () {
                    event.preventDefault();
                    fn($scope, {$events: event});
                });
            });
        };
    })
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
                    'onChange': function (input,d,c) {

                    }
                })
                $scope.$watch('file.formatTag', function () {
                    jQuery($element).importTags($scope.file.formatTag||'');
                });

            }
        }
    }])
    .directive('breadsearch', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/bread_and_search.html",
            link: function ($scope, $element) {
                $scope.searching = false;
                var bread = $element.find('.bread');
                var searchIcon = $element.find('.icon-search');
                var eleWidth = $element.width();
                var hideBread = $element.find('.hide_bread');
                $scope.showSearch = function(event){
                    if($(event.target).hasClass('bread')
                        || $(event.target).parents('.bread').size()
                        || $(event.target).hasClass('searching_label')
                        || $(event.target).parents('.searching_label').size()){
                        return;
                    }
                    $scope.searching = true;
                };

                $scope.hideBreads = [];
                var setBreadUI = function(){
                    var breadWidth = $element.find('.bread').width();
                    var breadListWidth = $element.find('.bread_list').width();
                    var count  = 0;
                    while(count<100 && breadListWidth>breadWidth){
                        $scope.hideBreads.unshift($scope.breads[$scope.hideBreads.length]);
                        $element.find('.bread_list .bread_item').eq(0).remove();
                        breadListWidth = $element.find('.bread_list').width();
                        count ++;
                    }
                };
                setTimeout(function(){
                    setBreadUI();
                    $(window).bind('resize',function(){
                        $scope.$apply(function(){
                            setBreadUI();
                        })
                    })
                },0);

                $('body').bind('mousedown',function(event){
                    $scope.$apply(function(){
                        if($(event.target).hasClass('bread_and_search_wrapper') || $(event.target).parents('.bread_and_search_wrapper').size()){
                            return;
                        }
                        $scope.searching = false;
                    })
                })
            }
        }
    }]);

    /**
     * news
     */
angular.module('gkNewsApp.directives', [])
    .directive('update', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl : "news_update.html",
            link:function(scope, element, attrs) {

            }
        }
    });
/**
 *  personal
 */
angular.module('gkPersonalApp.directives', [])
    .directive('administrator', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl :"personal_administrator.html",
            link:function(scope, element, attrs) {

            }
        }
    })
    .directive('noadministrator', function() {
        return {
            restrict : 'E',
            replace : true,
            transclude : true,
            templateUrl :"personal_noteam.html",
            link:function(scope, element, attrs) {

            }
        }
    })
    .directive('personaladd', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl :"personal_noteam.html",
            link:function(scope, element, attrs) {

             }
        }
    });
    /**
     * site
     */
angular.module('gkSiteApp.directives', [])
    .directive('contentdevice', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl :"site_contentdevice.html",
            link:function(scope, element, attrs) {

            }
        }
    })
    .directive('contentuniversal', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl :"site_contentuniversal.html",
            link : function(scope, element,attrs) {

            }
        }
    })
    .directive('contentsynchronous', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl :"site_contentsynchronous.html",
            link : function(scope, element,attrs) {

            }
        }
    })
    .directive('contentnetwork', function() {
        return {
            restrict : 'E',
            replace : true,
            transclude : true,
            templateUrl :"site_contentnework.html",
            link : function(scope, element,attrs) {

            }
        }
    })
    .directive('contentadvanced', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl :"site_contentadvanced.html",
            link : function(scope, element,attrs) {

            }
        }
    });
    /**
     * viewmember
     */
angular.module('gkViewmemberApp.directives', [])
    .directive('viewmenmbermembers', function() {
        return {
            restrict : 'E',
            replace : true,
            transclude : true,
            templateUrl :"viewmember_content.html",
            link:function(scope, element, attrs) {

            }
        }
    });
    /**
     * sharingsettings
     */
angular.module('gkSharingsettingsApp.directives', [])
    .directive('sharingsettings', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl : "sharing_settings.html",
            link:function(scope, element, attrs) {

            }
        }
    });
    /**
     * contact
     */
angular.module('gkContactApp.directives', [])
    .directive('contactGroupMembers', function() {
        return {
            restrict : 'E',
            replace : true,
            templateUrl : "contact_groupmembers.html",
            link:function(scope, element, attrs) {

            }
        }
    });
