"use strict";

var express = require('express')
    , mongoose = require('mongoose')
    , route = require("./config/route")
    , config = require("./config/config")
    , zigbeeServer = require('./core/zigBeeServer')
    , socket = require('./core/webSocketServer')
    , schedule = require('./core/schedule')
    , log4js = require('log4js')
    , ejs = require("ejs")
    , path = require("path")
    , app = express()
    , http = require('http').Server(app)
    ;

function start() {

    //配置打印日志 并将输出日志保存到 logs/access.log
    log4js.configure({
        appenders: [
            {type: 'console'},//控制台输出
            //文件输出
            {type: 'dateFile',
                absolute: true,
                filename: __dirname + '/logs/log',
                maxLogSize: 1024 * 1024, //1M,超出后会新建文件为 access.log.1 access.log.2 ... access.log.n
                pattern: "_yyyy-MM-dd.log",
                backups: 3,
                alwaysIncludePattern: true,
                category: 'normal'}
        ],
        replaceConsole: true});

//    设置日志级别
    var logger = log4js.getLogger('normal');
    logger.setLevel('INFO');//输出级别是INFO，则不会打印出低于info级别的日志trace,debug，只打印info,warn,error,fatal。

    //设置 ejs闭合标记 "<%  .. %>" 为 "{{  .. }}"
    ejs.open = '{{';
    ejs.close = '}}';

    //环境配置
    app.configure(function () {
        //更改ejs模板后缀 .ejs 为 .html
        app.engine('.html', require('ejs').__express);
        app.set('view engine', 'html');

        //设置视图路径
        app.set('views', __dirname + '/views');

        //每次请求都不适用 layout
        app.set("view options", {
            "layout": false
        });

        /*//控制台打印客户端请求
         app.use(log4js.connectLogger(logger,
         //remote-addr：客户端访问IP  method:方法名 url:请求路径
         { level: log4js.levels.INFO, format: ':remote-addr :status :method :url'}
         ));*/
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.session({ secret: config.sessionSecret }));//session secret
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(path.join(__dirname, '/views'))); //views path
        if ('development' == app.get('env')) {
            app.use(express.errorHandler());
        }
    });

    //请求路由解析
    route(app);

    //启动服务器
    try {
        //启动Web服务器
        http.listen(config.webServerPort, config.serverIp, function () {
            var logdao = require("./service/logService");
            //socket通信、创建连接并监听，接受客户端传入的消息并存入数据库
            socket.connect(http);
            console.log("Web server running on port " + config.webServerPort + "!");
        });
        //连接数据库
        try {
            mongoose.connect(config.dbURL);
            console.log("MongoDB connected success on port " + config.dbServerPort + "!");
        }
        catch (err) {
            console.log("MongoDB connected failed on port " + config.dbServerPort
                + "!\n ERROR INFO ：" + err);
        }
        //Zigbee网关在指定端口与客户端（设备端）创建连接,
        zigbeeServer.connect(config.zigbeeServerPort);
        //定时任务设置
        schedule.start();
        console.log("Server running on " + config.serverIp + "!");
    } catch (e) {
        console.log("Server running on " + config.serverIp + " failed!");
        console.log(e);
    }
}

start();
