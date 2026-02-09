import { getContract, getWeb3 } from '../js/web3.js';
import { getCurrentAccount } from '../js/auth.js';

export const registerVehicle = async (vehicleData) => {
    try {
        const contract = getContract();
        const account = await getCurrentAccount();

        if (!account) {
            throw new Error('No account connected');
        }

        const { vin, color, model, company, ownerName, ownerId, imageIpfsHash = '', documentsIpfsHash = '' } = vehicleData;

        console.log('Registering vehicle with data:', vehicleData);
        console.log('From account:', account);
        console.log('Contract address:', contract.options.address);
        console.log('IPFS hashes - Image:', imageIpfsHash, 'Documents:', documentsIpfsHash);

        // Check if contract supports IPFS (has 9 parameters instead of 6)
        try {
            // Try calling with IPFS hashes (new contract)
            const tx = await contract.methods
                .registerVehicle(vin, color, model, company, ownerName, ownerId, imageIpfsHash, documentsIpfsHash, '')
                .send({ from: account });

            console.log('Vehicle registered successfully with IPFS!');
            console.log('Transaction hash:', tx.transactionHash);
            console.log('Block number:', tx.blockNumber);

            return tx;
        } catch (error) {
            // If error mentions "arguments" or "parameters", fall back to old contract
            if (error.message.includes('arguments') || error.message.includes('parameters')) {
                console.log('Contract does not support IPFS, using legacy registration...');

                const tx = await contract.methods
                    .registerVehicle(vin, color, model, company, ownerName, ownerId)
                    .send({ from: account });

                console.log('Vehicle registered successfully (legacy mode)!');
                console.log('Transaction hash:', tx.transactionHash);

                return tx;
            }
            throw error;
        }
    } catch (error) {
        console.error('Error registering vehicle:', error);
        throw error;
    }
};

export const updateMileage = async (vin, newDistance) => {
    try {
        const contract = getContract();
        const account = await getCurrentAccount();
        
        if (!account) {
            throw new Error('No account connected');
        }

        console.log('Updating mileage for VIN:', vin);
        console.log('New distance:', newDistance);
        console.log('From account:', account);

        // Convert newDistance to string to ensure proper handling
        const distanceStr = newDistance.toString();
        console.log('Distance as string:', distanceStr);

        // Estimate gas first
        let gasEstimate;
        try {
            gasEstimate = await contract.methods
                .updateMileage(vin, distanceStr)
                .estimateGas({ from: account });
            console.log('Gas estimate:', gasEstimate);
        } catch (gasError) {
            console.error('Gas estimation failed:', gasError);
            console.error('Gas error details:', gasError.message);
            
            // Check for specific contract errors
            if (gasError.message && gasError.message.includes('revert')) {
                const revertReason = gasError.message.match(/revert (.+)/);
                throw new Error(revertReason ? revertReason[1] : 'Transaction will fail: Contract requirement not met');
            }
            throw new Error('Unable to estimate gas. Check if vehicle exists and new mileage is valid.');
        }

        console.log('Sending transaction...');
        
        // Send transaction with gas limit
        const tx = await contract.methods
            .updateMileage(vin, distanceStr)
            .send({ 
                from: account,
                gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
            });

        console.log('Mileage updated successfully!');
        console.log('Transaction hash:', tx.transactionHash);
        console.log('Block number:', tx.blockNumber);
        
        return tx;
    } catch (error) {
        console.error('Error updating mileage:', error);
        
        // Better error messages
        if (error.message && error.message.includes('New distance must be greater')) {
            throw new Error('New mileage must be greater than current mileage');
        } else if (error.message && error.message.includes('Not authorized')) {
            throw new Error('Only Service Centre can update mileage');
        } else if (error.message && error.message.includes('User denied')) {
            throw new Error('Transaction was rejected');
        }
        
        throw error;
    }
};

