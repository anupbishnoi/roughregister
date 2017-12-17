/*
Admission Test Seating Plan Generator - For Vidyamandir Classes
By Anup Bishnoi (anupbishnoi@gmail.com)
*/

(function () {
    "use strict";
    /*jshint maxparams:7, loopfunc:true, camelcase:false, quotmark:false, white:false */

    var PDFDocument, getInput, log, logo_file, makePlan, makeStickers;

    PDFDocument = require('pdfkit');

    logo_file = __dirname + "/vmclogo.jpg";

    log = function() {};

    getInput = require("./helpers").getInput;

    exports.generate = function(logger, seatids_input, output_folder, seating_plan, settings, callback, mountPathPublic, splitOnPath) {
        var add_buffer_seatids, center, plan, plan_path, sanitizeInput, stickers, stickers_path, split_path;
        if (typeof logger === 'function') {
            log = logger;
        }
        mountPathPublic = mountPathPublic || "";
        splitOnPath = splitOnPath || "public";
        log("Seat IDs input file: " + seatids_input);
        log("Seating Plan: " + (JSON.stringify(seating_plan)));
        log("Graphic Settings: " + (JSON.stringify(settings)));
        center = seating_plan.center.trim().replace(/\s+/g, "_");
        plan_path = "" + output_folder + "/SeatingPlan_" + seating_plan.studying_in + "_" + center + ".pdf";
        stickers_path = "" + output_folder + "/Stickers_" + seating_plan.studying_in + "_" + center + ".pdf";
        split_path = "/" + splitOnPath + "/";
        log("Output files: " + plan_path + " and " + stickers_path);
        plan = new PDFDocument({
            margin: 0,
            info: {
                Title: "Seating Plan for Admission Test in " + seating_plan.center,
                Author: 'Anup Bishnoi'
            },
            size: 'A4'
        });
        stickers = new PDFDocument({
            margin: 0,
            info: {
                Title: "Stickers for Admission Test in " + seating_plan.center,
                Author: 'Anup Bishnoi'
            },
            size: 'A4'
        });
        sanitizeInput = function(lines, thenWhat) {
            var column, data, field, index, line, seatid_index, _i, _j, _len, _len1, _ref, _ref1;
            seatid_index = 0;
            if (lines.length === 0) {
                return thenWhat(lines, 0);
            }
            _ref = lines[0].split(",");
            for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                column = _ref[index];
                if (column.search(/seat/i) !== -1) {
                    seatid_index = index;
                    break;
                }
            }
            log("Column index #" + seatid_index + " contains Seat IDs");
            data = [];
            _ref1 = lines.slice(1);
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                line = _ref1[_j];
                if (line.indexOf(",") !== -1) {
                    data.push((function() {
                        var _k, _len2, _ref2, _results;
                        _ref2 = line.split(",");
                        _results = [];
                        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                            field = _ref2[_k];
                            _results.push(field.trim());
                        }
                        return _results;
                    })());
                }
            }
            data.sort(function(a, b) {
                return parseInt(a[seatid_index].match(/\d+$/), 10) - parseInt(b[seatid_index].match(/\d+$/), 10);
            });
            return thenWhat(data, seatid_index);
        };
        add_buffer_seatids = function(buffer, data, seatid_index) {
            var arr, i, _i;
            if (data.length === 0) {
                return data;
            }
            for (i = _i = 0; 0 <= buffer ? _i < buffer : _i > buffer; i = 0 <= buffer ? ++_i : --_i) {
                arr = [];
                arr[seatid_index] = data[data.length - 1][seatid_index].replace(/\d+$/, function(id) {
                    return 1 + parseInt(id, 10);
                });
                data.push(arr);
            }
            return data;
        };
        return getInput(seatids_input, sanitizeInput, function(data, seatid_index) {
            var allotted, buffer, how_many, index, line, per_room, r, required, rooms, _i, _j, _len, _ref, _ref1;
            seating_plan.entries = [];
            seating_plan.ids_and_rooms = [];
            rooms = seating_plan.roomlist;
            per_room = seating_plan.per_room;
            buffer = seating_plan.buffer;
            try {
                if (data.length === 0) {
                    throw new Error("No SeatID records in file.");
                }
                data = add_buffer_seatids(buffer, data, seatid_index);
                required = Math.ceil(data.length / per_room);
                log("Number of available rooms: " + rooms.length);
                log("Number of students: " + data.length);
                log("Rooms required: " + required);
                if (rooms.length < required) {
                    throw new Error("Rooms not enough. Need " + (required - rooms.length) + " more.");
                } else if (rooms.length > required) {
                    how_many = rooms.length - required;
                    throw new Error(("" + how_many + " " + (how_many === 1 ? "room is" : "rooms are") + " extra.") + ("Please remove " + (how_many === 1 ? "it" : "them") + " first."));
                } else {
                    for (index = _i = 0, _ref = data.length; 0 <= _ref ? _i < _ref : _i > _ref; index = _i += per_room) {
                        allotted = rooms[index / per_room];
                        seating_plan.entries.push({
                            from: data[index][seatid_index],
                            to: data[Math.min(index + per_room, data.length) - 1][seatid_index],
                            room: allotted.room,
                            floor: allotted.floor
                        });
                        r = seating_plan.entries[seating_plan.entries.length - 1];
                        log("Room " + r.room + " (" + r.floor + ") has " + r.from + " - " + r.to);
                        _ref1 = data.slice(index, index + per_room);
                        for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
                            line = _ref1[_j];
                            seating_plan.ids_and_rooms.push({
                                id: line[seatid_index],
                                room: allotted.room
                            });
                        }
                    }
                }
                return makePlan(plan, seating_plan, settings, function(plan) {
                    return plan.write(plan_path, function() {
                        log("" + plan_path + " saved.");
                        return makeStickers(stickers, seating_plan, settings, function(stickers) {
                            return stickers.write(stickers_path, function() {
                                var filenames;
                                log("" + stickers_path + " saved.");
                                var publicPlanPath = plan_path.split(split_path)[1];
                                var publicStickersPath = stickers_path.split(split_path)[1];
                                filenames = {
                                    plan_pdf: mountPathPublic + (publicPlanPath || plan_path),
                                    stickers_pdf: mountPathPublic + (publicStickersPath || stickers_path)
                                };
                                return callback(void 0, filenames);
                            });
                        });
                    });
                });
            } catch (err) {
                log(err);
                return callback(err);
            }
        });
    };

    makeStickers = function(doc, seating_plan, settings, thenWhat) {
        var doc_height, doc_width, entry, entry_left, entry_top, index, margin_h, margin_v, n_perpage, pageno, pages, roomno_fontsize, roomno_left, roomno_margin, roomno_top, seatid_fontsize, sticker_width, stickers_left, stickers_top, total_columns, total_rows, _i, _j, _len, _ref;
        doc_width = settings.doc_width, doc_height = settings.doc_height, stickers_left = settings.stickers_left, stickers_top = settings.stickers_top, sticker_width = settings.sticker_width;
        doc_width = parseInt(doc_width, 10) || 554;
        doc_height = parseInt(doc_height, 10) || 809;
        stickers_top = parseInt(stickers_top, 10) || 74;
        stickers_left = parseInt(stickers_left, 10) || 25;
        sticker_width = parseInt(sticker_width, 10) || 110;
        log("Doc width: " + doc_width);
        log("Doc height: " + doc_height);
        log("Stickers page left margin: " + stickers_left);
        log("Stickers page top margin: " + stickers_top);
        log("Sticker width: " + sticker_width);
        total_columns = 4;
        total_rows = 20;
        seatid_fontsize = 19;
        roomno_fontsize = seatid_fontsize / 2;
        roomno_margin = 2;
        margin_h = (doc_width - total_columns * sticker_width) / (total_columns - 1);
        margin_v = (doc_height - stickers_top - total_rows * seatid_fontsize) / (total_rows - 1);
        log("Horizontal margin between stickers: " + margin_h);
        log("Vertical margin between stickers: " + margin_v);
        n_perpage = total_rows * total_columns;
        pages = Math.ceil(seating_plan.ids_and_rooms.length / n_perpage);
        log("Number of sticker pages: " + pages);
        doc.font("Times-Roman");
        for (pageno = _i = 0; 0 <= pages ? _i < pages : _i > pages; pageno = 0 <= pages ? ++_i : --_i) {
            if (pageno > 0) {
                doc.addPage();
            }
            _ref = seating_plan.ids_and_rooms.slice(pageno * n_perpage, (pageno + 1) * n_perpage);
            for (index = _j = 0, _len = _ref.length; _j < _len; index = ++_j) {
                entry = _ref[index];
                doc.fillColor("black");
                doc.fontSize(seatid_fontsize);
                entry_left = stickers_left + (index % 4) * (sticker_width + margin_h);
                entry_top = stickers_top + Math.floor(index / 4) * (seatid_fontsize + margin_v);
                doc.text(entry.id, entry_left, entry_top);
                doc.fillColor("gray");
                doc.fontSize(roomno_fontsize);
                roomno_left = entry_left + sticker_width - doc.widthOfString(entry.room);
                roomno_top = entry_top + seatid_fontsize - roomno_fontsize;
                doc.text(entry.room, roomno_left, roomno_top);
                doc.strokeColor("gray");
                doc.roundedRect(roomno_left - roomno_margin, roomno_top - roomno_margin, doc.widthOfString(entry.room) + 2 * roomno_margin, roomno_fontsize + 2 * roomno_margin, 1);
                doc.stroke();
            }
        }
        return thenWhat(doc);
    };

    makePlan = function(doc, seating_plan, settings, thenWhat) {
        var calculatedvalue, column1, column2, column3, column_proportions, decimalvalue, doc_height, doc_width, entry, entry_height, font, font_size, heading_font, heading_fontsize, i, index, logo, logo_header, margin, max_height, message, message_height, n, n_maxperpage, n_perpage, n_sum, n_thispage, num, pageno, pages, proportion_sum, row, row_max_height, row_min_height, start_entry, sum, table, title_fontsize, titlerow, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
        if (settings == null) {
            settings = {};
        }
        doc_width = settings.doc_width, doc_height = settings.doc_height, font = settings.font, heading_font = settings.heading_font, font_size = settings.font_size, title_fontsize = settings.title_fontsize, heading_fontsize = settings.heading_fontsize, margin = settings.margin, logo = settings.logo, titlerow = settings.titlerow, row_min_height = settings.row_min_height, row_max_height = settings.row_max_height, table = settings.table, column_proportions = settings.column_proportions, logo_header = settings.logo_header;
        margin = parseInt(margin, 10) || 15;
        doc_width = 600;
        doc_height = 841;
        font_size = parseInt(font_size, 10) || 16;
        row = {};
        row.min_height = parseInt(row_min_height, 10) || 30;
        row.max_height = parseInt(row_max_height, 10) || 60;
        font = font || "Times-Roman";
        heading_font = heading_font || "Times-Bold";
        if (logo == null) {
            logo = {};
        }
        if ((_ref = logo.file) == null) {
            logo.file = logo_file;
        }
        if ((_ref1 = logo.width) == null) {
            logo.width = 300;
        }
        logo.height = logo_header === "yes" ? 80.6 : -1 * margin;
        if (titlerow == null) {
            titlerow = {};
        }
        if ((_ref2 = titlerow.height) == null) {
            titlerow.height = 40;
        }
        if ((_ref3 = titlerow.fillColor) == null) {
            titlerow.fillColor = "#ccc";
        }
        if (table == null) {
            table = {};
        }
        if ((_ref4 = table.width) == null) {
            table.width = 530;
        }
        if ((_ref5 = table.corner) == null) {
            table.corner = 6;
        }
        if (column_proportions == null) {
            column_proportions = [5, 3, 5];
        }
        title_fontsize = font_size * 1.1;
        heading_fontsize = font_size * 1.4;
        message_height = seating_plan.complementary_room ? 3 * heading_fontsize + 2 * margin : -1 * margin;
        row.odd = "#fff";
        row.even = "#ddd";
        row.corner = table.corner / 2;
        n = seating_plan.entries.length;
        log("Number of entries: " + n);
        table.max_heights = [];
        n_maxperpage = [];
        table.max_heights[0] = doc_height - margin - logo.height - margin - heading_fontsize - margin - titlerow.height - margin - message_height - margin;
        log(doc_height, margin, logo.height, titlerow.height, message_height, table.max_heights[0]);
        decimalvalue = table.max_heights[0] / row.min_height;
        n_maxperpage[0] = Math.floor(decimalvalue);
        if (n_maxperpage[0] < n) {
            table.max_heights[1] = doc_height - titlerow.height - margin - message_height - margin;
            decimalvalue = table.max_heights[1] / row.min_height;
            n_maxperpage[1] = Math.floor(decimalvalue);
            log(table.max_heights[1], decimalvalue, n_maxperpage[1]);
            n_sum = n_maxperpage[0] + n_maxperpage[1];
            i = 2;
            while (n_sum < n) {
                table.max_heights[i] = doc_height - titlerow.height;
                decimalvalue = table.max_heights[i] / row.min_height;
                n_maxperpage[i] = Math.floor(decimalvalue);
                log(table.max_heights[i], decimalvalue, n_maxperpage[i]);
                n_sum += n_maxperpage[i];
            }
        }
        if (table.max_heights.length > 1) {
            table.max_heights.push(table.max_heights.splice(1, 1)[0]);
            n_maxperpage.push(n_maxperpage.splice(1, 1)[0]);
        }
        log("Maximum table heights: " + (JSON.stringify(table.max_heights)));
        log("Max entries per page: " + (JSON.stringify(n_maxperpage)));
        pages = n_maxperpage.length;
        log("Number of pages required: " + pages);
        sum = function(arr) {
            if (arr.length > 0) {
                return arr.reduce(function(t, s) {
                    return t + s;
                });
            } else {
                return 0;
            }
        };
        entry_height = calculatedvalue = sum(table.max_heights) / n;
        entry_height = Math.max(row.min_height, entry_height);
        entry_height = Math.min(row.max_height, entry_height);
        log("Each entry's height: " + entry_height + " (" + calculatedvalue + ")");
        n_perpage = [];
        _ref6 = table.max_heights;
        for (i = _i = 0, _len = _ref6.length; _i < _len; i = ++_i) {
            max_height = _ref6[i];
            n_perpage.push(Math.min(n_maxperpage[i], Math.ceil(max_height / entry_height)));
        }
        log("Number of entries per page: " + (JSON.stringify(n_perpage)));
        proportion_sum = 0;
        for (_j = 0, _len1 = column_proportions.length; _j < _len1; _j++) {
            num = column_proportions[_j];
            proportion_sum += num;
        }
        _ref7 = (function() {
            var _k, _results;
            _results = [];
            for (i = _k = 0; _k < 3; i = ++_k) {
                _results.push({
                    width: column_proportions[i] * table.width / proportion_sum
                });
            }
            return _results;
        })(), column1 = _ref7[0], column2 = _ref7[1], column3 = _ref7[2];
        table.left = doc_width / 2 - table.width / 2;
        if (logo_header === "yes") {
            doc.image(logo.file, doc_width / 2 - logo.width / 2, margin, {
                fit: [logo.width, logo.height]
            });
        }
        doc.font(heading_font).fontSize(heading_fontsize);
        doc.text("" + seating_plan.studying_in, table.left, margin + logo.height + margin, {
            width: table.width,
            align: "center"
        });
        for (pageno = _k = 0; 0 <= pages ? _k < pages : _k > pages; pageno = 0 <= pages ? ++_k : --_k) {
            if (pageno > 0) {
                doc.addPage();
            }
            if (pageno === 0) {
                n_thispage = Math.min(n_perpage[pageno], n);
            } else {
                n_thispage = Math.min(n_perpage[pageno], n - sum(n_perpage.slice(0, +(pageno - 1) + 1 || 9e9)));
            }
            log("Number of entries on page #" + (pageno + 1) + ": " + n_thispage);
            table.height = entry_height * n_thispage;
            titlerow.top = margin + (pageno === 0 ? logo.height + margin : 0) + (pageno === 0 ? heading_fontsize + margin : 0);
            titlerow.text_top = titlerow.top + titlerow.height / 2 - title_fontsize / 2 + 2;
            table.top = titlerow.top + titlerow.height;
            doc.roundedRect(table.left, titlerow.top, table.width, titlerow.height, table.corner).fillAndStroke(titlerow.fillColor, "black");
            doc.roundedRect(table.left, table.top, table.width, table.height, table.corner).fillAndStroke(row.odd, "black");
            doc.fillColor("black");
            doc.strokeColor("black");
            doc.font(font).fontSize(title_fontsize);
            doc.text("Seat IDs", table.left, titlerow.text_top, {
                width: column1.width,
                align: "center"
            });
            doc.text("Room No.", table.left + column1.width, titlerow.text_top, {
                width: column2.width,
                align: "center"
            });
            doc.text("Floor", table.left + table.width - column3.width, titlerow.text_top, {
                width: column3.width,
                align: "center"
            });
            doc.fontSize(font_size);
            start_entry = pageno === 0 ? 0 : sum(n_perpage.slice(0, +(pageno - 1) + 1 || 9e9));
            _ref8 = seating_plan.entries.slice(start_entry, start_entry + n_thispage);
            for (index = _l = 0, _len2 = _ref8.length; _l < _len2; index = ++_l) {
                entry = _ref8[index];
                entry.top = table.top + index * entry_height;
                entry.text_top = entry.top + entry_height / 2 - font_size / 2 + 2;
                if (index % 2) {
                    doc.save();
                    doc.roundedRect(table.left + 1, entry.top + 1, table.width - 2, entry_height - 2, row.corner).fill(row.even);
                    doc.restore();
                }
                doc.text("" + entry.from + "    -    " + entry.to, table.left, entry.text_top, {
                    width: column1.width,
                    align: "center"
                });
                doc.text("" + entry.room, table.left + column1.width, entry.text_top, {
                    width: column2.width,
                    align: "center"
                });
                doc.text("" + entry.floor, table.left + table.width - column3.width, entry.text_top, {
                    width: column3.width,
                    align: "center"
                });
            }
            doc.save().lineWidth(0.5).rect(table.left + column1.width, table.top, column2.width, table.height).stroke().restore();
            if (seating_plan.complementary_room) {
                message = "Students without a Roll Number / Seat ID / Admit Card\n" + "or who have a different Test Centre\n" + ("can sit in Room Number " + seating_plan.complementary_room);
                doc.text(message, table.left, table.top + table.height + margin, {
                    width: table.width,
                    align: "center",
                    lineGap: 8
                });
            }
        }
        return thenWhat(doc);
    };
}());
