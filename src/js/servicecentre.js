import { getCurrentAccount, checkAuthorization, logout, loadRoleAddressesFromContract, getAccountRole } from './auth.js';
import { getVehicleDetails, updateMileage, formatTimestamp } from '../utils/contractInteraction.js';
import { loadContract, initWeb3 } from './web3.js';

let currentVehicle = null;
let recentUpdates = [];

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

const displayVehicleDetails = (vehicle) => {
    document.getElementById('detailVin').textContent = vehicle.vin;
    document.getElementById('detailModel').textContent = `${vehicle.model} (${vehicle.color})`;
    document.getElementById('detailOwner').textContent = vehicle.ownerName;
    document.getElementById('detailMileage').textContent = `${parseInt(vehicle.distanceRun).toLocaleString()} km`;
    document.getElementById('detailLastService').textContent = formatTimestamp(vehicle.lastServiceDate);
    
    document.getElementById('newMileage').min = vehicle.distanceRun;
    document.getElementById('newMileage').placeholder = `Must be greater than ${parseInt(vehicle.distanceRun).toLocaleString()} km`;
    
    document.getElementById('vehicleDetails').classList.remove('hidden');
    document.getElementById('notFoundMessage')?.classList.add('hidden');
};

const updateRecentList = () => {
    const recentDiv = document.getElementById('recentUpdates');
    
    if (recentUpdates.length === 0) {
        recentDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No recent updates</p>';
        return;
    }
    
    recentDiv.innerHTML = recentUpdates.map((update) => `
        <div class="border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-800">VIN: ${update.vin}</p>
                    <p class="text-sm text-gray-600">New Mileage: ${parseInt(update.mileage).toLocaleString()} km</p>
                </div>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Updated</span>
            </div>
        </div>
    `).join('');
};

const initializePage = async () => {
    try {
        const savedAccount = localStorage.getItem('userAccount');
        const savedRole = localStorage.getItem('userRole');
        
        if (!savedAccount || savedRole !== 'Service Centre') {
            showStatus('Please login as Service Centre', 'error');
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
        
        if (role !== 'Service Centre') {
            showStatus('Unauthorized: Service Centre access only', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        document.getElementById('navAccount').textContent = `${account.substring(0, 6)}...${account.substring(38)}`;

        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', logout);

        const searchForm = document.getElementById('searchForm');
        searchForm.addEventListener('submit', handleSearch);

        const updateForm = document.getElementById('updateForm');
        updateForm.addEventListener('submit', handleUpdate);

        updateRecentList();
    } catch (error) {
        console.error('Authorization failed:', error);
        showStatus('Unauthorized access. Redirecting...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
};

const handleSearch = async (e) => {
    e.preventDefault();
    
    const searchBtn = e.target.querySelector('button[type="submit"]');
    const originalText = searchBtn.textContent;
    
    try {
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching...';
        
        const vin = document.getElementById('searchVin').value.trim();
        
        if (!vin) {
            throw new Error('Please enter a VIN');
        }

        showStatus('Searching blockchain...', 'info');

        const vehicle = await getVehicleDetails(vin);
        
        if (!vehicle) {
            document.getElementById('vehicleDetails').classList.add('hidden');
            showStatus('Vehicle not found in registry', 'error');
            currentVehicle = null;
            return;
        }

        currentVehicle = vehicle;
        displayVehicleDetails(vehicle);
        showStatus('Vehicle found!', 'success');
        
    } catch (error) {
        console.error('Search error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        document.getElementById('vehicleDetails').classList.add('hidden');
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = originalText;
    }
};

const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentVehicle) {
        showStatus('Please search for a vehicle first', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
        
        const newMileage = parseInt(document.getElementById('newMileage').value);
        const currentMileage = parseInt(currentVehicle.distanceRun);
        
        if (newMileage <= currentMileage) {
            throw new Error(`New mileage must be greater than current mileage (${currentMileage} km)`);
        }

        showStatus('Submitting transaction to blockchain...', 'info');

        const tx = await updateMileage(currentVehicle.vin, newMileage);
        
        recentUpdates.unshift({
            vin: currentVehicle.vin,
            mileage: newMileage
        });
        if (recentUpdates.length > 5) {
            recentUpdates.pop();
        }
        
        updateRecentList();
        
        showStatus('Mileage updated successfully!', 'success');
        
        const updatedVehicle = await getVehicleDetails(currentVehicle.vin);
        currentVehicle = updatedVehicle;
        displayVehicleDetails(updatedVehicle);
        
        document.getElementById('newMileage').value = '';
        
    } catch (error) {
        console.error('Update error:', error);
        let errorMsg = 'Failed to update mileage. ';
        
        if (error.message.includes('Not authorized')) {
            errorMsg += 'You are not authorized as a service centre.';
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