export const getVehicleDetails = async (vin) => {
    try {
        console.log('Fetching vehicle details for VIN:', vin);
        const contract = getContract();
        console.log('Contract address:', contract.options.address);

        const result = await contract.methods.getVehicleDetails(vin).call();
        console.log('Raw result from contract:', result);

        // Web3 returns an object with numeric indices (0, 1, 2, etc.)
        // Check if result has numeric index 0
        const vinValue = result[0] || result.vin;

        console.log('VIN value from result:', vinValue);

        if (!vinValue || vinValue === '' || vinValue === '0') {
            console.log('Vehicle not found (empty VIN)');
            return null;
        }

        // Parse the result - prioritize numeric indices
        const vehicle = {
            vin: result[0] || result.vin,
            color: result[1] || result.color,
            model: result[2] || result.model,
            company: result[3] || result.company,
            ownerName: result[4] || result.ownerName,
            ownerId: result[5] || result.ownerId,
            distanceRun: (result[6] || result.distanceRun).toString(),
            lastServiceDate: (result[7] || result.lastServiceDate).toString()
        };

        console.log('Parsed vehicle:', vehicle);

        return vehicle;
    } catch (error) {
        console.error('Error getting vehicle details:', error);
        throw error;
    }
};

// Get vehicle details with IPFS hashes (for new contract)
export const getVehicleWithDocuments = async (vin) => {
    try {
        console.log('Fetching vehicle with documents for VIN:', vin);
        const contract = getContract();

        // Try new contract method first
        try {
            const result = await contract.methods.getVehicleWithDocuments(vin).call();

            const vinValue = result[0] || result.vin;
            if (!vinValue || vinValue === '' || vinValue === '0') {
                return null;
            }

            const vehicle = {
                vin: result[0] || result.vin,
                color: result[1] || result.color,
                model: result[2] || result.model,
                company: result[3] || result.company,
                ownerName: result[4] || result.ownerName,
                ownerId: result[5] || result.ownerId,
                distanceRun: (result[6] || result.distanceRun).toString(),
                lastServiceDate: (result[7] || result.lastServiceDate).toString(),
                imageIpfsHash: result[8] || result.imageIpfsHash || '',
                documentsIpfsHash: result[9] || result.documentsIpfsHash || '',
                metadataIpfsHash: result[10] || result.metadataIpfsHash || ''
            };

            console.log('Vehicle with documents:', vehicle);
            return vehicle;
        } catch (error) {
            // Fallback to old method
            console.log('Contract does not support getVehicleWithDocuments, using fallback...');
            const vehicle = await getVehicleDetails(vin);
            if (vehicle) {
                vehicle.imageIpfsHash = '';
                vehicle.documentsIpfsHash = '';
                vehicle.metadataIpfsHash = '';
            }
            return vehicle;
        }
    } catch (error) {
        console.error('Error getting vehicle with documents:', error);
        throw error;
    }
};

export const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === '0') {
        return 'Never serviced';
    }
    
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export const isVehicleRegistered = async (vin) => {
    try {
        const vehicle = await getVehicleDetails(vin);
        return vehicle !== null;
    } catch (error) {
        console.error('Error checking vehicle registration:', error);
        return false;
    }
};

export const estimateGas = async (methodCall, fromAddress) => {
    try {
        const gas = await methodCall.estimateGas({ from: fromAddress });
        return gas;
    } catch (error) {
        console.error('Error estimating gas:', error);
        throw error;
    }
};

export const listenToEvent = (eventName, callback) => {
    try {
        const contract = getContract();
        const web3 = getWeb3();
        
        contract.events[eventName]()
            .on('data', (event) => {
                console.log(`Event ${eventName} received:`, event);
                callback(event);
            })
            .on('error', (error) => {
                console.error(`Error listening to ${eventName}:`, error);
            });
    } catch (error) {
        console.error('Error setting up event listener:', error);
        throw error;
    }
};

export default {
    registerVehicle,
    updateMileage,
    getVehicleDetails,
    getVehicleWithDocuments,
    formatTimestamp,
    isVehicleRegistered,
    estimateGas,
    listenToEvent
};
