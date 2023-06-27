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
        const [account0, account1, account2] = await ethers.getSigners();

        // Get and Deploy contract
        const ERC20 = await ethers.getContractFactory("ERC20Token");
        const ERC20Contract = await ERC20.connect(account1).deploy(50000); 
        await ERC20Contract.deployed();
        
        // console.log("NFT contract deployed by: ", await ERC20Contract.signer.getAddress());
        // console.log("NFT contract deployed to: ", ERC20Contract.address);

        return {ERC20Contract};

    }
    
    it("ERC20 Tokens can be transferred", async function () {

        // Load ERC20 Token contract deployment fixture
        const {ERC20Contract} = await loadFixture(deployERC20Contract);

        // Get signers
        const [account0, account1, account2] = await ethers.getSigners();
        
        // Balances
        console.log("account0 balance: ", (await ERC20Contract.balanceOf(account0.address)).toNumber());
        console.log("account1 balance: ", (await ERC20Contract.balanceOf(account1.address)).toNumber());
        console.log("account2 balance: ", (await ERC20Contract.balanceOf(account2.address)).toNumber());
        console.log("contract balance: ", (await ERC20Contract.balanceOf(ERC20Contract.address)).toNumber());
        
        // Allowances
        console.log("\ncontract -> account0 allowance: ", (await ERC20Contract.allowance(ERC20Contract.address, account0.address)).toNumber());
        console.log("contract -> account1 allowance: ", (await ERC20Contract.allowance(ERC20Contract.address, account1.address)).toNumber());
        console.log("contract -> account2 allowance: ", (await ERC20Contract.allowance(ERC20Contract.address, account2.address)).toNumber());
        console.log("contract -> itself ", (await ERC20Contract.allowance(ERC20Contract.address, ERC20Contract.address)).toNumber());

        await ERC20Contract.connect(account0).approve(account1.address, 1000);

        console.log("\ncontract -> account0 allowance: ", (await ERC20Contract.allowance(ERC20Contract.address, account0.address)).toNumber());
        console.log("contract -> account1 allowance: ", (await ERC20Contract.allowance(ERC20Contract.address, account1.address)).toNumber());
        console.log("contract -> account2 allowance: ", (await ERC20Contract.allowance(ERC20Contract.address, account2.address)).toNumber());
        console.log("contract -> itself ", (await ERC20Contract.allowance(ERC20Contract.address, ERC20Contract.address)).toNumber());
        
    });

})