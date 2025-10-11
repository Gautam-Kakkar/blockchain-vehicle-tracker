import { getCurrentAccount, checkAuthorization, logout, loadRoleAddressesFromContract, getAccountRole } from './auth.js';
import { registerVehicle } from '../utils/contractInteraction.js';
import { loadContract, initWeb3 } from './web3.js';

let recentRegistrations = [];

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

const updateRecentList = () => {
    const recentDiv = document.getElementById('recentVehicles');
    
    if (recentRegistrations.length === 0) {
        recentDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No vehicles registered yet</p>';
        return;
    }
    
    recentDiv.innerHTML = recentRegistrations.map((vehicle, index) => `
        <div class="border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-800">${vehicle.model} (${vehicle.color})</p>
                    <p class="text-sm text-gray-600">VIN: ${vehicle.vin}</p>
                    <p class="text-sm text-gray-600">Owner: ${vehicle.ownerName}</p>
                </div>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Registered</span>
            </div>
        </div>
    `).join('');
};

const initializePage = async () => {
    try {
        // Check if user is logged in
        const savedAccount = localStorage.getItem('userAccount');
        const savedRole = localStorage.getItem('userRole');
        
        console.log('Saved account:', savedAccount);
        console.log('Saved role:', savedRole);
        
        if (!savedAccount || savedRole !== 'Dealership') {
            console.log('Not authorized for dealership, redirecting...');
            showStatus('Please login as Dealership', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }

        const contractLoaded = await loadContractData();
        if (!contractLoaded) {
            showStatus('Failed to load contract', 'error');
            return;
        }

        const account = await getCurrentAccount();
        const role = getAccountRole(account);
        
        console.log('Current account:', account);
        console.log('Current role:', role);
        
        if (role !== 'Dealership') {
            showStatus('Unauthorized: Dealership access only', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        document.getElementById('navAccount').textContent = `${account.substring(0, 6)}...${account.substring(38)}`;

        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', logout);

        const vehicleForm = document.getElementById('vehicleForm');
        vehicleForm.addEventListener('submit', handleVehicleRegistration);

        updateRecentList();
        
        console.log('Dealership page initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showStatus('Error loading page: ' + error.message, 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
};

const handleVehicleRegistration = async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        
        const vehicleData = {
            vin: document.getElementById('vin').value.trim(),
            color: document.getElementById('color').value.trim(),
            model: document.getElementById('model').value.trim(),
            company: document.getElementById('company').value.trim(),
            ownerName: document.getElementById('ownerName').value.trim(),
            ownerId: document.getElementById('ownerId').value.trim()
        };

        if (vehicleData.vin.length !== 17) {
            throw new Error('VIN must be exactly 17 characters');
        }

        showStatus('Submitting transaction to blockchain...', 'info');

        const tx = await registerVehicle(vehicleData);
        
        recentRegistrations.unshift(vehicleData);
        if (recentRegistrations.length > 5) {
            recentRegistrations.pop();
        }
        
        updateRecentList();
        
        showStatus('Vehicle registered successfully!', 'success');
        
        e.target.reset();
    } catch (error) {
        console.error('Registration error:', error);
        let errorMsg = 'Failed to register vehicle. ';
        
        if (error.message.includes('Not authorized')) {
            errorMsg += 'You are not authorized as a dealership.';
        } else if (error.message.includes('User denied')) {
            errorMsg += 'Transaction was rejected.';
        } else {
            errorMsg += error.message;
        }
        
        showStatus(errorMsg, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
};

window.addEventListener('load', initializePage);
