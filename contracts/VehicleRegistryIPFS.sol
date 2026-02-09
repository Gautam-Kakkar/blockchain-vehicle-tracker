// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VehicleRegistry with IPFS Support
 * @dev Extended vehicle registry with IPFS document storage
 */
contract VehicleRegistryIPFS {
    // ========================================================================
    // STRUCTS
    // ========================================================================

    struct Vehicle {
        string vin;
        string color;
        string model;
        string company;
        string ownerName;
        string ownerId;
        uint256 distanceRun;
        uint256 lastServiceDate;
        bool exists;

        // IPFS fields
        string imageIpfsHash;           // Vehicle image CID
        string documentsIpfsHash;       // Registration, insurance documents
        string metadataIpfsHash;        // Complete metadata JSON
    }

    struct ServiceDocument {
        string vin;                     // Vehicle VIN
        string serviceType;             // Type of service (oil change, repair, etc.)
        string ipfsHash;                // Document CID
        string description;             // Service description
        uint256 mileage;                // Mileage at service
        uint256 cost;                   // Service cost in wei
        uint256 timestamp;              // When service was performed
        address serviceCentre;          // Which service centre
    }

    // ========================================================================
    // STATE VARIABLES
    // ========================================================================

    mapping(string => Vehicle) public vehicles;
    string[] public vehicleVINs;
    ServiceDocument[] public serviceDocuments;
    mapping(string => uint256[]) public vehicleServiceDocuments; // vin => document indices

    address public dealership;
    address public serviceCentre;
    address public company;

    // ========================================================================
    // EVENTS
    // ========================================================================

    event VehicleRegistered(
        string indexed vin,
        string model,
        string ownerName,
        string imageIpfsHash,
        address indexed registeredBy,
        uint256 timestamp
    );

    event MileageUpdated(
        string indexed vin,
        uint256 newDistance,
        uint256 serviceDate,
        address indexed updatedBy
    );

    event VehicleVerified(
        string indexed vin,
        address indexed verifiedBy,
        uint256 timestamp
    );

    event DocumentsUploaded(
        string indexed vin,
        string documentType,
        string ipfsHash,
        address indexed uploadedBy,
        uint256 timestamp
    );

    event ServiceDocumentAdded(
        string indexed vin,
        string serviceType,
        string ipfsHash,
        uint256 mileage,
        address indexed addedBy,
        uint256 timestamp
    );

    event OwnershipTransferred(
        string indexed vin,
        string indexed fromOwnerId,
        string toOwnerId,
        string toOwnerName,
        address transferredBy,
        uint256 timestamp
    );

    // ========================================================================
    // MODIFIERS
    // ========================================================================

    modifier onlyDealership() {
        require(msg.sender == dealership, "Not authorized: Dealership only");
        _;
    }

    modifier onlyServiceCentre() {
        require(msg.sender == serviceCentre, "Not authorized: Service centre only");
        _;
    }

    modifier onlyCompany() {
        require(msg.sender == company, "Not authorized: Company only");
        _;
    }

    modifier vehicleExists(string memory vin) {
        require(vehicles[vin].exists, "Vehicle not registered");
        _;
    }

    modifier vehicleNotExists(string memory vin) {
        require(!vehicles[vin].exists, "Vehicle already registered");
        _;
    }

    modifier validIPFSHash(string memory hash) {
        require(bytes(hash).length > 0, "IPFS hash cannot be empty");
        _;
    }

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor(address _dealership, address _serviceCentre, address _company) {
        require(_dealership != address(0), "Invalid dealership address");
        require(_serviceCentre != address(0), "Invalid service centre address");
        require(_company != address(0), "Invalid company address");

        dealership = _dealership;
        serviceCentre = _serviceCentre;
        company = _company;
    }

    // ========================================================================
    // VEHICLE REGISTRATION
    // ========================================================================

    /**
     * @dev Register a new vehicle with IPFS documents
     * @param vin Vehicle Identification Number
     * @param color Vehicle color
     * @param model Vehicle model
     * @param companyName Manufacturing company
     * @param ownerName Current owner name
     * @param ownerId Owner ID/document number
     * @param imageIpfsHash IPFS CID of vehicle image
     * @param documentsIpfsHash IPFS CID of registration documents
     * @param metadataIpfsHash IPFS CID of complete metadata
     */
    function registerVehicle(
        string memory vin,
        string memory color,
        string memory model,
        string memory companyName,
        string memory ownerName,
        string memory ownerId,
        string memory imageIpfsHash,
        string memory documentsIpfsHash,
        string memory metadataIpfsHash
    ) public onlyDealership vehicleNotExists(vin) {
        require(bytes(vin).length > 0, "VIN cannot be empty");
        require(bytes(model).length > 0, "Model cannot be empty");
        require(bytes(ownerName).length > 0, "Owner name cannot be empty");
        require(bytes(ownerId).length > 0, "Owner ID cannot be empty");

        vehicles[vin] = Vehicle({
            vin: vin,
            color: color,
            model: model,
            company: companyName,
            ownerName: ownerName,
            ownerId: ownerId,
            distanceRun: 0,
            lastServiceDate: block.timestamp,
            exists: true,
            imageIpfsHash: imageIpfsHash,
            documentsIpfsHash: documentsIpfsHash,
            metadataIpfsHash: metadataIpfsHash
        });

        vehicleVINs.push(vin);

        emit VehicleRegistered(vin, model, ownerName, imageIpfsHash, msg.sender, block.timestamp);
        emit DocumentsUploaded(vin, "registration", documentsIpfsHash, msg.sender, block.timestamp);
    }

    // ========================================================================
    // DOCUMENT MANAGEMENT
    // ========================================================================

    /**
     * @dev Update vehicle documents
     * @param vin Vehicle VIN
     * @param imageIpfsHash New image CID (empty string to keep existing)
     * @param documentsIpfsHash New documents CID (empty string to keep existing)
     * @param metadataIpfsHash New metadata CID (empty string to keep existing)
     */
    function updateVehicleDocuments(
        string memory vin,
        string memory imageIpfsHash,
        string memory documentsIpfsHash,
        string memory metadataIpfsHash
    ) public vehicleExists(vin) {
        // Only dealership or company can update documents
        require(
            msg.sender == dealership || msg.sender == company,
            "Not authorized to update documents"
        );

        // Update only if new value is provided
        if (bytes(imageIpfsHash).length > 0) {
            vehicles[vin].imageIpfsHash = imageIpfsHash;
            emit DocumentsUploaded(vin, "image", imageIpfsHash, msg.sender, block.timestamp);
        }

        if (bytes(documentsIpfsHash).length > 0) {
            vehicles[vin].documentsIpfsHash = documentsIpfsHash;
            emit DocumentsUploaded(vin, "documents", documentsIpfsHash, msg.sender, block.timestamp);
        }

        if (bytes(metadataIpfsHash).length > 0) {
            vehicles[vin].metadataIpfsHash = metadataIpfsHash;
            emit DocumentsUploaded(vin, "metadata", metadataIpfsHash, msg.sender, block.timestamp);
        }
    }

    /**
     * @dev Update only vehicle image
     */
    function updateVehicleImage(string memory vin, string memory imageIpfsHash)
        public
        vehicleExists(vin)
        validIPFSHash(imageIpfsHash)
    {
        require(
            msg.sender == dealership || msg.sender == company,
            "Not authorized to update image"
        );

        vehicles[vin].imageIpfsHash = imageIpfsHash;
        emit DocumentsUploaded(vin, "image", imageIpfsHash, msg.sender, block.timestamp);
    }

    // ========================================================================
    // SERVICE DOCUMENTS
    // ========================================================================

    /**
     * @dev Add service document with IPFS proof
     * @param vin Vehicle VIN
     * @param serviceType Type of service performed
     * @param ipfsHash IPFS CID of service document/invoice
     * @param description Service description
     * @param mileage Current mileage
     * @param cost Service cost in wei
     */
    function addServiceDocument(
        string memory vin,
        string memory serviceType,
        string memory ipfsHash,
        string memory description,
        uint256 mileage,
        uint256 cost
    ) public onlyServiceCentre vehicleExists(vin) validIPFSHash(ipfsHash) {
        ServiceDocument memory newDoc = ServiceDocument({
            vin: vin,
            serviceType: serviceType,
            ipfsHash: ipfsHash,
            description: description,
            mileage: mileage,
            cost: cost,
            timestamp: block.timestamp,
            serviceCentre: msg.sender
        });

        serviceDocuments.push(newDoc);
        uint256 docIndex = serviceDocuments.length - 1;
        vehicleServiceDocuments[vin].push(docIndex);

        emit ServiceDocumentAdded(vin, serviceType, ipfsHash, mileage, msg.sender, block.timestamp);
    }

    /**
     * @dev Get all service documents for a vehicle
     */
    function getServiceDocuments(string memory vin)
        public
        view
        vehicleExists(vin)
        returns (ServiceDocument[] memory)
    {
        uint256[] memory indices = vehicleServiceDocuments[vin];
        ServiceDocument[] memory docs = new ServiceDocument[](indices.length);

        for (uint256 i = 0; i < indices.length; i++) {
            docs[i] = serviceDocuments[indices[i]];
        }

        return docs;
    }

    /**
     * @dev Get service document count for a vehicle
     */
    function getServiceDocumentCount(string memory vin)
        public
        view
        vehicleExists(vin)
        returns (uint256)
    {
        return vehicleServiceDocuments[vin].length;
    }

    // ========================================================================
    // MILEAGE UPDATE
    // ========================================================================

    function updateMileage(string memory vin, uint256 newDistance)
        public
        onlyServiceCentre
        vehicleExists(vin)
    {
        require(newDistance > vehicles[vin].distanceRun, "New distance must be greater");

        vehicles[vin].distanceRun = newDistance;
        vehicles[vin].lastServiceDate = block.timestamp;

        emit MileageUpdated(vin, newDistance, block.timestamp, msg.sender);
    }

    // ========================================================================
    // OWNERSHIP TRANSFER
    // ========================================================================

    /**
     * @dev Transfer vehicle ownership
     * @param vin Vehicle VIN
     * @param newOwnerId New owner's ID
     * @param newOwnerName New owner's name
     * @param transferDocumentIpfsHash IPFS CID of transfer document
     */
    function transferOwnership(
        string memory vin,
        string memory newOwnerId,
        string memory newOwnerName,
        string memory transferDocumentIpfsHash
    ) public vehicleExists(vin) {
        // Only dealership or current owner can transfer
        require(
            msg.sender == dealership ||
            keccak256(abi.encodePacked(vehicles[vin].ownerId)) == keccak256(abi.encodePacked(newOwnerId)),
            "Not authorized to transfer ownership"
        );

        string memory oldOwnerId = vehicles[vin].ownerId;

        vehicles[vin].ownerId = newOwnerId;
        vehicles[vin].ownerName = newOwnerName;

        emit OwnershipTransferred(vin, oldOwnerId, newOwnerId, newOwnerName, msg.sender, block.timestamp);

        if (bytes(transferDocumentIpfsHash).length > 0) {
            emit DocumentsUploaded(vin, "ownership-transfer", transferDocumentIpfsHash, msg.sender, block.timestamp);
        }
    }

    // ========================================================================
    // QUERY FUNCTIONS
    // ========================================================================

    /**
     * @dev Get complete vehicle details including IPFS hashes
     */
    function getVehicleWithDocuments(string memory vin)
        public
        view
        returns (
            string memory vin_,
            string memory color,
            string memory model,
            string memory company,
            string memory ownerName,
            string memory ownerId,
            uint256 distanceRun,
            uint256 lastServiceDate,
            string memory imageIpfsHash,
            string memory documentsIpfsHash,
            string memory metadataIpfsHash
        )
    {
        Vehicle memory vehicle = vehicles[vin];

        if (!vehicle.exists) {
            return ("", "", "", "", "", "", 0, 0, "", "", "");
        }

        return (
            vehicle.vin,
            vehicle.color,
            vehicle.model,
            vehicle.company,
            vehicle.ownerName,
            vehicle.ownerId,
            vehicle.distanceRun,
            vehicle.lastServiceDate,
            vehicle.imageIpfsHash,
            vehicle.documentsIpfsHash,
            vehicle.metadataIpfsHash
        );
    }

    /**
     * @dev Get vehicle details (backward compatible)
     */
    function getVehicleDetails(string memory vin)
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256
        )
    {
        Vehicle memory vehicle = vehicles[vin];

        if (!vehicle.exists) {
            return ("", "", "", "", "", "", 0, 0);
        }

        return (
            vehicle.vin,
            vehicle.color,
            vehicle.model,
            vehicle.company,
            vehicle.ownerName,
            vehicle.ownerId,
            vehicle.distanceRun,
            vehicle.lastServiceDate
        );
    }

    function verifyVehicle(string memory vin)
        public
        vehicleExists(vin)
        returns (bool)
    {
        emit VehicleVerified(vin, msg.sender, block.timestamp);
        return true;
    }

    function isVehicleRegistered(string memory vin) public view returns (bool) {
        return vehicles[vin].exists;
    }

    function getTotalVehicles() public view returns (uint256) {
        return vehicleVINs.length;
    }

    function getVehicleAtIndex(uint256 index)
        public
        view
        returns (string memory)
    {
        require(index < vehicleVINs.length, "Index out of bounds");
        return vehicleVINs[index];
    }

    function getAllVehicleVINs() public view returns (string[] memory) {
        return vehicleVINs;
    }

    // ========================================================================
    // BATCH OPERATIONS
    // ========================================================================

    /**
     * @dev Get IPFS hashes for multiple vehicles (gas efficient)
     */
    function getVehicleIPFSHashes(string[] memory vins)
        public
        view
        returns (string[] memory imageHashes, string[] memory documentHashes)
    {
        imageHashes = new string[](vins.length);
        documentHashes = new string[](vins.length);

        for (uint256 i = 0; i < vins.length; i++) {
            if (vehicles[vins[i]].exists) {
                imageHashes[i] = vehicles[vins[i]].imageIpfsHash;
                documentHashes[i] = vehicles[vins[i]].documentsIpfsHash;
            }
        }

        return (imageHashes, documentHashes);
    }
}
