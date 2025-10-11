import { getCurrentAccount, checkAuthorization, logout, loadRoleAddressesFromContract, getAccountRole } from './auth.js';
import { getVehicleDetails, formatTimestamp } from '../utils/contractInteraction.js';
import { loadContract, initWeb3 } from './web3.js';

let recentVerifications = [];

const showStatus = (message, type = 'info') => {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
    
    if (type === 'success') {
        statusDiv.classList.add('bg-green-100', 'text-green-800');
    } else if (type === 'error') {
        statusDiv.classList.add('bg-red-100', 'text-red-800');
    } else {
        statusDiv.classList.add('bg-blue-100', 'text-blue-800');
    }
    
    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 5000);
};

const loadContractData = async () => {
    try {
        await initWeb3();
        
        const contractData = await fetch('/build/contracts/VehicleRegistry.json')
            .then(res => res.json());
        
        const networkId = Object.keys(contractData.networks)[0];
        const deployedNetwork = contractData.networks[networkId];
        
        if (!deployedNetwork) {
            throw new Error('Contract not deployed on current network');
        }
        
        await loadContract(deployedNetwork.address, contractData.abi);
        await loadRoleAddressesFromContract();
        
        return true;
    } catch (error) {
        console.error('Error loading contract:', error);
        showStatus('Error: Contract not deployed. Please run truffle migrate first.', 'error');
        return false;
    }
};

const displayVehicleInfo = (vehicle) => {
    document.getElementById('infoVin').textContent = vehicle.vin;
    document.getElementById('infoModel').textContent = vehicle.model;
    document.getElementById('infoColor').textContent = vehicle.color;
    document.getElementById('infoCompany').textContent = vehicle.company;
    document.getElementById('infoOwnerName').textContent = vehicle.ownerName;
    document.getElementById('infoOwnerId').textContent = vehicle.ownerId;
    document.getElementById('infoDistance').textContent = `${parseInt(vehicle.distanceRun).toLocaleString()} km`;
    document.getElementById('infoServiceDate').textContent = formatTimestamp(vehicle.lastServiceDate);
    
    document.getElementById('vehicleInfo').classList.remove('hidden');
    document.getElementById('notFoundMessage').classList.add('hidden');
};

const showNotFound = () => {
    document.getElementById('vehicleInfo').classList.add('hidden');
    document.getElementById('notFoundMessage').classList.remove('hidden');
};

const updateRecentList = () => {
    const recentDiv = document.getElementById('recentVerifications');
    
    if (recentVerifications.length === 0) {
        recentDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No recent verifications</p>';
        return;
    }
    
    recentDiv.innerHTML = recentVerifications.map((verification) => `
        <div class="border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-800">${verification.model} (${verification.color})</p>
                    <p class="text-sm text-gray-600">VIN: ${verification.vin}</p>
                    <p class="text-sm text-gray-600">Owner: ${verification.ownerName}</p>
                    <p class="text-sm text-blue-600">Mileage: ${parseInt(verification.distanceRun).toLocaleString()} km</p>
                </div>
                <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Verified</span>
            </div>
        </div>
    `).join('');
};

const initializePage = async () => {
    try {
        const savedAccount = localStorage.getItem('userAccount');
        const savedRole = localStorage.getItem('userRole');
        
        if (!savedAccount || savedRole !== 'Company') {
            showStatus('Please login as Company', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }

        const contractLoaded = await loadContractData();
        if (!contractLoaded) {
            return;
        }

        const account = await getCurrentAccount();
        const role = getAccountRole(account);
        
        if (role !== 'Company') {
            showStatus('Unauthorized: Company access only', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        document.getElementById('navAccount').textContent = `${account.substring(0, 6)}...${account.substring(38)}`;

        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', logout);

        const verifyForm = document.getElementById('verifyForm');
        verifyForm.addEventListener('submit', handleVerify);

        updateRecentList();
    } catch (error) {
        console.error('Authorization failed:', error);
        showStatus('Unauthorized access. Redirecting...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
};

const handleVerify = async (e) => {
    e.preventDefault();
    
    const verifyBtn = e.target.querySelector('button[type="submit"]');
    const originalText = verifyBtn.textContent;
    
    try {
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        
        const vin = document.getElementById('verifyVin').value.trim();
        
        if (!vin) {
            throw new Error('Please enter a VIN');
        }

        showStatus('Verifying on blockchain...', 'info');

        const vehicle = await getVehicleDetails(vin);
        
        if (!vehicle) {
            showNotFound();
            showStatus('Vehicle not found in blockchain registry', 'error');
            return;
        }

        displayVehicleInfo(vehicle);
        showStatus('Vehicle verified successfully!', 'success');
        
        recentVerifications.unshift(vehicle);
        if (recentVerifications.length > 5) {
            recentVerifications.pop();
        }
        
        updateRecentList();
        
    } catch (error) {
        console.error('Verification error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        document.getElementById('vehicleInfo').classList.add('hidden');
        document.getElementById('notFoundMessage').classList.add('hidden');
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = originalText;
    }
};

window.addEventListener('load', initializePage);
