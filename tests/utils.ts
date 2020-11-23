import { TonClient } from "@ton-client-ts/node";
import multisigPkg from "./pkgs/Multisig.pkg";
import giverPkg from "./pkgs/Giver.pkg";
import signer, { multisigAddress } from "./signer";

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const sendTokensGiver = async (tonClient: TonClient, value: number, dest: string) => {
  return await tonClient.processing.process_message({
    message_encode_params: {
      abi: { type: "Contract", value: giverPkg.abi },
      signer: {
        type: "None",
      },
      address: giverPkg.address,
      call_set: {
        function_name: "sendGrams",
        input: {
          dest,
          amount: value,
        },
      },
    },
    send_events: false,
  });
};

export const sendTokens = async (tonClient: TonClient, value: number, dest: string) => {
  return await tonClient.processing.process_message({
    message_encode_params: {
      abi: { type: "Contract", value: multisigPkg.abi },
      signer,
      address: multisigAddress,
      call_set: {
        function_name: "sendTransaction",
        input: {
          dest,
          value,
          bounce: false,
          flags: 3,
          payload: "",
        },
      },
    },
    send_events: false,
  });
};
