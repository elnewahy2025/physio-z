const axios = require('axios');

async function test() {
  try {
    const login = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'owner@physio-z.local',
      password: 'password123'
    });
    
    const token = login.data.token;
    
    const res = await axios.get('http://localhost:3001/api/appointments?limit=200&startDate=2026-09-04&endDate=2026-09-11', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`Fetched ${res.data.data.length} appointments.`);
    if (res.data.data.length > 0) {
      console.log(res.data.data[0]);
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

test();
