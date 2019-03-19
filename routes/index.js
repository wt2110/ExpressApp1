var express = require('express');
var router = express.Router();
var db = require('../db');
var fs = require('fs');
var username = "";
var moment = require('moment');
/* GET home page. */
router.get('/', function(req, res) {
	res.render('login.html');
});

router.get('/modals.html', function(req, res) {
	res.render('modals.html');
});

router.get('/index.html', function(req, res) {

	res.render('index.html');
});

router.get('/upload.html', function(req, res) {
	res.render('upload.html');
});

router.get('/download.html', function(req, res) {
	res.render('download.html');
});

router.get('/tables.html', function(req, res) {
	res.render('tables.html');
});

router.get('/settings.html', function(req, res) {
	res.render('settings.html');
});

router.get('/callus.html', function(req, res) {
	res.render('callus.html');
});

router.get('/logout.html', function(req, res) {
	res.render('logout.html');
});

router.post('/login', function(req, res) {
	var password = req.body.password;
	username = req.body.username;
	console.log(req.body);
	var sql_pasd = "select password from [dbo].[user] where username = " + username;
	var sql_timedown = "select times from [dbo].[user] where username = " + username;
	db.query(sql_pasd, function(err, pasd) {
		if(err) {
			console.log(err);
			return;
		} else if(pasd.recordset[0].password.trim() == password.trim()) {
			db.query(sql_timedown, function(err, times) {
				if(err) {
					console.log(err);
					return;
				} else {
					var time = times.recordset[0].times;
					time++;
					var sql_timeup = "update [dbo].[user] set times = " + time + "where username =" + username;

					db.query(sql_timeup, function(err, ret) {
						if(err) {
							console.log(err);
							return;
						} else {
							res.send({
								err: false,
								recordset: pasd.recordset,
								recordsets: pasd.recordsets
							})

						}

					})
				}
			})
		} else {
			console.log(pasd.recordset[0].password == password);
			console.log(pasd.recordset[0].password);
			console.log(password);
			res.send({
				err: true
			})

		}
	})
});

router.post('/index', function(req, res) {
	var sql_user = "select count(*) as usernum from [dbo].[user]";
	var sql_dat = "select count(*) as datnum from [dbo].[tubedat]";
	var sql_times = "select times from [dbo].[user] where username = " + username;

	db.query(sql_user, function(err, usercnt) {
		if(err) {
			console.log("err");
			return;
		} else {

			db.query(sql_dat, function(err, datcnt) {
				if(err) {
					console.log(err);
					res.send({
						err: true,
						errMsg: err
					});
				} else {
					db.query(sql_times, function(err, time) {
						if(err) {
							console.log(err);
							res.send({
								err: true,
								errMsg: err
							});
						} else {
							var exist;
							fs.readFile('./public/config/config.txt', 'utf8', function(err, data) {
								if(!err)
									exist = "1";
								else
									exist = "0";
								console.log(exist);
								res.send({
									err: false,
									errMsg: err,
									times: time.recordset[0].times,
									usernum: usercnt.recordset[0].usernum,
									datnum: datcnt.recordset[0].datnum,
									exists: exist
								});
							});

						}
					})
				}
			});
		}
	});
});

router.post('/upload', function(req, res) {
	var sql_up = "";
	var data = req.body.datobj;
	var mydate = new Date();
	var intime = moment("20180302020202", "YYYYMMDDHHmmss");
	var outtime = moment("20180302020202", "YYYYMMDDHHmmss");
	var curtime = moment().format("YYYY-MM-DD HH:MM:SS");

	for(var i = 0; i < data.length; ++i) {
		var item = data[i];
		intime = moment(item.inTime, "YYYYMMDDHHmmss");
		outtime = moment(item.outTime, "YYYYMMDDHHmmss");
		var temp = intime.format("YYYY-MM-DD HH:mm:ss");
		sql_up += "insert into [dbo].[tubedat] values('" + item.tubeID + "','" + intime.format("YYYY-MM-DD HH:mm:ss") + "','" + item.inUser + "','" + outtime.format("YYYY-MM-DD HH:mm:ss") + "','" + item.outUser + "','" + curtime + "','" + username + "');";
	}
	db.query(sql_up, function(err, usercnt) {
		if(err) {
			console.log(err);
			return;
		} else {
			res.send({
				err:false
			});
		}
	}, true);
});

