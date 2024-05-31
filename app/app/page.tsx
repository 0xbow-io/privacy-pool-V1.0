'use client';

import React, { useState } from 'react';
import { account, PrivacyKeyUI } from '@core/account';

import OnboardingSection from '@sections/onboarding';
import KeySection from '@sections/keys/keys';

export default function AppPage() {
  const [currentAccount, setAccount] = useState<account | null>(null);
  const [isAccountLoaded, setIsAccountLoaded] = useState<boolean>(false);
  const [currentPoolID, setPoolID] = useState<string>('');

  // create a new fresh account
  const handleCreateAccount = (snapshotJSON: string) => {
    let acc = new account();
    if (acc === null) {
      throw new Error('Failed to create account');
    }

    if (snapshotJSON !== '') {
      acc.LoadFromJSON(snapshotJSON.toString());
    } else {
      // generate a keypair
      let keypair = acc.genKeyPair(true);
      if (keypair === null) {
        throw new Error('Failed to generate keypair');
      }
      // download account as json
    }

    setAccount(acc);
    setIsAccountLoaded(true);
  };

  const GenKeyPairTrigger = () => {
    let acc = currentAccount;
    if (acc === null) {
      throw new Error('account not set');
    }
    acc.genKeyPair(true);
  };

  const GetAccKeyList = (): PrivacyKeyUI[] => {
    let acc = currentAccount;
    if (acc === null) {
      throw new Error('account not set');
    }
    return acc.KeyList(currentPoolID);
  };

  const RenderKeysSection = () => {
    if (currentAccount !== null) {
      return <KeySection className="" getKeyList={GetAccKeyList} genKeyPair={GenKeyPairTrigger} />;
    }
    return <div></div>;
  };

  const RenderOnboardingSection = (className: string) => {
    return <OnboardingSection className={className} handleCreateAccount={handleCreateAccount} />;
  };

  return (
    <div className="h-screen bg-page-background">
      <div className="h-screen md:flex">
        <div className=" relative grid h-full w-full items-center justify-between sm:grid-cols-2 md:grid-cols-12">
          {RenderOnboardingSection(isAccountLoaded ? 'hidden' : '')}
          {RenderKeysSection()}
        </div>
      </div>
    </div>
  );
}
