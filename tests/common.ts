import TimerClientPkg from "./pkgs/TimerClient.pkg";
import { TonClient } from "@ton-client-ts/node";

export const getTimerClientSessions = async (tonClient: TonClient, timerClientAddress: string) => {
  const account = await tonClient.net.query_collection({
    collection: "accounts",
    filter: { id: { eq: timerClientAddress } },
    result: "boc",
  });

  const getCurrentSessionResult = await tonClient.tvm.run_tvm({
    message: (
      await tonClient.abi.encode_message({
        signer: { type: "None" },
        abi: { type: "Contract", value: TimerClientPkg.abi },
        call_set: {
          function_name: "getCurrentSession",
        },
        address: timerClientAddress,
      })
    ).message,
    account: account.result[0].boc,
  });

  const getSessionsResult = await tonClient.tvm.run_tvm({
    message: (
      await tonClient.abi.encode_message({
        signer: { type: "None" },
        abi: { type: "Contract", value: TimerClientPkg.abi },
        call_set: {
          function_name: "getSessions",
        },
        address: timerClientAddress,
      })
    ).message,
    account: account.result[0].boc,
  });

  const getCurrentSessionResultDecoded = await tonClient.abi.decode_message({
    abi: { type: "Contract", value: TimerClientPkg.abi },
    message: getCurrentSessionResult.out_messages[0],
  });

  const getSessionsResultDecoded = await tonClient.abi.decode_message({
    abi: { type: "Contract", value: TimerClientPkg.abi },
    message: getSessionsResult.out_messages[0],
  });

  return { getCurrentSessionResultDecoded, getSessionsResultDecoded };
};
