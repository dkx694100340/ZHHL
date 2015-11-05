"use strict";

/**
 * @Author: 邓孔祥
 * @Date: 2014/9/11
 * @Version: 2.0.4
 * @Description: 根据请求路径处理请求
 */
var fs = require('fs')
    , url = require('url');

/*
 * 该方法用于处理请求的路由，并转发到相应的控制器
 *
 * @param  app  express  用于启动服务的应用
 * 请求类型：  '/:controller?/:action?/:args1?'
 * @param: controller：控制器 action：方法名 args1：内容，一般为数据_id
 * */
module.exports = function (app) {
    app.all('/:controller?/:action?/:args1?'   //拦截所有的请求
        , function (request, response, next) {
            if (!checkLogin(request)) {
                response.redirect('/user/signin');
            }
            else {
                var path = url.parse(request.url, true).pathname.split('/'); //根据 request 参数获取关系映射数组
                var controller = path[1]        //从请求路径中获取控制器名
                    , action = path[2]          //从请求路径中获取控制器中对于的方法名
                    , control = [];             //用于取得控制器名获取相应的方法数组

                if (controller === ''  //访问首页站点 http://localhost:3000/
                    || (request.url.toString()).indexOf('html') > 0) { //不允许直接访问页面文件
                    response.redirect('/sys/index');
                }
                else {
                    fs.exists('./controller/' + controller + 'Controller.js'  //判断控制器是否存在
                        , function (exists) {
                            if (exists) {
                                control = require('../controller/' + controller + 'Controller.js'); //若存在则获取所有方法
                                if (control[action] && typeof(control[action]) === 'function') {    //判断类型，若为方法则调用
                                    control[action](request, response, next);
                                } else {
                                    next();
                                }
                            } else {
                                next();
                            }
                        })
                }
            }
        });
};


/*
 * 该方法用于判断该访问者已是否登录 ，是否为非法访问
 *
 * @param  request  通过 request中的 session 判断
 *
 * */
function checkLogin(request) {
    //return true;

    var path = url.parse(request.url, true).pathname; //根据 request 参数获取关系映射数组
    //登录
    if (path.toLowerCase().indexOf('login') > 0
        || path.toLowerCase().indexOf('sign') > 0  //若请求路径为登录，所属的操作则跳过，
        || (request.session !== undefined && request.session.user !== undefined)) {
        return true;
    }
    return false;
}
