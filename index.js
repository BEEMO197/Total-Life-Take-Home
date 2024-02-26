const sqlite = require('sqlite3').verbose();
const express = require('express');
const app = express();

const clinicianRoute = require('./Routers/clinician');
const patientRoute = require('./Routers/patient');
const appointmentRoute = require('./Routers/appointment');

app.use('/clinician', clinicianRoute);
app.use('/patient', patientRoute);
app.use('/appointment', appointmentRoute);

app.use(express.json())

app.listen(5000)