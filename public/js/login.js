/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged In successfully');
      setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    showAlert('success', 'Logged out successfully');
    location.reload(true);
  } catch (error) {
    console.log(error);
    showAlert('error', 'Error logging out, please try again later');
  }
};
