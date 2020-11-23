# ton-aloof-timer

Aloof timer is a versatile and most economical general purpose timer.

## Key idea

Notification of the client at a specified time based on the measurement of the time intervals for the passage of messages and the blockchain bounce mechanisms.

## Approximate accuracy and cost

According to the tests carried out, the approximate cost is 40_000_000 + 100_000 for each second of the timer, **which is less than 9 tons per day of use**

Average measured accuracy — **+- 15 seconds**

You can see the cost and an example of a really working timer here — https://net.ton.live/accounts?section=details&id=0:7d213f7294c05ee57928b83fe43e10e8781505add23ab563d55e23b9db9cbf2d
Here, 4 timers in a row for 60 seconds are started, it runs with an error of 10 seconds and it costs 24_000_000 + execution cost (4 calls at 40_000_000), which in total equals 184_000_000 (**0.184 TON crystal for 4 calls per minute**). In terms of one call per day — 8_640_000_000 or **8.64 TON crystal** + execution cost (depending on the number of calls).

## Possible Applications

The Timer contract can be used to provide a time-accurate alarm service in important cases.

- Any group games, like roulette, require certain time period between cloing stakes and announcing winning number.
- On-chain games reply on off-chain time costraints to perform in-game actions (say, refresh daily quests).
- Billing smart-contracts need to trigger at some point of time to send invoices to the clients.
- Any time-bound subscription services need a call from outside to trigger start of their duty.
- System utilities may perform perioding cleanup of the smart-contracts storage, check balances etc.

## Usage interfaces

Two contracts have been implemented:

- Aloof — main service contract
- TimerClient — an example of a contract using a timer

The client implements the ITimerClient interface

```java
interface ITimerClient {
    function updateTimer(address addr) external;
    function onTimer() external;
}
```

`updateTimer` — called by the service or by the client itself to set the timer address

`onTimer` — called by the timer when the specified interval is reached

The timer implements the `IAloof` interface

```java
interface IAloof {
    function setTimer(uint32 ti) external;
    function runUntil(uint32 ts) external;
    function isAvailable() external;
}
```

`setTimer` — sets a timer to notify the client after a specified period of time

`runUntil` — sets a timer to alert the client at the specified time

`isAvailable` — Checks that the timer is available for setting. If successful, sends its address to the client in `updateTimer`

## Basic use case

- Deploy Aloof
- Deploy TimerClient
- From `TimerClient` we call the` isAvailable` function. `Aloof` will set the timer address to the client by calling` updateTimer` (you can also call `updateTimer` in any other way. This example just suggests a way to solve the authorization problem)
- From `TimerClient`, call the` setTimer` or `runUntil` function by attaching tokens at the rate of 100_000 \* for the number of seconds in the timer + 40_000_000 + a small processing fee (change will be returned at the end of the task)
- We are waiting for the timer to respond to the client by calling `onTimer`

Further actions depend on the implementation of the client itself. As an example, you can emit an event, place a stake, or take any action you want.

## Timer device

The timer state is described below:

- `address _host;` — client address

- `uint32 _timeTo;` — time at which the client needs to respond

- `uint64 _credit;` — change

- `bool _active;` — whether the timer is currently performing any task

- `address _any;` — random address for bouncing

The three main entry points into the contract (`IAloof` functions) are wrapped with a modifier

```java
modifier busy() {
        if (_active) {
            require(_host == msg.sender, 111);
        } else {
            _host = msg.sender;
        }
        _;
    }
```

This modifier is used to control host authorization. If the timer executes the task, then the service accepts only commands from the client that started the task for processing. If the timer is not active, the service exposes the caller of the client as the host and performs the called actions.

When calling `setTimer` or` runUntil`, the `_run` function is called, which

- sets `_timeTo` equal to the time requested by the client, minus the delay in receiving and delivering messages to the client
- exposes `_credit` — transferred amount minus operational expenses
- launches bouncing
- if the timer is already running, the host can change the configuration by calling `setTimer` or` runUntil` again. In this case, the old `_credit` will be returned to the client, a new` _credit` will be reserved and the timer will continue to work with the new period

Since the timer is a service and calculates the operational expenses approximately, the user who has deployed the contract can withdraw free tokens using the `transfer` function. It is important that you can withdraw tokens only if the timer is not active now.

## Client implementation example

The given example of the `TimerClient` client, in addition to implementing the` ITimerClient` interface, implements the following functions to check the timer operation:

```java
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
```

`queryTimer` — checks the availability of the timer by address, if the timer is available, receives a message from the timer in` updateTimer`

`updateTimer` — fixes the timer address

`getCurrentSession` — returns the currently running task that the client has sent to the timer, if any

`getSessions` — returns all sessions passed to the timer

Session Interface:

```java
struct Session {
        uint32 id;               # session id
        uint32 endsIn;           # time the session is done
        uint32 start;            # session dispatch time
        Status status;           # task status, 0 — not inited, 1 — sent, 2 — completed
        uint32 receivedTime;     # response time, available when status is 2
        uint128 cost;            # task cost, available at status 2
    }
```

## Examples

You can find usage examples in the './tests' folder

Starting instructions:

1. `cd ./src`
2. `npm run compile` — a script that will run solc and tvm_linker from the root of the directory to compile and build abi, tvc, etc. Keep in mind that there are no binaries in the project, you either need to put them in the root of the directory, or put the prepared abi and tvc in the root of the directory and skip steps 1 and 2

3. `cd ./tests` — go to the folder with examples
4. `npm i` — install dependencies
5. Run the example. Available commands:

- `example:base` — basic example, starts a timer for 60 seconds
- `example:reset` — example with timer reinitialization
- `example:many-timers` — an example of calling 4 timers in a row
- `example:long` — an example of calling a timer for 12 hours

Please note that the examples use multisig for deploying contracts (there is also an example of a function deploying through Node SE givers, see _./tests/utils.ts_ `sendTokensGiver`)

To run the examples without changes, you need to create a file `signer.ts` in the root of the _. / Tests / _ directory.

Example file:

```typescript
import { Signer } from "@ton-client-ts/core/types/modules/abi";

export const multisigAddress = "<MULTISIG_ADDRESS>";

const signer: Signer = {
  type: "Keys",
  keys: {
    public: "<PUBKEY>",
    secret: "<SECRET>",
  },
};

export default signer;
```
