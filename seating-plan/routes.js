var http = require("http"),
    path = require("path"),
    util = require("util"),
    fs = require("fs"),
    express = require("express"),
    formidable = require("formidable"),
    _ = require("underscore"),
    jade = require("jade");

var seating = require("./pdf/seating"),
    parseFields = require("./helpers").parseFields;

// var log = function () {};
var log = console.log.bind(console);

module.exports = function (app) {
    var mountPath = app.mountPath;
    
    app.get("/", function (req, res) {
        //res.send("hello");
        res.send(jade.compile(fs.readFileSync(path.join(__dirname, "views", "index.jade")))({
            mountPath: mountPath,
            mountPathPublic: mountPath
        }));
    });

    app.post("/", function (req, res) {
        var form;
        res.header("Content-Type", "text/html");
        form = new formidable.IncomingForm();
        log("form post called");
        form.parse(req, function (err, fields, files) {
            log("form parsed");
            if (files.seatids.size === 0) {
                res.end(JSON.stringify({
                    error: "SeatIDs input file is empty."
                }));
            }
            parseFields(log, fields, function (errors, seatingPlan, settings) {
                var e;
                if (!errors) {
                    seating.generate(
                        log,
                        files.seatids.path,
                        "/tmp",
                        seatingPlan,
                        settings,
                        function (err, filenames) {
                            if (err) {
                                return res.end(JSON.stringify({
                                    error: err.message
                                }));
                            }
                            saveToS3(filenames.plan_pdf, function (err, s3_plan_pdf) {
                                if (err) return res.end(JSON.stringify({ error: err.message }));
                                saveToS3(filenames.stickers_pdf, function(err, s3_stickers_pdf) {
                                    if (err) return res.end(JSON.stringify({ error: err.message }));
                                    log("response", s3_plan_pdf, s3_stickers_pdf);
                                    res.end(JSON.stringify({
                                        plan_pdf: s3_plan_pdf,
                                        stickers_pdf: s3_stickers_pdf
                                    }));
                               });
                            });
                        },
                        "",
                        "tmp"
                    );
                } else {
                    log(errors);
                    res.end(JSON.stringify({
                        error: _.pluck(errors, "message").join("\n\t")
                    }));
                }
            });
        });
    });
};

var S3 = require("aws-sdk/clients/s3");
function saveToS3(filename, callback) {
    var s3 = new S3();
    log("saveToS3", filename);
    s3.putObject({
        Bucket: "roughregister-pdf-store",
        Key: filename,
        Body: fs.createReadStream("/tmp/" + filename),
        ACL: "public-read"
    }, function(err, data) {
        if (err) return callback(err);
        log("Successfully uploaded " + filename + " to s3");
        callback(null, "https://s3.amazonaws.com/roughregister-pdf-store/" + filename);
    });
}