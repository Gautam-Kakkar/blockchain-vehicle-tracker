// Web3 is loaded from CDN in the HTML file
const Web3 = window.Web3;

let web3;
let contract;
let contractAddress;
let contractABI;

const GANACHE_URL = 'http://127.0.0.1:7545';

export const initWeb3 = async () => {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        console.log('Web3 initialized with MetaMask');
        return web3;
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider(GANACHE_URL));
        console.log('Web3 initialized with Ganache provider');
        console.warn('MetaMask not detected. Please install MetaMask extension.');
        return web3;
    }
};

export const getWeb3 = () => {
    if (!web3) {
        throw new Error('Web3 not initialized. Call initWeb3() first.');
    }
    return web3;
};

export const loadContract = async (address, abi) => {
    if (!web3) {
        await initWeb3();
    }
    
    contractAddress = address;
    contractABI = abi;
    contract = new web3.eth.Contract(abi, address);
    
    console.log('Contract loaded at:', address);
    return contract;
};

export const getContract = () => {
    if (!contract) {
        throw new Error('Contract not loaded. Call loadContract() first.');
    }
    return contract;
};

export const getContractAddress = () => contractAddress;

export const getAccounts = async () => {
    if (!web3) {
        await initWeb3();
    }
    return await web3.eth.getAccounts();
};

export const requestAccounts = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            return accounts;
        } catch (error) {
            console.error('User denied account access:', error);
            throw error;
        }
    } else {
        throw new Error('MetaMask not installed');
    }
};

export const getNetworkId = async () => {
    if (!web3) {
        await initWeb3();
    }
    return await web3.eth.net.getId();
};

export const getCurrentBlock = async () => {
    if (!web3) {
        await initWeb3();
    }
    return await web3.eth.getBlockNumber();
};

export const fromWei = (value, unit = 'ether') => {
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    return web3.utils.fromWei(value, unit);
};

export const toWei = (value, unit = 'ether') => {
    if (!web3) {
        throw new Error('Web3 not initialized');
    }
    return web3.utils.toWei(value, unit);
};

initWeb3();

export default {
    initWeb3,
    getWeb3,
    loadContract,
    getContract,
    getContractAddress,
    getAccounts,
    requestAccounts,
    getNetworkId,
    getCurrentBlock,
    fromWei,
    toWei
};
