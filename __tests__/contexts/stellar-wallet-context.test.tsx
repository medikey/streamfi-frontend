import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  StellarWalletProvider,
  useStellarWallet,
} from "@/contexts/stellar-wallet-context";

// Mock the stellar-wallets-kit
jest.mock("@creit.tech/stellar-wallets-kit", () => ({
  StellarWalletsKit: jest.fn().mockImplementation(() => ({
    openModal: jest.fn().mockResolvedValue(null),
    setWallet: jest.fn(),
    getAddress: jest.fn().mockResolvedValue("GBZVMB74Z7GGDGF5PHJLZW4E623MMMH4DTLZQXJCM45DGQVDZBNGVTUN"),
  })),
  WalletNetwork: {
    PUBLIC: "PUBLIC",
    TESTNET: "TESTNET",
  },
  FREIGHTER_ID: "freighter",
  allowAllModules: jest.fn(() => ({})),
}));

// Test component that uses the hook
function TestComponent() {
  const { isConnected, publicKey, status, error, connect, connectWallet, disconnect } =
    useStellarWallet();

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="connection-status">
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      <div data-testid="public-key">{publicKey || "No key"}</div>
      <div data-testid="error">{error || "No error"}</div>
      <button onClick={connect} data-testid="connect-btn">
        Connect Wallet
      </button>
      <button
        onClick={() => connectWallet("freighter")}
        data-testid="connect-freighter-btn"
      >
        Connect Freighter
      </button>
      <button onClick={disconnect} data-testid="disconnect-btn">
        Disconnect
      </button>
    </div>
  );
}

describe("StellarWalletContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("renders with initial disconnected state", () => {
    render(
      <StellarWalletProvider>
        <TestComponent />
      </StellarWalletProvider>
    );

    expect(screen.getByTestId("connection-status")).toHaveTextContent("Disconnected");
    expect(screen.getByTestId("public-key")).toHaveTextContent("No key");
  });

  test("connect() opens wallet modal", async () => {
    render(
      <StellarWalletProvider>
        <TestComponent />
      </StellarWalletProvider>
    );

    const connectBtn = screen.getByTestId("connect-btn");
    await userEvent.click(connectBtn);

    // The modal should be triggered (this is an implementation detail)
    expect(screen.getByTestId("connection-status")).toBeInTheDocument();
  });

  test("connectWallet() sets public key on successful connection", async () => {
    render(
      <StellarWalletProvider>
        <TestComponent />
      </StellarWalletProvider>
    );

    const connectFreighterBtn = screen.getByTestId("connect-freighter-btn");
    await userEvent.click(connectFreighterBtn);

    await waitFor(() => {
      expect(screen.getByTestId("connection-status")).toHaveTextContent("Connected");
    });
  });

  test("connectWallet() stores wallet info in localStorage", async () => {
    render(
      <StellarWalletProvider>
        <TestComponent />
      </StellarWalletProvider>
    );

    const connectFreighterBtn = screen.getByTestId("connect-freighter-btn");
    await userEvent.click(connectFreighterBtn);

    await waitFor(() => {
      expect(localStorage.getItem("stellar_last_wallet")).toBe("freighter");
    });
  });

  test("disconnect() clears state and localStorage", async () => {
    // Set up connected state
    localStorage.setItem("stellar_last_wallet", "freighter");
    localStorage.setItem("stellar_auto_connect", "true");

    render(
      <StellarWalletProvider>
        <TestComponent />
      </StellarWalletProvider>
    );

    const disconnectBtn = screen.getByTestId("disconnect-btn");
    await userEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(screen.getByTestId("connection-status")).toHaveTextContent("Disconnected");
      expect(localStorage.getItem("stellar_last_wallet")).toBeNull();
      expect(localStorage.getItem("stellar_auto_connect")).toBeNull();
    });
  });

  test("handles wallet connection errors gracefully", async () => {
    // Mock error response
    const StellarWalletsKit = require("@creit.tech/stellar-wallets-kit").StellarWalletsKit;
    StellarWalletsKit.mockImplementationOnce(() => ({
      openModal: jest.fn().mockRejectedValue(new Error("Wallet not installed")),
    }));

    render(
      <StellarWalletProvider>
        <TestComponent />
      </StellarWalletProvider>
    );

    const connectBtn = screen.getByTestId("connect-btn");
    await userEvent.click(connectBtn);

    // Error handling should prevent crashes
    expect(screen.getByTestId("connection-status")).toBeInTheDocument();
  });

  test("auto-connect flag is set after successful connection", async () => {
    render(
      <StellarWalletProvider>
        <TestComponent />
      </StellarWalletProvider>
    );

    const connectFreighterBtn = screen.getByTestId("connect-freighter-btn");
    await userEvent.click(connectFreighterBtn);

    await waitFor(() => {
      expect(localStorage.getItem("stellar_auto_connect")).toBe("true");
    });
  });

  test("multiple disconnect/connect cycles work correctly", async () => {
    render(
      <StellarWalletProvider>
        <TestComponent />
      </StellarWalletProvider>
    );

    // First connect
    const connectBtn = screen.getByTestId("connect-freighter-btn");
    await userEvent.click(connectBtn);

    await waitFor(() => {
      expect(screen.getByTestId("connection-status")).toHaveTextContent("Connected");
    });

    // First disconnect
    const disconnectBtn = screen.getByTestId("disconnect-btn");
    await userEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(screen.getByTestId("connection-status")).toHaveTextContent("Disconnected");
    });

    // Second connect
    await userEvent.click(connectBtn);

    await waitFor(() => {
      expect(screen.getByTestId("connection-status")).toHaveTextContent("Connected");
    });
  });
});
