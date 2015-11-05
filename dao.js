/**
 *
 * @Description:
 * 该类用于通过中间件 mongoose 操作 MongoDB 数据库，
 *  待优化：查询条件类型应该由实体类获取，而不是通过数据转换类型转换
 *
 * @Author: 邓孔祥
 * @Date: 2014/9/11
 * @Version: 2.0.4
 *
 * */

var dateUtil = require('../core/util/dateUtil')
    , mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , jsonutil = require('../core/util/JSONutil')
    , numberUtil = require('../core/util/number')
    ;

//注册Schema
require('./registerSchema');

/*
 * 该方法用于修改数据
 *
 * @param model       Schema    要操作的集合的数据模型
 * @param data        JSON      能转换为 Schema 类型的JSON数据
 * @param callback    function  回调函数
 *
 * */
exports.update = function (model, data, callback) {
    "use strict";
    data = jsonutil.parse(data);

    var condition = {_id: data._id};
    updateByCondition(model, condition, data, function (err) {
        callback(err);
    });
};
/*
 * 该方法用于修改数据
 *
 * @param model            Schema    要操作的集合的数据模型
 * @param conditionArray   JSON      查询的条件
 * @param data             JSON      能转换为 Schema 类型的JSON数据
 * @param callback         function  回调函数
 *
 * */
function updateByCondition(model, conditionArray, data, callback) {
    "use strict";

    data = jsonutil.parse(data);

    model.findOneAndUpdate(conditionArray, data, function (err, doc) {
        if (err) {
            console.log('在集合[ ' + model.modelName + 's ]中修改数据 ' + doc + ' 失败！');
            console.log('' + err);
            callback(err);
            return;
        }
//        console.log('在集合[ ' + model.modelName + 's ]中修改数据 ' + doc + ' 成功！');
        console.log('在集合[ ' + model.modelName + 's ]中修改数据成功！');
        callback(err, doc);
    });
}


/*
 *
 * 该方法用于按 _id 删除单条数据
 *
 * @param _id       String    该条数据的主键 _id
 * @param callback  function  回调函数
 *
 * */
exports.delete = function (model, _id, callback) {
    "use strict";
    exports.findById(_id, function (err, doc) {
        if (err) {
            console.log('删除集合[ ' + model.modelName + 's ]中数据' + doc + '的数据失败！');
            console.log('' + err);
            callback(err);
            return;
        }
        doc.remove();
        console.log('删除集合[ ' + model.modelName + 's ]的数据成功！');
        callback(null);
    });
};


/*
 * 该方法用于在集合 ' + model + ' 中按_id查找数据
 *
 * @param id        ObjectId  主键 _id
 * @param callback  function  回调函数
 *
 * */
exports.findById = function (model, id, callback) {
    "use strict";
    var populateList = getPopulateList(model);
    model
        .findOne()
        .where({_id: id})
        .populate(populateList)
        .exec({}, function (err, doc) {
            if (err) {
                console.log('查询集合[ ' + model.modelName + 's ]中满足条件 _id=' + id + ' 的数据失败！');
                console.log('' + err);
                callback(err, null);
                return;
            }
            if (populateList.length > 0)
                doc = setRefDefault(model, populateList, doc);//处理外键数据
            console.log('查询集合[ ' + model.modelName + 's ]中满足条件 _id=' + id + ' 的数据成功！');
//            console.log('DATA:' + doc + '');
            callback(null, doc);
        });
};

/*
 * 该方法用于在集合 ' + model + ' 中按条件数组查找数据
 *
 * @param conditionArray JSON  条件数组　
 * @param callback       function  回调函数
 *
 * */
exports.findByCondition = function (model, conditionArray, callback) {
    "use strict";
    var populateList = getPopulateList(model);//获取外键数组
    model
        .find()
        .where(conditionArray)
        .populate(populateList)
        .exec(function (err, docs) {
            if (err) {
                console.log('查询集合[ ' + model.modelName + 's ]中满足条件 ' + conditionArray + ' 的数据失败！');
                console.log('' + err);
                callback(err, null);
                return;
            }
            docs = setRefDefaultFromDocs(model, populateList, docs);//处理外键数据
            console.log('查询集合[ ' + model.modelName + 's ]中满足条件 ' + JSON.stringify(conditionArray) + ' 的数据成功！');
//            console.log('DATA:' + docs + '');
            callback(err, docs == null ? null : docs);
        });
};


/*
 * 该方法用于在集合 ' + model + ' 中按条件数组查找部分字段数据
 *
 * @param conditionArray JSON  条件数组　
 * @param filedArray     JSON  字段数组 如：{'_id': 1, 'DL_Value': 1, 'Create_Time': 1} 其中_id,DL_Value,Create_Time是要查询的列
 * @param callback       function  回调函数
 *
 * */
