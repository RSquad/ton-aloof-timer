pragma solidity >= 0.6.0;

/**
 * @title Timer contract client interface
 */
interface ITimerClient {
    /**
     * @notice Invoked by the Timer contract after the specified time period
     */
    function onTimer() external;


    /**
     * @notice Updates the Timer contract address to the actual one
     * @param addr the address of the actual Timer contract
     */
    function updateTimer(address addr) external;

}
