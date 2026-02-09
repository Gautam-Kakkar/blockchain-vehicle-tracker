import { getCurrentAccount, checkAuthorization, logout, loadRoleAddressesFromContract, getAccountRole } from './auth.js';
import { getVehicleDetails, getVehicleWithDocuments, formatTimestamp } from '../utils/contractInteraction.js';
import { loadContract, initWeb3 } from './web3.js';
import { getIPFSGatewayURL } from '../utils/ipfs.js';

let recentVerifications = [];

// Load recent verifications from localStorage
const loadRecentVerifications = () => {
    try {
        const saved = localStorage.getItem('recentVehicleVerifications');
        if (saved) {
            recentVerifications = JSON.parse(saved);
            console.log('Loaded recent verifications:', recentVerifications.length);
        }
    } catch (error) {
        console.error('Error loading recent verifications:', error);
        recentVerifications = [];
    }
};

// Save recent verifications to localStorage
const saveRecentVerifications = () => {
    try {
        localStorage.setItem('recentVehicleVerifications', JSON.stringify(recentVerifications));
    } catch (error) {
        console.error('Error saving recent verifications:', error);
    }
};

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

        // Try to load VehicleRegistryIPFS first (new contract with IPFS support)
        let contractData;
        try {
            contractData = await fetch('/build/contracts/VehicleRegistryIPFS.json')
                .then(res => res.json());
            console.log('✅ Using VehicleRegistryIPFS contract (IPFS-enabled)');
        } catch (error) {
            // Fallback to old contract
            console.warn('⚠️ VehicleRegistryIPFS not found, using old contract');
            contractData = await fetch('/build/contracts/VehicleRegistry.json')
                .then(res => res.json());
        }
        
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
    console.log('📋 displayVehicleInfo called with vehicle:', vehicle);
    console.log('Vehicle type:', typeof vehicle);
    console.log('Vehicle keys:', vehicle ? Object.keys(vehicle) : 'N/A');

    // Check if vehicle exists
    if (!vehicle) {
        console.error('❌ Vehicle is null or undefined');
        showNotFound();
        return;
    }

    // Basic vehicle details
    document.getElementById('infoVin').textContent = vehicle.vin || 'N/A';
    document.getElementById('infoModel').textContent = vehicle.model || 'N/A';
    document.getElementById('infoColor').textContent = vehicle.color || 'N/A';
    document.getElementById('infoCompany').textContent = vehicle.company || 'N/A';
    document.getElementById('infoOwnerName').textContent = vehicle.ownerName || 'N/A';
    document.getElementById('infoOwnerId').textContent = vehicle.ownerId || 'N/A';
    document.getElementById('infoDistance').textContent = `${parseInt(vehicle.distanceRun || 0).toLocaleString()} km`;
    document.getElementById('infoServiceDate').textContent = formatTimestamp(vehicle.lastServiceDate);

    // Display vehicle image from IPFS
    const vehicleImageContainer = document.getElementById('vehicleImageContainer');
    const vehicleImage = document.getElementById('vehicleImage');
    const noImageText = document.getElementById('noImageText');

    console.log('Image IPFS Hash:', vehicle.imageIpfsHash);
    console.log('Documents IPFS Hash:', vehicle.documentsIpfsHash);

    if (vehicle.imageIpfsHash && vehicle.imageIpfsHash !== '') {
        try {
            const imageUrl = getIPFSGatewayURL(vehicle.imageIpfsHash);
            console.log('🖼️ Image URL:', imageUrl);

            if (imageUrl && imageUrl !== '') {
                vehicleImage.src = imageUrl;
                vehicleImageContainer.classList.remove('hidden');
                noImageText.classList.add('hidden');
                console.log('✅ Vehicle image displayed');
            } else {
                console.warn('⚠️ Failed to get image URL');
                vehicleImageContainer.classList.add('hidden');
                noImageText.classList.remove('hidden');
            }
        } catch (error) {
            console.error('❌ Error displaying image:', error);
            console.error('Error stack:', error.stack);
            vehicleImageContainer.classList.add('hidden');
            noImageText.classList.remove('hidden');
        }
    } else {
        vehicleImageContainer.classList.add('hidden');
        noImageText.classList.remove('hidden');
        console.log('ℹ️ No image hash for this vehicle');
    }

    // Display documents from IPFS
    const documentsContainer = document.getElementById('documentsContainer');
    const noDocumentsText = document.getElementById('noDocumentsText');

    if (vehicle.documentsIpfsHash && vehicle.documentsIpfsHash !== '') {
        try {
            const documentsUrl = getIPFSGatewayURL(vehicle.documentsIpfsHash);
            console.log('📄 Documents URL:', documentsUrl);

            if (documentsUrl && documentsUrl !== '') {
                documentsContainer.innerHTML = `
                    <a href="${documentsUrl}"
                       target="_blank"
                       class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        View All Documents (IPFS)
                    </a>
                    <p class="text-xs text-gray-500 mt-1">CID: ${vehicle.documentsIpfsHash.substring(0, 20)}...</p>
                `;
                noDocumentsText.classList.add('hidden');
                console.log('✅ Documents link created');
            } else {
                console.warn('⚠️ Failed to get documents URL');
                documentsContainer.innerHTML = '<p class="text-gray-400 italic">No documents available</p>';
            }
        } catch (error) {
            console.error('❌ Error displaying documents:', error);
            console.error('Error stack:', error.stack);
            documentsContainer.innerHTML = '<p class="text-gray-400 italic">No documents available</p>';
        }
    } else {
        documentsContainer.innerHTML = '<p class="text-gray-400 italic">No documents available</p>';
        console.log('ℹ️ No document hash for this vehicle');
    }

    document.getElementById('vehicleInfo').classList.remove('hidden');
    document.getElementById('notFoundMessage').classList.add('hidden');
    console.log('✅ Vehicle info displayed successfully');
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

        // Load recent verifications from localStorage
        loadRecentVerifications();
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

        // Try to get vehicle with IPFS documents first
        let vehicle = await getVehicleWithDocuments(vin);

        // Fallback to old method if new contract doesn't support IPFS
        if (!vehicle) {
            vehicle = await getVehicleDetails(vin);
        }

        if (!vehicle) {
            showNotFound();
            showStatus('Vehicle not found in blockchain registry', 'error');
            return;
        }

        displayVehicleInfo(vehicle);
        showStatus('✓ Vehicle verified successfully with IPFS documents!', 'success');

        recentVerifications.unshift(vehicle);
        if (recentVerifications.length > 5) {
            recentVerifications.pop();
        }

        // Save to localStorage
        saveRecentVerifications();

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
