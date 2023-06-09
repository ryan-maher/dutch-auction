import { expect } from "chai";
import { time, loadFixture, mine} from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

describe("Tests:", function() {
    
    // Saving fixture to load for each test
    async function deployContract(){

        // Get and Deploy contract
        const DutchAuction = await ethers.getContractFactory("BasicDutchAuction");
        const basicDutchAuction = await DutchAuction.deploy(1000, 20, 10); 
        await basicDutchAuction.deployed();
        
        return {basicDutchAuction};

    }

    async function deployLateContract(){

        // Get contract
        const DutchAuction = await ethers.getContractFactory("BasicDutchAuction");
        
        // Mine 10 blocks before deploying
        await mine(10);
        
        // Deploy contract
        const basicDutchAuction = await DutchAuction.deploy(1000, 20, 10); 
        await basicDutchAuction.deployed();
        
        return {basicDutchAuction};

    }

    describe("Owner", function() {
    
        it("Owner of the contract should be the seller", async function () {
            
            // Loading fixture
            const {basicDutchAuction} = await loadFixture(deployContract);

            // Getting signers of contract
            const signers = await ethers.getSigners();

            // Logging signer address and owner address
            // console.log("   contract signer address: " + await (basicDutchAuction.signer.getAddress()));
            // console.log("   contract owner variable: " + await (basicDutchAuction.owner()));
            
            // Checks if owner and signer match
            expect(await basicDutchAuction.owner()).to.equal(signers[0].address);

        });

        it("Seller receives wei from first valid bid", async function () { 
                
            // Loading fixture
            const {basicDutchAuction} = await loadFixture(deployContract);
            
            // Getting address of signers to use an account different than owner to place bid
            const [owner, bidder] = await ethers.getSigners();
    
            // console.log("Owner address: " + owner.address);
            // console.log("Bidder address:" + bidder.address);
    
            var ownerInitialBalance = await owner.getBalance();
            // var bidderInitialBalance = await bidder.getBalance();
            
            // console.log("Owner initial balance: " + ownerInitialBalance);
            // console.log("Bidder initial balance: " + bidderInitialBalance);
            // console.log("\n");
    
            const override = {value: 1500}
            
            // Bidder account places bid
            await basicDutchAuction.connect(bidder).bid(override);
    
            var ownerFinalBalance = (await owner.getBalance());
            // var bidderFinalBalance = (await bidder.getBalance());
    
            var ownerBalanceDifference = ownerFinalBalance.toBigInt() - ownerInitialBalance.toBigInt();
    
            // console.log("Owner final balance:   " + ownerFinalBalance);
            // console.log("Bidder final balance: " + bidderFinalBalance);
            // console.log("Owner balance difference: " + ownerBalanceDifference);
    
            // Check if owner balance increased by bid amount
            expect(ownerBalanceDifference).to.equal(1500n);
            
        });

    });

    describe("Contract", function() {
    
        it("Contract sets correct initial price", async function () {
    
            // Loading fixture
            const {basicDutchAuction} = await loadFixture(deployContract);

            const price = 1200;

            // Get initialPrice from contract
            var initPrice = (await basicDutchAuction.initialPrice()).toNumber();

            // console.log(initPrice);
            // console.log(price);

            // Compare initialPrice with expected price
            expect(initPrice).to.equal(price);
    
        });
        
        it("Contract accepts valid bid", async function () {
    
            // Loading fixture
            const {basicDutchAuction} = await loadFixture(deployContract);
            
            // console.log("   Accepting bids: " + await basicDutchAuction.acceptingBids());
    
            const override = {value: 1500}
            
            // console.log(await basicDutchAuction.bid(override));
    
            // Check if bid is accepted
            expect(await basicDutchAuction.bid(override));
    
        });
        
        it("Contract reverts bid below current price", async function () {

            // Loading fixture
            const {basicDutchAuction} = await loadFixture(deployContract);
    
            const override = {value: 1100}
    
            // Check if insufficient bid gets reverted
            await expect(basicDutchAuction.bid(override)).to.be.reverted;
            
        });
    
        it("Contract reverts bid after valid bid already placed", async function () {
    
            // Loading fixture
            const {basicDutchAuction} = await loadFixture(deployContract);
    
            const override = {value: 1500}
            
            // Make an initial valid bid
            await basicDutchAuction.bid(override);
    
            // Check if second bid gets reverted
            await expect(basicDutchAuction.bid(override)).to.be.reverted;
            
        });
    
        // Code provided by TA
        it("Contract reverts bid if ether transfer to the owner fails (.call fails)", async function () {
            
            const [owner, bidder] = await ethers.getSigners();
            
            const bigNum = BigInt("6000000000000000000");
    
            const testHelperFactory = await ethers.getContractFactory('test');
            const testHelper = await testHelperFactory.deploy();
            await testHelper.deployed();
            
            await expect(
                testHelper.connect(bidder).targetTest({value: bigNum})
                ).to.be.revertedWith("transfer failed");
          
        });
    
    });

    describe("Block Timing", function() {

        it("Auction begins at the block in which the contract is created", async function () {

            // Loading fixture
            var {basicDutchAuction} = await loadFixture(deployContract);

            // Get current block number
            var blockNumber = await time.latestBlock();

            // Get contract starting block number
            var contractBlock = (await (basicDutchAuction.startingBlock())).toNumber();
            
            // console.log("Current block number: " + blockNumber);
            // console.log("Contract block: " + contractBlock);

            // Compare current block number to starting block of contract
            expect(contractBlock).to.equal(blockNumber);

            // Test again with contract deployed at later block
            var {basicDutchAuction} = await loadFixture(deployLateContract);

            var newcontractBlock = (await basicDutchAuction.startingBlock()).toNumber();

            var newblockNumber = await time.latestBlock();

            // console.log("Current block number: " + newblockNumber);
            // console.log("Contract block: " + newcontractBlock);

            // Compare new block number to contract starting block
            expect(newcontractBlock).to.equal(newblockNumber);

        });

        it("Contract accepts bid of lower but sufficient value after some time has passed", async function () {

            const {basicDutchAuction} = await loadFixture(deployContract);
    
            // Mines less blocks than _numBlocksAuctionOpen (set to 20 for these tests)
            await mine(10);
    
            // initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);
            // For this set of tests, initialPrice is calculated to be 1200 (1000 + (20 * 10))
            //
            // currentPrice = initialPrice - ((block.number - startingBlock) * offerPriceDecrement);
            // currentPrice = 1200 - ((11 - 1) * 10) = 1100
            
            const override = {value: 1100}
    
            // Check if bid of lower but sufficient value succeeds after a few blocks have been mined
            expect(await basicDutchAuction.bid(override));
            
        });
        
        it("Contract accepts valid bid at last block of auction", async function () {

            // Loading fixture
            const {basicDutchAuction} = await loadFixture(deployContract);

            // Mines _numBlocksAuctionOpen blocks
            await mine(19);

            // initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);
            // For this set of tests, initialPrice is calculated to be 1200 (1000 + (20 * 10))
            //
            // currentPrice = initialPrice - ((block.number - startingBlock) * offerPriceDecrement);
            // currentPrice = 1200 - ((20 - 1) * 10) = 1000
            
            const override = {value: 1000}

            // Check if bid of lower but sufficient value succeeds after _numBlocksAuctionOpen blocks have been mined
            expect(await basicDutchAuction.bid(override));
            
        });

        it("Bid fails when auction block window has ended", async function () {

            // Loading fixture
            const {basicDutchAuction} = await loadFixture(deployContract);

            const override = {value: 1500}

            // Mines more blocks than auction is open for (current block becomes 21, auction open for 20)
            await mine(20);
            
            // Check if bid gets reverted
            await expect(basicDutchAuction.bid(override)).to.be.reverted;
            
        });

    });

});