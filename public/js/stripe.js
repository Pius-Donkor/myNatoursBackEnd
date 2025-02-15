/* eslint-disable  */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51QqI7uJR9lMJVa4G4Wbf4ICVS0mtxkiYGm4woREvt62Kbe5qMy0ifKZmllqS1YIEf4yxsFwuoTM8zoFBMp4TsZ1800VuQGKmJc'
);
export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from endpoint from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    // console.log(session);
    //   2) Create the checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (error) {
    console.log(err);
  }
};
