const VehicleRegistry = artifacts.require("VehicleRegistry");

module.exports = async function (deployer, network, accounts) {
  console.log("\n========================================");
  console.log("Deploying VehicleRegistry Contract");
  console.log("========================================\n");

  const dealership = accounts[0];
  const serviceCentre = accounts[1];
  const company = accounts[2];

  console.log("Network:", network);
  console.log("\nRole Addresses:");
  console.log("  Dealership    :", dealership);
  console.log("  Service Centre:", serviceCentre);
  console.log("  Company       :", company);
  console.log("");

  await deployer.deploy(VehicleRegistry, dealership, serviceCentre, company);

  const instance = await VehicleRegistry.deployed();
  
  console.log("\n✅ VehicleRegistry Contract Deployed!");
  console.log("Contract Address:", instance.address);
  
  console.log("\n========================================");
  console.log("IMPORTANT: Save these addresses!");
  console.log("========================================");
  console.log("\n📝 Copy these for MetaMask:");
  console.log("  Account 1 (Dealership)    :", dealership);
  console.log("  Account 2 (Service Centre):", serviceCentre);
  console.log("  Account 3 (Company)       :", company);
  console.log("\n📄 Contract Address:", instance.address);
  console.log("\n========================================\n");

  const dealershipCheck = await instance.dealership();
  const serviceCentreCheck = await instance.serviceCentre();
  const companyCheck = await instance.company();

  console.log("✅ Verification:");
  console.log("  Dealership set:", dealershipCheck === dealership);
  console.log("  Service Centre set:", serviceCentreCheck === serviceCentre);
  console.log("  Company set:", companyCheck === company);
  console.log("");
};
