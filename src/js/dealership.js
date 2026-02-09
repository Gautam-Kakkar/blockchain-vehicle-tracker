import { getCurrentAccount, checkAuthorization, logout, loadRoleAddressesFromContract, getAccountRole } from './auth.js';
import { registerVehicle } from '../utils/contractInteraction.js';
import { loadContract, initWeb3 } from './web3.js';
import { uploadToPinata, uploadMultipleToIPFS, uploadVehicleMetadata, fileToBase64, formatFileSize } from '../utils/ipfs.js';

let recentRegistrations = [];

// Load recent registrations from localStorage
const loadRecentRegistrations = () => {
    try {
        const saved = localStorage.getItem('recentVehicleRegistrations');
        if (saved) {
            recentRegistrations = JSON.parse(saved);
            console.log('Loaded recent registrations:', recentRegistrations.length);
        }
    } catch (error) {
        console.error('Error loading recent registrations:', error);
        recentRegistrations = [];
    }
};

// Save recent registrations to localStorage
const saveRecentRegistrations = () => {
    try {
        localStorage.setItem('recentVehicleRegistrations', JSON.stringify(recentRegistrations));
    } catch (error) {
        console.error('Error saving recent registrations:', error);
    }
};

// IPFS state
let selectedImageFile = null;
let selectedDocumentFiles = [];
let imageIpfsHash = null;
let documentsIpfsHash = null;
let imageUploadPromise = null;
let documentsUploadPromise = null;

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

const updateRecentList = () => {
    const recentDiv = document.getElementById('recentVehicles');

    if (recentRegistrations.length === 0) {
        recentDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No vehicles registered yet</p>';
        return;
    }

    recentDiv.innerHTML = recentRegistrations.map((vehicle, index) => `
        <div class="border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center space-x-3">
                        ${vehicle.imageIpfsHash ? `
                            <img src="https://gateway.pinata.cloud/ipfs/${vehicle.imageIpfsHash}"
                                 class="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                 alt="${vehicle.model}" />
                        ` : ''}
                        <div>
                            <p class="font-semibold text-gray-800">${vehicle.model} (${vehicle.color})</p>
                            <p class="text-sm text-gray-600">VIN: ${vehicle.vin}</p>
                            <p class="text-sm text-gray-600">Owner: ${vehicle.ownerName}</p>
                        </div>
                    </div>
                    ${vehicle.documentsIpfsHash ? `
                        <a href="https://gateway.pinata.cloud/ipfs/${vehicle.documentsIpfsHash}"
                           target="_blank"
                           class="inline-flex items-center mt-2 text-sm text-blue-600 hover:underline">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            View Documents
                        </a>
                    ` : ''}
                </div>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Registered</span>
            </div>
        </div>
    `).join('');
};

// ============================================================================
// IPFS UPLOAD FUNCTIONS
// ============================================================================

// Handle image upload
const handleImageUpload = async (file) => {
    try {
        console.log('🖼️ Image upload started...');
        console.log('File:', file.name, file.size, file.type);

        // Update status
        document.getElementById('imageStatusText').textContent = 'Uploading...';
        document.getElementById('imageStatusText').className = 'text-sm font-semibold text-yellow-600';

        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('Image size must be less than 10MB');
        }

        console.log('📤 Calling uploadToPinata...');
        // Upload to Pinata
        const result = await uploadToPinata(file, {
            name: `vehicle-${Date.now()}-${file.name}`,
            metadata: { type: 'vehicle-image' }
        });

        console.log('📥 Upload result:', result);

        if (result.success) {
            imageIpfsHash = result.cid;
            console.log('✅ Image CID saved:', imageIpfsHash);

            // Update status
            document.getElementById('imageStatusText').textContent = '✓ Uploaded';
            document.getElementById('imageStatusText').className = 'text-sm font-semibold text-green-600';

            showStatus('Image uploaded to IPFS successfully!', 'success');
            return result.cid;
        } else {
            console.error('❌ Upload failed:', result.error);
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Image upload error:', error);
        console.error('Error stack:', error.stack);

        // Reset status
        document.getElementById('imageStatusText').textContent = 'Upload failed';
        document.getElementById('imageStatusText').className = 'text-sm font-semibold text-red-600';

        showStatus('Failed to upload image: ' + error.message, 'error');
        return null;
    }
};

