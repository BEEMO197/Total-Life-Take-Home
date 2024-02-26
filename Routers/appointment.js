const sqlite = require('sqlite3').verbose();
const express = require('express');
const url = require('url');
const { isDate } = require('util/types');
const router = express.Router();

const appointmentDB = new sqlite.Database('./Databases/appointments.db', sqlite.OPEN_READWRITE, (err) =>{
    if(err) return console.error(err.message);

    console.log("Success");
});

// appointmentDB.run('CREATE TABLE appointment(appointment_id, patient_id, clinician_id, cost, appointment_date, appointment_time, appointment_status)');

router.get("/", (req, res) =>{
    try {
        
        sql = "SELECT * FROM appointment"
        // Create a query object that parses the url for params
        const queryObject = url.parse(req.url, true).query;
        if(!(typeof queryObject.appointment_id === 'undefined') && queryObject.appointment_id) {
            if(isNaN(queryObject.appointment_id) || queryObject.appointment_id == "") return res.json({status: 300, success: false, error: "Appointment ID must be at least 1 number long."});
            else {
                sql += ` WHERE appointment_id = ?`
                
                appointmentDB.all(sql, [queryObject.appointment_id], (err, rows) => {
                    // return potential error
                    if(err) return res.json({status: 300, success: false, error: err});
    
                    // if rows < 1 (nothing found) return an error that says No Match
                    if(rows.length < 1) return res.json({status: 300, success: false, error: "No Match"});
    
                    // Success
                    return res.json({
                        status: 200,
                        data: rows,
                        success: true,
                    });
                });
            }
        }
        else if(queryObject.startDate && queryObject.endDate) {
            sql += " WHERE appointment_date > date(?) AND appointment_date < date(?)"
            appointmentDB.all(sql, [queryObject.startDate, queryObject.endDate], (err, rows) => {
                // return potential error
                if(err) return res.json({status: 300, success: false, error: err});

                // if rows < 1 (nothing found) return an error that says No Match
                if(rows.length < 1) return res.json({status: 300, success: false, error: "No Match"});

                // Success
                return res.json({
                    status: 200,
                    data: rows,
                    success: true,
                });
            });
        }
        else {// Check Db with the potentially updated sql string from query params
            appointmentDB.all(sql, [], (err, rows) => {
                // return potential error
                if(err) return res.json({status: 300, success: false, error: err});

                // if rows < 1 (nothing found) return an error that says No Match
                if(rows.length < 1) return res.json({status: 300, success: false, error: "No Match"});

                // Success
                return res.json({
                    status: 200,
                    data: rows,
                    success: true,
                });
            });
        }
    } catch (error) {
        return res.json({
            status: 400,
            success: false,
        });
    }
});

async function doesAppointmentExist(appointment_id) {
    try{ 
        return new Promise((resolve, reject) =>{
            findSql = `SELECT appointment_id FROM appointment WHERE appointment_id = "${appointment_id}"`

            appointmentDB.all(findSql, [], (err, rows) => {
                // return potential error
                if (err) return reject.err;
                if (rows.length >= 1) resolve(true);
                else resolve(false);
                // Success
            });
        })
    } catch (err) {
        return res.json({status: 300, success: false, error: err});
    }
}

