import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import axios from "axios";
import App from "./App";

vi.mock("axios");

describe("StudentHub App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays students returned by the API", async () => {
    axios.get.mockResolvedValue({
      data: [
        { _id: "1", name: "Rahul", course: "BCA", age: 20 },
        { _id: "2", name: "Priya", course: "BSc", age: 21 },
      ],
    });

    render(<App />);

    expect(await screen.findByText("Rahul")).toBeInTheDocument();
    expect(screen.getByText("Priya")).toBeInTheDocument();
  });

  it("shows an empty state when there are no students", async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(<App />);

    expect(
      await screen.findByText("No students found")
    ).toBeInTheDocument();
  });

  it("shows an error when the API request fails", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));

    render(<App />);

    expect(
      await screen.findByText("Unable to load students.")
    ).toBeInTheDocument();
  });
});