// Handle documents upload
const handleDocumentsUpload = async (files) => {
    try {
        // Update status
        document.getElementById('documentsStatusText').textContent = 'Uploading...';
        document.getElementById('documentsStatusText').className = 'text-sm font-semibold text-yellow-600';

        // Upload multiple files
        const result = await uploadMultipleToIPFS(Array.from(files), {
            metadata: { type: 'vehicle-documents' }
        });

        if (result.success) {
            // Create metadata with all document CIDs
            const documentsMetadata = {
                vehicleDocuments: result.files.map(f => ({
                    name: f.fileName,
                    cid: f.cid,
                    size: f.fileSize,
                    uploadedAt: Date.now()
                })),
                totalFiles: result.files.length,
                uploadedAt: new Date().toISOString()
            };

            // Upload metadata to IPFS
            const metadataResult = await uploadVehicleMetadata(
                {}, // Will be filled with vehicle data later
                null,
                result.files.filter(f => f.success).map(f => f.cid)
            );

            if (metadataResult.success) {
                documentsIpfsHash = metadataResult.cid;

                // Update status
                document.getElementById('documentsStatusText').textContent = `✓ ${result.successCount} files uploaded`;
                document.getElementById('documentsStatusText').className = 'text-sm font-semibold text-green-600';

                showStatus(`${result.successCount} document(s) uploaded to IPFS!`, 'success');
                return metadataResult.cid;
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Documents upload error:', error);

        // Reset status
        document.getElementById('documentsStatusText').textContent = 'Upload failed';
        document.getElementById('documentsStatusText').className = 'text-sm font-semibold text-red-600';

        showStatus('Failed to upload documents: ' + error.message, 'error');
        return null;
    }
};

// Setup image upload handlers
const setupImageUpload = () => {
    const imageInput = document.getElementById('vehicleImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    const imageInfo = document.getElementById('imageInfo');
    const removeBtn = document.getElementById('removeImageBtn');

    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        selectedImageFile = file;

        // Show preview
        const base64 = await fileToBase64(file);
        preview.src = base64;
        previewContainer.classList.remove('hidden');
        imageInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;

        // Auto-upload image
        imageUploadPromise = handleImageUpload(file);
    });

    removeBtn.addEventListener('click', () => {
        selectedImageFile = null;
        imageIpfsHash = null;
        imageUploadPromise = null;

        previewContainer.classList.add('hidden');
        imageInput.value = '';

        document.getElementById('imageStatusText').textContent = 'Not uploaded';
        document.getElementById('imageStatusText').className = 'text-sm font-semibold text-gray-800';
    });
};

// Setup documents upload handlers
const setupDocumentsUpload = () => {
    const documentsInput = document.getElementById('vehicleDocuments');
    const documentsList = document.getElementById('documentsList');
    const listItems = document.getElementById('documentsListItems');

    documentsInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        selectedDocumentFiles = files;

        // Show files list
        documentsList.classList.remove('hidden');
        listItems.innerHTML = files.map(file => `
            <li class="flex items-center justify-between bg-white p-2 rounded border">
                <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span class="text-sm text-gray-700">${file.name}</span>
                    <span class="text-xs text-gray-500">(${formatFileSize(file.size)})</span>
                </div>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Ready</span>
            </li>
        `).join('');

        // Auto-upload documents
        documentsUploadPromise = handleDocumentsUpload(files);
    });
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

        // Setup IPFS upload handlers
        setupImageUpload();
        setupDocumentsUpload();

        // Load recent registrations from localStorage
        loadRecentRegistrations();
        updateRecentList();

        const vehicleForm = document.getElementById('vehicleForm');
        vehicleForm.addEventListener('submit', handleVehicleRegistration);

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
    e.stopPropagation(); // Prevent any bubbling

    console.log('🚗 Registration form submitted');

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        // Wait for IPFS uploads to complete
        console.log('⏳ Waiting for IPFS uploads...');
        console.log('imageUploadPromise:', !!imageUploadPromise);
        console.log('documentsUploadPromise:', !!documentsUploadPromise);

        showStatus('Waiting for IPFS uploads to complete...', 'info');

        if (imageUploadPromise) {
            console.log('⏳ Waiting for image upload...');
            await imageUploadPromise;
            console.log('✅ Image upload completed');
        }

        if (documentsUploadPromise) {
            console.log('⏳ Waiting for documents upload...');
            await documentsUploadPromise;
            console.log('✅ Documents upload completed');
        }

        console.log('📋 Collecting form data...');

        const vehicleData = {
            vin: document.getElementById('vin').value.trim(),
            color: document.getElementById('color').value.trim(),
            model: document.getElementById('model').value.trim(),
            company: document.getElementById('company').value.trim(),
            ownerName: document.getElementById('ownerName').value.trim(),
            ownerId: document.getElementById('ownerId').value.trim(),
            imageIpfsHash: imageIpfsHash || '',
            documentsIpfsHash: documentsIpfsHash || ''
        };

        console.log('Vehicle data:', vehicleData);

        if (vehicleData.vin.length !== 17) {
            throw new Error('VIN must be exactly 17 characters');
        }

        // Require at least image upload
        if (!vehicleData.imageIpfsHash) {
            throw new Error('Please upload a vehicle image');
        }

        console.log('📤 Submitting to blockchain...');
        showStatus('Submitting transaction to blockchain...', 'info');

        const tx = await registerVehicle(vehicleData);
        console.log('✅ Transaction complete:', tx.transactionHash);

        // Store with IPFS hashes for display
        recentRegistrations.unshift(vehicleData);
        if (recentRegistrations.length > 5) {
            recentRegistrations.pop();
        }

        // Save to localStorage
        saveRecentRegistrations();
        console.log('💾 Saved to localStorage');

        updateRecentList();

        showStatus('✓ Vehicle registered successfully with IPFS documents!', 'success');

        // Reset form and IPFS state
        e.target.reset();
        selectedImageFile = null;
        selectedDocumentFiles = [];
        imageIpfsHash = null;
        documentsIpfsHash = null;
        imageUploadPromise = null;
        documentsUploadPromise = null;

        // Hide preview
        document.getElementById('imagePreviewContainer').classList.add('hidden');
        document.getElementById('documentsList').classList.add('hidden');

        // Reset status text
        document.getElementById('imageStatusText').textContent = 'Not uploaded';
        document.getElementById('imageStatusText').className = 'text-sm font-semibold text-gray-800';
        document.getElementById('documentsStatusText').textContent = 'Pending';
        document.getElementById('documentsStatusText').className = 'text-sm font-semibold text-gray-800';

        console.log('✅ Registration process complete!');

    } catch (error) {
        console.error('❌ Registration error:', error);
        console.error('Error stack:', error.stack);
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