router.post("/", express.json(), (req, res) =>{
    try {
        const { appointment_id, patient_id, clinician_id, cost, appointment_date, appointment_time, appointment_status } = req.body;

        insertSql = "INSERT INTO appointment(appointment_id, patient_id, clinician_id, cost, appointment_date, appointment_time, appointment_status) VALUES(?,?,?,?,?,?,?)"
        
        warningFlags = {};
        if(!(typeof appointment_id === 'undefined')) {
            if(isNaN(appointment_id) || appointment_id == "") return res.json({status: 300, success: false, error: "Appointment ID must be at least 1 number long."});
            else {
                doesAppointmentExist(appointment_id).then((appointmentExists, err) => {
                    if(err) return res.json({status: 300, success: false, error: err});
                    if(appointmentExists) res.json({status: 300, success: false, error: `Appointment with Appointment ID: ${appointment_id} already exists in the database.`});
                    
                    else {
                        
                        // -1 means nothing was provided
                        if(patient_id == "") warningFlags.patient_id = "No patient id provided.";
                        if(clinician_id == "") warningFlags.clinician_id = "No clinician id provided.";
                        if(cost == "") warningFlags.cost = "No cost provided.";
                        if(appointment_date == "") warningFlags.appointment_date = "No appointment date provided.";
                        if(appointment_time == "") warningFlags.appointment_time = "No appointment time provided.";
                        if(appointment_status == "") warningFlags.appointment_status = "No appointment status provided.";

                        appointmentDB.run(insertSql, [appointment_id, patient_id, clinician_id, cost, appointment_date, appointment_time, appointment_status], (err) =>{
                            // return potential error
                            if(err) return res.json({status: 300, success: false, error: err});

                            // Successfully added but some mismatched infomation was entered
                            console.log(warningFlags);
                            if(Object.keys(warningFlags).length > 0) 
                            return res.json({ 
                                status: 201, 
                                success: true, 
                                warning: warningFlags,
                            });

                            // Successfully added
                            return res.json({
                                status: 200,
                                success: true,
                            });
                        });
                    }
                
                }).catch((err) =>{
                    console.log(`Error Fetching data: ${err.message}`);
                })
            }
        
            
        }
        else return res.json({status: 300, success: false, error: "No appointment id provided."});
        
        
    } catch (error) {
        console.log(`Error Fetching data: ${error.message}`);
    }
});

