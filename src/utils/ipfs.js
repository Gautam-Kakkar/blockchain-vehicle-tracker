/**
 * IPFS Utility Module for Vehicle Registry DApp
 * Handles uploading, downloading, and pinning files to IPFS
 * Uses Pinata REST API (no ipfs-http-client dependency needed)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Get Pinata JWT from multiple sources (browser, .env, or hardcoded)
const getPinataJWT = () => {
    // Try multiple times with a small delay to ensure config.js has loaded
    if (typeof window !== 'undefined') {
        // Check if window.PINATA_JWT is set
        if (window.PINATA_JWT && window.PINATA_JWT !== 'YOUR_PINATA_JWT_TOKEN') {
            console.log('✅ JWT found in window.PINATA_JWT');
            return window.PINATA_JWT;
        }

        // Check for hardcoded value (replace this with your actual JWT)
        const DEFAULT_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwODBiYjAzMi1lODAxLTRjMzUtOGQ1Zi0xNTk5NmQwOTA3MTciLCJlbWFpbCI6ImdhdXRhbTI4MjFrYWtrYXJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImQxZTdmZTIwY2M4YjU1MWQzNzkwIiwic2NvcGVkS2V5U2VjcmV0IjoiMTEwMmYxNzViNTc2YmI5YjIwMmZhZGY3Njg1N2UxZTBiZmE4ZmU0MDRjMTMwYzE5MjIxY2FkZjA2ZjBmMDJlMCIsImV4cCI6MTgwMDk4MzU2NX0.CZiL8OZ1IHgwkfwOddoLV7Lad1md_ouEXzhcXV52iSU';

        console.log('⚠️ Using hardcoded JWT (window.PINATA_JWT not set)');
        return DEFAULT_JWT;
    }

    return process.env.PINATA_JWT || '';
};

const IPFS_CONFIG = {
    // Pinata Configuration (Recommended - Free tier available)
    // Get your API keys at: https://app.pinata.cloud/keys
    pinata: {
        gateway: 'https://gateway.pinata.cloud/ipfs/',
        api: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        jwt: getPinataJWT()
    },

    // Public IPFS Gateways (Read-only)
    publicGateways: [
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://ipfs.infura.io/ipfs/'
    ]
};

// Log configuration status
console.log('🔧 IPFS Configuration initialized');
console.log('Pinata Gateway:', IPFS_CONFIG.pinata.gateway);
console.log('JWT configured:', !!IPFS_CONFIG.pinata.jwt);
console.log('JWT length:', IPFS_CONFIG.pinata.jwt?.length || 0);

// ============================================================================
// FILE UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload single file to IPFS via Pinata (Recommended)
 * @param {File} file - File object from HTML input
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with CID and URLs
 */
