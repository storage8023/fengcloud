'use strict';

/* Directives */


angular.module('gkClientIndex.directives', [])
    .directive('nofileRightSidebar', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/nofile_right_sidebar.html",
            link: function ($scope, $element) {

            }
        }
    }])
    .directive('singlefileRightSidebar', ['RestFile','$location','$timeout','selectMemberModal',function (RestFile,$location,$timeout,selectMemberModal) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/singlefile_right_sidebar.html",
            link: function ($scope, $element) {
                /**
                 * 添加注释
                 * @param tag
                 */
                $scope.addTag = function (tag) {
                    var newTag = $scope.file.tag + ' ' + tag;
                    GKApi.setTag(searchParams.mountid, $scope.file.fullpath, newTag).success(function () {

                    }).error(function () {

                        });
                };

                /**
                 * 删除注释
                 * @param tag
                 */
                $scope.removeTag = function (tag) {
                    var newTag = $scope.file.tag.replace(new RegExp(tag + '([,;；，\\s]|$)', 'g'), '');

                    GKApi.setTag(searchParams.mountid, $scope.file.fullpath, newTag).success(function () {

                    }).error(function () {

                        });
                };
                $scope.inputingRemark = false;
                $scope.postText = '';

                /**
                 * 取消发布备注
                 */
                $scope.cancelPostRemark = function () {

                    $scope.postText = '';
                    $scope.inputingRemark = false;
                };

                /**
                 * 发布讨论
                 */
                $scope.postRemark = function (postText) {

                    if (!postText || !postText.length) return;
                    var fullpath = $scope.file.dir ==1?$scope.file.fullpath+'/':$scope.file.fullpath;
                    RestFile.remind($location.search().mountid, fullpath, postText).success(function (data) {
                        $scope.postText = '';
                        $scope.inputingRemark = false;
                        if (data && data.length) {
                            $scope.remarks.unshift(data[0]);
                        }

                    }).error(function () {

                        });
                };

                $scope.folded = false;
                /**
                 * 显示及缩小文件信息框
                 */
                $scope.toggleFileInfoWrapper = function () {
                    $scope.folded = !$scope.folded;
                };

                $scope.insertAt = function(){
                    var input = '@';
                    var val = $scope.postText;
                    var jqTextarea = $element.find('.post_wrapper textarea');
                    var input_pos = Util.Input.getCurSor(jqTextarea[0]).split('|');
                    var is_insert = input_pos[1] != val.length ? 1 : 0;
                    var l = val.substr(0, input_pos[0]);
                    var r = val.substr(input_pos[1], val.length);
                    val = l + input + r;
                    $scope.postText = val;
                    $timeout(function(){
                        if (is_insert) {
                            Util.Input.moveCur(jqTextarea[0], parseInt(input_pos[0]) + (input).length);
                        } else {
                            Util.Input.moveCur(jqTextarea[0], val.length);
                        }
                    },0);

                }

                $scope.showEditShareDialog = function(){
                  var selectModal = selectMemberModal.open(PAGE_CONFIG.mount.org_id);
                    selectModal.result.then(function(selectedMembers,selectedGroups){

                    },function(){

                    })
                };
            }
        }
    }])
    .directive('multifileRightSidebar', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/multifile_right_sidebar.html",
            link: function ($scope, $element) {

            }
        }
    }])
    .directive('finder', ['$location', 'GKPath', '$filter', '$templateCache', '$compile', '$rootScope', function ($location, GKPath, $filter, $templateCache, $compile, $rootScope) {
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
                rightOpts: '=',
                keyword: '@'
            },
            link: function ($scope, $element) {
                var selectedFile = [], //当前已选中的条目
                    selectedIndex = [], //已选中文件的索引
                    unSelectFile, //取消选中的函数
                    unSelectAllFile, //取消所有选中的文件
                    selectFile,//选中函数
                    shiftLastIndex = 0 //shift键盘的起始点
                    ;

                /**
                 * 选中文件
                 * @param index
                 * @param multiSelect
                 */
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
                /**
                 * 取消选中
                 * @param index
                 */
                unSelectFile = function (index) {
                    $scope.fileData[index].selected = false;
                    var i = selectedIndex.indexOf(index);
                    if (i >= 0) {
                        selectedIndex.splice(i, 1);
                        selectedFile.splice(i, 1);
                    }
                };
                /**
                 * 取消所有选中
                 */
                unSelectAllFile = function () {
                    for (var i = selectedIndex.length - 1; i >= 0; i--) {
                        unSelectFile(selectedIndex[i]);
                    }

                };
                /**
                 * 处理点击
                 * @param $event
                 * @param index
                 */
                $scope.handleClick = function ($event, index) {
                    // console.log($scope.rightOpts);
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
                $scope.handleDblClick = function (file) {
                    /**
                     * 文件夹
                     */
                    if (file.dir == 1) {
                        var params = $location.search();
                        $location.search({
                            path: file.fullpath,
                            view: $scope.view,
                            partition: params.partition,
                            mountid: params.mountid
                        });
                        $rootScope.PAGE_CONFIG.file = file;
                    } else {
                        $scope.$emit('openFile', file);
                    }
                };

                /**
                 * 根据rightOpts的变化重置右键
                 */
                $scope.$watch('rightOpts', function () {
                    jQuery.contextMenu('destroy', '.file_list .list_body');
                    /**
                     * 设置右键菜单
                     */
                    jQuery.contextMenu({
                        selector: '.file_list .list_body',
                        reposition: false,
                        zIndex: 99,
                        scope: $scope,
                        animation: {
                            show: "show",
                            hide: "hide"
                        },
                        items: $scope.rightOpts
                    });
                });

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
                        if (!$scope.fileData[index].selected) {
                            selectFile(index);
                        }
                    } else {
                        unSelectAllFile();
                    }
                };


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
                        $scope.handleDblClick(selectedFile[0]);
                    }
                };

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
                        $element.find('.file_list_header').css('right', 16);
                    } else {
                        $element.find('.file_list_header').css('right', 0);
                    }
                };
                jQuery(window).bind('resize', function () {
                    setListHeaderWidth();
                });
                setTimeout(function () {
                    setListHeaderWidth();
                }, 0);

                /**
                 * 获取缩略图模式下每行的列数
                 * @returns {number}
                 */
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
                        if (value.fullpath === newFilePath) {
                            selectFile(key);
                        }
                    });
                });

                /**
                 * 重命名开始
                 */
                $scope.$on('fileEditNameStart', function (event, file, callback) {
                    var fileItem = $element.find('.file_item[data-fullpath="' + file.fullpath + '"]');
                    var input = jQuery('<input name="new_file_name" type="text" id="new_file_name" value="' + file.filename + '" class="new_file_name form-control" />');
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

                /**
                 * 监听mousedown事件
                 * @param event
                 */
                $scope.handleMouseDown = function (event) {
                    var $target = jQuery(event.target);
                    if (!$target.hasClass('file_item') && !$target.parents('.file_item').size()) {
                        unSelectAllFile();
                    }
                };
            }
        };
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
    .directive('inputTipPopup', ['$document', '$parse', '$timeout', function ($document, $parse, $timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: { list: '&', onSelect: '&'},
            template: '<ul class="dropdown-menu input_tip_list">'
                + '<li ng-repeat="(key,item) in list"><a  ng-mouseenter="handleMouseEnter(key)" ng-click="handleClick(key)" ng-class="item.selected?\'active\':\'\'" title="{{item.name}}" href="javascript:void(0)">{{item.name}}</a></li>'
                + '</ul>',
            link: function ($scope, $element, $attrs) {
                var index = 0;
                $scope.$watch('list', function () {
                    if ($scope.list && $scope.list.length) {
                        preSelectItem(index);
                    }
                })
                var selectItem = function () {
                    if ($scope.onSelect != null) {
                        $scope.onSelect({item: $scope.list[index]})
                    }
                };
                var preSelectItem = function (newIndex) {
                    if (!$scope.list || !$scope.list.length) return;
                    angular.forEach($scope.list,function(value){
                        if(value.selected){
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
                            if(key_code == 38){
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
    .directive('inputTip', [ '$compile', '$parse', '$document', '$position', '$timeout',function ($compile, $parse, $document, $position,$timeout) {
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
                    if (appendToBody) {
                        $body = $body || $document.find('body');
                        //console.log(inputtip);
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
                        inputtip.css('display','block');
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

                var checkAt = function(){
                    $scope.$apply(function(){
                        val = $scope.postText;
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
                        if(!resultList || !resultList.length){
                            hide();
                        }else{
                            $scope.it_list = resultList;
                            show();
                        }
                    });
                };

                $scope.it_list = [];
                var timer;
                $element.bind('focus',function(){
                    if(timer){
                        clearInterval(timer);
                    }
                    timer  =  setInterval(checkAt,200);
                }).bind('blur',function(){
                        if(timer){
                            clearInterval(timer);
                        }
                    })


                var insertChar = function (input) {
                    input += ' ';
                    var newVal = $scope.postText;
                    var newInputPos = inputPos;
                    var isInsert = newInputPos[1] != newVal.length;
                    newVal = newVal.substr(0, lastIndex + 1) + input + newVal.substr(inputPos[1], newVal.length);
                    $scope.postText = newVal;
                    $timeout(function(){
                        if (isInsert) {
                            Util.Input.moveCur(elem, parseInt(inputPos[0]) + (input).length);
                        } else {
                            Util.Input.moveCur(elem, $scope.postText.length);
                        }
                    },0)

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
                $scope.$watch('file.formatTag', function () {
                    jQuery($element).importTags($scope.file.formatTag || '');
                });

            }
        }
    }])
    .directive('breadsearch', ['$location', '$timeout', function ($location, $timeout) {
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
                    while (breadListWidth > breadWidth) {
                        if ($element.find('.bread_list .bread_item:visible').size() == 1) {
                            break;
                        }
                        var hideBread = $scope.breads[$scope.hideBreads.length];
                        if (hideBread) {
                            $scope.hideBreads.unshift($scope.breads[$scope.hideBreads.length]);
                            $element.find('.bread_list .bread_item:visible').eq(0).hide();
                            breadListWidth = $element.find('.bread_list').width();
                        }
                    }
                };

                $scope.$watch('breads', function () {
                    $scope.hideBreads = [];
                    $element.find('.bread_list .bread_item:hidden').show();
                    $timeout(function () {
                        setBreadUI();
                    }, 0);
                })

                var oldBreadWidth = $element.find('.bread').width();
                jQuery(window).bind('resize', function () {
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
                        path: bread.path,
                        view: $scope.view,
                        mountid: params.mountid,
                        partition: params.partition
                    });
                    $event.stopPropagation();
                };

                var resetSearch = function () {
                    $scope.searchState = '';
                    $scope.keyword = '';
                };
                /**
                 * 监听mousedown 取消搜索模式
                 */
                $('body').bind('mousedown', function (event) {
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

                $scope.$on('$locationChangeSuccess', function () {
                    resetSearch();
                });
            }
        }
    }])
/**
 * 搜索的侧边栏
 */
    .directive('searchRightSidebar', ['GKApi', '$rootScope',function (GKApi,$rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: "views/search_right_sidebar.html",
            link: function ($scope, $element, $attrs) {

                $scope.conditions = [
                    {
                        selectedOption:'extension'
                    }
                ];

                $scope.tags = ['test1','test2'];

            }
        }
    }])
/**
 * 搜索条件设置
 */
    .directive('searchCondition', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope:{
                selectedOption:'='
            },
            templateUrl: "views/search_condition.html",
            link: function ($scope, $element, $attrs) {
                $scope.options = [
                    {
                        name:'文件类型',
                        value:'extension'
                    },
                    {
                        name:'添加时间',
                        value:'create_dateline'
                    },
                    {
                        name:'最后修改时间',
                        value:'last_dateline'
                    },
                    {
                        name:'添加人',
                        value:'creator'
                    },
                    {
                        name:'最后修改人',
                        value:'modifier'
                    }
                 ];
                $scope.condition = $scope.options[0];

                $scope.fileTypes = [
                    {
                        name:'任意',
                        value:''
                    },
                    {
                        name:'文件夹',
                        value:''
                    },
                    {
                        name:'文件',
                        value:''
                    },
                    {
                        name:'图片',
                        value:''
                    },
                    {
                        name:'视频',
                        value:''
                    },
                    {
                        name:'音频',
                        value:''
                    },
                    {
                        name:'PDF',
                        value:''
                    },
                    {
                        name:'Word文档',
                        value:''
                    },
                    {
                        name:'Excel表格',
                        value:''
                    },
                    {
                        name:'PowerPoint演示文档',
                        value:''
                    }
                ];

                $scope.fileType = $scope.fileTypes[0];

            }
        }
    }])

/**
 * 选中人的输入框
 */
    .directive('inputMember', ['GKApi','$rootScope',function (GKApi,$rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope:{

            },
            templateUrl: "views/input_member.html",
            link: function (scope, element, attrs) {
                $scope.$watch('tags',function(newValue,oldValue){
                    if(newValue === oldValue){
                        return;
                    }
                    GKApi.teamsearch($rootScope.PAGE_CONFIG.mount.org_id,'test').then(function(data){

                    });
                });
            }
        }
    }])
    .directive('inputDatepicker', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope:{
               isOpen:"@",
               ngModel:'='
            },
            template: '<div class="form-control input-datepicker">'
                +'<input type="text" datepicker-popup="yyyy年M月d日" ng-model="ngModel" is-open="isOpen" current-text="今天" toggle-weeks-text="周" clear-text="清空" close-text="关闭"/>'
                +'<i class="calendar" ng-class="isOpen=true"></i>'
                +'</div>',
            link: function ($scope, $element, $attrs) {

            }
        }
    }])
