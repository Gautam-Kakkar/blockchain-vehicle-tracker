const VehicleRegistryIPFS = artifacts.require("VehicleRegistryIPFS");

module.exports = function (deployer) {
  deployer.then(async () => {
    // Get the first three Ganache accounts
    const accounts = await web3.eth.getAccounts();
    const dealership = accounts[0];
    const serviceCentre = accounts[1];
    const company = accounts[2];

    console.log('Deploying VehicleRegistryIPFS with accounts:');
    console.log('Dealership:', dealership);
    console.log('Service Centre:', serviceCentre);
    console.log('Company:', company);

    // Deploy the contract
    await deployer.deploy(VehicleRegistryIPFS, dealership, serviceCentre, company);

    console.log('VehicleRegistryIPFS deployed successfully!');
  });
};
