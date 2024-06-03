import { hexToBigInt, Hex } from 'viem';

export const KnownValidProof = {
  _pA: [
    hexToBigInt('0x11cb0fc9174301a206cf63edf847ef69cbabc219d746654a7fe6eaf8db8b1097' as Hex),
    hexToBigInt('0x1886c8e7ec393f7c76246df703702ba037a1c0562337a53a1f978cbc6490a254' as Hex),
  ],
  _pB: [
    [
      hexToBigInt('0x177d81b7e81b123ab893e5f828e434ab4186563362a7af20ba828bfdec6a1006' as Hex),
      hexToBigInt('0x2416a9a734ebb256cd9230d9dcc65ec30754f4ed98cdf2f8ae32ca879f5e94b6' as Hex),
    ],
    [
      hexToBigInt('0x2db43ba12cfb837d1bd4ecfbbb5d161ee0ff232dc55418ddfa9f2676dd244fbd' as Hex),
      hexToBigInt('0x06f2fce89e061cae713e310b93b6ee1c4fec9db07b901e4389e0b2ceadf5d9dd' as Hex),
    ],
  ],
  _pC: [
    hexToBigInt('0x018e8ef290ec1d4dbd6f769f1244bef8aaff30a554d9829771e8b1e46a50c7f8' as Hex),
    hexToBigInt('0x1d8a716031deb1eb454ace60c0b179e10a99fe39a5f626f1f5c2b1a1084acbc2' as Hex),
  ],
  _pubSignals: [
    hexToBigInt('0x0000000000000000000000000000000000000000000000000000000000000000' as Hex),
    hexToBigInt('0x0000000000000000000000000000000000000000000000000000000000000064' as Hex),
    hexToBigInt('0x0c138d79d2a0c9f1eb742d55eae4a3351dcae0a65eccbf3748c73ad56de9ab93' as Hex),
    hexToBigInt('0x0000000000000000000000000000000000000000000000000000000000000000' as Hex),
    hexToBigInt('0x2ec3c8133f3995beb87fdc48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927' as Hex),
    hexToBigInt('0x01b11a70c8c702dac8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f' as Hex),
    hexToBigInt('0x2bd6837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec' as Hex),
    hexToBigInt('0x079779fda6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980' as Hex),
  ],
};
