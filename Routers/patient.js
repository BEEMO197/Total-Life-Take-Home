const sqlite = require('sqlite3').verbose();
const url = require('url');
const express = require('express');
const router = express.Router();

const patientDB = new sqlite.Database('./Databases/patients.db', sqlite.OPEN_READWRITE, (err) =>{
    if(err) return console.error(err.message);

    console.log("Success");
});

// patientDB.run('CREATE TABLE patient(patient_id, first_name, last_name, gender, DoB, insurance_provider)');

router.get("/", (req, res) =>{
    try {
        
        sql = `SELECT * FROM patient WHERE patient_id = ?`
        // Create a query object that parses the url for params
        const queryObject = url.parse(req.url, true).query;

        if(queryObject.patient_id) {
            // Check Db with the potentially updated sql string from query params
            patientDB.get(sql, [queryObject.patient_id], (err, row) => {
                // return potential error
                if(err) return res.json({status: 300, success: false, error: err});

                if(row) // Success
                return res.json({
                    status: 200,
                    data: row,
                    success: true,
                });

                return res.json({status: 300, success: false, error: "No Match"});

            });
        }
        else {
            sql = `SELECT * FROM patient`
            patientDB.all(sql, [], (err, rows) => {
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

async function doesPatientExist(patient_id) {
    try{ 
        return new Promise((resolve, reject) =>{
            findSql = `SELECT patient_id FROM patient WHERE patient_id = "${patient_id}"`

            patientDB.all(findSql, [], (err, rows) => {
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
        // create variables from the post request body
        const { patient_id, first_name, last_name, gender, DoB, insurance_provider } = req.body;

        // create sql code line for run function
        insertSql = "INSERT INTO patient(patient_id, first_name, last_name, gender, DoB, insurance_provider) VALUES(?,?,?,?,?,?)"
        
        warningFlags = {};
        if(!(typeof patient_id === 'undefined') ) {        
            if(isNaN(patient_id) || patient_id == "") return res.json({status: 300, success: false, error: "Patient ID must be at least 1 number long."});
            doesPatientExist(patient_id).then((patientExists, err) => {
                if(err) return res.json({status: 300, success: false, error: err});
                if(patientExists) res.json({status: 300, success: false, error: `Patient with patient id: ${patient_id} already exists in the database.`});
                else{ 

                    if(typeof first_name === 'undefined') warningFlags.first_name = "No first name provided.";
                    else if(!isNaN(first_name)) warningFlags.first_name = "A non valid first name was inputed, no numbers.";

                    if(typeof last_name === 'undefined') warningFlags.last_name = "No last name provided.";
                    else if(!isNaN(last_name)) warningFlags.last_name = "A non valid last name was inputed, no numbers.";
                    
                    if(typeof gender === 'undefined') warningFlags.gender = "No gender provided.";
                    else if(!(gender == 'm' || gender == 'M' || gender == 'f' || gender == 'F')) warningFlags.last_name = "A non valid gender was inputed, only M or F";
                    
                    if(typeof DoB === 'undefined') warningFlags.DoB = "No date of birth provided.";
                    else if(isNaN(last_name)) warningFlags.last_name = "A non valid date of birth was inputed, 8 numbers YYYYMMDD.";

                    if(typeof insurance_provider === 'undefined') warningFlags.insurance_provider = "No insurance provider provided.";
                    else if(!isNaN(insurance_provider)) warningFlags.last_name = "A non valid last name was inputed, no numbers.";


                    patientDB.run(insertSql, [patient_id, first_name, last_name, gender, DoB, insurance_provider], (err) =>{
                        // return potential error
                        if(err) return res.json({status: 300, success: false, error: err});

                        // Successfully added but some mismatched infomation was entered
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
        else return res.json({status: 300, success: false, error: "No patient id provided."});

    } catch (error) {
        return res.json({
            status: 400,
            success: false,
        });
        
    }
});

router.put("/", express.json(), (req, res) =>{
    try {

        let sql = "UPDATE patient SET" // patient_id, first_name, last_name, gender, DoB, insurance_provider
        
        const queryObject = url.parse(req.url, true).query;
        // If field and type are both inputed/valid

        warningFlags = {}
        if(queryObject.patient_id) {
            if(isNaN(queryObject.patient_id))
                return res.json({status: 300, success: false, error: "Patient Id is not formatted properly, expecting only numbers."});
            else {
                doesPatientExist(queryObject.patient_id).then((patientExists, err) => {
                    if(err) return res.json({status: 300, success: false, error: err});

                    if(!patientExists) res.json({status: 300, success: false, error : `Patient with ID: ${queryObject.patient_id} does not exist in the database.`})
                    
                    else {
                        dbArray = []
                        
                        if(queryObject.first_name) {
                            if(!isNaN(queryObject.first_name)) warningFlags.first_name = "A non valid first name was inputed, no numbers.";
                            else {
                                sql += ` first_name = ?,`;
                                dbArray[dbArray.length] = queryObject.first_name;
                            }
                        }
                        else warningFlags.first_name = "First name not found, ignoring first_name update.";

                        if(queryObject.last_name) {
                            if(!isNaN(queryObject.last_name)) warningFlags.last_name = "A non valid last name was inputed, no numbers."
                            else {
                                sql += ` last_name = ?,`;
                                dbArray[dbArray.length] = queryObject.last_name;
                            }
                        }
                        else warningFlags.last_name = "Last name not found, ignoring last_name update.";

                        if(queryObject.gender) {
                            switch (queryObject.gender) {
                                case 'm':
                                case 'M':
                                case 'f':
                                case 'F':
                                    sql += ` gender = ?,`;
                                    dbArray[dbArray.length] = queryObject.gender;
                                    break;
                            
                                default:
                                    warningFlags.gender = "A non valid gender was inputed, only M or F.";
                                    break;
                            }
                        } 
                        else warningFlags.gender = "Gender not found, ignoring gender update.";

                        if(queryObject.DoB) {
                            if(isNaN(queryObject.DoB)) warningFlags.state = "A non valid date of birth was inputed, only 8 numbers; YYYYMMDD.";
                            else if(queryObject.DoB.length != 8) warningFlags.state = "An incorrect amount of numbers were inputed, only 8 numbers; YYYYMMDD.";
                            else {
                                sql += ` DoB = ?,`;
                                dbArray[dbArray.length] = queryObject.DoB;
                            }
                        } 
                        else warningFlags.DoB = "Date of birth not found, ignoring DoB update.";
                        
                        
                        if(queryObject.insurance_provider) {
                            if(!isNaN(queryObject.insurance_provider)) warningFlags.state = "A non valid insurance provider was inputed, no numbers.";
                            else {
                                sql += ` insurance_provider = ?,`;
                                dbArray[dbArray.length] = queryObject.insurance_provider;
                            }
                        }
                        else warningFlags.insurance_provider = "Insurance provider not found, ignoring insurance_provider update.";

                        console.log(Object.keys(warningFlags).length);
                        sql = sql.substring(0, sql.length - 1);

                        if(Object.keys(warningFlags).length < 5) {
                            sql += ` WHERE patient_id = ?`;
                            dbArray[dbArray.length] = queryObject.patient_id;

                            patientDB.run(sql, dbArray, (err) =>{
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
            return res.json({status: 300, success: false, error: "no valid patient_id query param found."});
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
        sql = "DELETE FROM patient WHERE patient_id = ?"
        
        // Create a query object that parses the url for params
        const queryObject = url.parse(req.url, true).query;

        if(queryObject.patient_id) {
            if(isNaN(queryObject.patient_id)) return res.json({status: 300, success: false, error: "patient number must be a numerical value."});
            else {
                doesPatientExist(queryObject.patient_id).then((patientExists, err) =>{
                    if(err) return res.json({status: 300, success: false, error: err});
                    if(!patientExists) res.json({status: 300, success: false, error: `Patient with patient id: ${queryObject.patient_id} does not exist in the database.`});
                    else {
                        patientDB.run(sql, [queryObject.patient_id], (err) =>{
                            if(err) return res.json({status: 300, success: false, error: err});
                            
                            return res.json({
                                status: 200,
                                success: true,
                                patient_id_deleted: queryObject.patient_id,
                            });
                        });
                    }
                }).catch((err) => {
                    console.log(`Error Fetching data: ${err.message}`);
                })
            }
        }
        else {
            return res.json({status: 300, success: false, error: "no valid patient_id query param found."});
        }

        
    } catch (error) {
        return res.json({
            status: 400,
            success: false,
        });
    }
});

module.exports = router;