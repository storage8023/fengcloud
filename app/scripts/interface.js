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
            if(params.webpath=='aaa'){
                return [{
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
            }else{
                return [
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
                        "lock": 1,
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
                        "lock": 1,
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
                        "filesize": 12345,
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
                        "lock": 1,
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
                        "lock": 1,
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
                        "lock": 1,
                        "locktime": 12345678,
                        "lockid": 111,
                        "lockname": "aaa",
                        "status": 4,
                        "version": 123
                    },


                ];
            }

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
    }

};

