pragma solidity >= 0.6.0;

/**
 * @title Timer contract Interface
 */
interface IAloof {

    /**
     * @notice Sets timer to fire after a certain time period
     * @param ti time interval to fire after
     */
    function setTimer(uint32 ti) external;

    /**
     * @notice Sets timer to loop until a certain time period
     * @param ts timestamp to fire at
     */
    function runUntil(uint32 ts) external;

    /**
     * @notice Query if the timer service is available for employment
     */
    function isAvailable() external;
   
}