exports.findPartCols = function (model, filedArray, conditionArray, callback) {
    "use strict";
    var populateList = getPopulateList(model);//获取外键数组
    conditionArray = pageWhere(model, conditionArray)   //  界面传到后台的条件model

    model
        .find({}, filedArray)
        .where(conditionArray)
        .populate(populateList)
        .exec(function (err, docs) {
            if (err) {
                console.log('查询集合[ ' + model.modelName + 's ]中满足条件 ' + conditionArray + ' 的数据失败！');
                console.log('' + err);
                callback(err, null);
                return;
            }
            docs = setRefDefaultFromDocs(model, populateList, docs);//处理外键数据
            console.log('查询集合[ ' + model.modelName + 's ]中满足条件 ' + JSON.stringify(conditionArray) + ' 的数据成功！');
//            console.log('DATA:' + docs + '');
            callback(err, docs == null ? null : docs);
        });
};


/*
 * 该方法用于新增数据到集合 ' + model + '
 *
 * @param model     Schema    要操作的集合的数据模型
 * @param data      json      要插入的数据
 * @param callback  function  回调函数
 *
 * */
exports.add = function (model, data, callback) {
    "use strict";
    try {
        var newmodel = null;
        try {//传入字符串转换为JSON对象
            newmodel = new model(JSON.parse(data));
        } catch (err) {//如果是JSON对象，则不需要转换
            newmodel = new model(data);
        }
        newmodel.save(function (err) {
            if (err) {
                console.log('插入数据 ' + newmodel + ' 到集合[ ' + model.modelName + 's ]失败！');
                console.log('' + err);
                callback(err);
                return;
            }
            console.log('插入数据 ' + data + ' 到集合[ ' + model.modelName + 's ]成功！');
            callback(null);
        });
    } catch (err) {
        console.log('插入数据 ' + newmodel + ' 到集合[ ' + model.modelName + 's ]失败！');
        console.log('' + err);
    }
};


/*
 *
 * 该方法用于按 _id 删除单条数据
 *
 * @param model     Schema    要操作的集合的数据模型
 * @param _id       String    该条数据的主键 _id
 * @param callback  function  回调函数
 *
 * */
exports.delete = function (model, _id, callback) {
    exports.findById(model, _id, function (err, doc) {
        if (err) {
            console.log('删除集合[ ' + model.modelName + 's ]中数据' + doc + '的数据失败！');
            console.log('' + err);
            callback(err);
            return;
        }
        doc.remove();
        console.log('删除集合[ ' + model.modelName + 's ]中满足条件{_id:' + _id + '}的数据成功！');
        callback(null);
    });
};


/*
 * 该方法用于按 _id 数组 批量删除数据
 *
 * @param model     Schema    要操作的集合的数据模型
 * @param _ids      String    可转换为数组的字符串
 * @param callback  function  回调函数
 *
 * */
exports.deleteBatch = function (model, _ids, callback) {
    "use strict";
    var conditions = {"_id": {$in: _ids.split(',')}};
    model.remove(conditions, function (err) {
        if (err) {
            console.log('删除集合[ ' + model.modelName + 's ]中满足 {"_id": {$in:' + _ids + '}}条件的数据失败！');
            console.log('' + err);
            callback(err);
            return;
        }
        console.log('删除集合[ ' + model.modelName + 's ]中满足 {"_id": {$in:' + _ids + '}}条件的数据成功！');
        callback(null);
    });
};


/*
 * 该方法用于按 _id 数组 批量删除数据
 *
 * @param model     Schema    要操作的集合的数据模型
 * @param _ids      String    可转换为数组的字符串
 * @param callback  function  回调函数
 *
 * */
exports.deleteAll = function (model, callback) {
    "use strict";
    model.remove({}, function (err) {
        if (err) {
            console.log('删除集合[ ' + model.modelName + 's ]中所有数据失败！');
            console.log('' + err);
            callback(err);
            return;
        }
        console.log('删除集合[ ' + model.modelName + 's ]中所有数据成功！');
        callback(null);
    });
};


/*
 * 该方法用于 easyui 的 datagrid 分页
 *      待优化：应加入查询的列，而不是把所有的列都查出来。对外键列可指定查询外键表的部分列。
 * @param model       Schema    要操作的集合的数据模型
 * @param conditions  JSON      分页条件
 * @param callback    function  回调函数
 *
 * conditions 类型如下：
 * { device:
 *   { D_Name: 'd',
 *     D_Type_Name: '',
 *     D_Company_Name: '',
 *     create_time_begin: '',  //若想加入时间范围查询必须按照 Create_Time 这种命名格式带入条件
 *     create_time_end: ''
 *   },
 *   page: '1',
 *   rows: '10',
 *   sort: 'Create_Time',
 *   order: 'desc'
 * }
 * */
