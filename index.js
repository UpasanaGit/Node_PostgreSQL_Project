// Required modules 
const express = require("express");
const app = express();
const dblib = require("./dblib.js");
const path = require("path");
const multer = require("multer");
const upload = multer();

// Add middleware to parse default urlencoded form
app.use(express.urlencoded({
    extended: false
}));

// Setup EJS
app.set("view engine", "ejs");

// Enable CORS (see https://enable-cors.org/server_expressjs.html)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// Application folders
app.use(express.static("public"));

// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Setup routes
app.get("/", (req, res) => {
    //res.send("Root resource - Up and running!")
    res.render("home");
});

// get manageCust
app.get("/manageCust", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusId: "",
        cusFName: "",
        cusLName: "",
        cusState: "",
        cusSaleYTD: "",
        cusSalePrev: ""
    };
    res.render("manageCust", {
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer
    });
});

//post manageCust
app.post("/manageCust", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    dblib.findCustomer(req.body)
        .then(result => {
            res.render("manageCust", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: result,
                customer: req.body
            })
        })
        .catch(err => {
            res.render("manageCust", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: `Unexpected Error: ${err.message}`,
                customer: req.body
            });
        });
});

// get createCust
app.get("/createCust", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusid: "",
        cusfname: "",
        cuslname: "",
        cusstate: "",
        cussaleytd: "",
        cussaleprev: ""
    };
    res.render("createCust", {
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer,
        model: customer
    });
});

// post createCust
app.post("/createCust", async (req, res) => {
    dblib.insertCustomer(req.body)
        .then(result => {
            res.render("createCust", {
                type: "POST",
                result: result,
                model: req.body
            })
        })
        .catch(err => {
            res.render("createCust", {
                type: "POST",
                result: `Error on insert of customer id ${req.body.cusid}.  ${err.message}`,
                model: req.body
            });
        });
});

// get deleteCust
app.get("/deleteCust/:id", (req, res) => {
    dblib.getIndCustDetail(req.params.id)
        .then(result => {
            res.render("deleteDet", {
                model: result.result[0],
                type: "get"
            });
        })
        .catch(err => {
            return console.error(err.result);
        });
});

// post createCust
app.post("/deleteCust/:id", async (req, res) => {
    dblib.deleteCustomer(req.params.id)
        .then(result => {
            res.render("deleteDet", {
                type: "POST",
                result: result,
                model: req.body
            })
        })
        .catch(err => {
            res.render("deleteDet", {
                type: "POST",
                result: `Error on deletion of customer id ${req.params.id}.  ${err.message}`,
                model: req.body
            });
        });
});

// get editCust
app.get("/editCust/:id", (req, res) => {
    dblib.getIndCustDetail(req.params.id)
        .then(result => {
            res.render("updateCust", {
                model: result.result[0],
                type: "get"
            });
        })
        .catch(err => {
            return console.error(err.result);
        });
});

// post editCust
app.post("/editCust/:id", async (req, res) => {
    dblib.updateCustomer(req.body)
        .then(result => {
            res.render("updateCust", {
                type: "POST",
                result: result,
                model: req.body
            })
        })
        .catch(err => {
            res.render("updateCust", {
                type: "POST",
                result: `Error on updation of customer id ${req.params.id}.  ${err.message}`,
                model: req.body
            });
        });
});

//get exportData
app.get("/exportData", async (req, res) => {
    var message = "";
    const totRecs = await dblib.getTotalRecords();
    res.render("exportDet", {
        message: message,
        type: "get",
        totRecs: totRecs.totRecords
    });
});

// post exportData   
app.post("/exportData", async (req, res) => {
    var fileName = req.body.fname + ".txt";
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusId: "",
        cusFName: "",
        cusLName: "",
        cusState: "",
        cusSaleYTD: "",
        cusSalePrev: ""
    };
    dblib.findCustomer(customer)
        .then(result => {
            var output = "";
            result.result.forEach(customer => {
                // better to use pipe separated csv file because of amount value(which might consist of commas)
                output += `${customer.cusid}|${customer.cusfname}|${customer.cuslname}|${customer.cusstate}|${customer.cussaleytd}|${customer.cussaleprev}|\r\n`;
            });
            res.header("Content-Type", "text/csv");
            res.attachment(fileName);
            return res.send(output);
        })
        .catch(err => {
            res.render("exportDet", {
                type: "POST",
                totRecs: totRecs.totRecords,
                result: `Error: ${err.message}`
            });
        });
});


//get importData
app.get("/importData", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    res.render("importDet", {
        type: "get",
        totRecs: totRecs.totRecords
    });
});

// post importData
app.post("/importData", upload.single('filename'), async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    if (!req.file || Object.keys(req.file).length === 0) {
        message = "Error: Import file not uploaded";
        return res.send(message);
    };
    const buffer = req.file.buffer;
    const lines = buffer.toString().split(/\r?\n/);
    var successCount = 0;
    var failCount = 0;
    var errorList = [];
    var recCount = lines.length;
    (async () => {
        for (line of lines) {
            // better to use pipe separated csv file because of amount value(which might consist of commas)
            customer = line.split("|");
            const result = await dblib.insertCustomer(customer);
            if (result.trans !== "Error") {
                console.log(`Inserted successfully`);
                successCount++;
            } else {
                console.log(`Insert Error.  Error message: `, result.msg);
                failCount++;
                errorList.push("Customer ID: ", customer[0], " - ", result.msg);
            };
        };
        if (recCount == (failCount + successCount)) {
            message = `Processing Complete - Processed ${recCount} records`;
            res.render("importDet", {
                success: successCount,
                failed: failCount,
                totRecs: totRecs.totRecords,
                errors: JSON.stringify(errorList),
                type: "POST"
            });
        };
    })();
});

//get getReport
app.get("/getReport", (req, res) => {
    res.render("reports", {
        type: "get"
    });
});

//post getReport
app.post("/getReport", async (req, res) => {
    var repOpt = req.body.reportType;
    var flag = false;
    var message = "";
    var records;
    (async () => {
        if (repOpt === "1") {
            flag = true;
            const result = await dblib.getCustOrderByLName();
            if (result.trans === "Error") {
                message=result.msg;
            } else {
                records=result.data;
            };
        } else if (repOpt === "2") {
            flag = true;
            const result = await dblib.getCustOrderBySales();
            if (result.trans === "Error") {
                message = result.msg;
            } else {
                records = result.data;
            };
        } else if (repOpt === "3") {
            const totRecs = await dblib.getTotalRecords();
            if (totRecs.totRecords >= 3) {
                flag = true;
                const result = await dblib.getCustRandomThree();
                if (result.trans === "Error") {
                    message = result.msg;
                } else {
                    records = result.data;
                };
            } else {
                message = "Records are insufficient!";
            }
        }
        if (flag) {
            res.render("reports", {
                type: "POST",
                repType: repOpt,
                trans: "Success",
                msg: message,
                data: records
            });
        } else {
            res.render("reports", {
                type: "POST",
                repType: repOpt,
                trans: "Error",
                msg: message
            });
        };
    })();
});