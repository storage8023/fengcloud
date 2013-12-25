'use strict';
angular.module('GKCommon',['GKCommon.directives','GKCommon.services','GKCommon.filters']);

/* Directives */
angular.module('GKCommon.directives', [])
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
    .directive('scrollLoad', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function ($scope, $element, attrs) {
                var triggerDistance = 0;
                var disableScroll = false;
                if (attrs.triggerDistance != null) {
                    $scope.$watch(attrs.triggerDistance, function (value) {
                        return triggerDistance = parseInt(value||0, 10);
                    });
                }

                if (attrs.disableScroll != null) {
                    $scope.$watch(attrs.disableScroll, function (value) {
                        return disableScroll = !!value;
                    });
                }

                var direction = 'down';
                if(attrs.triggerDirection){
                    direction = attrs.triggerDirection;
                }
                var startScrollTop = 0;
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
                    realDistance = direction =='down'?(scrollH - scrollT - clientHeight):scrollT;
                    if(realDistance <= triggerDistance && !disableScroll){
                        if(!isScrollDown && direction == 'up'){
                            if ($rootScope.$$phase) {
                                return $scope.$eval(attrs.scrollLoad);
                            } else {
                                return $scope.$apply(attrs.scrollLoad);
                            }
                        }else if(isScrollDown && direction == 'down'){
                            if ($rootScope.$$phase) {
                                return $scope.$eval(attrs.scrollLoad);
                            } else {
                                return $scope.$apply(attrs.scrollLoad);
                            }
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
;
/* Services */
angular.module('GKCommon.services', [])
    .constant('newsKey', 'gkNews')
    .constant('FILE_SORTS', {
        'SORT_SPEC': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'],
        'SORT_MOVIE': ['mp4', 'mkv', 'rm', 'rmvb', 'avi', '3gp', 'flv', 'wmv', 'asf', 'mpeg', 'mpg', 'mov', 'ts', 'm4v'],
        'SORT_MUSIC': ['mp3', 'wma', 'wav', 'flac', 'ape', 'ogg', 'aac', 'm4a'],
        'SORT_IMAGE': ['jpg', 'png', 'jpeg', 'gif', 'psd'],
        'SORT_DOCUMENT': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'odt', 'rtf', 'ods', 'csv', 'odp', 'txt'],
        'SORT_CODE': ['js', 'c', 'cpp', 'h', 'cs', 'vb', 'vbs', 'java', 'sql', 'ruby', 'php', 'asp', 'aspx', 'html', 'htm', 'py', 'jsp', 'pl', 'rb', 'm', 'css', 'go', 'xml', 'erl', 'lua', 'md'],
        'SORT_ZIP': ['rar', 'zip', '7z', 'cab', 'tar', 'gz', 'iso'],
        'SORT_EXE': ['exe', 'bat', 'com']
    })
    .factory('GKException', [function () {
        var GKException = {
            getAjaxErrorMsg: function (request) {
                var errorMsg = '';
                if (request.responseText) {
                    var result = JSON.parse(request.responseText);
                    errorMsg = result.error_msg ? result.error_msg : request.responseText;
                } else {
                    switch (request.status) {
                        case 0:
                            errorMsg = '网络未连接';
                            break;
                        case 401:
                            errorMsg = '网络连接超时';
                            break;
                        case 501:
                        case 502:
                            errorMsg = '服务器繁忙, 请稍候重试';
                            break;
                        case 503:
                        case 504:
                            errorMsg = '因您的操作太过频繁, 操作已被取消';
                            break;
                        default:
                            errorMsg = request.status + ':' + request.statusText;
                            break;
                    }
                }
                return errorMsg;
            },
            getClientErrorMsg: function (error) {
                return error.message;
            },
            getAjaxErroCode: function (request) {
                var code = 0;
                if (request.responseText) {
                    var result = JSON.parse(request.responseText);
                    code = result.error_code || 0;
                } else {
                    code = request.status || 0;
                }
                return code;
            },
            handleClientException: function (error) {
                alert(error.message);
            },
            handleAjaxException: function (request) {
                var errorMsg = this.getAjaxErrorMsg(request);
                alert(errorMsg);
            }
        };

        return GKException;
    }])
    .factory('RestFile', ['GK', '$http', function (GK, $http) {
        var restFile = {
            orgShare: function (mount_id, fullpath, collaboration) {
                var date = new Date().toUTCString();
                var method = 'ORG_SHARE';
                var webpath = Util.String.encodeRequestUri(fullpath);
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                return jQuery.ajax({
                    type: method,
                    url: GK.getRestHost() + webpath,
                    headers: {
                        'x-gk-mount': mount_id,
                        'Date': date,
                        'Authorization': authorization,
                    },
                    data: {
                        collaboration: collaboration
                    }
                })
            },

            get: function (mount_id, fullpath) {
                var date = new Date().toUTCString();
                var method = 'GET';
                var webpath = Util.String.encodeRequestUri(fullpath);
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                return jQuery.ajax({
                    type: method,
                    url: GK.getRestHost() + webpath,
                    headers: {
                        'x-gk-mount': mount_id,
                        'Date': date,
                        'Authorization': authorization
                    }
                })
            },
            remind: function (mount_id, fullpath, message) {
                var date = new Date().toUTCString();
                var method = 'REMIND';
                var webpath = Util.String.encodeRequestUri(fullpath);
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                return jQuery.ajax({
                    type: method,
                    dataType: 'json',
                    url: GK.getRestHost() + webpath,
                    headers: {
                        'x-gk-mount': mount_id,
                        'x-gk-bool': 1,
                        'Date': date,
                        'Authorization': authorization,
                        'Content-Type': "application/x-www-form-urlencoded"
                    },
                    data: {
                        message: message
                    }
                })
            },
            recycle: function (mount_id, fullpath, order, start, size) {
                var date = new Date().toUTCString();
                var method = 'RECYCLE';
                var webpath = Util.String.encodeRequestUri(fullpath);
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded"
                };
                if (angular.isDefined(order)) {
                    headers['x-gk-order'] = order;
                }
                if (angular.isDefined(start)) {
                    headers['x-gk-start'] = start;
                }
                if (angular.isDefined(size)) {
                    headers['x-gk-size'] = size;
                }
                return jQuery.ajax({
                    type: method,
                    url: GK.getRestHost() + webpath,
                    headers: headers
                })
            },
            clear: function (mount_id) {
                var date = new Date().toUTCString();
                var method = 'CLEAR';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded",
                    'Accept': '*/*'
                };
                return jQuery.ajax({
                    url: GK.getRestHost() + webpath,
                    dataType: 'text',
                    type: method,
                    headers: headers
                });
//                return $http({
//                    method: method,
//                    url: GK.getRestHost() + webpath,
//                    headers: headers,
//                    responseType:'text'
//                })
            },
            delCompletely: function (mount_id, fullpaths) {
                var date = new Date().toUTCString();
                var method = 'DELETECOMPLETELY';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                if (angular.isArray(fullpaths)) {
                    fullpaths = fullpaths.join('|');
                }
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'x-gk-fullpaths': encodeURIComponent(fullpaths),
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded"
                };

                return $http({
                    method: method,
                    url: GK.getRestHost() + webpath,
                    headers: headers
                })
            },
            recover: function (mount_id, fullpaths, machine) {
                var date = new Date().toUTCString();
                var method = 'RECOVER';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                if (angular.isArray(fullpaths)) {
                    fullpaths = fullpaths.join('|');
                }
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'x-gk-machine': machine,
                    'x-gk-fullpaths': encodeURIComponent(fullpaths),
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded"
                };
                return jQuery.ajax({
                    url: GK.getRestHost() + webpath,
                    dataType: 'text',
                    type: method,
                    headers: headers
                });
            }
        };

        return restFile;
    }
    ])
    .factory('GKApi', ['$http', function ($http) {
        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
        var defaultParams = {};
        var GKApi = {
            editPassword: function (oldPassword, newPassword) {
                var params = {
                    password: oldPassword,
                    newpassword: newPassword,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/set_password',
                    dataType: 'json',
                    data: params
                })
            },
            mounts: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/account/mount',
                    dataType: 'json',
                    data: params
                })
            },
            addToFav: function (mountId, fullpath, type) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    favorite_type: type,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/favorites_add',
                    dataType: 'json',
                    data: params
                })
            },
            removeFromFav: function (mountId, fullpath, type) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    favorite_type: type,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/favorites_delete',
                    dataType: 'json',
                    data: params
                })
            },
            delCollaboration: function (mountId, fullpath, collaboration) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    collaboration: collaboration,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: gkClientInterface.getApiHost() + '/1/file/delete_collaboration',
                    data: params
                });
            },
            userInfo: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/account/info',
                    data: params
                });
            },
            regist: function (name, email, password, user_license_check) {
                var params = {
                    name: name,
                    email: email,
                    password: password,
                    user_license_chk: user_license_check,
                    disable_next_login: 1,
                    token: gkClientInterface.getToken()
                };
                return jQuery.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: gkClientInterface.getSiteDomain() + '/account/regist_submit',
                    data: jQuery.param(params)
                });
            },
            getSmartFolder: function (code) {
                var params = {
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    method: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/search_condition',
                    data: params
                });
            },
            removeSmartFolder: function (code) {
                var params = {
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/remove_search',
                    data: params
                })
            },
            updateSmartFolder: function (code, name, condition, description) {
                var params = {
                    code: code,
                    name: name,
                    condition: condition,
                    description: description || '',
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/edit_search',
                    data: params
                })
            },
            createSmartFolder: function (mount_id, name, condition, description) {
                var params = {
                    mount_id: mount_id,
                    name: name,
                    condition: condition,
                    description: description || '',
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/save_search',
                    data: params
                })
            },
            searchFile: function (condition, mount_id) {
                var params = {
                    mount_id: mount_id,
                    condition: condition,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/search',
                    data: params
                });
            },
            smartFolderList: function (code) {
                var params = {
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/search',
                    data: params
                });
            },
            starFileList: function (type) {
                var params = {
                    favorite_type: type,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/favorites',
                    data: params
                });
            },
            recentFileList: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/recent_modified',
                    data: params
                });
            },
            inboxFileList: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/inbox',
                    data: params
                });
            },
            sideBar: function (mount_id, fullpath, type, cache, start, date) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    type: type || '',
                    start: start || '',
                    date: date || '',
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    cache: cache || true,
                    type: 'GET',
                    dataType: 'json',
                    url: gkClientInterface.getApiHost() + '/1/file/client_sidebar',
                    data: params
                });
            },
            setTag: function (mount_id, fullpath, keyword) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    keywords: keyword,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/keyword',
                    data: params,
                    dataType: 'text'
                });
            },
            update: function (size, dateline) {
                size = angular.isDefined(size) ? size : 100;
                var params = {
                    size: size,
                    token: gkClientInterface.getToken()
                };
                if (angular.isDefined(dateline)) {
                    params['dateline'] = dateline;
                }
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/updates/ls',
                    data: params
                });
            },
            newUpdate: function (dateline) {
                var params = {
                    dateline: dateline || 0,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/updates/ls_newer',
                    data: params
                });
            },
            updateAct: function (id, opt) {
                var params = {
                    id: id,
                    opt: opt,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/updates/do_action',
                    data: params
                });
            },
            teamInvitePending: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/invite_pending',
                    data: params
                });
            },
            teamManage: function (data) {
                var params = {
                    org_id: data,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/updates/',
                    data: params
                });
            },
            teamQuit: function (org_id) {
                var params = {
                    org_id: org_id,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/team/quit',
                    data: params
                });
            },
            teamInviteReject: function (orgId, code) {
                var params = {
                    org_id: orgId,
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/team/invite_reject',
                    data: params
                });
            },
            teamInviteJoin: function (orgId, code) {
                var params = {
                    org_id: orgId,
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/team/invite_accept',
                    data: params
                });
            },
            teamGroupsMembers: function (orgId) {
                var params = {
                    org_id: orgId,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    async:false,
                    dataType:'json',
                    url: gkClientInterface.getApiHost() + '/1/team/groups_and_members',
                    data: params
                });
            },
            groupMember: function (data) {
                var params = {
                    org_id: data,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/group_member',
                    data: params
                });
            },
            teamsearch: function (org_id, keyword) {
                var params = {
                    org_id: org_id,
                    key: keyword,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/search',
                    data: params

                });
            },
            /**
             * 获取设备列表
             * @returns {*}
             */
            devicelist: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/device_list',
                    data: params

                });
            },
            /**
             * 启用禁止设备
             * @returns {*}
             */
            toggleDevice: function (device_id, state) {
                var params = {
                    state: state,
                    device_id: device_id,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/toggle_device',
                    data: params
                });
            },
            /**
             * 删除设备
             * @returns {*}
             */
            delDevice: function (device_id) {
                var params = {
                    device_id: device_id,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/del_device',
                    data: params
                });
            },
            disableNewDevice: function (state) {
                var params = {
                    state: state,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/disable_new_device',
                    data: params
                });
            },
            list: function (mountId, fullpath, start, size, dir) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    start: start || 0,
                    size: size || 0,
                    token: gkClientInterface.getToken(),
                };
                if (angular.isDefined(dir)) {
                    params.dir = dir;
                }
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/ls',
                    data: params
                });
            }
        }
        return GKApi;
    }])
