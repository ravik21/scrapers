const mysql = require("mysql2");
const fs = require("fs");

const connOptions = {
  host: "localhost",
  user: 'root',
  password: 'admin',
  database: 'voyage_trends_scrapper',
};

const connection = mysql.createConnection(connOptions);

export default {
  async insert(sql, values) {
    let rows = await new Promise((resolve,reject)=>{
      connection.query(sql,[values],function(err, rows) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  async findBy(table, column = 'id', value) {
    let result;
    let values = [];
    let sql = '';
    const prime = '`';

    if (typeof column === 'object') {
      const obj = Object.assign({}, column);
      delete obj.created_at;
      delete obj.updated_at;

      sql = `SELECT * FROM ${table} `;
      sql += await this.makeWhereQuery(obj);
      values = Object.values(obj);
    } else {
      sql = `SELECT * FROM ${table} WHERE ${prime}${column}${prime} = ?`;
      values = [value];
    }

    return await new Promise(function(resolve, reject) {
      connection.execute(sql, values, (err, resp) => {
        if (err) throw err;
        resolve(resp);
      });
    });
  },

  async updateOrCreate(table, values, findBy = null) {
    const exists = await this.findBy(table, findBy || values);

    if (exists.length) {
      delete values.created_at;
      return await this.update(table, values, 'id', exists[0].id);
    } else {
      return await this.insert(table, values);
    }
  },

  async makeWhereQuery(object) {
    let query = '';
    const prime = '`';
    let i = 0;
    Object.keys(object).forEach((index, value) => {
      if (index !== 'created_at' && index !== 'updated_at') {
        if (!i) {
          query += `WHERE ${prime}${index}${prime} = ? `;
        } else {
          query += `AND ${prime}${index}${prime} = ? `;
        }

        i++;
      }
    });

    return query;
  },

  async query(sql) {
    return await new Promise(function(resolve, reject) {
      connection.query(sql, (err, resp) => {
        if (err) throw err;

        resolve(resp);
      });
    });
  },
}
