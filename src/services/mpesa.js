// services/mpesa.js
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export class MpesaService {
  /**
   * Initiate STK Push payment
   */
  static async initiatePayment({ phoneNumber, amount, causeId, accountReference }) {
    const stkPush = httpsCallable(functions, 'mpesaStkPush');
    
    try {
      const result = await stkPush({
        phoneNumber,
        amount,
        causeId,
        accountReference
      });
      return result.data;
    } catch (error) {
      throw new Error('Payment initiation failed: ' + error.message);
    }
  }

  /**
   * Check payment status
   */
  static async checkStatus(checkoutRequestID) {
    const checkStatus = httpsCallable(functions, 'mpesaCheckStatus');
    const result = await checkStatus({ checkoutRequestID });
    return result.data;
  }
}

// Usage in component
async function handleGiveNow() {
  try {
    const result = await MpesaService.initiatePayment({
      phoneNumber: '+254712345678',
      amount: 1000,
      causeId: 'cause_building',
      accountReference: 'BUILDING'
    });

    if (result.ResponseCode === '0') {
      alert('STK push sent to your phone. Enter your M-Pesa PIN to complete.');
    }
  } catch (error) {
    alert('Payment failed: ' + error.message);
  }
}