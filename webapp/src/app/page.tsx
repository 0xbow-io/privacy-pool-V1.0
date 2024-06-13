'use client';

import React, { useState } from 'react';
import {WelcomeSection} from '@sections/welcome';


export default function Home() {
  return (
    <div className="h-screen w-screen bg-page-background">
      <div className="flex flex-col"> 
        <div className="grid grid-cols-4 m-4 gap-4 justify-items-center">
          <div className="relative col-span-2 col-start-2"> 
            <WelcomeSection />
          </div>
        </div>
      </div>
    </div>
  );
}
