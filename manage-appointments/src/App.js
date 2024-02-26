import React, {useEffect, useState} from 'react'
import axios from 'axios';
import './App.css';

function App() {
  const [backendData, setBackendData] = useState([{}]);

  const [appointment_id, setAppointment_id] = useState("");
  const [patient_id, setPatient_id] = useState("");
  const [clinician_id, setClinician_id] = useState("");

  const [cost, setCost] = useState("");
  const [appointment_date, setAppointment_date] = useState("");
  const [appointment_time, setAppointment_time] = useState("");
  const [appointment_status, setAppointment_status] = useState("");

  const [start_date, setStartDate] = useState("");
  const [end_date, setEndDate] = useState("");


  console.log(appointment_id);
  useEffect(() => {
    fetch("/appointment").then(
      response => response.json()
    ).then( 
      data => { setBackendData(data); }
    )

  }, [])
  
  return (
    <div app="app">
      <div className="flex flex-col space-y-10 p-5">
        <div className='flex flex-row space-x-5 mx-auto'>
          <div className='flex flex-row space-x-5'>
            <label for = "Start_Date" class = "block text-xl font-medium text-right basis-1/2">Start Date</label>
            <input value={start_date} onChange={(e) => { setStartDate(e.target.value); }} type = "date" name = "Start_Date" id = "Start_Date" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
          <div className='flex flex-row space-x-5'>
            <label for = "End_Date" class = "block text-xl font-medium text-right basis-1/2">End Date</label>
            <input value={end_date} onChange={(e) => { setEndDate(e.target.value); }} type = "date" name = "End_Date" id = "End_Date" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
            <button /*Sort*/onClick={() => {
              fetch(`/appointment?startDate=${start_date}&endDate=${end_date}`).then(
                response => response.json()
              ).then( 
                data => {setBackendData(data)}
              )}
            }
            class="hover:bg-gray-100 text-gray-700 font-semibold hover:text-black py-2 px-10 border border-gray-500 rounded">
            Sort
            </button>
            <button /*Reset Sort*/onClick={() => {
              fetch(`/appointment`).then(
                response => response.json()
              ).then( 
                data => {setBackendData(data)}
              )}
            }
            class="hover:bg-gray-100 text-gray-700 font-semibold hover:text-black py-2 px-10 border border-gray-500 rounded">
            Reset
            </button>
        </div>
        <table className='basis-1/2'>
          <thead className='bg-[#d6d3d1]'>
            <tr /*Appointment table header row*/>
              <th>appointment_id</th>
              <th>patient_id</th>
              <th>clinician_id</th>
              <th>cost</th>
              <th>appointment_date</th>
              <th>appointment_time</th>
              <th>appointment_status</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody /*Appointment table*/>
            {(typeof backendData.data === 'undefined') ? (
              <p>loading...</p>
            ) : (
              backendData.data.map((appointment, i) => (
                <tr key={appointment.appointment_id}>
                  <td>{appointment.appointment_id}</td>
                  <td>{appointment.patient_id}</td>
                  <td>{appointment.clinician_id}</td>
                  <td>{appointment.cost}</td>
                  <td>{appointment.appointment_date}</td>
                  <td>{appointment.appointment_time}</td>
                  <td>{appointment.appointment_status}</td>
                  <td /*Edit and Delete buttons*/class= "mx-auto"> 
                    <button /*Edit button(Will fill in fields with current Row data*/ onClick={() => {
                      setAppointment_id(appointment.appointment_id);
                      setPatient_id(appointment.patient_id);
                      setClinician_id(appointment.clinician_id);
                      setCost(appointment.cost);
                      setAppointment_date(appointment.appointment_date);
                      setAppointment_time(appointment.appointment_time);
                      setAppointment_status(appointment.appointment_status);
                    }} class = "px-4 bg-gray-400 rounded-xl">Edit</button>
                    <button /*Delete button Will delete current row*/ onClick={() => {
                      axios.delete(`/appointment?appointment_id=${appointment.appointment_id}`).then((res) => {
                        alert(JSON.stringify(res.data));
                        fetch("/appointment").then(response => response.json()).then(data => {setBackendData(data)})
                      })
                    }} class = "px-4 bg-gray-400 rounded-xl">Delete</button>
                  </td>
                </tr>
              ))
            )
            }
          </tbody>
        </table>
        <div /*Inputs*/className='flex flex-col space-y-5 mx-auto'>
          <div className='flex flex-row space-x-5'>
            <label for = "Appointment_ID" class = "block text-xl font-medium text-right basis-1/2">Appointment ID</label>
            <input value={appointment_id} onChange={(e) => { setAppointment_id(e.target.value); }} type = "number" name = "Appointment_ID" id = "Appointment_ID" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
          <div className='flex flex-row space-x-5'>
            <label for = "Patient_ID" class = "block text-xl font-medium text-right basis-1/2">Patient ID</label>
            <input value={patient_id} onChange={(e) => { setPatient_id(e.target.value); }} type = "number" name = "Patient_ID" id = "Patient_ID" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
          <div className='flex flex-row space-x-5'>
            <label for = "Clinician_ID" class = "block text-xl font-medium text-right basis-1/2">Clinician ID</label>
            <input value={clinician_id} onChange={(e) => { setClinician_id(e.target.value); }} type = "number" name = "Clinician_ID" id = "Clinician_ID" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
          <div className='flex flex-row space-x-5'>
            <label for = "Cost" class = "block text-xl font-medium text-right basis-1/2">Cost</label>
            <input value={cost} onChange={(e) => { setCost(e.target.value); }} type = "text" name = "number" id = "Cost" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
          <div className='flex flex-row space-x-5'>
            <label for = "Appointment_Date" class = "block text-xl font-medium text-right basis-1/2">Appointment Date</label>
            <input value={appointment_date} onChange={(e) => { setAppointment_date(e.target.value); }} type = "date" name = "Appointment_Date" id = "Appointment_Date" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
          <div className='flex flex-row space-x-5'>
            <label for = "Appointment_Time" class = "block text-xl font-medium text-right basis-1/2">Appointment Time</label>
            <input value={appointment_time} onChange={(e) => { setAppointment_time(e.target.value); }} type = "time" name = "Appointment_Time" id = "Appointment_Time" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
          <div className='flex flex-row space-x-5'>
            <label for = "Appointment_Status" class = "block text-xl font-medium text-right basis-1/2">Appointment Status</label>
            <input value={appointment_status} onChange={(e) => { setAppointment_status(e.target.value); }} type = "text" name = "Appointment_Status" id = "Appointment_Status" class = "rounded-sm pl-1 ring-1 ring-gray-500 basis-1/2"></input>
          </div>
          <div className='flex flex-row space-x-5 mx-auto'> 
            <button /*Create*/onClick={() => {
              axios.post("/appointment", {appointment_id, patient_id, clinician_id, cost, appointment_date, appointment_time, appointment_status}).then((res) => {
                  alert(JSON.stringify(res.data));
                  fetch("/appointment").then(response => response.json()).then(data => {setBackendData(data)})
                  })
                }
              } 
              class="hover:bg-gray-100 text-gray-700 font-semibold hover:text-black py-2 px-10 border border-gray-500 rounded">
              Create
            </button>
            <button /*Update*/onClick={() => {
              axios.put("/appointment", null, {params: {appointment_id: appointment_id,
                                                        patient_id: patient_id,
                                                        clinician_id: clinician_id,
                                                        cost: cost,
                                                        appointment_date: appointment_date,
                                                        appointment_time: appointment_time,
                                                        appointment_status: appointment_status}}).then((res) => {
                  alert(JSON.stringify(res.data));
                  fetch("/appointment").then(response => response.json()).then(data => {setBackendData(data)})
                  })
                }
              } 
              class="hover:bg-gray-100 text-gray-700 font-semibold hover:text-black py-2 px-10 border border-gray-500 rounded">
              Update
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