export const uploadToPinata = async (file, options = {}) => {
    try {
        console.log('🔧 Starting Pinata upload...');
        console.log('File:', file.name, file.size, file.type);
        console.log('JWT configured:', !!IPFS_CONFIG.pinata.jwt);
        console.log('JWT length:', IPFS_CONFIG.pinata.jwt?.length);

        const formData = new FormData();
        formData.append('file', file);

        // Add metadata
        const metadata = {
            name: options.name || file.name,
            keyvalues: {
                timestamp: Date.now().toString(),
                app: 'vehicle-registry',
                fileType: file.type || 'unknown',
                ...(options.metadata || {})
            }
        };

        formData.append('pinataMetadata', JSON.stringify(metadata));

        // Pinata options
        const pinataOptions = {
            cidVersion: 0,
            wrapWithDirectory: false
        };
        formData.append('pinataOptions', JSON.stringify(pinataOptions));

        console.log('📤 Uploading to Pinata API:', IPFS_CONFIG.pinata.api);

        // Upload to Pinata
        const response = await fetch(IPFS_CONFIG.pinata.api, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${IPFS_CONFIG.pinata.jwt}`
            },
            body: formData
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Pinata API error:', response.status, errorText);
            try {
                const error = JSON.parse(errorText);
                throw new Error(error.error || error.message || errorText);
            } catch {
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }
        }

        const result = await response.json();
        console.log('✅ Uploaded to Pinata:', result.IpfsHash);

        return {
            success: true,
            cid: result.IpfsHash,
            size: result.PinSize,
            timestamp: Date.now(),
            urls: {
                pinata: `${IPFS_CONFIG.pinata.gateway}${result.IpfsHash}`,
                ipfs: `${IPFS_CONFIG.publicGateways[0]}${result.IpfsHash}`,
                cloudflare: `${IPFS_CONFIG.publicGateways[2]}${result.IpfsHash}`
            }
        };
    } catch (error) {
        console.error('❌ Pinata upload error:', error);
        console.error('Error stack:', error.stack);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Upload file to IPFS (using Pinata)
 * This is the main upload function - always uses Pinata
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadToIPFS = async (file, options = {}) => {
    try {
        // Validate file size (max 10MB by default)
        const maxSize = options.maxSize || 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        }

        // Always use Pinata (works in browser)
        return await uploadToPinata(file, options);
    } catch (error) {
        console.error('❌ Upload failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Upload multiple files at once
 * @param {FileList|Array} files - Files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Batch upload result
 */
export const uploadMultipleToIPFS = async (files, options = {}) => {
    try {
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            const result = await uploadToIPFS(file, options);
            results.push({
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                ...result
            });

            if (result.success) successCount++;
            else failCount++;
        }

        return {
            success: true,
            total: files.length,
            successCount,
            failCount,
            files: results
        };
    } catch (error) {
        console.error('❌ Batch upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// ============================================================================
// METADATA UPLOAD
// ============================================================================

/**
 * Upload JSON metadata to IPFS
 * @param {Object} metadata - JSON object to upload
 * @returns {Promise<Object>} Upload result
 */
export const uploadMetadataToIPFS = async (metadata) => {
    try {
        const jsonString = JSON.stringify(metadata, null, 2);
        const buffer = Buffer.from(jsonString);

        const result = await uploadToIPFS(
            new File([buffer], 'metadata.json', { type: 'application/json' }),
            { name: 'vehicle-metadata' }
        );

        if (result.success) {
            console.log('✅ Metadata uploaded:', result.cid);
        }

        return result;
    } catch (error) {
        console.error('❌ Metadata upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Create and upload vehicle metadata
 * @param {Object} vehicleData - Vehicle information
 * @param {string} imageCid - IPFS CID of vehicle image
 * @param {Array} documentCids - Array of document CIDs
 * @returns {Promise<Object>} Upload result
 */
export const uploadVehicleMetadata = async (vehicleData, imageCid, documentCids = []) => {
    const metadata = {
        name: `${vehicleData.year || ''} ${vehicleData.model} ${vehicleData.color}`,
        description: `Vehicle registration for VIN: ${vehicleData.vin}`,
        image: imageCid,
        attributes: [
            {
                trait_type: 'VIN',
                value: vehicleData.vin
            },
            {
                trait_type: 'Model',
                value: vehicleData.model
            },
            {
                trait_type: 'Color',
                value: vehicleData.color
            },
            {
                trait_type: 'Company',
                value: vehicleData.company
            },
            {
                trait_type: 'Owner',
                value: vehicleData.ownerName
            },
            {
                trait_type: 'Mileage',
                value: vehicleData.distanceRun || 0
            },
            {
                trait_type: 'Registration Date',
                value: new Date().toISOString()
            }
        ],
        documents: documentCids,
        external_url: window.location.origin
    };

    return await uploadMetadataToIPFS(metadata);
};

// ============================================================================
// FILE RETRIEVAL
// ============================================================================

/**
 * Get IPFS gateway URL for a CID
 * @param {string} cid - IPFS content identifier
 * @param {string} gateway - Gateway to use (default: pinata)
 * @returns {string} Gateway URL
 */
export const getIPFSGatewayURL = (cid, gateway = 'pinata') => {
    if (!cid) {
        console.warn('⚠️ No CID provided to getIPFSGatewayURL');
        return '';
    }

    const gateways = {
        pinata: IPFS_CONFIG.pinata.gateway,
        ipfs: IPFS_CONFIG.publicGateways[0],
        cloudflare: IPFS_CONFIG.publicGateways[2]
    };

    const selectedGateway = gateways[gateway] || gateways.pinata;

    if (!selectedGateway) {
        console.error('❌ No gateway available in getIPFSGatewayURL');
        return `https://ipfs.io/ipfs/${cid}`;
    }

    return `${selectedGateway}${cid}`;
};

/**
 * Fetch file content from IPFS (via gateway)
 * @param {string} cid - IPFS content identifier
 * @returns {Promise<Object>} File content
 */
export const getFromIPFS = async (cid) => {
    try {
        // Use public gateway to fetch content
        const response = await fetch(getIPFSGatewayURL(cid));

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.arrayBuffer();

        return {
            success: true,
            data: data,
            source: 'gateway',
            size: data.byteLength
        };
    } catch (error) {
        console.error('❌ IPFS retrieval error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Fetch JSON metadata from IPFS
 * @param {string} cid - IPFS content identifier
 * @returns {Promise<Object>} Parsed JSON object
 */
export const getMetadataFromIPFS = async (cid) => {
    try {
        const result = await getFromIPFS(cid);

        if (result.success) {
            const jsonString = result.data.toString();
            const metadata = JSON.parse(jsonString);

            return {
                success: true,
                metadata: metadata
            };
        }

        return result;
    } catch (error) {
        console.error('❌ Metadata retrieval error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// ============================================================================
// PINNING FUNCTIONS
// ============================================================================

/**
 * Pin CID to prevent garbage collection (via Pinata)
 * @param {string} cid - IPFS content identifier
 * @returns {Promise<Object>} Pin result
 */
export const pinToIPFS = async (cid) => {
    try {
        // Pin to Pinata
        const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${IPFS_CONFIG.pinata.jwt}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hashToPin: cid,
                pinataMetadata: {
                    name: `Pinned via Vehicle Registry - ${cid.substring(0, 10)}`
                }
            })
        });

        if (response.ok) {
            console.log('📌 Pinned to Pinata:', cid);
            return { success: true, cid: cid, service: 'pinata' };
        }

        throw new Error('Pinata pin failed');
    } catch (error) {
        console.error('❌ Pin error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate IPFS CID format
 * @param {string} cid - CID to validate
 * @returns {boolean} Valid or not
 */
export const isValidCID = (cid) => {
    // Basic CID validation (CIDv0 and CIDv1)
    const cidv0Regex = /^[1-9A-HJ-NP-Za-km-z]{46}$/;
    const cidv1Regex = /^b[1-9A-HJ-NP-Za-km-z]{50,}$/;

    return cidv0Regex.test(cid) || cidv1Regex.test(cid);
};

/**
 * Convert file to base64 (for previews)
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if IPFS is available
 * @returns {Promise<Object>} Availability status
 */
export const checkIPFSStatus = async () => {
    const status = {
        pinata: false,
        gateways: {}
    };

    // Check Pinata
    status.pinata = IPFS_CONFIG.pinata.jwt !== 'YOUR_PINATA_JWT_TOKEN' &&
                     IPFS_CONFIG.pinata.jwt.length > 100;

    // Check public gateways
    for (const gateway of IPFS_CONFIG.publicGateways) {
        try {
            const response = await fetch(`${gateway}QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`);
            status.gateways[gateway] = response.ok;
        } catch (error) {
            status.gateways[gateway] = false;
        }
    }

    return status;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uploadToIPFS,
    uploadToPinata,
    uploadMultipleToIPFS,
    uploadMetadataToIPFS,
    uploadVehicleMetadata,
    getFromIPFS,
    getMetadataFromIPFS,
    getIPFSGatewayURL,
    pinToIPFS,
    isValidCID,
    fileToBase64,
    formatFileSize,
    checkIPFSStatus
};