exports.pagelist = function (model, conditions, callback) {
    "use strict";
    if (model == null)  return null;

    var sort = '{"' + conditions.sort + '":"' + conditions.order + '"}' //排序的字段及排序方式
        , pageindex = parseInt(conditions.page, 10)     //  页数
        , pagesize = parseInt(conditions.rows, 10)      //  每页多少行
        , conditionmodel = pageWhere(model, conditions[model.modelName])   //  界面传到后台的条件model
        , populateList = getPopulateList(model);   //获取外键数组

    model
        .find(conditionmodel)
        .sort(JSON.parse(sort))
        .populate(populateList)
        .skip(((pageindex - 1) * pagesize))
        .limit(pagesize)
        .exec(function (err, docs) {
            if (err) {
                console.log('查询集合[ ' + model.modelName + 's ]中满足条件' + JSON.stringify(conditionmodel) + ' 的数据失败！');
                console.log('' + err);
                callback(err, null);
                return;
            }

            docs = setRefDefaultFromDocs(model, populateList, docs);//处理外键数据
            getCount(model, conditionmodel, function (err, count) {
                callback(null, { "total": count, "rows": docs});
            });
        });
};

/*
 *
 * 用于查询满足条件的对象数量
 *
 * @param      model   JSON  要查询的条件model
 * @param      conditionmodel   JSON  经过pagewhere条件转换的条件对象
 * @return     count   int   满足条件的对象数量
 *
 * */
function getCount(model, conditionmodel, callback) {
    model
        .count(conditionmodel, function (err, count) { //满足条件的记录条数
            if (err) {
                console.log(err);
                callback(err, 0);
                return;
            }
            var msg = '在集合[ ' + model.modelName + 's ]中';
            if (conditionmodel !== undefined) msg += '满足条件 ' + JSON.stringify(conditionmodel) + ' ';
            msg += '的对象有' + count + '个！';

            console.log(msg);
            callback(err, count);
        });
}

/*
 * 该方法用于在集合 ' + model + ' 中按条件数组 同步 查询部分字段数据
 *
 * @param conditionArray JSON  条件数组　
 * @param filedArray     JSON  字段数组 如：{'_id': 1, 'DL_Value': 1, 'Create_Time': 1} 其中_id,DL_Value,Create_Time是要查询的列
 * @param callback       function  回调函数
 *
 * */
function findSyncData(model, filedArray, conditionArray) {

    var promise = new mongoose.Promise();

    model
        .find({}, filedArray)
        .where(conditionArray)
        .populate(populateList)
        .exec(function (err, docs) {
            if (err) {
                console.log('查询集合[ ' + model.modelName + 's ]中满足条件 ' + conditionArray + ' 的数据失败！');
                console.log('' + err);
                callback(err, null);
                return;
            }
            docs = setRefDefaultFromDocs(model, populateList, docs);//处理外键数据
            console.log('查询集合[ ' + model.modelName + 's ]中满足条件 ' + JSON.stringify(conditionArray) + ' 的数据成功！');
            promise.resolve(err, docs == null ? null : docs);
        });

    return promise;
}

/*
 * 用于将条件   model   转为 mongodb 查询的条件，支持模糊查询，时间（数字）范围查询
 *
 * 注意：在使用该方法时，如果条件集合的中的元素是外键，则该条件必须是完整、单一_id，
 *      该条件不支持模糊查询，该条件不支持类似in条件查询
 *
 * @param      model   JSON  要查询的条件model
 * @return     model   JSON  转为模糊查询后的model
 *
 *param 实例：
 *  { D_Name: 'a',
 *    D_Type_Name: '',
 *    D_Company_Name: '',
 *    //Create_Time 是集合内字段 其中：create_time_begin 和 create_time_end 分别是 create_time 字段的上下限
 *    create_time_begin: '',
 *    create_time_end: '' }
 *return:
 *  { D_Name: /a/ }
 *
 */
