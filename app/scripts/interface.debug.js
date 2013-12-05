var gkClientInterface = {

    /**
     * 处理异常
     * @param e
     */
    _handleException: function (e) {
        throw new Error(e.name + ":" + e.message);
    },
    selectPhotoPath:function(params){
        try {
            return gkClient.gGetUserImagePath();
        } catch (e) {
            this._handleException(e);
        }
    },
    setUserInfo:function(params,callback){
        try {
            gkClient.gSetUserInfo(JSON.stringify(params),function(re){
                re = typeof re ==='object'?re:JSON.parse(re);
                if(typeof callback === 'function'){
                    callback(re);
                }
            });
        } catch (e) {
            this._handleException(e);
        }
    },
    getOpenWithMenu:function(param){
        try {
            var re = gkClient.gGetOpenWithMenu(JSON.stringify(param));
            return JSON.parse(re);
        } catch (e) {
            this._handleException(e);
        }
    },
    copyToClipboard:function(text){
        try {
            gkClient.gSetClipboardData(text);
        } catch (e) {
            this._handleException(e);
        }
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
    getLinkDomain:function(){
        return gkClient.gSiteDomain()+'/link';
    },
    getSiteDomain:function(){
        return 'http://gkdev.goukuai.cn'
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
        var re = {
            fullpath:''
        };

        return re;
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
            var re
            if(params.mountid==3){
                re = {
                    "syncpath": "",
                    "sharepath": "",
                    "list": [{
                        "path": "新建文件夹",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "437e35571b044b95dc42e1c7e26ee5ad228471c6",
                        "lasttime": 1386037206,
                        "lastid": 8,
                        "lastname": "鸽子徐1",
                        "creatortime": 1386037206,
                        "creatorid": 8,
                        "creatorname": "鸽子徐1",
                        "lock": 0,
                        "locktime": 0,
                        "lockid": 0,
                        "lockname": "",
                        "status": 4,
                        "version": 223,
                        "sync": 0,
                        "have": 1,
                        "open": 1
                    },
                        {
                            "path": "兴趣资料",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "017245cbf36e2cf79cae958a75bc7a3b669bd768",
                            "lasttime": 1385971369,
                            "lastid": 5,
                            "lastname": "test1",
                            "creatortime": 1385447975,
                            "creatorid": 5,
                            "creatorname": "test1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 1,
                            "sync": 0,
                            "have": 1,
                            "open": 1
                        },
                        {
                            "path": "新建文件夹(2)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "661d0bcd40e7df65a2f2224f04ebb0a21f2e479f",
                            "lasttime": 1385704818,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385704818,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 104,
                            "sync": 0,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "新建文件夹(3)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "dded06027a186ad526fd401a83354847124fdae1",
                            "lasttime": 1385704931,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385704931,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 105,
                            "sync": 1,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "新建文件夹(7)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "31dc329616a114e19c0396655a99babdde05f19a",
                            "lasttime": 1385707708,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385707708,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 138,
                            "sync": 1,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "新建文件夹(8)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "753e2e0981cc6f6eb67b7f27dcb318a70d4c5d2a",
                            "lasttime": 1385707710,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385707710,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 139,
                            "sync": 1,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "新建文件夹(1)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "e14b1acbca614e5d28242960a17192eeb095dd0f",
                            "lasttime": 1385962378,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385962378,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 155,
                            "sync": 0,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "新建文件夹(6)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "0c85a13338f6204e1dd27e2675481189d8ca6520",
                            "lasttime": 1385962396,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385962396,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 157,
                            "sync": 1,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "新建文件夹(9)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "abc492c9a8f01dd725b93e2751062cfc4ae89c9f",
                            "lasttime": 1385962398,
                            "lastid": 5,
                            "lastname": "test1",
                            "creatortime": 1385962398,
                            "creatorid": 5,
                            "creatorname": "test1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 158,
                            "sync": 0,
                            "have": 1,
                            "open": 1
                        },
                        {
                            "path": "新建文件夹(10)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "0de000592727e43a9d0d343642afc0eba23f4e70",
                            "lasttime": 1385962410,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385962410,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 159,
                            "sync": 0,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "kong",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "934a15385e41e493b46a2ca199154281a710c044",
                            "lasttime": 1386037214,
                            "lastid": 8,
                            "lastname": "鸽子徐1",
                            "creatortime": 1386037214,
                            "creatorid": 8,
                            "creatorname": "鸽子徐1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 224,
                            "sync": 0,
                            "have": 1,
                            "open": 1
                        },
                        {
                            "path": "DCIM",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "0c9c64cef5bd8c452176856f87ebc7083232af24",
                            "lasttime": 1386157281,
                            "lastid": 5,
                            "lastname": "test1",
                            "creatortime": 1386157281,
                            "creatorid": 5,
                            "creatorname": "test1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 229,
                            "sync": 0,
                            "have": 1,
                            "open": 0
                        }]
                };
            }else{
                re = {
                    "syncpath": "",
                    "sharepath": "",
                    "list": [{
                        "path": "新建文件夹(2)",
                        "dir": 1,
                        "filehash": "",
                        "filesize": 0,
                        "uuidhash": "c9f0e5bb86e233758039c2d182a74cf3becbde79",
                        "lasttime": 1385969563,
                        "lastid": 5,
                        "lastname": "xugetest1",
                        "creatortime": 1385610431,
                        "creatorid": 5,
                        "creatorname": "xugetest1",
                        "lock": 0,
                        "locktime": 0,
                        "lockid": 0,
                        "lockname": "",
                        "status": 4,
                        "version": 42,
                        "sync": 0,
                        "have": 1,
                        "open": 1
                    },
                        {
                            "path": "音乐",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "c97db73cf7e44c1cf8eed7733bd73e5c9665e3b4",
                            "lasttime": 1385611054,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385611054,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 175,
                            "sync": 0,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "新建文件夹(4)",
                            "dir": 1,
                            "filehash": "",
                            "filesize": 0,
                            "uuidhash": "9f1371257576837c24fa5d6b2f0237644f822e25",
                            "lasttime": 1385618570,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385618570,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 189,
                            "sync": 0,
                            "have": 1,
                            "open": 0
                        },
                        {
                            "path": "1建.txt",
                            "dir": 0,
                            "filehash": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
                            "filesize": 0,
                            "uuidhash": "0719bd33f973a091b885df7ae47d02daefcf5178",
                            "lasttime": 1385992143,
                            "lastid": 5,
                            "lastname": "xugetest1",
                            "creatortime": 1385992143,
                            "creatorid": 5,
                            "creatorname": "xugetest1",
                            "lock": 0,
                            "locktime": 0,
                            "lockid": 0,
                            "lockname": "",
                            "status": 4,
                            "version": 199,
                            "sync": 0,
                            "have": 1,
                            "open": 0
                        }]
                };
            }
           return re;
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
            var re;

            if(params.sidetype=='org'){
                re = {
                    "list": [{
                        "name": "测试团队",
                        "mountid": 3,
                        "orgid": 1,
                        "orgphoto": "http://oss.aliyuncs.com/gkavatar2/64/64fb194ba475f66675bb73993f42e74952767cf1.jpg",
                        "type": 0,
                        "use": 1047735594,
                        "total": 21474836480,
                        "orguse": 1047735594,
                        "orgtotal": 21474836480,
                        "membercount": 3,
                        "subscribecount": 0
                    },
                        {
                            "name": "test1",
                            "mountid": 17,
                            "orgid": 15,
                            "orgphoto": "http://oss.aliyuncs.com/gkavatar2/6d/6d3ee8eabbd8a8689c5d360b9665d7bfbb47fb2a.jpg",
                            "type": 0,
                            "use": 528261866,
                            "total": 10485760,
                            "orguse": 528261866,
                            "orgtotal": 10485760,
                            "membercount": 2,
                            "subscribecount": 0
                        },
                        {
                            "name": "test2",
                            "mountid": 18,
                            "orgid": 16,
                            "orgphoto": "http://oss.aliyuncs.com/gkavatar2/e2/e295a7db46a9935b4fb32394ec36dc04d5046c3b.jpg",
                            "type": 0,
                            "use": 388,
                            "total": 10485760,
                            "orguse": 388,
                            "orgtotal": 10485760,
                            "membercount": 1,
                            "subscribecount": 0
                        },
                        {
                            "name": "qweq",
                            "mountid": 32,
                            "orgid": 30,
                            "orgphoto": "http://oss.aliyuncs.com/gkavatar2/e2/e295a7db46a9935b4fb32394ec36dc04d5046c3b.jpg",
                            "type": 3,
                            "use": 0,
                            "total": 10485760,
                            "orguse": 0,
                            "orgtotal": 10485760,
                            "membercount": 1,
                            "subscribecount": 1
                        },
                        {
                            "name": "test",
                            "mountid": 4,
                            "orgid": 2,
                            "orgphoto": "http://oss.aliyuncs.com/gkavatar2/51/512a277a7f6e65c79f8bbab22db2e9ce3d548573.jpg",
                            "type": 2,
                            "use": 6018070,
                            "total": 10485760,
                            "orguse": 6018070,
                            "orgtotal": 10485760,
                            "membercount": 2,
                            "subscribecount": 0
                        },
                        {
                            "name": "zero2space",
                            "mountid": 88,
                            "orgid": 86,
                            "orgphoto": "http://oss.aliyuncs.com/gkavatar2/4e/4e15a0fafadfdfc683a2801008a3475becdd1e46.jpg",
                            "type": 2,
                            "use": 122,
                            "total": 10485760,
                            "orguse": 122,
                            "orgtotal": 10485760,
                            "membercount": 3,
                            "subscribecount": 0
                        },
                        {
                            "name": "我的云端资料库",
                            "mountid": 82,
                            "orgid": 80,
                            "orgphoto": "http://oss.aliyuncs.com/gkavatar2/e2/e295a7db46a9935b4fb32394ec36dc04d5046c3b.jpg",
                            "type": 2,
                            "use": 183,
                            "total": 10485760,
                            "orguse": 183,
                            "orgtotal": 10485760,
                            "membercount": 2,
                            "subscribecount": 0
                        },
                        {
                            "name": "sddd",
                            "mountid": 89,
                            "orgid": 87,
                            "orgphoto": "http://oss.aliyuncs.com/gkavatar2/e4/e4a893f73a15dfe92954585021a2d5bc86b2fab7.jpg",
                            "type": 2,
                            "use": 4849,
                            "total": 10485760,
                            "orguse": 4849,
                            "orgtotal": 10485760,
                            "membercount": 2,
                            "subscribecount": 0
                        },
                        {
                            "name": "test",
                            "mountid": 93,
                            "orgid": 91,
                            "orgphoto": "http://oss.aliyuncs.com/gkavatar2/ba/ba29007ce90cc4a4df4c33413d544aeca247369d.jpg",
                            "type": 2,
                            "use": 23147,
                            "total": 10485760,
                            "orguse": 23147,
                            "orgtotal": 10485760,
                            "membercount": 2,
                            "subscribecount": 0
                        }]
                };
            }else{
                re = {
                  'list':[]
                };
            }
            return re;
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
        var re = '{"member_id":5,"member_email":"xugetest1@126.com","member_name":"test1","member_phone":"","avatar":"http:\/\/oss.aliyuncs.com\/gkavatar2\/e4\/e4a893f73a15dfe92954585021a2d5bc86b2fab7.jpg","settings":{"favorite_names":"1","file_index_status":"2"},"favorite_names":{"1":"\u661f\u5f62","2":"\u6708\u4eae","3":"test","4":"\u5e78\u8fd0\u8349","5":"\u4e09\u89d2\u5f62","6":"\u94bb\u77f3"}}';
        return JSON.parse(re);
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
            console.log(params);
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
            return 'http://gkr.goukuai.cn';
        } catch (e) {
            this._handleException(e);
        }
    },
    getApiHost:function(){
        try {
            return 'http://gka.goukuai.cn';
        } catch (e) {
            this._handleException(e);
        }
    },
    getToken:function(){
        try {
            return '';
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
        return '';
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