router.put("/", express.json(), (req, res) =>{
    try {

        let sql = "UPDATE appointment SET" // appointment_id, patient_id, clinician_id, cost, appointment_date, appointment_time, appointment_status
        
        const queryObject = url.parse(req.url, true).query;
        // If field and type are both inputed/valid

        warningFlags = {}
        console.log(queryObject.appointment_id)
        if(queryObject.appointment_id) {
            if(isNaN(queryObject.appointment_id))
                return res.json({status: 300, success: false, error: "Appointment Id is not formatted properly, only numbers."});
            else {
                doesAppointmentExist(queryObject.appointment_id).then((appointmentExists, err) => {
                    if(err) return res.json({status: 300, success: false, error: err});

                    if(!appointmentExists) res.json({status: 300, success: false, error : `Appointment with ID: ${queryObject.appointment_id} does not exist in the database.`})
                    
                    else {
                        dbArray = []

                        if(queryObject.patient_id && queryObject.patient_id != "") {
                            if(isNaN(queryObject.patient_id)) warningFlags.patient_id = "A non valid patient id was inputed, only numbers."
                            else {
                                sql += ` patient_id = ?,`;
                                dbArray[dbArray.length] = queryObject.patient_id;
                            }
                        }
                        else warningFlags.patient_id = "Patient id not found, ignoring patient_id update.";

                        if(queryObject.clinician_id && queryObject.clinician_id != "") {
                            if(isNaN(queryObject.clinician_id)) warningFlags.clinician_id = "A non valid clinician id was inputed, only numbers.";
                            else {
                                sql += ` clinician_id = ?,`;
                                dbArray[dbArray.length] = queryObject.clinician_id;
                            }
                        }
                        else warningFlags.clinician_id = "Clinician id not found, ignoring clinician_id update.";

                        if(queryObject.cost && queryObject.cost != "") {
                            if(isNaN(queryObject.cost)) warningFlags.cost = "A non valid cost was inputed, only numbers."
                            else {
                                sql += ` cost = ?,`;
                                dbArray[dbArray.length] = queryObject.cost;
                            }
                        }
                        else warningFlags.cost = "Cost not found, ignoring cost update.";

                        if(queryObject.appointment_date && queryObject.appointment_date != "") {
                            console.log(Date.parse(queryObject.appointment_date));
                            if(isNaN(Date.parse(queryObject.appointment_date))) warningFlags.state = "A non valid appointment date was inputed, Format: YYYY-MM-DD.";
                            else {
                                sql += ` appointment_date = ?,`;
                                dbArray[dbArray.length] = queryObject.appointment_date;
                            }
                        } 
                        else warningFlags.appointment_date = "Appointment Date not found, ignoring appointment_date update.";

                        if(queryObject.appointment_time && queryObject.appointment_time != "") {
                            if(!(/^\d{2}:\d{2}$/.test(queryObject.appointment_time))) warningFlags.state = "A non valid appointment time was inputed, Format: HH:MM.";
                            else {
                                sql += ` appointment_time = ?,`;
                                dbArray[dbArray.length] = queryObject.appointment_time;
                            }
                        } 
                        else warningFlags.appointment_time = "Appointment time not found, ignoring appointment_time update.";
                        
                        
                        if(queryObject.appointment_status && queryObject.appointment_status != "") {
                            if(/\d/.test(queryObject.appointment_status)) warningFlags.state = "A non valid appointment status was inputed, no numbers.";
                            else {
                                sql += ` appointment_status = ?,`;
                                dbArray[dbArray.length] = queryObject.appointment_status;
                            }
                        }
                        else warningFlags.appointment_status = "Appointment status not found, ignoring appointment_status update.";

                        console.log(Object.keys(warningFlags).length);
                        sql = sql.substring(0, sql.length - 1);

                        if(Object.keys(warningFlags).length < 6) {
                            sql += ` WHERE appointment_id = ?`;
                            dbArray[dbArray.length] = queryObject.appointment_id;

                            appointmentDB.run(sql, dbArray, (err) =>{
                                if(err) return res.json({status: 300, success: false, error: err});
                                
                                if(Object.keys(warningFlags).length > 0)
                                    return res.json({
                                        status: 201,
                                        success: true,
                                        warning: warningFlags,
                                    })

                                return res.json({
                                    status: 200,
                                    success: true,
                                });
                            });
                        }
                        else return res.json({status: 300, success: false, error : "No valid parameters to update.", warning: warningFlags});
                    }
                
                })
            }
        }
        else {
            return res.json({status: 300, success: false, error: "no valid appointment_id query param found."});
        }

    } catch (error) {
        return res.json({
            status: 400,
            success: false,
        });
    }
});

router.delete("/", (req, res) =>{
    try {
        sql = "DELETE FROM appointment WHERE appointment_id = ?"
        
        // Create a query object that parses the url for params
        const queryObject = url.parse(req.url, true).query;
        console.log(queryObject.appointment_id);

        if(queryObject.appointment_id) {
            if(isNaN(queryObject.appointment_id)) return res.json({status: 300, success: false, error: "Appointment number must be a numerical value."});

            else {
                
                doesAppointmentExist(queryObject.appointment_id).then((appointmentExists, err) =>{
                    if(err) return res.json({status: 300, success: false, error: err});
                    if(!appointmentExists) res.json({status: 300, success: false, error: `Appointment with appointment id: ${queryObject.appointment_id} does not exist in the database.`});
                    else {
                        appointmentDB.run(sql, [queryObject.appointment_id], (err) =>{
                            if(err) return res.json({status: 300, success: false, error: err});
                            
                            console.log(sql);
                            return res.json({
                                status: 200,
                                success: true,
                                appointment_id_deleted: queryObject.appointment_id,
                            });
                        });
                    }
                }).catch((err) => {
                    console.log(`Error Fetching data: ${err.message}`);
                })
            }
        }

        
    } catch (error) {
        return res.json({
            status: 400,
            success: false,
        });
    }
});

module.exports = router;