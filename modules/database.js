const mysql = require("mysql2");
const fs = require("fs");

const connOptions = {
  host: "localhost",
  user: 'root',
  password: 'admin',
  database: 'scrapers',
};

const connection = mysql.createConnection(connOptions);

export default {
  async insert(table, values) {
    const sql = await this.makeQuery('insert', table, values);

    return await new Promise(function(resolve, reject) {
      connection.query(sql, [[Object.values(values)]], (err, resp) => {
        if (err) throw err;

        resolve(resp.insertId);
      });
    });
  },

  async query(sql) {
    return await new Promise(function(resolve, reject) {
      connection.query(sql, (err, resp) => {
        if (err) throw err;

        resolve(resp);
      });
    });
  },

  getConnection() {
    return connection;
  },

  async update(table, values, field = 'id', value) {
    let result = 0;
    const prime = '`';
    let sql = await this.makeQuery('update', table, values);
    sql += `WHERE ${prime}${field}${prime} = ? `;

    let data = Object.values(values);
    data.push(value);

    await new Promise(function(resolve, reject) {
      connection.query(sql, data, (err, resp) => {
        if (err) throw err;

        result = resp;
        resolve('updated');
      });
    });

    return result;
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
      delete obj.last_added;
      delete obj.last_modified;

      sql = `SELECT * FROM ${table} `;
      sql += await this.makeWhereQuery(obj);

      const newObj = await this.removeNullValues(obj);
      values = Object.values(newObj);
    } else {
      sql = `SELECT * FROM ${table} WHERE ${prime}${column}${prime} = ?`;
      values = [value];
    }

    await new Promise(function(resolve, reject) {
      connection.execute(sql, values, (err, resp) => {
        if (err) throw err;
        result = resp;
        resolve('findby');
      });
    });

    return result;
  },

  async latest(table, column = 'id') {

    let result;
    const sql = `select * from ${table} ORDER BY ${column} DESC LIMIT 1`;

    await new Promise(function(resolve, reject) {
      connection.execute(sql, (err, resp) => {
        if (err) throw err;
        result = resp;
        resolve('latest');
      });
    });

    return result;
  },

  async all(table, column = 'id') {

    let result;
    const sql = `select * from ${table} ORDER BY ${column} DESC`;

    await new Promise(function(resolve, reject) {
      connection.execute(sql, (err, resp) => {
        if (err) throw err;
        result = resp;
        resolve('latest');
      });
    });

    return result;
  },

  async updateOrCreate(table, values, findBy = null) {
    const exists = await this.findBy(table, findBy || values);

    if (exists.length) {
      delete values.created_at;
      delete values.last_added;
      return await this.update(table, values, 'id', exists[0].id);
    } else {
      return await this.insert(table, values);
    }
  },

  async delete(table, values) {
    let sql = `DELETE FROM ${table} `;
    sql += await this.makeWhereQuery(values);

    await new Promise(function(resolve, reject) {
      connection.query(sql, Object.values(values), (err, resp) => {
        if (err) throw err;

        resolve('deleted');
      });
    });
  },

  async makeWhereQuery(object) {
    let query = '';
    const prime = '`';
    let i = 0;
    Object.keys(object).forEach((index, value) => {
      if (index !== 'created_at' && index !== 'updated_at' && index !== 'last_added' && index !== 'last_modified') {
        if (!i) {
          query += `WHERE ${prime}${index}${prime} = ? `;
        } else if (object[index] === null) {
          query += `AND ${prime}${index}${prime} IS NULL `;
        } else {
          query += `AND ${prime}${index}${prime} = ? `;
        }

        i++;
      }
    });

    return query;
  },

  async makeQuery(type, table, fields) {
    let query, columns;
    const prime = '`';

    if (type === 'insert') {
      columns = Object.keys(fields).join('`, `');
      query = `INSERT INTO ${table} (${prime}${columns}${prime}) VALUES ?`
    } else if (type === 'update') {
      columns = Object.keys(fields).join('` = ?, `');
      query = `UPDATE ${table} SET ${prime}${columns}${prime} = ? `
    }

    return query;
  },

  async removeNullValues(obj) {
    for (var propName in obj) {
      if (obj[propName] === null) {
        delete obj[propName];
      }
    }
    return obj;
  }
};
