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
            return gkClient.gGetFileList(JSON.stringify(params));
        } catch (e) {
            this._handleException(e);
        }
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
            return gkClient.gSideTreeList(JSON.stringify(params));
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
    addFile: function (params) {
        try {
            return JSON.parse(gkClient.gAdd(JSON.stringify(params)));
        } catch (e) {
            this._handleException(e);
        }
    },
    createFolder: function (params) {
        try {
            return JSON.parse(gkClient.newFile(JSON.stringify(params)));
        } catch (e) {
            this._handleException(e);
        }
    },
    lock: function (params) {
        try {
            return JSON.parse(gkClient.lock(JSON.stringify(params)));
        } catch (e) {
            this._handleException(e);
        }
    },
    unlock: function (params) {
        try {
            return JSON.parse(gkClient.unlock(JSON.stringify(params)));
        } catch (e) {
            this._handleException(e);
        }
    },
    getUser:function(){
        return JSON.parse(gkClient.gUserinfo());
    },
    saveToLocal:function(params){
        try {
            return gkClient.gSaveToLocal(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    del:function(params){
        try {
            return gkClient.gDel(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    rename:function(params){
        try {
            return gkClient.gRename(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    copy:function(params){
        try {
            return gkClient.gCopy(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    move:function(params){
        try {
            return gkClient.gMove(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    open:function(params){
        try {
            params.opentype = 'open';
            return gkClient.gOpen(params);
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
    selectPath:function(){
        try {
            return gkClient.gSelectPathDlg();
        } catch (e) {
            this._handleException(e);
        }
    },
    checkPathIsEmpty:function(params){
        try {
            return gkClient.gCheckEmpty(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    setLinkPath:function(params){
        try {
            return gkClient.gSetLinkPaths(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    removeLinkPath:function(params){
        try {
            return gkClient.gRemoveLinkPaths(params);
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
    getAuthorization:function(ver,webpath,date){
        var params = {
            ver: ver,
            webpath: webpath,
            date: date
        };
        var JSONParams = JSON.stringify(params);
        return gkClient.gGetAuthorization(JSONParams);
    },
    getApiAuthorization:function(params){
        return gkClient.gGetApiAuthorization(JSON.stringify(params));
    }
};

