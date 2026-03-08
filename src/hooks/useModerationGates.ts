import { useState } from "react";

export interface FakeBanData {
  reason: string;
  duration?: string;
  isFake: boolean;
}

export interface FakeTempBanData {
  reason: string;
  duration: string;
  expiresAt?: string;
  isFake: boolean;
}

export interface FakeWarnData {
  reason: string;
  isFake: boolean;
}

export const useModerationGates = () => {
  const [fakeBanData, setFakeBanData] = useState<FakeBanData | null>(null);
  const [fakeTempBanData, setFakeTempBanData] = useState<FakeTempBanData | null>(null);
  const [fakeWarnData, setFakeWarnData] = useState<FakeWarnData | null>(null);

  return {
    fakeBanData, setFakeBanData,
    fakeTempBanData, setFakeTempBanData,
    fakeWarnData, setFakeWarnData,
  };
};
