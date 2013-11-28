var gkClientInterface = {

    /**
     * 处理异常
     * @param e
     */
    _handleException: function (e) {
        throw new Error(e.name + ":" + e.message);
    },
    setFilePublic:function(params,callback){
        try {
            gkClient.gPublic(JSON.stringify(params),function(re){
                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    renameSmartFolder:function(params,callback){
        try {
            params.condition = String(params.condition);
            gkClient.gRenameMagic(JSON.stringify(params),function(re){
                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    getTransInfo:function(param){
        try {
            //console.log(param);
            var re = gkClient.gGetTransInfo(JSON.stringify(param));
            //console.log(re);
            return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
    },
    getDragFiles:function(){
        try {
            var re = gkClient.gGetDragFiles();
            return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
    },
    recover:function(params,callback){
        try {

            gkClient.gRecover(JSON.stringify(params),function(re){

                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    notice:function(params,callback){
        gkClient.gNotice(JSON.stringify(params),function(re){
            re = typeof re ==='object'?re:JSON.parse(re);
            if(typeof callback === 'function'){
                callback(re);
            }
        });
    },
    getComputePath:function(param){
        var re = gkClient.gGetComputerPath(JSON.stringify(param));
        return re;
    },
    getLanguage:function(){
        var re = gkClient.gGetLanguage();
        return JSON.parse(re);
    },
    getClientInfo:function(){
      var re = gkClient.gGetClientInfo();
        return JSON.parse(re);
    },
    closeWindow:function(){
        gkClient.gClose();
    },
    setDevice:function(params){
        gkClient.gSetDevice(JSON.stringify(params));
    },
    getComputerInfo:function(){
        var re = gkClient.gComputerInfo();
        return JSON.parse(re);
    },
    getSiteDomain:function(){
        return gkClient.gSiteDomain();
    },
    login:function(params){
        try {
            gkClient.gLogin(JSON.stringify(params));
        } catch (e) {
            this._handleException(e);
        }

    },
    logOff:function(){
        try {
            gkClient.gLogoff();
        } catch (e) {
            this._handleException(e);
        }
    },
    quit:function(){
        try {
            gkClient.gQuit();
        } catch (e) {
            this._handleException(e);
        }
    },
    startFind:function(){
        try {
            //console.log('start');
            gkClient.gStartFind();
        } catch (e) {
            this._handleException(e);
        }
    },
    stopFind:function(){
        try {
            //console.log('stop');
            gkClient.gStopFind();
        } catch (e) {
            this._handleException(e);
        }
    },
    /**
     * 打开lanchpad页面
     * @param params
     */
    launchpad:function(params){
        if(typeof params ==='undefined'){
            gkClient.gLaunchpad('');
        }else{
            gkClient.gLaunchpad(JSON.stringify(params));
        }

    },
    /**
     * 获取文件信息
     * @param params
     * @returns {*}
     */
    getFileInfo:function(params){
        var re = gkClient.gGetFileInfo(JSON.stringify(params));
        //console.log(JSON.parse(re));
        return JSON.parse(re);
    },
    setMessageDate:function(dateline){
        try {
           gkClient.gSetMessage(JSON.stringify({
                dateline:dateline
           }));
        } catch (e) {
            this._handleException(e);
        }
    },
    /**
     * 获取文件列表
     * @param params
     * exp.
     * {
     *      “webpath”:”文档”,
     *      ”mountid”:10,
     *      ”dir”:1
     * }
     */
    getFileList: function (params) {
        try {
           var re = gkClient.gGetFileList(JSON.stringify(params));
           return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
    },
    /**
     * 通过浏览器打开链接
     * @param url
     */
    openUrl:function(url){
        try {
           gkClient.gOpenUrl(JSON.stringify({
               url:url
           }));
        } catch (e) {
            this._handleException(e);
        }
    },
    getUIPath:function(){
        return gkClient.gGetUIPath();
    },
    /**
     * 获取左侧树数据
     * @param params
     * exp.
     * {
     *      “sidetype”:<org:云库的文件夹|other:其他存储|magic:智能文件夹c>
     * }
     */
    getSideTreeList: function (params) {
        try {
            var re = gkClient.gSideTreeList(JSON.stringify(params));
            return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
    },
    /**
     * 显示添加文件的对话框
     * @returns {*}
     */
    addFileDialog: function () {
        try {
            return JSON.parse(gkClient.gAddFileDlg());
        } catch (e) {
            this._handleException(e);
        }
    },
    addFile: function (params,callback) {
        try {

             gkClient.gAdd(JSON.stringify(params),function(re){
                 re = typeof re ==='object'?re:JSON.parse(re);
                 if(typeof callback === 'function'){
                     callback(re);
                 }
             });
        } catch (e) {
            this._handleException(e);
        }
    },
    createFolder: function (params,callback) {
        try {
            gkClient.gNewFile(JSON.stringify(params),function(re){
                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    toggleLock: function (params,callback) {
        try {
           gkClient.gLock(JSON.stringify(params),function(re){
               re = typeof re ==='object'?re:JSON.parse(re);
               if(typeof callback === 'function'){
                   callback(re);
               }
           });
        } catch (e) {
            this._handleException(e);
        }
    },
    getUser:function(){
        return JSON.parse(gkClient.gUserInfo());
    },
    saveToLocal:function(params){
        try {
            //console.log(params);
           gkClient.gSaveToLocal(JSON.stringify(params));
        } catch (e) {
            this._handleException(e);
        }
    },
    del:function(params,callback){
        try {
           gkClient.gDelete(JSON.stringify(params),function(re){
                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    rename:function(params,callback){
        try {
          gkClient.gRename(JSON.stringify(params),function(re){
                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });

        } catch (e) {
            this._handleException(e);
        }
    },
    copy:function(params,callback){
        try {
            gkClient.gCopy(JSON.stringify(params),function(re){
                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });

        } catch (e) {
            this._handleException(e);
        }
    },
    move:function(params,callback){
        try {
            gkClient.gMove(JSON.stringify(params),function(re){
                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    open:function(params){
        try {
            params.opentype = 'open';
            gkClient.gOpen(JSON.stringify(params));
        } catch (e) {
            this._handleException(e);
        }
    },
    openLocation:function(params){
        try {
            params.opentype = 'select';
            return gkClient.gOpen(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    selectPath:function(params){
        try {
            if(typeof params === 'undefined'){
                return gkClient.gSelectPathDlg('');
            }else{
                return gkClient.gSelectPathDlg(JSON.stringify(params));
            }

        } catch (e) {
            this._handleException(e);
        }
    },
    checkPathIsEmpty:function(params){
        try {
            return gkClient.gCheckEmpty(JSON.stringify(params));
        } catch (e) {
            this._handleException(e);
        }
    },
    setLinkPath:function(params,callback){
        try {
            gkClient.gSetLinkPath(JSON.stringify(params),function(re){
                re =typeof re ==='object'?re: JSON.parse(re);
                if(re && re.error==0){
                    if(typeof callback === 'function'){
                        callback(re);
                    }
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    moveLinkPath:function(params,callback){
        try {
            gkClient.gMoveLinkPath(JSON.stringify(params),function(re){
                re =typeof re ==='object'?re: JSON.parse(re);
                if(re && re.error==0){
                    if(typeof callback === 'function'){
                        callback(re);
                    }
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    removeLinkPath:function(params,callback){
        try {
            gkClient.gDeleteLinkPath(JSON.stringify(params),function(re){
                re =typeof re ==='object'?re: JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    getRestHost:function(){
        try {
            return gkClient.gRestHost();
        } catch (e) {
            this._handleException(e);
        }
    },
    getApiHost:function(){
        try {
            return gkClient.gApiHost();
        } catch (e) {
            this._handleException(e);
        }
    },
    getToken:function(){
        try {
            return gkClient.gGetToken();
        } catch (e) {
            this._handleException(e);
        }
    },
    getAuthorization:function(ver,webpath,date,mountid){
        var params = {
            ver: String(ver),
            webpath: String(webpath),
            date: String(date),
            mountid:parseInt(mountid)
        };
        //onsole.log(params);
        var JSONParams = JSON.stringify(params);
        return gkClient.gGetAuthorization(JSONParams);
    },
    getApiAuthorization:function(params){
        for(var key in params){
            params[key] = String(params[key]);
        }
        //console.log(params);
        return gkClient.gGetApiAuthorization(JSON.stringify(params));
    },
    setSettings:function(){
        gkClient.gNetworkAgent();
    },
    setClose:function(){
        gkClient.gClose();
    },
    getMessage:function(){
        return gkClient.gGetMessage();
    },
    getUserInfo:function(){
        return gkClient.gUserInfo();
    },
    setClearCache:function(){
        gkClient.gClearCache();
    },
    getTransList: function(param){
        var re = gkClient.gTransList(JSON.stringify(param));
        //console.log(re);
        return JSON.parse(re);
    },
    setLogoff:function(){
        gkClient.gLogoff();
    },
     setClientInfo:function(params){
        return gkClient.gSetClientInfo(JSON.stringify(params));
    },
    setChangeLanguage:function(params){
       gkClient.gChangeLanguage(JSON.stringify(params));
    },
    getUrl:function(params){
        return gkClient.gGetUrl(JSON.stringify(params));
    },
    setMain:function(data){
        return gkClient.gMain(JSON.stringify(data));
    },
    getUIPath: function(){
        return gkClient.gGetUIPath();
    },
    getLocalSyncURI: function(param){
        var re =  gkClient.gGetSyncNormalPath (JSON.stringify(param));
        return re;
    },
    setClientInfo: function(params){
        return gkClient.gSetClientInfo(JSON.stringify(params));
    },
    getLinkPath: function(){
        var re = gkClient.gGetLinkPath();
        return JSON.parse(re);
    },
    setSyncStatus: function(params,callback){
        gkClient.gSetSyncStatus(JSON.stringify(params),function(re){
            re = typeof re ==='object'?re: JSON.parse(re);
            if(re && re.error==0){
                if(typeof callback === 'function'){
                    callback(re);
                }
            }
        });

    },
    startSync: function(){
        gkClient.gStartSync();
    },
    stopSync: function(){
        gkClient.gStopSync();
    },
    removeTrans: function(params,callback){
        gkClient.gRemoveTrans(JSON.stringify(params),function(re){
            re = typeof re ==='object'?re: JSON.parse(re);
            if(re && re.error==0){
                if(typeof callback === 'function'){
                    callback(re);
                }
            }
        });
    },
    setDeviceStatus: function(params){
        gkClient.gSetDeviceStatus(JSON.stringify(params));
    },
    getUserAgent:function(){
        return navigator.userAgent.split(';')
    },
    getClientOS:function(){
        return this.getUserAgent()[2].toLowerCase();
    },
    isWindowsClient:function(){
        return this.getClientOS() == 'windows';
    },
    getClientVersion:function(){
        return this.getUserAgent()[1].toLowerCase();
    }

};

