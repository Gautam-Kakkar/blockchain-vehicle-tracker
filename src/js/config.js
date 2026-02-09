// Contract configuration - Update this after deployment
export const CONTRACT_ADDRESS = null; // Will be loaded from build artifacts

export const getContractABI = async () => {
    try {
        // Try VehicleRegistryIPFS first (new contract with IPFS support)
        let contractJSON;
        try {
            const response = await fetch('/build/contracts/VehicleRegistryIPFS.json');
            contractJSON = await response.json();
            console.log('✅ Using VehicleRegistryIPFS ABI (IPFS-enabled)');
            return contractJSON.abi;
        } catch (error) {
            // Fallback to old contract
            console.warn('⚠️ VehicleRegistryIPFS not found, using old contract ABI');
            const response = await fetch('/build/contracts/VehicleRegistry.json');
            contractJSON = await response.json();
            return contractJSON.abi;
        }
    } catch (error) {
        console.error('Error loading contract ABI:', error);
        throw new Error('Failed to load contract ABI. Make sure the contract is compiled and deployed.');
    }
};

export const getContractAddress = async () => {
    try {
        // Try VehicleRegistryIPFS first (new contract with IPFS support)
        let contractJSON;
        try {
            const response = await fetch('/build/contracts/VehicleRegistryIPFS.json');
            contractJSON = await response.json();
            console.log('✅ Using VehicleRegistryIPFS address (IPFS-enabled)');

            // Get the network ID
            const networkId = Object.keys(contractJSON.networks)[0];

            if (!networkId || !contractJSON.networks[networkId]) {
                throw new Error('VehicleRegistryIPFS not deployed. Please run: npx truffle migrate');
            }

            return contractJSON.networks[networkId].address;
        } catch (error) {
            // Fallback to old contract
            console.warn('⚠️ VehicleRegistryIPFS not found, using old contract address');
            const response = await fetch('/build/contracts/VehicleRegistry.json');
            contractJSON = await response.json();

            // Get the network ID (usually 5777 for Ganache)
            const networkId = Object.keys(contractJSON.networks)[0];

            if (!networkId || !contractJSON.networks[networkId]) {
                throw new Error('Contract not deployed. Please run: npx truffle migrate');
            }

            return contractJSON.networks[networkId].address;
        }
    } catch (error) {
        console.error('Error loading contract address:', error);
        throw error;
    }
};

export const initializeContract = async () => {
    try {
        const address = await getContractAddress();
        const abi = await getContractABI();
        
        return { address, abi };
    } catch (error) {
        console.error('Failed to initialize contract:', error);
        throw error;
    }
};

export default {
    CONTRACT_ADDRESS,
    getContractABI,
    getContractAddress,
    initializeContract
};
