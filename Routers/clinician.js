const sqlite = require('sqlite3').verbose();
const axios = require('axios');
const url = require('url');
const express = require('express');
const router = express.Router();


// Clinincian Database
const clinicianDB = new sqlite.Database('./Databases/clinicians.db', sqlite.OPEN_READWRITE, (err) =>{
    if(err) return console.error(err.message);

    console.log("Success");
});

// Initial DB
// clinicianDB.run('CREATE TABLE clinician(clinician_id, npi_number, first_name, last_name, state)');

// Clinincian Get
router.get("/", (req, res) => {

    try {
        
        sql = `SELECT * FROM clinician WHERE clinician_id = ?`
        // Create a query object that parses the url for params
        const queryObject = url.parse(req.url, true).query;
        
        if(queryObject.clinician_id) {
            // Check Db with the potentially updated sql string from query params
            clinicianDB.get(sql, [queryObject.clinician_id], (err, row) => {
                // return potential error
                if(err) return res.json({status: 300, success: false, error: err});

                // if rows < 1 (nothing found) return an error that says No Match
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
            sql = `SELECT * FROM clinician`
            clinicianDB.all(sql, [], (err, rows) => {
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

const npiRegistryLink = "https://npiregistry.cms.hhs.gov/api/?";

async function doesClinicianExist(clinician_id, npi_number) {
    try{ 
        return new Promise((resolve, reject) =>{
            findSql = `SELECT clinician_id FROM clinician WHERE clinician_id = "${clinician_id}" OR npi_number = "${npi_number}"`

            clinicianDB.all(findSql, [], (err, rows) => {
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
        const { clinician_id, npi_number, first_name, last_name, state } = req.body;

        // create sql code line for run function
        insertSql = "INSERT INTO clinician(clinician_id, npi_number, first_name, last_name, state) VALUES(?,?,?,?,?)"
        

        warningFlags = {};
        
        if(!(typeof clinician_id === 'undefined')) {
            if(isNaN(clinician_id) || clinician_id == "") return res.json({status: 300, success: false, error: "Clinician ID must be at least 1 number long."});
            doesClinicianExist(clinician_id, npi_number).then((clinicianExists, err) => {
                if(err) return res.json({status: 300, success: false, error: err});
                if(clinicianExists) res.json({status: 300, success: false, error: `Clinician with clinician id: ${clinician_id}, or NPI number: ${npi_number} already exists in the database.`});
                
                else {
                    if(!(typeof npi_number === 'undefined')) {
                        if(isNaN(npi_number)) return res.json({status: 300, success: false, error: "NPI number must be a 10-digit number."});
                        else if(npi_number.length != 10) return res.json({status: 300, success: false, error: "Npi number is not 10 numbers long"});
                        else {
                            axios.get(npiRegistryLink + `&number=${npi_number}&version=2.1`).then((axiosRes) => {
                                if(axiosRes.data.result_count < 1) return res.json({status: 300, success: false, error: `No clinician with matching NPI Number: ${npi_number}.`});
                                else {
                                    if(axiosRes.data.results[0].basic.first_name != first_name) warningFlags.first_name = `First name is mismatched, you inputed: ${first_name}, Database shows: ${axiosRes.data.results[0].basic.first_name}`;
                                    if(axiosRes.data.results[0].basic.last_name != last_name) warningFlags.last_name = `Last name is mismatched, you inputed: ${last_name}, Database shows: ${axiosRes.data.results[0].basic.last_name}`;
                                    if(axiosRes.data.results[0].addresses[1].state != state) warningFlags.state = `State is mismatched, you inputed: ${state}, Database shows: ${axiosRes.data.results[0].addresses[1].state}`;
                                
                                    
                                    console.log(warningFlags);
                                    clinicianDB.run(insertSql, [clinician_id, npi_number, first_name, last_name, state], (err) =>{
                                        // return potential error
                                        if(err) return res.json({status: 300, success: false, error: err});

                                        // Successfully added but some mismatched infomation was entered
                                        if(Object.keys(warningFlags).length > 0) return res.json({ status: 201, success: true, warning: warningFlags});

                                        // Successfully added
                                        return res.json({
                                            status: 200,
                                            success: true,
                                        });
                                    });
                                }
                            });
                        }
                    }
                    else return res.json({status: 300, success: false, error: "No npi number provided."});
                    
                }
            }).catch((err) => {
                return res.json({status: 300, success: false, error: err});
            })
        }
        else {
            return res.json({status: 300, success: false, error: "No clinician id provided."});
        }
    } catch (error) {
        return res.json({
            status: 400,
            success: false,
        });
        
    }
});

router.put("/", express.json(), (req, res) =>{

    try {

        let sql = "UPDATE clinician SET";
        const queryObject = url.parse(req.url, true).query;
        // If field and type are both inputed/valid
        
        warningFlags = {};

        if(queryObject.npi_number) {
            if(isNaN(queryObject.npi_number))
                return res.json({status: 300, success: false, error: "NPI number must be a 10-digit number."});
            else {
                if(queryObject.npi_number.length != 10)
                    return res.json({status: 300, success: false, error: "Npi number is not 10 numbers long"});
                else {
                    doesClinicianExist(queryObject.npi_number).then((clinicianExists, err) => {
                        if(err) return res.json({status: 300, success: false, error: err});
                        if(!clinicianExists) res.json({status: 300, success: false, error: `Clinician with NPI number: ${queryObject.npi_number} does not exist in the database.`});
                        
                        else {
                            dbArray = []
                            
                            if(queryObject.clinician_id) {
                                if(isNaN(queryObject.clinician_id)) warningFlags.clinician_id = "A non valid clinician id was inputed, only numbers."
                                else {
                                    sql += ` clinician_id = ?,`;
                                    dbArray[dbArray.length] = queryObject.clinician_id;
                                }
                            }
                            else warningFlags.clinician_id = "Clinician id not found, ignoring clinician_id update.";

                            if(queryObject.first_name) {
                                if(/\d/.test(queryObject.first_name)) warningFlags.first_name = "A non valid first name was inputed, no numbers.";
                                else {
                                    sql += ` first_name = ?,`;
                                    dbArray[dbArray.length] = queryObject.first_name;
                                }
                            }
                            else warningFlags.first_name = "First name not found, ignoring first_name update.";

                            if(queryObject.last_name) {
                                if(/\d/.test(queryObject.last_name)) warningFlags.last_name = "A non valid last name was inputed, no numbers."
                                else {
                                    sql += ` last_name = ?,`;
                                    dbArray[dbArray.length] = queryObject.last_name;
                                }
                            }
                            else warningFlags.last_name = "Last name not found, ignoring last_name update.";

                            if(queryObject.state) {
                                if(/\d/.test(queryObject.state) || queryObject.state.length != 2) warningFlags.state = "A non valid state was inputed, no numbers, and is only two characters long.";
                                else {
                                    sql += ` state = ?,`;
                                    dbArray[dbArray.length] = queryObject.state;
                                }
                            } 
                            else warningFlags.state = "State not found, ignoring state update.";
                            
                            console.log(Object.keys(warningFlags).length);
                            sql = sql.substring(0, sql.length - 1);

                            if(Object.keys(warningFlags).length < 4) {
                                sql += ` WHERE npi_number = ?`;

                                dbArray[dbArray.length] = queryObject.npi_number;

                                clinicianDB.run(sql, dbArray, (err) =>{
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
                            else {
                                return res.json({status: 300, success: false, error : "No valid parameters to update.", warning: warningFlags});
                            }
                        }
                    
                    });
                }
            }
        }
        else {
            return res.json({status: 300, success: false, error: "no valid npi_number query param found."});
        }
    } catch (error) {
        return res.json({
            status: 400,
            success: false,
        });
    }
    
});

router.delete("/", express.json(), (req, res) =>{
    try {
        sql = "DELETE FROM clinician WHERE npi_number = ?"
        
        // Create a query object that parses the url for params
        const queryObject = url.parse(req.url, true).query;

        if(queryObject.npi_number) {
            if(isNaN(queryObject.npi_number)) return res.json({status: 300, success: false, error: "NPI number must be a 10-digit number."});

            else {
                if(queryObject.npi_number.length != 10) return res.json({status: 300, success: false, error: "Npi number is not 10 numbers long"});
                else {
                    doesClinicianExist(queryObject.npi_number).then((clinicianExists, err) =>{
                        if(err) return res.json({status: 300, success: false, error: err});
                        if(!clinicianExists) res.json({status: 300, success: false, error: `Clinician with NPI number: ${queryObject.npi_number} does not exist in the database.`});
                        else {
                            clinicianDB.run(sql, [queryObject.npi_number], (err) =>{
                                if(err) return res.json({status: 300, success: false, error: err});
                            
                                return res.json({
                                    status: 200,
                                    success: true,
                                    npi_number_deleted: queryObject.npi_number,
                                });
                            });
                        }
                    }).catch((err) => {
                        console.log(`Error Fetching data: ${err.message}`);
                    })
                }
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