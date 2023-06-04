// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "./BasicDutchAuction.sol";

// contract for testing require @ line 49 of BasicDutchAuction.sol 
contract test {

    BasicDutchAuction testContract;

    constructor () {
        testContract = new BasicDutchAuction(1000,20,10);
    }

    function targetTest() external payable{
        testContract.bid{value: msg.value}();
    }

}