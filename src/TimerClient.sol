pragma solidity >= 0.6.0;

import "ITimerClient.sol";
import "IAloof.sol";

contract TimerClient is ITimerClient {

    address _timer;
    address _timerCandidate;
    uint32 _counter;    

    modifier restricted {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();
        _;
    }

    enum Status { Undefined, Sent, Received }

    struct Session {
        uint32 id;
        uint32 endsIn;
        uint32 start;
        Status status;
        uint32 receivedTime;
        uint128 cost;
    }

    Session _s;
    Session[] _log;

    function _logFirstHalf(uint32 time, uint128 credit) private inline {
        delete _s;
        _s = Session(++_counter, time, uint32(now), Status.Sent, 0, credit);
    }

    function _logSecondHalf() private inline {
        _s.cost -= msg.value;
        _s.receivedTime = uint32(now);
        _s.status = Status.Received;

        _log.push(_s);
        delete _s;
    }

    function testSetTimer(uint32 time, uint128 credit) external restricted  {
        _logFirstHalf(time, credit);
        IAloof(_timer).setTimer.value(credit)(time);
    }

    function testRunUntil(uint32 time, uint128 credit) external restricted {
        _logFirstHalf(time, credit);
        _s.endsIn -= uint32(now);
        IAloof(_timer).runUntil.value(credit)(time);
    }

    function onTimer() external override {
        require(msg.sender == _timer);
        tvm.accept();
        _logSecondHalf();
    }

    function queryTimer(address addr) external restricted {
         _timerCandidate = addr;
        IAloof(_timerCandidate).isAvailable();
    }

    function updateTimer(address addr) override external {
        if (msg.pubkey() == tvm.pubkey() || msg.sender == _timerCandidate) {
            tvm.accept();
	        _timer = addr;
        }
    }

    function getCurrentSession() public view returns (Session s) {
        s = _s;
    }

    function getSessions() public view returns (Session[] ss) {
        ss = _log;
    }


}

