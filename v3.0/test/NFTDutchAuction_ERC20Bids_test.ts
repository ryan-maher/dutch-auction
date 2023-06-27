import { expect } from "chai";
import { time, loadFixture, mine} from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { erc20 } from "../typechain-types/@openzeppelin/contracts/token";

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
    
    it("Deployment, Minting, and Transfer", async function () {

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
    
    describe("ERC20 Token:", function() {

        it("ERC20 Tokens can be transferred", async function () {

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

    });

});