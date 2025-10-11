import { requestAccounts, getAccounts, initWeb3, getContract, loadContract } from './web3.js';

const ROLE_ADDRESSES = {
    dealership: null,
    serviceCentre: null,
    company: null
};

export const setRoleAddresses = (dealership, serviceCentre, company) => {
    ROLE_ADDRESSES.dealership = dealership?.toLowerCase();
    ROLE_ADDRESSES.serviceCentre = serviceCentre?.toLowerCase();
    ROLE_ADDRESSES.company = company?.toLowerCase();
    
    console.log('Role addresses set:', ROLE_ADDRESSES);
};

export const loadRoleAddressesFromContract = async () => {
    try {
        const contract = getContract();
        
        const dealership = await contract.methods.dealership().call();
        const serviceCentre = await contract.methods.serviceCentre().call();
        const company = await contract.methods.company().call();
        
        setRoleAddresses(dealership, serviceCentre, company);
        return { dealership, serviceCentre, company };
    } catch (error) {
        console.error('Error loading role addresses from contract:', error);
        throw error;
    }
};

export const connectWallet = async () => {
    try {
        await initWeb3();
        const accounts = await requestAccounts();
        
        if (accounts && accounts.length > 0) {
            console.log('Wallet connected:', accounts[0]);
            return accounts[0];
        } else {
            throw new Error('No accounts found');
        }
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw new Error('Failed to connect to MetaMask. Please make sure it is installed and unlocked.');
    }
};

export const getCurrentAccount = async () => {
    try {
        const accounts = await getAccounts();
        return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
        console.error('Failed to get current account:', error);
        return null;
    }
};

export const getAccountRole = (account) => {
    if (!account) {
        return 'Unknown';
    }
    
    const accountLower = account.toLowerCase();
    
    if (accountLower === ROLE_ADDRESSES.dealership) {
        return 'Dealership';
    } else if (accountLower === ROLE_ADDRESSES.serviceCentre) {
        return 'Service Centre';
    } else if (accountLower === ROLE_ADDRESSES.company) {
        return 'Company';
    } else {
        return 'Unauthorized';
    }
};

export const checkAuthorization = async (requiredRole) => {
    try {
        const account = await getCurrentAccount();
        
        if (!account) {
            throw new Error('No account connected');
        }
        
        const role = getAccountRole(account);
        
        if (role !== requiredRole) {
            throw new Error(`Unauthorized: This page requires ${requiredRole} role`);
        }
        
        return true;
    } catch (error) {
        console.error('Authorization check failed:', error);
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('userAccount');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
};

if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
            logout();
        } else {
            const newAccount = accounts[0];
            const savedAccount = localStorage.getItem('userAccount');
            
            if (savedAccount && newAccount.toLowerCase() !== savedAccount.toLowerCase()) {
                console.log('Account switched, logging out...');
                logout();
            }
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        console.log('Chain changed:', chainId);
        window.location.reload();
    });
}

export default {
    setRoleAddresses,
    loadRoleAddressesFromContract,
    connectWallet,
    getCurrentAccount,
    getAccountRole,
    checkAuthorization,
    logout
};
