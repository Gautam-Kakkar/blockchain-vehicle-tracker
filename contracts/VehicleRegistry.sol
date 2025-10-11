// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VehicleRegistry {
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
    }

    mapping(string => Vehicle) public vehicles;
    string[] public vehicleVINs;

    address public dealership;
    address public serviceCentre;
    address public company;

    event VehicleRegistered(
        string indexed vin,
        string model,
        string ownerName,
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

    modifier onlyDealership() {
        require(msg.sender == dealership, "Not authorized: Dealership only");
        _;
    }

    modifier onlyServiceCentre() {
        require(msg.sender == serviceCentre, "Not authorized: Service centre only");
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

    constructor(address _dealership, address _serviceCentre, address _company) {
        require(_dealership != address(0), "Invalid dealership address");
        require(_serviceCentre != address(0), "Invalid service centre address");
        require(_company != address(0), "Invalid company address");
        
        dealership = _dealership;
        serviceCentre = _serviceCentre;
        company = _company;
    }

    function registerVehicle(
        string memory vin,
        string memory color,
        string memory model,
        string memory companyName,
        string memory ownerName,
        string memory ownerId
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
            exists: true
        });

        vehicleVINs.push(vin);

        emit VehicleRegistered(vin, model, ownerName, msg.sender, block.timestamp);
    }

    function updateMileage(string memory vin, uint256 newDistance) 
        public 
        onlyServiceCentre 
        vehicleExists(vin) 
    {
        require(newDistance > vehicles[vin].distanceRun, "New distance must be greater than current distance");

        vehicles[vin].distanceRun = newDistance;
        vehicles[vin].lastServiceDate = block.timestamp;

        emit MileageUpdated(vin, newDistance, block.timestamp, msg.sender);
    }

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
}
