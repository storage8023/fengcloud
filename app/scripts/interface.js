var gkClientInterface = {

    /**
     * 处理异常
     * @param e
     */
    _handleException: function (e) {
        throw new Error(e.name + ":" + e.message);
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
            //console.log(JSON.parse(re));
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
     *      “sidetype”:<org:团队的文件夹|other:其他存储|magic:智能文件夹c>
     * }
     */
    getSideTreeList: function (params) {
        try {
            var re = gkClient.gSideTreeList(JSON.stringify(params));
            return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
        console.log(params);
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
    addFile: function (params) {
        try {
            //console.log(params);
            var re = gkClient.gAdd(JSON.stringify(params));
            return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
    },
    createFolder: function (params) {
        try {
            gkClient.gNewFile(JSON.stringify(params));
        } catch (e) {
            this._handleException(e);
        }
    },
    lock: function (params) {
        try {
            params.status = 1;
           gkClient.gLock(JSON.stringify(params));
        } catch (e) {
            this._handleException(e);
        }
    },
    unlock: function (params) {
        try {
            params.status = 0;
            gkClient.gLock(JSON.stringify(params));
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
    del:function(params){
        try {
            var re = gkClient.gDelete(JSON.stringify(params));
            return re?JSON.parse(re):'';
        } catch (e) {
            this._handleException(e);
        }
    },
    rename:function(params){
        try {
            var re = gkClient.gRename(JSON.stringify(params));
            return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
    },
    copy:function(params){
        try {
            console.log(params);
            var re = gkClient.gCopy(JSON.stringify(params));
            return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
    },
    move:function(params){
        try {
            console.log(params);
            var re = gkClient.gMove(JSON.stringify(params));
            return JSON.parse(re);
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
                return gkClient.gSelectPathDlg();
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
    setLinkPath:function(params){
        try {
            console.log(params);
            return gkClient.gSetLinkPaths(JSON.stringify(params));
        } catch (e) {
            this._handleException(e);
        }
    },
    removeLinkPath:function(params){
        try {
            return gkClient.gRemoveLinkPaths(JSON.stringify(params));
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

        var JSONParams = JSON.stringify(params);
        return gkClient.gGetAuthorization(JSONParams);
    },
    getApiAuthorization:function(params){
        for(var key in params){
            params[key] = String(params[key]);
        }
        return gkClient.gGetApiAuthorization(JSON.stringify(params));
    },
    setSettings:function(){
        gkClient.gSettings();
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
        gkClient.gClearChache();
    },
    getUpdateLinkPaths: function(param){
        gkClient.gUpdateLinkPaths(JSON.stringify(param));
    },
    getTransList: function(param){
        return gkClient.gTransList(JSON.stringify(param));
    },
    setLogoff:function(){
        gkClient.gLogoff();
    },
     setClientInfo:function(params){
        return gkClient.gSetClientInfo(JSON.stringify(params));
    },
    setChangeLanguage:function(params){
       return gkClient.gGetLanguage(JSON.stringify(params));
    },
    getLanguage:function(){
       return gkClient.gGetLanguage();
    },
    setGetUrl:function(params){
        return gkClient.gGetUrl(JSON.stringify(params));
    },
    setMain:function(data){
        return gkClient.gMain(JSON.stringify(data));
    },
    getUIPath: function(){
        return gkClient.gGetUIPath();
    },
    getClientInfo: function(){
        return gkClient.gGetClientInfo();
    },
    getLocalSyncURI: function(param){
        var re =  gkClient.gGetNormalPath(JSON.stringify(param));
        return re;
    },
    setClientInfo: function(params){
        return gkClient.gSetClientInfo(JSON.stringify(params));
    },
    getGetlinkPaths: function(){
        return gkClient.gGetlinkPaths();
    },
    setSyncStatus: function(){
        return gkClient.gSetSyncStatus();
    }
};

