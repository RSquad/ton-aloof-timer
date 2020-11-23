pragma solidity >= 0.6.0;

import "IAloof.sol";
import "ITimerClient.sol";

contract Aloof is IAloof {
    address _host;

    uint32 _timeTo;
    uint64 _credit;

    bool _active;

    address _any = address(0x3d83e5be6f21c785714116ecc7999689831b95e861bb9aca9a8955869dfb5419);

    modifier restricted {
        require(msg.pubkey() == tvm.pubkey(), 100);
        tvm.accept();
        _;
    }

    modifier busy() {
        if (_active) {
            require(_host == msg.sender, 111);
        } else {
            _host = msg.sender;
        }
        _;
    }

    function isAvailable() external override busy {
        ITimerClient(_host).updateTimer(address(this));
    }

    function setTimer(uint32 ti) external override busy {
        _run(uint32(now) + ti);
    }

    function runUntil(uint32 ts) external override busy {
        _run(ts);
    }

    function _run(uint32 t) internal inline {
        if (_active) {
            _host.transfer({value:_credit, bounce:true});
        }
        uint32 tNow = uint32(now);
        uint32 period = t - tNow;
        uint opex = uint(period * 1e5 + 4e7);
        uint32 delay = tNow - uint32(msg.createdAt);
        _timeTo = t - delay * 2;
        _credit = uint64(msg.value - opex);
        if (!_active) {
            _active = true;
            _bounce();
        }
    }

    onBounce(TvmSlice /* body */) external {
        if (!_active) {
            return;
        }
        if (_timeTo <= now) {
            ITimerClient(_host).onTimer{value:_credit}();
            _active = false;
        } else {
            _bounce();
        }
    }

    function _bounce() private inline view {
        _any.transfer({value:1e7, bounce:true});            
    }
    
    function transfer(uint128 val, address addr) external restricted {
        require(!_active, 301);
        addr.transfer({value:val, bounce:true});
        
    }

}
