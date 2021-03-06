const mysql = require('mysql');



class database {
	constructor(a) {
		this.tables = "";
		this.sql = `SELECT * FROM ${this.tables}`;
		this.type = "none";
		this.isField = false;
		this.whereQ = "none";
		this.likeQ = "none";
		this.sortQ = "none";
		this.delQ = false;
		this.upQ = false;
		this.addQ = false;
		this.countQ = false;
		this.isSqlQ = false;
		this.connection = mysql.createConnection(a);
	}
	table(b) {
		this.tables = b;
		this.type = "none";
		this.isField = false;
		this.whereQ = "none";
		this.likeQ = "none";
		this.sortQ = "none";
		this.delQ = false;
		this.upQ = false;
		this.addQ = false;
		this.countQ = false;
		this.isSqlQ = false;
		this.sql = `SELECT * FROM ${this.tables}`;
		return this;
	}
	count() {
		this.sql = `SELECT COUNT(*) FROM ${this.tables}`
		this.countQ = true;
		this.type = "count"
		return this;
	}
	sqlQuery(sql, type) {
		this.sql = sql
		this.isSqlQ = true;
		let tp = this.sql.substr(0, 2)
		if (type) {
			this.type = type;
		} else {
			if (tp == "DE") {
				this.type = "del"
			} else if (tp == "IN") {
				this.type = "add"
			} else if (tp == "UP") {
				this.type = "updata"
			} else if (/count/.test(tp) | /COUNT/.test(tp)) {
				this.type = "count"
			} else {
				this.type = "none"
			}
		}
		return this.get()
	}
	where(params) {
		let needs = "";
		let i = 0;
		for (let key of Object.keys(params)) {
			needs += `${key} = '${params[key]}'`
			i++;
			if (i < Object.keys(params).length) {
				needs += " AND "
			}
		}
		this.whereQ = " WHERE " + needs;
		// console.log(this.sql)
		return this;
	}
	sort(params) {
		let needs = "";
		let i = 0;
		for (let key of Object.keys(params)) {
			needs += `${key} ${params[key]}`
			i++;
			if (i < Object.keys(params).length) {
				needs += ","
			}
		}
		this.sortQ = " ORDER BY " + needs;
		// console.log(this.sql)
		return this;
	}
	field(array) {
		let needs = "";
		array.forEach((item, index) => {
			needs += item
			if (index < array.length - 1) {
				needs += ","
			}
		})
		this.isField = true;
		this.sql = `SELECT ${needs} FROM ${this.tables}`;
		// console.log(this.sql)
		return this;
	}
	del() {
		this.sql = `DELETE FROM ${this.tables}`
		this.type = "del"
		this.delQ = true;
		return this;
	}
	like(array) {
		let needs = "";
		array.forEach((item, index) => {
			let query_like = "";
			if (item[2] == "top") {
				query_like = `'${item[1]}%'`
			} else if (item[2] == "end") {
				query_like = `'%${item[1]}'`
			} else {
				query_like = `'%${item[1]}%'`
			}
			needs += `${item[0]} LIKE ` + query_like
			if (index < array.length - 1) {
				needs += " AND "
			}
		})

		this.likeQ = " WHERE " + needs;
		// console.log(this.sql)
		return this;
	}
	updata(params) {
		let needs = "";
		let values = ""
		let i = 0;
		for (let key of Object.keys(params)) {
			needs += `${key} = '${params[key]}'`
			i++;
			if (i < Object.keys(params).length) {
				needs += ","
			}
		}
		values = "VALUES(" + values + ")"
		this.sql = `UPDATE ${this.tables} SET ${needs}`
		this.type = "updata"
		this.upQ = true;
		return this;
	}
	add(params, isIgnore) {
		let needs = "";
		let values = ""
		let i = 0;
		for (let key of Object.keys(params)) {
			needs += `${key}`
			values += `'${params[key]}'`
			i++;
			if (i < Object.keys(params).length) {
				needs += ","
				values += ","
			}
		}
		needs = "(" + needs + ")"
		values = "VALUES(" + values + ")";
		if (isIgnore === true) {
			this.sql = `INSERT IGNORE INTO ${this.tables}${needs} ${values}`
		} else {
			this.sql = `INSERT INTO ${this.tables}${needs} ${values}`
		}
		this.type = "add"
		this.addQ = true
		return this;
	}
	get() {
		let sqlQ = ""
		if (this.isSqlQ) {
			sqlQ = this.sql;
			this.isSqlQ = false;
		} else {
			if (this.delQ | this.upQ | this.addQ | this.isField | this.countQ) {
				this.delQ = false
				this.upQ = false;
				this.isField = false;
				this.addQ = false;
				this.countQ = false;
				sqlQ = this.sql;
			} else {
				sqlQ = `SELECT * FROM ${this.tables}`;
			}
			if (this.whereQ != "none") {
				sqlQ += this.whereQ;
			}

			if (this.likeQ != "none") {
				sqlQ += this.likeQ
			}

			if (this.sortQ != "none") {
				sqlQ += this.sortQ
			}

		}
		this.connection.connect()
		this.table(this.tables)
		return new Promise(resolve => {


			this.connection.query(sqlQ, (err, result) => {
				if (err) {
					let res = {}
					switch (err.code) {
						case "ER_DUP_ENTRY": {
							res = {
								code: err.sqlState,
								msg: "???????????????"
							}
							break;
						}
						default: {
							res = {
								code: err.sqlState,
								msg: err.message
							}
							break;
						}
					}
					this.connection.end();
					resolve(res)
				} else {
					this.connection.end();
					const dataR = JSON.parse(JSON.stringify(result))
					let res = {
						code: 0,
						msg: "SUCCESS",
						data: dataR
					}
					switch (this.type) {
						case "updata": {
							let datas = dataR.message.split(" ")
							res.data = {
								"rowsMatched": datas[2],
								"changed": datas[5],
								"warnings": datas[8]
							}
							res.updata = `??????${datas[2]}?????????,${datas[5]}?????????,??????${datas[8]}?????????`;
							break;
						}
						case "del": {
							res.data = {
								del: dataR.affectedRows
							}
							res.del = `??????${dataR.affectedRows}?????????`;
							break;
						}
						case "count": {
							res.data = {
								count: dataR[0]["COUNT(*)"]
							}
							res.count = `?????????${dataR[0]["COUNT(*)"]}?????????`
							break;
						}
						case "add": {
							res.data = {
								add: dataR.affectedRows
							}
							res.add = `??????${dataR.affectedRows}?????????`;
							break;
						}
						default: {
							break;
						}

					}
					resolve(res)
				}
			});
		})
	}
}



module.exports = database
