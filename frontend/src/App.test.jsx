
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import axios from "axios";
import App from "./App";

vi.mock("axios");

describe("StudentHub App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays students returned by the API", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        { _id: "1", name: "Rahul", course: "BCA", age: 20 },
        { _id: "2", name: "Priya", course: "BSc", age: 21 }
      ]
    });

    render(<App />);

    expect(await screen.findByText("Rahul")).toBeInTheDocument();
    expect(screen.getByText("Priya")).toBeInTheDocument();
    expect(screen.getByText("Total Students").parentElement)
      .toHaveTextContent("2");
  });

  it("shows an empty state when there are no students", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });

    render(<App />);

    expect(
      await screen.findByText("No students found")
    ).toBeInTheDocument();
  });

  it("shows an error when the API request fails", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("Network error"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load students."))
        .toBeInTheDocument();
    });
  });
});
