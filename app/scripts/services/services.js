'use strict';

/* Services */
//全局AJAX请求默认返回的数据格式
jQuery.ajaxSetup({
    dataType: 'json',
    timeout:30000
});

angular.module('gkClientIndex.services', [])
    .constant('newsKey','gkNews')
    .value('uiSelectableConfig',{
        filter:'.file_item',
        //tolerance:'fit',
        distance: 10
    })
    .factory('GKOpen', [function ($q) {
        return {
            manage:function(orgId){
                var url = gkClientInterface.getUrl({
                    url:'/manage?org_id='+orgId,
                    sso:1
                });
                gkClientInterface.openUrl(url);
            },
            move:function(){

            }
        };
    }])
    .factory('GKFileOpt',['$q','GK',function($q,GK){
         var GKFileOpt = {};
         return {
            copy:function(toFullpath,toMountId,fromFullpathes,fromMountId){
                if(!angular.isArray(fromFullpathes)){
                    fromFullpathes  = [fromFullpathes];
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
             move:function(toFullpath,toMountId,fromFullpathes,fromMountId){
                 if(!angular.isArray(fromFullpathes)){
                     fromFullpathes  = [fromFullpathes];
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
    .factory('GKModal',['$rootScope','$modal','GK','GKMount','GKPartition','$location','$timeout','GKException','GKDialog','GKPath',function($rootScope,$modal,GK,GKMount,GKPartition,$location,$timeout,GKException,GKDialog,GKPath){
        var defaultOption = {
            backdrop: 'static',
            keyboard:false,
        };
        return{
            news:function(GKNews,GKApi){
                var context = this;
                var option = {
                    templateUrl: 'views/news_dialog.html',
                    windowClass: 'news_dialog',
                    controller: function ($scope, $modalInstance,classifyNews) {

                        $scope.cancel = function(){
                            $modalInstance.dismiss('cancel');
                        };

                        $timeout(function(){
                            $scope.showList = true;
                        },500)
                        $scope.classifyNews = classifyNews;
                        $scope.loading = false;
                        var requestDateline = 0;
                        $scope.getMoreNews = function () {
                            $scope.loading = true;

                            GKApi.update(100, requestDateline).success(function (data) {
                                $scope.$apply(function(){
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

                        $scope.getBtnClasses = function(opt){
                            var successBtn = ['invite_accept'];
                            var dangerBtn = ['invite_reject'];
                            if(dangerBtn.indexOf(opt.opt)>=0){
                                return 'btn-danger';
                            }else if(successBtn.indexOf(opt.opt)>=0){
                                return 'btn-success';
                            }else if(opt.type == 'view'){
                                return 'btn-primary';
                            }else if(opt.type == 'url'){
                                if(!opt.btn_class){
                                    return 'btn-primary';
                                }else{
                                    if(opt.btn_class == 'blue'){
                                        return 'btn-primary';
                                    }else if(opt.btn_class == 'red'){
                                        return 'btn-danger';
                                    }else if(opt.btn_class == 'green'){
                                        return 'btn-success';
                                    }else if(opt.btn_class == 'yellow'){
                                        return 'btn-warning';
                                    }else{
                                        return 'btn-default';
                                    }
                                }
                            }else{
                                return 'btn-default';
                            }
                        };

                        $scope.handleOpt = function(opt,item){
                            if(opt.type=='request'){
                                if(opt.opt == 'invite_accept' || opt.opt == 'invite_reject'){
                                    if(!confirm('你确定要'+opt.name+'该团队的邀请？')){
                                        return;
                                    }
                                }
                                GKApi.updateAct(item.id,opt.opt).success(function (data) {
                                    $scope.$apply(function(){
                                        item.opts = [];
                                        if(data && data.updates){
                                            var newItem = data.updates[0];
                                            item.render_content = newItem.render_content;
                                        }

                                    });

                                }).error(function (request) {
                                        GKException.handleAjaxException(request);
                                    });
                            }else if(opt.type=='url'){
                                var url = gkClientInterface.getUrl({
                                    url:opt.url,
                                    sso:Number(opt.sso)
                                });
                                if(opt.browser == 1){
                                    gkClientInterface.openUrl(url);
                                }else{
                                    var data = {
                                        url:url,
                                        type:"sole",
                                        width:794,
                                        resize:1,
                                        height:490
                                    }
                                    gkClientInterface.setMain(data);
                                };
                                $modalInstance.close();
                            }else if(opt.type=='view'){
                                if(opt.opt == 'view_file'){
                                    var fullpath = item.dir == 1?item.fullpath: Util.String.dirName(item.fullpath);
                                    var selectPath = item.dir == 1?'':item.fullpath;
                                    GKPath.gotoFile(item.mount_id, fullpath,selectPath);
                                }else if(opt.opt == 'view_org_root'){
                                    if(!item.org_id){
                                        return;
                                    }
                                    var mount = GKMount.getMountByOrgId(item.org_id);
                                    if(!mount){
                                        return;
                                    }
                                    GKPath.gotoFile(mount.mount_id, '');
                                }else if(opt.opt == 'view_org_member'){
                                    if(!item.org_id){
                                        return;
                                    }
                                    context.teamMember(item.org_id);
                                }
                                else if(opt.opt == 'view_device'){
                                    GKDialog.openSetting('device');
                                }
                                $modalInstance.close();
                            }
                        };

                        /**
                         *处理邀请加入团队的请求
                         * @param accept
                         */
                        $scope.handleTeamInvite = function (accept, item) {
                            if (accept) {
                                GKApi.teamInviteJoin(item['org_id'], item['property']['invite_code']).success(function () {
                                    $scope.$apply(function(){
                                        item.handled = true;
                                    });

                                }).error(function () {

                                    });
                            } else {
                                GKApi.teamInviteReject(item['org_id'], item['property']['invite_code']).success(function () {
                                    $scope.$apply(function(){
                                        item.handled = true;
                                    });

                                }).error(function () {

                                    });
                            }

                        };

                        /**
                         * 处理申请加入团队的请求
                         */
                        $scope.handleTeamRequest = function (agree) {

                        };
                    },
                    resolve:{
                        classifyNews:function(){
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
                option = angular.extend({},defaultOption,option);
                return $modal.open(option);
            },
            backUp:function(){
                var option = {
                    templateUrl: 'views/backup.html',
                    windowClass: 'backup_dialog',
                    controller: function ($scope, $modalInstance) {
                        var tips = {
                            'desktop': {
                                mac:'同步桌面上的文件到够快',
                                windows:'同步桌面上的文件到够快'
                            },
                            'documents': {
                                mac:'同步finder中的文档文件夹（路径）到够快',
                                windows:'同步电脑中的文档文件夹（库\\文档）到够快'
                            },
                            'pictures': {
                                mac:'同步finder中的图片文件夹（路径）到够快',
                                windows:'同步电脑中的图片文件夹（库\\图片）到够快'
                            },
                            'music': {
                                mac:'同步finder中的音乐文件夹（路径）到够快',
                                windows:'同步电脑中的音乐文件夹（库\\音乐）到够快'
                            },
                            'video': {
                                mac:'同步finder中的视频文件夹（路径）到够快',
                                windows:'同步电脑中的视频文件夹（库\\视频）到够快'
                            },
                            'other': {
                                mac:'自定义计算机中的文件夹同步到够快',
                                windows:'自定义计算机中的文件夹同步到够快'
                            }
                        };
                        var os = gkClientInterface.getClientOS().toLowerCase();
                        $scope.backupList = [
                            {
                                name:'desktop',
                                text:'桌面',
                                tip:tips['desktop'][os]
                            },
                            {
                                name:'documents',
                                text:'文档',
                                tip:tips['documents'][os]
                            },
                            {
                                name:'pictures',
                                text:'照片',
                                tip:tips['pictures'][os]
                            },
                            {
                                name:'music',
                                text:'音乐',
                                tip:tips['music'][os]
                            },
                            {
                                name:'video',
                                text:'视频',
                                tip:tips['video'][os]
                            },
                            {
                                name:'other',
                                text:'文件夹',
                                tip:tips['other'][os]
                            }
                        ];
                        $scope.backUp = function(item){
                            var localUri = '',defaultName = '';
                            if(item.name=='other'){
                                localUri = gkClientInterface.selectPath({
                                    disable_root:1
                                });
                                if(!localUri){
                                    return;
                                }
                                defaultName = Util.String.baseName(Util.String.rtrim(Util.String.rtrim(localUri,'/'),'\\\\'));
                            }else{
                                localUri = gkClientInterface.getComputePath({
                                    type:item.name
                                });
                                defaultName = item.text;
                            }
                            if(!defaultName) return;
                            var myMount = GKMount.getMyMount();
                            var  params = {
                                webpath: defaultName,
                                fullpath: localUri,
                                mountid: myMount['mount_id']
                            };
                            gkClientInterface.setLinkPath(params,function(){
                                $modalInstance.close({
                                    mountid:myMount['mount_id'],
                                    partition:GKPartition.myFile,
                                    path:'',
                                    view:$location.search().view,
                                    selectedpath:''
                                });
                            })
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                };
                option = angular.extend({},option,defaultOption);
                return $modal.open(option);
            },
            nearBy:function(){
                var option = {
                    templateUrl: 'views/nearby_dialog.html',
                    windowClass: 'modal_frame nearby_dialog',
                    controller: function ($scope, $modalInstance,src) {
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $rootScope.$on('subscribeTeamSuccess', function (event, orgId) {
                            $modalInstance.close(orgId);

                        })
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso:1,
                                url:'/org/neighbour'
                            });
                        }
                    }
                };
                option = angular.extend({},defaultOption,option);
                return $modal.open(option);
            },
            createTeam:function(){
                var option = {
                    templateUrl: 'views/create_team_dialog.html',
                    windowClass: 'modal_frame create_team_dialog',
                    controller: function ($scope, $modalInstance,src) {
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $rootScope.$on('createTeamSuccess',function(event,orgId){
                            $modalInstance.close(orgId);
                        })
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso:1,
                                url:'/org/regist'
                            });
                        }
                    }
                };
                option = angular.extend({},defaultOption,option);
                return $modal.open(option);
            },
            addShare:function(mountId,fullpath){
                var option = {
                    templateUrl: 'views/add_share_dialog.html',
                    windowClass: 'modal_frame add_share_dialog',
                    controller: function ($scope, $modalInstance,src) {
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.$on('addShareDone',function(isCancel){
                            if(isCancel==1){
                                $modalInstance.dismiss('cancel');
                            }else{
                                $modalInstance.close('done');
                                $rootScope.$broadcast('refreshSidebar');
                            }

                        })
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso:1,
                                url:'/client/set_share_dialog?fullpath='+fullpath+'&mount_id='+mountId
                            });
                        }
                    }
                };
                option = angular.extend({},defaultOption,option);
                return $modal.open(option);
            },
            teamMember:function(orgId){
                var option = {
                    templateUrl: 'views/team_member_dialog.html',
                    windowClass: 'modal_frame team_member_dialog',
                    controller: function ($scope, $modalInstance,src) {
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso:1,
                                url:'/client/get_member_dialog?org_id='+orgId
                            });
                        }
                    }
                };
                option = angular.extend({},defaultOption,option);
                return $modal.open(option);
            },
            teamQr:function(orgId,width){
                var option = {
                    templateUrl: 'views/team_qr_dialog.html',
                    windowClass: 'modal_frame team_qr_dialog',
                    controller: function ($scope, $modalInstance,src) {
                        $scope.url = src;
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {
                        src: function () {
                            return gkClientInterface.getUrl({
                                sso:1,
                                url:'/org/qr_subscribe?org_id='+orgId+'&width='+600
                            });
                        }
                    }
                };
                option =angular.extend({},defaultOption,option);
                return $modal.open(option);
            },
            createTeamFolder:function(){
                var option = {
                    templateUrl: 'views/create_teamfolder_dialog.html',
                    windowClass: 'create_teamfolder',
                    controller: function ($scope, $modalInstance) {
                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };

                        $scope.filename = '';
                        $scope.shareToSubscriber = false;
                        $scope.ok = function(filename,shareToSubscriber){
                            if(!filename || !filename.length){
                                alert('请输入文件夹名称');
                                return;
                            }
                            $modalInstance.close({
                                filename:filename,
                                shareToSubscriber:shareToSubscriber
                            });
                        }
                    }
                };
                option = angular.extend({},defaultOption,option);
                return $modal.open(option);
            }

        }
    }])
    .factory('GKFind',['$rootScope',function($rootScope){
        return {
            toogleFind:function(){
                $rootScope.showNearBy = !$rootScope.showNearBy;
                if($rootScope.showNearBy){
                    gkClientInterface.startFind();
                }else{
                    gkClientInterface.stopFind();
                }
            }
        }
    }])
    .factory('GKNews',['localStorageService','GKApi','$filter','GKDialog','GKPath','GKException',function(localStorageService,GKApi,$filter,GKDialog,GKPath,GKException){
        var newsKey = 'gknews_'+gkClientInterface.getUser()['member_id'];
        var GKNews = {
            getOptsByItem:function(item){
                var opts = [];
                switch(item.act){
                    case 'file':
                        opts.push({
                            classes:'btn-primary',
                            text:'查看',
                            click:function(item){
                                var orgId = item.org_id,
                                    mountId = item.mount_id,
                                    fullpath = item.fullpath;
                                GKPath.gotoFile(mountId,fullpath);
                            }
                        });
                        break;
                    case 'invite':
                        opts.push({
                            classes:'btn-default',
                            text:'接收',
                            click:function(item){
                                var orgId = item.orgId;
                                var code = item.code;
                                GKApi.teamInviteJoin(orgId,code).success(function(){

                                }).error(function(request){
                                        GKException.handleAjaxException(request);
                                    });
                            }
                        });
                        opts.push({
                            classes:'btn-danger',
                            text:'拒绝',
                            click:function(item){
                                GKApi.teamInviteReject(orgId,code).success(function(){

                                }).error(function(request){
                                        GKException.handleAjaxException(request);
                                    });
                            }
                        });
                    case 'accepted':
                        opts.push({
                            classes:'btn-primary',
                            text:'查看',
                            click:function(item){
                                GKDialog.openTeamMember();
                            }
                        });
                    case 'join_success':
                        opts.push({
                            classes:'btn-primary',
                            text:'查看',
                            click:function(item){
                                var orgId = item.org_id,
                                    mountId = item.mount_id,
                                    fullpath = '';
                                GKPath.gotoFile(mountId,fullpath);
                            }
                        });
                    case 'new_device':
                        opts.push({
                            classes:'btn-primary',
                            text:'查看',
                            click:function(item){
                                GKDialog.openSetting('device');
                            }
                        });
                    case 'product':
                        opts.push({
                            classes:'btn-primary',
                            text:'查看',
                            click:function(item){
                               var url = item.url;
                                url = gkClientInterface.getUrl({
                                    url:url,
                                    sso:1
                                });
                                gkClientInterface.openUrl();
                            }
                        });
                        break;
                }
            },
            classify:function(news){
                var classifyNews = [],
                    context = this;
                    ;
                var now = new Date().valueOf();
                var today = $filter('date')(now,'yyyy-MM-dd');
                var yesterdayTimestamp = now-24*3600*1000;
                var yesterday = $filter('date')(yesterdayTimestamp,'yyyy-MM-dd');
                angular.forEach(news,function(value){
                    var date = value.date;
                    //value.opts = context.getOptsByItem(value);
                    var dateText = $filter('date')(value.dateline*1000,'yyyy年M月d日');
                    if(date == today){
                        dateText = '今天，'+$filter('date')(now,'yyyy年M月d日');
                    }else if(date == yesterday){
                        dateText = '昨天，'+$filter('date')(yesterdayTimestamp,'yyyy年M月d日');;
                    }
                    var existClassifyItem = context.getClassifyItemByDate(date,classifyNews);
                    if(!existClassifyItem){
                        existClassifyItem = {
                            date:date,
                            date_text:dateText,
                            list:[value]
                        }
                        classifyNews.push(existClassifyItem);
                    }else{
                        existClassifyItem['list'].push(value);
                    }
                });
                return classifyNews;
            },
            getClassifyItemByDate:function(date,classifyNews){
                if(!classifyNews || !classifyNews.length){
                    return null;
                }
                for(var i=0;i<classifyNews.length;i++){
                    var value = classifyNews[i];
                    if(value['date'] == date){
                        return value;
                        break;
                    }
                }
                return null;
            },
            requestNews:function(dateline){
                var context = this;
                var dateline = 0;
                var oldNews = this.getNews();
                if(oldNews && oldNews.length){
                    dateline = oldNews[0]['dateline']+1;
                }
                 GKApi.newUpdate(dateline).success(function(data){
                    var news = data['updates'] || [];
                    var dateline = data['dateline'];
                    gkClientInterface.setMessageDate(dateline);
                    context.addNews(news);
                })
            },
            getNews:function(){
                var news = localStorageService.get(newsKey);
                return news;
            },
            concatNews:function(oldClassifyNews,newClassifyNews){
                var context = this;
                if(!newClassifyNews || !newClassifyNews.length){
                    return oldClassifyNews;
                }
                var existItem;
                angular.forEach(newClassifyNews,function(value){
                    existItem = context.getClassifyItemByDate(value['date']);
                    if(existItem){
                        existItem['list'] =  existItem['list'].concat(value['list']);
                    }else{
                        oldClassifyNews.push(value);
                    }

                });
                return oldClassifyNews;
            },
            addNews:function(news){
                if(!news || !news.length){
                    return;
                }
                var oldNews = this.getNews();
                if(!oldNews || !oldNews.length){
                    localStorageService.add(newsKey,JSON.stringify(news));
                }else{
                   var newOldNews = news.concat(oldNews);
                    newOldNews = newOldNews.slice(0,100);
                    localStorageService.add(newsKey,JSON.stringify(newOldNews));
                }
            },
            appendNews:function(data){
                if(!data['list'] || !data['list'].length){
                    if(data['count']>0){
                        this.requestNews()
                    }
                }else{
                    this.addNews(data['list']);
                }
            }
        };
        return GKNews;
    }])
    .factory('GKSmartFolder',['GKFilter',function(GKFilter){
        var smartFolders = [
            {
                name: GKFilter.getFilterName('recent'),
                icon:'icon_clock',
                filter:'recent'
            },
            {
                name: GKFilter.getFilterName('star'),
                icon:'icon_star',
                filter:'star'
            },
            {
                name: GKFilter.getFilterName('moon'),
                icon:'icon_moon',
                filter:'moon'
            },
            {
                name: GKFilter.getFilterName('heart'),
                icon:'icon_heart',
                filter:'heart'
            },
            {
                name: GKFilter.getFilterName('diamond'),
                icon:'icon_diamond',
                filter:'diamond'
            },
            {
                name: GKFilter.getFilterName('triangle'),
                icon:'icon_triangle',
                filter:'triangle'
            },
            {
                name: GKFilter.getFilterName('flower'),
                icon:'icon_flower',
                filter:'flower'
            }
        ];
        var GKSmartFolder = {
            getFolders:function(exclue){
                if(exclue){
                  if(!angular.isArray(exclue)) exclue = [exclue];
                  angular.forEach(exclue,function(value){
                    angular.forEach(smartFolders,function(smart,key){
                        if(smart.filter == value){
                            smartFolders.splice(key,1);
                            return false
                        }
                    })
                  });
                }
                return smartFolders;
            },
            getFolderByCode:function(code){
                var value,smartFolder=null;
                for(var i=0;i<smartFolders.length;i++){
                    value = smartFolders[i];
                    if(value.condition == code){
                        smartFolder = value
                    }
                }
                return smartFolder
            },
            removeSmartFolderByCode:function(code){
               angular.forEach(smartFolders,function(value,key){
                   if(code == value.code){
                       smartFolders.splice(key,1);
                   }
               });
            },
            addSmartFolder:function(name,code){
                smartFolders.push({
                    name:name,
                    condition:code,
                    filter:'search'
                });
            },
        };
        return GKSmartFolder;
    }])
    .factory('GKFilter', [function () {
        var GKFilter =  {
            trash:'trash',
            inbox:'inbox',
            star:'star',
            recent:'recent',
            triangle:'triangle',
            diamond:'diamond',
            flower:'flower',
            moon:'moon',
            heart:'heart',
            search:'search',
            getFilterName:function(filter){
                var filterName = '';
                switch(filter){
                    case this.trash:
                        filterName = '回收站';
                        break;
                    case this.inbox:
                        filterName = '我接收的文件';
                        break;
                    case this.star:
                        filterName = '星形';
                        break;
                    case this.recent:
                        filterName = '最近修改的文件';
                        break;
                    case this.triangle:
                        filterName = '三角形';
                        break;
                    case this.diamond:
                        filterName = '钻石';
                        break;
                    case this.flower:
                        filterName = '幸运草';
                        break;
                    case this.heart:
                        filterName = '爱心';
                        break;
                    case this.moon:
                        filterName = '月亮';
                        break;
                    case this.search:
                        filterName = '搜索结果';
                        break;
                }
                return filterName;
            },
            getFilterType:function(filter){
                var filterType = '';
                switch(filter){
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
            getFilterTip:function(filter){
                var tip = '';
                switch(filter){
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
            isTrash:function(filter){
                return filter == this.trash;
            },
            isInbox:function(filter){
                return filter == this.inbox;
            },
            isRecent:function(filter){
                return filter == this.recent;
            },
            isSearch:function(filter){
                return filter == this.search;
            },
            isStar:function(filter){
                return filter == this.star;
            }

        }

        return GKFilter;
    }])
    .factory('GKPath', ['$location','GKMount','GKSmartFolder','GKFilter','GKPartition',function ($location,GKMount,GKSmartFolder,GKFilter,GKPartition) {
        var GKPath =  {
            gotoFile:function(mountId,path,selectFile){
                selectFile = angular.isDefined(selectFile)?selectFile:'';
                var mount = GKMount.getMountById(mountId);
                var search = {
                    partition:mount['org_id']==0?GKPartition.myFile:GKPartition.teamFile,
                    mountid:mountId,
                    path:path,
                    view:$location.search().view,
                    selectedpath:selectFile
                };
                if(mount){
                    $location.search(search);
                }
            },

            getPath: function () {
                var paramArr = Array.prototype.slice.call(arguments);
                var params = {
                    partition:paramArr[0],
                    path: paramArr[1]|'',
                    view: paramArr[2],
                    mountid:paramArr[3] || 0,
                    filter:paramArr[4] || '',
                    keyword:paramArr[5] || '',
                };
                return '/file?' + jQuery.param(params);
            },
            getBread:function(){
                var path = $location.search().path || '';
                var partition =  $location.search().partition || GKPartition.myFile;
                var view =  $location.search().view || 'list';
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
                        bread.url = '#' + this.getPath(partition, bread.path, view,mountId,filter);
                        breads.push(bread);
                    }
                }

                /**
                 * 搜索不需要bread
                 */
                if(filter && filter !='search'){
                    breads.unshift({
                        name: GKFilter.getFilterName(filter),
                        url: '#' + this.getPath(partition, '',view,mountId,filter),
                        filter:filter,
                        icon:filter!='trash'?'icon_'+filter:''
                    });
                }
                /**
                 * 智能文件夹
                 */
                if(filter =='search' && partition =='smartfolder'){
                    var item = {
                        name:  GKSmartFolder.getFolderByCode(keyword)['name'] ,
                        url: '#' + this.getPath(partition, '',view,mountId,filter,keyword),
                        filter:filter,
                        icon:'icon_'+partition
                    };
                    breads.unshift(item);
                }

                if (mountId) {
                    var mount = GKMount.getMountById(mountId);
                    var item = {
                        name: mount['name'],
                        filter:'',
                        url: '#' + this.getPath(partition, '', view,mountId,filter)
                    }

                    if(mount.org_id==0){
                        item.icon = 'icon_myfolder';
                    }else{
                        item.logo = mount['logo'];
                    }
                    breads.unshift(item);
                }
                return breads;
            }
        }

        return GKPath;
    }])
/**
 * 对请求后返回的错误的处理
 */
    .factory('GKException', [function () {
        var GKException = {
            getAjaxErrorMsg:function(request){
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
                            errorMsg ='网络连接超时';
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
            getAjaxErroCode:function(request){
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
            handleAjaxException:function(request){
                var errorMsg = this.getAjaxErrorMsg(request);
                alert(errorMsg);
            }
        };

        return GKException;
    }])
    .factory('GK', ['$q', function ($q) {
        return {
            recover:function(params){
                var deferred = $q.defer();
                gkClientInterface.recover(params,function(re){
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
                gkClientInterface.addFile(params,function(re){
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
                gkClientInterface.createFolder(params,function(re){
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
                gkClientInterface.toggleLock(params,function(re){
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
                gkClientInterface.lock(params,function(re){
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
                var re = gkClientInterface.del(params,function(re){
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
                var re = gkClientInterface.rename(params,function(re){
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
                var re = gkClientInterface.copy(params,function(re){
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
                 gkClientInterface.move(params,function(re){
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
                gkClientInterface.removeLinkPath(params,function(re){
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
    .constant('GKPartition', {
        myFile:'myfile',
        teamFile:'teamfile',
        smartFolder:'smartfolder',
        subscribeFile:'subscribefile'
    })
    .factory('GKFile', ['FILE_SORTS','GKPartition', function (FILE_SORTS,GKPartition) {
        var GKFile = {
            /**
             * 获取单文件信息
             */
            getFileInfo:function(mountId,fullpath){
                var file =  gkClientInterface.getFileInfo({
                    mountid:mountId,
                    webpath:fullpath
                });
                if(!file.path){
                    file.path = '';
                }
                var formatedFile = this.formatFileItem(file,'client');
                   angular.extend(formatedFile,{
                       mount_id:mountId
                   });

                return formatedFile;
            },
            getFileList:function(mountId,fullpath,dir){
                dir = angular.isDefined(dir)?dir:0;
                var list = gkClientInterface.getFileList({webpath: fullpath, dir: dir, mountid: mountId})['list'];
                var formatedList = this.dealFileList(list,'client');
                return formatedList;
            },
            /**
             * 是否已同步
             * @param parentFile
             * @param file
             * @returns {boolean}
             */
            isSynced:function(parentFile,file){
                 if(!parentFile){
                     return false;
                 }
                if(parentFile.syncpath){
                    return true;
                }
                if(file && file.sync==1){
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
            isSyncable:function(parentFile,file){
                /**
                 * 根目录不允许同步
                 */
                if(!file.fullpath){
                    return false;
                }
                /**
                 * 未同步的允许进行同步、不同步 操作
                 */
                if(!this.isSynced(parentFile,file)){
                    return true;
                }
                /**
                 * 同步的目录 就是当前操作目录
                 */
                if(parentFile.syncpath === file.fullpath || file.sync==1){
                    return true;
                }
                return false;
            },
            dealTreeData: function (data, type, mountId) {
                var newData = [],
                    item,
                    label,
                    context = this;
                angular.forEach(data, function (value) {
                     angular.extend(value,{
                         partition:type
                     });
                    if(type==GKPartition.myFile || type==GKPartition.teamFile || type==GKPartition.subscribeFile){
                        if (!value.fullpath) {
                            label = value.name;

                        } else {
                            label = value.filename;
                            mountId && angular.extend(value, {
                                mount_id: mountId
                            });
                        }
                        var dropAble = false;
                        if(type==GKPartition.myFile || type==GKPartition.teamFile){
                            dropAble = true;
                        }

                        item = {
                            dropAble: dropAble,
                            label: label,
                            isParent: true,
                            data: value
                        };
                        if(type==GKPartition.teamFile || type==GKPartition.subscribeFile){
                            item.nodeImg = value.logo;
                        }
                    }else{
                        if(!value.filter){
                            value.filter =  'search';
                        }
                        item = {
                            label: value.name,
                            isParent: false,
                            data: value,
                            iconNodeExpand:value.icon,
                            iconNodeCollapse:value.icon
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
                        filesize: parseInt(value.filesize),
                        ext: ext,
                        last_edit_time: parseInt(value.last_dateline),
                        fullpath: Util.String.rtrim(value.fullpath, '/'),
                        lock: value.lock || 0,
                        lock_member_name: value.lock_member_name || '',
                        lock_member_id: value.lock_member_id || 0,
                        dir: value.dir,
                        last_member_name: value.last_member_name || '',
                        creator_member_name: value.create_member_name || '',
                        creator_member_id: value.create_member_id || '',
                        cmd:value.cmd,
                        favorite:value.favorite,
                        filehash:value.filehash,
                        hash:value.hash
                    };
                } else {
                    var fileName = Util.String.baseName(value.path);
                    var ext = value.dir == 1 ? '' : Util.String.getExt(fileName);
                    file = {
                        mount_id: value.mount_id || 0,
                        filename: fileName,
                        filesize: parseInt(value.filesize),
                        ext: ext,
                        last_edit_time: parseInt(value.lasttime),
                        fullpath: value.path,
                        lock: value.lock,
                        lock_member_name: value.lockname,
                        lock_member_id: value.lockid,
                        dir: value.dir,
                        last_member_name: value.lastname,
                        creator_member_name: value.creatorname,
                        creator_member_id: value.creatorid,
                        status: value.status,
                        sync:value.sync,
                        cmd:1,
                        sharepath:value.sharepath||'',
                        syncpath:value.syncpath||'',
                        share:value.share,
                        auth:value.auth,
                        cache:value.have,
                        filehash:value.filehash,
                        hash:value.uuidhash
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
            getFileIconSuffix: function (filename, dir, share,sync) {
                var suffix = '';
                var sorts = FILE_SORTS;
                if (dir==1) {
                    suffix = 'folder';
                    if(sync==1){
                        suffix = 'sync_'+suffix;
                    }
                    if (share > 0) {
                        suffix = 'shared_' + suffix;
                    }
                } else {
                    var ext = Util.String.getExt(filename);
                    if(jQuery.inArray(ext, sorts['SORT_SPEC']) > -1){
                        suffix = ext;
                    }else if (jQuery.inArray(ext, sorts['SORT_MOVIE']) > -1) {
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
            isEmpty:function(){
                return !this.data;
            }
        };
        return GKClipboard
    }])
    .factory('GKOpt', ['GKCilpboard','GKFile','GKPartition','GKMount',function (GKCilpboard,GKFile,GKPartition,GKMount) {
        var GKOpt = {
            /**
             * 同步，不同步命令的逻辑
             * @param opts
             * @param parentFile 夫目录
             * @param file 设置的目录
             */
            setSyncOpt:function(opts,parentFile,file){
                this.disableOpt(opts,'unsync');
                if(!GKFile.isSyncable(parentFile,file)){
                    this.disableOpt(opts,'sync','unsync');
                }else{
                    if(GKFile.isSynced(parentFile,file)){
                        this.disableOpt(opts,'sync');
                    }else{
                        this.disableOpt(opts,'unsync');
                    }
                }
            },
            getOpts: function (currentFile, selectedFiles, partition, filter,mount) {
                var opts,
                    partitionOpts,
                    multiOpts,
                    singleOpts,
                    currentOpts,
                    authOpts;

                partitionOpts =  this.getPartitionOpts(partition,filter,mount);
                authOpts = this.getAuthOpts(currentFile,selectedFiles,partition,mount);
                if(!selectedFiles || !selectedFiles.length){
                    currentOpts =  this.getCurrentOpts(currentFile,partition);
                    opts =  this.getFinalOpts(partitionOpts, currentOpts, authOpts);
                }else{
                        multiOpts = this.getMultiSelectOpts(selectedFiles);
                        singleOpts = this.getSelectOpts(currentFile,selectedFiles);
                       opts =  this.getFinalOpts(partitionOpts, multiOpts, singleOpts,authOpts);
               }
                return opts;
            },
            /**
             * 所有默认操作
             * */
            getDefaultOpts:function(){
               return [
                   'goto', //打开位置
                   //'nearby', //附近
                   'unsubscribe', //取消订阅
                   'new_folder', //新建
                   'create', //创建
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
                   'order_by' //排序
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
                        if(optsArr[j].indexOf(value) < 0 && index>=0){
                            opts.splice(index, 1);
                        }
                    }
                }

                return opts;
            },
            /**
             * 获取分区的命令
             * */
            getPartitionOpts:function(partition,filter,mount){
                var opts = this.getDefaultOpts();
                switch (partition){
                    case GKPartition.myFile:
                    case GKPartition.teamFile:
                        this.disableOpt(opts,'nearby','unsubscribe');
                        if(filter =='trash'){
                            this.disableOpt(opts,"add","new_folder","sync","unsync","paste", "rename", "save","del","cut", "copy", "lock", "unlock","order_by",'manage','create');
                        }else{
                            this.disableOpt(opts,"clear_trash","revert","del_completely");
                            if(partition == GKPartition.myFile){
                                this.disableOpt(opts,"manage","create",'lock','unlock');
                            }
                        }
                        if(GKCilpboard.isEmpty()){
                            this.disableOpt(opts,'paste');
                        }
                        this.disableOpt(opts,'goto');

                        break;
                    case GKPartition.subscribeFile:
                        this.disableOpt(opts,'goto',"new_folder","manage","create",'add','clear_trash','sync','unsync','rename','del','paste','cut','lock','unlock','del_completely','revert');
                        break;
                    case (GKPartition.smartFolder || filter =='search'):
                        this.disableOpt(opts,'revert','del_completely','del','rename','nearby','unsubscribe','create','add','clear_trash','manage','new_folder','sync','unsync','paste','copy','cut');
                        if(partition == GKPartition.smartFolder){
                            this.disableOpt(opts,'del','rename');
                        }
                        break;
                }
                if(filter == 'search'){
                    this.disableOpt(opts,'new_folder','add','create','paste','manage');
                }
                return opts;
            },
            /**
             * 获取权限的命令
             * */
            getAuthOpts:function(currentFile,files,partition,mount){
                var opts = this.getDefaultOpts();
                if(partition == GKPartition.teamFile){
                    if(!currentFile.fullpath){
                        this.disableOpt(opts,'cut','new_folder','add','paste');
                        if(!GKMount.isAdmin(mount)){
                            this.disableOpt(opts,'manage','create','del','rename');
                        }
                    }else{
                        this.disableOpt(opts,'create','manage');
                    }

                }
                return opts;
            },
            /**
             * 获取当前文件夹的命令
             * */
            getCurrentOpts: function (currentFile,partition) {
                var opts = this.getDefaultOpts();
                this.disableOpt(opts, "goto", "rename", "save", "cut", "copy","lock", "unlock", "del",'revert','del_completely');
                if(GKCilpboard.isEmpty()){
                    this.disableOpt(opts,'paste');
                }
                this.setSyncOpt(opts,currentFile,currentFile);
                /**
                 * 团队文件的跟目录不允许添加
                 */
                if(!currentFile.fullpath && partition==GKPartition.teamFile){
                    this.disableOpt(opts,'add');
                }
                return opts;
            },
            /**
             * 获取多选的命令
             * */
            getMultiSelectOpts: function (files) {
                var opts = this.getDefaultOpts();
                if (files && files.length > 1) {
                    this.disableOpt(opts,"goto","save","sync","unsync", "rename" ,"lock", "unlock");
                }
                return opts;
            },
            /**
             * 获取选中的命令
             * */
            getSelectOpts: function (currentFile,files) {
                var opts = this.getDefaultOpts();
                var context = this;
                angular.forEach(files,function(file){
                    context.disableOpt(opts,"add","new_folder","order_by",'clear_trash','create','manage','nearby','unsubscribe');
                    if (file.dir == 1) {
                        context.disableOpt(opts, 'lock', 'unlock');
                        context.setSyncOpt(opts,currentFile,file);
                    } else {
                        context.disableOpt(opts, 'sync','unsync');
                        if (file.lock == 1) {
                            context.disableOpt(opts, 'lock');
                        } else {
                            context.disableOpt(opts, 'unlock');
                        }
                    }
                    if(file.auth<1){
                        context.disableOpt(opts, 'del','rename');
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
            }
        };
        return GKOpt
    }])
    .factory('RestFile', ['GK', '$http', function (GK, $http) {
        var restFile = {
            orgShare : function(mount_id,fullpath,collaboration){
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
                    data:{
                        collaboration:collaboration
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
                return $http({
                    method: method,
                    url: GK.getRestHost() + webpath,
                    headers: {
                        'x-gk-mount': mount_id,
                        'x-gk-bool': 1,
                        'Date': date,
                        'Authorization': authorization,
                        'Content-Type': "application/x-www-form-urlencoded"
                    },
                    data: jQuery.param({
                        message: message
                    })
                })
            },
            recycle:function(mount_id, fullpath,order,start,size){
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
                if(angular.isDefined(order)){
                    headers['x-gk-order'] = order;
                }
                if(angular.isDefined(start)){
                    headers['x-gk-start'] = start;
                }
                if(angular.isDefined(size)){
                    headers['x-gk-size'] = size;
                }
                return jQuery.ajax({
                    type: method,
                    url: GK.getRestHost() + webpath,
                    headers: headers
                })
            },
            clear:function(mount_id){
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
                    url:GK.getRestHost() + webpath,
                    dataType:'text',
                    type:method,
                    headers:headers
                });
//                return $http({
//                    method: method,
//                    url: GK.getRestHost() + webpath,
//                    headers: headers,
//                    responseType:'text'
//                })
            },
            delCompletely:function(mount_id,fullpaths){
                var date = new Date().toUTCString();
                var method = 'DELETECOMPLETELY';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                if(angular.isArray(fullpaths)){
                    fullpaths = fullpaths.join('|');
                }
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'x-gk-fullpaths':encodeURIComponent(fullpaths),
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded"
                };

                return $http({
                    method: method,
                    url: GK.getRestHost() + webpath,
                    headers: headers
                })
            },
            recover:function(mount_id,fullpaths,machine){
                var date = new Date().toUTCString();
                var method = 'RECOVER';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                if(angular.isArray(fullpaths)){
                    fullpaths = fullpaths.join('|');
                }
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'x-gk-machine':machine,
                    'x-gk-fullpaths':encodeURIComponent(fullpaths),
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded"
                };
                return jQuery.ajax({
                    url:GK.getRestHost() + webpath,
                    dataType:'text',
                    type:method,
                    headers:headers
                });
//                return $http({
//                    method: method,
//                    url: GK.getRestHost() + webpath,
//                    headers: headers
//                })
            }
        };

        return restFile;
    }
    ])
    .factory('GKApi', ['GK', '$http', function (GK, $http) {
        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
        var defaultParams = {};
        var GKApi = {
            addToFav: function (mountId, fullpath,type) {
                var params = {
                    mount_id:mountId,
                    fullpath:fullpath,
                    favorite_type:type,
                    token: GK.getToken()
                };
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost()+'/1/file/favorites_add',
                    dataType:'json',
                    data:params
                })
            },
            removeFromFav: function (mountId, fullpath,type) {
                var params = {
                    mount_id:mountId,
                    fullpath:fullpath,
                    favorite_type:type,
                    token: GK.getToken()
                };
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost()+'/1/file/favorites_delete',
                    dataType:'json',
                    data:params
                })
            },
            delCollaboration:function(mountId,fullpath,collaboration){
                var params = {
                    mount_id:mountId,
                    fullpath:fullpath,
                    collaboration:collaboration,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    dataType:'json',
                    url: GK.getApiHost() + '/1/file/delete_collaboration',
                    data:params
                });
            },
            userInfo:function(){
                var params = {
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost() + '/1/account/info',
                    data:params
                });
            },
            regist:function(name,email,password,user_license_check){
                var params = {
                    name: name,
                    email:email,
                    password:password,
                    user_license_chk:user_license_check,
                    disable_next_login:1,
                    token: GK.getToken()
                };
                return jQuery.ajax({
                    type: 'POST',
                    dataType:'json',
                    url: gkClientInterface.getSiteDomain() + '/account/regist_submit',
                    data:jQuery.param(params)
                });
            },
            getSmartFolder:function(code){
                var params = {
                    code: code,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    method: 'GET',
                    url: GK.getApiHost() + '/1/file/search_condition',
                    data:params
                });
            },
            removeSmartFolder:function(code){
                var params = {
                    code: code,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/file/remove_search',
                    data:params
                })
            },
            updateSmartFolder: function (code, name, condition, description) {
                var params = {
                    code: code,
                    name: name,
                    condition: condition,
                    description: description||'',
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/file/edit_search',
                    data:params
                })
            },
            createSmartFolder: function (mount_id, name, condition, description) {
                var params = {
                    mount_id: mount_id,
                    name: name,
                    condition: condition,
                    description: description||'',
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/file/save_search',
                    data:params
                })
            },
            searchFile: function (condition, mount_id) {
                var params = {
                    mount_id: mount_id,
                    condition: condition,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/file/search',
                    data: params
                });
            },
            smartFolderList:function(code){
                var params = {
                    code: code,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/file/search',
                    data: params
                });
            },
            starFileList:function(type){
                var params = {
                    favorite_type:type,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost() + '/1/file/favorites',
                    data: params
                });
            },
            recentFileList:function(){
                var params = {
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost() + '/1/file/recent_modified',
                    data: params
                });
            },
            inboxFileList:function(){
                var params = {
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost() + '/1/file/inbox',
                    data: params
                });
            },
            sideBar: function (mount_id, fullpath, type,cache, start, date) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    type: type || '',
                    start: start || '',
                    date: date || '',
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    cache:cache||true,
                    type: 'GET',
                    dataType:'json',
                    url: GK.getApiHost() + '/1/file/client_sidebar',
                    data: params
                });
            },
            setTag: function (mount_id, fullpath, keyword) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    keywords: keyword,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/file/keyword',
                    data: params,
                    dataType:'text'
                });
            },
            update: function (size,dateline) {
                size = angular.isDefined(size)?size:100;
                var params = {
                    size:size,
                    token: GK.getToken()
                };
                if(angular.isDefined(dateline)){
                    params['dateline'] = dateline;
                }
               angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/updates/ls',
                    data: params
                });
            },
           newUpdate: function (dateline) {
                var params = {
                    dateline:dateline||0,
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost() + '/1/updates/ls_newer',
                    data: params
                });
            },
            updateAct: function (id,opt) {
                var params = {
                    id:id,
                    opt:opt,
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost() + '/1/updates/do_action',
                    data: params
                });
            },
            teamInvitePending: function () {
                var params = {
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost() + '/1/team/invite_pending',
                    data:params
                });
            },
            teamManage: function (data) {
                var params = {
                    org_id: data,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost()+'/1/updates/',
                    data:params
                });
            },
            teamQuit: function (org_id) {
                var params = {
                    org_id: org_id,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/team/quit',
                    data:params
                });
            },
            teamInviteReject: function (orgId, code) {
                var params = {
                    org_id: orgId,
                    code: code,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/team/invite_reject',
                    data:params
                });
            },
            teamInviteJoin: function (orgId, code) {
                var params = {
                    org_id: orgId,
                    code: code,
                    token: GK.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/team/invite_accept',
                    data:params
                });
            },
            teamGroupsMembers:function(orgId){
                var params = {
                    org_id:orgId,
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost()+'/1/team/groups_and_members',
                    data:params
                });
            },
            groupMember:function(data){
                var params = {
                    org_id:data,
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost()+'/1/team/group_member',
                    data:params
                });
            },
            teamsearch:function(org_id,keyword){
                var params = {
                    org_id:org_id,
                    key:keyword,
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: GK.getApiHost()+'/1/team/search',
                    data:params

                });
            },
            /**
             * 获取设备列表
             * @returns {*}
             */
            devicelist:function(){
                var params = {
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost()+'/1/account/device_list',
                    data:params

                });
            },
            /**
             * 启用禁止设备
             * @returns {*}
             */
            toggleDevice:function(device_id,state){
                var params = {
                    state:state,
                    device_id:device_id,
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost()+'/1/account/toggle_device',
                    data:params
                });
            },
            /**
             * 删除设备
             * @returns {*}
             */
            delDevice:function(device_id){
                var params = {
                    device_id:device_id,
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost()+'/1/account/del_device',
                    data:params
                });
            },
            disableNewDevice:function(state){
                var params = {
                    state:state,
                    token: GK.getToken()
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost()+'/1/account/disable_new_device',
                    data:params
                });
            }
        }
        return GKApi;
    }])
    .factory('GKMount', [function () {
        /**
         * 格式化mount数据
         * @param mount
         */
        var formatMountItem = function(mount){
            var newMount = {
                mount_id: mount.mountid,
                name: mount.name ? mount.name : '我的文件',
                org_id: mount.orgid,
                capacity: mount.total,
                size: mount.use,
                org_capacity: mount.orgtotal,
                org_size: mount.orguse,
                type: mount.type,
                fullpath: '',
                logo:mount.orgphoto,
                member_count:mount.membercount,
                subscriber_count:mount.subscribecount
            };
            return newMount;
        };

        var mounts = [];
        var gkMounts = gkClientInterface.getSideTreeList({sidetype: 'org'})['list'],
            mountItem;
        angular.forEach(gkMounts,function(value){
            mountItem = formatMountItem(value);
            mounts.push(mountItem);
        });
       var GKMount = {
           isAdmin:function(mount){
               return mount.type < 2;
           },
           formatMountItem:formatMountItem,
           /**
            * 获取所有的mount
            * @returns {Array}
            */
           getMounts:function(){
               return mounts;
           },
           /**
            * 根据id获取mount
            * @param id
            * @returns {null}
            */
           getMountById:function(id){
               var mount = null;
                angular.forEach(mounts,function(value){
                    if(value.mount_id == id){
                        mount = value;
                        return false;
                    }
                })
               return mount;
           },
           checkMountExsit:function(id){
               return !!this.getMountById(id);
           },
           /**
            * 根据团队id获取mount
            * @param orgId
            * @returns {null}
            */
           getMountByOrgId:function(orgId){
               var mount = null;
               angular.forEach(mounts,function(value){
                   if(value.org_id == orgId){
                       mount = value;
                       return false;
                   }
               })
               return mount;
           },
           /**
            * 获取个人的mount
            * @returns {null}
            */
           getMyMount:function(){
               var myMount = null;
               angular.forEach(mounts,function(value){
                   if(value.org_id == 0){
                       myMount = value;
                       return false;
                   }
               })
               return myMount;
           },
           /**
            * 获取团队的mount
            * @returns {Array}
            */
           getOrgMounts:function(){
               var orgMounts = [];
               angular.forEach(mounts,function(value){
                   if(value.org_id != 0 && value.type!=3){
                       orgMounts.push(value);
                   }
               })
               return orgMounts;
           },
           getSubscribeMounts:function(){
               var subscribeMounts = [];
               angular.forEach(mounts,function(value){
                   if(value.org_id != 0 && value.type==3){
                       subscribeMounts.push(value);
                   }
               })
               return subscribeMounts;
           },
           addMount:function(newMount,$scope){
               var mountItem = formatMountItem(newMount);
               mounts.push(mountItem);
               return mountItem;
           },
           removeMountByOrgId:function(orgId){
               var mount = this.getMountByOrgId(orgId);
               if(mount){
                   Util.Array.removeByValue(mounts,mount);
               }
               return mount;
           },
           removeOrgSubscribeList:function($scope,orgId){
               var mount = this.removeMountByOrgId(orgId);
               if(!mount) return;
               angular.forEach($scope.orgSubscribeList, function (value, key) {
                   if (value.data.org_id == orgId) {
                       $scope.orgSubscribeList.splice(key, 1);
                       return false;
                   }
               });

           },
           removeTeamList:function($scope,orgId){
               var mount = this.removeMountByOrgId(orgId);
               if(!mount) return;
               angular.forEach($scope.orgTreeList, function (value, key) {
                   if (value.data.org_id == orgId) {
                       $scope.orgTreeList.splice(key, 1);
                       return false;
                   }
               });

           }
       };

      return GKMount;

    }
    ])
    .factory('GKFileList', [function () {
        var selectedFile = [];
        var selectedIndex = [];
        var selectedPath = '';
        var GKFileList = {
            select:function($scope,index,multiSelect){
                multiSelect = !angular.isDefined(multiSelect) ? false : multiSelect;
                if (!multiSelect && selectedFile && selectedFile.length) {
                    this.unSelectAll($scope);
                }
                $scope.fileData[index].selected = true;
                if(selectedIndex.indexOf(index)<0){
                    selectedFile.push($scope.fileData[index]);
                    selectedIndex.push(index);
                    $scope.selectedFile = selectedFile;
                }
            },
            unSelect:function($scope,index){
                if($scope.fileData[index]){
                    $scope.fileData[index].selected = false;
                }

                var i = selectedIndex.indexOf(index);
                if (i >= 0) {
                    selectedIndex.splice(i, 1);
                    selectedFile.splice(i, 1);
                    $scope.selectedFile = selectedFile;
                }
            },
            unSelectAll:function($scope){
                for (var i = selectedIndex.length - 1; i >= 0; i--) {
                    this.unSelect($scope,selectedIndex[i]);
                }
            },
            selectByPath:function($scope,path){
                var context = this;
                angular.forEach($scope.fileData, function (value, index) {
                    if (value.fullpath === path) {
                        context.select($scope,index, true);
                    }
                });
            },
            reIndex:function(fileData){
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
            },
            getSelectedIndex:function(){
              return selectedIndex;
            },
            getSelectedFile:function(){
                return selectedFile;
            },
            getOptFileMountId:function($scope,$rootScope){
                var mountID;
                if($scope.selectedFile.length>1){
                    mountID = $rootScope.PAGE_CONFIG.mount.mount_id;
                }else{
                    mountID = $scope.selectedFile[0]['mount_id'] || $rootScope.PAGE_CONFIG.mount.mount_id
                }
                return Number(mountID);
            },
            remove:function($scope,value){
                angular.forEach($scope.fileData, function (file, key) {
                    if (value == file) {
                        $scope.fileData.splice(key, 1);
                    }
                })
            },
            removeAllSelectFile:function($scope){
                var context = this;
                angular.forEach($scope.selectedFile, function (value) {
                    context.remove($scope,value);
                });
                $scope.selectedFile = [];
                $scope.selectedIndex = [];
            },
            getDefualtNewName:function($scope){
                var preName = '新建文件夹';
                var count = 0;
                do{
                  var exist = false;
                  var defaultFileName =preName + (!count?'':'('+count+')');
                  angular.forEach($scope.fileData,function(value){
                      if(String(value.filename) === defaultFileName){
                          exist = true;
                          return false;
                      }
                  });
                  count++;
                }while(exist);
                return defaultFileName;
            }
        };
        return GKFileList;
    }])
/**
 * 客户端的回调函数
 */
    .factory('GKSearch', [function () {
        var searchState = '',
            searchCondition = '',
            keyword ='',
            JSONCondition;
        return {
            checkExist:function(field){
                if(!JSONCondition || !JSONCondition['include'] || !JSONCondition['include'][field]){
                    return false;
                }
                return true;
            },
            getKeyWord:function(){
                if(!this.checkExist('keywords')){
                    return '';
                }
                return JSONCondition['include']['keywords'][1] || '';
            },
            setSearchState:function(state){
                searchState = state;
            },
            getSearchState:function(){
                return searchState;
            },
            setCondition:function(condition){
                searchCondition = condition;
                JSONCondition = JSON.parse(searchCondition);
            },
            getConditionField:function(field){
                if(!this.checkExist(field)){
                    return null;
                }
                var value = JSONCondition['include'][field];
                var reValue;
                if(value[0] == 'in'){
                    reValue =  JSONCondition['include'][field][1];
                }else if(value[0] == 'lt'){
                    reValue = [0,dateline[1]];
                }
                else if(value[0] == 'gt'){
                    reValue = [value[1],0];
                }else if(value[0] == 'eq'){
                    reValue = value[1];
                }else{
                    reValue = value[1];
                }
                return reValue;
            },
            getCondition:function(){
                return searchCondition;
            },
            reset:function(){
                searchState = '';
                searchCondition = '';
                keyword = '';
            }
        }
    }])
/**
 * 记录浏览历史，提供前进,后退功能
 */
    .factory('GKHistory', ['$q', '$location', '$rootScope', function ($q, $location, $rootScope) {
        return new GKHistory($q, $location, $rootScope);
    }])
    .factory('GKDialog', [function () {
        return {
            openTeamMember:function(){

            },
            /**
             * 打开设置框
             */
            openSetting:function(tab){
                tab = angular.isDefined(tab)?tab:'';
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///'+UIPath+'/setting.html#/?tab='+tab;
                var data = {
                    url:url,
                    type:"sole",
                    width:794,
                    resize:1,
                    height:490
                }
                gkClientInterface.setMain(data);
            },
            /**
             * 打开传输列表
             */
            openTransfer:function(){
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///'+UIPath+'/transfer.html';
                var data = {
                    url:url,
                    type:"sole",
                    width:794,
                    height:490,
                    resize:1
                }
                gkClientInterface.setMain(data);
            }
        }
    }
    ])
    .factory('GKQueue', ['$rootScope','$interval',function ($rootScope,$interval) {
        return {
            getQueueList:function($scope,type){
                $rootScope.downloadSpeed = 0;
                $rootScope.uploadSpeed = 0;
                var getFileList = function(){
                    var re = gkClientInterface.getTransList({type:type});
                    $scope.fileList = re['list'];
                    $rootScope.downloadSpeed = re['download'];
                    $rootScope.uploadSpeed = re['upload'];
                }
                getFileList();
                $interval(function(){
                    getFileList();
                },1000);
            }
        }
    }
    ])
;


/**
 * 客户端的回调
 * @param name
 * @param params
 */
var gkClientCallback = function(name,param){
    if(typeof name !=='string'){
        name = String(name);
    }
    var rootScope = jQuery(document).scope();
    var JSONparam;
    if(param){
        JSONparam = JSON.parse(param);
    }
    rootScope.$broadcast(name,JSONparam);
};

/**
 * 网站的回调
 * @param name
 * @param params
 */
var gkSiteCallback = function(name,params){
     console.log(arguments);
    if(typeof name !=='string'){
        name = String(name);
    }
    var rootScope = jQuery(document).scope();
    rootScope.$broadcast(name,params);
};

/**
 * 搜索
 * @constructor
 */
function GKFileSearch() {
    this.includeCondition = {};
    this.iexcludeCondition={};
    this.condition={};
    this.limit={};
    this.order={};
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
    this.includeCondition['dir'] = ['eq',dir];
};
GKFileSearch.prototype.conditionIncludeMountId = function (mountId) {
    this.includeCondition['mount_id'] = ['eq',mountId];
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

    $rootScope.$on('$routeChangeSuccess', function ($s, $current) {
        var params = $current.params;
        if (!jQuery.isEmptyObject(params)) {
            var l = history.length,
                cwd = params;
            if (update) {
                current >= 0 && l > current + 1 && history.splice(current + 1);
                history[history.length - 1] != cwd && history.push(cwd);
                current = history.length - 1;
            }
            update = true;
        };
    });

    reset();
}