;
angular.module('GKCommon.filters', [])
    .filter('orderObjectBy', function(){
        return function(input, attribute) {
            if (!angular.isObject(input)) return input;
            var array = [];
            for(var objectKey in input) {
                array.push(input[objectKey]);
            }

            array.sort(function(a, b){
                a = parseInt(a[attribute]);
                b = parseInt(b[attribute]);
                return a - b;
            });
            return array;
        }
    })
    .filter('dateAgo', function ($filter) {
        return function (dateline) {
            var now = new Date().valueOf();
            var today = $filter('date')(now, 'yyyy-MM-dd');
            var yesterdayTimestamp = now - 24 * 3600 * 1000;
            var yesterday = $filter('date')(yesterdayTimestamp, 'yyyy-MM-dd');
            var date = $filter('date')(dateline, 'yyyy-MM-dd');
            var dateText = '';
            if (date == today) {
                dateText = $filter('date')(dateline, 'HH:mm');
            } else if (date == yesterday) {
                dateText = '昨天，' + $filter('date')(dateline, 'HH:mm');
            }else{
                dateText =$filter('date')(dateline, 'yyyy年M月d日');
            }
            return dateText;
        }
    })
    .filter('getAvatarUrl', function () {
        return function (memberId,isThumb) {
            isThumb = angular.isDefined(isThumb)?isThumb:1;
            return gkClientInterface.getSiteDomain()+'/index/avatar?id='+memberId+'&thumb='+isThumb;
        }
    })
    .filter('formatFileSize', function () {
        return function (filesize, dir) {
            return dir == 1 ? '-' : Util.Number.bitSize(filesize);
        }
    })
    .filter('bitSize', function(){
        return Util.Number.bitSize;
    })
    .filter('baseName', function(){
        return Util.String.baseName;
    })
    .filter('getPercent',function(){
        return function(val,total){
            return Math.round(val/total * 100)+'%';
        }
    })
    .filter('getFileIconSuffix',['FILE_SORTS',function(FILE_SORTS){
        return function(filename, dir, share, sync){
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
    }])
    .filter('getThumbUrl',[function(){
        return function(hash,filehash){
            return  gkClientInterface.getSiteDomain() + '/index/thumb?hash=' + hash + '&filehash=' + filehash;
        }
    }])
;



/**
 * 客户端的回调
 * @param name
 * @param params
 */
var gkClientCallback = function (name, param) {
    console.log(arguments);
    if (typeof name !== 'string') {
        name = String(name);
    }
    var rootScope = jQuery(document).scope();
    var JSONparam;
    if (param) {
        JSONparam = JSON.parse(param);
    }
    rootScope.$broadcast(name, JSONparam);
};

/**
 * 网站的回调
 * @param name
 * @param params
 */
var gkSiteCallback = function (name, params) {
    console.log(arguments);
    if (typeof name !== 'string') {
        name = String(name);
    }
    var rootScope = jQuery(document).scope();
    rootScope.$broadcast(name, params);
};



// 获取一个元素的所有css属性的patch, $(el).css()
jQuery.fn.css2 = jQuery.fn.css;
jQuery.fn.css = function () {
    if (arguments.length) return jQuery.fn.css2.apply(this, arguments);
    var attr = ['font-family', 'font-size', 'font-weight', 'font-style', 'color',
        'text-transform', 'text-decoration', 'letter-spacing', 'box-shadow',
        'line-height', 'text-align', 'vertical-align', 'direction', 'background-color',
        'background-image', 'background-repeat', 'background-position',
        'background-attachment', 'opacity', 'width', 'height', 'top', 'right', 'bottom',
        'left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border-top-width', 'border-right-width', 'border-bottom-width',
        'border-left-width', 'border-top-color', 'border-right-color',
        'border-bottom-color', 'border-left-color', 'border-top-style',
        'border-right-style', 'border-bottom-style', 'border-left-style', 'position',
        'display', 'visibility', 'z-index', 'overflow-x', 'overflow-y', 'white-space',
        'clip', 'float', 'clear', 'cursor', 'list-style-image', 'list-style-position',
        'list-style-type', 'marker-offset'];
    var len = attr.length, obj = {};
    for (var i = 0; i < len; i++)
        obj[attr[i]] = jQuery.fn.css2.call(this, attr[i]);
    return obj;
};