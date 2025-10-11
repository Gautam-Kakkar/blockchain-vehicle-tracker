# Testing Guide - Vehicle Registration DApp

## Setup Complete ✅

### Contract Information
- **Network:** Ganache Local (Chain ID: 1337)
- **Contract Address:** `0x7D955E614Ee52Ad6Da57Fe6BE9bf6e6E366DC8eC`
- **Server:** Running on http://localhost:3000

### Role Accounts
1. **Dealership:** `0x725B5F8AcdCb00952bEC203309c192A7f9dB57E9`
2. **Service Centre:** `0x38635377D0751F9C01286ACc3C0b28aAaad24E65`
3. **Company:** `0xD2cCd502cbF14A9f6Ff9b08a0fe27CCbD933d017`

## Testing Flow

### 1. Test Vehicle Registration (Dealership)
1. Open http://localhost:3000
2. Make sure MetaMask is on Ganache Local network
3. Connect with Dealership account
4. Click "Connect MetaMask" → Approve
5. Click "Proceed to Dashboard"
6. Register a vehicle:
   - VIN: `TEST1234567890ABC` (exactly 17 characters)
   - Color: `Red`
   - Model: `Honda Civic`
   - Company: `Honda`
   - Owner Name: `John Doe`
   - Owner ID: `DL123456`
7. Click "Register Vehicle"
8. Approve transaction in MetaMask
9. Check console for success message

### 2. Test Mileage Update (Service Centre)
1. Logout from Dealership
2. Switch MetaMask to Service Centre account
3. Refresh page and login
4. Search for VIN: `TEST1234567890ABC`
5. Vehicle details should appear
6. Enter new mileage: `5000` km
7. Click "Update Mileage"
8. Approve transaction in MetaMask
9. Mileage should update successfully

### 3. Test Vehicle Verification (Company)
1. Logout from Service Centre
2. Switch MetaMask to Company account
3. Refresh page and login
4. Search for VIN: `TEST1234567890ABC`
5. All vehicle details should be displayed
6. Verify mileage shows: `5000 km`
7. Check last service date

## Common Issues & Solutions

### Issue: MetaMask not connecting
**Solution:** Make sure MetaMask network is set to Ganache Local (Chain ID: 1337, RPC: http://127.0.0.1:7545)

### Issue: Wrong network
**Solution:** Page will automatically prompt to switch networks. Click "Switch Network" in MetaMask popup.

### Issue: Unauthorized error
**Solution:** Make sure you're logged in with the correct account for that role.

### Issue: Vehicle not found
**Solution:** 
- Make sure vehicle was registered successfully
- Use exact same VIN (case-sensitive)
- Check console logs for debugging

### Issue: Mileage update fails
**Solution:**
- New mileage must be greater than current mileage
- Make sure you're logged in as Service Centre
- Check console for detailed error messages

## Console Debugging

Open browser console (F12) to see detailed logs:
- Contract initialization status
- Transaction hashes
- Gas estimates
- Error messages
- Vehicle data retrieval

## Features Implemented

✅ MetaMask integration
✅ Automatic network switching
✅ Role-based access control
✅ Vehicle registration (Dealership)
✅ Mileage updates (Service Centre)
✅ Vehicle verification (Company)
✅ Modern responsive UI
✅ Real-time blockchain data
✅ Transaction confirmation
✅ Error handling
✅ Gas optimization

## Next Steps (Future Enhancements)

- [ ] Add vehicle transfer functionality
- [ ] IPFS integration for documents
- [ ] Multi-dealership support
- [ ] Service history timeline
- [ ] Export vehicle reports
- [ ] Email notifications
- [ ] Mobile responsive improvements
- [ ] Deploy to testnet (Sepolia/Goerli)