router.post('/download', function(req, res) {
	console.log("download");
	var config;
	fs.readFile('./public/config/config.txt', 'utf8', function(err, data) {
		console.log(data);
		if(err) {
			console.log(err);
		} else {
			config = data;
			res.send({
				config: config
			});
		}

	});

});

router.get('/getdata', function(req, res) {
	var draw = req.query.draw;
	var order = req.query.order['0']['column'];
	var orderdir = req.query.order['0']['dir'];
	var top = req.query.length;
	var page = req.query.start / top;
	var rown = top * (page);
	var sqlreq = "";
	if(req.query.from != "") {
		sqlreq = " and " + req.query.timeselect + " >'" + req.query.from + " 00:00:00'";
	}
	if(req.query.to != "") {
		sqlreq += " and " + req.query.timeselect + " <'" + req.query.to + " 00:00:00'";
	}
	if(req.query.user != "") {
		if(req.query.timeselect.trim()=="intime"){
			sqlreq += " and inuser ='" + req.query.user + " '";
		}
		else if(req.query.timeselect.trim()=="outtime"){
			sqlreq += " and outuser ='" + req.query.user + " '";
		}
		else if(req.query.timeselect.trim()=="uptime"){
			sqlreq += " and upuser ='" + req.query.user + " '";
		}
	}
	//var sql = "select count(*) as cnt from [dbo].[tubedat]";
	var ret = {};
	ret.draw = draw;
	if(orderdir == 'asc') orderdir = 'desc'
	else orderdir = 'asc';
	var odb = ' order by intime ' + orderdir
	var subqry = "SELECT ROW_NUMBER() OVER (" + odb + ") AS RowNumber";
	var qry = "select top (" + top + ") * from (" + subqry + ", * FROM [dbo].[tubedat]) as t" + " WHERE RowNumber >" + rown + sqlreq;
	var sql = "select count(*) as cnt from [dbo].[tubedat] where len(tubeid) >1" + sqlreq;
	console.log(qry);
	var sqlPromise = execSql(sql).then(function(result) {
		ret.recordsTotal = result[0].cnt;
		console.log(ret.recordsTotal);
		ret.recordsFiltered = result[0].cnt;
	});

	sqlPromise.then(function() {
		sqlPromise = execSql(qry).then(function(result) {
			ret.data = result;
			res.send(JSON.stringify(ret));
			return;
		});
	})
});

router.post('/save', function(req, res) {

	var setting = req.body;
	var username = setting.username;
	var sqlPromise;
	console.log("save");
	if(setting.username == 0) {
		console.log("登录超时");
		res.send({
			err: true
		});
	} else {
		var sql = "";
		if(setting.nickname) {
			var sql_1 = "update [dbo].[user] set nickname = '" + setting.nickname + "' where username = '" + username + "';"
			sql += sql_1;
		}
		if(setting.email) {
			var sql_2 = "update [dbo].[user] set email = '" + setting.email + "' where username ='" + username + "';"
			sql += sql_2;
		}
		if(setting.phone) {
			var sql_3 = "update [dbo].[user] set phone = '" + setting.phone + "' where username ='" + username + "';"
			sql += sql_3;
		}
		db.query(sql, function(err, update) {
			if(err) {
				console.log(err);
				return;
			} else if(setting.pasdold) {
				sql = "select password from [dbo].[user] where username ='" + username + "';";
				console.log(sql);
				db.query(sql, function(err, pasd) {
					if(err) {
						console.log(err);
						return;
					} else if(pasd.recordset[0].password.trim() == setting.pasdold) {
						sql = "update [dbo].[user] set password = '" + setting.pasdnew + "' where username='" + username + "'";
						console.log(sql);
						db.query(sql, function(err, cb) {
							if(err) {
								console.log(err);
								return;
							} else {
								console.log("更改密码成功");
							}

						});
					} else {
						console.log("密码错误");
						res.send({
							err: false,
							pasd: false
						});
					}
				});
			}

		}, true);
	}
	res.end;
});

function execSql(sql) {
	var execResult = new Promise(function(resolve, reject) {
		db.query(sql, function(err, result) {
			if(err) {
				console.log(err);
				return reject(err);
			} else {
				return resolve(result.recordset);
			}
		});
	});
	return execResult;
}
module.exports = router;