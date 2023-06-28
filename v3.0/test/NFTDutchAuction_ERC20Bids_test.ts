import { expect } from "chai";
import { time, loadFixture, mine} from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { erc20 } from "../typechain-types/@openzeppelin/contracts/token";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";

describe("Tests:", function() {

    // Deployed by account0
    async function deployNFTContract(){

        // Get and Deploy contract
        const NFT = await ethers.getContractFactory("NFT");
        const NFTContract = await NFT.deploy(); 
        await NFTContract.deployed();
        
        // console.log("NFT contract deployed by: ", await NFTContract.signer.getAddress());
        // console.log("NFT contract deployed to: ", NFTContract.address);
        
        return {NFTContract};

    }

    // Deployed by account0
    async function deployERC20Contract(){

        // Get signers
        const [account0] = await ethers.getSigners();

        const initialSupply = 50000;

        // Get and Deploy contract
        const ERC20 = await ethers.getContractFactory("ERC20Token");
        const ERC20Contract = await ERC20.connect(account0).deploy(initialSupply); 
        await ERC20Contract.deployed();
        
        // console.log("NFT contract deployed by: ", await ERC20Contract.signer.getAddress());
        // console.log("NFT contract deployed to: ", ERC20Contract.address);

        return {ERC20Contract, initialSupply};

    }

    async function deployContractsAndMint(){

        // Load NFT contract deployment fixture
        const {NFTContract} = await loadFixture(deployNFTContract);
        
        // Mint NFT to account1
        const tokenid = 10;
        const [account0, account1] = await ethers.getSigners();
        const mint = (await NFTContract.safeMint(account0.address, tokenid));

        // Load ERC20 contract deployment fixture
        const {ERC20Contract, initialSupply} = await loadFixture(deployERC20Contract);

        // Deploy Auction contract
        const DutchAuction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
        const NFTDutchAuction = await DutchAuction.deploy(ERC20Contract.address, NFTContract.address, tokenid, 1000, 20, 10);
        
        return {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply};

    }

    async function deployContractsAndMintLate(){

        // Get and Deploy contract
        const NFT = await ethers.getContractFactory("NFT");

        await mine(10);

        const NFTContract = await NFT.deploy(); 
        await NFTContract.deployed();

        // Mint NFT to account1
        const tokenid = 10;
        const [account0, account1] = await ethers.getSigners();
        const mint = (await NFTContract.safeMint(account0.address, tokenid));

        // Load ERC20 contract deployment fixture
        const {ERC20Contract, initialSupply} = await loadFixture(deployERC20Contract);

        // Deploy Auction contract
        const DutchAuction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
        const NFTDutchAuction = await DutchAuction.deploy(ERC20Contract.address, NFTContract.address, tokenid, 1000, 20, 10);
        
        return {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply};

    }
    
    it("Deployment, Minting, and Transfer Succeed", async function () {

        // Load NFT contract deployment fixture
        const {NFTContract} = await loadFixture(deployNFTContract);

        // Arbitrary token number
        const tokenid = 32;

        // Get signers
        const [account0, account1, account2, account3] = await ethers.getSigners();

        // account0 Mints NFT to account2
        const mint = (await NFTContract.connect(account0).safeMint(account2.address, tokenid));

        // Check NFT balances after minting
        expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);
        expect((await NFTContract.balanceOf(account2.address)).toNumber()).to.equal(1);
        expect((await NFTContract.balanceOf(account3.address)).toNumber()).to.equal(0);

        const initialSupply = 50000;

        // account1 deploys ERC20 Token contract
        const ERC20 = await ethers.getContractFactory("ERC20Token");
        const ERC20Contract = await ERC20.connect(account1).deploy(initialSupply); 
        await ERC20Contract.deployed();
        
        // account2 deploys Auction Contract
        const DutchAuction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
        const NFTDutchAuction = await DutchAuction.connect(account2).deploy(ERC20Contract.address, NFTContract.address, tokenid, 1000, 20, 10); 
        await NFTDutchAuction.deployed();

        // Dutch auction contract address needs to be approved because it calls transferFrom
        const app = await NFTContract.connect(account2).approve(NFTDutchAuction.address, tokenid);

        // Approve account3 to spend tokens in order to bid
        await ERC20Contract.connect(account1).approve(account3.address, 2000);

        // Transfer tokens to account3
        await ERC20Contract.connect(account1).transfer(account3.address, 2000);

        // Check ERC20 balances
        expect((await ERC20Contract.balanceOf(account1.address)).toNumber()).to.equal(initialSupply - 2000);
        expect(await ERC20Contract.balanceOf(account3.address)).to.equal(2000);

        // Log addresses
        // console.log("account0 address: ", account0.address);
        // console.log("account1 address: ", account1.address);
        // console.log("account2 address: ", account2.address);
        // console.log("account3 address: ", account3.address);
        // console.log("ERC20 contract address: ", ERC20Contract.address);
        // console.log("Auction contract address: ", NFTDutchAuction.address);
        // console.log("\n");
        
        var approvalAmount = 20000;

        // Approvals
        await ERC20Contract.connect(account1).approve(account3.address, 20000);
        await ERC20Contract.connect(account1).approve(ERC20Contract.address, 20000);
        await ERC20Contract.connect(account1).approve(NFTDutchAuction.address, 20000);
        await ERC20Contract.connect(account1).approve(account2.address, 20000);
        await ERC20Contract.connect(account1).approve(account0.address, 20000);
        
        const bidAmount = 1500;
        
        // account3 approves the Auction contract to call transferFrom and spend account3's tokens on its behalf to receive the bid amount
        await ERC20Contract.connect(account3).approve(NFTDutchAuction.address, bidAmount);

        // Log Allowances
        // console.log("\naccount1 -> account0 allowance: ", (await ERC20Contract.allowance(account1.address, account0.address)).toNumber());
        // console.log("account1 -> itself allowance: ", (await ERC20Contract.allowance(account1.address, account1.address)).toNumber());
        // console.log("account1 -> account2 allowance: ", (await ERC20Contract.allowance(account1.address, account2.address)).toNumber());
        // console.log("account1 -> account3 allowance: ", (await ERC20Contract.allowance(account1.address, account3.address)).toNumber());
        // console.log("account1 -> ERC20 contract ", (await ERC20Contract.allowance(account1.address, ERC20Contract.address)).toNumber());
        // console.log("account1 -> Auction contract ", (await ERC20Contract.allowance(account1.address, NFTDutchAuction.address)).toNumber());
        
        // Place bid
        // bidder is account3
        expect(await NFTDutchAuction.connect(account3).bid(bidAmount));

        // Log balances
        // console.log("account3 token balance: ", await ERC20Contract.balanceOf(account3.address));
        // console.log("account2 token balance: ", await ERC20Contract.balanceOf(account2.address));

        // Check bidder and owner token balances
        expect((await ERC20Contract.balanceOf(account3.address)).toNumber()).to.equal(500);
        expect((await ERC20Contract.balanceOf(account2.address)).toNumber()).to.equal(1500);

        // Check NFT balances after transfer
        expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);
        expect((await NFTContract.balanceOf(account3.address)).toNumber()).to.equal(1);

    });

    describe("Contracts", function() {

        it("Dutch Auction contract sets correct initial price", async function () {
    
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            const price = 1200;

            // Get initialPrice from contract
            var initPrice = (await NFTDutchAuction.initialPrice()).toNumber();

            // Compare initialPrice with expected price
            expect(initPrice).to.equal(price);

        });

        it("Dutch Auction contract accepts valid bid", async function () {
    
            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Getting address of signers to use an account different than owner to place bid
            const [account0, account1, account2] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);

            const bidAmount = 1500;

            // Transfer tokens to bidder account
            await ERC20Contract.transfer(account2.address, bidAmount);
            
            // Approve tokens to be spent
            await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
            await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

            // Bidder account places bid
            expect(await NFTDutchAuction.connect(account2).bid(bidAmount));

        });

        it("Dutch Auction contract reverts bid below current price", async function () {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Getting address of signers to use an account different than owner to place bid
            const [account0, account1, account2] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);

            const bidAmount = 1000;

            // Transfer tokens to bidder account
            await ERC20Contract.transfer(account2.address, bidAmount);
            
            // Approve tokens to be spent
            await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
            await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

            // Bidder account places bid
            await expect(NFTDutchAuction.connect(account2).bid(bidAmount)).to.be.reverted;
            
        });

        it("Dutch Auction contract reverts bid after valid bid already placed", async function () {
    
            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Getting address of signers to use an account different than owner to place bid
            const [account0, account1, account2] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);

            const bidAmount = 1500;

            // Transfer tokens to bidder accounts
            await ERC20Contract.transfer(account1.address, bidAmount);
            await ERC20Contract.transfer(account2.address, bidAmount);
            
            // Approve tokens to be spent
            await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
            await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

            // Bidder account places bid
            expect(await NFTDutchAuction.connect(account2).bid(bidAmount));

            // Different bidder bids after valid bid already placed
            await expect(NFTDutchAuction.connect(account1).bid(bidAmount)).to.be.reverted;
            
        });

        // Cannot test ERC20 transfer require because transferFrom is not returning true on success

        // it("Dutch Auction contract reverts bid if ether transfer to the owner fails (.call fails)", async function () {

        //     // NFT contract and ERC20 contract owner: account0
        //     // Dutch Auction contract owner: test contract address
            
        //     const [account0, account1, account2] = await ethers.getSigners();

        //     const bigNum = BigInt("6000000000000000000");
        //     const tokenid = 32;
            
        //     // Loading fixtures
        //     const {NFTContract} = await loadFixture(deployNFTContract);
        //     const {ERC20Contract} = await loadFixture(deployERC20Contract);
            
        //     // Deploy auction contract through intermediary
        //     const testHelperFactory = await ethers.getContractFactory('test');
        //     const testHelper = await testHelperFactory.deploy(ERC20Contract.address, NFTContract.address, tokenid, 1000, 20, 10);
        //     await testHelper.deployed();

        //     // Check if transaction reverts
        //     await expect(testHelper.connect(account1).targetTest({value: bigNum})).to.be.revertedWith("transfer failed");
            
        //     // Check if NFT was not transferred
        //     expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);

        // });

        it("NFT contract rejects approve call from unapproved/non-owner account", async function () {
    
            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);
            
            const [owner, account1] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            expect (NFTContract.connect(account1).approve(NFTDutchAuction.address, tokenid)).to.be.rejected;
            
        });

        it("NFT contract rejects mint call from unapproved/non-owner account", async function () {

            // NFT contract owner: account0
            
            // Loading fixture
            const {NFTContract} = await loadFixture(deployNFTContract);

            // Get signers
            const [account0, account1] = await ethers.getSigners();

            const tokenid = 5;
            
            // Only the deployer of NFT contract can call safeMint
            await expect(NFTContract.connect(account1).safeMint(account1.address, tokenid)).to.be.rejected;

        });

        it("ERC20 Tokens can be transferred between accounts", async function () {

            // Load ERC20 Token contract deployment fixture
            const {ERC20Contract, initialSupply} = await loadFixture(deployERC20Contract);

            // Get signers
            const [account0, account1, account2, account3] = await ethers.getSigners();
            
            // Log Balances
            // console.log("account0 balance: ", (await ERC20Contract.balanceOf(account0.address)).toNumber());
            // console.log("account1 balance: ", (await ERC20Contract.balanceOf(account1.address)).toNumber());
            // console.log("account2 balance: ", (await ERC20Contract.balanceOf(account2.address)).toNumber());
            // console.log("contract balance: ", (await ERC20Contract.balanceOf(ERC20Contract.address)).toNumber());
            
            // Log Allowances
            // console.log("\naccount0 -> itself allowance: ", (await ERC20Contract.allowance(account0.address, account0.address)).toNumber());
            // console.log("account0 -> account1 allowance: ", (await ERC20Contract.allowance(account0.address, account1.address)).toNumber());
            // console.log("account0 -> account2 allowance: ", (await ERC20Contract.allowance(account0.address, account2.address)).toNumber());
            // console.log("account0 -> contract ", (await ERC20Contract.allowance(account0.address, ERC20Contract.address)).toNumber());

            // Check initial balances
            expect((await ERC20Contract.balanceOf(account0.address)).toNumber()).to.equal(initialSupply);
            expect((await ERC20Contract.balanceOf(account1.address)).toNumber()).to.equal(0);
            expect((await ERC20Contract.balanceOf(account2.address)).toNumber()).to.equal(0);
            expect((await ERC20Contract.balanceOf(account3.address)).toNumber()).to.equal(0);

            // Check initial allowances
            // expect((await ERC20Contract.allowance(account0.address, account0.address)).toNumber()).to.equal(initialSupply);
            // expect((await ERC20Contract.allowance(account0.address, account1.address)).toNumber()).to.equal(0);
            // expect((await ERC20Contract.allowance(account0.address, account2.address)).toNumber()).to.equal(0);
            // expect((await ERC20Contract.allowance(account0.address, account3.address)).toNumber()).to.equal(0);
            
            // Approval only needs to be done on accounts that want to spend token
            // await ERC20Contract.connect(account0).approve(account1.address, 1000);

            // Check allowances after approval
            expect((await ERC20Contract.allowance(account0.address, account0.address)).toNumber()).to.equal(initialSupply);
            expect((await ERC20Contract.allowance(account0.address, account1.address)).toNumber()).to.equal(0);
            expect((await ERC20Contract.allowance(account0.address, account2.address)).toNumber()).to.equal(0);
            expect((await ERC20Contract.allowance(account0.address, account3.address)).toNumber()).to.equal(0);

            // Transfer tokens from account0 to account1
            await ERC20Contract.transferFrom(account0.address, account1.address, 50);

            // Log Balances
            // console.log("\naccount0 balance: ", (await ERC20Contract.balanceOf(account0.address)).toNumber());
            // console.log("account1 balance: ", (await ERC20Contract.balanceOf(account1.address)).toNumber());
            // console.log("account2 balance: ", (await ERC20Contract.balanceOf(account2.address)).toNumber());
            // console.log("contract balance: ", (await ERC20Contract.balanceOf(ERC20Contract.address)).toNumber());

            // Log Allowances
            // console.log("\naccount0 -> itself allowance: ", (await ERC20Contract.allowance(account0.address, account0.address)).toNumber());
            // console.log("account0 -> account1 allowance: ", (await ERC20Contract.allowance(account0.address, account1.address)).toNumber());
            // console.log("account0 -> account2 allowance: ", (await ERC20Contract.allowance(account0.address, account2.address)).toNumber());
            // console.log("account0 -> contract ", (await ERC20Contract.allowance(account0.address, ERC20Contract.address)).toNumber());
            
            // Check balances
            expect((await ERC20Contract.balanceOf(account0.address)).toNumber()).to.equal(initialSupply - 50);
            expect((await ERC20Contract.balanceOf(account1.address)).toNumber()).to.equal(50);
            expect((await ERC20Contract.balanceOf(account2.address)).toNumber()).to.equal(0);
            expect((await ERC20Contract.balanceOf(account3.address)).toNumber()).to.equal(0);
            
        });
        
        it("ERC20 contract rejects approve call from unapproved/non-owner account", async function () {
    
            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);
            
            const [owner, account1] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            expect (ERC20Contract.connect(account1).approve(NFTDutchAuction.address, tokenid)).to.be.rejected;
            
        });

    });
    
    describe("Block Timing", function() {

        it("Auction begins at the block in which the contract is created", async function () {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account1
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Get current block number
            var blockNumber = await time.latestBlock();

            // Get contract starting block number
            var contractBlock = (await (NFTDutchAuction.startingBlock())).toNumber();

            // Compare current block number to starting block of contract
            expect(contractBlock).to.equal(blockNumber);

        });

        it("Contract accepts bid of lower but sufficient value after some time has passed", async function () {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account1
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Getting addresses of signers
            const [account0, account1, account2] = await ethers.getSigners();
            
            await mine(10);
            
            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            const bidAmount = 1200;

            // Transfer tokens to bidder account
            await ERC20Contract.transfer(account2.address, bidAmount);

            // Approve tokens to be spent
            await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
            await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

            // Check if bid of lower but sufficient value succeeds after a few blocks have been mined
            expect(await NFTDutchAuction.connect(account2).bid(bidAmount));

        });

        it("Contract accepts valid bid at last block of auction", async function () {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account1
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Mines less blocks than _numBlocksAuctionOpen (set to 20 for these tests)
            await mine(15);

            const bidAmount = 1000;

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            // Getting addresses of signers
            const [account0, account1, account2] = await ethers.getSigners();

            // Transfer tokens to bidder account
            await ERC20Contract.transfer(account2.address, bidAmount);

            // Approve tokens to be spent
            await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
            await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

            // Check if bid of lower but sufficient value succeeds after a few blocks have been mined
            expect(await NFTDutchAuction.connect(account2).bid(bidAmount));

        });

        it("Bid fails when auction block window has ended", async function () {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account1
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Mines less blocks than _numBlocksAuctionOpen (set to 20 for these tests)
            await mine(16);

            const bidAmount = 1000;

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);

            // Getting addresses of signers
            const [account0, account1, account2] = await ethers.getSigners();

            // Transfer tokens to bidder account
            await ERC20Contract.transfer(account2.address, bidAmount);

            // Approve tokens to be spent
            await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
            await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

            // Check if bid of lower but sufficient value succeeds after a few blocks have been mined
            await expect(NFTDutchAuction.connect(account2).bid(bidAmount)).to.be.revertedWith("Auction closed");

        });

    });

    describe("Owner", function() {

        it("Owner of the contract should be the seller of the NFT", async function () {
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Getting signers of contract
            const [account0, account1] = await ethers.getSigners();
            
            // Checks if owner and signer match
            expect(await NFTDutchAuction.owner()).to.equal(account0.address);

            // Checks if owner has NFT
            expect((await NFTContract.balanceOf(account0.address)).toNumber()).to.equal(1);

        });

        it("Seller receives ERC20 tokens from first valid bid", async function () {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account1
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Getting addresses of signers to use an account different than owner to place bid
            const [account0, account1, account2] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);

            const bidAmount = 1500;

            // Transfer tokens to bidder account
            await ERC20Contract.transfer(account2.address, bidAmount);
            
            // Approve tokens to be spent
            await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
            await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);
            
            var ownerInitialBalance = (await ERC20Contract.balanceOf(account0.address)).toNumber();

            // Bidder account places bid
            await NFTDutchAuction.connect(account2).bid(bidAmount);

            var ownerFinalBalance = ((await ERC20Contract.balanceOf(account0.address)).toNumber());

            var ownerBalanceDifference = ownerFinalBalance - ownerInitialBalance;

            // Check if owner received tokens
            expect(ownerBalanceDifference).to.equal(bidAmount);

        });

        it("Winning bidder receives NFT", async function () {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Loading fixture
            const {NFTContract, NFTDutchAuction, ERC20Contract, tokenid, initialSupply} = await loadFixture(deployContractsAndMint);

            // Getting address of signers to use an account different than owner to place bid
            const [account0, account1, account2] = await ethers.getSigners();

            // Dutch auction contract address needs to be approved because it calls safeTransferFrom
            const app = await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);

            const bidAmount = 1500;

            // Transfer tokens to bidder account
            await ERC20Contract.transfer(account2.address, bidAmount);
            
            // Approve tokens to be spent
            await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
            await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

            // Check NFT balances
            expect((await NFTContract.balanceOf(account0.address)).toNumber()).to.equal(1);
            expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);
            expect((await NFTContract.balanceOf(account2.address)).toNumber()).to.equal(0);

            // Bidder account places bid
            await NFTDutchAuction.connect(account2).bid(bidAmount);

            // Check if bidder received NFT
            expect((await NFTContract.balanceOf(account0.address)).toNumber()).to.equal(0);
            expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);
            expect((await NFTContract.balanceOf(account2.address)).toNumber()).to.equal(1);
            

        });

    });

});