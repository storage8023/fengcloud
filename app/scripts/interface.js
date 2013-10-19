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
            var list = [];
            if (params.webpath == 'aaa') {
                list = [
                    {
                        "path": "aaa/测试1",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 12345678,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "aaa/测试3",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 12345678,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "aaa/测试1",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 12345678,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "aaa/测试3",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 12345678,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "aaa/测试1",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 12345678,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "aaa/测试3",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 12345678,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "aaa/测试1",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 12345678,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "aaa/测试3",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 12345678,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    }
                ]
            } else {
                    list =  [
                    {
                        "path": "aaa",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 1381568404,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 0,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "bbb",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "",
                        "lasttime": 1381568504,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 0,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "ccc.jpg",
                        "dir": 0,
                        "filehash": "",
                        "filesize": 123456,
                        "uuidhash": "",
                        "lasttime": 1381568604,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 2,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "ddd.doc",
                        "dir": 0,
                        "filehash": "",
                        "filesize": 12345,
                        "uuidhash": "",
                        "lasttime": 1381568604,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 0,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "快测试.doc",
                        "dir": 0,
                        "filehash": "",
                        "filesize": 12345,
                        "uuidhash": "",
                        "lasttime": 1381568604,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 0,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },
                    {
                        "path": "够快测试2.doc",
                        "dir": 0,
                        "filehash": "",
                        "filesize": 12345,
                        "uuidhash": "",
                        "lasttime": 1381568604,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 0,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },

                ];
                if(params.debug){
                    list.push({
                        "path": params.debug,
                        "dir": 1,
                        "filehash": "",
                        "filesize": 2121212,
                        "uuidhash": "",
                        "lasttime": 1381568604,
                        "lastid": 111,
                        "lastname": "aaa",
                        "creatortime": 12345678,
                        "creatorid": 111,
                        "creatorname": "111",
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    })
                }

            }
            return list;
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
            return [
                {
                    name: "够快科技",
                    mountid: 2
                },
                {
                    name: "上海够快",
                    mountid: 5
                }
            ];
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
            return {
                'list': [
                    {'path': 'aaa'},
                    {'path': 'bbb'}
                ]
            };
            return JSON.parse(gkClient.gAddFileDlg());
        } catch (e) {
            this._handleException(e);
        }
    },
    addFile: function (params) {
        try {
            return {error:0,message:'test'};
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
            return {error:0,message:'test'};
            return JSON.parse(gkClient.lock(JSON.stringify(params)));
        } catch (e) {
            this._handleException(e);
        }
    },
    unlock: function (params) {
        try {
            return {error:0,message:'test'};
            return JSON.parse(gkClient.unlock(JSON.stringify(params)));
        } catch (e) {
            this._handleException(e);
        }
    },
    getUser:function(){
        return {
            "org_id":1,
            "id":2,
            "email":"xugetest1@126.com",
            "username":"测试1",
            "org_username":"123",
            "photourl":"http://oss.aliyuncs.com/gkavatar2/39/398fd1f3fb5f3f7b1077d623c5ade70b1c63b50b.jpg",
            "mount_id":2,
            "capacity":0,
            "size":59321948,
            "org_name":"web开发组",
            "org_size":108209585
        }

        return JSON.parse(gkClient.gUserinfo());
    },
    saveToLocal:function(params){
        try {
            return {error:0,message:'test'};
            return gkClient.gSaveToLocal(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    del:function(params){
        try {
            return {error:0,message:'test'};
            return gkClient.gDel(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    rename:function(params){
        try {
            return {error:0,message:'test'};
            return gkClient.gRename(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    copy:function(params){
        try {
            return {error:0,message:'test'};
            return gkClient.gCopy(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    move:function(params){
        try {
            return {error:0,message:'test'};
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
            return {error:0,message:'test'};
            params.opentype = 'select';
            return gkClient.gOpen(params);
        } catch (e) {
            this._handleException(e);
        }
    },
    selectPath:function(){
        try {
            return 'C://DDDD';
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
            return 'http://r.gokuai.com';
            return gkClient.gRestHost();
        } catch (e) {
            this._handleException(e);
        }
    },
    getApiHost:function(){
        try {
            return 'http://a.gokuai.com';
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

