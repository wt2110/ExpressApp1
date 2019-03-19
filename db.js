var sql=require('mssql');


const config = {
  user: 'sa',
  password: 'sa',
  server: 'localhost', 
  database: 'wt'  
}

var connPoolPromise=null;
function getConnPoolPromise() {
  if (connPoolPromise) return connPoolPromise;

  connPoolPromise = new Promise(function (resolve, reject) {
    var conn = new sql.ConnectionPool(config);
    conn.on('close', function () {
      connPoolPromise = null;
    });

    conn.connect().then(function (connPool) {
      return resolve(connPool);
    }).catch(function (err) {
      connPoolPromise = null;
      return reject(err);
    });
  });

  return connPoolPromise;
}

exports.query = function (sqlQuery, callback, multi) {
  getConnPoolPromise().then(function (connPool) {
      var sqlRequest = new sql.Request(connPool);
      if (multi) {
          sqlRequest.multiple = true;
      }
    return sqlRequest.query(sqlQuery);

  }).then(function (result) {
    callback(null, result);
  }).catch(function (err) {
    callback(err);
  });

};

function getReq() {
    //if(rp) return rp;
    return rp = new Promise(function (resolve, reject) {
        getConnection().then((conn) => {
            resolve(new sql.Request(conn));
        }).catch((err) => {
            rp = null;
            reject(err);
        });
    })
}