# Vehicle Registration and Tracking DApp

A blockchain-based decentralized application for managing vehicle registration, tracking, and verification using Ethereum.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Ganache** (for local blockchain testing) - [Download here](https://trufflesuite.com/ganache/)
- **MetaMask** browser extension - [Install here](https://metamask.io/)

## Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd "path/to/Blockchain vehicle"
   ```

2. **Install dependencies** (already done if you ran Phase 1)
   ```bash
   npm install
   ```

## Setup Ganache

1. **Open Ganache**
2. **Create a new workspace** or quickstart
3. **Configure settings:**
   - Server: HTTP://127.0.0.1:7545
   - Port: 7545
   - Network ID: 5777 (or any)
4. **Save and start the workspace**
5. **Copy the first three account addresses** - these will be used for:
   - Account 1: Dealership
   - Account 2: Service Centre
   - Account 3: Company

## Setup MetaMask

1. **Install MetaMask** browser extension
2. **Import accounts from Ganache:**
   - Click MetaMask icon
   - Select "Import Account"
   - Copy private key from Ganache for each account
   - Import all three accounts
3. **Connect to local network:**
   - Click network dropdown (usually shows "Ethereum Mainnet")
   - Select "Add Network" → "Add Network Manually"
   - Enter:
     - Network Name: Ganache Local
     - RPC URL: http://127.0.0.1:7545
     - Chain ID: 1337
     - Currency Symbol: ETH
   - Save

## Compile and Deploy Smart Contracts

1. **Compile contracts:**
   ```bash
   npx truffle compile
   ```

2. **Deploy to Ganache:**
   ```bash
   npx truffle migrate
   ```

3. **Run tests:**
   ```bash
   npx truffle test
   ```

## Build Tailwind CSS

Generate the production CSS file:
```bash
npm run build:css
```

For development with auto-reload:
```bash
npm run watch:css
```

## Run the Application

1. **Start the Express server:**
   ```bash
   npm start
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

3. **Connect MetaMask** when prompted

## Project Structure

```
vehicle-blockchain-dapp/
├── contracts/           # Solidity smart contracts
├── migrations/          # Truffle migration scripts
├── public/             # HTML pages and static assets
├── src/                # JavaScript modules
│   ├── js/            # Web3 and application logic
│   └── utils/         # Helper functions
├── server/             # Express backend
│   ├── routes/        # API routes
│   └── controllers/   # Business logic
├── test/              # Smart contract tests
└── truffle-config.js  # Truffle configuration
```

## Roles and Functionality

### Dealership
- Register new vehicles on the blockchain
- Input: VIN, color, model, company, owner details

### Service Centre
- Update vehicle mileage
- Record service dates
- View vehicle history

### Company
- Verify vehicle authenticity
- Check service history
- View all vehicle details

## Development Workflow

1. **Make changes to smart contracts** in `contracts/`
2. **Recompile:** `npx truffle compile`
3. **Redeploy:** `npx truffle migrate --reset`
4. **Update frontend** Web3 integration if contract ABI changes
5. **Test thoroughly** before deploying to testnet

## Troubleshooting

**MetaMask not connecting:**
- Ensure Ganache is running
- Check network settings in MetaMask
- Refresh the page

**Transaction fails:**
- Ensure you're using the correct account for the role
- Check if account has enough ETH
- Verify contract is deployed

**Compilation errors:**
- Check Solidity version in truffle-config.js
- Ensure all dependencies are installed

## Next Steps

- Complete Phase 2: Frontend Development
- Complete Phase 3: Smart Contract Development
- Complete Phase 4: Backend Integration

## License

ISC
