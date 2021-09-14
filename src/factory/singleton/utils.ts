import { simpleEncode, simpleDecode, soliditySHA3 } from "ethereumjs-abi";
import { bufferToHex, toBuffer, toChecksumAddress } from "ethereumjs-util";
import { keccak256 } from "ethers/lib/utils";

import { bytecode as ProxyFactoryByteCode } from "../../../build/artifacts/contracts/factory/ModuleProxyFactory.sol/ModuleProxyFactory.json";

export { ProxyFactoryByteCode };

export const buildDeployData = async (salt: string): Promise<string> => {
  return bufferToHex(
    simpleEncode(
      "deploy(bytes,bytes32):(address)",
      toBuffer(ProxyFactoryByteCode),
      toBuffer(salt)
    )
  );
};

export const buildCreate2Address = (deployer: string, salt: string): string => {
  var addressString = soliditySHA3(
    ["bytes1", "address", "bytes32", "bytes32"],
    ["0xff", deployer, salt, keccak256(ProxyFactoryByteCode)]
  ).toString("hex");
  return toChecksumAddress("0x" + addressString.slice(-40));
};

export const calculateSingletonAddress = (
  deployer: string,
  salt: string
): string => {
  return buildCreate2Address(deployer, salt);
};

export const estimateDeploymentGas = async (
  provider: any,
  tx: any,
  expectedAddress: string
): Promise<number> => {
  let estimate = await provider.estimateGas(tx);
  let tries = 0;
  let address = "";
  while (
    address.toLowerCase() !== expectedAddress.toLowerCase() &&
    tries < 10
  ) {
    // Increase the estimate by 25% every time (even initially, similar to truffle)
    estimate = Math.ceil(estimate * 1.25);
    tries++;
    try {
      const resp = await provider.call(tx);
      [address] = simpleDecode(
        "deploy(bytes,bytes32):(address)",
        toBuffer(resp)
      );
    } catch (e) {}
  }
  return estimate;
};