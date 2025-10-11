const VehicleRegistry = artifacts.require("VehicleRegistry");

contract("VehicleRegistry", (accounts) => {
  let vehicleRegistry;
  const dealership = accounts[0];
  const serviceCentre = accounts[1];
  const company = accounts[2];
  const unauthorizedUser = accounts[3];

  const testVehicle = {
    vin: "1HGBH41JXMN109186",
    color: "Red",
    model: "Honda Civic",
    company: "Honda",
    ownerName: "John Doe",
    ownerId: "DL12345678"
  };

  beforeEach(async () => {
    vehicleRegistry = await VehicleRegistry.new(dealership, serviceCentre, company);
  });

  describe("Contract Initialization", () => {
    it("should set correct dealership address", async () => {
      const result = await vehicleRegistry.dealership();
      assert.equal(result, dealership, "Dealership address not set correctly");
    });

    it("should set correct service centre address", async () => {
      const result = await vehicleRegistry.serviceCentre();
      assert.equal(result, serviceCentre, "Service centre address not set correctly");
    });

    it("should set correct company address", async () => {
      const result = await vehicleRegistry.company();
      assert.equal(result, company, "Company address not set correctly");
    });

    it("should reject deployment with zero address", async () => {
      try {
        await VehicleRegistry.new("0x0000000000000000000000000000000000000000", serviceCentre, company);
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Invalid dealership address", "Wrong error message");
      }
    });
  });

  describe("Vehicle Registration", () => {
    it("should allow dealership to register a vehicle", async () => {
      const tx = await vehicleRegistry.registerVehicle(
        testVehicle.vin,
        testVehicle.color,
        testVehicle.model,
        testVehicle.company,
        testVehicle.ownerName,
        testVehicle.ownerId,
        { from: dealership }
      );

      assert.equal(tx.logs[0].event, "VehicleRegistered", "VehicleRegistered event not emitted");
      
      const isRegistered = await vehicleRegistry.isVehicleRegistered(testVehicle.vin);
      assert.equal(isRegistered, true, "Vehicle not registered");
    });

    it("should not allow service centre to register a vehicle", async () => {
      try {
        await vehicleRegistry.registerVehicle(
          testVehicle.vin,
          testVehicle.color,
          testVehicle.model,
          testVehicle.company,
          testVehicle.ownerName,
          testVehicle.ownerId,
          { from: serviceCentre }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not authorized: Dealership only", "Wrong error message");
      }
    });

    it("should not allow unauthorized user to register a vehicle", async () => {
      try {
        await vehicleRegistry.registerVehicle(
          testVehicle.vin,
          testVehicle.color,
          testVehicle.model,
          testVehicle.company,
          testVehicle.ownerName,
          testVehicle.ownerId,
          { from: unauthorizedUser }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not authorized: Dealership only", "Wrong error message");
      }
    });

    it("should not allow duplicate vehicle registration", async () => {
      await vehicleRegistry.registerVehicle(
        testVehicle.vin,
        testVehicle.color,
        testVehicle.model,
        testVehicle.company,
        testVehicle.ownerName,
        testVehicle.ownerId,
        { from: dealership }
      );

      try {
        await vehicleRegistry.registerVehicle(
          testVehicle.vin,
          "Blue",
          "Toyota Camry",
          "Toyota",
          "Jane Smith",
          "DL87654321",
          { from: dealership }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Vehicle already registered", "Wrong error message");
      }
    });

    it("should not allow empty VIN", async () => {
      try {
        await vehicleRegistry.registerVehicle(
          "",
          testVehicle.color,
          testVehicle.model,
          testVehicle.company,
          testVehicle.ownerName,
          testVehicle.ownerId,
          { from: dealership }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "VIN cannot be empty", "Wrong error message");
      }
    });

    it("should increment total vehicles count", async () => {
      const initialCount = await vehicleRegistry.getTotalVehicles();
      
      await vehicleRegistry.registerVehicle(
        testVehicle.vin,
        testVehicle.color,
        testVehicle.model,
        testVehicle.company,
        testVehicle.ownerName,
        testVehicle.ownerId,
        { from: dealership }
      );

      const newCount = await vehicleRegistry.getTotalVehicles();
      assert.equal(newCount.toNumber(), initialCount.toNumber() + 1, "Total vehicles not incremented");
    });
  });

  describe("Mileage Update", () => {
    beforeEach(async () => {
      await vehicleRegistry.registerVehicle(
        testVehicle.vin,
        testVehicle.color,
        testVehicle.model,
        testVehicle.company,
        testVehicle.ownerName,
        testVehicle.ownerId,
        { from: dealership }
      );
    });

    it("should allow service centre to update mileage", async () => {
      const newMileage = 5000;
      const tx = await vehicleRegistry.updateMileage(testVehicle.vin, newMileage, { from: serviceCentre });

      assert.equal(tx.logs[0].event, "MileageUpdated", "MileageUpdated event not emitted");

      const vehicle = await vehicleRegistry.getVehicleDetails(testVehicle.vin);
      assert.equal(vehicle[6].toNumber(), newMileage, "Mileage not updated correctly");
    });

    it("should not allow dealership to update mileage", async () => {
      try {
        await vehicleRegistry.updateMileage(testVehicle.vin, 5000, { from: dealership });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not authorized: Service centre only", "Wrong error message");
      }
    });

    it("should not allow unauthorized user to update mileage", async () => {
      try {
        await vehicleRegistry.updateMileage(testVehicle.vin, 5000, { from: unauthorizedUser });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not authorized: Service centre only", "Wrong error message");
      }
    });

    it("should not allow decreasing mileage", async () => {
      await vehicleRegistry.updateMileage(testVehicle.vin, 10000, { from: serviceCentre });

      try {
        await vehicleRegistry.updateMileage(testVehicle.vin, 5000, { from: serviceCentre });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "New distance must be greater than current distance", "Wrong error message");
      }
    });

    it("should update last service date", async () => {
      const tx = await vehicleRegistry.updateMileage(testVehicle.vin, 5000, { from: serviceCentre });
      const block = await web3.eth.getBlock(tx.receipt.blockNumber);

      const vehicle = await vehicleRegistry.getVehicleDetails(testVehicle.vin);
      assert.equal(vehicle[7].toNumber(), block.timestamp, "Last service date not updated");
    });

    it("should not allow updating mileage for non-existent vehicle", async () => {
      try {
        await vehicleRegistry.updateMileage("INVALID_VIN", 5000, { from: serviceCentre });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Vehicle not registered", "Wrong error message");
      }
    });
  });

  describe("Vehicle Details Retrieval", () => {
    beforeEach(async () => {
      await vehicleRegistry.registerVehicle(
        testVehicle.vin,
        testVehicle.color,
        testVehicle.model,
        testVehicle.company,
        testVehicle.ownerName,
        testVehicle.ownerId,
        { from: dealership }
      );
    });

    it("should return correct vehicle details", async () => {
      const vehicle = await vehicleRegistry.getVehicleDetails(testVehicle.vin);

      assert.equal(vehicle[0], testVehicle.vin, "VIN not correct");
      assert.equal(vehicle[1], testVehicle.color, "Color not correct");
      assert.equal(vehicle[2], testVehicle.model, "Model not correct");
      assert.equal(vehicle[3], testVehicle.company, "Company not correct");
      assert.equal(vehicle[4], testVehicle.ownerName, "Owner name not correct");
      assert.equal(vehicle[5], testVehicle.ownerId, "Owner ID not correct");
      assert.equal(vehicle[6].toNumber(), 0, "Initial distance should be 0");
    });

    it("should return empty data for non-existent vehicle", async () => {
      const vehicle = await vehicleRegistry.getVehicleDetails("INVALID_VIN");

      assert.equal(vehicle[0], "", "Should return empty string for VIN");
      assert.equal(vehicle[6].toNumber(), 0, "Should return 0 for distance");
    });

    it("should allow anyone to view vehicle details", async () => {
      const vehicle = await vehicleRegistry.getVehicleDetails(testVehicle.vin, { from: unauthorizedUser });
      assert.equal(vehicle[0], testVehicle.vin, "Anyone should be able to view details");
    });
  });

  describe("Vehicle Verification", () => {
    beforeEach(async () => {
      await vehicleRegistry.registerVehicle(
        testVehicle.vin,
        testVehicle.color,
        testVehicle.model,
        testVehicle.company,
        testVehicle.ownerName,
        testVehicle.ownerId,
        { from: dealership }
      );
    });

    it("should allow anyone to verify a vehicle", async () => {
      const result = await vehicleRegistry.verifyVehicle(testVehicle.vin, { from: company });
      assert.equal(result.logs[0].event, "VehicleVerified", "VehicleVerified event not emitted");
    });

    it("should not allow verifying non-existent vehicle", async () => {
      try {
        await vehicleRegistry.verifyVehicle("INVALID_VIN", { from: company });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Vehicle not registered", "Wrong error message");
      }
    });
  });

  describe("Vehicle List Management", () => {
    it("should return all registered VINs", async () => {
      await vehicleRegistry.registerVehicle(
        "VIN001",
        "Red",
        "Model1",
        "Company1",
        "Owner1",
        "ID1",
        { from: dealership }
      );

      await vehicleRegistry.registerVehicle(
        "VIN002",
        "Blue",
        "Model2",
        "Company2",
        "Owner2",
        "ID2",
        { from: dealership }
      );

      const vins = await vehicleRegistry.getAllVehicleVINs();
      assert.equal(vins.length, 2, "Should return 2 VINs");
      assert.equal(vins[0], "VIN001", "First VIN not correct");
      assert.equal(vins[1], "VIN002", "Second VIN not correct");
    });

    it("should return VIN at specific index", async () => {
      await vehicleRegistry.registerVehicle(
        testVehicle.vin,
        testVehicle.color,
        testVehicle.model,
        testVehicle.company,
        testVehicle.ownerName,
        testVehicle.ownerId,
        { from: dealership }
      );

      const vin = await vehicleRegistry.getVehicleAtIndex(0);
      assert.equal(vin, testVehicle.vin, "VIN at index 0 not correct");
    });

    it("should revert when accessing out of bounds index", async () => {
      try {
        await vehicleRegistry.getVehicleAtIndex(999);
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Index out of bounds", "Wrong error message");
      }
    });
  });
});