;

    /**
     * news
     */
    angular.module('gkNewsApp.directives', [])
        .directive('update', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "views/news_update.html",
                link: function (scope, element, attrs) {

                }
            }
            })
        .directive('noupdate', function () {
            return {
                restrict: 'E',
                replace: true,
                template: '<span>暂时还没有与你有关的消息</span>',
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('newsindex', function (){
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "views/news_index.html",
                link: function (scope, element, attrs) {

                }
            }
        })
    /**
     *  personal
     */
    angular.module('gkPersonalApp.directives', [])
        .directive('administrator', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "personal_administrator.html",
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('noadministrator', function () {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: "personal_noteam.html",
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('personaladd', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "personal_noteam.html",
                link: function (scope, element, attrs) {

                }
            }
        });
    /**
     * site
     */
    angular.module('gkSiteApp.directives', [])
        .directive('contentdevice', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "site_contentdevice.html",
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('contentuniversal', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "site_contentuniversal.html",
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('contentsynchronous', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "site_contentsynchronous.html",
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('contentnetwork', function () {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: "site_contentnework.html",
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('contentadvanced', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "site_contentadvanced.html",
                link: function (scope, element, attrs) {

                }
            }
        });
    /**
     * viewmember
     */
    angular.module('gkviewmemberApp.directives', [])
        .directive('viewmenmbermembers', function () {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: "views/viewmember_content.html",
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('viewmenmberindex', function () {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: "views/viewmember_content.html",
                link: function (scope, element, attrs) {

                }
            }
        });

    /**
     * sharingsettings
     */
    angular.module('gkSharingsettingsApp.directives', [])
        .directive('sharingsettings', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "views/sharing_settings.html",
                link: function (scope, element, attrs) {

                }
            }
        })
        .directive('sharingsettingsindex', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "views/sharing_setting_index.html",
                link: function (scope, element, attrs) {

                }
            }
        });
    /**
     * contact
     */
    angular.module('gkContactApp.directives', [])
        .directive('contactGroupMembers', function () {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "contact_groupmembers.html",
                link: function (scope, element, attrs) {

                }
            }
     })
   ;
