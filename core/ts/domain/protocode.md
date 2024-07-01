
[PrivacyKey] has {}
: Types ==> {
  PrivacyKey: [privateKey, publicKey<[x, y]>, secretKey<[x, y]>, nonce]
  PrivacyKeys<n, type:[]> where PrivacyKeys[i]<type:PrivacyKey> for i in 1..n
  : Predicates ==> {
    (1) (for i in 1..n ) ==> PrivacyKeys[i].privateKey is unique
    (2) (for i in 1..n ) ==> {
      PrivacyKeys[i].publicKey<[x, y]> is unique &&
      PrivacyKeys[i].publicKey<[x, y]> === PublicKey(privateKey)
    }
    (3) (for i in 1..n ) ==> {
      PrivacyKeys[i].secretKey<[x, y]> is unique
      PrivacyKeys[i].secretKey<[x, y]> === ecdh(PrivacyKeys[i].publicKey<[x, y]>, PrivacyKeys[i].privateKey)<[x, y]>;
    }
    (4) (for i in 1..n ) ==> PrivacyKey[i].nonce = i
  }
}

[Commitment] has {
  [bind] as fn(
      pK is privateKey,
      nonce,
      scope, value, salt
    ):{
    {derive Public Key}
    {derive ECDH secret from pK & Public Key}
    (1) ==> [
              Pk as pK.publicK<[x, y]>,
              SecretK as ecdh(Pk, pK)<[x, y]>
            ];

      {derive salt public key from salt}
      (2) ==> saltPk as salt.publicK<[x, y]>;

      derive encryption key as ECDH secret from salt and Pk:
      (3) ==> eK as ecdh(Pk, salt)<[x, y]>;

      {compose tuple}
      (4) ==> tuple as [value, scope, SecretK.x, SecretK.y];

      {compute the hash of the tuple}
      (4) ==> hash as poseidon:hash(tuple);

      {encrypt the tuple}
      (5) ==> cipher as poseidon:encrypt(tuple, nonce, eK);
    }: Returns ==> [hash, saltPk, eK, SecretK, tuple, cipher] {
      [bind] <== Challenge(hash, saltPk, pK, cipher, nonce)
      {
          {expected computation of salt public key}
          (1) ==> bind.saltPk === Challenge.saltPk;

          {expected computation of hash}
          (2) ==> Challenge:hash === bind:hash;

          {correct computation of encryption key}
          {ability to decrypt the ciphertext}
          (3) ==> {
            ecdh(bind.saltPk, Challenge.pK)<[x, y]> === eK<[x, y]> &&
            poseidon:decrypt(bind.cipher, Challenge.nonce, len(bind.tuple), ecdh(bind.saltPk, Challenge.pK)<[x, y]>) === bind.tuple;
          }
      }
    }(Public)
  [recover] as fn(
      pK as privateKey,
      cipher as <[x...z]>,  // components of the cipherText
      saltPk as salt.publicK<[x, y]>, // public key to derive decryption key,
      nonce,
      len
    ):{
      {derive Public Key}
      (1) ==> Pk as pK.publicK<[x, y]>

      {recover ECDH encryption key}
      (2) ==> eK as ecdh(saltPk, pK)<[x, y]>;

      {decrypt the cipherText with the derived key}
      (3) ==> [value, scope, SecretK.x, SecretK.y] as poseidon:decrypt(cipher, nonce, len, eK);

      {compute the hash}
      (4) ==> hash as poseidon:hash(value, scope, SecretK.x, SecretK.y);
    }: Returns ==> [hash, tuple as [value, scope, SecretK.x, SecretK.y]] {
      [recover] <== Challenge(hash, SecretK as ecdh(Pk, pK)<[x, y])
      {
          {expected computation of hash}
          (1) ==> recover:hash === Challenge:hash;

          {expected presence of SecretK}
          (2) ==> tuple[2] === Challenge.SecretK.x && tuple[3] === Challenge.SecretK.y;
      }
    }(Public)
}: Types ==> {
  (Public): {
    Commitment<type:Obj>
    : Properties ==> {
        value,
        scope,
        secret<[x, y]>,
        cipherText: <[a...z]>,
        saltPk<[x,y]>,
        nonce
    }: Functions ==> {
      [asTuple]: fn(self): Returns ==> [self.value, self.scope, self.SecretK.x, self.SecretK.y] (Public)
      [hash]: fn(self): Returns ==> poseidon:hash(self:asTuple) (Public)
    }: Generators ==> {
      [mew]: fn(args:{pK, nonce, scope, value}): {
        salt <=== babyjub:random();
        out as [hash, saltPk, eK, SecretK, tuple, cipher] <=== bind(pK, nonce, scope, value, salt);
        out ===> c<type: Commitment>:{value,scope,saltPk,SecretK,cipher};
      }: Returns ==> [c, hash, salt, eK, tuple] {
        [new] <== Challenge(tuple, eK, pK) {
          {expected computation of tuple}
          (1) ==> Challenge.tuple === c.asTuple();

          {correct computation of hash}
          (2) ==> Challenge.hash === c.hash();

          {ability to decrypt the ciphertext}
          (3) ==> {
            ecdh(bind.saltPk, Challenge.pK)<[x, y]> === eK<[x, y]> &&
            poseidon:decrypt(c.cipher, args.nonce, Challenge(tuple), ecdh(c.saltPk, Challenge.pK)<[x, y]>) === c.tuple;
          }
        }
      }
      Dummy: fn(pK, nonce, scope):{ c <=== Commitment:new(pK, nonce, scope, 0) }: Returns ==> [Commitment]
    }
    Commitments<n, type:[]> where Commitment[i]<type:Commitment> for i in 1..n
  }
}