function pageWhere(model, conditionModel) {
    "use strict";
    var datelist = []       // 时间（数字）范围集合
        , datetemp = {}       // 临时 时间（数字）范围子集合
        , path = model.schema["paths"]; //获取该Schema的字段及其属性集合，用于处理条件时的数据类型判断

    for (var o in conditionModel) {  //循环处理条件
        var val = conditionModel[o].toString().trim();//获取 条件值

        if (jsonutil.isEmpty(conditionModel[o])) {
            delete conditionModel[o];     //值为空的条件对象从集合conditionModel中移除
            continue;
        }
        if (path[o] && path[o].instance != undefined) {
            if (path[o].instance == 'ObjectID' //如果是ObjectID 类型的外键，不用处理
                //如果该字段是数字表示一些类似状态值一样的数字则不处理
                || numberUtil.isInteger(val)
                //条件是IP不处理
                || numberUtil.isIP(val))
                continue;
        }//应该加入数字，判断类型是否是ObjectID的

        if (numberUtil.isIP(val)) {
            conditionModel[o] = new RegExp(conditionModel[o]);//字符串
            continue;
        }

        if (numberUtil.isInteger(val) //判断该条件是否为数字
            //用工具类判断该条件是否为时间
            || dateUtil.isDate(val)) {
            var datefield = o.substr(0, o.lastIndexOf('_'));   //获取要作为查询条件的字段
            var key = o.substr(o.lastIndexOf('_') + 1, o.length);  // begin 或者 end
            datetemp[key] = val;
            datelist[datefield] = datetemp;
            delete conditionModel[o]; //处理完后将其从集合conditionModel中移除
            continue;
        }
        conditionModel[o] = new RegExp(conditionModel[o]);//字符串
    }

    for (var dl in datelist) {  //处理时间（数字）范围
        var datestart = datelist[dl].begin //下限
            , dateend = datelist[dl].end//上限
            , str = '{';// 时间（数字）范围条件的字符串

        if (!jsonutil.isEmpty(datestart)) {
            str += '"$gte":"' + new Date(datestart).toUTCString() + '"';
        }
        if (!jsonutil.isEmpty(dateend)) {
            if (str.length != 1) {
                str += ',';
            }
            str += '"$lte":"' + new Date(dateend).toUTCString() + '"';
        }
        str += '}';

        delete datelist[dl];
        conditionModel[dl] = JSON.parse(str); //将其转换成JSON对象
    }

    return conditionModel;
};


/*
 *用于级联查询
 *处理Model的属性，求出populateList
 *
 * @param      model   JSON  要查询的条件model
 * @return     populateList   Array 外键关联的字段数组
 * */

function getPopulateList(model) {
    var propertyArray = model.schema["paths"]
        , populateList = [];
    for (var item in propertyArray) {
        var refTemp = propertyArray[item].options["ref"];
        if (refTemp != undefined) {
            var path = propertyArray[item].path;
            populateList.push(path);
        }
    }
    return populateList;
}


/*
 * 该方法用于处理外键数据，如果 Schema 中的外键数据为空则需要处理
 * 如果是外键则在 view 中使用时每次都要判空处理，如果在此处处理后则不用
 * 如果要使用如下方法，则外键所在 Schema 的外键显示列则必须设置默认值，
 *
 * @param populateList Array     外键数组
 * @param doc          JSON      model 类型的JSON数据
 *
 * */
function setRefDefault(model, populateList, docment) {
    if (populateList && populateList.length > 0) {
        for (var populateIndex in populateList) {
            for (var docIndex in docment) { //遍历查找到的满足条件的文档
                //如果外建名和文档的 docItem 属性相等，表示该文档该属性是外键 且不为空
                if (populateList[populateIndex] == docIndex && docment[docIndex] == null) {
                    //通过 Model 集合获取到外键所属 Schema 名称，
                    var tempModelName = model.schema.paths[docIndex].options.ref;
                    var tempModel = mongoose.model(tempModelName);
                    docment[docIndex] = new tempModel();
                }
            }
        }
    }
    return docment;
}


/*
 * @override  对 setRefDefault(populateList, doc) 方法的重载
 *
 * 该方法用于处理外键数据，如果 Schema 中的外键数据为空则需要处理
 * 如果是外键则在 view 中使用时每次都要判空处理，如果在此处处理后则不用
 * 如果要使用如下方法，则外键所在 Schema 的外键显示列则必须设置默认值，
 *
 * @param model       Schema    要操作的集合的数据模型
 * @param docment     JSON      model 类型的JSON数据
 *
 * */
exports.setRefDefaultFromDoc = function (model, docment) {
    var populateList = getPopulateList(model); //外键列表
    return  setRefDefault(model, populateList, docment);
};

/*
 * @override  对 setRefDefault(populateList, doc) 方法的重载
 *
 * 该方法用于处理外键数据，如果 Schema 中的外键数据为空则需要处理
 * 如果是外键则在 view 中使用时每次都要判空处理，如果在此处处理后则不用
 * 如果要使用如下方法，则外键所在 Schema 的外键显示列则必须设置默认值，
 *
 * @param opulateList Array    String 类型的外键数组
 * @param docments    JSONArray model 类型的JSON数据
 *
 * */

function setRefDefaultFromDocs(model, populateList, docments) {
    if (populateList.length > 0 && docments.length > 0)
        for (var index in docments)
            docments[index] = setRefDefault(model, populateList, docments[index]);
    return docments;
}

exports.getCount = getCount;
exports.findSyncData = findSyncData;
exports.updateByCondition = updateByCondition;
exports.getPopulateList = getPopulateList;
exports.setRefDefault = setRefDefault;
exports.setRefDefaultFromDocs = setRefDefaultFromDocs;

