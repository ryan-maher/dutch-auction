import { expect } from "chai";
import { time, loadFixture, mine} from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ERC20Token } from "../typechain-types";

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

    async function deployERC20Contract(){

        const initialSupply = 50000;

        // Get and Deploy contract
        const ERC20 = await ethers.getContractFactory("ERC20Token");
        const ERC20Contract = await ERC20.deploy(initialSupply); 
        await ERC20Contract.deployed();
        
        // console.log("NFT contract deployed by: ", await ERC20Contract.signer.getAddress());
        // console.log("NFT contract deployed to: ", ERC20Contract.address);

        return {ERC20Contract, initialSupply};

    }

    async function deployAuctionProxy(){

        // Get signers
        const [account0] = await ethers.getSigners();
        
        const {NFTContract} = await loadFixture(deployNFTContract);
        const {ERC20Contract, initialSupply} = await loadFixture(deployERC20Contract);

        const tokenid = 5;
        await NFTContract.safeMint(account0.address, tokenid);
        
        const auction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
        const NFTDutchAuction = await upgrades.deployProxy(auction, [ERC20Contract.address, NFTContract.address, tokenid, 1000, 20, 10]);
        await NFTDutchAuction.deployed();

        // console.log("Auction deployed to:", DutchAuction.address);

        return {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid};

    }

    // Function from Smart Contract Programmer https://www.youtube.com/watch?v=Sib9_yW_rLY
    // Used for getting v, r, and s parameters for ERC20 permit function
    async function getPermitSignature(signer: SignerWithAddress, token: ERC20Token, spender: string, value: number, deadline: BigNumber) {
        const [nonce, name, version, chainId] = await Promise.all([
          token.nonces(signer.address),
          token.name(),
          "1",
          signer.getChainId(),
        ])
      
        return ethers.utils.splitSignature(
          await signer._signTypedData(
            {
              name,
              version,
              chainId,
              verifyingContract: token.address,
            },
            {
              Permit: [
                {
                  name: "owner",
                  type: "address",
                },
                {
                  name: "spender",
                  type: "address",
                },
                {
                  name: "value",
                  type: "uint256",
                },
                {
                  name: "nonce",
                  type: "uint256",
                },
                {
                  name: "deadline",
                  type: "uint256",
                },
              ],
            },
            {
              owner: signer.address,
              spender,
              value,
              nonce,
              deadline,
            }
          )
        )
      }

    describe("Dutch Auction", function() {

        describe("Contract", function() {

            it("Owner of the contract is the seller of the NFT", async function () {
            
                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
    
                // Getting signers of contract
                const [account0, account1] = await ethers.getSigners();
                
                // Checks if owner and signer match
                expect(await NFTDutchAuction.auctionOwner()).to.equal(account0.address);
    
                // Checks if owner has NFT
                expect((await NFTContract.balanceOf(account0.address)).toNumber()).to.equal(1);
    
            });
            
            it("Dutch Auction contract sets correct initial price", async function () {
        
                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);

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
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
        
                // Getting signers
                const [account0, account1] = await ethers.getSigners();
        
                const bidAmount = 1500;
        
                // Transfer tokens to bidder account
                await ERC20Contract.transfer(account1.address, bidAmount);

                // Approve tokens to be spent
                // await ERC20Contract.connect(account0).approve(account1.address, bidAmount);
                // await ERC20Contract.connect(account1).approve(NFTDutchAuction.address, bidAmount);

                const deadline = ethers.constants.MaxUint256;
                const {v, r, s} = await getPermitSignature(account1, ERC20Contract, NFTDutchAuction.address, bidAmount, deadline);
                await ERC20Contract.permit(account1.address, NFTDutchAuction.address, bidAmount, deadline, v, r, s);
        
                // Dutch auction contract address needs to be approved because it calls safeTransferFrom
                await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);
        
                // Bidder account places bid
                expect(await NFTDutchAuction.connect(account1).bid(bidAmount));
        
            });

            it("Seller receives ERC20 tokens from first valid bid", async function () {

                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
    
                // Getting signers
                const [account0, account1, account2] = await ethers.getSigners();
    
                // Dutch auction contract address needs to be approved because it calls safeTransferFrom
                const app = await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);
    
                const bidAmount = 1500;
    
                // Transfer tokens to bidder account
                await ERC20Contract.transfer(account2.address, bidAmount);
                
                // Approve tokens to be spent
                // await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
                // await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

                const deadline = ethers.constants.MaxUint256;
                const {v, r, s} = await getPermitSignature(account2, ERC20Contract, NFTDutchAuction.address, bidAmount, deadline);
                await ERC20Contract.permit(account2.address, NFTDutchAuction.address, bidAmount, deadline, v, r, s);
                
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
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
    
                // Getting signers
                const [account0, account1, account2] = await ethers.getSigners();
    
                // Dutch auction contract address needs to be approved because it calls safeTransferFrom
                const app = await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);
    
                const bidAmount = 1500;
    
                // Transfer tokens to bidder account
                await ERC20Contract.transfer(account2.address, bidAmount);
                
                // Approve tokens to be spent
                // await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
                // await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

                const deadline = ethers.constants.MaxUint256;
                const {v, r, s} = await getPermitSignature(account2, ERC20Contract, NFTDutchAuction.address, bidAmount, deadline);
                await ERC20Contract.permit(account2.address, NFTDutchAuction.address, bidAmount, deadline, v, r, s);
    
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

            it("Dutch Auction contract reverts bid below current price", async function () {

                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);

                // Getting signers
                const [account0, account1] = await ethers.getSigners();

                const bidAmount = 1000;

                // Transfer tokens to bidder account
                await ERC20Contract.transfer(account1.address, bidAmount);

                // Approve tokens to be spent
                // await ERC20Contract.connect(account0).approve(account1.address, bidAmount);
                // await ERC20Contract.connect(account1).approve(NFTDutchAuction.address, bidAmount);

                const deadline = ethers.constants.MaxUint256;
                const {v, r, s} = await getPermitSignature(account1, ERC20Contract, NFTDutchAuction.address, bidAmount, deadline);
                await ERC20Contract.permit(account1.address, NFTDutchAuction.address, bidAmount, deadline, v, r, s);

                // Dutch auction contract address needs to be approved because it calls safeTransferFrom
                await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);

                // Check if invalid bid reverts
                await expect(NFTDutchAuction.connect(account1).bid(bidAmount)).to.be.reverted;
                
            });

            it("Dutch Auction contract reverts bid after valid bid already placed", async function () {
        
                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);

                // Getting signers
                const [account0, account1, account2] = await ethers.getSigners();

                const bidAmount = 1500;

                // Transfer tokens to bidder accounts
                await ERC20Contract.transfer(account1.address, bidAmount);
                await ERC20Contract.transfer(account2.address, bidAmount);

                // Approve tokens to be spent
                // await ERC20Contract.connect(account0).approve(account1.address, bidAmount);
                // await ERC20Contract.connect(account1).approve(NFTDutchAuction.address, bidAmount);

                const deadline = ethers.constants.MaxUint256;
                const {v, r, s} = await getPermitSignature(account1, ERC20Contract, NFTDutchAuction.address, bidAmount, deadline);
                await ERC20Contract.permit(account1.address, NFTDutchAuction.address, bidAmount, deadline, v, r, s);

                // await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
                // await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

                // Dutch auction contract address needs to be approved because it calls safeTransferFrom
                await NFTContract.connect(account0).approve(NFTDutchAuction.address, tokenid);

                // Bidder account places bid
                expect(await NFTDutchAuction.connect(account1).bid(bidAmount));

                // Second bidder attempts bid
                await expect(NFTDutchAuction.connect(account2).bid(bidAmount)).to.be.revertedWith("Auction closed");
                
            });

        });

        describe("Block Timing", function(){

            it("Auction begins at the block in which the contract is created", async function () {

                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
    
                // Get current block number
                var blockNumber = await time.latestBlock();
    
                // Get contract starting block number
                var contractBlock = (await (NFTDutchAuction.startingBlock())).toNumber();
    
                // Compare current block number to starting block of contract
                expect(contractBlock).to.equal(blockNumber);
    
            });

            it("Contract accepts bid of lower but sufficient value after some time has passed", async function () {

                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
    
                // Getting signers
                const [account0, account1, account2] = await ethers.getSigners();
                
                await mine(10);
                
                // Dutch auction contract address needs to be approved because it calls safeTransferFrom
                const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);
    
                const bidAmount = 1200;
    
                // Transfer tokens to bidder account
                await ERC20Contract.transfer(account2.address, bidAmount);
    
                // Approve tokens to be spent
                // await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
                // await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

                const deadline = ethers.constants.MaxUint256;
                const {v, r, s} = await getPermitSignature(account2, ERC20Contract, NFTDutchAuction.address, bidAmount, deadline);
                await ERC20Contract.permit(account2.address, NFTDutchAuction.address, bidAmount, deadline, v, r, s);
    
                // Check if bid of lower but sufficient value succeeds after a few blocks have been mined
                expect(await NFTDutchAuction.connect(account2).bid(bidAmount));
    
            });

            it("Contract accepts valid bid at last block of auction", async function () {

                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
    
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
                // await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
                // await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

                const deadline = ethers.constants.MaxUint256;
                const {v, r, s} = await getPermitSignature(account2, ERC20Contract, NFTDutchAuction.address, bidAmount, deadline);
                await ERC20Contract.permit(account2.address, NFTDutchAuction.address, bidAmount, deadline, v, r, s);
    
                // Check if bid succeeds
                expect(await NFTDutchAuction.connect(account2).bid(bidAmount));
    
            });

            it("Bid fails when auction block window has ended", async function () {

                // NFT contract, ERC20 contract, and Auction contract owner: account0
                // NFT minted to: account0
                // 50000 ERC tokens at account0
                
                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
    
                await mine(17);
    
                const bidAmount = 1000;
    
                // Dutch auction contract address needs to be approved because it calls safeTransferFrom
                const app = await NFTContract.approve(NFTDutchAuction.address, tokenid);
    
                // Getting signers
                const [account0, account1, account2] = await ethers.getSigners();
    
                // Transfer tokens to bidder account
                await ERC20Contract.transfer(account2.address, bidAmount);
    
                // Approve tokens to be spent
                // await ERC20Contract.connect(account0).approve(account2.address, bidAmount);
                // await ERC20Contract.connect(account2).approve(NFTDutchAuction.address, bidAmount);

                const deadline = ethers.constants.MaxUint256;
                const {v, r, s} = await getPermitSignature(account2, ERC20Contract, NFTDutchAuction.address, bidAmount, deadline);
                await ERC20Contract.permit(account2.address, NFTDutchAuction.address, bidAmount, deadline, v, r, s);
                
                // Check if invalid bid fails
                await expect(NFTDutchAuction.connect(account2).bid(bidAmount)).to.be.revertedWith("Auction closed");
    
            });

        });

        describe("Proxy", function(){

            it("Contract can be upgraded to test contract", async function() {

                // Deploying contracts
                const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
                
                // Getting signers
                const [account0, account1, account2] = await ethers.getSigners();

                const DutchActionNew = await ethers.getContractFactory("NewDutchAuction");

                // Check if proxy upgrade succeeds
                expect(await upgrades.upgradeProxy(NFTDutchAuction.address, DutchActionNew, {kind: "uups"}));

            });

            it("Test contract can be upgraded to original contract", async function() {

                const testContract = await ethers.getContractFactory("NewDutchAuction");
                const test = await upgrades.deployProxy(testContract);
                await test.deployed();
                
                // Getting signers
                const [account0, account1, account2] = await ethers.getSigners();

                const DutchAction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");

                // Check if proxy upgrade succeeds
                expect(await upgrades.upgradeProxy(test.address, DutchAction, {kind: "uups"}));

            });

            it("Cannot be upgraded by non-owner", async function() {

                // Getting signers
                const [account0, account1] = await ethers.getSigners();
                
                // Load NFT and ERC20 contract fixtures
                const {NFTContract} = await loadFixture(deployNFTContract);
                const {ERC20Contract, initialSupply} = await loadFixture(deployERC20Contract);

                const tokenid = 5;

                // Mint NFT to account0
                await NFTContract.safeMint(account0.address, tokenid);
                
                // Deploy auction proxy
                const auction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids", account1);
                const NFTDutchAuction = await upgrades.deployProxy(auction, [ERC20Contract.address, NFTContract.address, tokenid, 1000, 20, 10]);
                
                await NFTDutchAuction.deployed();

                const DutchActionNew = await ethers.getContractFactory("NewDutchAuction");

                // Check if upgrade from non-owner fails
                await expect(upgrades.upgradeProxy(NFTDutchAuction.address, DutchActionNew, {kind: "uups"})).to.be.reverted;

            });

        });

    });

    describe("NFT Contract", function() {

        it("Minted NFT can be transferred between accounts", async function() {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Deploying contracts
            const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
            
            // Getting signers
            const [account0, account1] = await ethers.getSigners();

            // Check NFT balances
            expect((await NFTContract.balanceOf(account0.address)).toNumber()).to.equal(1);
            expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(0);

            // Check if transferFrom succeeds
            expect(await NFTContract.connect(account0).transferFrom(account0.address, account1.address, tokenid));

            // Check NFT balances
            expect((await NFTContract.balanceOf(account0.address)).toNumber()).to.equal(0);
            expect((await NFTContract.balanceOf(account1.address)).toNumber()).to.equal(1);

        });
        
        it("NFT contract rejects approve call from unapproved/non-owner account", async function () {
    
            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Deploying contracts
            const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
            
            const [owner, account1] = await ethers.getSigners();

            // Check if approval from unapproved/non-owner fails
            expect (NFTContract.connect(account1).approve(NFTDutchAuction.address, tokenid)).to.be.rejected;
            
        });

        it("NFT contract rejects mint call from unapproved/non-owner account", async function () {

            // NFT contract owner: account0
            
            // Deploying contracts
            const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);

            // Get signers
            const [account0, account1] = await ethers.getSigners();
            
            // Only the deployer of NFT contract can call safeMint
            await expect(NFTContract.connect(account1).safeMint(account1.address, tokenid)).to.be.rejected;

        });

    });

    describe("ERC20 Token Contract", function() {

        it("ERC20 Tokens can be transferred between accounts", async function () {

            // NFT contract, ERC20 contract, and Auction contract owner: account0
            // NFT minted to: account0
            // 50000 ERC tokens at account0
            
            // Deploying contracts
            const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);

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
            
            // Deploying contracts
            const {NFTDutchAuction, NFTContract, ERC20Contract, initialSupply, tokenid} = await loadFixture(deployAuctionProxy);
            
            const [owner, account1] = await ethers.getSigners();

            // Check if approve call from unapproved/non-owner account fails
            expect (ERC20Contract.connect(account1).approve(NFTDutchAuction.address, tokenid)).to.be.rejected;
            
        });

    });

});