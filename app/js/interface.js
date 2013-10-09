var gkClientInterface = {

    /**
     * 处理异常
     * @param e
     */
    _handleException:function(e){
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
    getFileList:function(params){
        try{
            return gkClient.gGetFileList(params);
        }catch(e) {
           this._handleException(e);
        }
    },

    /**
     * 获取左侧树数据
     * @param params
     */
    getSideTreeList:function(params){
        try{
            return gkClient.gSideTreeList(params);
        }catch(e) {
            this._handleException(e);
        }
    }

};

