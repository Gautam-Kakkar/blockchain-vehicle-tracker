# Vehicle Registration and Tracking DApp

## Overview
A blockchain-based decentralized web application to manage **vehicle registration, tracking, and verification** using Ethereum.  
It involves three primary roles:
- **Dealership:** Registers vehicles on the blockchain.
- **Service Centre:** Updates the distance a vehicle has run and last service date.
- **Company:** Verifies the authenticity and service history of vehicles.

The application ensures **transparency, immutability, and traceability** in vehicle lifecycle management.

---

## Tech Stack

- **Frontend:** HTML, CSS, Tailwind CSS, JavaScript  
- **Backend:** Node.js + Express  
- **Blockchain:** Ethereum (via Ganache for local testing)  
- **Smart Contract Framework:** Truffle  
- **Web3 Integration:** Web3.js  
- **Authentication:** MetaMask wallet-based authentication  

---

## Folder Structure

```
vehicle-blockchain-dapp/
│
├── contracts/
│   ├── VehicleRegistry.sol          # Main Solidity contract
│   └── Migrations.sol               # Truffle migration contract
│
├── migrations/
│   ├── 1_initial_migration.js
│   └── 2_deploy_vehicle_registry.js
│
├── public/
│   ├── index.html                   # Landing + login page
│   ├── dealership.html              # Dealership dashboard
│   ├── servicecentre.html           # Service centre dashboard
│   ├── company.html                 # Company verification dashboard
│   └── styles/
│       └── tailwind.css
│
├── src/
│   ├── js/
│   │   ├── web3.js                  # Web3 connection setup
│   │   ├── dealership.js            # Dealership functions
│   │   ├── servicecentre.js         # Service centre functions
│   │   ├── company.js               # Company verification logic
│   │   └── auth.js                  # MetaMask authentication & role detection
│   └── utils/
│       └── contractInteraction.js   # Reusable blockchain calls
│
├── server/
│   ├── app.js                       # Express backend setup
│   ├── routes/
│   │   ├── dealershipRoutes.js
│   │   ├── serviceRoutes.js
│   │   └── companyRoutes.js
│   └── controllers/
│       ├── dealershipController.js
│       ├── serviceController.js
│       └── companyController.js
│
├── test/
│   └── vehicleRegistry.test.js      # Truffle smart contract tests
│
├── truffle-config.js                # Truffle configuration file
├── package.json
└── README.md
```

---

## Development Phases

### **Phase 1 — Environment Setup**
- Install dependencies: Node.js, Truffle, Ganache, MetaMask.
- Initialize Truffle project.
- Configure Ganache local blockchain.
- Setup Tailwind CSS.
- Create folder structure.

### **Phase 2 — Frontend Development**
- Build static HTML pages with Tailwind CSS styling.
- Implement MetaMask authentication and role-based access.
- Integrate Web3.js to connect frontend with Ethereum network.

### **Phase 3 — Smart Contract Development**
- Write Solidity contract (`VehicleRegistry.sol`) with functions:
  - `registerVehicle()` — dealership registers new vehicle.
  - `updateMileage()` — service centre updates kilometers and service date.
  - `getVehicleDetails()` — company verifies vehicle info.
- Deploy contract to Ganache via Truffle migrations.
- Write Truffle test cases to validate logic.

### **Phase 4 — Backend Integration**
- Build Express server to handle user sessions and role verification.
- Connect frontend with backend using REST APIs.
- Interact with smart contract functions via Web3.js from backend.

---

## Smart Contract Structure (VehicleRegistry.sol)

```solidity
pragma solidity ^0.8.0;

contract VehicleRegistry {
    struct Vehicle {
        string vin;
        string color;
        string model;
        string company;
        string ownerName;
        string ownerId;
        uint distanceRun;
        uint lastServiceDate;
    }

    mapping(string => Vehicle) public vehicles;

    address public dealership;
    address public serviceCentre;
    address public company;

    constructor(address _dealership, address _serviceCentre, address _company) {
        dealership = _dealership;
        serviceCentre = _serviceCentre;
        company = _company;
    }

    modifier onlyDealership() {
        require(msg.sender == dealership, "Not authorized: Dealership only");
        _;
    }

    modifier onlyServiceCentre() {
        require(msg.sender == serviceCentre, "Not authorized: Service centre only");
        _;
    }

    function registerVehicle(
        string memory vin,
        string memory color,
        string memory model,
        string memory companyName,
        string memory ownerName,
        string memory ownerId
    ) public onlyDealership {
        vehicles[vin] = Vehicle(vin, color, model, companyName, ownerName, ownerId, 0, block.timestamp);
    }

    function updateMileage(string memory vin, uint newDistance) public onlyServiceCentre {
        require(vehicles[vin].vin[0] != 0, "Vehicle not registered");
        vehicles[vin].distanceRun = newDistance;
        vehicles[vin].lastServiceDate = block.timestamp;
    }

    function getVehicleDetails(string memory vin) public view returns (Vehicle memory) {
        return vehicles[vin];
    }
}
```

---

## Authentication Logic (MetaMask)

- On each page load, MetaMask checks connected wallet address.
- Wallet address is compared with pre-defined role mapping (dealership, service centre, company).
- Unauthorized users get redirected to the login screen.

---

## Expected Output

- Dealership registers new vehicles on blockchain.
- Service centres update mileage and last service date.
- Company verifies authenticity, mileage, and service history.
- All data remains immutable and traceable on Ethereum blockchain.

---

## Future Improvements

- Add IPFS integration for storing vehicle documents (RC, insurance, etc.).  
- Introduce vehicle resale tracking.  
- Add multi-dealership and multi-service centre support.  
- Extend to public Ethereum testnets (Goerli/Sepolia).  
