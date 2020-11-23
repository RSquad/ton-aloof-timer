import aloofPkg from "./pkgs/Aloof.pkg";
import timerClientPkg from "./pkgs/TimerClient.pkg";
import { TonClient } from "@ton-client-ts/node";
import { KeyPair } from "@ton-client-ts/core/types/modules/crypto";
import { sendTokens, sleep } from "./utils";
import { getTimerClientSessions } from "./common";

let tonClient: TonClient;
let aloofKeypair: KeyPair;
let aloofAddress: string;
let timerClientKeypair: KeyPair;
let timerClientAddress: string;

beforeAll(() => {
  tonClient = new TonClient({ network: { server_address: "net.ton.dev" } });
});

test("deploy aloof", async () => {
  try {
    aloofKeypair = await tonClient.crypto.generate_random_sign_keys();
    console.log({ aloofKeypair });

    const aloofDeployMsg = await tonClient.abi.encode_message({
      abi: { type: "Contract", value: aloofPkg.abi },
      signer: {
        type: "Keys",
        keys: aloofKeypair,
      },
      deploy_set: {
        tvc: aloofPkg.imageBase64,
      },
      call_set: {
        function_name: "constructor",
        input: {},
      },
    });

    aloofAddress = aloofDeployMsg.address;

    const sendTokensResult = await sendTokens(tonClient, 3_000_000_000, aloofAddress);
    expect(sendTokensResult.transaction).toBeDefined();
    console.log(`tokens has been sent to ${aloofAddress}`);

    const aloofDeployResult = await tonClient.processing.send_message({
      message: aloofDeployMsg.message,
      send_events: false,
    });
    expect(aloofDeployResult.shard_block_id).toBeDefined();

    console.log(`aloof deployed to ${aloofAddress}`);
  } catch (err) {
    throw new Error(err);
  }
});

test("deploy timerClient", async () => {
  try {
    timerClientKeypair = await tonClient.crypto.generate_random_sign_keys();
    console.log({ timerClientKeypair });

    const timerClientDeployMsg = await tonClient.abi.encode_message({
      abi: { type: "Contract", value: timerClientPkg.abi },
      signer: {
        type: "Keys",
        keys: timerClientKeypair,
      },
      deploy_set: {
        tvc: timerClientPkg.imageBase64,
      },
      call_set: {
        function_name: "constructor",
        input: {},
      },
    });

    timerClientAddress = timerClientDeployMsg.address;

    const sendTokensResult = await sendTokens(tonClient, 5_000_000_000, timerClientAddress);
    expect(sendTokensResult.transaction).toBeDefined();
    console.log(`tokens has been sent to ${timerClientAddress}`);

    const timerClientDeployResult = await tonClient.processing.send_message({
      message: timerClientDeployMsg.message,
      send_events: false,
    });
    expect(timerClientDeployResult.shard_block_id).toBeDefined();

    console.log(`timerClient deployed to ${timerClientAddress}`);
  } catch (err) {
    throw new Error(err);
  }
});

test("setup timer", async () => {
  try {
    console.log(aloofAddress);
    const timerClientQueryTimerResult = await tonClient.processing.process_message({
      message_encode_params: {
        abi: { type: "Contract", value: timerClientPkg.abi },
        address: timerClientAddress,
        signer: {
          type: "Keys",
          keys: timerClientKeypair,
        },
        call_set: {
          function_name: "queryTimer",
          input: {
            addr: aloofAddress,
          },
        },
      },
      send_events: false,
    });
    expect(timerClientQueryTimerResult.transaction).toBeDefined();

    console.log(`timerClient timer has been updated`);
  } catch (err) {
    throw new Error(err);
  }
});

test("call timer", async () => {
  await sleep(10000);
  try {
    await tonClient.processing.process_message({
      message_encode_params: {
        abi: { type: "Contract", value: timerClientPkg.abi },
        address: timerClientAddress,
        signer: {
          type: "Keys",
          keys: timerClientKeypair,
        },
        call_set: {
          function_name: "testSetTimer",
          input: {
            time: 60 * 60 * 12,
            credit: 1_000_000_000,
          },
        },
      },
      send_events: false,
    });
    const { getCurrentSessionResultDecoded } = await getTimerClientSessions(tonClient, timerClientAddress);
    expect(getCurrentSessionResultDecoded.value.s.status).toBe("1");
  } catch (err) {
    throw new Error(err);
  }
});

test("wait for timer", async () => {
  try {
    await sleep(1000 * 60 * 60 * 12 + 30000);
    const { getSessionsResultDecoded } = await getTimerClientSessions(tonClient, timerClientAddress);
    const session = getSessionsResultDecoded.value.ss.find((o: any) => o.id === "1");
    expect(session.status).toBe("2");
    console.log(`responded after`, +session.receivedTime - +session.start);
    console.log(`it cost`, session.cost);
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
});
