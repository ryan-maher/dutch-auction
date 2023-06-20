import { expect } from "chai";
import { time, loadFixture, mine} from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

describe("Tests:", function() {

    async function deployNFTContract(){

        // Get and Deploy contract
        const NFT = await ethers.getContractFactory("NFT");
        const NFTContract = await NFT.deploy(); 
        await NFTContract.deployed();
        
        // console.log("NFT contract deployed by: ", await NFTContract.signer.getAddress());
        // console.log("NFT contract deployed to: ", NFTContract.address);

        return {NFTContract};

    }

    async function deployContractsAndMint(){

        // Get and Deploy contract
        const NFT = await ethers.getContractFactory("NFT");
        const NFTContract = await NFT.deploy(); 
        await NFTContract.deployed();

        const tokenid = 10;

        const [owner, account1, account2] = await ethers.getSigners();

        const mint = (await NFTContract.safeMint(owner.address, tokenid));

        const DutchAuction = await ethers.getContractFactory("NFTDutchAuction");
        const NFTDutchAuction = await DutchAuction.deploy(NFTContract.address, tokenid, 1000, 20, 10);

        // console.log("NFT contract deployed by: ", await NFTContract.signer.getAddress());
        // console.log("NFT contract deployed to: ", NFTContract.address);

        return {NFTContract, NFTDutchAuction, tokenid};

    }

    async function deployContractsAndMintLate(){

        // Get and Deploy contract
        const NFT = await ethers.getContractFactory("NFT");

        // Mine 10 blocks before deploying
        await mine(10);

        const NFTContract = await NFT.deploy(); 
        await NFTContract.deployed();

        const tokenid = 10;

        const [owner, account1, account2] = await ethers.getSigners();

        const mint = (await NFTContract.safeMint(owner.address, tokenid));

        const DutchAuction = await ethers.getContractFactory("NFTDutchAuction");
        const NFTDutchAuction = await DutchAuction.deploy(NFTContract.address, tokenid, 1000, 20, 10);
        
        // console.log("NFT contract deployed by: ", await NFTContract.signer.getAddress());
        // console.log("NFT contract deployed to: ", NFTContract.address);

        return {NFTContract, NFTDutchAuction, tokenid};

    }

    it("Deployment, Minting, and Transfer succeed", async function () {
        
        // Load NFT contract deployment fixture
        const {NFTContract} = await loadFixture(deployNFTContract);

        // Arbitrary token number
        const tokenid = 32;

        // Get signers
        const [account0, account1, account2] = await ethers.getSigners();

        // console.log("\naccount0: " + account0.address);
        // console.log("account1: " + account1.address);
        // console.log("account2: " + account2.address);

        // Check if accounts are empty before minting
        expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);
        expect((await NFTContract.balanceOf(account2.address)).toNumber()).to.equal(0);
        
        // Mint NFT to account1
        const mint = (await NFTContract.connect(account0).safeMint(account1.address, tokenid));

        // console.log("\nMinting");
        // console.log("Minted by: ", mint.from);
        // console.log("Minted to: ", await NFTContract.ownerOf(tokenid));
        // console.log("Approved address: ", await NFTContract.getApproved(tokenid));
    
        // Check balances after minting
        expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(1);
        expect((await NFTContract.balanceOf(account2.address)).toNumber()).to.equal(0);

        // Deploy auction contract with NFT address and token ID 
        const DutchAuction = await ethers.getContractFactory("NFTDutchAuction");
        const NFTDutchAuction = await DutchAuction.connect(account1).deploy(NFTContract.address, tokenid, 1000, 20, 10); 
        await NFTDutchAuction.deployed();
        
        // console.log("NFT auction contract deployed to: ", NFTDutchAuction.address);
        
        const override = {value: 1500}

        // console.log("\nApproved by: ", app.from);
        // console.log("Approved address: ", await NFTContract.getApproved(tokenid));
        
        // Dutch auction contract address needs to be approved because it calls transferFrom
        const app = await NFTContract.connect(account1).approve(NFTDutchAuction.address, tokenid);
        
        // Place bid
        // bidder is account2
        expect(await NFTDutchAuction.connect(account2).bid(override));

        // Check balances after transfer
        expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);
        expect((await NFTContract.balanceOf(account2.address)).toNumber()).to.equal(1);

    });


    describe("Owner", function() {
    
        it("Owner of the contract should be the seller of NFT", async function () {
                
            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);

            // Getting signers of contract
            const signers = await ethers.getSigners();
            
            // Checks if owner and signer match
            expect(await NFTDutchAuction.owner()).to.equal(signers[0].address);

            // Checks if owner has NFT
            expect((await NFTContract.balanceOf(signers[0].address)).toNumber()).to.equal(1);

        });

        it("Seller receives wei from first valid bid", async function () { 
                    
            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);
            
            // Getting address of signers to use an account different than owner to place bid
            const [owner, account1, account2] = await ethers.getSigners();
            
            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);
            
            var ownerInitialBalance = await owner.getBalance();
            
            const override = {value: 1500}

            // Bidder account places bid
            await NFTDutchAuction.connect(account2).bid(override);

            var ownerFinalBalance = (await owner.getBalance());

            var ownerBalanceDifference = ownerFinalBalance.toBigInt() - ownerInitialBalance.toBigInt();

            // Check if owner balance increased by bid amount
            expect(ownerBalanceDifference).to.equal(1500n);
            
        });

        it("Winning bidder receives NFT", async function () { 
                    
            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);
            
            // Getting address of signers to use an account different than owner to place bid
            const [owner, account1, account2] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);
            
            // Check if bidder does not already have NFT
            expect((await NFTContract.balanceOf(account2.address)).toNumber()).to.equal(0);
            
            const override = {value: 1500}
            
            // Bidder account places bid
            await NFTDutchAuction.connect(account2).bid(override);

            // Bidder receives NFT
            expect((await NFTContract.balanceOf(account2.address)).toNumber()).to.equal(1);
            
        });

    });

    describe("Contract", function() {
    
        it("Contract sets correct initial price", async function () {
        
            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);

            const price = 1200;

            // Get initialPrice from contract
            var initPrice = (await NFTDutchAuction.initialPrice()).toNumber();

            // Compare initialPrice with expected price
            expect(initPrice).to.equal(price);

        });

        it("Contract accepts valid bid", async function () {
        
            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            const override = {value: 1500}

            // Check if bid is accepted
            expect(await NFTDutchAuction.bid(override));

        });

        it("Contract reverts bid below current price", async function () {

            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            const override = {value: 1100}

            // Check if insufficient bid gets reverted
            await expect(NFTDutchAuction.bid(override)).to.be.reverted;
            
        });

        it("Contract reverts bid after valid bid already placed", async function () {
        
            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);
            
            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            const override = {value: 1500}

            // Make an initial valid bid
            await NFTDutchAuction.bid(override);

            // Check if second bid gets reverted
            await expect(NFTDutchAuction.bid(override)).to.be.reverted;
            
        });

        it("Contract rejects approve call from unapproved/non-owner account", async function () {
        
            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);
            
            const [owner, account1, account2] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            expect (NFTContract.connect(account2).approve(NFTDutchAuction.address, tokenid)).to.be.rejected;
            
        });

        it("Contract rejects mint call from unapproved/non-owner account", async function () {

            // Loading fixture
            const {NFTContract} = await loadFixture(deployNFTContract);

            // Get signers
            const [account0, account1, account2] = await ethers.getSigners();

            const tokenid = 32;

            // Only the deployer of NFT contract can call safeMint
            expect(NFTContract.connect(account2).safeMint(account1.address, tokenid)).to.be.rejected;

        });

        it("Contract reverts bid if ether transfer to the owner fails (.call fails)", async function () {

            const [account0, account1, account2] = await ethers.getSigners();

            const bigNum = BigInt("6000000000000000000");
            const tokenid = 32;
            
            // Loading fixtures
            const {NFTContract} = await loadFixture(deployNFTContract);
            
            // Deploy auction contract through intermediary
            const testHelperFactory = await ethers.getContractFactory('test');
            const testHelper = await testHelperFactory.deploy(NFTContract.address, tokenid, 1000, 20, 10);
            await testHelper.deployed();

            // Check if transaction reverts
            await expect(testHelper.connect(account1).targetTest({value: bigNum})).to.be.revertedWith("transfer failed");
            
            // Check if NFT was not transferred
            expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);

        });
    
    });

    describe("Block Timing", function() {
    
        it("Auction begins at the block in which the contract is created", async function () {

            // Loading fixture
            var {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);

            // Get current block number
            var blockNumber = await time.latestBlock();

            // Get contract starting block number
            var contractBlock = (await (NFTDutchAuction.startingBlock())).toNumber();

            // Compare current block number to starting block of contract
            expect(contractBlock).to.equal(blockNumber);

            // Test again with contract deployed at later block
            var {NFTContract, NFTDutchAuction} = await loadFixture(deployContractsAndMintLate);

            var newcontractBlock = (await NFTDutchAuction.startingBlock()).toNumber();

            var newblockNumber = await time.latestBlock();

            // Compare new block number to contract starting block
            expect(newcontractBlock).to.equal(newblockNumber);

        });

        it("Contract accepts bid of lower but sufficient value after some time has passed", async function () {

            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);

            // Mines less blocks than _numBlocksAuctionOpen (set to 20 for these tests)
            await mine(10);

            // initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);
            // For this set of tests, initialPrice is calculated to be 1200 (1000 + (20 * 10))
            //
            // currentPrice = initialPrice - (block.number - (startingBlock + 1) * offerPriceDecrement);
            // currentPrice = 1200 - (16 - (6 - 1)) * 10) = 1100
            
            const override = {value: 1100}

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            // Check if bid of lower but sufficient value succeeds after a few blocks have been mined
            expect(await NFTDutchAuction.bid(override));
            
        });

        it("Contract accepts valid bid at last block of auction", async function () {

            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);
            
            // Mines less blocks than _numBlocksAuctionOpen (set to 20 for these tests)
            await mine(18);
            
            // initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);
            // For this set of tests, initialPrice is calculated to be 1200 (1000 + (20 * 10))
            //
            // currentPrice = initialPrice - (block.number - (startingBlock + 1) * offerPriceDecrement);
            // currentPrice = 1200 - (25 - (6 - 1) * 10) = 1000 (approve function increments latest block by 1)
            
            const override = {value: 1000}

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            // Check if bid of lower but sufficient value succeeds after a few blocks have been mined
            expect(await NFTDutchAuction.bid(override));
            
        });

        it("Bid fails when auction block window has ended", async function () {

            // Loading fixture
            const {NFTContract, NFTDutchAuction, tokenid} = await loadFixture(deployContractsAndMint);

            const override = {value: 1500}

            // Mines more blocks than auction is open for
            await mine(19);
            
            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            // Check if bid gets reverted
            await expect(NFTDutchAuction.bid(override)).to.be.reverted;
            
        });
    
    });

});