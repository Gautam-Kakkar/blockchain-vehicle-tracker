# BLOCKCHAIN VEHICLE TRACKING SYSTEM
## Complete Project Report

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Smart Contracts](#3-smart-contracts)
4. [Frontend Application](#4-frontend-application)
5. [IPFS Integration](#5-ipfs-integration)
6. [Security Features](#6-security-features)
7. [Testing & Quality Assurance](#7-testing--quality-assurance)
8. [Deployment & Infrastructure](#8-deployment--infrastructure)
9. [Project Statistics](#9-project-statistics)
10. [Future Enhancements](#10-future-enhancements)

---

## 1. PROJECT OVERVIEW

### 1.1 Executive Summary

This **Blockchain Vehicle Tracking System** is a production-ready decentralized application (DApp) built on Ethereum blockchain. It provides a transparent, immutable, and secure platform for managing vehicle lifecycle events including registration, service tracking, ownership transfer, and verification. The system integrates IPFS (InterPlanetary File System) for decentralized document storage, ensuring vehicle records and supporting documents are permanently accessible and tamper-proof.

### 1.2 Problem Statement

Traditional vehicle registration systems suffer from:
- Centralized databases vulnerable to tampering
- Lack of transparency in vehicle history
- Difficulty verifying authenticity of documents
- Odometer fraud and mileage manipulation
- Complex ownership transfer processes
- Fragmented service history records

### 1.3 Solution Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Blockchain** | Ethereum (Solidity ^0.8.0) | Immutable record storage |
| **Smart Contracts** | VehicleRegistryIPFS | Business logic enforcement |
| **Decentralized Storage** | IPFS via Pinata | Document and image storage |
| **Frontend** | HTML5, Tailwind CSS, Vanilla JS | User interface |
| **Wallet Integration** | MetaMask, Web3.js | Authentication & transactions |
| **Backend** | Express.js | Static file serving |
| **Development Framework** | Truffle Suite | Contract compilation & deployment |

### 1.4 Key Stakeholders & Roles

| Role | Address | Permissions |
|------|---------|-------------|
| **Dealership** | `0x725B5F8AcdCb00952bEC203309c192A7f9dB57E9` | Register vehicles, upload documents |
| **Service Centre** | `0x38635377D0751F9C01286ACc3C0b28aAaad24E65` | Update mileage, add service records |
| **Company** | `0xD2cCd502cbF14A9f6Ff9b08a0fe27CCbD933d017` | Verify vehicles, view records |

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Dealership   │  │   Service    │  │   Company    │              │
│  │  Dashboard   │  │   Centre     │  │  Dashboard   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                      │
└─────────┼──────────────────┼──────────────────┼──────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      WEB3 LAYER (MetaMask)                          │
├─────────────────────────────────────────────────────────────────────┤
│  • Wallet Connection  • Transaction Signing  • Account Management   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│           VehicleRegistryIPFS.sol (521 lines)                       │
│  • Vehicle Registration  • Mileage Updates  • Document Management   │
│  • Service History  • Ownership Transfer  • Verification            │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   ETHEREUM BLOCKCHAIN    │    │      IPFS NETWORK        │
│  • Transaction Records   │    │  • Vehicle Images        │
│  • State Changes         │    │  • Registration Docs     │
│  • Event Logs            │    │  • Service Records       │
└──────────────────────────┘    └──────────────────────────┘
```

### 2.2 Data Flow

**Vehicle Registration Flow:**
1. Dealership connects MetaMask wallet
2. Fills vehicle details and uploads documents
3. Documents → IPFS (Pinata) → Content Identifier (CID)
4. Smart contract `registerVehicle()` called with CID parameters
5. Transaction mined, vehicle state recorded on blockchain
6. Events emitted for indexing

**Service Update Flow:**
1. Service Centre authenticates
2. Searches vehicle by VIN
3. Updates mileage via `updateMileage()` function
4. Smart contract validates: mileage must increase
5. Service timestamp automatically recorded
6. Event logged on blockchain

---

## 3. SMART CONTRACTS

### 3.1 VehicleRegistry.sol (Basic Version)

**File Location:** `contracts/VehicleRegistry.sol`
**Lines:** 179
**Gas Consumption:** ~150,000-200,000 per registration

#### Core Data Structure
```solidity
struct Vehicle {
    string vin;              // Vehicle Identification Number
    string color;
    string model;
    string company;
    string ownerName;
    string ownerId;
    uint256 distanceRun;     // Current mileage
    uint256 lastServiceDate;
    bool exists;
}
```

#### Key Functions

| Function | Access | Description | Gas Cost |
|----------|--------|-------------|----------|
| `registerVehicle()` | Dealership | Creates new vehicle record | ~150k |
| `updateMileage()` | Service Centre | Updates vehicle mileage | ~50k |
| `getVehicleDetails()` | Public | Retrieves vehicle data | ~5k (read) |
| `verifyVehicle()` | Public | Confirms vehicle existence | ~3k (read) |
| `isVehicleRegistered()` | Public | Checks registration status | ~2k (read) |

### 3.2 VehicleRegistryIPFS.sol (Enhanced Version)

**File Location:** `contracts/VehicleRegistryIPFS.sol`
**Lines:** 521
**Deployment Address:** `0x099a33Fc774d2C1C8f941A79b05171ba0c30d24a`

#### Extended Vehicle Structure
```solidity
struct Vehicle {
    // ... all basic fields ...
    string imageIpfsHash;           // Vehicle image CID
    string documentsIpfsHash;       // Registration/insurance bundle
    string metadataIpfsHash;        // Complete JSON metadata
}
```

#### Service Document Tracking
```solidity
struct ServiceDocument {
    string vin;                     // Vehicle VIN
    string serviceType;             // oil change, repair, etc.
    string ipfsHash;                // Invoice/proof document CID
    string description;             // Service description
    uint256 mileage;                // Mileage at service time
    uint256 cost;                   // Service cost in wei
    uint256 timestamp;              // When service performed
    address serviceCentre;          // Service centre address
}
```

#### Contract Functions Summary

| Category | Functions | Purpose |
|----------|-----------|---------|
| **Registration** | `registerVehicle()` | Register with 9 parameters including IPFS hashes |
| **Documents** | `updateVehicleDocuments()`, `updateVehicleImage()` | Update IPFS content |
| **Service** | `addServiceDocument()`, `getServiceDocuments()` | Service history management |
| **Ownership** | `transferOwnership()` | Transfer with documentation |
| **Query** | `getVehicleWithDocuments()`, `getVehicleIPFSHashes()` | Data retrieval |
| **Utility** | `isVehicleRegistered()`, `getTotalVehicles()` | Status queries |

### 3.3 Security Features

| Security Measure | Implementation |
|------------------|----------------|
| **Role-Based Access** | Modifier functions (`onlyDealership`, `onlyServiceCentre`) |
| **Input Validation** | Non-empty string checks, VIN length validation |
| **Mileage Protection** | Cannot decrease mileage (`newDistance > vehicles[vin].distanceRun`) |
| **Duplicate Prevention** | `vehicleNotExists` modifier prevents re-registration |
| **Zero-Address Protection** | Constructor validates all role addresses |
| **IPFS Hash Validation** | `validIPFSHash` modifier ensures non-empty CIDs |

---

## 4. FRONTEND APPLICATION

### 4.1 Page Structure

| Page | File | Role | Key Features |
|------|------|------|--------------|
| **Login/Landing** | `index.html` | Entry Point | MetaMask connection, role detection |
| **Dealership** | `dealership.html` | Vehicle Registration | Form, IPFS upload, recent registrations |
| **Service Centre** | `servicecentre.html` | Mileage Updates | VIN search, mileage validation |
| **Company** | `company.html` | Verification | Complete vehicle display, document view |
| **IPFS Demo** | `ipfs-demo.html` | Testing | Upload testing, CID verification |

### 4.2 Dealership Dashboard

**File:** `src/js/dealership.js` (496 lines)

**Features:**
- Real-time IPFS upload with progress tracking
- Vehicle image preview before submission
- Batch document upload
- Auto-upload functionality
- LocalStorage-based recent registrations (up to 5)
- Form validation (VIN must be 17 characters)
- Transaction status feedback

**Key Code Snippet (Image Upload):**
```javascript
const handleImageUpload = async (file) => {
    console.log('🖼️ Image upload started...');
    const result = await uploadToPinata(file, {
        name: `vehicle-${Date.now()}-${file.name}`,
        metadata: { type: 'vehicle-image' }
    });

    if (result.success) {
        imageIpfsHash = result.cid;
        console.log('✅ Image CID saved:', imageIpfsHash);
        showStatus('Image uploaded to IPFS successfully!', 'success');
        return result.cid;
    }
};
```

### 4.3 Service Centre Dashboard

**File:** `src/js/servicecentre.js` (279 lines)

**Workflow:**
1. Enter 17-character VIN
2. Retrieve current vehicle details
3. Input new mileage (must be greater than current)
4. Submit transaction
5. Automatic service date update

**Validation Logic:**
```javascript
if (newMileage <= currentMileage) {
    throw new Error('New mileage must be greater than current mileage');
}
```

### 4.4 Company Verification Dashboard

**File:** `src/js/company.js` (317 lines)

**Display Information:**
- Vehicle specifications (VIN, model, color, company)
- Owner details (name, ID)
- Current mileage and last service date
- Vehicle image from IPFS
- Downloadable registration documents
- Service history with IPFS proofs

---

## 5. IPFS INTEGRATION

### 5.1 IPFS Utility Module

**File:** `src/utils/ipfs.js` (515 lines)

**Configuration:**
```javascript
const IPFS_CONFIG = {
    pinata: {
        gateway: 'https://gateway.pinata.cloud/ipfs/',
        api: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        jwt: process.env.PINATA_JWT || 'your_jwt_token'
    },
    publicGateways: [
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://ipfs.infura.io/ipfs/'
    ]
};
```

### 5.2 Upload Functions

| Function | Purpose | Return |
|----------|---------|--------|
| `uploadToPinata()` | Single file upload via Pinata | `{ success, cid, error }` |
| `uploadMultipleToIPFS()` | Batch file uploads | `{ success, files, successCount }` |
| `uploadMetadataToIPFS()` | JSON metadata upload | `{ success, cid, error }` |
| `uploadVehicleMetadata()` | Vehicle-specific metadata | `{ success, cid, gatewayUrl }` |

### 5.3 Retrieval Functions

| Function | Purpose | Return |
|----------|---------|--------|
| `getFromIPFS()` | Fetch content by CID | Content string |
| `getMetadataFromIPFS()` | Fetch JSON metadata | Parsed object |
| `getIPFSGatewayURL()` | Generate gateway URL | Full HTTPS URL |
| `isValidCID()` | Validate CID format | Boolean |

### 5.4 File Size Limits

- Default: 10 MB per file
- Configurable via parameters
- Pinata free tier: 1 GB total storage

---

## 6. SECURITY FEATURES

### 6.1 Smart Contract Security

| Threat | Mitigation |
|--------|------------|
| Unauthorized Registration | `onlyDealership` modifier with address verification |
| Unauthorized Mileage Updates | `onlyServiceCentre` modifier |
| Mileage Rollback | `require(newDistance > vehicles[vin].distanceRun)` |
| Duplicate Registration | `vehicleNotExists` modifier |
| Empty IPFS Hashes | `validIPFSHash` modifier |
| Zero Address Roles | Constructor validation |

### 6.2 Frontend Security

| Feature | Implementation |
|---------|----------------|
| MetaMask Authentication | Web3.js wallet connection |
| Role Verification | Contract-based role checking |
| Session Management | LocalStorage for session persistence |
| Account Change Detection | Auto-logout on account switch |
| Input Sanitization | `.trim()` on all form inputs |
| File Validation | Size and type checking before upload |

### 6.3 Network Security

- MetaMask transaction confirmation required
- No private keys stored (wallet-based auth)
- Contract addresses loaded from build artifacts
- Environment variables for sensitive API keys

---

## 7. TESTING & QUALITY ASSURANCE

### 7.1 Test Suite

**File:** `test/vehicleRegistry.test.js`
**Framework:** Truffle Test (Mocha + Chai)
**Total Tests:** 25+ test cases

### 7.2 Test Categories

#### 1. Contract Initialization Tests (5 tests)
```javascript
✓ Should set correct dealership address
✓ Should set correct service centre address
✓ Should set correct company address
✓ Should reject zero dealership address
✓ Should reject zero service centre address
```

#### 2. Vehicle Registration Tests (6 tests)
```javascript
✓ Dealership can register vehicle
✓ Unauthorized user cannot register
✓ Service centre cannot register
✓ Cannot register duplicate VIN
✓ Cannot register with empty VIN
✓ Cannot register with empty owner name
```

#### 3. Mileage Update Tests (4 tests)
```javascript
✓ Service centre can update mileage
✓ Unauthorized user cannot update
✓ Cannot decrease mileage
✓ Cannot update non-existent vehicle
```

#### 4. Vehicle Retrieval Tests (3 tests)
```javascript
✓ Returns correct vehicle data
✓ Returns empty for non-existent vehicle
✓ Returns all fields correctly
```

#### 5. Vehicle Verification Tests (2 tests)
```javascript
✓ Can verify registered vehicle
✓ Cannot verify non-existent vehicle
```

#### 6. IPFS-Specific Tests (5+ tests)
```javascript
✓ Register vehicle with IPFS hashes
✓ Update vehicle documents
✓ Add service documents
✓ Retrieve service documents
✓ Transfer ownership with documents
```

### 7.3 Running Tests

```bash
# Run all tests
npm test

# Run specific test file
truffle test test/vehicleRegistry.test.js

# Run with verbose output
truffle test --verbose
```

---

## 8. DEPLOYMENT & INFRASTRUCTURE

### 8.1 Deployment Status

| Network | Status | Contract Address | Block Explorer |
|---------|--------|------------------|----------------|
| **Ganache Local** | Deployed | `0x099a33Fc774d2C1C8f941A79b05171ba0c30d24a` | N/A |
| **Sepolia Testnet** | Ready | - | Etherscan |
| **Goerli Testnet** | Ready | - | Etherscan |
| **Polygon Mumbai** | Ready | - | PolygonScan |
| **Ethereum Mainnet** | Ready | - | Etherscan |

### 8.2 Role Addresses (Local Deployment)

| Role | Address |
|------|---------|
| Dealership | `0x725B5F8AcdCb00952bEC203309c192A7f9dB57E9` |
| Service Centre | `0x38635377D0751F9C01286ACc3C0b28aAaad24E65` |
| Company | `0xD2cCd502cbF14A9f6Ff9b08a0fe27CCbD933d017` |

### 8.3 Package Scripts

```json
{
  "test": "truffle test",
  "build:css": "npx tailwindcss -i ./public/styles/tailwind.css -o ./public/styles/output.css --minify",
  "watch:css": "npx tailwindcss -i ./public/styles/tailwind.css -o ./public/styles/output.css --watch",
  "compile": "truffle compile",
  "migrate": "truffle migrate",
  "migrate:reset": "truffle migrate --reset",
  "start": "node server/app.js"
}
```

### 8.4 Environment Variables

Required `.env` file:
```env
PINATA_JWT=your_pinata_jwt_token
PINATA_API_KEY=your_api_key
PINATA_API_SECRET=your_api_secret
```

---

## 9. PROJECT STATISTICS

### 9.1 Code Metrics

| Metric | Value |
|--------|-------|
| **Smart Contract Lines** | 719 lines (3 contracts) |
| **JavaScript Lines** | 2,000+ lines (6 modules) |
| **HTML/CSS Lines** | 500+ lines (5 pages) |
| **Test Code** | 300+ lines (25+ tests) |
| **Documentation** | 15+ markdown files |
| **Total Files** | 50+ files |

### 9.2 Dependency Summary

**Production Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| web3 | ^4.16.0 | Blockchain interaction |
| ipfs-http-client | ^60.0.1 | IPFS operations |
| express | ^4.21.2 | Backend server |
| cors | ^2.8.5 | CORS handling |
| axios | ^1.13.3 | HTTP requests |
| truffle | ^5.11.5 | Development framework |

**Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4.1.14 | CSS framework |
| autoprefixer | ^10.4.21 | CSS prefixes |
| postcss | ^8.5.6 | CSS processing |

### 9.3 Gas Cost Analysis

| Operation | Estimated Gas | Cost (at 20 gwei) |
|-----------|---------------|-------------------|
| Contract Deployment | ~2,500,000 | ~0.05 ETH |
| Vehicle Registration | ~150,000-200,000 | ~0.003-0.004 ETH |
| Mileage Update | ~50,000 | ~0.001 ETH |
| Document Update | ~80,000 | ~0.0016 ETH |
| Service Document | ~100,000 | ~0.002 ETH |
| Ownership Transfer | ~60,000 | ~0.0012 ETH |

---

## 10. FUTURE ENHANCEMENTS

### 10.1 Potential Improvements

| Category | Enhancement | Benefit |
|----------|-------------|---------|
| **Smart Contract** | Layer 2 integration (Polygon, Arbitrum) | Lower gas fees |
| **Smart Contract** | Pausable functionality | Emergency stops |
| **Frontend** | Mobile app (React Native) | Mobile accessibility |
| **Frontend** | Dark mode toggle | User preference |
| **IPFS** | File encryption | Privacy protection |
| **IPFS** | NFT integration for documents | Document ownership |
| **Features** | Multi-signature ownership | Shared ownership |
| **Features** | Vehicle recall tracking | Safety management |
| **Features** | Insurance integration | Automated claims |
| **Features** | GPS/location tracking | Theft prevention |

### 10.2 Scalability Considerations

- **Batch Operations**: `getVehicleIPFSHashes()` for multiple vehicles
- **Indexing**: Event-based indexing for fast lookups
- **Caching**: Redis layer for frequently accessed data
- **GraphQL API**: Alternative to REST for complex queries

---

## APPENDIX

### A. File Structure Reference

```
Blockchain vehicle/
├── contracts/
│   ├── Migrations.sol (19 lines)
│   ├── VehicleRegistry.sol (179 lines)
│   └── VehicleRegistryIPFS.sol (521 lines)
├── migrations/
│   ├── 1_initial_migration.js
│   ├── 2_deploy_vehicle_registry.js
│   └── 3_deploy_vehicle_registry_ipfs.js
├── public/
│   ├── index.html
│   ├── dealership.html
│   ├── servicecentre.html
│   ├── company.html
│   ├── ipfs-demo.html
│   ├── config.js
│   └── styles/
├── src/
│   ├── js/
│   │   ├── web3.js (119 lines)
│   │   ├── auth.js (136 lines)
│   │   ├── config.js (82 lines)
│   │   ├── dealership.js (496 lines)
│   │   ├── servicecentre.js (279 lines)
│   │   └── company.js (317 lines)
│   └── utils/
│       ├── contractInteraction.js (268 lines)
│       └── ipfs.js (515 lines)
├── server/
│   └── app.js (24 lines)
├── test/
│   └── vehicleRegistry.test.js (300+ lines)
└── documentation/
    ├── README.md
    ├── SETUP_GUIDE.md
    ├── IPFS_IMPLEMENTATION_SUMMARY.md
    ├── TESTING_GUIDE.md
    └── 11+ more markdown files
```

### B. Quick Commands Reference

```bash
# Install dependencies
npm install

# Compile contracts
truffle compile

# Deploy contracts (local)
truffle migrate

# Deploy contracts (reset)
truffle migrate --reset

# Run tests
npm test

# Start development server
npm start

# Build CSS
npm run build:css

# Watch CSS
npm run watch:css
```

---

## CONCLUSION

This Blockchain Vehicle Tracking System represents a **complete, production-ready DApp** that successfully demonstrates:

- **Smart Contract Development**: Secure, tested Solidity contracts with access control
- **IPFS Integration**: Decentralized document storage with Pinata
- **Modern Web3**: MetaMask integration with role-based authentication
- **Professional UX**: Glassmorphism UI with real-time feedback
- **Comprehensive Testing**: 25+ passing test cases
- **Full Documentation**: 15+ detailed documentation files

The project is suitable for:
- Educational demonstrations of blockchain technology
- Portfolio showcase for blockchain development skills
- Foundation for commercial vehicle management systems
- Reference implementation for similar DApps

**All features are functional and tested. Ready for testnet/mainnet deployment.**

---

*Report generated on January 28, 2026*
*Project Version: 1.0.0*
*License: ISC*
