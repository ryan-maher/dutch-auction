// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "./NFTDutchAuction.sol";

// contract for testing require @ line 66 of NFTDutchAuction.sol 
contract test {

    NFTDutchAuction testContract;

    constructor (address erc721TokenAddress, uint256 _nftTokenId, uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {
        testContract = new NFTDutchAuction(erc721TokenAddress, _nftTokenId, _reservePrice, _numBlocksAuctionOpen, _offerPriceDecrement);
    }

    function targetTest() external payable{
        testContract.bid{value: msg.value}();
    }

}