require("dotenv").config();
const {
    Pool
} = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const getTotalRecords = () => {
    sql = "SELECT COUNT(*) FROM customer";
    return pool.query(sql)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows[0].count
            }
        })
        .catch(err => {
            return {
                msg: `Error ${err.message}`
            }
        });
};

module.exports.getTotalRecords = getTotalRecords;

const findCustomer = (customer) => {
    var i = 1;
    params = [];
    sql = "SELECT * FROM customer WHERE true";

    // Check data provided and build query as necessary
    if (customer.cusId !== "") {
        params.push(parseInt(customer.cusId));
        sql += ` AND cusId = $${i}`;
        i++;
    };
    if (customer.cusFName !== "") {
        params.push(`${customer.cusFName}%`);
        sql += ` AND UPPER(cusFName) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusLName !== "") {
        params.push(`${customer.cusLName}%`);
        sql += ` AND UPPER(cusLName) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusState !== "") {
        params.push(`${customer.cusState}%`);
        sql += ` AND UPPER(cusState) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusSaleYTD !== "") {
        params.push(parseFloat(customer.cusSaleYTD));
        sql += ` AND cusSaleYTD >= $${i}`;
        i++;
    };
    if (customer.cusSalePrev !== "") {
        var value = parseFloat(customer.cusSalePrev);
        if (isNaN(value)) {
            value = "";
        }
        params.push(value);
        sql += ` AND cusSalePrev >= $${i}`;
        i++;
    };

    sql += ` ORDER BY cusId`;
    console.log("sql: " + sql);
    console.log("params: " + params);

    return pool.query(sql, params)
        .then(result => {
            return {
                trans: "success",
                result: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};

module.exports.findCustomer = findCustomer;

const insertCustomer = (customer) => {
    if (customer instanceof Array) {
        params = customer;
    } else {
        params = Object.values(customer);
    };
    const sql = `INSERT INTO customer (cusid, cusfname, cuslname, cusstate, cussaleytd, cussaleprev)
                 VALUES ($1, $2, $3, $4, $5, $6)`;
    return pool.query(sql, params)
        .then(res => {
            return {
                trans: "success",
                msg: `Customer id ${params[0]} successfully inserted.`
            };
        })
        .catch(err => {
            return {
                trans: "Error",
                msg: `Error on insert of customer id ${params[0]}.  ${err.message}`
            };
        });
};

module.exports.insertCustomer = insertCustomer;


const getIndCustDetail = (id) => {
    sql = "SELECT * FROM customer WHERE cusid = $1";
    return pool.query(sql, [id])
        .then(result => {
            return {
                trans: "success",
                result: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};

module.exports.getIndCustDetail = getIndCustDetail;

const deleteCustomer = (id) => {
    const sql = `DELETE FROM customer WHERE cusid = $1`;
    return pool.query(sql, [id])
        .then(res => {
            return {
                trans: "success",
                msg: `Customer id ${id} successfully deleted.`
            };
        })
        .catch(err => {
            return {
                trans: "Error",
                msg: `Error on deletion of customer id ${id}.  ${err.message}`
            };
        });
};

module.exports.deleteCustomer = deleteCustomer;


const updateCustomer = (customer) => {
    if (customer instanceof Array) {
        params = customer;
    } else {
        params = Object.values(customer);
    };
    const sql = `UPDATE customer SET cusfname = $2, cuslname = $3, cusstate = $4, cussaleytd = $5,
                 cussaleprev = $6 WHERE (cusid = $1)`;
    return pool.query(sql, params)
        .then(res => {
            return {
                trans: "success",
                msg: `Customer id ${params[0]} successfully updated.`
            };
        })
        .catch(err => {
            return {
                trans: "Error",
                msg: `Error on updation of customer id ${params[0]}.  ${err.message}`
            };
        });
};

module.exports.updateCustomer = updateCustomer;

const getCustOrderByLName = () => {
    const sql = "SELECT * FROM customer ORDER BY cuslname asc";
    return pool.query(sql)
        .then(report => {
            return {
                trans: "success",
                data: report.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                msg: `${err.message}`
            }
        });
};
module.exports.getCustOrderByLName = getCustOrderByLName;


const getCustOrderBySales = () => {
    const sql = "SELECT * FROM customer ORDER BY cussaleytd desc";
    return pool.query(sql)
        .then(report => {
            return {
                trans: "success",
                data: report.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                msg: `${err.message}`
            }
        });
};

module.exports.getCustOrderBySales = getCustOrderBySales;

const getCustRandomThree = () => {
    const sql = "SELECT * FROM customer ORDER BY RANDOM() LIMIT 3";
    return pool.query(sql)
        .then(report => {
            return {
                trans: "success",
                data: report.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                msg: `${err.message}`
            }
        });
};

module.exports.getCustRandomThree = getCustRandomThree;