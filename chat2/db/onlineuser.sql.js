var OnlineUserSQL = {
    insert: 'INSERT INTO onlineuser (UserName,Server) VALUES(?,?)',
    queryAll: 'SELECT * FROM onlineuser',
    getUserbyName: 'SELECT * FROM onlineuser WHERE UserName = ? ',
    deleteUserbyName:'DELETE FROM onlineuser WHERE UserName=?',
    //getUserById: 'SELECT * FROM user WHERE ID = ? ',
  };
  module.exports = OnlineUserSQL;